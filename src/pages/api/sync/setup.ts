import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

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
    console.log('🚀 Setting up Jira sync configuration...');

    // 기본 동기화 설정 초기화
    const defaultSettings = [
      {
        setting_key: 'sync_enabled',
        setting_value: 'true',
        description: '동기화 활성화 상태'
      },
      {
        setting_key: 'full_sync_interval_hours',
        setting_value: '24',
        description: '전체 동기화 간격(시간)'
      },
      {
        setting_key: 'incremental_sync_interval_minutes',
        setting_value: '5',
        description: '증분 동기화 간격(분)'
      },
      {
        setting_key: 'realtime_sync_interval_minutes',
        setting_value: '1',
        description: '실시간 동기화 간격(분)'
      },
      {
        setting_key: 'max_tickets_per_sync',
        setting_value: '1000',
        description: '동기화당 최대 티켓 수'
      },
      {
        setting_key: 'sync_lookback_days',
        setting_value: '90',
        description: '전체 동기화 조회 기간(일)'
      }
    ];

    // 설정 upsert
    for (const setting of defaultSettings) {
      await supabaseAdmin
        .from('sync_settings')
        .upsert({
          ...setting,
          updated_at: new Date().toISOString()
        });
    }

    // 초기 동기화 상태 확인
    const { data: existingTickets, count } = await supabaseAdmin
      .from('jira_tickets')
      .select('*', { count: 'exact', head: true });

    let setupMessage = '동기화 설정이 완료되었습니다.';
    let recommendedAction = '';

    if (!count || count === 0) {
      setupMessage += ' 데이터베이스에 티켓 데이터가 없습니다.';
      recommendedAction = '초기 전체 동기화를 실행해주세요: POST /api/sync/full-sync';
    } else {
      setupMessage += ` 현재 ${count}개의 티켓이 저장되어 있습니다.`;
      recommendedAction = '증분 동기화가 자동으로 실행될 예정입니다.';
    }

    // 초기 동기화 로그
    await supabaseAdmin
      .from('sync_log')
      .insert({
        sync_type: 'setup',
        sync_source: 'api',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed',
        duration_seconds: 0,
        tickets_processed: 0,
        tickets_created: 0,
        tickets_updated: 0,
        tickets_failed: 0
      });

    res.status(200).json({
      message: setupMessage,
      recommendedAction,
      settings: defaultSettings,
      existingTicketCount: count || 0,
      cronSchedule: {
        realtimeSync: '매분 실행',
        incrementalSync: '5분마다 실행',
        fullSync: '매일 새벽 2시 실행'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sync setup failed:', error);
    
    res.status(500).json({
      message: 'Sync setup failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}