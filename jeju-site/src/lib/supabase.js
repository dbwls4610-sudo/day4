import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경변수가 없어도 앱이 하얗게 죽지 않도록, 안내 배너를 띄울 수 있게 플래그를 내보냅니다.
export const supabaseConfigured = Boolean(url && key);
export const supabase = supabaseConfigured ? createClient(url, key) : null;

// Supabase 에러 메시지를 쉬운 한국어로
export function errMsg(error) {
  const m = (error && error.message) || String(error || '');
  if (/Invalid login credentials/i.test(m)) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (/already registered|already been registered/i.test(m)) return '이미 가입된 이메일이에요. 로그인해 주세요.';
  if (/Email not confirmed/i.test(m)) return '이메일 인증이 아직이에요. 받은 편지함의 확인 메일을 눌러 주세요.';
  if (/at least \d+ characters/i.test(m)) return '비밀번호는 6자 이상이어야 해요.';
  if (/rate limit|too many/i.test(m)) return '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.';
  if (/valid email|invalid email/i.test(m)) return '이메일 형식이 올바르지 않아요.';
  if (/Failed to fetch|NetworkError/i.test(m)) return '네트워크에 연결할 수 없어요.';
  return m;
}
