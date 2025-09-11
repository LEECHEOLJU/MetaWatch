import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { customerId, equipment = 'all', days = '1' } = req.query;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // 먼저 캐시된 데이터 조회 시도
    const cachedStats = await getCachedStats(customerId, equipment as string, parseInt(days as string));
    
    if (cachedStats && isCacheValid(cachedStats.lastUpdated)) {
      console.log(`📊 Serving cached stats for ${customerId}`);
      return res.status(200).json(cachedStats);
    }

    // 캐시가 없거나 오래된 경우 Jira에서 실시간 데이터 가져오기
    console.log(`🔄 Fetching fresh data for ${customerId} from Jira`);
    const freshStats = await fetchFreshStatsFromJira(customerId, equipment as string, parseInt(days as string));
    
    // 캐시에 저장 (백그라운드 작업)
    saveToCacheAsync(customerId, equipment as string, freshStats);
    
    res.status(200).json(freshStats);
  } catch (error) {
    console.error('Customer stats API error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch customer stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// 캐시된 통계 조회
async function getCachedStats(customerId: string, equipment: string, days: number) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const { data, error } = await supabaseAdmin
      .from('customer_stats_cache')
      .select('*')
      .eq('customer_code', customerId.toUpperCase())
      .eq('equipment_type', equipment)
      .gte('stats_date', startDate.toISOString().split('T')[0])
      .lte('stats_date', endDate.toISOString().split('T')[0])
      .order('stats_date', { ascending: false })
      .order('stats_hour', { ascending: false });

    if (error) {
      console.error('Supabase cache query error:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // 캐시된 데이터를 집계하여 반환
    return aggregateCachedStats(data);
  } catch (error) {
    console.error('Error fetching cached stats:', error);
    return null;
  }
}

// 캐시 유효성 검사 (5분 이내 데이터는 유효)
function isCacheValid(lastUpdated: string): boolean {
  const cacheAge = Date.now() - new Date(lastUpdated).getTime();
  const fiveMinutes = 5 * 60 * 1000;
  return cacheAge < fiveMinutes;
}

// Jira에서 실시간 데이터 가져오기
async function fetchFreshStatsFromJira(customerId: string, equipment: string, days: number) {
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://your-domain.com';

  const response = await fetch(`${baseUrl}/api/jira/security-events?days=${days}&customer=${customerId}&equipment=${equipment}`, {
    headers: {
      'User-Agent': 'MetaWatch-Internal'
    }
  });

  if (!response.ok) {
    throw new Error(`Jira API request failed: ${response.status}`);
  }

  const jiraData = await response.json();
  
  // Jira 데이터를 통계로 변환
  return processJiraDataToStats(jiraData, customerId, equipment, days);
}

// Jira 데이터를 통계로 변환
function processJiraDataToStats(jiraData: any, customerId: string, equipment: string, days: number) {
  const events = jiraData.events || [];
  
  // 심각도별 통계
  const severityCounts: Record<string, number> = {};
  const signatureCounts: Record<string, number> = {};
  const ipCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  const hourlyCounts: Record<number, number> = {};

  const severityColors: Record<string, string> = {
    'Critical': '#DC2626',
    'High': '#EF4444', 
    'Medium': '#F59E0B',
    'Low': '#10B981',
    'Info': '#6B7280'
  };

  events.forEach((event: any) => {
    // 심각도 집계
    const severity = event.severity || 'Unknown';
    severityCounts[severity] = (severityCounts[severity] || 0) + 1;

    // 시그니처 집계
    const signature = event.attackType || 'Unknown';
    signatureCounts[signature] = (signatureCounts[signature] || 0) + 1;

    // 공격 IP 집계
    const sourceIp = event.sourceIp;
    if (sourceIp && sourceIp !== '알 수 없음' && sourceIp !== '') {
      ipCounts[sourceIp] = (ipCounts[sourceIp] || 0) + 1;
    }

    // 국가별 집계
    const country = event.country || 'Unknown';
    countryCounts[country] = (countryCounts[country] || 0) + 1;

    // 시간별 집계
    const hour = new Date(event.detectionTime || event.created).getHours();
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });

  return {
    customer: customerId,
    equipment,
    totalEvents: events.length,
    severityStats: Object.entries(severityCounts)
      .map(([name, value]) => ({ name, value, color: severityColors[name] || '#6B7280' }))
      .sort((a, b) => b.value - a.value),
    topSignatures: Object.entries(signatureCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    topAttackIPs: Object.entries(ipCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
    topCountries: Object.entries(countryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    hourlyTrend: Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      events: hourlyCounts[hour] || 0
    })),
    lastUpdated: new Date().toISOString(),
    cached: false
  };
}

// 캐시된 데이터 집계
function aggregateCachedStats(cachedData: any[]) {
  // 가장 최근 데이터 기준으로 통계 집계
  const latestData = cachedData[0];
  
  return {
    customer: latestData.customer_code,
    equipment: latestData.equipment_type,
    totalEvents: latestData.total_events,
    severityStats: latestData.severity_stats,
    topSignatures: latestData.top_signatures,
    topAttackIPs: latestData.top_attack_ips,
    topCountries: latestData.top_countries,
    hourlyTrend: latestData.hourly_trend,
    lastUpdated: latestData.updated_at,
    cached: true
  };
}

// 캐시에 비동기적으로 저장 (응답 속도에 영향 없음)
async function saveToCacheAsync(customerId: string, equipment: string, stats: any) {
  try {
    const now = new Date();
    const statsDate = now.toISOString().split('T')[0];
    const statsHour = now.getHours();

    await supabaseAdmin.rpc('upsert_customer_stats_cache', {
      p_customer_code: customerId.toUpperCase(),
      p_equipment_type: equipment,
      p_stats_date: statsDate,
      p_stats_hour: statsHour,
      p_total_events: stats.totalEvents,
      p_severity_stats: stats.severityStats,
      p_top_signatures: stats.topSignatures,
      p_top_attack_ips: stats.topAttackIPs,
      p_top_countries: stats.topCountries,
      p_hourly_trend: stats.hourlyTrend
    });

    console.log(`💾 Cached stats for ${customerId} (${equipment})`);
  } catch (error) {
    console.error('Failed to cache stats:', error);
    // 캐시 실패는 사용자에게 영향 없음
  }
}