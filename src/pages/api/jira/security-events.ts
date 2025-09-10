import { NextApiRequest, NextApiResponse } from 'next';

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
    const { 
      days = '7',
      maxResults = '1000',
      project = 'all' 
    } = req.query;

    // 정확한 시간 기반 날짜 계산 (24시간 단위)
    const endDate = new Date();
    const startDate = new Date();
    const daysNum = parseInt(days as string);
    
    // 정확히 N일 전부터 현재까지 (시간 포함)
    startDate.setTime(endDate.getTime() - (daysNum * 24 * 60 * 60 * 1000));

    // Jira 허용 형식: yyyy-MM-dd HH:mm (초 제외)
    const startDateStr = startDate.toISOString().replace('T', ' ').substring(0, 16);
    const endDateStr = endDate.toISOString().replace('T', ' ').substring(0, 16);

    // JQL 쿼리 구성 - 더 안전한 방식
    let jqlQuery = '';
    if (project === 'all') {
      // 모든 프로젝트에서 검색 (이슈타입 조건을 더 유연하게)
      jqlQuery = `created >= "${startDateStr}" AND created <= "${endDateStr}"`;
    } else {
      jqlQuery = `project = "${project}" AND created >= "${startDateStr}" AND created <= "${endDateStr}"`;
    }

    jqlQuery += ` ORDER BY created DESC`;
    
    console.log('JQL Query:', jqlQuery);
    console.log('Date range:', { startDateStr, endDateStr });
    console.log('Project filter:', project);

    const searchUrl = `${baseUrl}/rest/api/2/search`;
    const searchParams = new URLSearchParams({
      jql: jqlQuery,
      startAt: '0',
      maxResults: maxResults as string,
      fields: 'id,key,summary,status,priority,created,updated,assignee,reporter,project,issuetype',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20초 서버 타임아웃
    
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

    console.log('Search API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Search API Error:', errorText);
      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      
      // Handle specific error codes
      if (response.status === 502) {
        return res.status(502).json({
          message: 'Jira server temporarily unavailable',
          error: 'The Jira server returned a 502 Bad Gateway error',
          suggestion: 'This is usually temporary. Please wait and try again.',
          jql: jqlQuery,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(response.status).json({
        message: 'Jira search failed',
        error: errorText || response.statusText,
        jql: jqlQuery,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      });
    }

    const searchResults = await response.json();
    console.log(`Found ${searchResults.total} security events`);
    console.log(`Actually returned ${searchResults.issues?.length || 0} issues in this response`);
    console.log(`Max results requested: ${maxResults}`);

    // Jira API는 한 번에 최대 100건만 반환하므로, 더 많은 데이터가 필요하면 페이지네이션 사용
    let allIssues = searchResults.issues || [];
    const totalAvailable = searchResults.total;
    const maxResultsNum = parseInt(maxResults as string);
    
    // 100건보다 많이 요청되었고, 더 많은 데이터가 있다면 추가 페이지 가져오기
    if (maxResultsNum > 100 && totalAvailable > 100) {
      const pagesToFetch = Math.min(
        Math.ceil(maxResultsNum / 100) - 1, // 원하는 페이지 수
        Math.ceil(totalAvailable / 100) - 1 // 실제 사용 가능한 페이지 수
      );
      
      console.log(`Fetching ${pagesToFetch} additional pages...`);
      
      for (let page = 1; page <= pagesToFetch; page++) {
        const pageResponse = await fetch(`${searchUrl}?${new URLSearchParams({
          jql: jqlQuery,
          startAt: (page * 100).toString(),
          maxResults: '100',
          fields: 'id,key,summary,status,priority,created,updated,assignee,reporter,project,issuetype',
        }).toString()}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (pageResponse.ok) {
          const pageData = await pageResponse.json();
          allIssues = allIssues.concat(pageData.issues || []);
          console.log(`Page ${page}: Added ${pageData.issues?.length || 0} more issues`);
        }
        
        // 목표 수에 도달하면 중단
        if (allIssues.length >= maxResultsNum) break;
      }
      
      console.log(`Total collected: ${allIssues.length} issues`);
    }

    // 안전한 데이터 추출 (페이지네이션으로 수집된 모든 이슈 사용)
    const securityEvents = allIssues.map((issue: any) => {
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
      byStatus: calculateByStatus(securityEvents),
      byCustomer: calculateByCustomer(securityEvents),
      byPriority: calculateByPriority(securityEvents),
      urgentCount: securityEvents.filter((e: any) => 
        e.status.includes('미해결') || 
        e.priority.includes('High') || 
        e.priority.includes('Highest')
      ).length,
      recentCount: securityEvents.filter((e: any) => e.age < 24).length,
    };

    res.status(200).json({
      events: securityEvents,
      stats,
      query: {
        jql: jqlQuery,
        dateRange: { startDate: startDateStr, endDate: endDateStr },
        project: project as string,
        days: parseInt(days as string),
      },
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Security events API error:', error);
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(408).json({
        message: 'Request timeout',
        error: 'The request took too long to complete. Try reducing the date range or number of results.',
        suggestion: 'Consider using a smaller date range (1-3 days) or refresh the page.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('401')) {
      return res.status(401).json({
        message: 'Jira authentication failed',
        error: 'Please check JIRA_EMAIL and JIRA_API_TOKEN environment variables',
        details: error.message
      });
    }
    
    // Check if it's a 502 Bad Gateway error
    if (error instanceof Error && error.message.includes('502')) {
      return res.status(502).json({
        message: 'Jira server temporarily unavailable',
        error: 'The Jira server returned a 502 error. This is usually temporary.',
        suggestion: 'Please wait a moment and try refreshing the page.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if it's a network error
    if (error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('timeout'))) {
      return res.status(503).json({
        message: 'Cannot connect to Jira',
        error: 'Please check NEXT_PUBLIC_JIRA_DOMAIN environment variable',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to fetch security events',
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