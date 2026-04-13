import crypto from "crypto";

// BlogAuto Pro - auth v5.0
// ✅ 관리자 비번 KV 서버 저장 (배포해도 초기화 안됨)
// ✅ 회원가입 시 userIndex 등록 (회원 목록 관리)
// ✅ 회원 목록/등급 변경/삭제 관리자 API

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

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
        // 파싱 결과가 또 문자열이면 한 번 더 파싱
        if (typeof parsed === "string") {
          try { return JSON.parse(parsed); } catch { return parsed; }
        }
        return parsed;
      } catch {
        return raw;
      }
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
      const r = await fetch(`${KV_URL}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(["SET", key, JSON.stringify(value)]),
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

// true=존재, false=없음, null=KV오류
async function kvExists(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
      });
      const d = await r.json();
      if (d.result === null || d.result === undefined) return false;
      return true;
    } catch {
      if (attempt < 2) await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  return null;
}

const _mem = {};

async function getUser(userId) {
  const u = await kvGet(`user:${userId}`);
  return u || _mem[`user:${userId}`] || null;
}
async function setUser(userId, data) {
  _mem[`user:${userId}`] = data;
  await kvSet(`user:${userId}`, data);
}
async function getSession(token) {
  const parsed = parseSignedToken(token);
  if (parsed?.uid) return parsed.uid;
  const uid = await kvGet(`session:${token}`);
  return uid || _mem[`session:${token}`] || null;
}
async function setSession(token, userId) {
  _mem[`session:${token}`] = userId;
  await kvSet(`session:${token}`, userId);
}
async function delSession(token) {
  delete _mem[`session:${token}`];
  await kvDel(`session:${token}`);
}
async function getUserIdByEmail(email) {
  const uid = await kvGet(`email:${email}`);
  return uid || _mem[`email:${email}`] || null;
}
async function setEmailIndex(email, userId) {
  _mem[`email:${email}`] = userId;
  await kvSet(`email:${email}`, userId);
}

// ── 회원 인덱스 관리 (목록 조회용) ────────────────────
async function getUserIndex() {
  const idx = await kvGet("userIndex");
  return idx || _mem["userIndex"] || [];
}
async function addToUserIndex(userId) {
  const idx = await getUserIndex();
  if (!idx.includes(userId)) {
    const updated = [...idx, userId];
    _mem["userIndex"] = updated;
    await kvSet("userIndex", updated);
  }
}
async function removeFromUserIndex(userId) {
  const idx = await getUserIndex();
  const updated = idx.filter(id => id !== userId);
  _mem["userIndex"] = updated;
  await kvSet("userIndex", updated);
}

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || "blogauto-pro-auth-secret-v1";

const b64 = (s) => Buffer.from(s).toString("base64");
const b64url = (input) => Buffer.from(typeof input === "string" ? input : JSON.stringify(input))
  .toString("base64")
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");
const unb64url = (input) => {
  const normalized = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  return Buffer.from(normalized + pad, "base64").toString();
};
const signTokenPayload = (payload) => {
  const body = b64url(payload);
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${body}.${sig}`;
};
const parseSignedToken = (token) => {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(body).digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(unb64url(body));
    if (!payload?.uid) return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};
const mkToken = (userId) => signTokenPayload({ uid: userId, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });

// ── 관리자 초기화 (KV 오류 시 비번 절대 덮어쓰지 않음) ──
async function initAdmin() {
  const exists = await kvExists("user:admin");
  if (exists === null) return;  // KV 오류 → 건드리지 않음
  if (exists === true) return;  // admin 존재 → 건드리지 않음
  // 진짜 없는 경우만 생성
  await setUser("admin", {
    profile: { name: "관리자", email: "admin@blogauto.pro", role: "admin", createdAt: new Date().toISOString() },
    password: b64("123456"),
  });
  await setEmailIndex("admin@blogauto.pro", "admin");
}

