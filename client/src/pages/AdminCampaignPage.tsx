/**
 * BlogAuto Pro - 체험단 관리자
 * 풀스크린 + 화려한 애니메이션
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, LogOut, Eye, EyeOff, Zap, Sun, Moon, TrendingUp, Shield } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { useLocation } from "wouter";

const SESS_KEY = "campaign_admin_sess";
const SITE = { name:"모두의체험단", url:"https://www.modan.kr", key:"modan", color:"#a78bfa", grad:"linear-gradient(135deg,#7c3aed,#a78bfa)", bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.25)" };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800;900&display=swap');
* { box-sizing: border-box; }

@keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes scaleIn   { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
@keyframes slideR    { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes float     { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(3deg)} }
@keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.96)} }
@keyframes glowPurple { 0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.3),0 0 40px rgba(124,58,237,0.1)} 50%{box-shadow:0 0 40px rgba(124,58,237,0.6),0 0 80px rgba(124,58,237,0.2)} }
@keyframes shimmer   { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(200%) skewX(-15deg)} }
@keyframes countUp   { from{opacity:0;transform:translateY(10px) scale(0.8)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes borderSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
@keyframes particleFloat {
  0%{transform:translateY(0) translateX(0) scale(1);opacity:0.5}
  33%{transform:translateY(-30px) translateX(15px) scale(1.2);opacity:0.9}
  66%{transform:translateY(-15px) translateX(-10px) scale(0.8);opacity:0.6}
  100%{transform:translateY(0) translateX(0) scale(1);opacity:0.5}
}

.ca-btn {
  transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.ca-btn:hover { transform:translateY(-2px) scale(1.03); }
.ca-btn:active { transform:scale(0.96) !important; }

.ca-card {
  animation: fadeUp 0.5s ease both;
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
  position: relative;
  overflow: hidden;
}
.ca-card::before {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,0.03),transparent 60%);
  pointer-events:none;
  border-radius:inherit;
}
.ca-card:hover { transform:translateY(-4px) scale(1.005); box-shadow:0 24px 60px rgba(0,0,0,0.25); }

.ca-row { transition:all 0.18s ease; }
.ca-row:hover { background:rgba(167,139,250,0.05) !important; transform:translateX(4px); }

.ca-back { transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
.ca-back:hover { transform:scale(1.15) rotate(-10deg); }

.ca-input { transition:border-color 0.2s, box-shadow 0.2s; outline:none; }
.ca-input:focus { box-shadow:0 0 0 3px rgba(167,139,250,0.2) !important; border-color:#a78bfa !important; }

.shimmer-btn::before {
  content:'';
  position:absolute;
  top:0; left:0;
  width:40%; height:100%;
  background:rgba(255,255,255,0.15);
  transform:skewX(-20deg) translateX(-100%);
  animation: shimmer 2.5s infinite;
}

.particle {
  position:absolute;
  border-radius:50%;
  animation: particleFloat linear infinite;
  pointer-events:none;
}

@media (max-width: 768px) {
  .ca-main    { padding: 16px 16px 80px !important; }
  .ca-topbar  { padding: 12px 16px !important; flex-wrap:wrap; gap:8px; }
  .stat-grid  { grid-template-columns: 1fr 1fr !important; }
  .pw-grid    { grid-template-columns: 1fr !important; }
  .hero-nums  { flex-direction: row !important; gap: 12px !important; }
  .topbtns    { gap: 6px !important; }
}
@media (max-width: 480px) {
  .stat-grid  { grid-template-columns: 1fr !important; }
  .hero-inner { flex-direction: column !important; }
  .hero-nums  { justify-content: flex-start !important; }
}
`;

async function campApi(action: string, extra: Record<string,any>={}, token?: string) {
  const headers: Record<string,string> = { "Content-Type":"application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch("/api/scrape-campaigns", {
      method:"POST", headers, body:JSON.stringify({ action, ...extra }),
    });
    return await res.json();
  } catch { return { ok:false, error:"네트워크 오류" }; }
}

function Particles() {
  const list = [
    {s:8,x:8,y:15,d:7,dl:0,c:"#a78bfa"},{s:5,x:85,y:10,d:9,dl:1,c:"#7c3aed"},
    {s:6,x:45,y:5,d:8,dl:2,c:"#c4b5fd"},{s:4,x:92,y:60,d:11,dl:0.5,c:"#a78bfa"},
    {s:7,x:20,y:80,d:6,dl:1.5,c:"#8b5cf6"},{s:5,x:70,y:85,d:10,dl:3,c:"#c4b5fd"},
    {s:6,x:55,y:45,d:9,dl:0.8,c:"#7c3aed"},{s:4,x:5,y:50,d:7,dl:2.5,c:"#a78bfa"},
  ];
  return <>{list.map((p,i)=>(
    <div key={i} className="particle" style={{ width:p.s, height:p.s, left:`${p.x}%`, top:`${p.y}%`, background:p.c, opacity:0.35, animationDuration:`${p.d}s`, animationDelay:`${p.dl}s` }} />
  ))}</>;
}

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (diff === 0) return;
    const steps = 30;
    let step = 0;
    const t = setInterval(() => {
      step++;
      setDisplay(Math.round(start + (diff * step) / steps));
      if (step >= steps) { clearInterval(t); prev.current = value; }
    }, 20);
    return () => clearInterval(t);
  }, [value]);
  useEffect(() => { setDisplay(value); prev.current = value; }, []);
  return <>{display}</>;
}

// ── 로그인 ────────────────────────────────────────────
function LoginGate({ onAuth }: { onAuth:(t:string)=>void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  async function login() {
    if (!pw.trim()) { toast.error("비밀번호를 입력해주세요"); return; }
    setLoading(true);
    const d = await campApi("loginCampaignAdmin", { password:pw });
    if (d.ok) { sessionStorage.setItem(SESS_KEY, d.token); toast.success("✅ 로그인 성공"); onAuth(d.token); }
    else toast.error(d.error || "비밀번호가 올바르지 않습니다");
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--background)", padding:20, fontFamily:"Pretendard, sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.1) 0%,transparent 70%)" }} />
        <Particles />
      </div>
      <button className="ca-back" onClick={() => navigate("/campaigns")}
        style={{ position:"fixed", top:20, left:20, width:48, height:48, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}>🏠</button>
      <button onClick={toggleTheme} className="ca-btn"
        style={{ position:"fixed", top:20, right:20, width:44, height:44, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--foreground)", zIndex:10 }}>
        {theme==="dark" ? <Sun style={{width:17,height:17}}/> : <Moon style={{width:17,height:17}}/>}
      </button>

      <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:1, animation:"scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div style={{ position:"absolute", inset:-2, borderRadius:28, background:"linear-gradient(135deg,#7c3aed,#a78bfa,#c4b5fd,#7c3aed)", backgroundSize:"300% 300%", animation:"borderSpin 4s linear infinite", zIndex:-1, opacity:0.7 }} />
        <div style={{ background:"var(--muted)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:26, padding:"52px 44px", boxShadow:"0 32px 64px rgba(0,0,0,0.2)" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ position:"relative", display:"inline-block", marginBottom:20 }}>
              <div style={{ width:80, height:80, borderRadius:22, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 12px 32px rgba(124,58,237,0.5)", animation:"float 3.5s ease-in-out infinite" }}>🛡️</div>
              <div style={{ position:"absolute", inset:-6, borderRadius:28, border:"2px solid rgba(167,139,250,0.35)", animation:"pulse 2s ease-in-out infinite" }} />
            </div>
            <div style={{ fontSize:28, fontWeight:900, color:"var(--foreground)", letterSpacing:"-0.04em", marginBottom:8 }}>체험단 관리자</div>
            <div style={{ fontSize:13, color:"var(--muted-foreground)" }}>모두의체험단 수집 관리 시스템</div>
          </div>
          <div style={{ position:"relative", marginBottom:14 }}>
            <input type={show?"text":"password"} placeholder="관리자 비밀번호" value={pw}
              className="ca-input"
              onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
              style={{ width:"100%", padding:"16px 52px 16px 20px", borderRadius:14, border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:15, fontFamily:"Pretendard, sans-serif" }} />
            <button onClick={()=>setShow(s=>!s)} className="ca-btn"
              style={{ position:"absolute", right:16, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--muted-foreground)", padding:4 }}>
              {show?<EyeOff style={{width:18,height:18}}/>:<Eye style={{width:18,height:18}}/>}
            </button>
          </div>
          <button onClick={login} disabled={loading} className="ca-btn shimmer-btn"
            style={{ width:"100%", padding:17, borderRadius:14, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", fontWeight:800, fontSize:16, border:"none", boxShadow:"0 12px 32px rgba(124,58,237,0.45)", animation:"glowPurple 3s ease-in-out infinite", opacity:loading?0.75:1, fontFamily:"Pretendard, sans-serif" }}>
            {loading ? "확인 중..." : "로그인 →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 대시보드 ──────────────────────────────────────────
function AdminDashboard({ token, onLogout }: { token:string; onLogout:()=>void }) {
  const [status, setStatus]       = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string|null>(null);
  const [total, setTotal]         = useState(0);
  const [scraping, setScraping]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [, navigate]              = useLocation();
  const { theme, toggleTheme }    = useTheme();
  const [curPw, setCurPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [confPw, setConfPw] = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [chPwLoading, setChPwLoading] = useState(false);

  useEffect(()=>{ fetchAll(); },[]);

  async function fetchAll() {
    setLoading(true);
    const [sr, cr] = await Promise.all([campApi("status",{},token), campApi("load",{},token)]);
    if (sr.ok) { setStatus(sr.status||[]); setUpdatedAt(sr.updatedAt); setTotal(sr.total||0); }
    else if (sr.error?.includes("인증")) { toast.error("세션 만료"); onLogout(); }
    if (cr.ok) setCampaigns(cr.campaigns||[]);
    setLoading(false);
  }

  async function handleScrape() {
    setScraping(true);
    toast.loading("🚀 수집 시작 — 1분 후 새로고침하세요", {id:"scrape", duration:60000});
    const d = await campApi("scrape",{},token);
    if (d.ok) toast.success("✅ 수집 요청 완료",{id:"scrape"});
    else toast.error(d.error||"실패",{id:"scrape"});
    setScraping(false);
  }

  async function handleChangePw() {
    if (!curPw||!newPw||!confPw) { toast.error("모든 항목을 입력해주세요"); return; }
    if (newPw!==confPw) { toast.error("새 비밀번호가 일치하지 않아요"); return; }
    if (newPw.length<4) { toast.error("4자 이상 입력해주세요"); return; }
    setChPwLoading(true);
    const d = await campApi("changeCampaignPw",{currentPw:curPw,newPw},token);
    if (d.ok) { toast.success("비밀번호 변경 완료"); setTimeout(onLogout,1200); }
    else toast.error(d.error||"변경 실패");
    setChPwLoading(false);
  }

  const fmt = (ts:string|null) => {
    if (!ts) return "없음";
    try { return new Date(ts).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
    catch { return ts; }
  };

  const st  = status.find(s=>s.name===SITE.name);
  const cnt = campaigns.filter(c=>c.source===SITE.name).length;
  const filteredCampaigns = useMemo(()=> campaigns.filter(c=>c.source===SITE.name), [campaigns]);
  const urgentCnt = filteredCampaigns.filter(c=>c.deadline<=3).length;

  const pwFields = [
    { label:"현재 비밀번호", val:curPw,  set:setCurPw,  show:showCur,  setShow:setShowCur  },
    { label:"새 비밀번호",   val:newPw,  set:setNewPw,  show:showNew,  setShow:setShowNew  },
    { label:"확인",          val:confPw, set:setConfPw, show:showConf, setShow:setShowConf },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--background)", fontFamily:"Pretendard, sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-10%", right:"5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:"5%", left:"2%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.05) 0%,transparent 70%)" }} />
        <Particles />
      </div>

      {/* 탑바 */}
      <div className="ca-topbar" style={{ position:"sticky", top:0, zIndex:50, background:"var(--background)ee", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderBottom:"1px solid var(--border)", padding:"14px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:14, animation:"slideDown 0.4s ease both" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button className="ca-back" onClick={()=>navigate("/campaigns")}
            style={{ width:44, height:44, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>🏠</button>
          <div>
            <div style={{ fontSize:18, fontWeight:900, color:"var(--foreground)", letterSpacing:"-0.04em", display:"flex", alignItems:"center", gap:8 }}>
              체험단 관리자
              <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80", fontWeight:700, display:"inline-flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 6px #4ade80", display:"inline-block", animation:"pulse 1.8s ease-in-out infinite" }} /> LIVE
              </span>
            </div>
            <div style={{ fontSize:11, color:"#a78bfa", fontWeight:600 }}>모두의체험단 수집 관리</div>
          </div>
        </div>
        <div className="topbtns" style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={fetchAll} disabled={loading} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, padding:"10px 16px", borderRadius:10, background:"var(--muted)", border:"1px solid var(--border)", color:"var(--foreground)", fontWeight:600 }}>
            <RefreshCw style={{ width:13, height:13, animation:loading?"spin 1s linear infinite":"none" }} /> 갱신
          </button>
          <button onClick={handleScrape} disabled={scraping} className="ca-btn shimmer-btn"
            style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, padding:"10px 22px", borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", fontWeight:700, border:"none", boxShadow:"0 6px 20px rgba(124,58,237,0.4)", animation:!scraping?"glowPurple 3s ease-in-out infinite":"none" }}>
            <Zap style={{ width:15, height:15, animation:scraping?"spin 0.8s linear infinite":"none" }} />
            {scraping?"수집 중...":"실시간 수집"}
          </button>
          <button onClick={onLogout} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444" }}>
            <LogOut style={{ width:13, height:13 }} /> 로그아웃
          </button>
          <button onClick={toggleTheme} className="ca-btn"
            style={{ width:40, height:40, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--foreground)" }}>
            {theme==="dark" ? <Sun style={{width:16,height:16}}/> : <Moon style={{width:16,height:16}}/>}
          </button>
        </div>
      </div>

      {/* 메인 */}
      <div className="ca-main" style={{ width:"100%", padding:"28px 28px 80px", position:"relative", zIndex:1 }}>

        {/* 히어로 카드 */}
        <div className="ca-card" style={{ background:SITE.bg, border:`1px solid ${SITE.border}`, borderRadius:22, padding:"36px 44px", marginBottom:20, animationDelay:"0.05s" }}>
          <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:-50, left:50, width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.12) 0%,transparent 70%)", pointerEvents:"none" }} />

          <div className="hero-inner" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24, position:"relative" }}>
            <div style={{ flex:1, minWidth:260 }}>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18 }}>
                <div style={{ width:60, height:60, borderRadius:18, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, boxShadow:"0 10px 28px rgba(124,58,237,0.45)", animation:"float 4s ease-in-out infinite" }}>🏆</div>
                <div>
                  <div style={{ fontSize:26, fontWeight:900, color:SITE.color, letterSpacing:"-0.03em" }}>{SITE.name}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
                    {st ? (st.ok
                      ? <><CheckCircle style={{width:14,height:14,color:"#4ade80"}}/><span style={{fontSize:12,color:"#4ade80",fontWeight:700}}>수집 성공</span></>
                      : <><XCircle style={{width:14,height:14,color:"#f87171"}}/><span style={{fontSize:12,color:"#f87171"}}>{st.error}</span></>
                    ) : <span style={{fontSize:12,color:"var(--muted-foreground)"}}>수집 대기</span>}
                    {st && <span style={{fontSize:11,color:"var(--muted-foreground)",display:"flex",alignItems:"center",gap:3}}><Clock style={{width:10,height:10}}/>{fmt(st.scrapedAt)}</span>}
                  </div>
                </div>
              </div>
              <a href={SITE.url} target="_blank" rel="noreferrer" className="ca-btn shimmer-btn"
                style={{ display:"inline-flex", alignItems:"center", gap:7, fontSize:13, fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", padding:"11px 22px", borderRadius:11, textDecoration:"none", boxShadow:"0 6px 20px rgba(124,58,237,0.4)" }}>
                사이트 방문 <ExternalLink style={{width:13,height:13}}/>
              </a>
            </div>

            <div className="hero-nums" style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              {[
                { label:"수집 공고", val:cnt,       color:"#a78bfa", sub:"공고 수집됨" },
                { label:"마감 임박", val:urgentCnt,  color:"#fb923c", sub:"D-3 이내" },
                { label:"전체 합산", val:total,      color:"#60a5fa", sub:"누적 데이터" },
              ].map((s,i) => (
                <div key={i} style={{ textAlign:"center", background:"rgba(0,0,0,0.18)", borderRadius:16, padding:"20px 28px", border:`1px solid ${s.color}33`, minWidth:100, animation:`countUp 0.6s ${0.1+i*0.1}s ease both` }}>
                  <div style={{ fontSize:52, fontWeight:900, color:s.color, lineHeight:1 }}><AnimatedCount value={s.val} /></div>
                  <div style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:6, fontWeight:600 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="stat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
          {[
            { label:"총 수집 공고",  display:String(total),      color:"#a78bfa", emoji:"📋", sub:"전체 합산", delay:"0.1s" },
            { label:"마지막 수집",   display:fmt(updatedAt),     color:"#60a5fa", emoji:"🕐", sub:"업데이트",  delay:"0.15s", small:true },
            { label:"수집 성공률",   display:status.length>0?`${Math.round(status.filter(s=>s.ok).length/status.length*100)}%`:"—", color:status.some(s=>!s.ok)?"#fb923c":"#4ade80", emoji:"📡", sub:"사이트 상태", delay:"0.2s" },
          ].map((s,i)=>(
            <div key={i} className="ca-card"
              style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:16, padding:"24px 28px", animationDelay:s.delay }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:10, fontWeight:600 }}>{s.label}</div>
                  <div style={{ fontSize:(s as any).small||s.display.length>8?15:32, fontWeight:900, color:s.color, lineHeight:1.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.display||"—"}</div>
                  <div style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:8, fontWeight:500 }}>{s.sub}</div>
                </div>
                <div style={{ fontSize:30, marginLeft:12, flexShrink:0, animation:"float 4s ease-in-out infinite" }}>{s.emoji}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 공고 목록 */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:20, padding:28, marginBottom:20, animation:"fadeUp 0.5s 0.25s ease both" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <TrendingUp style={{ width:18, height:18, color:"#a78bfa" }} />
              </div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:"var(--foreground)" }}>수집된 공고 목록</div>
                <div style={{ fontSize:11, color:"var(--muted-foreground)" }}>모두의체험단 실시간 데이터</div>
              </div>
              <span style={{ fontSize:13, padding:"4px 14px", borderRadius:20, background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(167,139,250,0.15))", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.3)", fontWeight:700 }}>
                {filteredCampaigns.length}개
              </span>
            </div>
            <button onClick={fetchAll} disabled={loading} className="ca-btn"
              style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, padding:"8px 14px", borderRadius:8, background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.25)", color:"#a78bfa", fontWeight:600 }}>
              <RefreshCw style={{ width:12, height:12, animation:loading?"spin 1s linear infinite":"none" }} /> 새로고침
            </button>
          </div>

          {loading ? (
            <div style={{ padding:"60px", textAlign:"center", color:"var(--muted-foreground)" }}>
              <div style={{ width:52, height:52, borderRadius:"50%", border:"3px solid rgba(167,139,250,0.2)", borderTop:"3px solid #a78bfa", margin:"0 auto 16px", animation:"spin 0.8s linear infinite" }} />
              <div style={{ fontSize:14, fontWeight:600 }}>불러오는 중...</div>
            </div>
          ) : filteredCampaigns.length===0 ? (
            <div style={{ padding:"60px", textAlign:"center" }}>
              <div style={{ fontSize:52, marginBottom:16, animation:"bounce 2s ease-in-out infinite" }}>📭</div>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--foreground)", marginBottom:8 }}>수집된 공고가 없습니다</div>
              <div style={{ fontSize:13, color:"var(--muted-foreground)" }}>실시간 수집 버튼을 눌러주세요</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:560, overflowY:"auto", paddingRight:4 }}>
              {filteredCampaigns.map((c:any,i:number)=>{
                const urgent = c.deadline<=3;
                return (
                  <div key={String(c.id)} className="ca-row"
                    style={{ display:"flex", alignItems:"center", gap:16, background:"var(--background)", border:`1px solid ${urgent?"rgba(251,146,60,0.3)":"var(--border)"}`, borderRadius:13, padding:"16px 22px", animation:`slideR 0.35s ${i*0.03}s ease both`, boxShadow:urgent?"0 0 14px rgba(251,146,60,0.08)":"none" }}>
                    <div style={{ width:4, height:48, borderRadius:2, background:urgent?"linear-gradient(180deg,#fb923c,#f97316)":"linear-gradient(180deg,#7c3aed,#a78bfa)", flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"var(--foreground)", marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ fontSize:11, color:"#a78bfa", fontWeight:700, background:"rgba(167,139,250,0.1)", padding:"2px 8px", borderRadius:6 }}>{c.source}</span>
                        <span style={{ fontSize:11, color:"var(--muted-foreground)", display:"flex", alignItems:"center", gap:3 }}>📍 {c.region||"전국"}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:18, fontWeight:900, color:urgent?"#fb923c":"var(--muted-foreground)", lineHeight:1 }}>D-{c.deadline}</div>
                        {urgent && <div style={{ fontSize:9, color:"#fb923c", fontWeight:700 }}>임박⚡</div>}
                      </div>
                      <a href={c.url} target="_blank" rel="noreferrer" className="ca-btn shimmer-btn"
                        style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, color:"#fff", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", padding:"10px 18px", borderRadius:10, textDecoration:"none", whiteSpace:"nowrap", boxShadow:"0 4px 14px rgba(124,58,237,0.35)" }}>
                        공고 보기 <ExternalLink style={{width:11,height:11}}/>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 비밀번호 변경 */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:20, padding:32, animation:"fadeUp 0.5s 0.35s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Shield style={{ width:18, height:18, color:"#a78bfa" }} />
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"var(--foreground)" }}>비밀번호 변경</div>
              <div style={{ fontSize:12, color:"var(--muted-foreground)" }}>변경 후 자동 로그아웃됩니다</div>
            </div>
          </div>
          <div className="pw-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:18 }}>
            {pwFields.map(f=>(
              <div key={f.label}>
                <label style={{ fontSize:11, color:"var(--muted-foreground)", display:"block", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{f.label}</label>
                <div style={{ position:"relative" }}>
                  <input type={f.show?"text":"password"} placeholder={f.label} value={f.val}
                    className="ca-input"
                    onChange={e=>f.set(e.target.value)}
                    style={{ width:"100%", padding:"13px 46px 13px 18px", borderRadius:11, border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:14, fontFamily:"Pretendard, sans-serif" }} />
                  <button onClick={()=>f.setShow(!f.show)} className="ca-btn"
                    style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--muted-foreground)", padding:4 }}>
                    {f.show?<EyeOff style={{width:17,height:17}}/>:<Eye style={{width:17,height:17}}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleChangePw} disabled={chPwLoading} className="ca-btn shimmer-btn"
            style={{ padding:"13px 32px", borderRadius:11, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", fontWeight:800, fontSize:14, border:"none", boxShadow:"0 8px 24px rgba(124,58,237,0.35)", opacity:chPwLoading?0.75:1, fontFamily:"Pretendard, sans-serif" }}>
            {chPwLoading?"변경 중...":"비밀번호 변경"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCampaignPage() {
  const [token, setToken] = useState<string|null>(null);
  useEffect(()=>{
    const saved = sessionStorage.getItem(SESS_KEY);
    if (saved) setToken(saved);
  },[]);
  if (!token) return <LoginGate onAuth={tk=>setToken(tk)} />;
  return <AdminDashboard token={token} onLogout={()=>{ sessionStorage.removeItem(SESS_KEY); setToken(null); }} />;
}
