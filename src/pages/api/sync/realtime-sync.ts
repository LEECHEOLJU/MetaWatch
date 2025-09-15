import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

// 실시간 미해결 티켓 동기화 API - 30초마다 실행
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 개발용 또는 수동 실행시 인증 우회
  const authHeader = req.headers.authorization;
  const isManualExecution = req.query.manual === 'true';
  
  if (!isManualExecution && authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('⚡ Starting realtime sync for unresolved tickets...');
    
    const result = await performRealtimeSync();
    
    return res.status(200).json({
      message: 'Realtime sync completed',
      ...result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Realtime sync failed:', error);
    
    return res.status(500).json({
      message: 'Realtime sync failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// 실시간 동기화 로직
async function performRealtimeSync() {
  const startTime = Date.now();
  let syncLogId: string;

  try {
    // 동기화 시작 로그
    const { data: syncLog } = await supabaseAdmin
      .from('sync_log')
      .insert({
        sync_type: 'realtime',
        sync_source: 'cron',
        started_at: new Date().toISOString(),
        status: 'running'
      })
      .select('id')
      .single();

    syncLogId = syncLog.id;

    // 해결된 상태 목록
    const resolvedStatuses = [
      "협의된 차단 완료", 
      "승인 대기", 
      "오탐 확인 완료", 
      "기 차단 완료",
      "정탐(승인필요 대상)", 
      "정탐(선 조치 대상)",   // 🆕 수정된 정확한 상태명
      "차단 미승인 완료",
      "승인 후 차단 완료",
      "처리 완료",
      "완료",
      "해결됨"
    ];

    // 1. Jira에서 미해결 티켓만 조회 (최근 24시간)
    const unresolvedTickets = await fetchUnresolvedTicketsFromJira();
    console.log(`📦 Found ${unresolvedTickets.length} unresolved tickets in Jira`);

    // 2. DB에서 미해결로 기록된 티켓들 조회
    const { data: dbUnresolvedTickets } = await supabaseAdmin
      .from('jira_tickets')
      .select('jira_key, status, updated_at')
      .not('status', 'in', `(${resolvedStatuses.map(s => `"${s}"`).join(',')})`);

    const dbUnresolvedKeys = new Set(dbUnresolvedTickets?.map(t => t.jira_key) || []);
    const jiraUnresolvedKeys = new Set(unresolvedTickets.map(t => t.key));

    console.log(`🔍 DB unresolved: ${dbUnresolvedKeys.size}, Jira unresolved: ${jiraUnresolvedKeys.size}`);

    let processed = 0;
    let updated = 0;
    let resolved = 0; // DB에서 해결됨으로 변경된 수

    // 3. Jira에서 해결되었지만 DB에서 미해결인 티켓들 찾기 (해결됨으로 업데이트)
    for (const dbTicket of dbUnresolvedTickets || []) {
      if (!jiraUnresolvedKeys.has(dbTicket.jira_key)) {
        // Jira에서는 해결되었는데 DB에서는 미해결 -> 상태 동기화 필요
        const jiraTicket = await fetchSpecificTicket(dbTicket.jira_key);
        if (jiraTicket) {
          await updateTicketStatus(jiraTicket);
          resolved++;
        }
        processed++;
      }
    }

    // 4. Jira의 미해결 티켓들을 DB에 반영 (신규 또는 상태 변경)
    for (const jiraTicket of unresolvedTickets) {
      try {
        const dbTicket = dbUnresolvedTickets?.find(t => t.jira_key === jiraTicket.key);
        
        if (!dbTicket) {
          // DB에 없는 신규 미해결 티켓
          await createNewTicket(jiraTicket);
        } else {
          // 상태나 기타 필드 변경 체크
          await updateTicketIfChanged(jiraTicket, dbTicket);
        }
        
        processed++;
        updated++;

      } catch (error) {
        console.error(`❌ Failed to process ticket ${jiraTicket.key}:`, error);
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // 동기화 완료 로그 업데이트
    await supabaseAdmin
      .from('sync_log')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        duration_seconds: duration,
        tickets_processed: processed,
        tickets_updated: updated,
        tickets_created: 0 // realtime은 주로 업데이트
      })
      .eq('id', syncLogId);

    console.log(`✅ Realtime sync completed: ${processed} processed, ${updated} updated, ${resolved} resolved`);

    return {
      success: true,
      syncId: syncLogId,
      processed,
      updated,
      resolved,
      duration,
      jiraUnresolvedCount: unresolvedTickets.length,
      dbUnresolvedCount: dbUnresolvedKeys.size
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Realtime sync failed:', errorMessage);

    // 실패 로그 업데이트
    if (syncLogId!) {
      await supabaseAdmin
        .from('sync_log')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          error_message: errorMessage
        })
        .eq('id', syncLogId);
    }

    throw error;
  }
}

// Jira에서 미해결 티켓만 조회 (빠른 조회) - 재시도 로직 포함
async function fetchUnresolvedTicketsFromJira(): Promise<any[]> {
  const jiraDomain = process.env.NEXT_PUBLIC_JIRA_DOMAIN!;
  const jiraEmail = process.env.JIRA_EMAIL!;
  const jiraToken = process.env.JIRA_API_TOKEN!;
  const authHeader = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

  // 재시도 로직
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2초

  const baseUrl = `https://${jiraDomain}`;
  const searchUrl = `${baseUrl}/rest/api/3/search/jql`;

  // 🎯 워크플로우 기반: "미해결" 상태만 실시간 동기화 대상
  // 완료된 상태들 (더 이상 동기화하지 않음)
  const completedStatuses = [
    "기 차단 완료",
    "협의된 차단 완료", 
    "승인 대기", 
    "승인 후 차단 완료",
    "차단 미승인 완료",
    "오탐 확인 완료"
  ];

  // 지원 고객사 프로젝트만 (TEST1 제외)
  const supportedProjects = ["GOODRICH", "FINDA", "SAMKOO", "WCVS", "GLN", "KURLY", "ISU"];
  const projectFilter = `project IN (${supportedProjects.map(p => `"${p}"`).join(',')})`;
  const statusFilter = completedStatuses.map(s => `status != "${s}"`).join(' AND ');
  const jqlQuery = `issuetype = "보안이벤트" AND ${projectFilter} AND ${statusFilter} AND created >= -24h ORDER BY updated DESC`;

  console.log(`🔍 Realtime JQL Query: ${jqlQuery}`);

  // 재시도 로직으로 API 호출
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const params = new URLSearchParams({
        jql: jqlQuery,
        startAt: '0',
        maxResults: '500', // 실시간은 최대 500개만
        fields: 'key,id,updated,created,summary,status,priority,assignee,project', // 필수 필드만
      });

      const response = await fetch(`${searchUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
        },
        // 재시도시 타임아웃 점진적 증가
        signal: AbortSignal.timeout(5000 + (attempt * 2000))
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Jira API 호출 성공 (시도 ${attempt}/${MAX_RETRIES})`);
      return result.issues || [];

    } catch (error) {
      console.error(`❌ Jira API 호출 실패 (시도 ${attempt}/${MAX_RETRIES}):`, error);
      
      if (attempt === MAX_RETRIES) {
        console.error('🚨 모든 재시도 실패 - 빈 배열 반환');
        // 동기화 실패 로그 저장
        await logSyncFailure('jira_api_failure', error);
        return [];
      }
      
      // 재시도 전 대기
      console.log(`⏳ ${RETRY_DELAY}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  return [];
}

// 특정 티켓 상세 조회
async function fetchSpecificTicket(jiraKey: string): Promise<any | null> {
  const jiraDomain = process.env.NEXT_PUBLIC_JIRA_DOMAIN!;
  const jiraEmail = process.env.JIRA_EMAIL!;
  const jiraToken = process.env.JIRA_API_TOKEN!;
  const authHeader = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

  const baseUrl = `https://${jiraDomain}`;
  const ticketUrl = `${baseUrl}/rest/api/2/issue/${jiraKey}`;

  try {
    const response = await fetch(ticketUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5초 타임아웃
    });

    if (!response.ok) {
      console.warn(`⚠️ Could not fetch ticket ${jiraKey}: ${response.status}`);
      return null;
    }

    return await response.json();

  } catch (error) {
    console.warn(`⚠️ Failed to fetch specific ticket ${jiraKey}:`, error);
    return null;
  }
}

// 티켓 상태 업데이트 (해결됨으로 변경)
async function updateTicketStatus(jiraTicket: any) {
  const fields = jiraTicket.fields;
  
  await supabaseAdmin
    .from('jira_tickets')
    .update({
      status: fields.status?.name || 'Unknown',
      updated_at: fields.updated,
      assignee_name: fields.assignee?.displayName || null,
      resolved_at: fields.resolutiondate || null,
      resolution: fields.resolution?.name || null,
      last_synced_at: new Date().toISOString(),
      sync_version: 1
    })
    .eq('jira_key', jiraTicket.key);

  console.log(`✅ Updated ticket status: ${jiraTicket.key} -> ${fields.status?.name}`);
}

// 새로운 미해결 티켓 생성
async function createNewTicket(jiraTicket: any) {
  const fields = jiraTicket.fields;
  
  const ticketData = {
    jira_key: jiraTicket.key,
    jira_id: jiraTicket.id,
    project_key: fields.project?.key || '',
    project_name: fields.project?.name || '',
    summary: fields.summary || '',
    status: fields.status?.name || '',
    priority: fields.priority?.name || '',
    assignee_name: fields.assignee?.displayName || null,
    created_at: fields.created,
    updated_at: fields.updated,
    customer_code: fields.project?.key || '',
    last_synced_at: new Date().toISOString(),
    sync_version: 1
  };

  await supabaseAdmin
    .from('jira_tickets')
    .insert(ticketData);

  console.log(`✅ Created new ticket: ${jiraTicket.key}`);
}

// 동기화 실패 로그 저장
async function logSyncFailure(failureType: string, error: any) {
  try {
    await supabaseAdmin
      .from('sync_log')
      .insert({
        sync_type: 'realtime',
        sync_source: 'cron',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_message: `${failureType}: ${error instanceof Error ? error.message : String(error)}`,
        duration_seconds: 0,
        tickets_processed: 0,
        tickets_updated: 0,
        tickets_created: 0
      });
    console.log(`📝 동기화 실패 로그 저장: ${failureType}`);
  } catch (logError) {
    console.error('❌ 실패 로그 저장 실패:', logError);
  }
}

// 티켓 변경사항 체크 및 업데이트
async function updateTicketIfChanged(jiraTicket: any, dbTicket: any) {
  const fields = jiraTicket.fields;
  const jiraUpdated = new Date(fields.updated);
  const dbUpdated = new Date(dbTicket.updated_at);

  // Jira가 더 최신이면 업데이트
  if (jiraUpdated > dbUpdated) {
    await supabaseAdmin
      .from('jira_tickets')
      .update({
        status: fields.status?.name || dbTicket.status,
        updated_at: fields.updated,
        assignee_name: fields.assignee?.displayName || null,
        last_synced_at: new Date().toISOString(),
        sync_version: 1
      })
      .eq('jira_key', jiraTicket.key);

    console.log(`🔄 Updated ticket: ${jiraTicket.key} (${fields.status?.name})`);
  }
}