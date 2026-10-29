import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { errMsg, supabaseConfigured } from '../lib/supabase.js';
import Mascot from '../components/Mascot.jsx';

export default function Signup() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!supabaseConfigured) { setError('Supabase 환경변수가 설정되지 않았어요.'); return; }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 해요.'); return; }
    if (password !== password2) { setError('비밀번호가 서로 달라요.'); return; }
    setBusy(true);
    const { data, error } = await signUp(email.trim(), password, nickname.trim());
    setBusy(false);
    if (error) { setError(errMsg(error)); return; }
    // 이메일 인증을 켜 둔 경우 session 이 null → 메일 확인 안내
    if (data.session) navigate(from, { replace: true }); else setSent(true);
  };

  if (sent) {
    return (
      <div className="auth">
        <div className="auth-card">
          <Mascot size={84} />
          <h2>메일을 보냈어요 💌</h2>
          <p><b>{email}</b> 로 확인 메일을 보냈어요.<br />메일 속 링크를 누르면 가입이 끝나요. 그다음 로그인해 주세요!</p>
          <Link className="btn" to="/login" state={{ from }}>로그인 하러 가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <Mascot size={84} />
        <h2>감귤이 친구가 되어 주세요!</h2>
        <label>닉네임<input value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={20} placeholder="예: 귤귤이" /></label>
        <label>이메일<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></label>
        <label>비밀번호 (6자 이상)<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" /></label>
        <label>비밀번호 확인<input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required autoComplete="new-password" /></label>
        {error && <p className="error">⚠️ {error}</p>}
        <button className="btn" disabled={busy}>{busy ? '가입 중…' : '회원가입'}</button>
        <p className="alt">이미 계정이 있나요? <Link to="/login" state={{ from }}>로그인</Link></p>
      </form>
    </div>
  );
}
