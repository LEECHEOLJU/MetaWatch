# 🎯 MetaWatch v3.0 - 차세대 보안관제센터(SOC) 대시보드

Jira API + Supabase 기반 고성능 실시간 보안이벤트 모니터링 플랫폼

![Version](https://img.shields.io/badge/version-v3.0.0-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Platform](https://img.shields.io/badge/platform-Render.com-purple)

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1b/ffffff?text=MetaWatch+SOC+Dashboard)

## 📋 주요 기능

### 🚨 실시간 미해결 이벤트 모니터링
- **30초마다 자동 업데이트** - Jira API 직접 호출
- **4컬럼 고밀도 카드 레이아웃** - 더 많은 정보를 한 눈에 확인
- **고객사별 시그니처 색상** - 굿리치(노란색), 핀다(파란색), 삼구(연두색) 등
- **AI 보안 분석 통합** - MetaShield AI 분석 원클릭 실행
- **Jira 티켓 직접 연결** - 새 탭에서 바로 이동

### 📊 고객사별 현황 테이블 (v3.0 대폭 개선)
- **42개 개별 JQL 쿼리** - 각 고객사별 상태별 정확한 집계
- **숫자+밑줄 디자인** - 가독성 최적화로 한 눈에 파악
- **상태 우선순위 정렬** - 승인대기 → 정탐 → 협의차단 → 기차단 → 오탐 순
- **3분마다 자동 업데이트** - 대량 API 호출 최적화
- **원클릭 Jira 이동** - 각 셀 클릭으로 해당 상태 티켓 필터링

### 📈 통계 차트 & 분석
- **다중 차트 뷰** (막대 차트, 원형 차트)
- **분석 카테고리** (고객사별, 상태별, 우선순위별)
- **상세 데이터 테이블** 포함
- **5분마다 자동 업데이트**

### 🔗 시스템 연결 상태 (축소/확장 토글)
- **축소형 헤더** - 공간 효율성 극대화
- **토글 버튼** - 필요할 때만 세부 정보 확인  
- **연결 상태 실시간 모니터링** - 2분마다 자동 체크
- **7개 프로젝트 상태** - 각 고객사별 연결 현황 표시

### 🎨 UI/UX 혁신 (v3.0 신규)
- **레이아웃 최적화** - 메인 메뉴 세로길이 축소
- **시그니처 색상 시스템** - 각 고객사별 브랜딩 색상 통일
- **Jira 상태 축소/확장** - 사용자 선택적 정보 표시
- **카드 크기 최적화** - 4컬럼 레이아웃으로 정보 밀도 향상

## 🚀 빠른 시작

### 1. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 정보를 입력하세요:

```bash
# Jira API 설정 (필수)
NEXT_PUBLIC_JIRA_DOMAIN=your-company.atlassian.net
JIRA_EMAIL=your-email@company.com  
JIRA_API_TOKEN=your-jira-api-token

# 🆕 Supabase 데이터베이스 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI 분석 API 설정 (MetaShield)
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

### 2. Jira API 토큰 생성
1. [Atlassian 계정 설정](https://id.atlassian.com/manage-profile/security/api-tokens)으로 이동
2. "API 토큰 생성" 클릭
3. 토큰 이름 입력 (예: "MetaWatch SOC Dashboard")
4. 생성된 토큰을 복사하여 환경변수에 설정

### 3. 개발 서버 실행
```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

### 4. 연결 상태 확인
대시보드 접속 후 하단의 "Jira 연결 상태" 섹션에서 API 연결을 확인하세요.

## 📁 프로젝트 구조 (v3.0)

