# 프로젝트 생성 및 실행 방법 (한글)

## 1. .env.local 파일 예시 (API 키 설정)
```
OPENAI_API_KEY=sk-xxxxxxx   # OpenAI GPT-4o mini API 키
GEMINI_API_KEY=AIzaSyxxxxxx # Google Gemini 1.5 Flash API 키
```
- 실제 키로 교체해서 프로젝트 루트(.env.local)에 저장하세요.
- 키를 변경/추가한 경우 반드시 서버를 재시작해야 합니다.

## 2. 프로젝트 생성 명령어
```bash
npx create-next-app@latest . --use-npm --tailwind --app --eslint --src-dir --import-alias "@/*"
```

## 3. 의존성 설치
```bash
npm install
```

## 4. 개발 서버 실행
```bash
npm run dev
```

## 5. 서버 배포 방법 (Vercel 기준)
- [Vercel](https://vercel.com/)에 회원가입 후, GitHub 저장소와 연동
- Vercel 대시보드에서 "Add Environment Variable"로 아래 환경변수 추가
  - `OPENAI_API_KEY` : OpenAI API 키
  - `GEMINI_API_KEY` : Google Gemini API 키
- "Deploy" 버튼 클릭 시 자동 배포
- 배포 후 주소에서 서비스 확인 가능

## 6. 리눅스 서버 직접 배포 및 실행 방법

### 1) 서버 환경 준비
- Node.js 18 이상, npm 설치 필요 (예: Ubuntu 22.04 기준)

```bash
# Node.js 설치 (공식 LTS 버전)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# git 설치 (필요시)
sudo apt-get install -y git
```

### 2) 프로젝트 코드 서버에 복사
- git clone 또는 파일 직접 업로드

```bash
git clone <YOUR_REPO_URL> translate-wise
cd translate-wise
```

### 3) .env.local 파일 생성 및 API 키 입력
- 프로젝트 루트에 `.env.local` 파일 생성
- 아래 예시 참고(실제 키로 교체)

```
OPENAI_API_KEY=sk-xxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxx
```

### 4) 의존성 설치
```bash
npm install
```

### 5) Next.js 빌드
```bash
npm run build
```

### 6) 프로덕션 서버 실행
```bash
npm start
```
- 기본 포트는 3000번입니다.
- 포트 변경은 환경변수 `PORT`로 지정 가능

### 7) (선택) 백그라운드 실행 및 자동 재시작
- pm2, systemd, forever 등 사용 권장

**pm2 예시:**
```bash
npm install -g pm2
pm2 start npm --name "translate-wise" -- start
pm2 save
pm2 startup
```

## 7. OpenAI, Gemini API 키 발급 방법

### OpenAI GPT-4o mini API 키 발급
1. [OpenAI 회원가입 및 로그인](https://platform.openai.com/signup)
2. [API Keys 페이지](https://platform.openai.com/api-keys)로 이동
3. "Create new secret key" 클릭 후 키 생성
4. 생성된 키를 `.env.local`의 `OPENAI_API_KEY`에 입력

### Google Gemini 1.5 Flash API 키 발급
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속 (구글 계정 필요)
2. "Create API key" 클릭 후 키 생성
3. 생성된 키를 `.env.local`의 `GEMINI_API_KEY`에 입력

- 각 서비스의 무료/유료 정책 및 사용량 제한을 반드시 확인하세요.
- 키 유출에 주의하세요! (절대 공개 저장소에 올리지 마세요)

---

## 8. GitHub에 프로젝트 푸시하는 방법

1. GitHub에서 새 저장소(Repository) 생성
2. 터미널에서 아래 명령어 실행

```bash
# (아직 git 초기화가 안 되어 있다면)
git init

git remote add origin https://github.com/studywithme/translate-wise.git

git add .
git commit -m "프로젝트 최초 커밋"
git branch -M main
git push -u origin main
```

- 이미 git이 연결되어 있다면 `git remote add origin ...` 단계는 생략
- 이후에는 코드 변경 후 아래처럼 커밋/푸시

```bash
git add .
git commit -m "변경 내용 설명"
git push
```

- GitHub Actions, Vercel 등과 연동하면 push 시 자동 배포 가능

---

## 9. Prisma(MySQL) 설정 및 서버 실행 방법

### 1) 패키지 설치
```bash
npm install @prisma/client prisma bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 2) Prisma 클라이언트 생성 및 DB 초기화
```bash
npx prisma generate
npx prisma db push
```
- `prisma/schema.prisma` 파일을 MySQL에 맞게 작성해야 합니다.
- `.env` 파일에 MySQL 연결 정보를 반드시 입력하세요.

### 3) 개발 서버 실행
```bash
npm run dev
```

### 4) 프로덕션 빌드 및 실행
```bash
npm run build
npm start
```

- 서버 실행 전 반드시 DB와 환경변수 설정이 완료되어야 합니다.
- API, 인증, 요금제, 사용량 추적 등은 Prisma(MySQL) 기반으로 동작합니다.

---
