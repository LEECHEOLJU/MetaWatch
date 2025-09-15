import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_JIRA_DOMAIN',
      'JIRA_EMAIL',
      'JIRA_API_TOKEN',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const optionalEnvVars = [
      'AZURE_OPENAI_API_KEY',
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_DEPLOYMENT',
      'VIRUSTOTAL_API_KEY',
      'ABUSEIPDB_API_KEY'
    ];

    const envStatus = {
      required: {} as Record<string, boolean>,
      optional: {} as Record<string, boolean>,
      allRequiredPresent: true
    };

    // 필수 환경 변수 확인
    requiredEnvVars.forEach(varName => {
      const isPresent = !!process.env[varName];
      envStatus.required[varName] = isPresent;
      if (!isPresent) {
        envStatus.allRequiredPresent = false;
      }
    });

    // 선택적 환경 변수 확인
    optionalEnvVars.forEach(varName => {
      envStatus.optional[varName] = !!process.env[varName];
    });

    const status = envStatus.allRequiredPresent ? 200 : 500;

    res.status(status).json({
      success: envStatus.allRequiredPresent,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      envVariables: envStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Environment check error:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}