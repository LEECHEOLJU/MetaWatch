# 🎯 MetaWatch v3.0 - 완전 개발자 백과사전
## 차세대 보안관제센터(SOC) 대시보드 - 종합 기술 문서

![Version](https://img.shields.io/badge/version-v3.0.1-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Platform](https://img.shields.io/badge/platform-Next.js_14-black)
![Database](https://img.shields.io/badge/database-Supabase-green)

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택 및 아키텍처](#기술-스택-및-아키텍처)
3. [프로젝트 구조](#프로젝트-구조)
4. [API 시스템](#api-시스템)
5. [React 컴포넌트](#react-컴포넌트)
6. [AI 분석 시스템](#ai-분석-시스템)
7. [Jira 통합](#jira-통합)
8. [고객사 관리](#고객사-관리)
9. [사용자 가이드](#사용자-가이드)
10. [개발자 가이드](#개발자-가이드)
11. [문제 해결](#문제-해결)
12. [향후 계획](#향후-계획)

---

## 🌟 프로젝트 개요

**MetaWatch v3.0**은 Jira API + Supabase 기반의 고성능 실시간 보안관제센터(SOC) 대시보드입니다. 7개 고객사의 보안이벤트를 실시간으로 모니터링하고, AI 기반 위협 분석을 제공하는 차세대 보안 운영 플랫폼입니다.

### 🎯 핵심 가치
- **실시간 모니터링**: 30초 간격 자동 업데이트
- **AI 위협 분석**: MetaShield AI 통합 분석
- **고객별 맞춤화**: 7개 고객사별 시그니처 색상 시스템
- **고성능 아키텍처**: Database-first 설계로 25초 → 100ms 성능 향상
- **직관적 UI/UX**: 4컬럼 카드 레이아웃, 반응형 디자인

### 🏢 지원 고객사
| 고객사 | 프로젝트 키 | 한글명 | 시그니처 색상 | 특징 |
|--------|------------|--------|--------------|------|
| GOODRICH | GOODRICH | 굿리치 | 🟡 Yellow (#fbbf24) | 항공우주 산업 |
| FINDA | FINDA | 핀다 | 🔵 Blue (#3b82f6) | 핀테크 플랫폼 |
| SAMKOO | SAMKOO | 삼구아이앤씨 | 🟢 Green (#84cc16) | 정보통신 서비스 |
| WCVS | WCVS | 한화위캠버스 | 🟠 Orange (#f97316) | 보안 솔루션 |
| GLN | GLN | GLN | 🩷 Pink-Purple (#d946ef) | 글로벌 로지스틱스 |
| KURLY | KURLY | 컬리 | 🟣 Purple (#a855f7) | 이커머스 플랫폼 |
| ISU | ISU | 이수시스템 | 🔷 Sky Blue (#06b6d4) | 시스템 통합 |

---

## 🏗️ 기술 스택 및 아키텍처

### Frontend 기술 스택
```typescript
{
  "framework": "Next.js 14.2.32",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS 3.3.0",
  "ui_library": "shadcn/ui (Radix UI 기반)",
  "state_management": "React Query v5 (TanStack Query)",
  "animations": "Framer Motion 10.16.4",
  "charts": "Recharts 2.8.0",
  "icons": "Lucide React 0.294.0"
}
```

### Backend 및 외부 연동
```typescript
{
  "database": "Supabase PostgreSQL",
  "api_integration": "Jira REST API v2/v3",
  "ai_services": "Azure OpenAI (GPT-4)",
  "threat_intelligence": ["VirusTotal API", "AbuseIPDB API"],
  "realtime": "React Query 30초 폴링",
  "caching": "Multi-level (React Query + Supabase)"
}
```

### 시스템 아키텍처

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   External APIs │
│   Next.js 14    │◄──►│   Next.js API    │◄──►│   Jira REST API │
│   React Query   │    │   Routes         │    │   Azure OpenAI  │
│   Tailwind CSS  │    │                  │    │   VirusTotal    │
└─────────────────┘    └──────────────────┘    │   AbuseIPDB     │
                                ▲              └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   Supabase      │
                       │   PostgreSQL    │
                       └─────────────────┘
```

---

## 📁 프로젝트 구조

### 디렉토리 구조
```
MetaWatch/
├── 📁 src/
│   ├── 📁 components/           # React 컴포넌트 (34개 파일)
│   │   ├── 📁 dashboard/       # 대시보드 위젯들
│   │   │   ├── UrgentSecurityEventsWidget.tsx    # 메인 이벤트 위젯
│   │   │   ├── CustomerStatusOverview.tsx        # 고객사 상태 테이블
│   │   │   ├── SecurityStatsChart.tsx            # 통계 차트
│   │   │   └── JiraConnectionStatus.tsx          # 연결 상태
│   │   ├── 📁 ai/              # AI 분석 관련
│   │   │   └── AIAnalysisModal.tsx
│   │   ├── 📁 layout/          # 레이아웃 시스템
│   │   │   ├── AppLayout.tsx                     # 메인 레이아웃
│   │   │   ├── Sidebar.tsx                       # 사이드바
│   │   │   └── TopTabs.tsx                       # 상단 탭
│   │   └── 📁 metawatch/       # MetaWatch 대시보드
│   │       ├── MetaWatchDashboard.tsx            # 메인 대시보드
│   │       └── CustomerDashboard.tsx             # 고객사 대시보드
│   ├── 📁 pages/               # Next.js 페이지 및 API
│   │   ├── index.tsx           # 메인 페이지
│   │   └── 📁 api/            # API 엔드포인트 (26개 API)
│   │       ├── 📁 ai/         # AI 분석 API (3개)
│   │       ├── 📁 jira/       # Jira 연동 API (7개)
│   │       ├── 📁 db/         # 데이터베이스 API (2개)
│   │       ├── 📁 sync/       # 동기화 API (6개)
│   │       └── 📁 debug/      # 디버그 API (5개)
│   ├── 📁 config/              # 설정 파일
│   │   └── jira-fields.ts     # Jira 커스텀 필드 (40+ 필드)
│   └── 📁 lib/                 # 유틸리티 라이브러리
│       ├── customer-colors.ts  # 고객사 색상 시스템
│       └── utils.ts           # 공통 유틸 함수
└── 📄 문서
    ├── README.md              # 사용자 가이드
    ├── CLAUDE.md             # 개발자 가이드 (이 파일)
    └── SUPABASE_SETUP.md     # DB 설정 가이드
```

---

## 🔌 API 시스템

### API 구조 개요
총 **26개 API 엔드포인트**를 7개 카테고리로 분류하여 관리합니다.

### 1. AI 분석 시스템 (`/api/ai/`)

#### `POST /api/ai/analyze-event`
**용도**: 종합 AI 보안 이벤트 분석
**처리 시간**: 5-15초
**외부 연동**: Jira API + VirusTotal + AbuseIPDB + Azure OpenAI

**5단계 분석 프로세스**:
1. **Jira 데이터 추출**: 40+ 커스텀 필드 파싱
2. **VirusTotal 조회**: IP 평판 및 위협 정보
3. **AbuseIPDB 조회**: IP 남용 신뢰도 점수
4. **AI 분석**: Azure OpenAI GPT-4 기반 전문 분석
5. **결과 구조화**: 5섹션 MSSP 스타일 리포트

### 2. Jira 직접 연동 (`/api/jira/`)

#### `GET /api/jira/customer-status`
**용도**: 실시간 고객사별 상태 집계
**쿼리 전략**: 42개 개별 JQL 쿼리 (6고객사 × 7상태)
**성능**: 3-5초 (정확성 우선)

#### `GET /api/jira/unresolved-events`
**용도**: 미해결 보안 이벤트 조회
**필터**: 지원 고객사만, 30일 이내, resolution = Unresolved

### 3. 데이터베이스 API (`/api/db/`)

#### `GET /api/db/unresolved-events`
**용도**: 고성능 미해결 이벤트 조회
**성능**: ~100ms (Jira 직접 조회 대비 50배 빠름)

### 4. 동기화 시스템 (`/api/sync/`)

#### `POST /api/sync/full-sync`
**용도**: 전체 데이터베이스 동기화 (일 1회)
**처리량**: 최대 10,000개 티켓

#### `POST /api/sync/realtime-sync`
**용도**: 실시간 동기화 (1분마다)
**범위**: 미해결 티켓 중심

#### `GET /api/sync/status`
**용도**: 동기화 상태 모니터링

---

## ⚛️ React 컴포넌트

### 컴포넌트 아키텍처
총 **34개 React 컴포넌트**를 9개 카테고리로 분류하여 관리합니다.

### 1. 레이아웃 시스템 (`/components/layout/`)

#### `AppLayout.tsx` - 메인 애플리케이션 레이아웃
**역할**: 전체 애플리케이션의 기본 구조 제공
- 헤더: MenuButton + Logo + 현재 탭 + TopTabs + 실시간 상태
- 실시간 표시기: 연결 상태 및 마지막 업데이트 시간
- 디버그 패널: 개발자용 플로팅 인터페이스
- 반응형 디자인: 모바일 우선 설계

#### `Sidebar.tsx` - 사이드바 네비게이션
**애니메이션**: Framer Motion 슬라이드 효과
**프로그램별 동적 메뉴**: MetaWatch vs MetaShield

### 2. 핵심 위젯 (`/components/dashboard/`)

#### `UrgentSecurityEventsWidget.tsx` - 긴급 이벤트 모니터링
**업데이트 주기**: 30초
**레이아웃**: 4컬럼 반응형 그리드

**이벤트 카드 기능**:
- AI 분석 버튼 (보라색 그라디언트)
- Jira 링크 버튼 (파란색 그라디언트)
- 고객사별 색상 코딩
- 시간 표시 및 경과 표시기

#### `CustomerStatusOverview.tsx` - 고객사 상태 테이블
**데이터 소스**: `/api/jira/customer-status` (42개 개별 JQL 쿼리)
**업데이트 주기**: 3분

**상태 우선순위 정렬**:
1. 승인 대기 (즉시 처리 필요)
2. 정탐(승인필요 대상) (검토 필요)
3. 협의된 차단 완료 (완료됨)
4. 기 차단 완료 (자동 완료)
5. 오탐 확인 완료 (오탐 처리)

### 3. AI 분석 시스템 (`/components/ai/`)

#### `AIAnalysisModal.tsx` - AI 분석 모달
**복잡한 2컬럼 레이아웃**:
- **왼쪽**: AI 분석 리포트 (5섹션 MSSP 형식)
- **오른쪽**: IP 평판 + 추출된 티켓 데이터

**AI 리포트 구조**:
1. 🛡️ 탐지 이벤트 분석 요약
2. 🔍 상세 분석
3. ⚠️ 영향 받는 제품 및 조건
4. 🕵️ 대응 방안
5. 🚨 추가 탐지 내역 / 평판 조회

---

## 🤖 AI 분석 시스템

### MCSOC 차단 기준 시스템

#### 3단계 평가 기준
```typescript
interface MCSCOCriteria {
  frequency: {
    value: number;     // 24시간 내 발생 횟수
    threshold: 10;     // 임계값: 10회
    met: boolean;      // 기준 충족 여부
  };
  virusTotal: {
    value: number;     // 악성 탐지 엔진 수
    threshold: 5;      // 임계값: 5개 엔진
    met: boolean;
  };
  abuseIPDB: {
    value: number;     // 총 신고 횟수
    threshold: 500;    // 임계값: 500회
    met: boolean;
  };
  finalRecommendation: '정탐' | '오탐'; // 최종 권고사항
}
```

**최종 결정 로직**: 하나라도 기준을 충족하면 정탐으로 판단

### Azure OpenAI 통합

#### GPT-4 프롬프트 엔지니어링
전문 MSSP 보안 분석가 스타일의 구조화된 분석 수행:

```
## 1. 🛡️ 탐지 이벤트 분석 요약
- 이벤트 개요 및 핵심 내용
- 위협 수준 평가 (Critical/High/Medium/Low)

## 2. 🔍 상세 분석
- 공격 기법 및 전술 분석
- 악성 활동의 구체적 특징

## 3. ⚠️ 영향 받는 제품 및 조건
- 대상 시스템 및 서비스
- 잠재적 피해 범위

## 4. 🕵️ 대응 방안
- 즉시 취해야 할 조치
- 단계별 대응 절차

## 5. 🚨 추가 탐지 내역 / 평판 조회
- 관련 이벤트 패턴
- IP 평판 및 위협 정보 요약
```

---

## 🔗 Jira 통합

### 커스텀 필드 시스템

#### 40+ 커스텀 필드 매핑 (`/config/jira-fields.ts`)

**카테고리별 분류**:
- **basic**: customer, country, severity, accountId
- **detection**: detectionTime, detectionDevice, count, scenario
- **network**: sourceIp, destinationIp, sourcePort, destinationPort
- **threat**: attackType, payload, hashValue, userAgent
- **analysis**: attackPattern, impactAnalysis, threatIntelligence
- **incident**: incidentId, incidentUrl, relatedIncidents

### JQL 쿼리 시스템

#### 고성능 쿼리 전략
```sql
-- 1. 미해결 이벤트 쿼리 (속도 최적화)
filter in ("10066") AND
project in (굿리치, "핀다 프로젝트", "삼구아이앤씨", WCVS, GLN, "컬리 프로젝트", "이수시스템") AND
type = 보안이벤트 AND
resolution = Unresolved AND
created >= -30d
ORDER BY created DESC

-- 2. 고객사별 상태 쿼리 (정확성 최적화)
project = "GOODRICH" AND
type = 보안이벤트 AND
"분석 상태" = "승인 대기" AND
created >= -1d
```

---

## 🎨 고객사 관리

### 시그니처 색상 시스템

#### 색상 팔레트 정의 (`/lib/customer-colors.ts`)
```typescript
interface CustomerColors {
  primary: string;    // 메인 브랜드 색상
  light: string;      // 밝은 변형
  dark: string;       // 어두운 변형
  bg: string;         // 배경색
  border: string;     // 테두리색
}

const customerColorPalettes = {
  GOODRICH: {
    primary: '#fbbf24',   // 밝은 노란색 - 높은 가시성
    light: '#fcd34d',
    dark: '#f59e0b',
    bg: '#fffbeb',
    border: '#fed7aa'
  },
  FINDA: {
    primary: '#3b82f6',   // 전문적인 파란색 - 금융 신뢰성
    light: '#60a5fa',
    dark: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe'
  }
  // ... 모든 고객사 색상 정의
};
```

---

## 👥 사용자 가이드

### SOC 분석가 일일 워크플로

#### 1. 근무 시작 체크리스트 (첫 30분)
```
□ MetaWatch 대시보드 접속 및 연결 상태 확인
□ 실시간 표시기 (Live) 확인 - 초록색 점등 및 펄스 동작
□ Jira 연결 상태 확인 - 모든 프로젝트 초록색 상태
□ 미할당 이벤트 수 확인 (빨간색 카운터)
□ 8시간 이상 경과 이벤트 확인 (주황색 테두리)
□ 새 이벤트 확인 (파란색 "NEW" 배지)
□ 고객사별 상태 개요 검토
```

#### 2. 이벤트 처리 프로세스
```
1. 우선순위 분류:
   - 🔴 High Priority: 미할당 + 8시간 이상 경과
   - 🟠 Medium Priority: 새 이벤트 + High/Critical 우선순위
   - 🟡 Low Priority: 일반 이벤트

2. 상세 분석:
   - 이벤트 카드 클릭 → Jira 티켓 확인
   - AI 분석 버튼 클릭 → MetaShield 분석 실행
   - MCSOC 기준 확인 → 차단 여부 결정

3. 처리 완료:
   - Jira 상태 업데이트
   - 분석 결과 기록
   - 필요시 고객 통보
```

#### 3. AI 분석 활용법

**MetaShield AI 분석 5단계:**
1. **티켓 번호 입력**: GOODRICH-123 형식으로 입력
2. **자동 데이터 수집**: Jira에서 40+ 필드 추출
3. **위협 인텔리전스**: VirusTotal + AbuseIPDB 조회
4. **AI 분석 실행**: Azure OpenAI 기반 전문 분석
5. **결과 확인**: 5섹션 MSSP 스타일 리포트

**MCSOC 차단 기준 해석:**
- 🟢 **빈도 기준**: 24시간 내 10회 이상 → 정탐
- 🟢 **VirusTotal**: 94개 엔진 중 5개 이상 악성 탐지 → 정탐
- 🟢 **AbuseIPDB**: 500회 이상 신고 → 정탐
- ✅ **최종 판정**: 하나라도 기준 충족시 차단 권고

---

## 💻 개발자 가이드

### 개발 환경 설정

#### 1. 로컬 개발 환경
```bash
# Node.js 18+ 설치 확인
node --version  # v18.17.0 이상

# 프로젝트 클론 및 설치
git clone <repository-url>
cd MetaWatch
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집하여 실제 값 입력

# 개발 서버 실행
npm run dev
# http://localhost:3000 접속
```

#### 2. 필수 환경 변수 (`.env.local`)
```bash
# === Jira API 연동 (필수) ===
NEXT_PUBLIC_JIRA_DOMAIN=your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token

# === Supabase 데이터베이스 (필수) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# === AI 분석 서비스 (선택) ===
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name

# === 위협 인텔리전스 (선택) ===
VIRUSTOTAL_API_KEY=your-virustotal-api-key
ABUSEIPDB_API_KEY=your-abuseipdb-api-key
```

#### 3. 코드 품질 도구
```bash
# TypeScript 타입 체크
npm run type-check

# ESLint 코드 검사
npm run lint

# 빌드 테스트
npm run build

# 프로덕션 실행 테스트
npm run start
```

---

## 🔧 문제 해결

### 일반적인 문제 및 해결책

#### 1. 연결 문제

**증상**: 대시보드에 "Connection Lost" 표시 또는 빨간색 Jira 상태 표시기

**해결 단계**:
```bash
# 1단계: 기본 연결 확인
curl -I https://your-metawatch-domain.com

# 2단계: Jira 연결 테스트
curl -u "email:api-token" https://your-jira-domain.atlassian.net/rest/api/2/myself

# 3단계: 환경 변수 확인
# /api/debug/env-check 엔드포인트 호출

# 4단계: 브라우저 캐시 클리어
# Ctrl+Shift+Delete (Chrome/Firefox)
```

#### 2. 데이터 불일치 문제

**증상**: MetaWatch 카운트와 Jira 직접 조회 결과가 다름

**해결 방법**:
```bash
# 1. 동기화 상태 확인
GET /api/sync/status

# 2. 수동 동기화 실행
POST /api/sync/realtime-sync

# 3. Jira 직접 확인
# MetaWatch JQL과 동일한 쿼리로 Jira에서 직접 검색
```

#### 3. AI 분석 실패

**문제 유형별 해결**:
- **티켓 접근 오류**: 티켓 번호 형식 확인 (GOODRICH-123), Jira 프로젝트 접근 권한 확인
- **API 할당량 초과**: VirusTotal/AbuseIPDB 일일 제한, API 키 로테이션 필요
- **AI 분석 타임아웃**: Azure OpenAI 모델 상태 확인, 프롬프트 길이 최적화

### 에러 코드 참조

#### HTTP 상태 코드
```typescript
const errorMessages = {
  400: '잘못된 요청 - 파라미터를 확인하세요',
  401: '인증 실패 - Jira API 토큰을 확인하세요',
  403: '권한 없음 - 프로젝트 접근 권한을 확인하세요',
  404: '리소스 없음 - 티켓 번호나 URL을 확인하세요',
  429: '요청 한도 초과 - 잠시 후 다시 시도하세요',
  500: '서버 오류 - 관리자에게 문의하세요',
  503: '서비스 이용 불가 - Jira 서버 상태를 확인하세요'
};
```

---

## 🚀 향후 계획

### v3.1 - 인증 및 보안 강화 (2024 Q4)

#### 사용자 인증 시스템
- NextAuth.js 기반 SSO 통합 (Google, Azure AD)
- 역할 기반 접근 제어 (SOC 분석가, 시니어 분석가, 관리자)
- 감사 로그 시스템

### v3.2 - 알림 및 자동화 시스템 (2025 Q1)

#### Slack/Teams 통합
- 실시간 보안 알림
- 일일/주간 요약 리포트
- 임계값 기반 자동 알림

#### 자동 워크플로
- 이벤트 기반 자동화 규칙
- 자동 티켓 할당
- 에스컬레이션 자동화

### v3.3 - 고급 분석 및 리포팅 (2025 Q2)

#### 머신러닝 기반 이상 탐지
- 시간당 이벤트 수 이상 탐지
- 고객사별 이상 패턴 분석
- 공격 시그니처 이상 탐지

#### 예측 분석
- 다음 24시간 이벤트 예측
- 트렌드 분석 및 패턴 인식
- 리스크 스코어링

### v4.0 - 차세대 플랫폼 (2025 Q4)

#### 완전 AI 자동화
- 자율 보안 운영 센터 (80% 자동화)
- AI 보안 분석가 시스템
- 지속적 학습 및 개선

#### 차세대 UI/UX
- VR/AR 보안 대시보드
- 자연어 인터페이스
- 3D 위협 시각화

---

## 📚 참고 자료

### 공식 문서
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [React Query v5 Guide](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Jira REST API Reference](https://developer.atlassian.com/cloud/jira/platform/rest/v2/)
- [Supabase Documentation](https://supabase.com/docs)

### 외부 API 문서
- [Azure OpenAI Service](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [VirusTotal API v3](https://developers.virustotal.com/reference)
- [AbuseIPDB API v2](https://docs.abuseipdb.com/)

### 보안 참고 자료
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [OWASP Security Guidelines](https://owasp.org/)

---

## 📞 지원 및 연락처

### 기술 지원
- **이슈 리포팅**: GitHub Issues
- **긴급 문의**: 시스템 관리자 직통
- **기능 요청**: 개발팀 백로그

### 버전 정보
- **현재 버전**: v3.0.1
- **마지막 업데이트**: 2024년 9월
- **다음 릴리스**: v3.1 (2024년 12월 예정)

### 라이선스
- **소프트웨어**: MIT License
- **문서**: Creative Commons Attribution 4.0

---

**MetaWatch v3.0** - 차세대 보안관제센터 플랫폼으로 더 안전한 디지털 환경을 구축하세요! 🛡️✨

*이 문서는 MetaWatch 개발팀이 작성하고 유지관리합니다. 최신 정보는 GitHub 리포지토리를 확인하세요.*