async function getUserRole(token) {
  if (!token) return null;
  const uid = await getSession(token);
  if (!uid) return null;
  const u = await getUser(uid);
  return { uid, role: u?.profile?.role || "user" };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }
  const { action } = body || {};

  await initAdmin();

  // ── 회원가입 ──────────────────────────────────────────
  if (action === "signup") {
    const { name, userId, email, password } = body;
    if (!name?.trim()) return res.json({ ok: false, error: "이름을 입력해주세요" });
    if (!userId?.trim()) return res.json({ ok: false, error: "아이디를 입력해주세요" });
    if (!email?.trim()) return res.json({ ok: false, error: "이메일을 입력해주세요" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ ok: false, error: "올바른 이메일 형식이 아니에요" });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password)) return res.json({ ok: false, error: "비밀번호는 영문 대소문자+숫자 포함 6자 이상이어야 해요" });
    if (userId.trim() === "admin") return res.json({ ok: false, error: "사용할 수 없는 아이디입니다" });

    const existing = await getUser(userId);
    if (existing) return res.json({ ok: false, error: "이미 사용 중인 아이디예요" });
    const emailOwner = await getUserIdByEmail(email);
    if (emailOwner) return res.json({ ok: false, error: "이미 사용 중인 이메일이에요" });

    const userData = {
      profile: { name, email, role: "user", createdAt: new Date().toISOString() },
      password: b64(password),
    };
    await setUser(userId, userData);
    await setEmailIndex(email, userId);
    await addToUserIndex(userId); // ✅ 회원 목록에 등록
    const tk = mkToken(userId);
    await setSession(tk, userId);
    return res.json({ ok: true, token: tk, user: { id: userId, ...userData.profile } });
  }

  // ── 로그인 ──────────────────────────────────────────
  if (action === "login") {
    let { userId, email, password } = body;
    // 이메일로 로그인 시도 시 userId 조회
    if (!userId && email) {
      userId = await getUserIdByEmail(email.trim());
      if (!userId) return res.json({ ok: false, error: "아이디 또는 비밀번호를 확인해주세요" });
    }
    const u = await getUser(userId);
    if (!u) return res.json({ ok: false, error: "아이디 또는 비밀번호를 확인해주세요" });
    if (u.password !== b64(password)) return res.json({ ok: false, error: "아이디 또는 비밀번호를 확인해주세요" });
    const tk = mkToken(userId);
    await setSession(tk, userId);
    return res.json({ ok: true, token: tk, user: { id: userId, ...u.profile } });
  }

  // ── 아이디 찾기 ──────────────────────────────────────
  if (action === "find-id") {
    const { email } = body;
    if (!email?.trim()) return res.json({ ok: false, error: "이메일을 입력해주세요" });
    const userId = await getUserIdByEmail(email.trim());
    if (!userId) return res.json({ ok: false, error: "해당 이메일로 가입된 계정을 찾을 수 없어요" });
    const masked = userId.length > 3
      ? userId.slice(0, 2) + "*".repeat(userId.length - 3) + userId.slice(-1)
      : userId[0] + "*".repeat(userId.length - 1);
    return res.json({ ok: true, userId: masked });
  }

  // ── 비밀번호 초기화 ──────────────────────────────────
  if (action === "reset-password") {
    const { userId, email } = body;
    if (!userId?.trim() || !email?.trim()) return res.json({ ok: false, error: "아이디와 이메일을 모두 입력해주세요" });
    const u = await getUser(userId);
    if (!u || u.profile.email !== email.trim()) return res.json({ ok: false, error: "아이디 또는 이메일 정보가 올바르지 않아요" });
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const tempPw = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    u.password = b64(tempPw);
    u.tempPassword = true;
    await setUser(userId, u);
    return res.json({ ok: true, message: "임시 비밀번호가 발급되었습니다", tempPw });
  }

  // ── 비밀번호 변경 (일반 회원) ────────────────────────
  if (action === "changePassword") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const { currentPassword, newPassword } = body;
    const u = await getUser(uid);
    if (u.password !== b64(currentPassword)) return res.json({ ok: false, error: "현재 비밀번호가 올바르지 않아요" });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(newPassword)) return res.json({ ok: false, error: "새 비밀번호는 영문 대소문자+숫자 포함 6자 이상이어야 해요" });
    u.password = b64(newPassword);
    u.tempPassword = false;
    await setUser(uid, u);
    return res.json({ ok: true });
  }

  // ── 관리자 비밀번호 변경 (KV 서버에 저장 → 배포해도 유지) ──
  if (action === "changeAdminPassword") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const info = await getUserRole(tk);
    if (!info || info.role !== "admin") return res.json({ ok: false, error: "관리자 권한이 필요합니다" });
    const { currentPassword, newPassword } = body;
    const u = await getUser("admin");
    if (u.password !== b64(currentPassword)) return res.json({ ok: false, error: "현재 비밀번호가 올바르지 않아요" });
    if (!newPassword || newPassword.length < 4) return res.json({ ok: false, error: "새 비밀번호는 4자 이상이어야 해요" });
    u.password = b64(newPassword);
    await setUser("admin", u); // ✅ KV에 저장 → 배포해도 유지
    return res.json({ ok: true });
  }

  // ── 설정 저장 ────────────────────────────────────────
  if (action === "saveSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    if (!u.settings) u.settings = {};
    u.settings = { ...u.settings, ...body.settings };
    await setUser(uid, u);
    return res.json({ ok: true });
  }

  // ── 설정 불러오기 ─────────────────────────────────────
  if (action === "loadSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    return res.json({ ok: true, settings: u?.settings || {} });
  }

  // ── 관리자: 글로벌 설정 저장 ─────────────────────────
  // ── 팝업 저장 (관리자만) ─────────────────────────
  if (action === "savePopup") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요합니다" });
    const popup = { ...body.popup, id: "popup_main" };
    _mem["admin:popup"] = popup;
    await kvSet("admin:popup", popup);
    return res.json({ ok: true });
  }

  if (action === "loadPopup") {
    let popup = await kvGet("admin:popup") || _mem["admin:popup"] || null;
    if (typeof popup === "string") { try { popup = JSON.parse(popup); } catch {} }
    return res.json({ ok: true, popup });
  }

  // ── 팝업 목록 저장 (관리자, 다중) ────────────────────
  if (action === "savePopups") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요합니다" });
    const popups = Array.isArray(body.popups) ? body.popups : [];
    _mem["admin:popups"] = popups;
    await kvSet("admin:popups", popups);
    return res.json({ ok: true });
  }

  // ── 팝업 목록 불러오기 (전체 회원, 다중) ─────────────
  if (action === "loadPopups") {
    let popups = await kvGet("admin:popups") || _mem["admin:popups"] || [];
    if (!Array.isArray(popups)) popups = [];
    return res.json({ ok: true, popups });
  }

  // ── admin 복구 (profile 없을 때) ─────────────────
  // ── 관리자 비번 강제 초기화 (긴급용) ────────────────────
  if (action === "forceResetAdminPw") {
    const { secretKey } = body;
    if (secretKey !== "blogauto-reset-2026") return res.json({ ok: false, error: "잘못된 키" });
    const existing = await getUser("admin") || {};
    await setUser("admin", { ...existing, password: b64("123456") });
    return res.json({ ok: true, message: "비밀번호가 123456으로 초기화되었습니다" });
  }

  if (action === "repairAdmin") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const parsed = parseSignedToken(tk);
    if (!parsed || parsed.uid !== "admin") return res.json({ ok: false, error: "admin 토큰 필요" });
    const existing = await getUser("admin") || {};
    const repaired = {
      ...existing,
      id: "admin",
      profile: { name: "관리자", email: "admin@blogauto.pro", role: "admin", createdAt: new Date().toISOString() },
      password: existing.password,
    };
    await setUser("admin", repaired);
    return res.json({ ok: true, user: repaired });
  }

  if (action === "saveAdminGlobalSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const info = await getUserRole(tk);
    if (!info || info.role !== "admin") return res.json({ ok: false, error: "관리자 권한이 필요합니다" });
    _mem["admin:global_settings"] = body.settings;
    await kvSet("admin:global_settings", body.settings);
    return res.json({ ok: true });
  }

  // ── 관리자: 글로벌 설정 불러오기 ─────────────────────
  if (action === "loadAdminGlobalSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const info = await getUserRole(tk);
    if (!info || info.role !== "admin") return res.json({ ok: false, error: "관리자 권한이 필요합니다" });
    const gs = await kvGet("admin:global_settings") || _mem["admin:global_settings"] || {};
    return res.json({ ok: true, settings: gs });
  }

  // ── 관리자: 회원 목록 조회 ────────────────────────────
  if (action === "listUsers") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const info = await getUserRole(tk);
    if (!info || info.role !== "admin") return res.json({ ok: false, error: "관리자 권한이 필요합니다" });
    const userIds = await getUserIndex();
    const users = [];
    for (const uid of userIds) {
      const u = await getUser(uid);
      if (u) {
        users.push({
          id: uid,
          name: u.profile?.name || uid,
          email: u.profile?.email || "",
          role: u.profile?.role || "user",
          createdAt: u.profile?.createdAt || "",
          postCount: (u.posts || []).length,
        });
      }
    }
    return res.json({ ok: true, users });
  }

  // ── 관리자: 회원 등급 변경 ────────────────────────────
  if (action === "changeUserRole") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const info = await getUserRole(tk);
    if (!info || info.role !== "admin") return res.json({ ok: false, error: "관리자 권한이 필요합니다" });
    const { targetUserId, newRole } = body;
    if (!targetUserId || !["user", "admin"].includes(newRole)) return res.json({ ok: false, error: "잘못된 요청" });
    if (targetUserId === "admin") return res.json({ ok: false, error: "관리자 계정 등급은 변경할 수 없어요" });
    const u = await getUser(targetUserId);
    if (!u) return res.json({ ok: false, error: "존재하지 않는 회원이에요" });
    u.profile.role = newRole;
    await setUser(targetUserId, u);
    return res.json({ ok: true });
  }

  // ── 관리자: 회원 삭제 ─────────────────────────────────
  if (action === "deleteUser") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const info = await getUserRole(tk);
    if (!info || info.role !== "admin") return res.json({ ok: false, error: "관리자 권한이 필요합니다" });
    const { targetUserId } = body;
    if (!targetUserId || targetUserId === "admin") return res.json({ ok: false, error: "삭제할 수 없는 계정이에요" });
    const u = await getUser(targetUserId);
    if (u?.profile?.email) await kvDel(`email:${u.profile.email}`);
    await kvDel(`user:${targetUserId}`);
    await removeFromUserIndex(targetUserId);
    return res.json({ ok: true });
  }

  // ── 관리자 공개 설정 불러오기 (토큰 없이 접근 가능) ────
  // 비로그인 유저도 admin이 설정한 API 키를 사용할 수 있도록
  if (action === "loadAdminPublicSettings") {
    const u = await getUser("admin");
    if (!u || !u.settings) return res.json({ ok: true, settings: {} });
    // 민감하지 않은 설정만 공개 (API 키는 공개, 비밀번호는 제외)
    const publicSettings = { ...u.settings };
    return res.json({ ok: true, settings: publicSettings });
  }

  // ── 로그아웃 ──────────────────────────────────────────
  if (action === "logout") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    await delSession(tk);
    return res.json({ ok: true });
  }

  // ── 발행 글 저장 ──────────────────────────────────────
  if (action === "savePost") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const { post } = body;
    if (!post) return res.json({ ok: false, error: "post 데이터 필요" });
    const u = await getUser(uid);
    if (!u.posts) u.posts = [];
    const idx = u.posts.findIndex(p => p.id === post.id);
    const entry = {
      id: post.id || Date.now().toString(),
      title: post.title || "제목 없음",
      keyword: post.keyword || "",
      platform: post.platform || "네이버",
      status: post.status || "published",
      views: post.views || 0,
      clicks: post.clicks || 0,
      createdAt: post.createdAt || new Date().toISOString(),
      hashtags: post.hashtags || [],
    };
    if (idx >= 0) u.posts[idx] = entry;
    else u.posts.unshift(entry);
    u.posts = u.posts.slice(0, 100);
    await setUser(uid, u);
    return res.json({ ok: true, post: entry });
  }

  // ── 발행 글 목록 ──────────────────────────────────────
  if (action === "loadPosts") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    return res.json({ ok: true, posts: u?.posts || [] });
  }

  // ── 발행 글 삭제 ──────────────────────────────────────
  if (action === "deletePost") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const { postId } = body;
    const u = await getUser(uid);
    if (!u.posts) return res.json({ ok: true });
    u.posts = u.posts.filter(p => p.id !== postId);
    await setUser(uid, u);
    return res.json({ ok: true });
  }

  // ── 통계 저장 ────────────────────────────────────────
  if (action === "saveStats") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const { date, views, clicks, revenue } = body;
    const u = await getUser(uid);
    if (!u.stats) u.stats = {};
    u.stats[date || new Date().toISOString().slice(0, 10)] = { views: views || 0, clicks: clicks || 0, revenue: revenue || 0 };
    const keys = Object.keys(u.stats).sort().slice(-30);
    const trimmed = {};
    keys.forEach(k => { trimmed[k] = u.stats[k]; });
    u.stats = trimmed;
    await setUser(uid, u);
    return res.json({ ok: true });
  }

  // ── 통계 불러오기 ─────────────────────────────────────
  if (action === "loadStats") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    return res.json({ ok: true, stats: u?.stats || {} });
  }

  // ── 알림 저장 ─────────────────────────────────────────
  if (action === "saveNotification") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const { type, title, desc } = body;
    const u = await getUser(uid);
    if (!u.notifications) u.notifications = [];
    const entry = {
      id: Date.now().toString(),
      type: type || "info",
      title: title || "",
      desc: desc || "",
      createdAt: new Date().toISOString(),
      read: false,
    };
    u.notifications.unshift(entry);
    u.notifications = u.notifications.slice(0, 50);
    await setUser(uid, u);
    return res.json({ ok: true, notification: entry });
  }

  // ── 알림 불러오기 ────────────────────────────────────
  if (action === "loadNotifications") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    return res.json({ ok: true, notifications: u?.notifications || [] });
  }

  // ── 알림 전체 읽음 처리 ──────────────────────────────
  if (action === "markNotificationsRead") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    if (u.notifications) {
      u.notifications = u.notifications.map(n => ({ ...n, read: true }));
      await setUser(uid, u);
    }
    return res.json({ ok: true });
  }

  return res.json({ ok: false, error: "알 수 없는 요청" });
}
