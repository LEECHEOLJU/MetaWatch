import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const baseUrl = `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}`;
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

    // Very simple JQL query to test basic functionality
    const simpleJql = 'created >= "2024-01-01" ORDER BY created DESC';
    
    console.log('Testing simple JQL:', simpleJql);

    const searchUrl = `${baseUrl}/rest/api/2/search`;
    const searchParams = new URLSearchParams({
      jql: simpleJql,
      startAt: '0',
      maxResults: '10',
      fields: 'key,summary,status,created,project',
    });

    const response = await fetch(`${searchUrl}?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('Search response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Search error response:', errorText);
      
      return res.status(response.status).json({
        success: false,
        error: `Jira search failed with status ${response.status}`,
        details: errorText,
        query: simpleJql
      });
    }

    const data = await response.json();
    console.log(`Found ${data.total} issues`);

    // Get list of all projects and issue types
    const projects = [...new Set(data.issues.map((issue: any) => issue.fields?.project?.key).filter(Boolean))];
    const issueTypes = [...new Set(data.issues.map((issue: any) => issue.fields?.issuetype?.name).filter(Boolean))];

    return res.status(200).json({
      success: true,
      message: 'Jira search successful',
      results: {
        total: data.total,
        returned: data.issues.length,
        sampleIssues: data.issues.slice(0, 3).map((issue: any) => ({
          key: issue.key,
          summary: issue.fields?.summary,
          project: issue.fields?.project?.key,
          issueType: issue.fields?.issuetype?.name,
          status: issue.fields?.status?.name,
          created: issue.fields?.created,
        })),
        availableProjects: projects,
        availableIssueTypes: issueTypes
      },
      query: simpleJql
    });

  } catch (error) {
    console.error('Simple search error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    });
  }
}