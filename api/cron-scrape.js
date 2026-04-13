/**
 * api/cron-scrape.js
 * 체험단 허브 자동 수집 크론잡
 * Vercel Cron이 6시간마다 자동 호출
 * 기존 파일 일절 수정 없음 — 독립 파일
 *
 * 환경변수:
 *   KV_REST_API_URL, KV_REST_API_TOKEN (기존과 동일)
 *   CRON_SECRET (선택 — 설정 시 무단 호출 차단)
 */

const KV_URL      = process.env.KV_REST_API_URL;
const KV_TOKEN    = process.env.KV_REST_API_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

// scrape-campaigns.js 와 동일한 캐시 키 사용
const CACHE_KEY  = "campaigns:data";
const STATUS_KEY = "campaigns:status";

// ── KV 저장 (scrape-campaigns.js 와 동일 방식) ──────
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

// ── 스크래핑 유틸 (scrape-campaigns.js 와 동일) ─────
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
function parseHtml(html, site) {
  const results = [];
  const seen = new Set();
  const re = /<a[^>]+href=["']([^"'#][^"']*?)["'][^>]*>([\s\S]{4,150}?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let [, href, rawText] = m;
    const text = rawText.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (!text || seen.has(text) || !isCampaignLike(text)) continue;
    seen.add(text);
    const fullUrl = href.startsWith("http")
      ? href
      : site.url.replace(/\/$/, "") + (href.startsWith("/") ? href : "/" + href);
    const { reward, rewardVal } = extractReward(text);
    results.push({
      id: `cron_${site.key}_${++gId}`,
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

const SITES = [
  { name: "강남맛집체험단", url: "https://강남맛집.net",         key: "gangnam"     },
  { name: "디너의여왕",     url: "https://dinnerqueen.net",      key: "dinnerqueen" },
  { name: "파블로",         url: "https://pavlovu.com",          key: "pavlovu"     },
  { name: "모두의체험단",   url: "https://www.modan.kr",         key: "modan"       },
  { name: "태그바이",       url: "https://www.tagby.io/recruit", key: "tagby"       },
];

async function scrapeSite(site) {
  const now = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000); // Vercel 10초 제한 대비
  try {
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
    clearTimeout(timer);
    return { name: site.name, ok: false, error: e.name === "AbortError" ? "타임아웃(5초)" : String(e.message || e), campaigns: [], scrapedAt: now };
  }
}

// ── 핸들러 ──────────────────────────────────────────
export default async function handler(req, res) {
  // 보안: CRON_SECRET 설정 시 검증
  if (CRON_SECRET) {
    const auth = (req.headers.authorization || "").trim();
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
  }

  try {
    const results = await Promise.allSettled(SITES.map(s => scrapeSite(s)));
    const siteResults = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { name: SITES[i].name, ok: false, error: "예외 발생", campaigns: [], scrapedAt: new Date().toISOString() }
    );
    const allCampaigns = siteResults.flatMap(r => r.campaigns || []);
    const updatedAt = new Date().toISOString();

    await kvSet(CACHE_KEY, { campaigns: allCampaigns, updatedAt });
    await kvSet(STATUS_KEY, siteResults.map(r => ({
      name: r.name, ok: r.ok, count: r.campaigns?.length || 0,
      error: r.error || null, scrapedAt: r.scrapedAt,
    })));

    return res.status(200).json({ ok: true, total: allCampaigns.length, updatedAt });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
