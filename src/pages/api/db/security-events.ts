import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const days = parseInt(req.query.days as string) || 1;
    const maxResults = parseInt(req.query.maxResults as string) || 500;
    
    // 조회 시작 시간 계산
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    // 🎯 워크플로우 기반 완료된 상태 목록 (6개)
    const completedStatuses = [
      "기 차단 완료",
      "협의된 차단 완료", 
      "승인 대기", 
      "승인 후 차단 완료",
      "차단 미승인 완료",
      "오탐 확인 완료"
    ];

    // DB에서 보안 이벤트 조회 (날짜 범위 내)
    const { data: tickets, error } = await supabaseAdmin
      .from('jira_tickets')
      .select(`
        id,
        jira_key,
        jira_id,
        summary,
        status,
        priority,
        customer,
        customer_code,
        project_key,
        project_name,
        created_at,
        updated_at,
        resolved_at,
        assignee_name,
        severity,
        source_ip,
        destination_ip,
        attack_type,
        threat_matched
      `)
      .in('status', completedStatuses)  // 🎯 완료된 상태만
      .gte('created_at', fromDate.toISOString())
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(maxResults);

    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ 
        message: 'Database query failed',
        error: error.message 
      });
    }

    const events = tickets || [];

    // 통계 계산
    const byStatus: Record<string, number> = {};
    const byCustomer: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    let resolvedCount = 0;
    let unresolvedCount = 0;

    events.forEach(event => {
      const status = event.status || 'Unknown';
      const customer = event.customer_code || event.project_key || 'Unknown';
      const priority = event.priority || 'Medium';
      const severity = event.severity || 'Unknown';

      // 상태별 집계
      byStatus[status] = (byStatus[status] || 0) + 1;
      
      // 고객사별 집계
      byCustomer[customer] = (byCustomer[customer] || 0) + 1;
      
      // 우선순위별 집계
      byPriority[priority] = (byPriority[priority] || 0) + 1;
      
      // 심각도별 집계
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;

      // 해결/미해결 카운트
      if (completedStatuses.includes(status)) {
        resolvedCount++;
      } else {
        unresolvedCount++;
      }
    });

    // 응답 데이터 구성 (기존 API와 호환)
    const responseData = events.map(ticket => ({
      id: ticket.jira_id,
      key: ticket.jira_key,
      summary: ticket.summary,
      status: ticket.status,
      priority: ticket.priority || 'Medium',
      customer: ticket.customer_code || ticket.project_key,
      customerName: ticket.customer || ticket.project_name,
      created: ticket.created_at,
      updated: ticket.updated_at,
      resolved: ticket.resolved_at,
      assignee: ticket.assignee_name || 'Unassigned',
      
      // 추가 보안 필드들
      customFields: {
        severity: ticket.severity,
        sourceIp: ticket.source_ip,
        destinationIp: ticket.destination_ip,
        attackType: ticket.attack_type,
        threatMatched: ticket.threat_matched
      },
      
      // 직접 접근 가능한 필드들
      severity: ticket.severity,
      sourceIp: ticket.source_ip,
      destinationIp: ticket.destination_ip,
      attackType: ticket.attack_type,
      threatMatched: ticket.threat_matched
    }));

    const stats = {
      total: events.length,
      byStatus,
      byCustomer,
      byPriority,
      bySeverity,
      resolvedCount,
      unresolvedCount,
      resolvedStates: completedStatuses,
      
      // 추가 통계
      highPriorityCount: events.filter(e => e.priority === 'High').length,
      recentCount: events.filter(e => {
        const eventDate = new Date(e.created_at);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return eventDate > yesterday;
      }).length
    };

    res.status(200).json({
      events: responseData,
      stats,
      query: {
        days,
        maxResults,
        fromDate: fromDate.toISOString(),
        toDate: new Date().toISOString(),
        resolvedStates: completedStatuses
      },
      lastUpdated: new Date().toISOString(),
      source: 'database'
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}