import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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

    // 사용자가 제시한 정확한 쿼리
    const { jql } = req.body;

    console.log('🎯 Testing JQL Query:', jql);

    const searchUrl = `${baseUrl}/rest/api/3/search/jql`;
    const searchBody = {
      jql,
      maxResults: 1,
      fields: ['key', 'status', 'project'],
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

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Test Query Error:', errorText);

      return res.status(response.status).json({
        message: 'Jira search failed',
        error: errorText || response.statusText,
        jql,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      });
    }

    const searchResults = await response.json();
    console.log(`✅ Query result:`, searchResults);

    res.status(200).json({
      jql,
      total: searchResults.total,
      issues_count: searchResults.issues?.length || 0,
      full_response: searchResults,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test query error:', error);

    res.status(500).json({
      message: 'Failed to test query',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}