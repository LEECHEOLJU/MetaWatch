import { NextApiRequest, NextApiResponse } from 'next';
import { ALL_JIRA_FIELDS } from '@/config/jira-fields';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const jiraDomain = process.env.NEXT_PUBLIC_JIRA_DOMAIN;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;

    if (!jiraDomain || !jiraEmail || !jiraToken) {
      return res.status(500).json({ message: 'Missing environment variables' });
    }

    const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
    const baseUrl = `https://${jiraDomain}`;
    
    // 쿼리 파라미터
    const { maxResults = '100' } = req.query;

    // ✅ 원본 JQL 쿼리 복원: filter + resolution = Unresolved + 30일 제한
    const jqlQuery = `filter in ("10066") AND project in (굿리치, "핀다 프로젝트", "삼구아이앤씨 프로젝트", "한화시스템 위캔버스 프로젝트", GLN, 컬리) AND type = 보안이벤트 AND resolution = Unresolved AND created >= -30d ORDER BY created DESC`;
    
    console.log('🎯 Original JQL Query:', jqlQuery);

    const searchUrl = `${baseUrl}/rest/api/2/search`;
    const searchParams = new URLSearchParams({
      jql: jqlQuery,
      startAt: '0',
      maxResults: maxResults as string,
      fields: ALL_JIRA_FIELDS.join(','),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const response = await fetch(`${searchUrl}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('Jira API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Jira API Error:', errorText);
      
      return res.status(response.status).json({
        message: 'Jira search failed',
        error: errorText || response.statusText,
        jql: jqlQuery,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      });
    }

    const searchResults = await response.json();
    console.log(`✅ Found ${searchResults.total} unresolved events (Jira API)`);

    // 안전한 데이터 추출
    const unresolvedEvents = (searchResults.issues || []).map((issue: any) => {
      const fields = issue.fields || {};
      
      return {
        id: issue.id,
        key: issue.key,
        summary: fields.summary || 'No Summary',
        status: fields.status?.name || 'Unknown Status',
        priority: fields.priority?.name || 'No Priority',
        customer: fields.project?.key || 'Unknown Project',
        customerName: getCustomerName(fields.project?.key || ''),
        created: fields.created || new Date().toISOString(),
        updated: fields.updated || fields.created || new Date().toISOString(),
        assignee: fields.assignee?.displayName || 'Unassigned',
        reporter: fields.reporter?.displayName || 'Unknown Reporter',
        age: calculateAgeInHours(fields.created || new Date().toISOString()),
      };
    });

    // 통계 계산
    const stats = {
      total: searchResults.total,
      unassignedCount: unresolvedEvents.filter(e => !e.assignee || e.assignee === 'Unassigned').length,
      totalUnresolved: searchResults.total,
      byStatus: calculateByStatus(unresolvedEvents),
      byCustomer: calculateByCustomer(unresolvedEvents),
      byPriority: calculateByPriority(unresolvedEvents),
      urgentCount: unresolvedEvents.filter(e => e.priority.includes('High') || e.priority.includes('Highest')).length,
      recentCount: unresolvedEvents.filter(e => e.age < 24).length
    };

    res.status(200).json({
      events: unresolvedEvents,
      stats,
      query: {
        jql: jqlQuery,
        maxResults: parseInt(maxResults as string),
        statusFilter: 'resolution_unresolved'
      },
      lastUpdated: new Date().toISOString(),
      source: 'jira_api'
    });
    
  } catch (error) {
    console.error('Unresolved events API error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(408).json({
        message: 'Request timeout',
        error: 'The request took too long to complete.',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch unresolved events',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

function getCustomerName(projectKey: string): string {
  const customerNames: Record<string, string> = {
    'GOODRICH': '굿리치',
    'FINDA': '핀다',
    'SAMKOO': '삼구아이앤씨',
    'WCVS': '한화위캠버스',
    'GLN': 'GLN',
    'KURLY': '컬리',
    'ISU': '이수시스템',
  };
  return customerNames[projectKey] || projectKey;
}

function calculateAgeInHours(createdDate: string): number {
  const created = new Date(createdDate);
  const now = new Date();
  const diffInMs = now.getTime() - created.getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60));
}

function calculateByStatus(events: any[]): Record<string, number> {
  return events.reduce((acc, event) => {
    acc[event.status] = (acc[event.status] || 0) + 1;
    return acc;
  }, {});
}

function calculateByCustomer(events: any[]): Record<string, number> {
  return events.reduce((acc, event) => {
    acc[event.customerName] = (acc[event.customerName] || 0) + 1;
    return acc;
  }, {});
}

function calculateByPriority(events: any[]): Record<string, number> {
  return events.reduce((acc, event) => {
    acc[event.priority] = (acc[event.priority] || 0) + 1;
    return acc;
  }, {});
}