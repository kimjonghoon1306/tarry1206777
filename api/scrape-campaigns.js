/**
 * api/scrape-campaigns.js
 * 체험단 허브 — 스크래퍼 + 캠페인 전용 관리자 인증
 *
 * [공개] action: "load"               — 캐시된 캠페인 목록 반환
 * [관리자] action: "loginCampaignAdmin" — 캠페인 전용 비번으로 로그인
 * [관리자] action: "logoutCampaignAdmin"— 세션 삭제
 * [관리자] action: "scrape"            — 실시간 스크래핑 후 KV 저장
 * [관리자] action: "status"            — 사이트별 수집 상태 조회
 * [관리자] action: "changeCampaignPw"  — 관리자 비번 변경
 *
 * BlogAuto Pro 계정과 완전히 분리된 독립 인증 시스템
 * - 세션 KV 키: campaign_session:{token}  (session:{token} 과 다른 네임스페이스)
 * - sessionStorage 키: campaign_admin_sess (bap_admin_auth 와 다름)
 */

import crypto from "crypto";

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// Railway Puppeteer 서버 (JS 렌더링 사이트용)
// 미설정 시 기존 fetch 방식으로 자동 fallback — 벽돌 없음
const RAILWAY_URL    = (process.env.RAILWAY_SCRAPER_URL || "").replace(/\/$/, "");
const RAILWAY_SECRET = process.env.SCRAPER_SECRET || "";

const CACHE_KEY    = "campaigns:data";
const STATUS_KEY   = "campaigns:status";
const CAMP_PW_KEY  = "campaign_admin_pw";     // 캠페인 전용 비번 KV 키
const CAMP_SESS_PFX = "campaign_session:";    // 세션 KV 접두사 (BlogAuto Pro의 session: 과 분리)

const DEFAULT_PW = Buffer.from("캠페인관리1234").toString("base64");

// ── KV 헬퍼 (auth.js 와 동일 패턴) ─────────────────────
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

async function kvDel(key) {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
  } catch {}
}

// ── 캠페인 전용 세션 검증 (BlogAuto Pro 세션과 완전 분리) ──
async function checkCampaignAdmin(token) {
  if (!token) return false;
  try {
    const val = await kvGet(`${CAMP_SESS_PFX}${token}`);
    return val === "campaign_admin";
  } catch { return false; }
}

// ── 스크래핑 유틸 ─────────────────────────────────────
const KW = ["체험단","모집","리뷰어","블로그","인스타","후기","체험","무료","협찬","서포터즈"];
const REGIONS = ["서울","경기","부산","인천","대구","광주","대전","울산","강원","제주","전국","온라인"];

function isCampaignLike(text) {
  if (!text || text.length < 6 || text.length > 120) return false;
  return KW.some(k => text.includes(k));
}
function extractRegion(text) {
  for (const r of REGIONS) if (text.includes(r)) return r;
  return "전국";
}
function extractReward(text) {
  const m = text.match(/(\d+)\s*만\s*원/);
  if (m) return { reward: `${m[1]}만원 상당`, rewardVal: parseInt(m[1]) * 10000 };
  return { reward: "정보 확인 필요", rewardVal: 0 };
}

let gId = Date.now();

// 사이트별 개별 공고 URL 패턴
// gangnam만 URL 패턴 적용, dinnerqueen은 키워드 매칭
const URL_PATTERNS = {
  gangnam:     /\/cp\/[?]id=\d+/,  // /cp/?id=숫자 패턴
};

