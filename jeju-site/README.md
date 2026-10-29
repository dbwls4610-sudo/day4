# 🍊 감귤이의 제주 갤러리

제주 마스코트 "감귤이"와 함께 보는 **제주 사진 갤러리** (Pixabay 이미지) + **Supabase 회원가입/로그인** + **♥ 내 보관함**.
React + Vite 로 만들었고 Vercel 에 배포합니다.

```
브라우저 ──(이미지 요청)──▶ /api/pixabay (Vercel 서버리스, PIXABAY_API_KEY 보관) ──▶ Pixabay
브라우저 ──(로그인/보관함)──▶ Supabase (anon key + RLS 로 내 데이터만 접근)
```

## 폴더 구조
```
api/pixabay.js          Pixabay 프록시 (API 키를 서버에만 둠)
src/                    React 앱 (페이지: 갤러리, 로그인, 회원가입, 내 보관함)
supabase/schema.sql     보관함 테이블 + RLS 정책 (SQL Editor 에서 실행)
.env.example            환경변수 예시
vercel.json             SPA 라우팅 설정
```

---

## 0. 준비물
- [Node.js LTS](https://nodejs.org) (18 이상) — 설치 후 터미널에서 `node -v` 확인
- Supabase 계정/프로젝트, Pixabay 계정, GitHub 계정, Vercel 계정

## 1. Supabase 설정 (순서대로)
1. 대시보드에서 프로젝트를 엽니다. (이미 만든 `aicompany2's Project` 사용 가능)
2. **키 확인**: 왼쪽 ⚙ **Project Settings → API** (또는 상단 **Connect** 버튼)
   - `Project URL` → **VITE_SUPABASE_URL**
   - `anon` `public` 키 → **VITE_SUPABASE_ANON_KEY**
   - ⚠️ `service_role` 키는 절대 프런트/깃허브/Vercel(VITE_ 변수)에 넣지 마세요.
3. **테이블 만들기**: 왼쪽 **SQL Editor → New query** → `supabase/schema.sql` 내용을 붙여넣고 **Run**
   - Database → Tables 에 `favorites` 가 생기고 RLS 가 켜져 있으면 성공
4. **이메일 로그인 켜기**: **Authentication → Sign In / Providers → Email** 이 Enabled 인지 확인
   - 연습 중에는 **Confirm email** 을 끄면 가입 즉시 로그인돼서 편해요. (운영에서는 켜 두는 것을 권장)
5. **주소 허용(꼭!)**: **Authentication → URL Configuration**
   - Site URL: 배포 후 Vercel 주소 (예: `https://내프로젝트.vercel.app`)
   - Redirect URLs 에 추가: `http://localhost:5173`, `https://내프로젝트.vercel.app`

## 2. Pixabay 키 발급
1. https://pixabay.com 가입/로그인
2. https://pixabay.com/api/docs/ 접속 → 페이지 안에 **내 API 키**가 표시돼요 → **PIXABAY_API_KEY**

## 3. 내 컴퓨터에서 실행
```bash
cd jeju-site
npm install
cp .env.example .env.local     # Windows PowerShell: Copy-Item .env.example .env.local
# .env.local 을 열어 3개 값을 채웁니다
npm run dev                    # http://localhost:5173
```
- 개발 서버가 `/api/pixabay` 도 대신 처리해 주니 별도 설정이 필요 없어요.
- `.env.local` 은 `.gitignore` 에 들어 있어 GitHub 에 올라가지 않아요.

## 4. GitHub 에 올리기
```bash
git init -b main
git add .
git commit -m "Jeju gallery with Supabase auth"
git remote add origin https://github.com/<내계정>/<새저장소>.git
git push -u origin main
```

## 5. Vercel 배포
1. https://vercel.com → **Add New → Project** → GitHub 저장소 **Import**
2. Framework Preset: **Vite** (자동 감지), Build: `npm run build`, Output: `dist`
3. 저장소 루트가 아닌 하위 폴더에 있다면 **Root Directory** 를 그 폴더로 지정
4. **Environment Variables** 에 3개를 등록 (Production/Preview/Development 모두 체크)

   | 이름 | 값 | 공개 여부 |
   |---|---|---|
   | `VITE_SUPABASE_URL` | Supabase Project URL | 브라우저에 포함됨 (괜찮음) |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon public 키 | 브라우저에 포함됨 (RLS 로 보호) |
   | `PIXABAY_API_KEY` | Pixabay 키 | **서버 전용** (VITE_ 붙이지 말 것) |

5. **Deploy** → 완료되면 나온 주소를 위 1-5단계의 Supabase **URL Configuration** 에 등록
6. 환경변수를 나중에 바꿨다면 **Deployments → Redeploy** 해야 반영돼요.

## 문제 해결
| 증상 | 확인할 것 |
|---|---|
| 상단에 노란 경고 배너 | `.env.local`(또는 Vercel 환경변수)의 `VITE_SUPABASE_*` 값 / 개발 서버 재시작 |
| 사진이 안 나오고 `PIXABAY_API_KEY` 오류 | 키 등록 여부, 이름 철자, Vercel 은 Redeploy |
| 가입했는데 로그인이 안 됨 | 이메일 인증 메일 확인 또는 Confirm email 끄기 |
| 보관함 저장 실패 | `supabase/schema.sql` 을 실행했는지, 로그인 상태인지 |
| 인증 메일 링크가 localhost 로 감 | Supabase **Site URL** 을 배포 주소로 변경 |

사진 출처: [Pixabay](https://pixabay.com) (Pixabay 콘텐츠 라이선스).
