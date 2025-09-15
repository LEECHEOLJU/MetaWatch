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

    // 🎯 실제 Jira 대시보드와 동일한 쿼리 구조 사용
    // 각 프로젝트별, 상태별로 개별 쿼리 실행
    const customerData: Record<string, Record<string, number>> = {};
    const searchUrl = `${baseUrl}/rest/api/3/search/jql`;

    console.log('🔍 Starting individual queries for each project and status...');

    // 각 프로젝트별로 상태별 개별 쿼리 실행 (실제 Jira 대시보드 방식)
    for (const project of projects) {
      customerData[project] = {};

      for (const status of statuses) {
        // 실제 Jira 대시보드와 동일한 JQL 쿼리 패턴 (간소화)
        const jqlQuery = `project = ${project} AND type = 보안이벤트 AND created >= -${days}d AND status = "${status}" ORDER BY created DESC`;

        try {
          const searchBody = {
            jql: jqlQuery,
            maxResults: 1000, // 정확한 개수를 얻기 위해 큰 값으로 설정
            fields: ['key'], // 최소 필드만 요청
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
            // Jira v3 API에서는 issues 배열 길이를 사용
            const count = result.issues ? result.issues.length : 0;
            customerData[project][status] = count;
            console.log(`✅ ${project} - ${status}: ${count}`);
          } else {
            const errorText = await response.text();
            console.log(`❌ ${project} - ${status}: API 오류 - ${response.status} - ${errorText}`);
            customerData[project][status] = 0;
          }

          // API 호출 간격 (rate limit 방지)
          await new Promise(resolve => setTimeout(resolve, 50));

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
        statuses,
        queryPattern: "project in (GOODRICH, FINDA, SAMKOO, WCVS, GLN, KURLY) AND issuetype = 보안이벤트 AND created >= -{days}d AND status = '{status}' AND project = {project}"
      },
      lastUpdated: new Date().toISOString(),
      source: 'jira_individual_queries_v3'
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