// BlogAuto Pro — 공개 통계 집계 API (ONDA 관제 대시보드 LIVE 연결용)
// GET /api/stats → { ok, members, posts, todayPosts, views, updatedAt }
// 개인정보는 일절 반환하지 않고 집계 숫자만 노출. CORS 공개(ONDA 브라우저에서 호출).
// 30초 KV 캐시로 매 호출마다 전체 회원 순회하지 않도록 보호.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const d = await r.json();
    const raw = d.result;
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== "string") return raw;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "string" ? (() => { try { return JSON.parse(parsed); } catch { return parsed; } })() : parsed;
    } catch { return raw; }
  } catch { return null; }
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`, {
      method: "POST", headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
  } catch {}
}

const CACHE_KEY = "stats:cache";
const CACHE_MS = 30000;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // 캐시 우선
  const cached = await kvGet(CACHE_KEY);
  if (cached && cached.updatedAt && Date.now() - cached.updatedAt < CACHE_MS) {
    return res.status(200).json({ ok: true, cached: true, ...cached });
  }

  const idx = (await kvGet("userIndex")) || [];
  const userIds = Array.isArray(idx) ? idx : [];
  const today = new Date().toISOString().slice(0, 10);

  let members = userIds.length, posts = 0, todayPosts = 0, views = 0;
  for (const uid of userIds) {
    const u = await kvGet(`user:${uid}`);
    const list = (u && u.posts) || [];
    posts += list.length;
    for (const p of list) {
      views += p.views || 0;
      if ((p.createdAt || "").slice(0, 10) === today) todayPosts++;
    }
  }

  const out = { members, posts, todayPosts, views, updatedAt: Date.now() };
  await kvSet(CACHE_KEY, out);
  return res.status(200).json({ ok: true, cached: false, ...out });
}
