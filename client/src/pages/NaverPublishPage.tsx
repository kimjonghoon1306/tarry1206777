/**
 * BlogAuto Pro — 자동 발행 허브
 * 네이버 블로그 + 티스토리 매크로 자동발행
 * 계정설정 · 발행 · 히스토리 · 로그 ALL-IN-ONE
 *
 * 위치: client/src/pages/NaverPublishPage.tsx
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Send, Settings2, History, Terminal, Wifi,
  Eye, EyeOff, Plus, Trash2, CheckCircle2,
  Clock, RefreshCw, Zap, Globe, Tag,
  FileText, Image, AlertCircle,
} from "lucide-react";

// ── 상수 ─────────────────────────────────────────────────
const BOT_URL      = "http://localhost:3333";
const HISTORY_KEY  = "blogauto_autopublish_history";
const ACCOUNTS_KEY = "blogauto_autopublish_accounts";

// ── 타입 ─────────────────────────────────────────────────
type Platform = "naver" | "tistory";

interface Account {
  id: string;
  platform: Platform;
  username: string;
  password: string;
  blogName?: string;
  connected: boolean;
  connectedAt?: string;
}

interface PublishHistory {
  id: string;
  platform: Platform;
  title: string;
  status: "success" | "fail" | "pending";
  url?: string;
  error?: string;
  publishedAt: string;
  account: string;
}

interface LogLine {
  id: string;
  time: string;
  level: "info" | "success" | "error" | "warn";
  msg: string;
}

// ── utils ─────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
function nowStr() { return new Date().toLocaleTimeString("ko-KR"); }
function safeJson<T>(key: string, fallback: T): T {
  try {
    const r = localStorage.getItem(key);
    return r ? (JSON.parse(r) as T) : fallback;
  } catch { return fallback; }
}

// ── 스타일 ────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Noto+Sans+KR:wght@400;500;600;700&display=swap');

@keyframes hub-fade-up  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes hub-spin     { to{transform:rotate(360deg)} }
@keyframes hub-blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes hub-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes hub-scan     { 0%{transform:translateY(-100%);opacity:.6} 100%{transform:translateY(400%);opacity:0} }
@keyframes pulse-naver  { 0%,100%{box-shadow:0 0 0 0 rgba(3,199,90,0.35)} 50%{box-shadow:0 0 0 8px transparent} }
@keyframes pulse-tistory{ 0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,0.35)} 50%{box-shadow:0 0 0 8px transparent} }

.hub-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  transition: border-color .2s;
}
.hub-card:hover { border-color: rgba(255,255,255,0.14); }

.hub-tab {
  padding: 8px 16px; border-radius: 10px; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: all .18s;
  border: 1px solid transparent; white-space: nowrap;
  font-family: 'Noto Sans KR', sans-serif;
  display: flex; align-items: center; gap: 6px;
}
.hub-tab-active  { background:rgba(3,199,90,.12); border-color:#03C75A; color:#03C75A; }
.hub-tab-inactive{ color:rgba(255,255,255,.45); background:rgba(255,255,255,.04); }
.hub-tab-inactive:hover { color:rgba(255,255,255,.75); background:rgba(255,255,255,.07); }

.hub-input {
  background: rgba(255,255,255,0.05) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  color: white !important; border-radius: 10px !important;
  font-family: 'Noto Sans KR', sans-serif !important; font-size: 13px !important;
  outline: none;
}
.hub-input option {
  background: #1a2235 !important;
  color: white !important;
  font-weight: 600;
}
select.hub-input {
  color-scheme: dark;
  appearance: auto !important;
  -webkit-appearance: auto !important;
  cursor: pointer;
}
/* 라이트 테마 드롭다운 */
.light select.hub-input, :root:not(.dark) select.hub-input {
  color-scheme: light;
  background: rgba(0,0,0,0.06) !important;
  color: #111 !important;
}
.light .hub-input option, :root:not(.dark) .hub-input option {
  background: #ffffff !important;
  color: #111 !important;
  font-weight: 600;
}
.hub-input:focus  { border-color: #03C75A !important; box-shadow: 0 0 0 2px rgba(3,199,90,.15) !important; }
.hub-input::placeholder { color: rgba(255,255,255,0.3) !important; }

/* ── 라이트 테마 전체 대응 ── */
.light .hub-card, :root:not(.dark) .hub-card {
  background: rgba(0,0,0,0.03) !important;
  border-color: rgba(0,0,0,0.08) !important;
}
.light .hub-input, :root:not(.dark) .hub-input {
  background: rgba(0,0,0,0.05) !important;
  border-color: rgba(0,0,0,0.12) !important;
  color: #111 !important;
}
.light .hub-input::placeholder, :root:not(.dark) .hub-input::placeholder {
  color: rgba(0,0,0,0.35) !important;
}
.light .hub-tab-inactive, :root:not(.dark) .hub-tab-inactive {
  color: rgba(0,0,0,0.55) !important;
  background: rgba(0,0,0,0.05) !important;
}
.light .hub-tab-inactive:hover, :root:not(.dark) .hub-tab-inactive:hover {
  color: rgba(0,0,0,0.85) !important;
  background: rgba(0,0,0,0.09) !important;
}
.light .hub-btn-g, :root:not(.dark) .hub-btn-g {
  background: rgba(0,0,0,0.07) !important;
  color: rgba(0,0,0,0.6) !important;
  border-color: rgba(0,0,0,0.12) !important;
}
.light .hub-btn-g:hover, :root:not(.dark) .hub-btn-g:hover {
  background: rgba(0,0,0,0.12) !important;
  color: #000 !important;
}
.light .sdot-off, :root:not(.dark) .sdot-off { background: #bbb !important; }
.light .log-info,    :root:not(.dark) .log-info    { color: rgba(0,0,0,0.55) !important; }
.light .log-line,    :root:not(.dark) .log-line    { color: rgba(0,0,0,0.7) !important; }
.light .scanwrap::after, :root:not(.dark) .scanwrap::after { opacity: 0.03; }

.hub-btn-n {
  background:#03C75A; color:#000; font-weight:700; border:none; border-radius:10px;
  cursor:pointer; transition:all .18s; font-family:'Noto Sans KR',sans-serif;
  display:flex; align-items:center; gap:6px;
}
.hub-btn-n:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 6px 20px rgba(3,199,90,.4); }
.hub-btn-n:disabled { opacity:.4; cursor:not-allowed; }

.hub-btn-t {
  background:#FF6B35; color:#fff; font-weight:700; border:none; border-radius:10px;
  cursor:pointer; transition:all .18s; font-family:'Noto Sans KR',sans-serif;
  display:flex; align-items:center; gap:6px;
}
.hub-btn-t:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 6px 20px rgba(255,107,53,.4); }
.hub-btn-t:disabled { opacity:.4; cursor:not-allowed; }

