// lib/tools.js — 에이전트가 쓰는 도구 2개: find_spots (관광지 찾기) · get_weather (Open-Meteo 날씨)
// 데이터는 jeju_spots.json 의 spots 만 쓴다. 목록에 없는 장소는 돌려주지 않는다.

const DATA = typeof require === 'function' ? require('../jeju_spots.json') : window.JEJU_DATA;   // 서버(Node)와 브라우저 둘 다
const SPOTS = DATA.spots;
const AREA_NAMES = ['동쪽', '서쪽', '서귀포', '제주시'];   // 입력으로 받는 큰 지역
const MAX_SPOTS = 8;
const RAIN = 50;                                           // 판단 규칙: 강수확률 50% 이상이면 실내 위주

// 날씨 조회와 지도 핀에 쓰는 지역 중심 좌표 (장소별 좌표는 데이터에 없다)
const AREA_CENTER = {
  '동쪽': [33.46, 126.88], '서쪽': [33.36, 126.30], '서귀포': [33.2541, 126.5601], '제주시': [33.4996, 126.5312],
  '동쪽(성산)': [33.458, 126.942], '동쪽(구좌)': [33.524, 126.862], '서쪽(한림)': [33.414, 126.265], '서쪽(안덕)': [33.250, 126.310],
};

// ── 도구 ① 관광지 찾기 ──
// area 는 큰 지역 이름 — 데이터의 '동쪽(성산)' · '서쪽(안덕)' 같은 값은 앞부분으로 묶는다.
function find_spots({ area, indoor } = {}) {
  let list = SPOTS.filter(s => !area || s.area === area || s.area.startsWith(area + '('));
  if (indoor === true || indoor === false) list = list.filter(s => s.indoor === indoor);
  return {
    area: area || '전체',
    count: list.length,
    spots: list.slice(0, MAX_SPOTS).map(s => ({ name: s.name, areas: s.area, indoor: s.indoor, desc: s.type })),   // 좌표는 화면용이라 뺀다
  };
}

