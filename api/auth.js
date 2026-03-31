/**
 * BlogAuto Pro - Auth API
 * 트리 구조: users[id] → { profile, password, settings }
 */

const tree = {
  users: {
    admin: {
      profile: { name:"관리자", email:"admin@blogauto.pro", role:"admin", createdAt: new Date().toISOString() },
      password: Buffer.from("123456").toString("base64"),
      settings: {},
    },
  },
  sessions: {},
};

const token = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const getUserId = (authHeader) => {
  const t = (authHeader||"").replace("Bearer ","");
  return tree.sessions[t] || null;
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");
  if (req.method==="OPTIONS") return res.status(200).end();

  let body = req.body;
  if (typeof body==="string") { try { body=JSON.parse(body); } catch {} }
  const { action } = body||{};

  // 회원가입
  if (action==="signup") {
    const { name, userId, email, password } = body;
    if (!name?.trim()) return res.json({ ok:false, error:"이름을 입력해주세요" });
    if (!userId?.trim()) return res.json({ ok:false, error:"아이디를 입력해주세요" });
    if (!email?.trim()) return res.json({ ok:false, error:"이메일을 입력해주세요" });
    if (tree.users[userId]) return res.json({ ok:false, error:"이미 사용 중인 아이디예요" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ ok:false, error:"올바른 이메일 형식이 아니에요" });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(password)) return res.json({ ok:false, error:"비밀번호는 영문 대소문자+숫자 포함 6자 이상이어야 해요" });

    tree.users[userId] = {
      profile: { name, email, role:"user", createdAt: new Date().toISOString() },
      password: Buffer.from(password).toString("base64"),
      settings: {},
    };
    const tk = token();
    tree.sessions[tk] = userId;
    return res.json({ ok:true, token:tk, user:{ id:userId, ...tree.users[userId].profile } });
  }

  // 로그인
  if (action==="login") {
    const { userId, password } = body;
    const u = tree.users[userId];
    if (!u) return res.json({ ok:false, error:"아이디 또는 비밀번호를 확인해주세요" });
    if (u.password !== Buffer.from(password).toString("base64")) return res.json({ ok:false, error:"아이디 또는 비밀번호를 확인해주세요" });
    const tk = token();
    tree.sessions[tk] = userId;
    return res.json({ ok:true, token:tk, user:{ id:userId, ...u.profile } });
  }

  // 설정 저장
  if (action==="saveSettings") {
    const uid = getUserId(req.headers.authorization);
    if (!uid) return res.json({ ok:false, error:"로그인이 필요해요" });
    tree.users[uid].settings = body.settings;
    return res.json({ ok:true });
  }

  // 설정 불러오기
  if (action==="loadSettings") {
    const uid = getUserId(req.headers.authorization);
    if (!uid) return res.json({ ok:false, error:"로그인이 필요해요" });
    return res.json({ ok:true, settings: tree.users[uid]?.settings||{} });
  }

  // 회원 목록 (관리자)
  if (action==="getUsers") {
    const uid = getUserId(req.headers.authorization);
    if (!uid || tree.users[uid]?.profile?.role !== "admin") return res.json({ ok:false, error:"권한 없음" });
    const list = Object.entries(tree.users).map(([id,u]) => ({ id, ...u.profile }));
    return res.json({ ok:true, users:list });
  }

  // 로그아웃
  if (action==="logout") {
    const t = (req.headers.authorization||"").replace("Bearer ","");
    delete tree.sessions[t];
    return res.json({ ok:true });
  }

  return res.json({ ok:false, error:"알 수 없는 요청" });
}
