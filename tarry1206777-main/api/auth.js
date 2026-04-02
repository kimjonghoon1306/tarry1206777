// BlogAuto Pro - auth v4.0
/**
 * [수정 내용]
 * 1. saveSettings / loadSettings - 토큰 기반으로 user:userId에 완전 분리 저장
 * 2. saveAdminGlobalSettings / loadAdminGlobalSettings 추가
 *    - 관리자가 저장한 설정은 admin:global_settings 키에 별도 보관
 *    - 일반 회원 loadSettings에서 절대 노출 안됨
 * 3. 관리자(admin role) 여부 검증 로직 추가
 */

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const d = await r.json();
    if (d.result === null || d.result === undefined) return null;
    return typeof d.result === "string" ? JSON.parse(d.result) : d.result;
  } catch { return null; }
}

async function kvSet(key, value) {
  if (!KV_URL || !KV_TOKEN) return false;
  try {
    await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(value) }),
    });
    return true;
  } catch { return false; }
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

const mkToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const b64 = (s) => Buffer.from(s).toString("base64");

async function initAdmin() {
  const existing = await getUser("admin");
  if (!existing) {
    await setUser("admin", {
      profile: { name: "관리자", email: "admin@blogauto.pro", role: "admin", createdAt: new Date().toISOString() },
      password: b64("123456"),
    });
    await setEmailIndex("admin@blogauto.pro", "admin");
  }
}

// 토큰으로 유저 role 확인
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

  // 회원가입
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
    const tk = mkToken();
    await setSession(tk, userId);
    return res.json({ ok: true, token: tk, user: { id: userId, ...userData.profile } });
  }

  // 로그인
  if (action === "login") {
    const { userId, password } = body;
    const u = await getUser(userId);
    if (!u) return res.json({ ok: false, error: "아이디 또는 비밀번호를 확인해주세요" });
    if (u.password !== b64(password)) return res.json({ ok: false, error: "아이디 또는 비밀번호를 확인해주세요" });
    const tk = mkToken();
    await setSession(tk, userId);
    return res.json({ ok: true, token: tk, user: { id: userId, ...u.profile } });
  }

  // 아이디 찾기
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

  // 비밀번호 초기화
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

  // 비밀번호 변경
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

  // ── 회원별 설정 저장 (일반 회원 + admin 각자 분리) ──────────
  if (action === "saveSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    if (!u.settings) u.settings = {};
    // 기존 설정에 병합 (전체 덮어쓰기가 아닌 merge)
    u.settings = { ...u.settings, ...body.settings };
    await setUser(uid, u);
    return res.json({ ok: true });
  }

  // ── 회원별 설정 불러오기 ─────────────────────────────────────
  if (action === "loadSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    // 반드시 해당 유저 settings만 반환 - 다른 유저 설정 절대 안 섞임
    return res.json({ ok: true, settings: u?.settings || {} });
  }

  // ── 관리자 전용: 글로벌 설정 저장 ───────────────────────────
  // SuperAdminPage에서만 호출 - 일반 회원에게 절대 노출 안됨
  if (action === "saveAdminGlobalSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const info = await getUserRole(tk);
    if (!info || info.role !== "admin") {
      return res.json({ ok: false, error: "관리자 권한이 필요합니다" });
    }
    // admin:global 키에 별도 저장 - user:admin 과도 분리
    _mem["admin:global_settings"] = body.settings;
    await kvSet("admin:global_settings", body.settings);
    return res.json({ ok: true });
  }

  // ── 관리자 전용: 글로벌 설정 불러오기 ───────────────────────
  if (action === "loadAdminGlobalSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const info = await getUserRole(tk);
    if (!info || info.role !== "admin") {
      return res.json({ ok: false, error: "관리자 권한이 필요합니다" });
    }
    const gs = await kvGet("admin:global_settings") || _mem["admin:global_settings"] || {};
    return res.json({ ok: true, settings: gs });
  }

  // 로그아웃
  if (action === "logout") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    await delSession(tk);
    return res.json({ ok: true });
  }

  // 발행 글 저장
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

  // 발행 글 목록 불러오기
  if (action === "loadPosts") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    return res.json({ ok: true, posts: u?.posts || [] });
  }

  // 발행 글 삭제
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

  // 통계 저장
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

  // 통계 불러오기
  if (action === "loadStats") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    return res.json({ ok: true, stats: u?.stats || {} });
  }

  return res.json({ ok: false, error: "알 수 없는 요청" });
}
