import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const maxResults = parseInt(req.query.maxResults as string) || 100;
    
    // 🔄 워크플로우 기반 로직: "미해결" 상태만 표시
    // 지원하는 고객사 프로젝트 목록 (TEST1 프로젝트 제외)
    const supportedProjects = [
      "GOODRICH", "FINDA", "SAMKOO", "WCVS", "GLN", "KURLY", "ISU"
    ];

    // 30일 이내 생성된 티켓만 (원본 JQL: created >= -30d)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 원본 JQL 기준: resolution = Unresolved (해결되지 않은 티켓)
    const { data: tickets, error } = await supabaseAdmin
      .from('jira_tickets')
      .select(`
        id,
        jira_key,
        jira_id,
        summary,
        status,
        priority,
        resolution,
        customer,
        customer_code,
        created_at,
        updated_at,
        assignee_name,
        project_key,
        project_name
      `)
      .or('resolution.is.null,resolution.neq.완료')  // 🎯 resolution = Unresolved (NULL이거나 "완료"가 아닌 경우)
      .in('project_key', supportedProjects)
      .eq('is_deleted', false)
      .gte('created_at', thirtyDaysAgo.toISOString())  // 🎯 최근 30일 내
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

    // 🎯 워크플로우 기반 통계 계산
    const statusCounts: Record<string, number> = {};
    const customerCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};

    // 담당자 미할당 vs 할당 구분 (원본 JQL: assignee = EMPTY)
    const unassignedCount = events.filter(e => !e.assignee || e.assignee === 'Unassigned' || e.assignee === null).length;
    const totalUnresolved = events.length;

    events.forEach(event => {
      statusCounts[event.status] = (statusCounts[event.status] || 0) + 1;
      customerCounts[event.customerName] = (customerCounts[event.customerName] || 0) + 1;
      priorityCounts[event.priority] = (priorityCounts[event.priority] || 0) + 1;
    });

    const stats = {
      total: totalUnresolved,
      unassignedCount,           // 🆕 담당자 미할당
      totalUnresolved,           // 🆕 미해결 전체 
      byStatus: statusCounts,
      byCustomer: customerCounts,
      byPriority: priorityCounts,
      urgentCount: events.filter(e => e.priority === 'High').length,
      recentCount: events.filter(e => e.age < 24).length
    };

    res.status(200).json({
      events,
      stats,
      query: {
        maxResults,
        statusFilter: 'resolution_unresolved',
        supportedProjects
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