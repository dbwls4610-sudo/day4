import { useEffect, useState } from 'react';

export default function PhotoGrid({ items, favIds, onToggle, cartIds, onCart }) {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div className="grid">
        {items.map((img) => {
          const on = favIds.has(Number(img.id));
          return (
            <figure className="card" key={img.id}>
              <img src={img.thumb} alt={img.tags} loading="lazy" onClick={() => setOpen(img)} />
              <button className={`heart ${on ? 'on' : ''}`} onClick={() => onToggle(img)} aria-label={on ? '보관함에서 빼기' : '보관함에 담기'} aria-pressed={on}>{on ? '♥' : '♡'}</button>
              {onCart && (
                <button className={`cart-btn ${cartIds?.has(String(img.id)) ? 'on' : ''}`} onClick={() => onCart(img)} aria-label="장바구니에 담기">🛒</button>
              )}
              <figcaption>{img.tags}</figcaption>
            </figure>
          );
        })}
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
            <img src={open.large || open.thumb} alt={open.tags} />
            <div className="lb-bar">
              <span>{open.tags}{open.author ? ` · by ${open.author}` : ''}</span>
              <span>
                {open.pageURL && <a href={open.pageURL} target="_blank" rel="noreferrer">Pixabay에서 보기</a>}
                <button className="btn ghost" onClick={() => setOpen(null)}>닫기 ✕</button>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
