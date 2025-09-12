import { NextApiRequest, NextApiResponse } from 'next';

// 🚨 이 API는 더 이상 25만개 Jira 티켓을 조회하지 않습니다!
// 대신 DB 기반 API로 리다이렉트합니다.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🔄 Redirecting /api/jira/unresolved-events to /api/db/unresolved-events');
  
  // DB 기반 API로 내부 리다이렉트
  const baseUrl = `http://localhost:${process.env.PORT || 3002}`;
  const queryString = req.url?.includes('?') ? '?' + req.url.split('?')[1] : '';
  const dbApiUrl = `${baseUrl}/api/db/unresolved-events${queryString}`;
  
  try {
    const response = await fetch(dbApiUrl);
    const data = await response.json();
    
    // DB API 응답을 그대로 전달 (호환성 유지)
    res.status(response.status).json({
      ...data,
      source: 'database_redirect',
      originalApi: '/api/jira/unresolved-events',
      redirectedTo: '/api/db/unresolved-events',
      message: 'Redirected from Jira API to DB API for better performance'
    });
  } catch (error) {
    console.error('❌ DB API redirect failed:', error);
    res.status(500).json({
      message: 'DB API redirect failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}