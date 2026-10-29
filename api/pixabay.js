// Vercel 서버리스 함수: 브라우저에는 키를 노출하지 않고 서버 환경변수로 Pixabay를 호출한다.
module.exports = async (req, res) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY 환경변수가 없습니다.' });
  }

  const q = String(req.query.q || '').trim().slice(0, 100);
  if (!q) {
    return res.status(400).json({ error: '검색어를 입력하세요.' });
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const params = new URLSearchParams({
    key,
    q,
    lang: 'ko',
    image_type: 'photo',
    per_page: '10',
    page: String(page),
    safesearch: 'true',
  });

  try {
    const r = await fetch('https://pixabay.com/api/?' + params.toString());
    if (!r.ok) {
      return res.status(r.status).json({ error: 'Pixabay 요청 실패 (' + r.status + ')' });
    }
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      total: data.totalHits,
      hits: data.hits.map((h) => ({
        id: h.id,
        preview: h.webformatURL,
        page: h.pageURL,
        tags: h.tags,
        user: h.user,
      })),
    });
  } catch (e) {
    return res.status(502).json({ error: 'Pixabay에 연결하지 못했습니다.' });
  }
};