// Railway Puppeteer 서버를 통한 JS 렌더링 fetch
// Railway 미설정 시 null 반환 → 호출부에서 일반 fetch로 fallback
async function fetchHtmlPuppeteer(url, timeoutMs = 25000) {
  if (!RAILWAY_URL) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${RAILWAY_URL}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(RAILWAY_SECRET ? { Authorization: `Bearer ${RAILWAY_SECRET}` } : {}),
      },
      body: JSON.stringify({ url, waitFor: 3500 }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? data.html : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function parseHtml(html, site) {
  const results = [];
  const seen = new Set();
  const pattern = URL_PATTERNS[site.key];
  const baseUrl = (() => { try { return new URL(site.url).origin; } catch { return ""; } })();
  const re = /<a[^>]+href=["']([^"'#][^"']*?)["'][^>]*>([\s\S]{2,200}?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let [, href, rawText] = m;
    const text = rawText.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text || text.length < 4) continue;

    if (pattern) {
      // URL 패턴 있는 사이트: 해당 패턴 링크만 수집
      const fullHref = href.startsWith("http") ? href : baseUrl + (href.startsWith("/") ? href : "/" + href);
      if (!pattern.test(fullHref) || seen.has(fullHref)) continue;
      seen.add(fullHref);
      const { reward, rewardVal } = extractReward(text);
      results.push({
        id: `${site.key}_${++gId}`,
        title: text.slice(0, 60),
        source: site.name,
        region: extractRegion(text),
        tags: [],
        reward, rewardVal,
        deadline: Math.floor(Math.random() * 12) + 1,
        url: fullHref,
        scraped: true,
      });
    } else {
      // 패턴 없는 사이트: 키워드 매칭
      if (!isCampaignLike(text) || seen.has(text)) continue;
      seen.add(text);
      const fullUrl = href.startsWith("http") ? href : baseUrl + (href.startsWith("/") ? href : "/" + href);
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
    }
    if (results.length >= 15) break;
  }
  return results;
}
const SITES = [
  { name: "강남맛집체험단", url: "https://xn--939au0g4vj8sq.net", fallback: "http://xn--939au0g4vj8sq.net", key: "gangnam",     timeout: 8000 },
  { name: "디너의여왕",     url: "https://dinnerqueen.net",         key: "dinnerqueen", timeout: 8000 },
  { name: "레뷰",           url: "https://www.revu.net/campaign",    key: "revu",        timeout: 5000 },
  { name: "모두의체험단",   url: "https://www.modan.kr",             key: "modan",       timeout: 5000 },
  { name: "태그바이",       url: "https://www.tagby.io/recruit",     key: "tagby",       timeout: 5000 },
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
};

async function fetchHtml(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: HEADERS });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// 태그바이: Next.js __NEXT_DATA__ 파싱
function parseNextData(html, site) {
  try {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return [];
    const json = JSON.parse(match[1]);
    const props = json?.props?.pageProps;
    if (!props) return [];
    // 다양한 구조 시도
    const items = props.campaigns || props.list || props.data || props.recruits || [];
    if (!Array.isArray(items) || items.length === 0) return [];
    return items.slice(0, 15).map((item, i) => ({
      id: `${site.key}_${Date.now()}_${i}`,
      title: (item.title || item.name || item.campaignName || "").slice(0, 60),
      source: site.name,
      region: extractRegion(item.title || item.name || ""),
      tags: [],
      reward: item.reward || item.rewardAmount || "정보 확인 필요",
      rewardVal: parseInt(item.rewardValue || item.amount || 0) || 0,
      deadline: parseInt(item.dDay || item.deadline || 7) || 7,
      url: item.url || item.link || site.url,
      scraped: true,
    })).filter(c => c.title.length > 4);
  } catch { return []; }
}

async function scrapeSite(site) {
  const now = new Date().toISOString();
  const timeout = site.timeout || 5000;

  // JS 렌더링이 필요한 사이트 목록
  const JS_SITES = ["gangnam", "dinnerqueen"];

  try {
    let html = "";

    if (JS_SITES.includes(site.key)) {
      // 1차 시도: Railway Puppeteer (JS 완전 렌더링)
      html = await fetchHtmlPuppeteer(site.url) || "";

      // Railway 미설정이거나 실패 시 → 기존 fetch fallback
      if (!html) {
        try {
          html = await fetchHtml(site.url, timeout);
        } catch (e) {
          if (site.fallback) {
            html = await fetchHtml(site.fallback, timeout);
          } else {
            throw e;
          }
        }
      }
    } else {
      // 일반 사이트: 기존 fetch 방식 그대로
      try {
        html = await fetchHtml(site.url, timeout);
      } catch (e) {
        if (site.fallback) {
          html = await fetchHtml(site.fallback, timeout);
        } else {
          throw e;
        }
      }
    }

    // 태그바이: Next.js 구조 시도
    if (site.key === "tagby") {
      const nextCampaigns = parseNextData(html, site);
      if (nextCampaigns.length > 0) {
        return { name: site.name, ok: true, campaigns: nextCampaigns, count: nextCampaigns.length, scrapedAt: now };
      }
    }

    // 일반 HTML 파싱
    const campaigns = parseHtml(html, site);
    return { name: site.name, ok: true, campaigns, count: campaigns.length, scrapedAt: now };

  } catch (e) {
    const errMsg = e.name === "AbortError" ? `타임아웃(${timeout/1000}초)` : String(e.message || e);
    return { name: site.name, ok: false, error: errMsg, campaigns: [], scrapedAt: now };
  }
}

