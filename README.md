# 🕘 수업 교체 & 결보강계획서 앱

React + Supabase 웹앱. 관리자가 전체 교사 시간표를 올려두면, 모든 선생님이 로그인 없이 접속해 공강 시간이 맞는 수업 교체 상대를 찾고 결보강계획서(.docx)를 자동으로 만들 수 있습니다. 만들어진 교체 내역은 주간 단위로 모두가 볼 수 있게 저장됩니다.

---

## 🚀 배포 가이드

### 1단계 — Supabase 설정 (DB + API)

1. [supabase.com](https://supabase.com) 접속 → 무료 계정 가입
2. **New project** 클릭 → 프로젝트 이름 입력 (예: `timetable`) → DB 비밀번호 설정 → **Create**
3. 프로젝트 생성 완료 후 **SQL Editor** 탭 클릭
4. `supabase_schema.sql` 파일 내용 전체 복사 → 붙여넣기 → **Run** 클릭
5. **Settings > API** 에서 다음 두 값을 복사해 둡니다:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

---

### 2단계 — 관리자 비밀번호 설정

원하는 비밀번호를 SHA-256으로 해시 변환합니다.

```
https://emn178.github.io/online-tools/sha256.html
```

예시: 비밀번호 `school1234` → 해시값 복사 → `VITE_ADMIN_PASSWORD_HASH`

---

### 3단계 — Vercel 배포

1. 이 프로젝트를 GitHub에 업로드
   ```bash
   git init
   git add .
   git commit -m "initial"
   git remote add origin https://github.com/아이디/timetable-swap-app.git
   git push -u origin main
   ```

2. [vercel.com](https://vercel.com) → **New Project** → GitHub 연결 → 저장소 선택

3. **Environment Variables** 에 다음 3개 추가:
   ```
   VITE_SUPABASE_URL        = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY   = eyJhbG...
   VITE_ADMIN_PASSWORD_HASH = (2단계에서 복사한 해시값)
   ```

4. **Deploy** 클릭 → 완료! 발급된 주소를 전체 선생님께 공유하면 됩니다.

---

## 📱 사용법

### 모든 선생님 (로그인 불필요)
- **수업 교체** 탭 — 결강 예정 선생님을 선택 → 뺄 수업을 클릭 → 공강 시간이 맞는 교체 후보 중 선택 → 결보강계획서(.docx) 생성 (자동으로 주간 내역에도 저장됨)
- **주간 변경 내역** 탭 — 이번 주(또는 이전/다음 주) 전체 교사의 수업 교체 현황을 한눈에 확인

### 관리자
1. **관리자** 탭 → 비밀번호 입력 (4시간 세션 유지)
2. 학기 초 배포된 "전체 교사 시간표.xlsx" 업로드 → 즉시 모든 선생님에게 반영
3. 학기가 바뀌면 새 파일을 다시 올리면 기존 시간표를 덮어씁니다. 시간표를 내리려면 **삭제** 버튼 사용

---

## 🛠 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 Supabase URL, Key, 비밀번호 해시 입력

# 개발 서버 실행
npm run dev
```

> 💡 `.env` 파일 없이 실행 시 비밀번호 `admin1234` 로 관리자 로그인 가능 (개발 환경 전용). Supabase 연결이 없으면 시간표/주간 내역은 비어 있는 상태로 표시됩니다.

---

## 📁 프로젝트 구조

```
src/
  components/
    TeacherGrid.jsx     # 선택한 선생님의 주간 시간표
    SwapForm.jsx         # 교체 후보 목록 / 교체 확인 / 결보강계획서 정보 패널
    AdminPanel.jsx        # 관리자 로그인 + 시간표 업로드/삭제
    WeeklyLog.jsx         # 주간 교체 내역 조회
  hooks/
    useTimetable.js       # Supabase에서 공유 시간표 조회/업로드/삭제
    useAdminAuth.js        # 관리자 인증 (SHA-256 + sessionStorage)
  lib/
    parseTimetable.js     # 엑셀 시간표 파싱
    swapCandidates.js      # 공강 시간이 맞는 교체 후보 탐색
    swapLog.js              # 교체 내역 저장/조회 (주간 내역)
    generateDocx.js          # 결보강계획서(.docx) 생성
    dateUtils.js
  App.jsx
supabase_schema.sql        # DB 스키마
```
