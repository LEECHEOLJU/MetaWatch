# MetaWatch - SOC Dashboard 개발 가이드

## 프로젝트 개요
**MetaWatch**는 보안관제센터(SOC)를 위한 실시간 Jira 대시보드입니다. 
보안 이벤트의 실시간 모니터링, 고객사별 현황 추적, 통계 분석을 제공합니다.

## 기술 스택
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL) 🆕
- **State Management**: React Query (TanStack Query)  
- **Charts**: Recharts
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui (Radix UI 기반)
- **API Integration**: Jira REST API v2

## 현재 구현된 기능

### 1. 실시간 대시보드
- **미해결 보안이벤트 위젯**: 30초마다 업데이트, 카드 그리드 레이아웃
- **고객사별 현황 테이블**: 2분마다 업데이트, 상태별 분류
- **통계 차트**: 5분마다 업데이트, 막대/원형 차트

### 2. Jira 연동
- **연결 상태 확인**: `/api/jira/test-connection` 
- **보안이벤트 조회**: `/api/jira/security-events` (날짜 필터링)
- **미해결 이벤트 조회**: `/api/jira/unresolved-events` (실시간 필터링)

### 3. AI 보안 분석 시스템
- **MetaShield**: 티켓별 AI 분석 대시보드
- **전문 보안 분석**: 5단계 구조화된 MSSP 스타일 분석 리포트
- **위협 인텔리전스**: VirusTotal, AbuseIPDB 연동
- **자동 페이로드 추출**: Jira Description 필드에서 자동 파싱

### 4. 지원 고객사
- 굿리치 (GOODRICH)
- 핀다 (FINDA) 
- 삼구아이앤씨 (SAMKOO)
- 한화위캠버스 (WCVS)
- GLN (GLN)
- 컬리 (KURLY)
- 이수시스템 (ISU)

## 코드 구조

### API 엔드포인트 (`/src/pages/api/`)
```
src/pages/api/
├── db/                          # 🆕 DATABASE 기반 API (고성능)
│   ├── unresolved-events.ts     # DB에서 미해결 이벤트 조회 (메인)
│   └── security-events.ts       # DB에서 통계 데이터 조회
├── sync/                        # 🆕 데이터 동기화 시스템
│   ├── realtime-sync.ts         # 실시간 동기화 (1분마다)
│   ├── full-sync.ts             # 전체 동기화 (일 1회)
│   └── status.ts                # 동기화 상태 확인
├── jira/                        # Jira 직접 연동 (리다이렉트됨)
│   ├── test-connection.ts       # Jira 연결 상태 확인
│   ├── security-events.ts       # 날짜별 보안이벤트 조회 (통계용)
│   └── unresolved-events.ts     # ⚠️ DB API로 리다이렉트
└── ai/
    ├── analyze-event.ts         # AI 보안 분석 메인 엔드포인트
    ├── analyze-event-simple.ts  # 간단한 AI 분석 (개발용)
    └── test.ts                  # AI API 연결 테스트
```

### 컴포넌트 구조 (`/src/components/`)
```
src/components/
├── layout/
│   ├── AppLayout.tsx                 # 메인 앱 레이아웃
│   ├── Sidebar.tsx                   # 사이드바 메뉴
│   ├── TopTabs.tsx                   # 상단 탭 네비게이션
│   └── MenuButton.tsx                # 메뉴 버튼
├── metawatch/                        # MetaWatch 대시보드
│   ├── MetaWatchDashboard.tsx        # 메인 대시보드
│   └── CustomerDashboard.tsx         # 고객사별 대시보드
├── metashield/                       # MetaShield AI 분석
│   └── AIAnalysisDashboard.tsx       # AI 분석 대시보드
├── dashboard/
│   ├── UrgentSecurityEventsWidget.tsx   # 미해결 이벤트 카드 그리드
│   ├── CustomerStatusOverview.tsx       # 고객사별 상태 테이블  
│   └── SecurityStatsChart.tsx           # 통계 차트 위젯
├── ai/
│   └── AIAnalysisModal.tsx           # AI 분석 모달 (2컬럼 레이아웃)
└── ui/                               # shadcn/ui 컴포넌트들
    ├── dialog.tsx                    # 다이얼로그 컴포넌트
    ├── progress.tsx                  # 프로그레스 바
    ├── input.tsx                     # 입력 컴포넌트
    └── hover-action-menu.tsx         # 호버 액션 메뉴
```

### 페이지 (`/src/pages/`)
```
src/pages/
├── index.tsx                # 메인 대시보드 페이지
└── api/                    # API 라우트들
```

## 환경 변수 설정

### 현재 필수 환경변수 (`.env.local`)
```bash
# Jira API 설정
NEXT_PUBLIC_JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token

# 🆕 Supabase 데이터베이스 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI 분석 API 설정
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name

# 보안 분석용 API Keys
VIRUSTOTAL_API_KEY=your-virustotal-api-key
ABUSEIPDB_API_KEY=your-abuseipdb-api-key

# Next.js 설정  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Jira API 토큰 생성 방법
1. Atlassian 계정 설정 → 보안 → API 토큰 생성
2. 토큰을 안전하게 보관하고 환경변수에 설정
3. Basic 인증 방식 사용: `base64(email:api_token)`

## 데이터 플로우 (🆕 DB 기반)

### 🔄 데이터 동기화 시스템
```
Jira REST API → 동기화 시스템 → Supabase PostgreSQL
        ↓              ↓
   실시간 동기화    전체 동기화
  (1분마다 자동)   (일 1회 자동)
