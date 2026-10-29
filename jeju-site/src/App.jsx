import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { supabaseConfigured } from './lib/supabase.js';
import Mascot from './components/Mascot.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Favorites from './pages/Favorites.jsx';

function Navbar() {
  const { user, nickname, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const logout = async () => { await signOut(); navigate('/'); };
  return (
    <header className="nav">
      <Link to="/" className="brand"><Mascot size={38} /> <span>감귤이의 제주 갤러리</span></Link>
      <nav>
        <NavLink to="/" end>갤러리</NavLink>
        <NavLink to="/favorites">♥ 내 보관함</NavLink>
        {!loading && (user ? (
          <>
            <span className="me">🍊 {nickname}님</span>
            <button className="btn ghost" onClick={logout}>로그아웃</button>
          </>
        ) : (
          <>
            <NavLink to="/login">로그인</NavLink>
            <Link to="/signup" className="btn">회원가입</Link>
          </>
        ))}
      </nav>
    </header>
  );
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-note">불러오는 중…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname, msg: '보관함은 로그인 후에 쓸 수 있어요.' }} />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      {!supabaseConfigured && (
        <div className="banner">
          ⚠️ Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았어요. README의 설정 순서를 따라 .env.local 을 만들어 주세요. 로그인·회원가입이 동작하지 않아요.
        </div>
      )}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
          <Route path="*" element={<div className="center-note">길을 잃었나요? <Link to="/">갤러리로 돌아가기 🍊</Link></div>} />
        </Routes>
      </main>
      <footer className="footer">
        사진 제공: <a href="https://pixabay.com" target="_blank" rel="noreferrer">Pixabay</a> · Supabase 인증 · Vercel 배포 · 감귤이 캐릭터는 이 사이트의 마스코트예요 🍊
      </footer>
    </>
  );
}
