// BlogAuto Pro - Notion Template API v1.0
// ✅ 키워드 관리
// ✅ 발행 글 현황
// ✅ 월별 수익
// ✅ 아이디어 메모
// ⚠️ 기존 api/auth.js 절대 수정 안함 - 완전 독립 파일

import crypto from "crypto";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || "blogauto-pro-auth-secret-v1";

// ── KV 헬퍼 ──────────────────────────────────────────
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
        if (typeof parsed === "string") {
          try { return JSON.parse(parsed); } catch { return parsed; }
        }
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

// ── 토큰 검증 (auth.js와 동일한 로직) ────────────────
const unb64url = (input) => {
  const normalized = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  return Buffer.from(normalized + pad, "base64").toString();
};

function parseSignedToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(unb64url(body));
    if (!payload?.uid) return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

async function getUidFromToken(token) {
  if (!token) return null;
  const parsed = parseSignedToken(token);
  if (parsed?.uid) return parsed.uid;
  const uid = await kvGet(`session:${token}`);
  return uid || null;
}

// ── 키 네이밍 ─────────────────────────────────────────
const KEY = {
  keywords: (uid) => `notion:${uid}:keywords`,
  posts:    (uid) => `notion:${uid}:posts`,
  revenue:  (uid) => `notion:${uid}:revenue`,
  memos:    (uid) => `notion:${uid}:memos`,
};

// ── 핸들러 ───────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }

  const token = (req.headers.authorization || "").replace("Bearer ", "").trim();
  const uid = await getUidFromToken(token);
  if (!uid) return res.status(401).json({ ok: false, error: "인증 필요" });

  const { action, data } = body || {};

  try {
    // ── 키워드 관리 ──────────────────────────────────
    if (action === "getKeywords") {
      const list = await kvGet(KEY.keywords(uid)) || [];
      return res.json({ ok: true, list });
    }
    if (action === "saveKeyword") {
      // data: { keyword, category, usedAt, memo }
      const list = await kvGet(KEY.keywords(uid)) || [];
      const item = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      list.unshift(item);
      await kvSet(KEY.keywords(uid), list);
      return res.json({ ok: true, item });
    }
    if (action === "deleteKeyword") {
      // data: { id }
      const list = await kvGet(KEY.keywords(uid)) || [];
      const updated = list.filter(k => k.id !== data.id);
      await kvSet(KEY.keywords(uid), updated);
      return res.json({ ok: true });
    }
    if (action === "updateKeyword") {
      // data: { id, ...fields }
      const list = await kvGet(KEY.keywords(uid)) || [];
      const updated = list.map(k => k.id === data.id ? { ...k, ...data } : k);
      await kvSet(KEY.keywords(uid), updated);
      return res.json({ ok: true });
    }

    // ── 발행 글 현황 ─────────────────────────────────
    if (action === "getPosts") {
      const list = await kvGet(KEY.posts(uid)) || [];
      return res.json({ ok: true, list });
    }
    if (action === "savePost") {
      // data: { title, platform, publishedAt, revenue, status, url, keyword }
      const list = await kvGet(KEY.posts(uid)) || [];
      const item = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      list.unshift(item);
      await kvSet(KEY.posts(uid), list);
      return res.json({ ok: true, item });
    }
    if (action === "deletePost") {
      const list = await kvGet(KEY.posts(uid)) || [];
      const updated = list.filter(p => p.id !== data.id);
      await kvSet(KEY.posts(uid), updated);
      return res.json({ ok: true });
    }
    if (action === "updatePost") {
      const list = await kvGet(KEY.posts(uid)) || [];
      const updated = list.map(p => p.id === data.id ? { ...p, ...data } : p);
      await kvSet(KEY.posts(uid), updated);
      return res.json({ ok: true });
    }

    // ── 월별 수익 ────────────────────────────────────
    if (action === "getRevenue") {
      const list = await kvGet(KEY.revenue(uid)) || [];
      return res.json({ ok: true, list });
    }
    if (action === "saveRevenue") {
      // data: { month(YYYY-MM), adsense, coupang, other, memo }
      const list = await kvGet(KEY.revenue(uid)) || [];
      // 같은 월이면 업데이트
      const idx = list.findIndex(r => r.month === data.month);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      } else {
        list.unshift({ id: Date.now().toString(), ...data, createdAt: new Date().toISOString() });
      }
      // 월 기준 정렬 (최신순)
      list.sort((a, b) => b.month.localeCompare(a.month));
      await kvSet(KEY.revenue(uid), list);
      return res.json({ ok: true });
    }
    if (action === "deleteRevenue") {
      const list = await kvGet(KEY.revenue(uid)) || [];
      const updated = list.filter(r => r.id !== data.id);
      await kvSet(KEY.revenue(uid), updated);
      return res.json({ ok: true });
    }

    // ── 아이디어 메모 ─────────────────────────────────
    if (action === "getMemos") {
      const list = await kvGet(KEY.memos(uid)) || [];
      return res.json({ ok: true, list });
    }
    if (action === "saveMemo") {
      // data: { title, content, tags, color }
      const list = await kvGet(KEY.memos(uid)) || [];
      const item = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
      list.unshift(item);
      await kvSet(KEY.memos(uid), list);
      return res.json({ ok: true, item });
    }
    if (action === "deleteMemo") {
      const list = await kvGet(KEY.memos(uid)) || [];
      const updated = list.filter(m => m.id !== data.id);
      await kvSet(KEY.memos(uid), updated);
      return res.json({ ok: true });
    }
    if (action === "updateMemo") {
      const list = await kvGet(KEY.memos(uid)) || [];
      const updated = list.map(m => m.id === data.id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m);
      await kvSet(KEY.memos(uid), updated);
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: "알 수 없는 action" });

  } catch (e) {
    console.error("notion API error:", e);
    return res.status(500).json({ ok: false, error: "서버 오류" });
  }
}
