import { NextApiRequest, NextApiResponse } from 'next';
import { JiraSyncManager } from '@/lib/jira-sync';
import { supabaseAdmin } from '@/lib/supabase';

// 증분 동기화 API - 마지막 동기화 이후 변경된 티켓만 처리
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 보안을 위한 API 키 확인
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting incremental Jira sync...');
    
    const syncManager = new JiraSyncManager();
    
    // 마지막 증분 동기화 시간 조회
    const { data: lastSyncSetting } = await supabaseAdmin
      .from('sync_settings')
      .select('setting_value')
      .eq('setting_key', 'last_incremental_sync')
      .single();

    const lastSyncTime = lastSyncSetting?.setting_value || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 기본값: 24시간 전
    
    console.log(`📅 Last incremental sync: ${lastSyncTime}`);

    // 증분 동기화 실행
    const result = await performIncrementalSync(syncManager, lastSyncTime);

    if (result.success) {
      console.log('✅ Incremental sync completed successfully');
      
      // 마지막 동기화 시간 업데이트
      await syncManager.updateLastSyncTime('incremental');
      
      return res.status(200).json({
        message: 'Incremental sync completed successfully',
        ...result,
        lastSyncTime,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ Incremental sync completed with errors');
      
      return res.status(207).json({ // 207 Multi-Status
        message: 'Incremental sync completed with some errors',
        ...result,
        lastSyncTime,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Incremental sync failed:', error);
    
    return res.status(500).json({
      message: 'Incremental sync failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// 증분 동기화 로직
async function performIncrementalSync(syncManager: JiraSyncManager, lastSyncTime: string) {
  const startTime = Date.now();
  let syncLogId: string;

  try {
    // 동기화 시작 로그
    const { data: syncLog } = await supabaseAdmin
      .from('sync_log')
      .insert({
        sync_type: 'incremental',
        sync_source: 'api',
        started_at: new Date().toISOString(),
        date_from: lastSyncTime,
        date_to: new Date().toISOString(),
        status: 'running'
      })
      .select('id')
      .single();

    syncLogId = syncLog.id;
    console.log(`🔄 Incremental sync started: ${syncLogId}`);

    // 마지막 동기화 이후 업데이트된 티켓 조회
    const updatedTickets = await fetchUpdatedTickets(lastSyncTime);
    console.log(`📦 Found ${updatedTickets.length} updated tickets`);

    let processed = 0;
    let created = 0;
    let updated = 0;
    let failed = 0;

    // 배치 처리
    const batchSize = 50; // 증분은 더 작은 배치 사용
    for (let i = 0; i < updatedTickets.length; i += batchSize) {
      const batch = updatedTickets.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${i / batchSize + 1}: ${batch.length} tickets`);

      for (const ticket of batch) {
        try {
          const result = await processIncrementalTicket(ticket);
          processed++;
          
          if (result.isNew) {
            created++;
          } else {
            updated++;
          }

          // 변경 이력 감지 및 저장
          if (result.hasChanges) {
            await recordTicketChanges(result.ticketId, ticket.key, result.changes);
          }

        } catch (error) {
          console.error(`❌ Failed to process ticket ${ticket.key}:`, error);
          failed++;
        }
      }

      // 중간 로그 업데이트
      await supabaseAdmin
        .from('sync_log')
        .update({
          tickets_processed: processed,
          tickets_created: created,
          tickets_updated: updated,
          tickets_failed: failed
        })
        .eq('id', syncLogId);

      // API 제한 방지
      if (i > 0 && i % (batchSize * 3) === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const success = failed < processed * 0.1; // 실패율 10% 미만이면 성공

    // 동기화 완료 로그 업데이트
    await supabaseAdmin
      .from('sync_log')
      .update({
        completed_at: new Date().toISOString(),
        status: success ? 'completed' : 'partial',
        duration_seconds: duration,
        tickets_processed: processed,
        tickets_created: created,
        tickets_updated: updated,
        tickets_failed: failed
      })
      .eq('id', syncLogId);

    return {
      success,
      syncId: syncLogId,
      processed,
      created,
      updated,
      failed,
      duration
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Incremental sync failed:', errorMessage);

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

// 마지막 동기화 이후 업데이트된 티켓 조회
async function fetchUpdatedTickets(lastSyncTime: string): Promise<any[]> {
  const jiraDomain = process.env.NEXT_PUBLIC_JIRA_DOMAIN!;
  const jiraEmail = process.env.JIRA_EMAIL!;
  const jiraToken = process.env.JIRA_API_TOKEN!;
  const authHeader = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');

  const baseUrl = `https://${jiraDomain}`;
  const searchUrl = `${baseUrl}/rest/api/2/search`;

  // 마지막 동기화 이후 업데이트된 보안이벤트만 조회
  const lastSyncJira = new Date(lastSyncTime).toISOString().replace('T', ' ').substring(0, 16);
  const jqlQuery = `issuetype = "보안이벤트" AND updated >= "${lastSyncJira}" ORDER BY updated DESC`;

  console.log(`🔍 Incremental JQL Query: ${jqlQuery}`);

  const allTickets = [];
  let startAt = 0;
  const maxResults = 100;

  try {
    while (true) {
      const params = new URLSearchParams({
        jql: jqlQuery,
        startAt: startAt.toString(),
        maxResults: maxResults.toString(),
        fields: 'key,id,updated,created,summary,status,priority,project,assignee,reporter,customfield_*',
        expand: 'changelog'
      });

      const response = await fetch(`${searchUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const tickets = result.issues || [];
      
      if (tickets.length === 0) break;
      
      allTickets.push(...tickets);
      startAt += maxResults;

      // 최대 1000개까지만 처리 (안전장치)
      if (allTickets.length >= 1000) {
        console.log('⚠️ Reached maximum limit of 1000 tickets for incremental sync');
        break;
      }
    }

    return allTickets;

  } catch (error) {
    console.error('❌ Failed to fetch updated tickets:', error);
    throw error;
  }
}

// 개별 티켓 증분 처리
async function processIncrementalTicket(jiraTicket: any): Promise<{
  isNew: boolean;
  ticketId: string;
  hasChanges: boolean;
  changes: Array<{field: string; oldValue: any; newValue: any}>;
}> {
  const fields = jiraTicket.fields || {};
  
  // 기존 티켓 조회
  const { data: existingTicket } = await supabaseAdmin
    .from('jira_tickets')
    .select('*')
    .eq('jira_key', jiraTicket.key)
    .single();

  const newData = {
    jira_key: jiraTicket.key,
    jira_id: jiraTicket.id,
    summary: fields.summary || '',
    status: fields.status?.name || '',
    priority: fields.priority?.name || '',
    updated_at: fields.updated || new Date().toISOString(),
    assignee_name: fields.assignee?.displayName || null,
    // 기타 필요한 필드들...
    last_synced_at: new Date().toISOString(),
    sync_version: (existingTicket?.sync_version || 0) + 1
  };

  let isNew = false;
  let hasChanges = false;
  let changes: Array<{field: string; oldValue: any; newValue: any}> = [];
  let ticketId: string;

  if (existingTicket) {
    // 변경 감지
    const fieldsToCheck = ['summary', 'status', 'priority', 'assignee_name'];
    for (const field of fieldsToCheck) {
      if (existingTicket[field] !== newData[field as keyof typeof newData]) {
        changes.push({
          field,
          oldValue: existingTicket[field],
          newValue: newData[field as keyof typeof newData]
        });
        hasChanges = true;
      }
    }

    // 업데이트
    const { data: updatedTicket } = await supabaseAdmin
      .from('jira_tickets')
      .update(newData)
      .eq('jira_key', jiraTicket.key)
      .select('id')
      .single();
    
    ticketId = updatedTicket.id;
  } else {
    // 신규 생성
    const { data: newTicket } = await supabaseAdmin
      .from('jira_tickets')
      .insert({
        ...newData,
        project_key: fields.project?.key || '',
        created_at: fields.created || new Date().toISOString(),
        sync_version: 1
      })
      .select('id')
      .single();
    
    ticketId = newTicket.id;
    isNew = true;
    hasChanges = true;
  }

  return { isNew, ticketId, hasChanges, changes };
}

// 티켓 변경 이력 기록
async function recordTicketChanges(
  ticketId: string, 
  jiraKey: string, 
  changes: Array<{field: string; oldValue: any; newValue: any}>
) {
  if (changes.length === 0) return;

  const historyEntries = changes.map(change => ({
    ticket_id: ticketId,
    jira_key: jiraKey,
    field_name: change.field,
    old_value: change.oldValue?.toString() || null,
    new_value: change.newValue?.toString() || null,
    changed_by_name: 'System (Incremental Sync)',
    changed_at: new Date().toISOString(),
    change_source: 'incremental_sync'
  }));

  await supabaseAdmin
    .from('jira_ticket_history')
    .insert(historyEntries);

  console.log(`📝 Recorded ${changes.length} changes for ${jiraKey}`);
}