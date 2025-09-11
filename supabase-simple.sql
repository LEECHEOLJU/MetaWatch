-- MetaWatch 간단 버전 - 단계별 실행용

-- 1단계: 테이블 생성
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_stats_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  stats_date DATE NOT NULL,
  stats_hour INTEGER NOT NULL,
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

CREATE TABLE customer_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  stats_date DATE NOT NULL,
  total_events INTEGER DEFAULT 0,
  severity_distribution JSONB DEFAULT '{}'::jsonb,
  peak_hour INTEGER,
  top_attack_ip TEXT,
  top_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_code, equipment_type, stats_date)
);

-- 2단계: 인덱스 생성
CREATE INDEX idx_customer_stats_cache_lookup 
ON customer_stats_cache(customer_code, equipment_type, stats_date, stats_hour);

CREATE INDEX idx_daily_stats_lookup 
ON customer_daily_stats(customer_code, equipment_type, stats_date);

-- 3단계: 고객사 데이터 입력
INSERT INTO customers (code, name) VALUES
('GOODRICH', '굿리치'),
('FINDA', '핀다'),
('SAMKOO', '삼구아이앤씨'),
('WCVS', '한화위캠버스'),
('GLN', 'GLN'),
('KURLY', '컬리'),
('ISU', '이수시스템');

-- 4단계: 헬퍼 함수 (선택사항)
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

-- 5단계: 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_stats() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM customer_stats_cache 
  WHERE stats_date < CURRENT_DATE - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;