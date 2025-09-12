-- MetaWatch Jira 전체 데이터 동기화 시스템
-- Supabase SQL Editor에서 실행하세요

-- ===============================
-- 1. Jira 티켓 마스터 테이블
-- ===============================

CREATE TABLE IF NOT EXISTS jira_tickets (
  -- 기본 PK
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Jira 기본 필드
  jira_key TEXT UNIQUE NOT NULL, -- 'GOODRICH-192652'
  jira_id TEXT NOT NULL, -- '4545801'
  project_key TEXT NOT NULL, -- 'GOODRICH'
  project_name TEXT, -- '굿리치'
  
  -- 이슈 기본 정보
  summary TEXT,
  description TEXT,
  issue_type TEXT, -- '보안이벤트'
  status TEXT NOT NULL,
  priority TEXT,
  resolution TEXT,
  
  -- 담당자 정보
  assignee_id TEXT,
  assignee_name TEXT,
  assignee_email TEXT,
  reporter_id TEXT, 
  reporter_name TEXT,
  reporter_email TEXT,
  
  -- 시간 정보
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  
  -- === 보안 이벤트 커스텀 필드들 (40+ 필드) ===
  
  -- 고객사 및 지역 정보
  customer TEXT, -- '굿리치'
  customer_code TEXT, -- 'GOODRICH'
  country TEXT, -- 'South Korea'
  region TEXT,
  
  -- 보안 정보
  severity TEXT, -- 'high', 'medium', 'low', 'critical'
  confidence_level TEXT,
  threat_level TEXT,
  risk_score INTEGER,
  
  -- 탐지 정보
  detection_time TIMESTAMPTZ,
  detection_device TEXT, -- 'WAF(AIWAF)', 'IPS(Fortigate)'
  detection_device_id TEXT, -- 'WAF_A', 'ap-gwlb-ips-so01a'
  detection_equipment_type TEXT, -- 'WAF', 'IPS'
  detection_start TIMESTAMPTZ,
  detection_end TIMESTAMPTZ,
  detection_name TEXT,
  detection_path TEXT,
  
  -- 네트워크 정보
  source_ip INET,
  source_port INTEGER,
  destination_ip TEXT, -- 여러 IP 가능하므로 TEXT
  destination_port INTEGER,
  protocol TEXT, -- 'TCP', 'UDP', 'HTTP'
  direction TEXT, -- 'Inbound', 'Outbound'
  
  -- 공격 정보
  attack_type TEXT, -- '악성 파일 유포', 'SQL Injection'
  attack_category TEXT, -- '악성 파일 업로드 탐지'
  attack_pattern TEXT,
  attack_signature TEXT,
  scenario_name TEXT, -- 'Custom - WAF - 악성 파일 업로드 탐지'
  
  -- 대응 정보
  action_taken TEXT, -- 'allowed', 'blocked', 'monitored'
  threat_matched TEXT, -- 'Y', 'N'
  false_positive BOOLEAN DEFAULT FALSE,
  
  -- 영향도 분석
  impact_analysis TEXT,
  affected_systems TEXT,
  business_impact TEXT,
  
  -- 위협 인텔리전스
  threat_intelligence TEXT,
  threat_source TEXT,
  threat_family TEXT,
  malware_family TEXT,
  
  -- 파일 정보
  file_name TEXT,
  file_path TEXT,
  file_hash_md5 TEXT,
  file_hash_sha1 TEXT,
  file_hash_sha256 TEXT,
  file_size BIGINT,
  file_type TEXT,
  
  -- URL 및 페이로드
  request_url TEXT,
  request_method TEXT, -- 'GET', 'POST'
  user_agent TEXT,
  payload TEXT,
  http_response_code INTEGER,
  
  -- 카운트 정보
  event_count INTEGER DEFAULT 1,
  occurrence_count INTEGER DEFAULT 1,
  
  -- 인시던트 관리
  incident_id TEXT,
  incident_url TEXT,
  related_tickets TEXT[], -- 연관 티켓 배열
  
  -- 규정 준수
  compliance_status TEXT,
  gdpr_relevant BOOLEAN DEFAULT FALSE,
  sox_relevant BOOLEAN DEFAULT FALSE,
  
  -- 메타데이터
  labels TEXT[], -- Jira 라벨들
  components TEXT[], -- Jira 컴포넌트들
  fix_versions TEXT[], -- 수정 버전들
  affects_versions TEXT[], -- 영향 버전들
  
  -- 동기화 메타데이터
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT FALSE,
  jira_last_updated TIMESTAMPTZ, -- Jira에서의 마지막 업데이트
  
  -- 제약 조건
  CONSTRAINT jira_tickets_jira_key_unique UNIQUE(jira_key)
);