```
MetaWatch/
├── src/
│   ├── components/
│   │   ├── dashboard/                          # 📊 대시보드 위젯들
│   │   │   ├── UrgentSecurityEventsWidget.tsx     # 미해결 이벤트 4컬럼 카드
│   │   │   ├── CustomerStatusOverview.tsx         # 고객사 현황 테이블 (42개 JQL)
│   │   │   ├── SecurityStatsChart.tsx             # 통계 차트 (시그니처 색상)
│   │   │   └── JiraConnectionStatus.tsx           # Jira 연결상태 (토글)
│   │   ├── layout/                             # 🎨 레이아웃 시스템
│   │   │   ├── AppLayout.tsx                      # 메인 앱 레이아웃
│   │   │   ├── TopTabs.tsx                        # 상단 탭 (축소형)
│   │   │   └── Sidebar.tsx                        # 사이드바 메뉴
│   │   ├── metawatch/                          # 🎯 MetaWatch 대시보드
│   │   │   ├── MetaWatchDashboard.tsx             # 메인 대시보드
│   │   │   └── CustomerDashboard.tsx              # 고객사별 대시보드
│   │   ├── metashield/                         # 🛡️ AI 보안 분석
│   │   │   └── AIAnalysisDashboard.tsx            # AI 분석 대시보드
│   │   ├── ai/                                 # 🤖 AI 분석 컴포넌트
│   │   │   └── AIAnalysisModal.tsx                # AI 분석 모달 (2컬럼)
│   │   └── ui/                                 # 🔧 공통 UI 컴포넌트
│   ├── pages/
│   │   ├── api/
│   │   │   ├── db/                             # 🆕 DATABASE 기반 API (고성능)
│   │   │   │   ├── unresolved-events.ts           # DB에서 미해결 이벤트 조회
│   │   │   │   └── security-events.ts             # DB에서 통계 데이터 조회
│   │   │   ├── jira/                           # 🔗 Jira 직접 연동
│   │   │   │   ├── test-connection.ts             # Jira 연결 상태 확인
│   │   │   │   ├── customer-status.ts             # 42개 개별 JQL 쿼리
│   │   │   │   ├── security-events.ts             # 날짜별 보안이벤트 조회
│   │   │   │   └── unresolved-events.ts           # 미해결 이벤트 조회
│   │   │   ├── sync/                           # 🔄 데이터 동기화 시스템
│   │   │   │   ├── realtime-sync.ts               # 실시간 동기화 (1분마다)
│   │   │   │   ├── full-sync.ts                   # 전체 동기화 (일 1회)
│   │   │   │   └── status.ts                      # 동기화 상태 확인
│   │   │   └── ai/                             # 🤖 AI 분석 API
│   │   │       ├── analyze-event.ts               # AI 보안 분석 메인
│   │   │       └── test.ts                        # AI API 연결 테스트
│   │   └── index.tsx                           # 메인 대시보드 페이지
│   ├── lib/                                    # 🛠️ 유틸리티 & 설정
│   │   ├── customer-colors.ts                     # 🎨 시그니처 색상 시스템
│   │   └── utils.ts                               # 공통 유틸 함수들
│   └── config/
│       └── jira-fields.ts                      # Jira 커스텀 필드 매핑 (40+ 필드)
├── .env.local                                  # 환경 변수 (생성 필요)
├── CLAUDE.md                                   # 개발자 가이드 (상세)
├── README.md                                   # 사용자 가이드 (이 파일)
├── package.json                                # 의존성 관리
└── .nvmrc                                      # Node.js 버전 관리
```

## 🔧 지원 고객사 (시그니처 색상 시스템)

현재 대시보드는 다음 7개 고객사의 보안이벤트를 모니터링합니다:

