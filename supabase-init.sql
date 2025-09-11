-- MetaWatch Supabase 데이터베이스 초기화 스크립트
-- Supabase SQL Editor에서 실행하세요

-- ===============================
-- 테이블 생성
-- ===============================

-- 고객사 정보 테이블
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'GOODRICH', 'FINDA' 등
  name TEXT NOT NULL, -- '굿리치', '핀다' 등
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시간별 통계 캐시 테이블
CREATE TABLE IF NOT EXISTS customer_stats_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('all', 'ips', 'waf')),
  stats_date DATE NOT NULL,
  stats_hour INTEGER NOT NULL CHECK (stats_hour >= 0 AND stats_hour <= 23),
  total_events INTEGER DEFAULT 0,
  severity_stats JSONB DEFAULT '[]'::jsonb,
  top_signatures JSONB DEFAULT '[]'::jsonb,
  top_attack_ips JSONB DEFAULT '[]'::jsonb,
  top_countries JSONB DEFAULT '[]'::jsonb,
  hourly_trend JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_code, equipment_type, stats_date, stats_hour)
);

-- 일별 요약 통계 테이블 
CREATE TABLE IF NOT EXISTS customer_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('all', 'ips', 'waf')),
  stats_date DATE NOT NULL,
  total_events INTEGER DEFAULT 0,
  severity_distribution JSONB DEFAULT '{}'::jsonb,
  peak_hour INTEGER CHECK (peak_hour IS NULL OR (peak_hour >= 0 AND peak_hour <= 23)),
  top_attack_ip TEXT,
  top_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_code, equipment_type, stats_date)
);

-- ===============================
-- 인덱스 생성 (쿼리 성능 향상)
-- ===============================

CREATE INDEX IF NOT EXISTS idx_customer_stats_cache_lookup 
ON customer_stats_cache(customer_code, equipment_type, stats_date, stats_hour);

CREATE INDEX IF NOT EXISTS idx_customer_stats_cache_date 
ON customer_stats_cache(stats_date DESC, stats_hour DESC);

CREATE INDEX IF NOT EXISTS idx_daily_stats_lookup 
ON customer_daily_stats(customer_code, equipment_type, stats_date DESC);

-- ===============================
-- Row Level Security (RLS) 설정
-- ===============================

-- RLS 활성화
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_stats_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_daily_stats ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Allow read access for customers" ON customers;
DROP POLICY IF EXISTS "Allow read access for customer_stats_cache" ON customer_stats_cache;
DROP POLICY IF EXISTS "Allow read access for customer_daily_stats" ON customer_daily_stats;
DROP POLICY IF EXISTS "Allow service role full access to customers" ON customers;
DROP POLICY IF EXISTS "Allow service role full access to customer_stats_cache" ON customer_stats_cache;
DROP POLICY IF EXISTS "Allow service role full access to customer_daily_stats" ON customer_daily_stats;

-- 읽기 권한 정책 (모든 사용자가 읽을 수 있음)
CREATE POLICY "Allow read access for customers" 
ON customers FOR SELECT USING (true);

CREATE POLICY "Allow read access for customer_stats_cache" 
ON customer_stats_cache FOR SELECT USING (true);

CREATE POLICY "Allow read access for customer_daily_stats" 
ON customer_daily_stats FOR SELECT USING (true);

-- 서비스 역할에 대한 모든 권한
CREATE POLICY "Allow service role full access to customers" 
ON customers FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to customer_stats_cache" 
ON customer_stats_cache FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to customer_daily_stats" 
ON customer_daily_stats FOR ALL USING (auth.role() = 'service_role');

-- ===============================
-- 기본 데이터 입력
-- ===============================

-- 고객사 정보 입력
INSERT INTO customers (code, name) VALUES
('GOODRICH', '굿리치'),
('FINDA', '핀다'),
('SAMKOO', '삼구아이앤씨'),
('WCVS', '한화위캠버스'),
('GLN', 'GLN'),
('KURLY', '컬리'),
('ISU', '이수시스템')
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = NOW();

-- ===============================
-- 헬퍼 함수 생성
-- ===============================

-- 통계 캐시 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION upsert_customer_stats_cache(
  p_customer_code TEXT,
  p_equipment_type TEXT,
  p_stats_date DATE,
  p_stats_hour INTEGER,
  p_total_events INTEGER,
  p_severity_stats JSONB,
  p_top_signatures JSONB,
  p_top_attack_ips JSONB,
  p_top_countries JSONB,
  p_hourly_trend JSONB
) RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO customer_stats_cache (
    customer_code, equipment_type, stats_date, stats_hour,
    total_events, severity_stats, top_signatures, 
    top_attack_ips, top_countries, hourly_trend, updated_at
  ) VALUES (
    p_customer_code, p_equipment_type, p_stats_date, p_stats_hour,
    p_total_events, p_severity_stats, p_top_signatures,
    p_top_attack_ips, p_top_countries, p_hourly_trend, NOW()
  )
  ON CONFLICT (customer_code, equipment_type, stats_date, stats_hour) 
  DO UPDATE SET
    total_events = EXCLUDED.total_events,
    severity_stats = EXCLUDED.severity_stats,
    top_signatures = EXCLUDED.top_signatures,
    top_attack_ips = EXCLUDED.top_attack_ips,
    top_countries = EXCLUDED.top_countries,
    hourly_trend = EXCLUDED.hourly_trend,
    updated_at = NOW()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- 오래된 캐시 데이터 정리 함수 (7일 이상 된 데이터 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_stats() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM customer_stats_cache 
  WHERE stats_date < CURRENT_DATE - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM customer_daily_stats 
  WHERE stats_date < CURRENT_DATE - INTERVAL '30 days';
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 완료 메시지
-- ===============================

DO $$
BEGIN
  RAISE NOTICE '✅ MetaWatch Supabase 데이터베이스 초기화가 완료되었습니다!';
  RAISE NOTICE '📊 생성된 테이블: customers, customer_stats_cache, customer_daily_stats';
  RAISE NOTICE '🔐 RLS 정책이 설정되었습니다';
  RAISE NOTICE '👥 고객사 데이터가 입력되었습니다: % 개', (SELECT COUNT(*) FROM customers);
END $$;