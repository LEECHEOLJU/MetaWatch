# 🚀 MetaWatch Supabase 설정 가이드

## 📋 설정 체크리스트

### 1. Supabase 프로젝트 생성 ✅
- [x] 패키지 설치 완료: `@supabase/supabase-js`, `date-fns`
- [x] 환경 변수 템플릿 추가됨
- [x] Supabase 클라이언트 설정 파일 생성됨

### 2. 환경 변수 설정 필요 ⚠️
`.env.local` 파일에서 다음 값들을 실제 Supabase 값으로 교체해주세요:

```bash
# 현재 템플릿 값들을 실제 값으로 교체
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE  
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE
```

### 3. 데이터베이스 테이블 생성 필요 ⚠️
1. **Supabase 대시보드** → **SQL Editor** 이동
2. `supabase-init.sql` 파일 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭하여 실행
4. 성공 메시지 확인: "✅ MetaWatch Supabase 데이터베이스 초기화가 완료되었습니다!"

## 🏗️ 구현된 기능

### 🎯 스마트 캐싱 시스템
- **1단계**: Supabase 캐시 조회 (< 100ms)
- **2단계**: 캐시 없으면 Jira API 호출 (2-5초)
- **3단계**: 백그라운드에서 캐시 업데이트

### ⚡ 성능 최적화
- **React Query 캐싱**: 5분 staleTime, 30분 cacheTime
- **서버사이드 가공**: 클라이언트 부하 제거
- **자동 배치 처리**: 6시간마다 모든 캐시 갱신

### 📊 실시간 상태 표시
- 🟢 **캐시됨**: 빠른 응답 (Supabase 데이터)
- 🔵 **실시간**: Jira 직접 조회
- 마지막 업데이트 시간 표시

## 📁 새로 생성된 파일들

```
src/
├── lib/
│   └── supabase.ts                    # Supabase 클라이언트 설정
└── pages/api/stats/
    ├── customer/
    │   └── [customerId].ts           # 고객사별 통계 API
    └── refresh.ts                     # 배치 처리 API

supabase-init.sql                      # 데이터베이스 초기화 스크립트
vercel.json                           # Cron Job 설정 (6시간마다)
```

## 🔧 API 엔드포인트

### 고객사 통계 조회
```http
GET /api/stats/customer/goodrich?equipment=all&days=1
```

**응답 예시:**
```json
{
  "customer": "GOODRICH",
  "equipment": "all", 
  "totalEvents": 1247,
  "severityStats": [
    {"name": "High", "value": 45, "color": "#EF4444"}
  ],
  "topSignatures": [
    {"name": "SQL Injection", "value": 23}
  ],
  "lastUpdated": "2025-01-15T10:30:00Z",
  "cached": true
}
```

### 배치 처리 API
```http
POST /api/stats/refresh
Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY
```

## 🗄️ 데이터베이스 구조

### `customers` 테이블
```sql
- id: UUID (기본키)
- code: TEXT (고객사 코드, 예: 'GOODRICH')  
- name: TEXT (고객사명, 예: '굿리치')
```

### `customer_stats_cache` 테이블  
```sql
- customer_code: TEXT (고객사 코드)
- equipment_type: TEXT ('all', 'ips', 'waf')
- stats_date: DATE (통계 날짜)
- stats_hour: INTEGER (시간, 0-23)
- total_events: INTEGER (총 이벤트 수)
- severity_stats: JSONB (심각도별 통계)
- top_signatures: JSONB (상위 시그니처)
- top_attack_ips: JSONB (상위 공격 IP)
- top_countries: JSONB (상위 국가)
- hourly_trend: JSONB (시간별 트렌드)
```

## 🚀 사용 방법

### 1. 환경 변수 설정 후
```bash
npm run dev
```

### 2. 고객사 버튼 클릭
- 첫 로딩: Jira API 직접 호출 (2-5초)
- 이후 로딩: Supabase 캐시 사용 (< 1초)

### 3. 수동 캐시 갱신 (개발/테스트용)
```bash
curl -X POST http://localhost:3000/api/stats/refresh \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

## 📈 성능 비교

| 방식 | 응답 시간 | Jira 부하 | 사용자 경험 |
|------|----------|-----------|-------------|
| **기존 (Jira 직접)** | 2-5초 | 높음 | 답답함 |
| **신규 (Supabase 캐시)** | < 1초 | 낮음 | 쾌적함 |

## ⚠️ 주의사항

1. **환경 변수 보안**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출 금지
2. **용량 관리**: 무료 플랜 500MB 제한, 자동 정리 기능 포함
3. **API 제한**: 무료 플랜 월 50,000 요청 제한

## 🔄 다음 단계 (선택사항)

1. **실시간 구독**: Supabase 실시간 기능으로 자동 UI 업데이트
2. **고급 분석**: 히스토리 데이터 기반 트렌드 분석
3. **알림 시스템**: 임계치 초과시 자동 알림

---

**🎉 설정이 완료되면 고객사 대시보드가 훨씬 빨라집니다!**