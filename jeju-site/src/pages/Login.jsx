import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { errMsg, supabaseConfigured } from '../lib/supabase.js';
import Mascot from '../components/Mascot.jsx';

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!supabaseConfigured) { setError('Supabase 환경변수가 설정되지 않았어요.'); return; }
    setBusy(true); setError('');
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setError(errMsg(error)); else navigate(from, { replace: true });
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <Mascot size={84} />
        <h2>다시 만나서 반가워요!</h2>
        {location.state?.msg && <p className="info">{location.state.msg}</p>}
        <label>이메일<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label>
        <label>비밀번호<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••" /></label>
        {error && <p className="error">⚠️ {error}</p>}
        <button className="btn" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button>
        <p className="alt">처음이세요? <Link to="/signup" state={{ from }}>회원가입</Link></p>
      </form>
    </div>
  );
}
