import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useFavorites } from '../useFavorites.js';
import { useCart } from '../cart.jsx';
import PhotoGrid from './PhotoGrid.jsx';

const CHIPS = [
  { label: '🏝 제주', q: 'Jeju island' },
  { label: '🌋 한라산', q: 'Hallasan' },
  { label: '🗿 돌하르방', q: 'Jeju stone statue' },
  { label: '🍊 감귤', q: 'tangerine' },
  { label: '🌼 유채꽃', q: 'canola flower field' },
  { label: '🌊 바다', q: 'Jeju beach' },
  { label: '🌅 성산일출봉', q: 'Seongsan Ilchulbong' },
  { label: '🥾 올레길', q: 'Jeju Olle trail' },
];

const normalize = (h) => ({ id: h.id, thumb: h.webformatURL, large: h.largeImageURL, tags: h.tags, author: h.user, pageURL: h.pageURL });

async function fetchPage(q, page) {
  const r = await fetch(`/api/pixabay?q=${encodeURIComponent(q)}&page=${page}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || '이미지를 불러오지 못했어요.');
  return data;
}

export default function Gallery() {
  const { user } = useAuth();
  const fav = useFavorites(user);
  const cart = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [chip, setChip] = useState(0);
  const [query, setQuery] = useState(CHIPS[0].q);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // 검색어가 바뀌면 1페이지부터 다시
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(''); setItems([]); setPage(1);
    fetchPage(query, 1)
      .then((d) => { if (!cancelled) { setItems(d.hits.map(normalize)); setTotal(d.total); } })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query]);

  const more = async () => {
    const next = page + 1; setLoading(true);
    try { const d = await fetchPage(query, next); setItems((p) => [...p, ...d.hits.map(normalize)]); setPage(next); }
    catch (e) { setError(e.message); }
    setLoading(false);
  };

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const toggleFav = async (img) => {
    if (!user) { navigate('/login', { state: { from: location.pathname, msg: '♥ 보관함은 로그인 후에 쓸 수 있어요.' } }); return; }
    try {
      if (fav.ids.has(img.id)) { await fav.remove(img.id); flash('보관함에서 뺐어요'); }
      else { await fav.add(img); flash('보관함에 담았어요 ♥'); }
    } catch (e) { flash('저장에 실패했어요: ' + e.message); }
  };

  const addToCart = async (img) => {
    if (!user) { navigate('/login', { state: { from: location.pathname, msg: '🛒 장바구니는 로그인 후에 쓸 수 있어요.' } }); return; }
    try { await cart.add(img); flash('장바구니에 담았어요 🛒'); }
    catch (e) { flash('담기에 실패했어요: ' + e.message); }
  };

  const search = (e) => { e.preventDefault(); const t = text.trim(); if (t) { setChip(-1); setQuery(t); } };

  return (
    <section className="gallery" id="gallery">
      <form className="search" onSubmit={search}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="검색어 (영어가 더 잘 나와요) 예: Jeju sunrise" aria-label="이미지 검색" />
        <button className="btn">검색</button>
      </form>
      <div className="chips">
        {CHIPS.map((c, i) => (
          <button key={c.q} className={`chip ${chip === i ? 'on' : ''}`} onClick={() => { setChip(i); setQuery(c.q); }}>{c.label}</button>
        ))}
      </div>

      {error && <div className="error">⚠️ {error}</div>}
      {!error && !loading && items.length === 0 && <div className="center-note">검색 결과가 없어요. 다른 단어로 찾아볼까요? 🍊</div>}

      <PhotoGrid items={items} favIds={fav.ids} onToggle={toggleFav} cartIds={cart.ids} onCart={addToCart} />

      <div className="more">
        {loading && <span>불러오는 중… 🍊</span>}
        {!loading && items.length > 0 && items.length < total && page < 20 && <button className="btn" onClick={more}>사진 더 보기</button>}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
