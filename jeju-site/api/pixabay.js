// Vercel 서버리스 함수: Pixabay API 키를 브라우저에 노출하지 않기 위한 프록시
// 환경변수 PIXABAY_API_KEY 는 서버에서만 읽습니다. (VITE_ 접두사를 붙이지 마세요!)
export default async function handler(req, res) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return res.status(500).json({ error: '서버에 PIXABAY_API_KEY 환경변수가 설정되지 않았어요.' });

  const q = String(req.query.q || 'jeju island').trim().slice(0, 100) || 'jeju island';
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 20);

  const params = new URLSearchParams({
    key,
    q,
    image_type: 'photo',
    safesearch: 'true',
    order: 'popular',
    per_page: '24',
    page: String(page),
  });

  try {
    const r = await fetch('https://pixabay.com/api/?' + params.toString());
    if (!r.ok) return res.status(502).json({ error: `Pixabay 응답 오류 (${r.status})` });
    const data = await r.json();
    // Pixabay 약관: 결과는 24시간 캐시 권장 → CDN 캐시
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json({
      total: data.totalHits || 0,
      hits: (data.hits || []).map((h) => ({
        id: h.id,
        tags: h.tags,
        pageURL: h.pageURL,
        webformatURL: h.webformatURL,
        largeImageURL: h.largeImageURL,
        user: h.user,
        likes: h.likes,
      })),
    });
  } catch (e) {
    return res.status(502).json({ error: 'Pixabay에 연결하지 못했어요.' });
  }
}
