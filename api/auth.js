/**
 * BlogAuto Pro - Auth API
 * Vercel KV 기반 영구 저장소
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

// 메모리 fallback (KV 없을 때)
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
    console.log(`[임시 비밀번호] ${userId} → ${tempPw}`);
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

  // 설정 저장
  if (action === "saveSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    u.settings = body.settings;
    await setUser(uid, u);
    return res.json({ ok: true });
  }

  // 설정 불러오기
  if (action === "loadSettings") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    const uid = await getSession(tk);
    if (!uid) return res.json({ ok: false, error: "로그인이 필요해요" });
    const u = await getUser(uid);
    return res.json({ ok: true, settings: u?.settings || {} });
  }

  // 로그아웃
  if (action === "logout") {
    const tk = (req.headers.authorization || "").replace("Bearer ", "");
    await delSession(tk);
    return res.json({ ok: true });
  }

  return res.json({ ok: false, error: "알 수 없는 요청" });
}
