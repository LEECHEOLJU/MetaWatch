import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 클라이언트용 (브라우저에서 사용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버용 (API 라우트에서 사용, 모든 권한)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 데이터베이스 테이블 타입 정의
export interface Customer {
  id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerStatsCache {
  id: string;
  customer_code: string;
  equipment_type: 'all' | 'ips' | 'waf';
  stats_date: string;
  stats_hour: number;
  total_events: number;
  severity_stats: Array<{name: string; value: number; color: string}>;
  top_signatures: Array<{name: string; value: number}>;
  top_attack_ips: Array<{name: string; value: number}>;
  top_countries: Array<{name: string; value: number}>;
  hourly_trend: Array<{hour: string; events: number}>;
  created_at: string;
  updated_at: string;
}

export interface CustomerDailyStats {
  id: string;
  customer_code: string;
  equipment_type: 'all' | 'ips' | 'waf';
  stats_date: string;
  total_events: number;
  severity_distribution: Record<string, number>;
  peak_hour: number | null;
  top_attack_ip: string | null;
  top_signature: string | null;
  created_at: string;
  updated_at: string;
}