// ── 도구 ② 날씨 보기 (Open-Meteo 예보, 키 없음) ──
async function get_weather({ area, day } = {}) {
  const c = AREA_CENTER[area] || AREA_CENTER['제주시'], i = day === '내일' ? 1 : 0;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c[0]}&longitude=${c[1]}` +
    '&daily=precipitation_probability_max,temperature_2m_max&timezone=Asia%2FSeoul&forecast_days=2';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('weather ' + r.status);
    const j = await r.json();
    return { ok: true, area: area || '제주시', day: day || '오늘', date: j.daily.time[i],
      rain_prob: j.daily.precipitation_probability_max[i], tmax: Math.round(j.daily.temperature_2m_max[i]), source: 'Open-Meteo 예보' };
  } catch (e) {
    return { ok: false, area, day, note: '날씨를 가져오지 못했어요' };
  }
}

// ── Claude 도구 설명 ──
const find_spots_tool = {
  name: 'find_spots',
  description: '제주 관광지 목록에서 지역(그리고 실내/야외)으로 장소를 찾아 이름 · 지역 · 실내 여부 · 설명을 최대 8곳 돌려준다. 목록 밖 장소는 없다.',
  input_schema: {
    type: 'object',
    properties: {
      area: { type: 'string', enum: AREA_NAMES, description: '찾을 지역: 동쪽 · 서쪽 · 서귀포 · 제주시 중 하나' },
      indoor: { type: 'boolean', description: '실내만 true, 야외만 false, 둘 다면 생략' },
    },
    required: ['area'],
  },
};

const get_weather_tool = {
  name: 'get_weather',
  description: '그 지역의 오늘 또는 내일 강수확률(%)과 최고기온(℃)을 Open-Meteo 예보로 가져온다.',
  input_schema: {
    type: 'object',
    properties: {
      area: { type: 'string', enum: AREA_NAMES, description: '날씨를 볼 지역' },
      day: { type: 'string', enum: ['오늘', '내일'] },
    },
    required: ['area', 'day'],
  },
};

const TOOLS = [find_spots_tool, get_weather_tool];

async function runTool(name, input) {
  return name === 'find_spots' ? find_spots(input || {}) : name === 'get_weather' ? get_weather(input || {}) : { error: '없는 도구' };
}

// ‘생각 과정 보기’에 보일 한 줄
function toolStep(name, input, out) {
  if (name === 'find_spots') return `관광지 찾기 — ${out.area}${input.indoor === true ? ' 실내' : input.indoor === false ? ' 야외' : ''} ${out.count}곳`;
  if (name === 'get_weather') return out.ok ? `날씨 보기 — ${out.area} ${out.day} 강수확률 ${out.rain_prob}% · 최고 ${out.tmax}℃ (${out.source})` : `날씨 보기 — ${out.note}`;
  return name;
}

// ── 에이전트 답을 목록과 대조하고 지도 핀 좌표를 붙인다 ──
const norm = s => String(s || '').replace(/[\s()·\-]/g, '');
const spotOf = name => SPOTS.find(s => norm(s.name) === norm(name)) || SPOTS.find(s => norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name)));
function finish(places) {
  return (places || []).slice(0, 3).map((p, i) => {
    const s = norm(p.name) && spotOf(p.name);
    if (!s) return { name: p.name, why: p.why, inList: false };
    const c = AREA_CENTER[s.area] || AREA_CENTER['제주시'];   // 정확한 위치가 아니라 지역 근처
    return { name: s.name, why: p.why, areas: s.area, indoor: s.indoor, inList: true,
      lat: c[0] + Math.sin(i * 2.4) * 0.03, lon: c[1] + Math.cos(i * 2.4) * 0.03 };
  });
}

// ── 연습 모드: AI 없이 정해 둔 순서(찾기 → 날씨 → 규칙 판단)로 같은 도구를 쓴다 ──
const REGION_WORDS = [['동쪽', ['동쪽', '동부', '성산', '구좌', '표선', '우도']], ['서쪽', ['서쪽', '서부', '애월', '협재', '한림', '안덕']],
  ['서귀포', ['서귀포', '남쪽', '중문', '남원']], ['제주시', ['제주시', '시내', '공항', '구도심']]];
async function practiceAgent(question) {
  const area = (REGION_WORDS.find(([, ws]) => ws.some(w => question.includes(w))) || ['동쪽'])[0];
  const day = /내일/.test(question) ? '내일' : '오늘';
  const steps = [];
  const w = await get_weather({ area, day });
  const askRain = /비\s?(와|오|올)/.test(question);
  const indoorFirst = askRain || (w.ok && w.rain_prob >= RAIN);
  const found = find_spots({ area, indoor: w.ok || askRain ? indoorFirst : undefined });
  steps.push({ kind: 'find', text: toolStep('get_weather', { area, day }, w) });
  steps.push({ kind: 'find', text: toolStep('find_spots', { area, indoor: w.ok || askRain ? indoorFirst : undefined }, found) });
  const judge = askRain ? '질문에 “비”가 있어 실내 위주' : !w.ok ? '날씨를 몰라 실내 · 야외 섞기'
    : indoorFirst ? `강수확률 ${w.rain_prob}% ≥ ${RAIN}% → 실내 위주` : `강수확률 ${w.rain_prob}% < ${RAIN}% → 야외 위주`;
  steps.push({ kind: 'judge', text: judge });
  const places = finish(found.spots.slice(0, 3).map(s => ({ name: s.name, why: s.desc })));
  steps.push({ kind: 'act', text: `${area} 코스 ${places.length}곳 · 지도 핀` });
  return { mode: 'practice', steps, places, judge, weather: w, tip: '연습 모드(정해 둔 순서) · 방문 전 운영 여부를 확인하세요.' };
}

const exported = { find_spots, get_weather, find_spots_tool, get_weather_tool, TOOLS, AREA_NAMES, RAIN, runTool, toolStep, finish, practiceAgent };
if (typeof module !== 'undefined') module.exports = exported;
else window.jejuTools = exported;
