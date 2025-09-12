import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const maxResults = parseInt(req.query.maxResults as string) || 100;
    
    // 해결된 상태 목록 (더 포괄적으로 업데이트)
    const resolvedStatuses = [
      "협의된 차단 완료", 
      "승인 대기", 
      "오탐 확인 완료", 
      "기 차단 완료",
      "정탐(승인필요 대상)", 
      "차단 미승인 완료",
      "승인 후 차단 완료",  // 추가
      "처리 완료",          // 추가
      "완료",              // 추가
      "해결됨"             // 추가
    ];

    // 지원하는 고객사 프로젝트 목록 (TEST1 프로젝트 제외)
    const supportedProjects = [
      "GOODRICH", "FINDA", "SAMKOO", "WCVS", "GLN", "KURLY", "ISU"
    ];

    // 미해결 티켓들을 DB에서 조회 (지원 고객사만 & 해결되지 않은 상태만)
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
        created_at,
        updated_at,
        assignee_name,
        project_key,
        project_name
      `)
      .not('status', 'in', `(${resolvedStatuses.map(s => `"${s}"`).join(',')})`)
      .in('project_key', supportedProjects)  // 지원 고객사 필터 추가
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

    // 응답 형식 변환 (기존 API와 호환)
    const events = tickets?.map(ticket => ({
      id: ticket.jira_id,
      key: ticket.jira_key,
      summary: ticket.summary,
      status: ticket.status,
      priority: ticket.priority || 'Medium',
      customer: ticket.customer_code,
      customerName: ticket.customer || ticket.project_name,
      created: ticket.created_at,
      assignee: ticket.assignee_name || 'Unassigned',
      age: Math.floor((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60)) // 시간 단위
    })) || [];

    // 통계 계산
    const statusCounts: Record<string, number> = {};
    const customerCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};

    events.forEach(event => {
      statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
      customerCounts[event.customerName] = (customerCounts[event.customerName] || 0) + 1;
      priorityCounts[event.priority] = (priorityCounts[event.priority] || 0) + 1;
    });

    const stats = {
      total: events.length,
      byStatus: statusCounts,
      byCustomer: customerCounts,
      byPriority: priorityCounts,
      urgentCount: events.filter(e => e.priority === 'High').length,
      recentCount: events.filter(e => e.age < 24).length // 24시간 이내
    };

    res.status(200).json({
      events,
      stats,
      query: {
        maxResults,
        resolvedStatusesExcluded: resolvedStatuses
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