.hub-btn-g {
  background:rgba(255,255,255,.06); color:rgba(255,255,255,.6);
  font-weight:600; border:1px solid rgba(255,255,255,.1); border-radius:10px;
  cursor:pointer; transition:all .18s; font-family:'Noto Sans KR',sans-serif;
  display:flex; align-items:center; gap:6px;
}
.hub-btn-g:hover { background:rgba(255,255,255,.1); color:white; }

.log-line { font-family:'Courier New',monospace; font-size:11px; line-height:1.7; }
.log-info    { color:rgba(255,255,255,.5); }
.log-success { color:#03C75A; }
.log-error   { color:#ff4444; }
.log-warn    { color:#f59e0b; }

.sdot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.sdot-on  { background:#03C75A; animation:hub-blink 2s infinite; }
.sdot-off { background:#555; }

.scanwrap { position:relative; overflow:hidden; }
.scanwrap::after {
  content:''; position:absolute; left:0; right:0; height:40px;
  background:linear-gradient(transparent,rgba(3,199,90,.06),transparent);
  animation:hub-scan 3s linear infinite; pointer-events:none;
}
`;

// ── SVG 헥스 배경 ──────────────────────────────────────────
function HexBg() {
  return (
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.03,pointerEvents:"none"}}
      viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      {Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>{
        const x=c*52+(r%2)*26, y=r*46;
        return <polygon key={`${r}-${c}`} fill="none" stroke="white" strokeWidth=".8"
          points={Array.from({length:6},(_,i)=>{const a=Math.PI/180*(60*i-30);return `${x+22*Math.cos(a)},${y+22*Math.sin(a)}`;}).join(" ")}/>;
      }))}
    </svg>
  );
}

// ── 플랫폼 아이콘 ─────────────────────────────────────────
function PIcon({ p, s=20 }:{ p:Platform; s?:number }) {
  return p==="naver"
    ? <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#03C75A"/><path d="M6 18V6h3.5l5 7.8V6H18v12h-3.5L9.5 10.2V18H6z" fill="white"/></svg>
    : <svg width={s} height={s} viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#FF6B35"/><path d="M12 5C8.13 5 5 8.13 5 12s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="white"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg>;
}

// ── 메인 ─────────────────────────────────────────────────
export default function NaverPublishPage() {
  const [activeTab, setActiveTab]       = useState<"publish"|"write"|"accounts"|"history"|"logs">("publish");
  const [activePlatform, setActivePlatform] = useState<Platform>("naver");
  const [botOnline, setBotOnline]       = useState(false);
  const [checking, setChecking]         = useState(false);

  // 계정
  const [accounts, setAccounts] = useState<Account[]>(() => safeJson<Account[]>(ACCOUNTS_KEY, []));
  const [showPw,   setShowPw]   = useState<Record<string,boolean>>({});
  const [newAcc,   setNewAcc]   = useState({ platform:"naver" as Platform, username:"", password:"", blogName:"" });
  const [connecting, setConnecting] = useState<string|null>(null);

  // 발행 폼
  const [pubTitle,   setPubTitle]   = useState("");
  const [pubContent, setPubContent] = useState("");
  const [pubTags,    setPubTags]    = useState("");
  const [pubAccount, setPubAccount] = useState("");
  const [pubImgPrompt, setPubImgPrompt] = useState("");
  const [publishing, setPublishing] = useState(false);

  // 글 생성
  const [writeKeyword,  setWriteKeyword]  = useState("");
  const [writePlatform, setWritePlatform] = useState<Platform>("naver");
  const [writeResult,   setWriteResult]   = useState("");
  const [writeTitle,    setWriteTitle]    = useState("");
  const [writeTags,     setWriteTags]     = useState("");
  const [writeLoading,  setWriteLoading]  = useState(false);

  // 히스토리 / 로그
  const [history, setHistory] = useState<PublishHistory[]>(() => safeJson<PublishHistory[]>(HISTORY_KEY, []));
  const [logs,    setLogs]    = useState<LogLine[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // ── localStorage 동기화 ──────────────────────────────────
  useEffect(() => { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { localStorage.setItem(HISTORY_KEY,  JSON.stringify(history.slice(0,100))); }, [history]);

  // ── 로그 추가 ────────────────────────────────────────────
  const addLog = useCallback((level: LogLine["level"], msg: string) => {
    setLogs(prev => [...prev.slice(-199), { id:uid(), time:nowStr(), level, msg }]);
    setTimeout(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight), 50);
  }, []);

  // ── 봇 서버 체크 ─────────────────────────────────────────
  const checkBot = useCallback(async () => {
    setChecking(true);
    try {
      const r = await fetch(`${BOT_URL}/health`, { signal: AbortSignal.timeout(3000) });
      setBotOnline(r.ok);
      addLog(r.ok ? "success" : "error", r.ok ? "✅ 봇 서버 연결 확인" : "❌ 봇 서버 응답 없음");
    } catch {
      setBotOnline(false);
      addLog("warn", "⚠️ 봇 서버 오프라인 — PC에서 naver-bot 실행 필요");
    } finally { setChecking(false); }
  }, [addLog]);

  useEffect(() => { checkBot(); }, [checkBot]);

  // ── 글 생성 ─────────────────────────────────────────────
  async function handleWriteContent() {
    if (!writeKeyword.trim()) { toast.error("키워드를 입력하세요"); return; }
    setWriteLoading(true);
    setWriteResult("");
    addLog("info", `✍️ 글 생성 시작: "${writeKeyword}" [${writePlatform}]`);
    try {
      // 기존 AI 키 사용
      const aiProvider = localStorage.getItem("ai_provider") || "gemini";
      const geminiKey  = localStorage.getItem("u:admin:gemini_api_key") || localStorage.getItem("gemini_api_key") || "";
      const claudeKey  = localStorage.getItem("u:admin:anthropic_api_key") || localStorage.getItem("anthropic_api_key") || "";

      const platformStyle = writePlatform === "naver"
        ? "네이버 블로그 스타일로 친근하고 자연스럽게, 소제목(##)과 본문 단락 위주로"
        : "티스토리 블로그 스타일로 정보성 위주, 목차와 소제목 포함하여";

      const prompt = `"${writeKeyword}" 키워드로 ${platformStyle} 블로그 글을 한국어로 1500자 이상 작성해줘.
형식:
- 제목: (제목만)
- 태그: (태그1, 태그2, 태그3 형식으로 5개)
- 본문: (본문 내용)`;

      let resultText = "";

      if (geminiKey) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const d = await r.json();
        resultText = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (claudeKey) {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": claudeKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
        });
        const d = await r.json();
        resultText = d.content?.[0]?.text || "";
      } else {
        throw new Error("AI API 키가 없습니다. 설정에서 Gemini 또는 Claude 키를 등록해주세요.");
      }

      // 제목/태그/본문 파싱
      const titleMatch = resultText.match(/제목[:\s]*([^\n]+)/);
      const tagsMatch  = resultText.match(/태그[:\s]*([^\n]+)/);
      const bodyMatch  = resultText.match(/본문[:\s]*([\s\S]+)/);

      if (titleMatch) setWriteTitle(titleMatch[1].trim());
      if (tagsMatch)  setWriteTags(tagsMatch[1].trim());
      setWriteResult(bodyMatch ? bodyMatch[1].trim() : resultText);

      addLog("success", `✅ 글 생성 완료 (${resultText.length}자)`);
      toast.success("글 생성 완료!");
    } catch(e:any) {
      addLog("error", `❌ 글 생성 실패: ${e.message}`);
      toast.error(e.message);
    } finally { setWriteLoading(false); }
  }

  function sendToPublish() {
    if (!writeResult) { toast.error("먼저 글을 생성하세요"); return; }
    setPubTitle(writeTitle);
    setPubContent(writeResult);
    setPubTags(writeTags);
    setActivePlatform(writePlatform);
    setActiveTab("publish");
    toast.success("발행하기 탭으로 이동했습니다!");
  }

  // ── 계정 연결 ────────────────────────────────────────────
  async function handleConnect(acc: Account) {
    if (!botOnline) { toast.error("봇 서버를 먼저 실행하세요"); return; }
    setConnecting(acc.id);
    addLog("info", `🔗 [${acc.platform}] ${acc.username} 연결 중...`);
    try {
      const r = await fetch(`${BOT_URL}/api/${acc.platform}/save-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId:acc.id, id:acc.username, pw:acc.password, blogName:acc.blogName }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setAccounts(prev => prev.map(a => a.id===acc.id ? {...a, connected:true, connectedAt:new Date().toISOString()} : a));
      addLog("success", `✅ [${acc.username}] 세션 저장 완료 (쿠키 ${d.cookies??0}개)`);
      toast.success(`${acc.username} 연결 완료!`);
    } catch(e:any) {
      addLog("error", `❌ 연결 실패: ${e.message}`);
      toast.error("연결 실패: " + e.message);
    } finally { setConnecting(null); }
  }

  // ── 계정 추가 ────────────────────────────────────────────
  function addAccount() {
    if (!newAcc.username || !newAcc.password) { toast.error("아이디와 비밀번호를 입력하세요"); return; }
    const a: Account = { id:uid(), ...newAcc, connected:false };
    setAccounts(prev => [...prev, a]);
    setNewAcc({ platform:"naver", username:"", password:"", blogName:"" });
    addLog("info", `➕ 계정 추가: [${a.platform}] ${a.username}`);
    toast.success("계정 추가됨");
  }

  // ── 계정 삭제 ────────────────────────────────────────────
  function removeAccount(id: string) {
    const a = accounts.find(x=>x.id===id);
    if (a) addLog("warn", `🗑️ 계정 삭제: ${a.username}`);
    setAccounts(prev => prev.filter(x=>x.id!==id));
  }

  // ── 발행 ────────────────────────────────────────────────
  async function handlePublish() {
    if (!pubTitle.trim())   { toast.error("제목을 입력하세요"); return; }
    if (!pubContent.trim()) { toast.error("내용을 입력하세요"); return; }
    if (!pubAccount)        { toast.error("계정을 선택하세요"); return; }
    if (!botOnline)         { toast.error("봇 서버를 먼저 실행하세요"); return; }

    const acc = accounts.find(a=>a.id===pubAccount);
    if (!acc) return;

    setPublishing(true);
    const hId = uid();
    setHistory(prev => [{
      id:hId, platform:acc.platform, title:pubTitle,
      status:"pending", publishedAt:new Date().toISOString(), account:acc.username,
    }, ...prev]);
    addLog("info", `🚀 발행 시작: [${acc.platform}] "${pubTitle}"`);
    if (pubImgPrompt) addLog("info", `🎨 Flow 이미지 생성: "${pubImgPrompt}"`);

    try {
      const r = await fetch(`${BOT_URL}/api/publish-full`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          userId: acc.id,
          platform: acc.platform,
          title: pubTitle,
          content: pubContent,
          tags: pubTags.split(",").map(t=>t.trim()).filter(Boolean),
          imagePrompt: pubImgPrompt || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setHistory(prev => prev.map(h => h.id===hId ? {...h, status:"success" as const, url:d.postUrl} : h));
      addLog("success", `✅ 발행 완료!${d.postUrl ? ` → ${d.postUrl}` : ""}`);
      toast.success("발행 완료!");
      setPubTitle(""); setPubContent(""); setPubTags(""); setPubImgPrompt("");
    } catch(e:any) {
      setHistory(prev => prev.map(h => h.id===hId ? {...h, status:"fail" as const, error:e.message} : h));
      addLog("error", `❌ 발행 실패: ${e.message}`);
      toast.error("발행 실패: " + e.message);
    } finally { setPublishing(false); }
  }

  // ── 파생값 ──────────────────────────────────────────────
  const publishableAccs = accounts.filter(a => a.connected && a.platform===activePlatform);
  const isNaver = activePlatform === "naver";
  const accentColor = isNaver ? "#03C75A" : "#FF6B35";
  const btnClass = isNaver ? "hub-btn-n" : "hub-btn-t";

  const TABS = [
    { key:"publish",  icon:Send,      label:"발행하기" },
    { key:"write",    icon:FileText,  label:"글 생성" },
    { key:"accounts", icon:Settings2, label:"계정 관리" },
    { key:"history",  icon:History,   label:"히스토리" },
    { key:"logs",     icon:Terminal,  label:"실시간 로그" },
  ] as const;

  // ────────────────────────────────────────────────────────
  return (
    <Layout>
      <style>{CSS}</style>
      <div style={{
        minHeight:"100vh",
        background:"var(--background)",
        position:"relative", overflow:"hidden",
        fontFamily:"'Noto Sans KR',sans-serif",
      }}>
        <HexBg />

        {/* ── 상단 헤더 ── */}
        <div style={{
          borderBottom:"1px solid rgba(255,255,255,0.07)",
          padding:"18px 24px 14px",
          background:"var(--card)",
          borderBottom:"1px solid var(--border)",
          backdropFilter:"blur(20px)",
          position:"sticky", top:0, zIndex:20,
          animation:"hub-fade-up .4s ease both",
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            {/* 타이틀 */}
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{
                width:42,height:42,borderRadius:13,
                background:"linear-gradient(135deg,#03C75A,#00a847)",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:"0 0 18px rgba(3,199,90,.4)",
                animation:"hub-float 3s ease-in-out infinite",
              }}>
                <Zap style={{width:20,height:20,color:"#000"}}/>
              </div>
              <div>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(16px,3vw,22px)",color:"var(--foreground)",margin:0,letterSpacing:"-.02em"}}>
                  자동 발행 허브
                </h1>
                <p style={{fontSize:11,color:"rgba(255,255,255,.4)",margin:0,marginTop:1}}>
                  네이버 블로그 · 티스토리 매크로 자동발행
                </p>
              </div>
            </div>
            {/* 봇 상태 */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{
                display:"flex",alignItems:"center",gap:7,padding:"7px 13px",borderRadius:10,
                background:botOnline?"rgba(3,199,90,.1)":"rgba(255,255,255,.05)",
                border:`1px solid ${botOnline?"#03C75A":"rgba(255,255,255,.1)"}`,
              }}>
                <span className={`sdot ${botOnline?"sdot-on":"sdot-off"}`}/>
                <span style={{fontSize:12,fontWeight:600,color:botOnline?"#03C75A":"rgba(255,255,255,.4)"}}>
                  {botOnline?"봇 서버 온라인":"봇 서버 오프라인"}
                </span>
              </div>
              <button className="hub-btn-g" style={{padding:"7px 13px",fontSize:12}} onClick={checkBot} disabled={checking}>
                {checking ? <RefreshCw style={{width:12,height:12,animation:"hub-spin 1s linear infinite"}}/> : <Wifi style={{width:12,height:12}}/>}
                확인
              </button>
            </div>
          </div>

          {/* 탭 */}
          <div style={{display:"flex",gap:6,marginTop:14,overflowX:"auto",paddingBottom:2}}>
            {TABS.map(t=>(
              <button key={t.key}
                className={`hub-tab ${activeTab===t.key?"hub-tab-active":"hub-tab-inactive"}`}
                onClick={()=>setActiveTab(t.key as typeof activeTab)}>
                <t.icon style={{width:12,height:12}}/>
                {t.label}
                {t.key==="history" && history.length>0 &&
                  <span style={{background:"rgba(3,199,90,.2)",color:"#03C75A",borderRadius:99,padding:"0px 5px",fontSize:9,fontWeight:700}}>
                    {history.length}
                  </span>
                }
              </button>
            ))}
          </div>
        </div>

        {/* ── 콘텐츠 ── */}
        <div style={{padding:"22px 24px",maxWidth:1360,margin:"0 auto"}}>

          {/* ════ 발행하기 ════ */}
          {activeTab==="publish" && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:18,animation:"hub-fade-up .35s ease both"}}
              className="hub-panel-grid">

              {/* 왼쪽 */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* 플랫폼 선택 */}
                <div className="hub-card" style={{padding:"18px 20px"}}>
                  <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 10px"}}>발행 플랫폼</p>
                  <div style={{display:"flex",gap:10}}>
                    {(["naver","tistory"] as Platform[]).map(p=>{
                      const active = activePlatform===p;
                      const c = p==="naver"?"#03C75A":"#FF6B35";
                      return (
                        <button key={p} onClick={()=>setActivePlatform(p)} style={{
                          flex:1,padding:"13px 14px",borderRadius:12,cursor:"pointer",transition:"all .2s",
                          background:active?`${c}18`:"rgba(255,255,255,.04)",
                          border:`2px solid ${active?c:"rgba(255,255,255,.08)"}`,
                          display:"flex",alignItems:"center",gap:10,
                          animation:active?(p==="naver"?"pulse-naver":"pulse-tistory")+" 2s infinite":"none",
                        }}>
                          <PIcon p={p} s={22}/>
                          <div style={{textAlign:"left"}}>
                            <div style={{fontSize:13,fontWeight:700,color:active?c:"rgba(255,255,255,.55)"}}>
                              {p==="naver"?"네이버 블로그":"티스토리"}
                            </div>
                            <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:1}}>
                              {p==="naver"?"Playwright 매크로":"Playwright 매크로"}
                            </div>
                          </div>
                          {active && <CheckCircle2 style={{width:14,height:14,marginLeft:"auto",color:c}}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 계정 선택 */}
                <div className="hub-card" style={{padding:"18px 20px"}}>
                  <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 10px"}}>발행 계정</p>
                  {publishableAccs.length===0 ? (
                    <div style={{padding:"18px",textAlign:"center",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px dashed rgba(255,255,255,.1)"}}>
                      <AlertCircle style={{width:18,height:18,color:"rgba(255,255,255,.3)",margin:"0 auto 6px"}}/>
                      <p style={{fontSize:12,color:"rgba(255,255,255,.4)",margin:"0 0 8px"}}>연결된 계정 없음</p>
                      <button className="hub-btn-g" style={{padding:"5px 12px",fontSize:11,margin:"0 auto"}}
                        onClick={()=>setActiveTab("accounts")}>계정 추가 →</button>
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {publishableAccs.map(a=>(
                        <label key={a.id} style={{
                          display:"flex",alignItems:"center",gap:10,padding:"10px 13px",
                          borderRadius:10,cursor:"pointer",transition:"all .15s",
                          background:pubAccount===a.id?"rgba(3,199,90,.08)":"rgba(255,255,255,.03)",
                          border:`1px solid ${pubAccount===a.id?"#03C75A":"rgba(255,255,255,.07)"}`,
                        }}>
                          <input type="radio" name="pacc" value={a.id}
                            checked={pubAccount===a.id} onChange={()=>setPubAccount(a.id)}
                            style={{accentColor:"#03C75A"}}/>
                          <PIcon p={a.platform} s={16}/>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:"white"}}>{a.username}</div>
                            {a.blogName && <div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>{a.blogName}</div>}
                          </div>
                          <span style={{marginLeft:"auto",fontSize:9,padding:"2px 7px",borderRadius:99,
                            background:"rgba(3,199,90,.15)",color:"#03C75A",fontWeight:700}}>연결됨</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* 발행 폼 */}
                <div className="hub-card scanwrap" style={{padding:"18px 20px"}}>
                  <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 14px"}}>발행 내용</p>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {[
                      {label:"제목", icon:FileText, val:pubTitle,    set:setPubTitle,    type:"text",  rows:undefined, ph:"블로그 글 제목..."},
                      {label:"본문", icon:FileText, val:pubContent,  set:setPubContent,  type:"area",  rows:7, ph:"발행할 내용을 입력하거나 배포 관리에서 가져오세요..."},
                      {label:"Flow 이미지 프롬프트 (선택)", icon:Image, val:pubImgPrompt, set:setPubImgPrompt, type:"text", rows:undefined, ph:"예: 맛있는 한국 음식, 밝고 선명하게"},
                      {label:"태그 (쉼표 구분)", icon:Tag, val:pubTags, set:setPubTags, type:"text", rows:undefined, ph:"맛집, 서울, 블로그"},
                    ].map(f=>(
                      <div key={f.label}>
                        <label style={{fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:600,display:"flex",alignItems:"center",gap:4,marginBottom:5}}>
                          <f.icon style={{width:10,height:10}}/>{f.label}
                        </label>
                        {f.type==="area"
                          ? <textarea className="hub-input" rows={f.rows}
                              style={{width:"100%",padding:"9px 13px",resize:"vertical"}}
                              placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}/>
                          : <input className="hub-input" type="text"
                              style={{width:"100%",padding:"9px 13px"}}
                              placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)}/>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {/* 발행 버튼 */}
                <button className={btnClass}
                  style={{padding:"15px 22px",fontSize:14,justifyContent:"center",width:"100%"}}
                  onClick={handlePublish}
                  disabled={publishing || !botOnline || !pubAccount}>
                  {publishing
                    ? <><RefreshCw style={{width:15,height:15,animation:"hub-spin 1s linear infinite"}}/>발행 중...</>
                    : <><Send style={{width:15,height:15}}/>{isNaver?"네이버 블로그":"티스토리"} 자동 발행</>
                  }
                </button>

                {!botOnline && (
                  <div style={{padding:"10px 14px",borderRadius:10,background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.3)",display:"flex",alignItems:"center",gap:8}}>
                    <AlertCircle style={{width:13,height:13,color:"#f59e0b",flexShrink:0}}/>
                    <span style={{fontSize:11,color:"#f59e0b"}}>PC에서 <b>naver-bot</b> 서버 실행 필요 (npm run dev)</span>
                  </div>
                )}
              </div>

              {/* 오른쪽 상태 패널 */}
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {/* 서버 상태 */}
                <div className="hub-card" style={{padding:"18px"}}>
                  <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 12px"}}>서버 상태</p>
                  {[
                    {label:"봇 서버", ok:botOnline},
                    {label:"네이버 세션", ok:accounts.some(a=>a.connected&&a.platform==="naver")},
                    {label:"티스토리", ok:accounts.some(a=>a.connected&&a.platform==="tistory")},
                  ].map(row=>(
                    <div key={row.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 11px",borderRadius:8,background:"rgba(255,255,255,.03)",marginBottom:6}}>
                      <span style={{fontSize:12,color:"rgba(255,255,255,.55)"}}>{row.label}</span>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span className={`sdot ${row.ok?"sdot-on":"sdot-off"}`}/>
                        <span style={{fontSize:11,fontWeight:600,color:row.ok?"#03C75A":"rgba(255,255,255,.3)"}}>{row.ok?"정상":"대기"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 최근 발행 */}
                <div className="hub-card" style={{padding:"18px",flex:1}}>
                  <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 12px"}}>최근 발행</p>
                  {history.length===0
                    ? <p style={{color:"rgba(255,255,255,.25)",fontSize:12,textAlign:"center",padding:"20px 0"}}>기록 없음</p>
                    : history.slice(0,6).map(h=>(
                      <div key={h.id} style={{padding:"9px 11px",borderRadius:8,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.05)",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                          <PIcon p={h.platform} s={12}/>
                          <span style={{fontSize:9,color:"rgba(255,255,255,.4)"}}>{h.account}</span>
                          <span style={{marginLeft:"auto",fontSize:9,color:h.status==="success"?"#03C75A":h.status==="fail"?"#ff4444":"#f59e0b"}}>
                            {h.status==="success"?"✅":h.status==="fail"?"❌":"⏳"}
                          </span>
                        </div>
                        <p style={{fontSize:11,color:"rgba(255,255,255,.65)",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.title}</p>
                        {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer"
                          style={{fontSize:9,color:"#03C75A",textDecoration:"none",display:"flex",alignItems:"center",gap:3,marginTop:3}}>
                          <Globe style={{width:8,height:8}}/>글 보기</a>}
                      </div>
                    ))
                  }
                </div>

                {/* 가이드 */}
                <div className="hub-card" style={{padding:"18px",background:"linear-gradient(135deg,rgba(3,199,90,.05),rgba(255,107,53,.04))"}}>
                  <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 12px"}}>시작 순서</p>
                  {["PC에서 naver-bot 실행","계정 관리에서 계정 추가","연결 버튼 클릭","발행하기"].map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
                      <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,background:"rgba(3,199,90,.15)",border:"1px solid rgba(3,199,90,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#03C75A"}}>{i+1}</div>
                      <span style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ 계정 관리 ════ */}
          {activeTab==="accounts" && (
            <div style={{maxWidth:780,animation:"hub-fade-up .35s ease both"}}>

              {/* 계정 추가 폼 */}
              <div className="hub-card" style={{padding:"22px",marginBottom:18}}>
                <p style={{fontSize:13,fontWeight:700,color:"white",margin:"0 0 14px",display:"flex",alignItems:"center",gap:7}}>
                  <Plus style={{width:14,height:14,color:accentColor}}/> 계정 추가
                </p>
                <div style={{display:"grid",gridTemplateColumns:"110px 1fr 1fr 1fr",gap:10,alignItems:"end"}}>
                  {[
                    {label:"플랫폼",     type:"select"},
                    {label:"아이디",     key:"username", ph:"아이디 입력",   inputType:"text"},
                    {label:"비밀번호",   key:"password", ph:"비밀번호 입력", inputType:"password"},
                    {label:"블로그명(선택)", key:"blogName", ph:"블로그명",  inputType:"text"},
                  ].map((f,i)=>(
                    <div key={i}>
                      <label style={{fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:600,display:"block",marginBottom:5}}>{f.label}</label>
                      {f.type==="select"
                        ? <select className="hub-input" style={{width:"100%",padding:"8px 11px"}}
                            value={newAcc.platform} onChange={e=>setNewAcc(p=>({...p,platform:e.target.value as Platform}))}>
                            <option value="naver">네이버</option>
                            <option value="tistory">티스토리</option>
                          </select>
                        : <input className="hub-input" type={f.inputType} style={{width:"100%",padding:"8px 11px"}}
                            placeholder={f.ph}
                            value={(newAcc as any)[f.key!]}
                            onChange={e=>setNewAcc(p=>({...p,[f.key!]:e.target.value}))}/>
                      }
                    </div>
                  ))}
                </div>
                <button className="hub-btn-n" style={{marginTop:12,padding:"9px 18px",fontSize:13}} onClick={addAccount}>
                  <Plus style={{width:13,height:13}}/> 계정 추가
                </button>
              </div>

              {/* 계정 목록 */}
              {accounts.length===0
                ? <div className="hub-card" style={{padding:"48px",textAlign:"center"}}>
                    <p style={{color:"rgba(255,255,255,.3)",fontSize:14}}>등록된 계정이 없습니다</p>
                  </div>
                : accounts.map((a,i)=>(
                  <div key={a.id} className="hub-card" style={{
                    padding:"16px 18px",marginBottom:10,
                    animation:`hub-fade-up .3s ease ${i*.06}s both`,
                    borderColor:a.connected?(a.platform==="naver"?"rgba(3,199,90,.3)":"rgba(255,107,53,.3)"):"rgba(255,255,255,.08)",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                      <PIcon p={a.platform} s={30}/>
                      <div style={{flex:1,minWidth:100}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                          <span style={{fontSize:14,fontWeight:700,color:"white"}}>{a.username}</span>
                          {a.blogName && <span style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>({a.blogName})</span>}
                          <span style={{fontSize:9,padding:"2px 7px",borderRadius:99,fontWeight:700,
                            background:a.connected?(a.platform==="naver"?"rgba(3,199,90,.15)":"rgba(255,107,53,.15)"):"rgba(255,255,255,.08)",
                            color:a.connected?(a.platform==="naver"?"#03C75A":"#FF6B35"):"rgba(255,255,255,.4)"}}>
                            {a.connected?"✅ 연결됨":"미연결"}
                          </span>
                        </div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>
                          {a.platform==="naver"?"네이버 블로그":"티스토리"}
                          {a.connectedAt && ` · ${new Date(a.connectedAt).toLocaleDateString("ko-KR")} 연결`}
                        </div>
                      </div>

                      {/* 비밀번호 표시 */}
                      <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.04)",padding:"5px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.07)"}}>
                        <span style={{fontSize:11,color:"rgba(255,255,255,.5)",fontFamily:"monospace"}}>
                          {showPw[a.id] ? a.password : "•".repeat(Math.min(a.password.length,10))}
                        </span>
                        <button style={{background:"none",border:"none",cursor:"pointer",padding:2,color:"rgba(255,255,255,.4)"}}
                          onClick={()=>setShowPw(p=>({...p,[a.id]:!p[a.id]}))}>
                          {showPw[a.id]?<EyeOff style={{width:11,height:11}}/>:<Eye style={{width:11,height:11}}/>}
                        </button>
                      </div>

                      <button className={a.platform==="naver"?"hub-btn-n":"hub-btn-t"}
                        style={{padding:"7px 14px",fontSize:12}}
                        onClick={()=>handleConnect(a)} disabled={!!connecting||!botOnline}>
                        {connecting===a.id
                          ? <><RefreshCw style={{width:11,height:11,animation:"hub-spin 1s linear infinite"}}/>연결 중...</>
                          : a.connected ? "재연결" : "연결"
                        }
                      </button>
                      <button className="hub-btn-g" style={{padding:"7px 10px",color:"rgba(255,100,100,.7)"}}
                        onClick={()=>removeAccount(a.id)}>
                        <Trash2 style={{width:13,height:13}}/>
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ════ 글 생성 ════ */}
          {activeTab==="write" && (
            <div style={{maxWidth:780,animation:"hub-fade-up .35s ease both"}}>
              <div className="hub-card" style={{padding:"22px",marginBottom:16}}>
                <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 14px"}}>네이버/티스토리 전용 글 생성</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 130px",gap:10,marginBottom:12}}>
                  <div>
                    <label style={{fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:600,display:"block",marginBottom:5}}>키워드</label>
                    <input className="hub-input" style={{width:"100%",padding:"10px 13px"}}
                      placeholder="예: 강남 맛집 추천"
                      value={writeKeyword} onChange={e=>setWriteKeyword(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&handleWriteContent()}/>
                  </div>
                  <div>
                    <label style={{fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:600,display:"block",marginBottom:5}}>플랫폼</label>
                    <select className="hub-input" style={{width:"100%",padding:"10px 11px"}}
                      value={writePlatform} onChange={e=>setWritePlatform(e.target.value as Platform)}>
                      <option value="naver">네이버</option>
                      <option value="tistory">티스토리</option>
                    </select>
                  </div>
                </div>
                <button className="hub-btn-n" style={{padding:"11px 22px",fontSize:13}}
                  onClick={handleWriteContent} disabled={writeLoading}>
                  {writeLoading
                    ? <><RefreshCw style={{width:13,height:13,animation:"hub-spin 1s linear infinite"}}/>생성 중...</>
                    : <><FileText style={{width:13,height:13}}/>글 생성</>
                  }
                </button>
              </div>

              {writeResult && (
                <>
                  <div className="hub-card" style={{padding:"22px",marginBottom:12}}>
                    <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.4)",letterSpacing:".1em",textTransform:"uppercase",margin:"0 0 12px"}}>생성 결과</p>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      <div>
                        <label style={{fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:600,display:"block",marginBottom:5}}>제목</label>
                        <input className="hub-input" style={{width:"100%",padding:"9px 13px"}}
                          value={writeTitle} onChange={e=>setWriteTitle(e.target.value)}/>
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:600,display:"block",marginBottom:5}}>태그</label>
                        <input className="hub-input" style={{width:"100%",padding:"9px 13px"}}
                          value={writeTags} onChange={e=>setWriteTags(e.target.value)}/>
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"rgba(255,255,255,.45)",fontWeight:600,display:"block",marginBottom:5}}>본문</label>
                        <textarea className="hub-input" rows={12} style={{width:"100%",padding:"9px 13px",resize:"vertical"}}
                          value={writeResult} onChange={e=>setWriteResult(e.target.value)}/>
                      </div>
                    </div>
                  </div>
                  <button className="hub-btn-n" style={{padding:"13px 22px",fontSize:14,justifyContent:"center",width:"100%"}}
                    onClick={sendToPublish}>
                    <Send style={{width:15,height:15}}/> 발행하기로 넘기기
                  </button>
                </>
              )}
            </div>
          )}

          {/* ════ 히스토리 ════ */}
          {activeTab==="history" && (
            <div style={{animation:"hub-fade-up .35s ease both"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <span style={{fontSize:12,color:"rgba(255,255,255,.45)"}}>총 {history.length}건</span>
                <button className="hub-btn-g" style={{padding:"6px 12px",fontSize:11,color:"rgba(255,80,80,.7)"}}
                  onClick={()=>{if(confirm("전체 히스토리를 삭제할까요?"))setHistory([])}}>
                  <Trash2 style={{width:11,height:11}}/>전체 삭제
                </button>
              </div>
              {history.length===0
                ? <div className="hub-card" style={{padding:"60px",textAlign:"center"}}>
                    <History style={{width:28,height:28,color:"rgba(255,255,255,.15)",margin:"0 auto 10px"}}/>
                    <p style={{color:"rgba(255,255,255,.3)",fontSize:13}}>발행 기록이 없습니다</p>
                  </div>
                : history.map((h,i)=>(
                  <div key={h.id} className="hub-card" style={{
                    padding:"14px 18px",marginBottom:9,
                    animation:`hub-fade-up .3s ease ${i*.04}s both`,
                    borderColor:h.status==="success"?(h.platform==="naver"?"rgba(3,199,90,.2)":"rgba(255,107,53,.2)"):h.status==="fail"?"rgba(255,68,68,.2)":"rgba(255,255,255,.08)",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:11,flexWrap:"wrap"}}>
                      <PIcon p={h.platform} s={18}/>
                      <div style={{flex:1,minWidth:140}}>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--foreground)",marginBottom:2}}>{h.title}</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.4)",display:"flex",alignItems:"center",gap:6}}>
                          <span>{h.account}</span><span>·</span>
                          <Clock style={{width:9,height:9}}/>
                          <span>{new Date(h.publishedAt).toLocaleString("ko-KR")}</span>
                        </div>
                        {h.error && <div style={{fontSize:10,color:"#ff4444",marginTop:2}}>❌ {h.error}</div>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontSize:10,padding:"3px 9px",borderRadius:99,fontWeight:600,
                          background:h.status==="success"?"rgba(3,199,90,.15)":h.status==="fail"?"rgba(255,68,68,.15)":"rgba(245,158,11,.15)",
                          color:h.status==="success"?"#03C75A":h.status==="fail"?"#ff4444":"#f59e0b"}}>
                          {h.status==="success"?"✅ 완료":h.status==="fail"?"❌ 실패":"⏳ 진행"}
                        </span>
                        {h.url && (
                          <a href={h.url} target="_blank" rel="noopener noreferrer"
                            style={{fontSize:10,color:"rgba(255,255,255,.5)",textDecoration:"none",display:"flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:99,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)"}}>
                            <Globe style={{width:9,height:9}}/>보기
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ════ 실시간 로그 ════ */}
          {activeTab==="logs" && (
            <div style={{animation:"hub-fade-up .35s ease both"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span className="sdot sdot-on"/>
                  <span style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>실시간 로그 ({logs.length}줄)</span>
                </div>
                <button className="hub-btn-g" style={{padding:"5px 11px",fontSize:11}} onClick={()=>setLogs([])}>
                  <Trash2 style={{width:10,height:10}}/>지우기
                </button>
              </div>
              <div ref={logRef} style={{
                background:"var(--muted)",border:"1px solid var(--border)",
                borderRadius:12,padding:"14px 18px",height:480,overflowY:"auto",
              }}>
                {logs.length===0
                  ? <div style={{color:"rgba(255,255,255,.25)",fontSize:11,padding:"16px 0",fontFamily:"monospace"}}>
                      {">"} 로그가 여기에 표시됩니다...<span style={{animation:"hub-blink 1s infinite",display:"inline-block"}}>█</span>
                    </div>
                  : logs.map(l=>(
                    <div key={l.id} className={`log-line log-${l.level}`}>
                      <span style={{color:"rgba(255,255,255,.25)",marginRight:8}}>[{l.time}]</span>{l.msg}
                    </div>
                  ))
                }
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
    <NaverGuideBtn />
  );
}

// ── 일반회원 사용설명서 플로팅 버튼 ──────────────────────
function NaverGuideBtn() {
  const [show, setShow] = useState(false);

  const GUIDE_CSS = `
    @keyframes ng-float {
      0%   { transform:translateY(0) scale(1) rotate(0deg); }
      25%  { transform:translateY(-10px) scale(1.04) rotate(-1deg); }
      50%  { transform:translateY(-6px) scale(1.02) rotate(1deg); }
      75%  { transform:translateY(-12px) scale(1.05) rotate(-0.5deg); }
      100% { transform:translateY(0) scale(1) rotate(0deg); }
    }
    @keyframes ng-glow {
      0%,100% { box-shadow:0 8px 32px rgba(234,179,8,.5),0 0 0 0 rgba(234,179,8,.4); }
      50%     { box-shadow:0 20px 60px rgba(234,179,8,.9),0 0 0 12px rgba(234,179,8,0); }
    }
    @keyframes ng-shine {
      0%   { transform:translateX(-150%) skewX(-20deg); }
      100% { transform:translateX(300%) skewX(-20deg); }
    }
    @keyframes ng-ring {
      0%   { transform:scale(1); opacity:.6; }
      100% { transform:scale(2.4); opacity:0; }
    }
    @keyframes ng-badge {
      0%,100% { transform:scale(1) rotate(0deg); }
      33%     { transform:scale(1.2) rotate(-5deg); }
      66%     { transform:scale(1.1) rotate(5deg); }
    }
    @keyframes ng-orbit {
      from { transform:rotate(0deg) translateX(30px) rotate(0deg); }
      to   { transform:rotate(360deg) translateX(30px) rotate(-360deg); }
    }
    @keyframes ng-slide-in {
      from { opacity:0; transform:translateX(100%); }
      to   { opacity:1; transform:translateX(0); }
    }
    .ng-guide-panel {
      position:fixed; top:0; right:0; bottom:0; width:min(400px,100vw);
      background:var(--background); border-left:1px solid var(--border);
      z-index:10000; overflow-y:auto; padding:24px;
      animation:ng-slide-in .3s ease both;
      box-shadow:-8px 0 40px rgba(0,0,0,.15);
    }
    @media(max-width:768px) { .ng-guide-panel { width:100vw; } }
  `;

  const GUIDE_STEPS = [
    {
      step:"STEP 1", title:"봇 서버 실행", color:"#03C75A",
      items:[
        "PC에서 naver-bot 폴더 열기",
        "npm run dev 실행",
        "봇 서버 온라인 확인 (우측 상단)",
      ]
    },
    {
      step:"STEP 2", title:"계정 연결", color:"#4285F4",
      items:[
        "계정 관리 탭 클릭",
        "플랫폼 선택 (네이버/티스토리)",
        "아이디, 비밀번호 입력 후 계정 추가",
        "연결 버튼 클릭 → 브라우저 자동 로그인",
        "2단계 인증 있으면 수동 처리",
      ]
    },
    {
      step:"STEP 3", title:"글 생성", color:"#f59e0b",
      items:[
        "글 생성 탭 클릭",
        "키워드 입력 (예: 강남 맛집)",
        "네이버/티스토리 선택",
        "글 생성 버튼 클릭",
        "제목/태그/본문 자동 생성됨",
        "발행하기로 넘기기 클릭",
      ]
    },
    {
      step:"STEP 4", title:"자동 발행", color:"#a78bfa",
      items:[
        "발행하기 탭에서 계정 선택",
        "이미지 프롬프트 입력 (선택사항)",
        "자동 발행 버튼 클릭",
        "브라우저가 자동으로 로그인 후 발행",
        "히스토리 탭에서 결과 확인",
      ]
    },
  ];

  return (
    <>
      <style>{GUIDE_CSS}</style>

      {/* 파동 링 */}
      <div style={{position:"fixed",bottom:40,right:40,zIndex:9998,width:56,height:56,borderRadius:"50%",border:"2px solid rgba(234,179,8,.6)",animation:"ng-ring 2s ease-out infinite",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:40,right:40,zIndex:9998,width:56,height:56,borderRadius:"50%",border:"2px solid rgba(234,179,8,.4)",animation:"ng-ring 2s ease-out infinite .7s",pointerEvents:"none"}}/>

      {/* 궤도 별 */}
      <div style={{position:"fixed",bottom:54,right:54,zIndex:9999,width:0,height:0,pointerEvents:"none"}}>
        <div style={{animation:"ng-orbit 3s linear infinite"}}>
          <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#fbbf24"/></svg>
        </div>
      </div>

      {/* 플로팅 버튼 */}
      <button
        onClick={()=>setShow(v=>!v)}
        style={{
          position:"fixed",bottom:28,right:28,zIndex:9999,
          display:"flex",alignItems:"center",gap:10,
          padding:"14px 22px",borderRadius:99,
          background:"linear-gradient(135deg,#fbbf24,#f59e0b,#d97706,#b45309)",
          color:"#000",fontWeight:900,fontSize:14,
          border:"2px solid rgba(255,255,255,.3)",
          cursor:"pointer",fontFamily:"'Noto Sans KR',sans-serif",
          animation:"ng-float 4s ease-in-out infinite, ng-glow 2.5s ease-in-out infinite",
          overflow:"hidden",position:"fixed",
        }}
        onMouseEnter={e=>{
          const el = e.currentTarget as HTMLButtonElement;
          el.style.animation="none";
          el.style.transform="translateY(-6px) scale(1.1)";
          el.style.boxShadow="0 24px 60px rgba(234,179,8,.9)";
        }}
        onMouseLeave={e=>{
          const el = e.currentTarget as HTMLButtonElement;
          el.style.animation="ng-float 4s ease-in-out infinite, ng-glow 2.5s ease-in-out infinite";
          el.style.transform="";
          el.style.boxShadow="";
        }}
      >
        {/* 반짝임 */}
        <span style={{position:"absolute",inset:0,background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%)",animation:"ng-shine 2s ease-in-out infinite",pointerEvents:"none"}}/>
        {/* 번개 SVG */}
        <span style={{position:"relative",display:"flex",animation:"ng-float 2s ease-in-out infinite"}}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <defs><linearGradient id="ng-bolt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#78350f"/><stop offset="100%" stopColor="#000"/></linearGradient></defs>
            <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z" fill="url(#ng-bolt)" stroke="#000" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </span>
        <span style={{position:"relative"}}>사용 설명서</span>
        {/* NEW 배지 */}
        <span style={{position:"absolute",top:-8,right:-4,background:"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",fontSize:9,fontWeight:900,padding:"2px 6px",borderRadius:99,border:"2px solid #fff",boxShadow:"0 2px 8px rgba(239,68,68,.5)",animation:"ng-badge 2s ease-in-out infinite"}}>TIP</span>
      </button>

      {/* 설명서 패널 */}
      {show && (
        <div className="ng-guide-panel">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#f59e0b,#d97706)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="white"/>
                </svg>
              </div>
              <div>
                <h2 style={{fontSize:15,fontWeight:800,color:"var(--foreground)",margin:0}}>사용 설명서</h2>
                <p style={{fontSize:11,color:"rgba(255,255,255,.4)",margin:0}}>자동 발행 허브 이용 가이드</p>
              </div>
            </div>
            <button onClick={()=>setShow(false)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted-foreground)",padding:4,fontSize:20}}>✕</button>
          </div>

          {GUIDE_STEPS.map((s,i)=>(
            <div key={i} style={{marginBottom:12,padding:"14px 16px",borderRadius:14,background:"var(--card)",border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:99,background:`${s.color}20`,color:s.color,letterSpacing:".05em"}}>{s.step}</span>
                <span style={{fontSize:13,fontWeight:700,color:"var(--foreground)"}}>{s.title}</span>
              </div>
              {s.items.map((item,j)=>(
                <div key={j} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:5}}>
                  <div style={{width:15,height:15,borderRadius:"50%",flexShrink:0,marginTop:2,background:`${s.color}20`,border:`1px solid ${s.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:s.color}}>{j+1}</div>
                  <span style={{fontSize:12,color:"var(--muted-foreground)",lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
