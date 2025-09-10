# MetaWatch Render 배포 가이드

## 배포 준비 완료 상태

✅ Next.js 프로젝트 설정 완료  
✅ 환경 변수 템플릿 생성 (`.env.example`)  
✅ Node.js 버전 명시 (`.nvmrc`)  
✅ Render 설정 파일 생성 (`render.yaml`)  

## Render 배포 단계

### 1. Render 계정 생성 및 연결
1. [Render.com](https://render.com)에 가입
2. GitHub 계정 연결
3. 이 저장소를 GitHub에 푸시

### 2. 새로운 Web Service 생성
1. Render 대시보드에서 "New +" 클릭
2. "Web Service" 선택
3. GitHub 저장소 연결
4. 다음 설정 확인:
   - **Name**: metawatch-dashboard
   - **Environment**: Node
   - **Region**: Singapore (또는 원하는 지역)
   - **Branch**: main
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### 3. 환경 변수 설정
Render 서비스 설정에서 다음 환경 변수들을 추가:

#### 필수 환경 변수
```
NODE_ENV=production
NEXT_PUBLIC_JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=your-random-secret-key-here
```

#### 환경 변수 설정 방법
1. Render 서비스 대시보드 → "Environment" 탭
2. 각 환경 변수를 "Add Environment Variable"로 추가
3. **중요**: `NEXTAUTH_URL`은 배포 후 실제 도메인으로 업데이트

### 4. Jira API 토큰 생성
1. Atlassian 계정 설정 → 보안 → API 토큰 생성
2. 생성된 토큰을 `JIRA_API_TOKEN`에 설정

### 5. NextAuth Secret 생성
```bash
# 터미널에서 실행하여 랜덤 시크릿 생성
openssl rand -base64 32
```

### 6. 배포 및 확인
1. "Create Web Service" 클릭
2. 배포 로그 확인
3. 배포 완료 후 제공되는 URL로 접속 테스트

## 배포 후 설정

### 1. NEXTAUTH_URL 업데이트
배포 완료 후 실제 도메인(예: `https://metawatch-dashboard.onrender.com`)으로 `NEXTAUTH_URL` 환경 변수 업데이트

### 2. 도메인 설정 (선택사항)
- Custom Domain 설정 가능
- DNS 설정 필요

## 문제 해결

### 빌드 실패 시
1. 배포 로그 확인
2. 환경 변수 올바른 설정 확인
3. Node.js 버전 호환성 확인 (현재 18 설정됨)

### Jira 연결 실패 시
1. Jira 도메인 형식 확인 (`domain.atlassian.net`)
2. API 토큰 유효성 확인
3. 이메일 주소 정확성 확인

### 환경 변수 오류 시
1. 모든 필수 환경 변수 설정 확인
2. 특수 문자나 공백 확인
3. NextAuth 시크릿 길이 확인 (최소 32자)

## 자동 배포 설정

`render.yaml` 파일이 포함되어 있어 GitHub 푸시 시 자동 배포됩니다:
- `main` 브랜치 푸시 → 자동 재배포
- 환경 변수는 Render 대시보드에서만 수정 가능

## 예상 비용
- Free 플랜: 월 750시간 무료 (약 1개월 24/7 운영 가능)
- 스피츠다운: 15분 비활성 후 자동 절전
- Cold Start: 첫 요청 시 30초~1분 로딩 시간

## 운영 모니터링
1. Render 대시보드에서 실시간 로그 확인
2. 서비스 상태 모니터링
3. 성능 메트릭 확인