-- jira_tickets 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_jira_tickets_project_key ON jira_tickets(project_key);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_customer_code ON jira_tickets(customer_code);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_status ON jira_tickets(status);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_severity ON jira_tickets(severity);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_created_at ON jira_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_updated_at ON jira_tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_detection_time ON jira_tickets(detection_time DESC);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_source_ip ON jira_tickets(source_ip);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_attack_type ON jira_tickets(attack_type);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_detection_device ON jira_tickets(detection_device);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_last_synced_at ON jira_tickets(last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_is_deleted ON jira_tickets(is_deleted);

-- 복합 인덱스 (성능 최적화용)
CREATE INDEX IF NOT EXISTS idx_jira_tickets_status_customer ON jira_tickets(status, customer_code);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_created_customer ON jira_tickets(created_at DESC, customer_code);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_unresolved ON jira_tickets(status, created_at DESC) WHERE is_deleted = FALSE;

-- ===============================
-- 2. Jira 티켓 변경 히스토리 테이블
-- ===============================

CREATE TABLE IF NOT EXISTS jira_ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES jira_tickets(id) ON DELETE CASCADE,
  jira_key TEXT NOT NULL, -- 빠른 조회를 위해 중복 저장
  
  -- 변경 정보
  field_name TEXT NOT NULL, -- 변경된 필드명
  field_type TEXT, -- 'string', 'datetime', 'user', 'status' 등
  old_value TEXT, -- 이전 값 (JSON 문자열 가능)
  new_value TEXT, -- 새 값 (JSON 문자열 가능)
  
  -- 변경 주체
  changed_by_id TEXT,
  changed_by_name TEXT,
  changed_by_email TEXT,
  change_source TEXT DEFAULT 'jira', -- 'jira', 'system', 'api'
  
  -- 변경 시간
  changed_at TIMESTAMPTZ NOT NULL,
  sync_created_at TIMESTAMPTZ DEFAULT NOW()
);

-- jira_ticket_history 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_jira_ticket_history_ticket_id ON jira_ticket_history(ticket_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_jira_ticket_history_jira_key ON jira_ticket_history(jira_key, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_jira_ticket_history_field_name ON jira_ticket_history(field_name);
CREATE INDEX IF NOT EXISTS idx_jira_ticket_history_changed_at ON jira_ticket_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_jira_ticket_history_changed_by_id ON jira_ticket_history(changed_by_id);

-- ===============================
-- 3. 동기화 로그 테이블
-- ===============================

CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 동기화 유형
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'realtime', 'manual')),
  sync_source TEXT DEFAULT 'api', -- 'api', 'cron', 'webhook'
  
  -- 실행 시간
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- 계산된 실행 시간
  
  -- 처리 결과
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  tickets_processed INTEGER DEFAULT 0,
  tickets_created INTEGER DEFAULT 0,
  tickets_updated INTEGER DEFAULT 0,
  tickets_deleted INTEGER DEFAULT 0,
  tickets_failed INTEGER DEFAULT 0,
  
  -- 오류 정보
  error_message TEXT,
  error_details JSONB,
  
  -- 동기화 범위
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  projects TEXT[], -- 처리한 프로젝트 목록
  
  -- 메타데이터
  jira_total_count INTEGER, -- Jira에서 전체 개수
  db_before_count INTEGER, -- 동기화 전 DB 개수
  db_after_count INTEGER -- 동기화 후 DB 개수
);

