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
    // 기본적인 보안이벤트 검색으로 실제 필드값 확인
    const response = await jiraClient.searchIssues(
      'project IN ("GOODRICH", "KURLY") AND issuetype="보안이벤트"',
      0,
      10
    );

    const fieldAnalysis = {
      totalIssues: response.total,
      sampleIssues: response.issues.slice(0, 3).map(issue => ({
        key: issue.key,
        summary: issue.summary,
        status: issue.status.name,
        priority: issue.priority?.name || 'No Priority',
        project: issue.project.key,
        customFields: Object.keys((issue as any).fields || {}).filter(key => key.startsWith('customfield')),
      })),
      allStatuses: Array.from(new Set(response.issues.map(issue => issue.status.name))),
      allPriorities: Array.from(new Set(response.issues.map(issue => issue.priority?.name).filter(Boolean))),
    };

    res.status(200).json(fieldAnalysis);
  } catch (error) {
    console.error('Error testing fields:', error);
    res.status(500).json({ 
      message: 'Failed to test fields',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}