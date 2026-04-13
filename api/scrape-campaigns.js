/**
 * api/scrape-campaigns.js
 * 체험단 허브 — 캠페인 전용 관리자 인증 + Railway 크롤링 트리거
 *
 * [공개] action: "load"               — KV 캐시에서 캠페인 목록 반환
 * [관리자] action: "loginCampaignAdmin" — 캠페인 전용 비번으로 로그인
 * [관리자] action: "logoutCampaignAdmin"— 세션 삭제
 * [관리자] action: "scrape"            — Railway에 크롤링 트리거 (Railway가 KV에 직접 저장)
 * [관리자] action: "status"            — 사이트별 수집 상태 조회
 * [관리자] action: "changeCampaignPw"  — 관리자 비번 변경
 */

import crypto from "crypto";

const KV_URL   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const RAILWAY_URL    = (process.env.RAILWAY_SCRAPER_URL || "").replace(/\/$/, "");
const RAILWAY_SECRET = process.env.SCRAPER_SECRET || "";

const CACHE_KEY     = "campaigns:data";
const STATUS_KEY    = "campaigns:status";
const CAMP_PW_KEY   = "campaign_admin_pw";
const CAMP_SESS_PFX = "campaign_session:";
const DEFAULT_PW    = Buffer.from("캠페인관리1234").toString("base64");

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

// ── 캠페인 전용 세션 검증 ─────────────────────────────
async function checkCampaignAdmin(token) {
  if (!token) return false;
  try {
    const val = await kvGet(`${CAMP_SESS_PFX}${token}`);
    return val === "campaign_admin";
  } catch { return false; }
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
    let storedPw = await kvGet(CAMP_PW_KEY);
    if (!storedPw) {
      await kvSet(CAMP_PW_KEY, DEFAULT_PW);
      storedPw = DEFAULT_PW;
    }
    const inputB64 = Buffer.from(password).toString("base64");
    if (inputB64 !== storedPw) return res.json({ ok: false, error: "비밀번호가 올바르지 않습니다" });
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
    const storedPw = await kvGet(CAMP_PW_KEY) || DEFAULT_PW;
    if (Buffer.from(currentPw || "").toString("base64") !== storedPw)
      return res.json({ ok: false, error: "현재 비밀번호가 올바르지 않습니다" });
    if (!newPw || newPw.length < 4) return res.json({ ok: false, error: "새 비밀번호는 4자 이상이어야 합니다" });
    await kvSet(CAMP_PW_KEY, Buffer.from(newPw).toString("base64"));
    return res.json({ ok: true });
  }

  // ── [관리자] 실시간 스크래핑 ───────────────────────────
  // Railway가 크롤링 후 KV에 직접 저장 — Vercel 타임아웃 없음
  if (action === "scrape") {
    const admin = await checkCampaignAdmin(token);
    if (!admin) return res.json({ ok: false, error: "캠페인 관리자 인증이 필요합니다" });
    if (!RAILWAY_URL) return res.json({ ok: false, error: "RAILWAY_SCRAPER_URL 환경변수 미설정" });

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    fetch(`${RAILWAY_URL}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(RAILWAY_SECRET ? { Authorization: `Bearer ${RAILWAY_SECRET}` } : {}),
      },
      signal: controller.signal,
    }).catch(() => {});

    return res.json({ ok: true, message: "크롤링 시작됨 — 1분 후 새로고침하세요", triggered: true });
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
