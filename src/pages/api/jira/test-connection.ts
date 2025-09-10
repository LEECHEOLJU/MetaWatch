import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const startTime = Date.now();
    
    // 환경 변수 확인
    const jiraDomain = process.env.NEXT_PUBLIC_JIRA_DOMAIN;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_API_TOKEN;

    console.log('Environment check:');
    console.log('JIRA_DOMAIN:', jiraDomain);
    console.log('JIRA_EMAIL:', jiraEmail ? 'Set' : 'Not Set');
    console.log('JIRA_TOKEN:', jiraToken ? 'Set (length: ' + jiraToken.length + ')' : 'Not Set');

    if (!jiraDomain || !jiraEmail || !jiraToken) {
      return res.status(500).json({
        status: 'error',
        message: 'Missing environment variables',
        domain: jiraDomain || 'Not configured',
        error: 'Environment variables not properly set',
        timestamp: new Date().toISOString(),
        config: {
          domain: !!jiraDomain,
          email: !!jiraEmail,
          token: !!jiraToken,
        }
      });
    }

    // 기본 인증 헤더 생성
    const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
    const baseUrl = `https://${jiraDomain}`;

    // 간단한 연결 테스트 - 사용자 정보 가져오기
    const response = await fetch(`${baseUrl}/rest/api/2/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error:', errorText);
      return res.status(200).json({
        status: 'error',
        domain: jiraDomain,
        message: 'Jira API connection failed',
        error: `HTTP ${response.status}: ${errorText}`,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    const userData = await response.json();
    console.log('User data:', userData);

    // 프로젝트 목록 가져오기 (타겟 프로젝트만)
    const targetProjects = ['GOODRICH', 'FINDA', 'SAMKOO', 'WCVS', 'GLN', 'KURLY', 'ISU'];
    const projectsResponse = await fetch(`${baseUrl}/rest/api/2/project`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    let projects = [];
    if (projectsResponse.ok) {
      const allProjects = await projectsResponse.json();
      // 타겟 프로젝트만 필터링
      projects = allProjects.filter((p: any) => targetProjects.includes(p.key))
        .map((p: any) => ({ key: p.key, name: p.name }));
      console.log('Target projects found:', projects);
    }

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      status: 'connected',
      domain: jiraDomain,
      user: {
        accountId: userData.accountId,
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
      },
      projects,
      responseTime,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(200).json({
      status: 'error',
      domain: process.env.NEXT_PUBLIC_JIRA_DOMAIN || 'Not configured',
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}