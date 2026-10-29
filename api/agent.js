// api/agent.js — 사용자의 질문을 받아 Gemini 가 find_spots · get_weather 를 스스로 골라 쓰고 추천한다.
// 열쇠는 환경변수 GEMINI_API_KEY 에서만 읽는다.
// 디버깅용: Gemini 서버가 준 응답을 가공하지 않고 raw 에 그대로 담아 돌려준다. 실패해도 숨기지 않는다.

const { TOOLS, RAIN, runTool, toolStep, finish, practiceAgent } = require('../lib/tools');

const MAX_TURNS = 5;                                       // 에이전트 반복은 5번까지
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM = [
  '너는 제주 여행 안내 에이전트야. 존댓말, 짧게, 모르는 건 모른다고 말해.',
  '반드시 도구로 확인한 뒤 답해: get_weather 로 그 지역 날씨를 보고, find_spots 로 장소를 찾아.',
  `판단 규칙: 강수확률 ${RAIN}% 이상이면 실내 위주(indoor: true로 찾기) · 코스는 한 지역 안에서 · find_spots 에 없는 장소는 추천하지 마 · 날씨를 못 가져오면 그렇다고 말해 · 운영시간과 요금은 단정하지 마.`,
  '지역을 말하지 않으면 사용자에게 되묻지 말고 가장 무난한 지역을 골라 그 이유를 judge 에 적어. 날짜를 말하지 않으면 오늘로 봐.',
  '최종 답은 JSON 으로만: {"places":[{"name":"","why":""}],"judge":"한 줄 판단 이유","tip":""} — 장소는 3곳.',
].join('\n');

// Gemini 형식의 도구 설명 (name · description · parameters)
const GEMINI_TOOLS = [{ functionDeclarations: TOOLS.map(t => ({ name: t.name, description: t.description, parameters: t.input_schema })) }];

// Gemini 호출 — 보낸 내용과 받은 내용(status · 본문)을 그대로 raw 에 쌓는다
async function askGemini(key, contents, raw) {
  const request = { systemInstruction: { parts: [{ text: SYSTEM }] }, tools: GEMINI_TOOLS, contents };
  const r = await fetch(URL, { method: 'POST', headers: { 'x-goog-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(request) });
  const text = await r.text();
  let response; try { response = JSON.parse(text); } catch (e) { response = text; }   // JSON 이 아니면 문자열 그대로
  raw.push({ url: URL, status: r.status, request, response });
  if (!r.ok) throw Object.assign(new Error('gemini ' + r.status), { status: r.status });
  return response;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST 로만 물어봐 주세요' });
  const question = String((req.body || {}).question || '').slice(0, 300);
  if (!question.trim()) return res.status(400).json({ error: '질문이 비어 있어요' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(200).json({ ...(await practiceAgent(question)), raw: [], tip: 'GEMINI_API_KEY 환경변수가 없어서 연습 모드로 답했어요.' });

  const raw = [], steps = [];
  const contents = [{ role: 'user', parts: [{ text: question }] }];
  let weather = null;
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {         // 에이전트 반복: 도구 고르기 → 결과 보기 → 다시 판단
      const r = await askGemini(key, contents, raw);
      const content = r.candidates && r.candidates[0] && r.candidates[0].content;
      const parts = (content && content.parts) || [];
      const calls = parts.filter(p => p.functionCall);
      if (calls.length) {
        contents.push(content);                            // 모델이 보낸 그대로 다시 넘긴다
        const results = [];
        for (const p of calls) {
          const { name, args } = p.functionCall;
          const out = await runTool(name, args);
          if (name === 'get_weather') weather = out;
          steps.push({ kind: 'find', text: toolStep(name, args || {}, out) });
          results.push({ functionResponse: { name, response: out } });
        }
        contents.push({ role: 'user', parts: results });
        continue;
      }
      const text = parts.map(p => p.text || '').join('');
      let out;
      try { out = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); }
      catch (e) { return res.status(200).json({ mode: 'ai', steps, text: text || '(Gemini 가 빈 답을 줬어요 — 아래 원본 응답을 확인하세요)', raw }); }
      const places = finish(out.places);
      steps.push({ kind: 'judge', text: out.judge || '판단 이유를 말하지 않았어요' });
      steps.push({ kind: 'act', text: `코스 ${places.length}곳 · 지도 핀 ${places.filter(p => p.lat).length}개` + (places.some(p => !p.inList) ? ' · 목록에 없는 곳은 직접 확인 ⚠' : '') });
      return res.status(200).json({ mode: 'ai', steps, places, judge: out.judge, weather, tip: out.tip || '방문 전 운영 여부를 확인하세요.', raw });
    }
    return res.status(200).json({ mode: 'ai', steps, text: '도구를 너무 여러 번 써서 멈췄어요. 질문을 조금 더 구체적으로 해 주세요.', raw });
  } catch (e) {
    // 원인을 숨기지 않는다: 연습 모드로 덮지 않고 오류와 Gemini 의 원본 응답을 그대로 돌려준다
    return res.status(200).json({ mode: 'error', steps, error: String(e.message || e), raw, tip: 'Gemini 호출이 실패했어요. 아래 원본 응답에서 원인을 확인하세요.' });
  }
};
