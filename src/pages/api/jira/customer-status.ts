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
    const { days = '1' } = req.query;

    // 프로젝트 목록
    const projects = ['GOODRICH', 'FINDA', 'SAMKOO', 'WCVS', 'GLN', 'KURLY'];
    
    // 주요 상태 목록 (Jira 대시보드 기준)
    const statuses = [
      '기 차단 완료',
      '승인 대기', 
      '협의된 차단 완료',
      '차단 미승인 완료',
      '오탐 확인 완료',
      '정탐(승인필요 대상)',
      '미해결'
    ];

    const customerData: Record<string, Record<string, number>> = {};

    // 각 프로젝트별로 상태별 개별 쿼리 실행
    for (const project of projects) {
      customerData[project] = {};
      
      for (const status of statuses) {
        // ✅ Jira 대시보드와 동일한 JQL 쿼리 패턴
        const jqlQuery = `project in (GOODRICH, FINDA, SAMKOO, WCVS, GLN, KURLY) AND type = 보안이벤트 AND created >= -${days}d AND status = "${status}" AND project = ${project} ORDER BY created DESC`;
        
        try {
          const searchUrl = `${baseUrl}/rest/api/3/search/jql`;

          // 🆕 새로운 API 구조: POST 요청 + JSON body
          const searchBody = {
            jql: jqlQuery,
            maxResults: 0, // 개수만 필요하므로 0으로 설정
            fields: ['id'], // 최소 필드만 요청
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(searchUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchBody),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            customerData[project][status] = result.total || 0;
            console.log(`✅ ${project} - ${status}: ${result.total}`);
          } else {
            console.log(`❌ ${project} - ${status}: API 오류`);
            customerData[project][status] = 0;
          }
          
          // API 호출 간격 (너무 빠르면 rate limit)
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error querying ${project} - ${status}:`, error);
          customerData[project][status] = 0;
        }
      }
    }

    // 고객사 이름 매핑
    const customerNames: Record<string, string> = {
      'GOODRICH': '굿리치',
      'FINDA': '핀다',
      'SAMKOO': '삼구아이앤씨',
      'WCVS': '한화위캠버스',
      'GLN': 'GLN', 
      'KURLY': '컬리'
    };

    // 응답 데이터 구성
    const customerStats = Object.entries(customerData).map(([projectKey, statusCounts]) => ({
      customer: projectKey,
      customerName: customerNames[projectKey] || projectKey,
      statusCounts,
      total: Object.values(statusCounts).reduce((sum, count) => sum + count, 0),
      resolved: (statusCounts['기 차단 완료'] || 0) + 
               (statusCounts['협의된 차단 완료'] || 0) + 
               (statusCounts['차단 미승인 완료'] || 0) + 
               (statusCounts['오탐 확인 완료'] || 0),
      unresolved: (statusCounts['정탐(승인필요 대상)'] || 0) + 
                 (statusCounts['미해결'] || 0),
      pending: statusCounts['승인 대기'] || 0
    }));

    // 전체 통계 계산
    const totalStats = {
      totalEvents: customerStats.reduce((sum, c) => sum + c.total, 0),
      totalResolved: customerStats.reduce((sum, c) => sum + c.resolved, 0),
      totalUnresolved: customerStats.reduce((sum, c) => sum + c.unresolved, 0),
      totalPending: customerStats.reduce((sum, c) => sum + c.pending, 0)
    };

    res.status(200).json({
      customerStats,
      totalStats,
      query: {
        days: parseInt(days as string),
        projects,
        statuses
      },
      lastUpdated: new Date().toISOString(),
      source: 'jira_individual_queries'
    });
    
  } catch (error) {
    console.error('Customer status API error:', error);
    
    res.status(500).json({ 
      message: 'Failed to fetch customer status data',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}