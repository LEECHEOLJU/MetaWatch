import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { JiraSyncManager } from '@/lib/jira-sync';

// 동기화 상태 조회 API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const syncManager = new JiraSyncManager();
    
    // 동기화 상태 조회
    const syncStatus = await syncManager.getSyncStatus();
    
    // 최근 동기화 로그 조회
    const { data: recentLogs } = await supabaseAdmin
      .from('sync_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    // 전체 티켓 수 조회
    const { count: totalTickets } = await supabaseAdmin
      .from('jira_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // 오늘 동기화된 티켓 수
    const today = new Date().toISOString().split('T')[0];
    const { count: todaysTickets } = await supabaseAdmin
      .from('jira_tickets')
      .select('*', { count: 'exact', head: true })
      .gte('last_synced_at', `${today}T00:00:00Z`)
      .eq('is_deleted', false);

    // 마지막 성공한 동기화들
    const { data: lastSuccessfulSyncs } = await supabaseAdmin
      .from('sync_log')
      .select('sync_type, completed_at, tickets_processed')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(3);

    // 현재 실행 중인 동기화
    const { data: runningSyncs } = await supabaseAdmin
      .from('sync_log')
      .select('*')
      .eq('status', 'running')
      .order('started_at', { ascending: false });

    // 동기화 설정 조회
    const { data: syncSettings } = await supabaseAdmin
      .from('sync_settings')
      .select('setting_key, setting_value, updated_at')
      .in('setting_key', [
        'last_full_sync',
        'last_incremental_sync', 
        'sync_enabled',
        'full_sync_interval_hours',
        'incremental_sync_interval_minutes'
      ]);

    const settingsMap = syncSettings?.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {} as Record<string, string>) || {};

    // 응답 구성
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      
      // 전체 상태
      overview: {
        totalTickets: totalTickets || 0,
        todaysTickets: todaysTickets || 0,
        syncEnabled: settingsMap.sync_enabled === 'true',
        hasRunningSyncs: (runningSyncs?.length || 0) > 0
      },
      
      // 동기화 상태
      syncStatus: syncStatus || [],
      
      // 실행 중인 동기화
      runningSyncs: runningSyncs?.map(sync => ({
        id: sync.id,
        type: sync.sync_type,
        startedAt: sync.started_at,
        processed: sync.tickets_processed || 0,
        runningFor: Math.round((Date.now() - new Date(sync.started_at).getTime()) / 1000)
      })) || [],
      
      // 마지막 성공한 동기화들
      lastSuccessful: lastSuccessfulSyncs?.map(sync => ({
        type: sync.sync_type,
        completedAt: sync.completed_at,
        processed: sync.tickets_processed
      })) || [],
      
      // 최근 로그 (요약)
      recentActivity: recentLogs?.slice(0, 5).map(log => ({
        id: log.id,
        type: log.sync_type,
        status: log.status,
        startedAt: log.started_at,
        completedAt: log.completed_at,
        processed: log.tickets_processed || 0,
        duration: log.duration_seconds
      })) || [],
      
      // 설정값들
      settings: {
        lastFullSync: settingsMap.last_full_sync,
        lastIncrementalSync: settingsMap.last_incremental_sync,
        fullSyncIntervalHours: parseInt(settingsMap.full_sync_interval_hours || '24'),
        incrementalSyncIntervalMinutes: parseInt(settingsMap.incremental_sync_interval_minutes || '5')
      },
      
      // 다음 예정 동기화 (추정)
      nextScheduled: {
        fullSync: estimateNextSync(settingsMap.last_full_sync, parseInt(settingsMap.full_sync_interval_hours || '24')),
        incrementalSync: estimateNextSync(settingsMap.last_incremental_sync, parseInt(settingsMap.incremental_sync_interval_minutes || '5') / 60)
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Sync status API error:', error);
    res.status(500).json({
      message: 'Failed to fetch sync status',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// 다음 동기화 시간 추정
function estimateNextSync(lastSyncTime: string, intervalHours: number): string | null {
  if (!lastSyncTime) return null;
  
  const lastSync = new Date(lastSyncTime);
  const nextSync = new Date(lastSync.getTime() + (intervalHours * 60 * 60 * 1000));
  
  return nextSync.toISOString();
}