```

### 1. 미해결 이벤트 위젯 (🚀 고성능)
```
UrgentSecurityEventsWidget → /api/db/unresolved-events → Supabase DB
↓
필터링된 미해결 티켓만 조회 (지원 고객사만) → 카드 그리드 표시
⚡ 성능: ~100ms (기존 25만개 조회 → DB 1만개 수준)
```

### 2. 고객사 현황 위젯  
```
CustomerStatusOverview → /api/db/security-events → Supabase DB
↓
캐시된 통계 데이터 조회 → 고객사별/상태별 집계 → 테이블 표시
```

### 3. 통계 차트 위젯
```
SecurityStatsChart → /api/db/security-events → Supabase DB
↓
사전 계산된 차트 데이터 조회 → Recharts 렌더링
```

## 주요 개발 패턴

### 1. React Query 사용
```typescript
const { data, isLoading, error, isRefetching } = useQuery({
  queryKey: ['security-events', 'overview', selectedDays],
  queryFn: async () => {
    const response = await fetch(`/api/jira/security-events?days=${selectedDays}`);
    return response.json();
  },
  refetchInterval: 2 * 60 * 1000, // 2분마다 자동 업데이트
});
```

### 2. 에러 처리 패턴
```typescript
if (error) {
  return (
    <Card>
      <CardContent className="flex items-center justify-center h-32">
        <div className="text-center">
          <Icon className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            데이터를 불러올 수 없습니다
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. 상태 관리 패턴
- React Query로 서버 상태 관리
- useState로 로컬 UI 상태 관리 (필터, 선택된 날짜 등)
- 전역 상태 불필요 (각 위젯이 독립적)

## 개발 명령어
```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start

# 타입 체크
npm run type-check

# 린트
npm run lint
```

## 배포 설정

### Render.com 배포 준비사항
1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`  
3. **Node Version**: 18 이상
4. **Environment Variables**: 위의 환경변수들 설정
5. **Auto Deploy**: GitHub 연동시 자동 배포

## 향후 개발 계획

### 1. 인증 시스템 (우선순위: 높음)
```bash
# NextAuth.js 설정 추가
npm install next-auth
```
- Google OAuth 또는 SAML 인증
- 역할 기반 권한 관리 (관리자/운영자/읽기전용)

### 2. Supabase 데이터베이스 연동 (우선순위: 중간)
```bash
# Supabase 클라이언트 설치
npm install @supabase/supabase-js
```

**테이블 설계 예시:**
```sql
-- 사용자 관리
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이슈 관리 로그 
CREATE TABLE issue_management_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_key TEXT NOT NULL,
  action TEXT NOT NULL, -- 'assigned', 'commented', 'resolved'
  user_id UUID REFERENCES users(id),
  customer TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 대시보드 설정
CREATE TABLE dashboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  widget_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. 고급 기능 (우선순위: 낮음)
- **알림 시스템**: Slack/Teams 연동, 이메일 알림
- **리포트 생성**: 주간/월간 보고서 자동 생성
- **성능 모니터링**: 응답시간, 해결률 추적
- **고객사별 대시보드**: 개별 고객사 전용 뷰

### 4. 보안 강화
- **API 키 로테이션**: 정기적인 API 토큰 교체
- **감사 로그**: 모든 API 호출 및 사용자 액션 기록
- **IP 화이트리스트**: 특정 IP에서만 접근 허용

### 5. 성능 최적화
- **Redis 캐싱**: 자주 조회되는 데이터 캐시
- **CDN 연동**: 정적 자원 배포 최적화
- **데이터베이스 인덱싱**: 쿼리 성능 향상

## 문제 해결 가이드

### 1. Jira 연결 오류
- API 토큰 만료 확인
- 도메인 설정 확인
- 네트워크 방화벽 확인

### 2. 데이터가 표시되지 않는 경우
- `/api/jira/test-connection`으로 연결 상태 확인
- 브라우저 개발자 도구에서 네트워크 탭 확인
- 서버 콘솔 로그 확인

### 3. 성능 이슈
- React Query 캐시 설정 조정
- API 호출 빈도 조정 (refetchInterval)
- 페이지네이션 구현

## Jira 커스텀 필드 관리

### 필드 정의 파일
모든 Jira 커스텀 필드 정보가 `/src/config/jira-fields.ts`에 체계적으로 관리됩니다.

### 필드 카테고리
- **basic**: 고객사, 국가, 심각도 등 기본 정보
- **detection**: 탐지시간, 탐지장비, 탐지경로 등 탐지 관련 정보  
- **network**: IP, 포트, 프로토콜 등 네트워크 정보
- **threat**: 공격유형, 해시값, 페이로드 등 위협 정보
- **analysis**: 공격패턴, 영향도, 위협평판 등 분석 정보
- **incident**: 인시던트 ID, URL 등 인시던트 관리 정보

### 사용 방법
```typescript
import { JIRA_CUSTOM_FIELDS, getFieldsByCategory } from '@/config/jira-fields';

// 특정 필드 정보 가져오기
const severityField = JIRA_CUSTOM_FIELDS.severity;

// 카테고리별 필드 가져오기
const detectionFields = getFieldsByCategory('detection');

// API 응답에서 커스텀 필드 접근
const event = securityEvents[0];
const customerInfo = event.customFields.customer;
const attackType = event.attackType; // 직접 노출된 필드
```

### API 응답 구조
```json
{
  "id": "12345",
  "key": "SEC-123",
  "status": "미해결",
  "customFields": {
    "customer": "굿리치",
    "severity": "High", 
    "sourceIp": "192.168.1.100",
    "attackType": "SQL Injection"
  },
  "severity": "High",
  "sourceIp": "192.168.1.100"
}
```

## AI 분석 시스템 상세

### MetaShield AI 분석 기능
- **Azure OpenAI 연동**: GPT-4 기반 전문 보안 분석
- **위협 인텔리전스**: VirusTotal, AbuseIPDB API 연동
- **5단계 분석 리포트**: MSSP 스타일 구조화된 분석 결과
- **실시간 데이터 추출**: Jira 40+ 커스텀 필드 자동 매핑

### AI 분석 프로세스
1. **데이터 수집**: Jira 티켓에서 40+ 필드 추출
2. **위협 인텔리전스**: IP 평판 조회 (VirusTotal, AbuseIPDB)
3. **AI 분석**: Azure OpenAI로 전문 보안 분석 수행
4. **결과 표시**: 2컬럼 레이아웃으로 상세 정보 제공

### 분석 리포트 구조
```
1. 탐지 이벤트 분석 요약
2. 상세 분석
3. 위험도 평가
4. 대응 권고사항
5. 추가 조치 사항
```

### 지원 데이터 필드
- **기본 정보**: 고객사, 국가, 심각도, 탐지시간
- **네트워크**: Source/Destination IP, 포트, 프로토콜
- **위협 정보**: 공격유형, 페이로드, 해시값, 파일경로
- **분석 정보**: 공격패턴, 영향도, 위협평판
- **인시던트**: 인시던트 ID, URL, 관련 정보

## 마지막 업데이트 - v3.0.1 UI/UX 최적화
- **날짜**: 2025-09-14
- **버전**: v3.0.1 🎨 **UI/UX 대대적 개선 + TypeScript 완전 호환**
- **주요 변경사항**: 

### 🎨 UI/UX 혁신 (2025-09-14)
  - **🏠 메인 레이아웃 최적화**: 메인메뉴 세로길이 축소로 공간 효율성 극대화
  - **📱 Jira 연결상태 토글**: 축소형 헤더 + 확장/축소 토글 버튼으로 선택적 정보 표시
  - **🎨 시그니처 색상 시스템**: 각 고객사별 브랜딩 색상 도입 및 모든 UI 컴포넌트 적용
  - **📊 테이블 가시성 향상**: 원형 디자인 → 숫자+밑줄 디자인으로 가독성 최적화
  - **🔵 승인대기 색상**: 어두운 배경에서 잘 보이는 밝은 파랑(#60a5fa)으로 변경
  - **📦 카드 레이아웃**: 3컬럼 → 4컬럼 그리드로 정보 밀도 향상
  - **🎯 상태 우선순위**: 승인대기 → 정탐 → 협의차단 → 기차단 → 오탐 순서 정렬

### 🛠️ 기술적 개선
  - **✅ TypeScript 완전 호환**: Render.com 배포를 위한 모든 타입 오류 해결
  - **⚡ React Query v5**: cacheTime → gcTime 업그레이드
  - **🔄 API 구조 최적화**: 42개 개별 JQL 쿼리로 정확한 고객사별 상태 집계
  - **🎨 고객사 시그니처 색상**: 7개 고객사별 전용 색상 시스템 구축

### 🚀 성능 최적화
  - **📱 4컬럼 카드 레이아웃**: 더 많은 정보를 한 눈에 확인 가능
  - **🔧 컴포넌트 크기 최적화**: AI/링크 버튼, 패딩, 간격 등 전체적 크기 축소
  - **🎯 토글 기능**: 필요시만 상세 정보 확인으로 화면 공간 효율성 극대화

### 🌐 배포 안정성
  - **✅ Render.com 배포 완료**: 모든 TypeScript 오류 해결로 안정적 배포
  - **🔄 실시간 동기화**: 1분마다 자동 동기화 + 일일 전체 동기화 유지
  - **💾 데이터베이스 통합**: Supabase PostgreSQL 기반 고성능 아키텍처 유지

## 이전 버전 (v3.0.0) - DATABASE-FIRST ARCHITECTURE
- **날짜**: 2025-09-12  
- **핵심**: Supabase 데이터베이스 통합 및 성능 최적화