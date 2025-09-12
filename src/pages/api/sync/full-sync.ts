import { NextApiRequest, NextApiResponse } from 'next';
import { JiraSyncManager } from '@/lib/jira-sync';

// 전체 동기화 API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 보안을 위한 API 키 확인
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🚀 Starting full Jira sync...');
    
    const syncManager = new JiraSyncManager();
    
    // 동기화 설정
    const config = {
      batchSize: parseInt(req.body?.batchSize || '100'),
      maxResults: parseInt(req.body?.maxResults || '10000'),
      daysLookback: parseInt(req.body?.daysLookback || '90'),
      projects: req.body?.projects || []
    };

    console.log('📋 Sync configuration:', config);

    // 전체 동기화 실행
    const result = await syncManager.performFullSync(config);

    if (result.success) {
      console.log('✅ Full sync completed successfully');
      
      // 마지막 동기화 시간 업데이트
      await syncManager.updateLastSyncTime('full');
      
      return res.status(200).json({
        message: 'Full sync completed successfully',
        ...result,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ Full sync completed with errors');
      
      return res.status(207).json({ // 207 Multi-Status
        message: 'Full sync completed with some errors',
        ...result,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Full sync failed:', error);
    
    return res.status(500).json({
      message: 'Full sync failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// API 타임아웃 증가 (전체 동기화는 오래 걸릴 수 있음)
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  // Vercel에서 함수 실행 시간 최대 10분으로 설정
  maxDuration: 600
};