import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useFavorites } from '../useFavorites.js';
import PhotoGrid from '../components/PhotoGrid.jsx';

export default function Favorites() {
  const { user, nickname } = useAuth();
  const fav = useFavorites(user);
  const items = useMemo(() => fav.items.map((r) => ({
    id: Number(r.pixabay_id), thumb: r.image_url, large: r.large_url, tags: r.tags, pageURL: r.page_url,
  })), [fav.items]);

  return (
    <section className="gallery">
      <h2 className="page-title">♥ {nickname}님의 보관함</h2>
      {fav.error && (
        <div className="error">
          ⚠️ {fav.error}<br />
          <small>supabase/schema.sql 을 SQL Editor 에서 실행했는지 확인해 주세요.</small>
        </div>
      )}
      {fav.loading && <div className="center-note">불러오는 중… 🍊</div>}
      {!fav.loading && !fav.error && items.length === 0 && (
        <div className="center-note">아직 담은 사진이 없어요. <Link to="/">갤러리에서 ♡ 를 눌러 담아 보세요!</Link></div>
      )}
      <PhotoGrid items={items} favIds={fav.ids} onToggle={(img) => fav.remove(img.id)} />
    </section>
  );
}
