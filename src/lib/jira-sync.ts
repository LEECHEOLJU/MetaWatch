import { supabaseAdmin } from '@/lib/supabase';
import { ALL_JIRA_FIELDS, JIRA_CUSTOM_FIELDS } from '@/config/jira-fields';

// Jira 동기화 유틸리티 라이브러리

export interface JiraSyncConfig {
  batchSize?: number;
  maxResults?: number;
  daysLookback?: number;
  projects?: string[];
}

export interface SyncResult {
  success: boolean;
  syncId: string;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  duration: number;
  error?: string;
}

export class JiraSyncManager {
  private jiraDomain: string;
  private jiraEmail: string;
  private jiraToken: string;
  private authHeader: string;

  constructor() {
    this.jiraDomain = process.env.NEXT_PUBLIC_JIRA_DOMAIN!;
    this.jiraEmail = process.env.JIRA_EMAIL!;
    this.jiraToken = process.env.JIRA_API_TOKEN!;
    
    if (!this.jiraDomain || !this.jiraEmail || !this.jiraToken) {
      throw new Error('Missing Jira environment variables');
    }
    
    this.authHeader = Buffer.from(`${this.jiraEmail}:${this.jiraToken}`).toString('base64');
  }

  // 전체 동기화 실행
  async performFullSync(config: JiraSyncConfig = {}): Promise<SyncResult> {
    const startTime = Date.now();
    let syncLogId: string;

    try {
      // 동기화 시작 로그
      const { data: syncLog } = await supabaseAdmin
        .from('sync_log')
        .insert({
          sync_type: 'full',
          sync_source: 'api',
          started_at: new Date().toISOString(),
          status: 'running'
        })
        .select('id')
        .single();

      syncLogId = syncLog.id;

      console.log(`🔄 Full sync started: ${syncLogId}`);

      const result = await this.syncAllTickets(syncLogId, config);

      // 동기화 완료 로그 업데이트
      await supabaseAdmin
        .from('sync_log')
        .update({
          completed_at: new Date().toISOString(),
          status: result.success ? 'completed' : 'failed',
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          tickets_processed: result.processed,
          tickets_created: result.created,
          tickets_updated: result.updated,
          tickets_failed: result.failed,
          error_message: result.error
        })
        .eq('id', syncLogId);

      console.log(`✅ Full sync completed: ${result.processed} tickets processed`);
      
      return {
        ...result,
        syncId: syncLogId,
        duration: Math.round((Date.now() - startTime) / 1000)
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Full sync failed:', errorMessage);

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

      return {
        success: false,
        syncId: syncLogId || '',
        processed: 0,
        created: 0,
        updated: 0,
        failed: 1,
        duration: Math.round((Date.now() - startTime) / 1000),
        error: errorMessage
      };
    }
  }

  // 모든 보안 이벤트 티켓 동기화
  private async syncAllTickets(syncLogId: string, config: JiraSyncConfig): Promise<Omit<SyncResult, 'syncId' | 'duration'>> {
    const batchSize = config.batchSize || 100;
    const maxResults = config.maxResults || 10000;
    const daysLookback = config.daysLookback || 90;

    // JQL 쿼리 구성
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysLookback);
    
    const startDateStr = startDate.toISOString().replace('T', ' ').substring(0, 16);
    const endDateStr = endDate.toISOString().replace('T', ' ').substring(0, 16);
    
    let jqlQuery = `issuetype = "보안이벤트" AND created >= "${startDateStr}" AND created <= "${endDateStr}" ORDER BY created DESC`;
    
    console.log(`🔍 JQL Query: ${jqlQuery}`);

    let processed = 0;
    let created = 0;
    let updated = 0;
    let failed = 0;
    let startAt = 0;

    while (startAt < maxResults) {
      try {
        console.log(`📦 Processing batch: ${startAt} - ${startAt + batchSize}`);

        // Jira API 호출
        const tickets = await this.fetchJiraTickets(jqlQuery, startAt, batchSize);
        
        if (!tickets || tickets.length === 0) {
          console.log('✅ No more tickets to process');
          break;
        }

        // 배치 처리
        const batchResult = await this.processBatch(tickets);
        processed += batchResult.processed;
        created += batchResult.created;
        updated += batchResult.updated;
        failed += batchResult.failed;

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

        startAt += batchSize;

        // API 제한 방지를 위한 딜레이
        if (startAt % (batchSize * 5) === 0) {
          console.log(`⏳ Brief pause to prevent API rate limiting...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ Batch processing failed at ${startAt}:`, error);
        failed += batchSize; // 전체 배치 실패로 간주
        startAt += batchSize; // 다음 배치 계속 진행
      }
    }

    return {
      success: failed < processed * 0.1, // 실패율 10% 미만이면 성공
      processed,
      created,
      updated,
      failed
    };
  }

  // Jira API에서 티켓 데이터 가져오기
  private async fetchJiraTickets(jql: string, startAt: number, maxResults: number): Promise<any[]> {
    const baseUrl = `https://${this.jiraDomain}`;
    const searchUrl = `${baseUrl}/rest/api/2/search`;
    
    const params = new URLSearchParams({
      jql,
      startAt: startAt.toString(),
      maxResults: maxResults.toString(),
      fields: ALL_JIRA_FIELDS.join(','),
      expand: 'changelog' // 변경 이력도 함께 조회
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
    
    try {
      const response = await fetch(`${searchUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.authHeader}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.issues || [];

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // 티켓 배치 처리
  private async processBatch(jiraTickets: any[]): Promise<{processed: number; created: number; updated: number; failed: number}> {
    let processed = 0;
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const jiraTicket of jiraTickets) {
      try {
        const result = await this.processTicket(jiraTicket);
        processed++;
        
        if (result.isNew) {
          created++;
        } else {
          updated++;
        }

      } catch (error) {
        console.error(`❌ Failed to process ticket ${jiraTicket.key}:`, error);
        failed++;
      }
    }

    return { processed, created, updated, failed };
  }

  // 개별 티켓 처리
  private async processTicket(jiraTicket: any): Promise<{isNew: boolean; ticketId: string}> {
    const fields = jiraTicket.fields || {};
    const changelog = jiraTicket.changelog;

    // 커스텀 필드 추출
    const customFields: Record<string, any> = {};
    Object.entries(JIRA_CUSTOM_FIELDS).forEach(([key, fieldInfo]) => {
      const fieldValue = fields[fieldInfo.fieldId];
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        customFields[key] = fieldValue;
      }
    });

    // DB 저장용 데이터 구성
    const ticketData = {
      jira_key: jiraTicket.key,
      jira_id: jiraTicket.id,
      project_key: fields.project?.key || '',
      project_name: fields.project?.name || '',
      
      // 기본 필드
      summary: fields.summary || '',
      description: fields.description || '',
      issue_type: fields.issuetype?.name || '',
      status: fields.status?.name || '',
      priority: fields.priority?.name || '',
      resolution: fields.resolution?.name || null,
      
      // 담당자 정보
      assignee_name: fields.assignee?.displayName || null,
      assignee_email: fields.assignee?.emailAddress || null,
      reporter_name: fields.reporter?.displayName || null,
      reporter_email: fields.reporter?.emailAddress || null,
      
      // 시간 정보
      created_at: fields.created || new Date().toISOString(),
      updated_at: fields.updated || fields.created || new Date().toISOString(),
      resolved_at: fields.resolutiondate || null,
      due_date: fields.duedate || null,
      
      // 보안 관련 커스텀 필드들
      customer: customFields.customer || '',
      customer_code: fields.project?.key || '',
      country: customFields.country || 'Unknown',
      severity: customFields.severity || 'Unknown',
      detection_time: this.safeParseDate(customFields.detectionTime),
      detection_device: customFields.detectionDevice || '',
      detection_device_id: customFields.detectionDeviceId || '',
      source_ip: customFields.sourceIp || null,
      destination_ip: customFields.destinationIp || '',
      attack_type: customFields.attackType || '',
      attack_category: customFields.attackCategory || '',
      scenario_name: customFields.scenarioName || '',
      action_taken: customFields.action || '',
      threat_matched: customFields.threatMatched || 'N',
      impact_analysis: customFields.impactAnalysis || '',
      threat_intelligence: customFields.threatIntelligence || '',
      event_count: parseInt(customFields.count || '1'),
      
      // 메타데이터
      jira_last_updated: fields.updated || fields.created,
      last_synced_at: new Date().toISOString(),
      sync_version: 1
    };

    // DB에 upsert
    const { data: existingTicket } = await supabaseAdmin
      .from('jira_tickets')
      .select('id, updated_at')
      .eq('jira_key', jiraTicket.key)
      .single();

    let ticketId: string;
    let isNew = false;

    if (existingTicket) {
      // 업데이트
      const { data: updatedTicket } = await supabaseAdmin
        .from('jira_tickets')
        .update(ticketData)
        .eq('jira_key', jiraTicket.key)
        .select('id')
        .single();
        
      ticketId = updatedTicket.id;
    } else {
      // 신규 생성
      const { data: newTicket } = await supabaseAdmin
        .from('jira_tickets')
        .insert(ticketData)
        .select('id')
        .single();
        
      ticketId = newTicket.id;
      isNew = true;
    }

    // 변경 이력 처리 (옵션)
    if (changelog && changelog.histories) {
      await this.processTicketHistory(ticketId, jiraTicket.key, changelog.histories);
    }

    return { isNew, ticketId };
  }

  // 티켓 변경 이력 처리
  private async processTicketHistory(ticketId: string, jiraKey: string, histories: any[]) {
    const historyEntries = [];

    for (const history of histories) {
      for (const item of history.items || []) {
        historyEntries.push({
          ticket_id: ticketId,
          jira_key: jiraKey,
          field_name: item.field,
          field_type: item.fieldtype || 'string',
          old_value: item.fromString || null,
          new_value: item.toString || null,
          changed_by_name: history.author?.displayName || 'System',
          changed_by_email: history.author?.emailAddress || null,
          changed_at: history.created,
          change_source: 'jira'
        });
      }
    }

    if (historyEntries.length > 0) {
      // 기존 히스토리 삭제 후 새로 입력 (중복 방지)
      await supabaseAdmin
        .from('jira_ticket_history')
        .delete()
        .eq('jira_key', jiraKey);

      await supabaseAdmin
        .from('jira_ticket_history')
        .insert(historyEntries);
    }
  }

  // 동기화 상태 조회
  async getSyncStatus() {
    const { data: syncStatus } = await supabaseAdmin.rpc('get_sync_status');
    return syncStatus;
  }

  // 마지막 동기화 시간 업데이트
  async updateLastSyncTime(syncType: 'full' | 'incremental' | 'realtime') {
    const settingKey = `last_${syncType}_sync`;
    await supabaseAdmin
      .from('sync_settings')
      .upsert({
        setting_key: settingKey,
        setting_value: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  // 안전한 날짜 파싱 메서드
  private safeParseDate(dateValue: any): string | null {
    if (!dateValue) return null;
    
    try {
      const date = new Date(dateValue);
      // NaN 체크 (Invalid Date)
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Invalid date value: ${dateValue}`);
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.warn(`⚠️ Date parsing failed for value: ${dateValue}`, error);
      return null;
    }
  }
}