-- sync_log 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sync_log_type_started ON sync_log(sync_type, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_started_at ON sync_log(started_at DESC);

-- ===============================
-- 4. 동기화 설정 테이블
-- ===============================

CREATE TABLE IF NOT EXISTS sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- 기본 동기화 설정값 입력
INSERT INTO sync_settings (setting_key, setting_value, setting_type, description) VALUES
('last_full_sync', '2025-01-01T00:00:00Z', 'string', '마지막 전체 동기화 시간'),
('last_incremental_sync', '2025-01-01T00:00:00Z', 'string', '마지막 증분 동기화 시간'),
('sync_enabled', 'true', 'boolean', '동기화 활성화 여부'),
('full_sync_interval_hours', '24', 'number', '전체 동기화 간격 (시간)'),
('incremental_sync_interval_minutes', '5', 'number', '증분 동기화 간격 (분)'),
('realtime_sync_interval_seconds', '30', 'number', '실시간 동기화 간격 (초)'),
('max_batch_size', '1000', 'number', '배치 처리 최대 크기'),
('sync_lookback_days', '90', 'number', '동기화 조회 기간 (일)')
ON CONFLICT (setting_key) DO NOTHING;

-- ===============================
-- 5. 유틸리티 함수들
-- ===============================

-- 티켓 upsert 함수 (대량 처리 최적화)
CREATE OR REPLACE FUNCTION upsert_jira_ticket(
  p_jira_key TEXT,
  p_jira_data JSONB
) RETURNS UUID AS $$
DECLARE
  result_id UUID;
  existing_ticket RECORD;
BEGIN
  -- 기존 티켓 확인
  SELECT id, last_synced_at INTO existing_ticket 
  FROM jira_tickets 
  WHERE jira_key = p_jira_key;
  
  IF existing_ticket.id IS NOT NULL THEN
    -- 업데이트
    UPDATE jira_tickets SET
      summary = p_jira_data->>'summary',
      status = p_jira_data->>'status',
      updated_at = (p_jira_data->>'updated')::timestamptz,
      -- 기타 필드들...
      last_synced_at = NOW(),
      sync_version = sync_version + 1
    WHERE id = existing_ticket.id
    RETURNING id INTO result_id;
  ELSE
    -- 신규 생성
    INSERT INTO jira_tickets (
      jira_key, jira_id, project_key, summary, status,
      created_at, updated_at, last_synced_at
      -- 기타 필드들...
    ) VALUES (
      p_jira_key,
      p_jira_data->>'id',
      p_jira_data->>'project_key',
      p_jira_data->>'summary',
      p_jira_data->>'status',
      (p_jira_data->>'created')::timestamptz,
      (p_jira_data->>'updated')::timestamptz,
      NOW()
    ) RETURNING id INTO result_id;
  END IF;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- 동기화 상태 조회 함수
CREATE OR REPLACE FUNCTION get_sync_status()
RETURNS TABLE (
  sync_type TEXT,
  last_run TIMESTAMPTZ,
  status TEXT,
  tickets_processed INTEGER,
  duration_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (sl.sync_type)
    sl.sync_type,
    sl.started_at as last_run,
    sl.status,
    sl.tickets_processed,
    sl.duration_seconds
  FROM sync_log sl
  ORDER BY sl.sync_type, sl.started_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 대시보드 통계 최적화 함수
CREATE OR REPLACE FUNCTION get_dashboard_stats_fast()
RETURNS TABLE (
  total_tickets INTEGER,
  unresolved_tickets INTEGER,
  critical_tickets INTEGER,
  todays_tickets INTEGER,
  top_customers JSONB,
  severity_distribution JSONB
) AS $$
DECLARE
  today_start TIMESTAMPTZ := date_trunc('day', NOW());
  resolved_statuses TEXT[] := ARRAY['협의된 차단 완료', '승인 대기', '오탐 확인 완료', '기 차단 완료', '정탐(승인필요 대상)', '차단 미승인 완료'];
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_tickets,
    COUNT(CASE WHEN NOT (jt.status = ANY(resolved_statuses)) THEN 1 END)::INTEGER as unresolved_tickets,
    COUNT(CASE WHEN jt.severity IN ('critical', 'Critical') THEN 1 END)::INTEGER as critical_tickets,
    COUNT(CASE WHEN jt.created_at >= today_start THEN 1 END)::INTEGER as todays_tickets,
    
    -- 상위 고객사 (JSONB 배열)
    (SELECT jsonb_agg(
      jsonb_build_object('name', customer, 'count', cnt)
      ORDER BY cnt DESC
    ) FROM (
      SELECT customer, COUNT(*) as cnt
      FROM jira_tickets 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY customer
      ORDER BY cnt DESC
      LIMIT 10
    ) top_cust) as top_customers,
    
    -- 심각도 분포 (JSONB 배열)
    (SELECT jsonb_agg(
      jsonb_build_object('severity', severity, 'count', cnt)
      ORDER BY cnt DESC
    ) FROM (
      SELECT severity, COUNT(*) as cnt
      FROM jira_tickets
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY severity
    ) sev_dist) as severity_distribution
    
  FROM jira_tickets jt
  WHERE jt.is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

-- 오래된 데이터 정리 함수
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  cutoff_date TIMESTAMPTZ := NOW() - (days_to_keep || ' days')::INTERVAL;
BEGIN
  -- 오래된 동기화 로그 삭제
  DELETE FROM sync_log 
  WHERE started_at < cutoff_date 
    AND status IN ('completed', 'failed');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- 오래된 히스토리 정리 (옵션)
  -- DELETE FROM jira_ticket_history WHERE changed_at < cutoff_date;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- 6. Row Level Security 설정
-- ===============================

-- RLS 활성화
ALTER TABLE jira_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE jira_ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_settings ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 정책
DROP POLICY IF EXISTS "Allow read access for jira_tickets" ON jira_tickets;
CREATE POLICY "Allow read access for jira_tickets" 
ON jira_tickets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for jira_ticket_history" ON jira_ticket_history;
CREATE POLICY "Allow read access for jira_ticket_history" 
ON jira_ticket_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access for sync_log" ON sync_log;
CREATE POLICY "Allow read access for sync_log" 
ON sync_log FOR SELECT USING (true);

-- 서비스 역할 전체 권한
DROP POLICY IF EXISTS "Allow service role full access to jira_tickets" ON jira_tickets;
CREATE POLICY "Allow service role full access to jira_tickets" 
ON jira_tickets FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access to jira_ticket_history" ON jira_ticket_history;
CREATE POLICY "Allow service role full access to jira_ticket_history" 
ON jira_ticket_history FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access to sync_log" ON sync_log;
CREATE POLICY "Allow service role full access to sync_log" 
ON sync_log FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access to sync_settings" ON sync_settings;
CREATE POLICY "Allow service role full access to sync_settings" 
ON sync_settings FOR ALL USING (auth.role() = 'service_role');

-- ===============================
-- 완료 메시지
-- ===============================

DO $$
BEGIN
  RAISE NOTICE '✅ MetaWatch Jira 동기화 데이터베이스가 초기화되었습니다!';
  RAISE NOTICE '📊 생성된 테이블들:';
  RAISE NOTICE '  - jira_tickets: 모든 Jira 티켓 데이터 저장';
  RAISE NOTICE '  - jira_ticket_history: 티켓 변경 이력 추적'; 
  RAISE NOTICE '  - sync_log: 동기화 작업 모니터링';
  RAISE NOTICE '  - sync_settings: 동기화 설정 관리';
  RAISE NOTICE '🔧 생성된 함수들:';
  RAISE NOTICE '  - upsert_jira_ticket(): 티켓 생성/업데이트';
  RAISE NOTICE '  - get_sync_status(): 동기화 상태 조회';
  RAISE NOTICE '  - get_dashboard_stats_fast(): 빠른 대시보드 통계';
  RAISE NOTICE '  - cleanup_old_data(): 오래된 데이터 정리';
  RAISE NOTICE '🚀 이제 전체 동기화 API를 구현할 준비가 완료되었습니다!';
END $$;