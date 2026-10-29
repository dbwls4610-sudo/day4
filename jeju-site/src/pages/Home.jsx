import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Mascot from '../components/Mascot.jsx';
import Gallery from '../components/Gallery.jsx';

export default function Home() {
  const { user, nickname } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">JEJU · 제주</p>
          <h1>감귤이와 떠나는<br />제주 사진 여행</h1>
          <p>한라산, 돌하르방, 유채꽃, 파란 바다까지. 마음에 드는 사진은 ♥ 로 내 보관함에 담아 보세요!</p>
          <div className="hero-cta">
            {user ? <Link to="/favorites" className="btn">♥ {nickname}님의 보관함</Link> : <Link to="/signup" className="btn">무료로 시작하기</Link>}
            <a href="#gallery" className="btn ghost">사진 구경하기</a>
          </div>
        </div>
        <Mascot size={210} className="hero-mascot" />
        <svg className="wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,64 C240,120 480,0 720,48 C960,96 1200,16 1440,64 L1440,120 L0,120Z" fill="#fffaf0" />
        </svg>
      </section>
      <Gallery />
    </>
  );
}
