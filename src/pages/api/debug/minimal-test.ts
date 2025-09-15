import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const baseUrl = `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}`;
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');

    // Ultra minimal query - just get any recent issues
    const minimalJql = 'created >= -24h ORDER BY created DESC';
    
    console.log('Testing minimal JQL:', minimalJql);

    const searchUrl = `${baseUrl}/rest/api/3/search/jql`;
    const searchParams = new URLSearchParams({
      jql: minimalJql,
      startAt: '0',
      maxResults: '5',
      fields: 'key,summary,status,created',
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃

    const response = await fetch(`${searchUrl}?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('Minimal test response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Minimal test error:', errorText);
      
      return res.status(response.status).json({
        success: false,
        error: `Jira API returned ${response.status}`,
        details: errorText,
        query: minimalJql,
        url: `${searchUrl}?${searchParams}`
      });
    }

    const data = await response.json();
    console.log(`Minimal test found ${data.total} issues`);

    return res.status(200).json({
      success: true,
      message: 'Minimal Jira test successful',
      results: {
        total: data.total,
        returned: data.issues.length,
        sampleIssues: data.issues.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields?.summary?.substring(0, 100),
          status: issue.fields?.status?.name,
          created: issue.fields?.created,
        }))
      },
      query: minimalJql
    });

  } catch (error) {
    console.error('Minimal test error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(408).json({
        success: false,
        error: 'Request timeout (15 seconds)',
        suggestion: 'The Jira server is responding very slowly'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    });
  }
}