// ── 메인 핸들러 ───────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const body  = req.method === "POST" ? (req.body || {}) : {};
  const { action } = body;
  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();

  // ── [공개] 캠페인 목록 로드 ────────────────────────────
  if (!action || action === "load") {
    const cached = await kvGet(CACHE_KEY);
    if (cached) {
      const data = typeof cached === "object" ? cached : JSON.parse(cached);
      return res.json({ ok: true, campaigns: data.campaigns || [], updatedAt: data.updatedAt });
    }
    return res.json({ ok: true, campaigns: [], updatedAt: null });
  }

  // ── [공개] 캠페인 관리자 로그인 ────────────────────────
  if (action === "loginCampaignAdmin") {
    const { password } = body;
    if (!password) return res.json({ ok: false, error: "비밀번호를 입력해주세요" });

    // KV에 저장된 비번 없으면 기본값 사용
    let storedPw = await kvGet(CAMP_PW_KEY);
    if (!storedPw) {
      await kvSet(CAMP_PW_KEY, DEFAULT_PW);
      storedPw = DEFAULT_PW;
    }

    const inputB64 = Buffer.from(password).toString("base64");
    if (inputB64 !== storedPw) return res.json({ ok: false, error: "비밀번호가 올바르지 않습니다" });

    // 세션 토큰 생성 (BlogAuto Pro 세션과 완전히 다른 KV 키 사용)
    const sessionToken = crypto.randomBytes(24).toString("hex");
    await kvSet(`${CAMP_SESS_PFX}${sessionToken}`, "campaign_admin");

    return res.json({ ok: true, token: sessionToken });
  }

  // ── [관리자] 로그아웃 ──────────────────────────────────
  if (action === "logoutCampaignAdmin") {
    if (token) await kvDel(`${CAMP_SESS_PFX}${token}`);
    return res.json({ ok: true });
  }

  // ── [관리자] 비번 변경 ─────────────────────────────────
  if (action === "changeCampaignPw") {
    const admin = await checkCampaignAdmin(token);
    if (!admin) return res.json({ ok: false, error: "인증이 필요합니다" });
    const { currentPw, newPw } = body;
    let storedPw = await kvGet(CAMP_PW_KEY) || DEFAULT_PW;
    if (Buffer.from(currentPw || "").toString("base64") !== storedPw)
      return res.json({ ok: false, error: "현재 비밀번호가 올바르지 않습니다" });
    if (!newPw || newPw.length < 4) return res.json({ ok: false, error: "새 비밀번호는 4자 이상이어야 합니다" });
    await kvSet(CAMP_PW_KEY, Buffer.from(newPw).toString("base64"));
    return res.json({ ok: true });
  }

  // ── [관리자] 실시간 스크래핑 ───────────────────────────
  if (action === "scrape") {
    const admin = await checkCampaignAdmin(token);
    if (!admin) return res.json({ ok: false, error: "캠페인 관리자 인증이 필요합니다" });

    const results = await Promise.allSettled(SITES.map(s => scrapeSite(s)));
    const siteResults = results.map((r, i) =>
      r.status === "fulfilled" ? r.value
      : { name: SITES[i].name, ok: false, error: "예외 발생", campaigns: [], scrapedAt: new Date().toISOString() }
    );
    const allCampaigns = siteResults.flatMap(r => r.campaigns || []);
    const updatedAt = new Date().toISOString();

    await kvSet(CACHE_KEY, { campaigns: allCampaigns, updatedAt });
    await kvSet(STATUS_KEY, siteResults.map(r => ({
      name: r.name, ok: r.ok, count: r.campaigns?.length || 0,
      error: r.error || null, scrapedAt: r.scrapedAt,
    })));

    return res.json({ ok: true, total: allCampaigns.length, updatedAt,
      sites: siteResults.map(r => ({ name: r.name, ok: r.ok, count: r.campaigns?.length || 0, error: r.error || null })) });
  }

  // ── [관리자] 상태 조회 ─────────────────────────────────
  if (action === "status") {
    const admin = await checkCampaignAdmin(token);
    if (!admin) return res.json({ ok: false, error: "캠페인 관리자 인증이 필요합니다" });

    const status = await kvGet(STATUS_KEY);
    const cached = await kvGet(CACHE_KEY);
    const data = cached ? (typeof cached === "object" ? cached : JSON.parse(cached)) : null;
    return res.json({ ok: true, status: status || [], updatedAt: data?.updatedAt || null, total: data?.campaigns?.length || 0 });
  }

  return res.json({ ok: false, error: "알 수 없는 액션" });
}
