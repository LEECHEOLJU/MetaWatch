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

    const startDateStr = startDate.toISOString().replace('T', ' ').substring(0, 19);
    const endDateStr = endDate.toISOString().replace('T', ' ').substring(0, 19);

    // JQL 쿼리 구성
    let jqlQuery = '';
    if (project === 'all') {
      jqlQuery = `project IN ("GOODRICH", "FINDA", "SAMKOO", "WCVS", "GLN", "KURLY", "ISU") AND issuetype="보안이벤트"`;
    } else {
      jqlQuery = `project = "${project}" AND issuetype="보안이벤트"`;
    }

    jqlQuery += ` AND created >= "${startDateStr}" AND created <= "${endDateStr}" ORDER BY created DESC`;

    console.log('JQL Query:', jqlQuery);

    const searchUrl = `${baseUrl}/rest/api/2/search`;
    const searchParams = new URLSearchParams({
      jql: jqlQuery,
      startAt: '0',
      maxResults: maxResults as string,
      fields: 'id,key,summary,status,priority,created,updated,assignee,reporter,project,issuetype',
    });

    const response = await fetch(`${searchUrl}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('Search API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Search API Error:', errorText);
      return res.status(response.status).json({
        message: 'Jira search failed',
        error: errorText,
        jql: jqlQuery,
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
      urgentCount: securityEvents.filter(e => 
        e.status.includes('미해결') || 
        e.priority.includes('High') || 
        e.priority.includes('Highest')
      ).length,
      recentCount: securityEvents.filter(e => e.age < 24).length,
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
    res.status(500).json({ 
      message: 'Failed to fetch security events',
      error: error instanceof Error ? error.message : 'Unknown error'
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