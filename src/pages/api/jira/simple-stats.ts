import { NextApiRequest, NextApiResponse } from 'next';
import { jiraClient } from '@/lib/jira-client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 간단한 통계 - 최근 보안이벤트 조회
    const response = await jiraClient.searchIssues(
      'project IN ("GOODRICH", "KURLY") AND issuetype="보안이벤트"',
      0,
      5  // 적은 수로 테스트
    );

    // 실제 응답 구조 확인
    console.log('=== JIRA API 응답 구조 확인 ===');
    if (response.issues && response.issues.length > 0) {
      const sampleIssue = response.issues[0];
      console.log('Sample issue structure:', JSON.stringify(sampleIssue, null, 2));
      console.log('Issue keys:', Object.keys(sampleIssue));
      if (sampleIssue.fields) {
        console.log('Fields keys:', Object.keys(sampleIssue.fields));
      }
    }

    // 안전한 데이터 추출
    const tickets = response.issues.map(issue => {
      const fields = (issue as any).fields || {};
      return {
        id: issue.id,
        key: issue.key,
        summary: fields.summary || 'No Summary',
        status: fields.status?.name || 'Unknown Status',
        priority: fields.priority?.name || 'No Priority',
        customer: fields.project?.key || issue.project?.key || 'Unknown Project',
        created: fields.created || issue.created,
        updated: fields.updated || issue.updated,
        rawFields: Object.keys(fields), // 디버깅용
      };
    });

    // 상태별 집계
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 고객사별 집계
    const customerCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.customer] = (acc[ticket.customer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      total: response.total,
      tickets: tickets.slice(0, 5), // 최근 5개만
      statusCounts,
      customerCounts,
      availableStatuses: Object.keys(statusCounts),
      availablePriorities: [...new Set(tickets.map(t => t.priority))],
      lastUpdated: new Date().toISOString(),
      debugInfo: {
        sampleIssueKeys: response.issues.length > 0 ? Object.keys(response.issues[0]) : [],
        sampleFieldKeys: response.issues.length > 0 ? Object.keys((response.issues[0] as any).fields || {}) : [],
      }
    });
    
  } catch (error) {
    console.error('Error fetching simple stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch simple stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}