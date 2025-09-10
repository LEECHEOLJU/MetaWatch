import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Environment variables check
    const envVars = {
      NEXT_PUBLIC_JIRA_DOMAIN: process.env.NEXT_PUBLIC_JIRA_DOMAIN,
      JIRA_EMAIL: process.env.JIRA_EMAIL ? '***configured***' : 'missing',
      JIRA_API_TOKEN: process.env.JIRA_API_TOKEN ? '***configured***' : 'missing',
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log('Environment variables:', envVars);

    if (!process.env.NEXT_PUBLIC_JIRA_DOMAIN) {
      return res.status(400).json({
        success: false,
        error: 'NEXT_PUBLIC_JIRA_DOMAIN is not configured',
        envVars
      });
    }

    if (!process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
      return res.status(400).json({
        success: false,
        error: 'JIRA_EMAIL or JIRA_API_TOKEN is not configured',
        envVars
      });
    }

    // Test basic Jira API connection
    const auth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
    const testUrl = `https://${process.env.NEXT_PUBLIC_JIRA_DOMAIN}/rest/api/3/myself`;

    console.log('Testing Jira connection to:', testUrl);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('Jira API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Jira API error response:', errorText);
      
      return res.status(response.status).json({
        success: false,
        error: `Jira API returned ${response.status}`,
        details: errorText,
        envVars
      });
    }

    const userData = await response.json();
    console.log('Jira connection successful, user:', userData.displayName);

    return res.status(200).json({
      success: true,
      message: 'Jira connection successful',
      user: {
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountId: userData.accountId
      },
      envVars
    });

  } catch (error) {
    console.error('Jira test error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown',
      envVars: {
        NEXT_PUBLIC_JIRA_DOMAIN: process.env.NEXT_PUBLIC_JIRA_DOMAIN || 'missing',
        JIRA_EMAIL: process.env.JIRA_EMAIL ? '***configured***' : 'missing',
        JIRA_API_TOKEN: process.env.JIRA_API_TOKEN ? '***configured***' : 'missing',
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  }
}