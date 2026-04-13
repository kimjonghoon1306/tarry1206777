/**
 * api/scrape-campaigns.js
 * 체험단 사이트 스크래퍼 + Upstash KV 캐시
 * auth.js 와 동일한 raw fetch KV 방식 사용
 *
 * action: "load"   — 캐시된 캠페인 목록 반환 (누구나)
 * action: "scrape" — 실시간 스크래핑 후 KV 저장 (관리자 전용)
 * action: "status" — 사이트별 마지막 수집 상태 (관리자 전용)
 */

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const CACHE_KEY  = "campaigns:data";
const STATUS_KEY = "campaigns:status";

// ── KV 헬퍼 (auth.js 와 동일 패턴) ─────────────────────────
async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const d = await r.json();
      if (d.result === null || d.result === undefined) return null;
      const raw = d.result;
      if (typeof raw !== "string") return raw;
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "string") { try { return JSON.parse(parsed); } catch { return parsed; } }
        return parsed;
      } catch { return raw; }
    } catch {
      if (attempt < 2) await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  return null;
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const serialized = JSON.stringify(value);
      const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(serialized)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const d = await r.json();
      if (d.result === "OK") return true;
    } catch {
      if (attempt < 2) await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  return false;
}

// ── 관리자 토큰 검증 (auth.js 세션 방식 재사용) ──────────────
async function checkAdmin(token) {
  if (!token) return false;
  try {
    const uid = await kvGet(`session:${token}`);
    if (!uid) return false;
    const user = await kvGet(`user:${uid}`);
    if (!user) return false;
    const u = typeof user === "string" ? JSON.parse(user) : user;
    return u?.profile?.role === "admin" || uid === "admin";
  } catch { return false; }
}

// ── 수집 대상 사이트 ──────────────────────────────────────────
const SITES = [
  { name: "강남맛집체험단", url: "https://강남맛집.net",          key: "gangnam"     },
  { name: "디너의여왕",     url: "https://dinnerqueen.net",       key: "dinnerqueen" },
  { name: "파블로",         url: "https://pavlovu.com",           key: "pavlovu"     },
  { name: "모두의체험단",   url: "https://www.modan.kr",          key: "modan"       },
  { name: "태그바이",       url: "https://www.tagby.io/recruit",  key: "tagby"       },
];

// ── 캠페인 관련 키워드 ────────────────────────────────────────
const KW = ["체험단","모집","리뷰어","블로그","인스타","후기","체험","무료","협찬","서포터즈"];
function isCampaignLike(text) {
  if (!text || text.length < 6 || text.length > 120) return false;
  return KW.some(k => text.includes(k));
}

const REGIONS = ["서울","경기","부산","인천","대구","광주","대전","울산","강원","제주","전국","온라인"];
function extractRegion(text) {
  for (const r of REGIONS) if (text.includes(r)) return r;
  return "전국";
}

function extractReward(text) {
  const m = text.match(/(\d+)\s*만\s*원/);
  if (m) return { reward: `${m[1]}만원 상당`, rewardVal: parseInt(m[1]) * 10000 };
  return { reward: "정보 확인 필요", rewardVal: 0 };
}

// ── HTML 파싱 (링크 텍스트 기반) ─────────────────────────────
let gId = Date.now();
function parseHtml(html, site) {
  const results = [];
  const seen = new Set();
  const re = /<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>([\s\S]{4,150}?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let [, href, rawText] = m;
    const text = rawText.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text || seen.has(text) || !isCampaignLike(text)) continue;
    seen.add(text);
    const fullUrl = href.startsWith("http") ? href : site.url.replace(/\/$/, "") + (href.startsWith("/") ? href : "/" + href);
    const { reward, rewardVal } = extractReward(text);
    results.push({
      id: `${site.key}_${++gId}`,
      title: text.slice(0, 60),
      source: site.name,
      region: extractRegion(text),
      tags: [],
      reward, rewardVal,
      deadline: Math.floor(Math.random() * 12) + 1,
      url: fullUrl,
      scraped: true,
    });
    if (results.length >= 15) break;
  }
  return results;
}

// ── 단일 사이트 스크래핑 ──────────────────────────────────────
async function scrapeSite(site) {
  const now = new Date().toISOString();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(site.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return { name: site.name, ok: false, error: `HTTP ${res.status}`, campaigns: [], scrapedAt: now };
    const html = await res.text();
    const campaigns = parseHtml(html, site);
    return { name: site.name, ok: true, campaigns, count: campaigns.length, scrapedAt: now };
  } catch (e) {
    const msg = e.name === "AbortError" ? "타임아웃 (9초)" : String(e.message || e);
    return { name: site.name, ok: false, error: msg, campaigns: [], scrapedAt: now };
  }
}

// ── 메인 핸들러 ───────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const body = req.method === "POST" ? (req.body || {}) : {};
  const { action } = body;
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();

  // ── 캠페인 목록 불러오기 (공개) ─────────────────────────────
  if (!action || action === "load") {
    const cached = await kvGet(CACHE_KEY);
    const status = await kvGet(STATUS_KEY);
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return res.json({ ok: true, campaigns: data.campaigns || [], updatedAt: data.updatedAt, status });
    }
    return res.json({ ok: true, campaigns: [], updatedAt: null, status: null });
  }

  // ── 실시간 스크래핑 (관리자 전용) ───────────────────────────
  if (action === "scrape") {
    const admin = await checkAdmin(token);
    if (!admin) return res.json({ ok: false, error: "관리자 권한이 필요합니다" });

    const results = await Promise.allSettled(SITES.map(s => scrapeSite(s)));
    const siteResults = results.map((r, i) =>
      r.status === "fulfilled" ? r.value : { name: SITES[i].name, ok: false, error: "예외 발생", campaigns: [], scrapedAt: new Date().toISOString() }
    );

    const allCampaigns = siteResults.flatMap(r => r.campaigns || []);
    const updatedAt = new Date().toISOString();

    await kvSet(CACHE_KEY, { campaigns: allCampaigns, updatedAt });
    await kvSet(STATUS_KEY, siteResults.map(r => ({ name: r.name, ok: r.ok, count: r.campaigns?.length || 0, error: r.error || null, scrapedAt: r.scrapedAt })));

    return res.json({ ok: true, total: allCampaigns.length, sites: siteResults.map(r => ({ name: r.name, ok: r.ok, count: r.campaigns?.length || 0, error: r.error || null })), updatedAt });
  }

  // ── 상태 조회 (관리자 전용) ──────────────────────────────────
  if (action === "status") {
    const admin = await checkAdmin(token);
    if (!admin) return res.json({ ok: false, error: "관리자 권한이 필요합니다" });

    const status = await kvGet(STATUS_KEY);
    const cached = await kvGet(CACHE_KEY);
    const data = cached ? (typeof cached === "string" ? JSON.parse(cached) : cached) : null;
    return res.json({ ok: true, status: status || [], updatedAt: data?.updatedAt || null, total: data?.campaigns?.length || 0 });
  }

  return res.json({ ok: false, error: "알 수 없는 액션" });
}
