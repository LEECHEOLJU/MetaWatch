import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

// 모든 고객사의 통계 캐시를 미리 생성하는 배치 처리 API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 보안을 위한 API 키 확인 (선택사항)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    console.log('🔄 Starting stats cache refresh...');
    
    // 모든 고객사 목록 조회
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('customers')
      .select('code');

    if (customersError) {
      throw customersError;
    }

    const results = [];
    const equipmentTypes = ['all', 'ips', 'waf'];
    
    // 각 고객사별, 장비별로 통계 생성
    for (const customer of customers) {
      for (const equipment of equipmentTypes) {
        try {
          console.log(`📊 Processing ${customer.code} - ${equipment}`);
          
          // 내부 API 호출하여 통계 생성 및 캐시
          const baseUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:3000' 
            : `https://${process.env.VERCEL_URL || 'your-domain.com'}`;
            
          const response = await fetch(
            `${baseUrl}/api/stats/customer/${customer.code.toLowerCase()}?equipment=${equipment}`,
            {
              headers: {
                'User-Agent': 'MetaWatch-Batch-Process'
              }
            }
          );

          if (response.ok) {
            const stats = await response.json();
            results.push({
              customer: customer.code,
              equipment,
              totalEvents: stats.totalEvents,
              cached: stats.cached,
              success: true
            });
          } else {
            results.push({
              customer: customer.code,
              equipment,
              success: false,
              error: `HTTP ${response.status}`
            });
          }
        } catch (error) {
          console.error(`❌ Failed to process ${customer.code} - ${equipment}:`, error);
          results.push({
            customer: customer.code,
            equipment,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        
        // 과부하 방지를 위한 딜레이 (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 오래된 캐시 정리
    const { data: cleanupResult } = await supabaseAdmin.rpc('cleanup_old_stats');
    console.log(`🧹 Cleaned up ${cleanupResult || 0} old cache entries`);

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    console.log(`✅ Stats refresh completed: ${successCount}/${totalCount} successful`);

    res.status(200).json({
      message: 'Stats cache refresh completed',
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats refresh batch job failed:', error);
    res.status(500).json({
      message: 'Stats refresh failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}