| 고객사 | Jira 프로젝트 키 | 한글명 | 🎨 시그니처 색상 |
|--------|-----------------|--------|----------------|
| GOODRICH | GOODRICH | 굿리치 | 🟡 노란색 (#fbbf24) |
| FINDA | FINDA | 핀다 | 🔵 파란색 (#3b82f6) |
| SAMKOO | SAMKOO | 삼구아이앤씨 | 🟢 연두색 (#84cc16) |
| WCVS | WCVS | 한화위캠버스 | 🟠 주황색 (#f97316) |
| GLN | GLN | GLN | 🩷 핑크-보라색 (#d946ef) |
| KURLY | KURLY | 컬리 | 🟣 연보라색 (#a855f7) |
| ISU | ISU | 이수시스템 | 🔷 하늘색 (#06b6d4) |

## 💡 사용 팁

### 실시간 모니터링 최적화
- **미해결 이벤트**: 30초 간격으로 업데이트 (가장 중요)
- **고객사 현황**: 2분 간격으로 업데이트 (안정적 모니터링)  
- **통계 차트**: 5분 간격으로 업데이트 (트렌드 분석)

### 카드 레이아웃 활용
- **데스크톱**: 3열 그리드로 많은 티켓을 한 번에 확인
- **태블릿**: 2열 그리드로 적절한 가독성
- **모바일**: 1열 세로 스크롤로 편리한 모바일 모니터링

### 빠른 액션
- **카드 클릭**: Jira 티켓으로 직접 이동
- **고객사 클릭**: 해당 고객사의 모든 티켓 보기
- **상태 숫자 클릭**: 특정 상태의 티켓만 필터링

## 🎨 UI/UX 특징

### 다크 모드 디자인
- **SOC 환경 최적화**: 장시간 모니터링에 적합한 어두운 테마
- **고대비 색상**: 중요 정보 강조 (빨간색: 미해결, 초록색: 완료)
- **최소한의 눈의 피로**: 부드러운 그라디언트와 그림자

### 반응형 디자인  
- **모든 기기 대응**: 데스크톱, 태블릿, 모바일
- **터치 친화적**: 모바일에서도 쉬운 조작
- **빠른 로딩**: 최적화된 성능

### 실시간 피드백
- **로딩 애니메이션**: 데이터 업데이트 상태 표시
- **펄스 효과**: 새로운 이벤트 강조  
- **부드러운 전환**: Framer Motion 애니메이션

## 🔍 문제 해결

### 연결 문제
```bash
# 1. 환경변수 확인
cat .env.local

# 2. Jira 연결 테스트
curl http://localhost:3000/api/jira/test-connection

# 3. 개발 서버 재시작
npm run dev
```

### 데이터가 표시되지 않는 경우
1. **Jira API 토큰 확인**: 만료되었거나 권한이 부족할 수 있습니다
2. **네트워크 연결**: 방화벽이나 프록시 설정을 확인하세요  
3. **브라우저 콘솔**: F12 개발자 도구에서 에러 메시지 확인

### 성능 문제
1. **새로고침**: 브라우저 캐시 문제일 수 있습니다
2. **인터넷 속도**: Jira API 응답 속도에 따라 로딩 시간이 달라집니다
3. **동시 사용자**: 많은 사용자가 접속 시 서버 부하가 생길 수 있습니다

## 🚀 배포 가이드

### Render.com 배포 (권장)
1. GitHub 레포지토리 연결
2. 빌드 설정:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. 환경 변수 설정 (위의 .env.local 내용)
4. 자동 배포 활성화

### 다른 플랫폼
- **Vercel**: Next.js 최적화
- **Netlify**: JAMstack 배포
- **AWS/Google Cloud**: 커스텀 서버 환경

## 📞 지원 및 문의

### 기술 지원
- **이슈 리포팅**: GitHub Issues 활용
- **기능 요청**: 새로운 기능이 필요할 때
- **버그 리포트**: 문제 발견 시 상세한 설명과 함께

### 향후 계획
- **인증 시스템**: 사용자 로그인 및 권한 관리
- **알림 기능**: Slack, Teams, 이메일 연동
- **고급 분석**: 트렌드 분석, 예측 모델
- **모바일 앱**: 네이티브 모바일 애플리케이션

---

**MetaWatch**로 보안관제 업무의 효율성을 높이세요! 🛡️✨