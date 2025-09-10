# 🎯 MetaWatch - 보안관제센터(SOC) 대시보드

실시간 Jira 보안이벤트 모니터링을 위한 현대적인 웹 대시보드

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1b/ffffff?text=MetaWatch+SOC+Dashboard)

## 📋 주요 기능

### 🚨 실시간 미해결 이벤트 모니터링
- **30초마다 자동 업데이트**
- **반응형 카드 그리드 레이아웃** (모바일 1열, 태블릿 2열, 데스크톱 3열)
- **우선순위별 색상 구분** (Critical, High, Medium, Low)
- **실시간 상태 표시** (NEW 라벨, 경과 시간)
- **Jira 티켓 직접 연결** (원클릭 이동)

### 📊 고객사별 현황 테이블
- **7개 고객사 실시간 현황** (굿리치, 핀다, 삼구, 한화, GLN, 컬리, 이수)
- **상태별 분류** (미해결, 대기중, 완료)
- **동적 필터링** (1일, 3일, 7일, 30일)
- **2분마다 자동 업데이트**
- **상세 보기 링크** (고객사별 Jira 필터)

### 📈 통계 차트 & 분석
- **다중 차트 뷰** (막대 차트, 원형 차트)
- **분석 카테고리** (고객사별, 상태별, 우선순위별)
- **상세 데이터 테이블** 포함
- **5분마다 자동 업데이트**

### 🔗 시스템 연결 상태
- **Jira API 연결 상태** 실시간 확인
- **연결 문제 시 즉시 알림**
- **API 응답 속도 모니터링**

## 🚀 빠른 시작

### 1. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 정보를 입력하세요:

```bash
# Jira API 설정 (필수)
NEXT_PUBLIC_JIRA_DOMAIN=your-company.atlassian.net
JIRA_EMAIL=your-email@company.com  
JIRA_API_TOKEN=your-jira-api-token

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

## 📁 프로젝트 구조

```
MetaWatch/
├── src/
│   ├── components/
│   │   ├── dashboard/           # 대시보드 위젯들
│   │   │   ├── UrgentSecurityEventsWidget.tsx    # 미해결 이벤트 카드
│   │   │   ├── CustomerStatusOverview.tsx        # 고객사 현황 테이블
│   │   │   └── SecurityStatsChart.tsx           # 통계 차트
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx              # 메인 레이아웃
│   │   └── ui/                  # 공통 UI 컴포넌트
│   ├── pages/
│   │   ├── api/jira/           # Jira API 엔드포인트들  
│   │   │   ├── test-connection.ts               # 연결 상태 확인
│   │   │   ├── security-events.ts              # 보안이벤트 조회
│   │   │   └── unresolved-events.ts            # 미해결 이벤트만 조회
│   │   └── index.tsx           # 메인 대시보드 페이지
│   └── lib/                    # 유틸리티 함수들
├── .env.local                  # 환경 변수 (생성 필요)
├── CLAUDE.md                   # 개발자 가이드
└── README.md                   # 사용자 가이드 (이 파일)
```

## 🔧 지원 고객사

현재 대시보드는 다음 7개 고객사의 보안이벤트를 모니터링합니다:

| 고객사 | Jira 프로젝트 키 | 한글명 |
|--------|-----------------|--------|
| GOODRICH | GOODRICH | 굿리치 |
| FINDA | FINDA | 핀다 |
| SAMKOO | SAMKOO | 삼구아이앤씨 |
| WCVS | WCVS | 한화위캠버스 |
| GLN | GLN | GLN |
| KURLY | KURLY | 컬리 |
| ISU | ISU | 이수시스템 |

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