import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useCart } from '../cart.jsx';

export default function Cart() {
  const { nickname } = useAuth();
  const cart = useCart();
  const [msg, setMsg] = useState('');

  const run = async (fn) => {
    setMsg('');
    try { await fn(); } catch (e) { setMsg('처리에 실패했어요: ' + e.message); }
  };

  return (
    <section className="gallery">
      <h2 className="page-title">🛒 {nickname}님의 장바구니</h2>
      {cart.error && (
        <div className="error">
          ⚠️ {cart.error}<br />
          <small>supabase/schema.sql 의 cart_items 부분을 SQL Editor 에서 실행했는지 확인해 주세요.</small>
        </div>
      )}
      {msg && <div className="error">⚠️ {msg}</div>}
      {cart.loading && <div className="center-note">불러오는 중… 🍊</div>}
      {!cart.loading && !cart.error && cart.items.length === 0 && (
        <div className="center-note">장바구니가 비었어요. <Link to="/">갤러리에서 🛒 를 눌러 담아 보세요!</Link></div>
      )}

      {cart.items.length > 0 && (
        <>
          <ul className="cart-list">
            {cart.items.map((it) => (
              <li className="cart-row" key={it.id}>
                <img src={it.image_url} alt={it.name} />
                <span className="cart-name">{it.name}</span>
                <span className="qty">
                  <button className="btn ghost" onClick={() => run(() => cart.setQuantity(it.id, it.quantity - 1))} aria-label="수량 줄이기">−</button>
                  <b>{it.quantity}</b>
                  <button className="btn ghost" onClick={() => run(() => cart.setQuantity(it.id, it.quantity + 1))} aria-label="수량 늘리기">＋</button>
                </span>
                <button className="btn ghost" onClick={() => run(() => cart.remove(it.id))}>삭제</button>
              </li>
            ))}
          </ul>
          <div className="cart-foot">
            <span>총 {cart.count}장{cart.total > 0 ? ` · 합계 ${cart.total.toLocaleString()}원` : ''}</span>
            <button className="btn ghost" onClick={() => run(cart.clear)}>모두 비우기</button>
          </div>
        </>
      )}
    </section>
  );
}
