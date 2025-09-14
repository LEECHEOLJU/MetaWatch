-- Customer Issues 테이블 생성 스크립트
-- Supabase 콘솔의 SQL Editor에서 실행하세요

-- 1. 고객 이슈 메인 테이블
CREATE TABLE customer_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'completed', 'on_hold')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  tags TEXT[],
  related_ips TEXT[],
  
  -- 이메일 내용 (JSON 형태로 저장)
  email_content JSONB,
  
  -- AI 분석 결과 (JSON 형태로 저장)  
  ai_analysis JSONB,
  
  -- 인덱스를 위한 추가 필드들
  created_date DATE GENERATED ALWAYS AS (created_at::date) STORED
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_customer_issues_customer_code ON customer_issues(customer_code);
CREATE INDEX idx_customer_issues_priority ON customer_issues(priority);
CREATE INDEX idx_customer_issues_created_at ON customer_issues(created_at DESC);
CREATE INDEX idx_customer_issues_due_date ON customer_issues(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_customer_issues_is_manual ON customer_issues(is_manual);

-- 3. 복합 인덱스 (빈번한 쿼리 조합)
CREATE INDEX idx_customer_issues_customer_priority ON customer_issues(customer_code, priority);
CREATE INDEX idx_customer_issues_priority_created ON customer_issues(priority, created_at DESC);
CREATE INDEX idx_customer_issues_created_date ON customer_issues(created_date);

-- 4. 전문 검색을 위한 인덱스 (제목 + 설명)
CREATE INDEX idx_customer_issues_search ON customer_issues USING gin(to_tsvector('korean', title || ' ' || description));

-- 5. Updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_issues_updated_at 
    BEFORE UPDATE ON customer_issues 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS (Row Level Security) 설정 (선택사항)
ALTER TABLE customer_issues ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (필요에 따라 조정)
CREATE POLICY "Allow all to view customer_issues" ON customer_issues
    FOR SELECT USING (true);

-- 인증된 사용자만 삽입/업데이트/삭제 가능 (필요에 따라 조정)
CREATE POLICY "Allow authenticated users to insert customer_issues" ON customer_issues
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update customer_issues" ON customer_issues
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete customer_issues" ON customer_issues
    FOR DELETE USING (true);

-- 7. 샘플 데이터 삽입 (테스트용)
INSERT INTO customer_issues (
  customer_code,
  customer_name,
  title,
  description,
  priority,
  due_date,
  is_manual,
  tags,
  related_ips,
  email_content,
  ai_analysis
) VALUES 
(
  'GOODRICH',
  '굿리치',
  'IP 192.168.1.100 차단 해제 요청',
  '업무용 서버 IP가 차단되어 접근이 불가합니다. 긴급히 해제 부탁드립니다.',
  'urgent',
  NOW() + INTERVAL '1 day',
  false,
  ARRAY['IP차단', '긴급'],
  ARRAY['192.168.1.100'],
  '{"from": "admin@goodrich.com", "subject": "긴급: IP 차단 해제 요청", "body": "업무용 서버 IP 192.168.1.100이 차단되어 접근이 불가합니다...", "date": "2024-01-15T09:30:00Z"}',
  '{"customer": "GOODRICH", "request_type": "ip_exclude", "priority": "urgent", "ip_addresses": ["192.168.1.100"], "confidence_score": 0.95}'
),
(
  'FINDA',
  '핀다',
  '원격 근무를 위한 VPN 접속 허용',
  '개발자 원격 근무를 위한 VPN 접속 허용 요청드립니다.',
  'normal',
  NOW() + INTERVAL '3 days',
  false,
  ARRAY['VPN', '원격근무'],
  ARRAY['10.0.0.50'],
  '{"from": "dev@finda.co.kr", "subject": "VPN 접속 허용 요청", "body": "안녕하세요. 개발자 원격 근무를 위해 VPN 접속을 허용해주세요...", "date": "2024-01-15T14:20:00Z"}',
  '{"customer": "FINDA", "request_type": "remote_work", "priority": "normal", "ip_addresses": ["10.0.0.50"], "confidence_score": 0.88}'
),
(
  'KURLY',
  '컬리',
  '모의해킹 테스트를 위한 임시 허용 설정',
  '내일 진행될 모의해킹 테스트를 위해 특정 IP 대역에서의 접속을 임시 허용해주세요.',
  'normal',
  NOW() + INTERVAL '2 days',
  true,
  ARRAY['모의해킹', '임시허용'],
  ARRAY['203.241.186.0/24'],
  NULL,
  NULL
);

-- 8. 뷰 생성 (대시보드용 요약 데이터)
CREATE VIEW customer_issues_summary AS
SELECT 
  customer_code,
  customer_name,
  COUNT(*) as total_issues,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
  COUNT(CASE WHEN priority = 'normal' THEN 1 END) as normal_count,
  COUNT(CASE WHEN priority = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN priority = 'on_hold' THEN 1 END) as on_hold_count,
  COUNT(CASE WHEN is_manual = false THEN 1 END) as ai_analyzed_count,
  COUNT(CASE WHEN due_date < NOW() AND priority NOT IN ('completed') THEN 1 END) as overdue_count,
  MAX(created_at) as latest_issue_date
FROM customer_issues
GROUP BY customer_code, customer_name
ORDER BY urgent_count DESC, total_issues DESC;

-- 9. 일별 통계 뷰
CREATE VIEW customer_issues_daily_stats AS
SELECT 
  created_date,
  customer_code,
  customer_name,
  COUNT(*) as daily_count,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_daily_count
FROM customer_issues
GROUP BY created_date, customer_code, customer_name
ORDER BY created_date DESC, daily_count DESC;

-- 스크립트 실행 완료 확인
SELECT 'Customer Issues 테이블이 성공적으로 생성되었습니다!' as result;