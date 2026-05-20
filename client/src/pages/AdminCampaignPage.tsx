/**
 * BlogAuto Pro - 체험단 관리자
 * 풀스크린 + 화려한 애니메이션
 */

import { useState, useEffect } from "react";
import { LogOut, Eye, EyeOff, Sun, Moon, Shield } from "lucide-react";
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
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"Pretendard, sans-serif", position:"relative", overflow:"hidden", background:"#0a0a0f" }}>
      <style>{CSS}</style>

      {/* ── 화려한 배경 ── */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden" }}>

        {/* 메시 그라데이션 배경 */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 20%, rgba(124,58,237,0.35) 0%, transparent 50%), radial-gradient(ellipse at 80% 10%, rgba(236,72,153,0.25) 0%, transparent 45%), radial-gradient(ellipse at 60% 80%, rgba(6,182,212,0.2) 0%, transparent 50%), radial-gradient(ellipse at 10% 70%, rgba(251,146,60,0.2) 0%, transparent 45%), radial-gradient(ellipse at 90% 90%, rgba(167,139,250,0.3) 0%, transparent 50%)" }} />

        {/* 움직이는 오브 1 - 보라 */}
        <div style={{ position:"absolute", top:"10%", left:"15%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,0.5) 0%,transparent 70%)", animation:"orb1 8s ease-in-out infinite" }} />
        {/* 움직이는 오브 2 - 핑크 */}
        <div style={{ position:"absolute", top:"20%", right:"10%", width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle,rgba(236,72,153,0.4) 0%,transparent 70%)", animation:"orb2 10s ease-in-out infinite" }} />
        {/* 움직이는 오브 3 - 시안 */}
        <div style={{ position:"absolute", bottom:"15%", left:"20%", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,0.35) 0%,transparent 70%)", animation:"orb3 7s ease-in-out infinite" }} />
        {/* 움직이는 오브 4 - 오렌지 */}
        <div style={{ position:"absolute", bottom:"25%", right:"20%", width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(251,146,60,0.3) 0%,transparent 70%)", animation:"orb4 9s ease-in-out infinite" }} />
        {/* 움직이는 오브 5 - 에메랄드 */}
        <div style={{ position:"absolute", top:"50%", left:"50%", width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(52,211,153,0.25) 0%,transparent 70%)", animation:"orb5 11s ease-in-out infinite", transform:"translate(-50%,-50%)" }} />

        {/* 글리치 라인 */}
        <div style={{ position:"absolute", top:"35%", left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.3),transparent)", animation:"glitchLine 6s ease-in-out infinite" }} />
        <div style={{ position:"absolute", top:"65%", left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(236,72,153,0.2),transparent)", animation:"glitchLine 8s ease-in-out infinite 2s" }} />

        {/* 별 파티클 */}
        {[
          {x:5,y:10,s:3,d:5,dl:0,c:"#c4b5fd"},{x:90,y:15,s:2,d:7,dl:1,c:"#f9a8d4"},
          {x:15,y:85,s:4,d:6,dl:2,c:"#67e8f9"},{x:80,y:80,s:3,d:8,dl:0.5,c:"#fcd34d"},
          {x:50,y:5,s:2,d:5,dl:1.5,c:"#a78bfa"},{x:25,y:45,s:3,d:9,dl:3,c:"#f472b6"},
          {x:75,y:50,s:2,d:7,dl:2,c:"#34d399"},{x:40,y:90,s:4,d:6,dl:1,c:"#fb923c"},
          {x:60,y:30,s:2,d:8,dl:0.8,c:"#a78bfa"},{x:10,y:60,s:3,d:5,dl:2.5,c:"#67e8f9"},
          {x:85,y:40,s:2,d:7,dl:1.8,c:"#f9a8d4"},{x:35,y:20,s:3,d:9,dl:0.3,c:"#fcd34d"},
        ].map((p,i)=>(
          <div key={i} style={{ position:"absolute", left:`${p.x}%`, top:`${p.y}%`, width:p.s, height:p.s, borderRadius:"50%", background:p.c, boxShadow:`0 0 ${p.s*3}px ${p.c}`, animation:`starFloat ${p.d}s ease-in-out infinite ${p.dl}s` }} />
        ))}

        {/* 격자 패턴 */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(167,139,250,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(167,139,250,0.03) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

        {/* 상단 빛줄기 */}
        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:2, height:"40%", background:"linear-gradient(180deg,rgba(167,139,250,0.6),transparent)", filter:"blur(1px)", animation:"lightBeam 4s ease-in-out infinite" }} />
        <div style={{ position:"absolute", top:0, left:"30%", width:1, height:"30%", background:"linear-gradient(180deg,rgba(236,72,153,0.4),transparent)", animation:"lightBeam 6s ease-in-out infinite 1s" }} />
        <div style={{ position:"absolute", top:0, left:"70%", width:1, height:"25%", background:"linear-gradient(180deg,rgba(6,182,212,0.4),transparent)", animation:"lightBeam 5s ease-in-out infinite 2s" }} />
      </div>

      {/* 추가 CSS 애니메이션 */}
      <style>{`
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(60px,-40px) scale(1.15)} 66%{transform:translate(-30px,50px) scale(0.9)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,60px) scale(1.2)} 66%{transform:translate(40px,-30px) scale(0.85)} }
        @keyframes orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(80px,-60px) scale(1.1)} }
        @keyframes orb4 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-70px,40px) scale(1.15)} }
        @keyframes orb5 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.3)} }
        @keyframes starFloat { 0%,100%{transform:translateY(0) scale(1);opacity:0.7} 50%{transform:translateY(-20px) scale(1.3);opacity:1} }
        @keyframes glitchLine { 0%,100%{opacity:0;transform:scaleX(0)} 30%,70%{opacity:1;transform:scaleX(1)} }
        @keyframes lightBeam { 0%,100%{opacity:0.3;transform:translateX(-50%) scaleY(1)} 50%{opacity:0.8;transform:translateX(-50%) scaleY(1.2)} }
      `}</style>

      <button className="ca-back" onClick={() => navigate("/campaigns")}
        style={{ position:"fixed", top:20, left:20, width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10, backdropFilter:"blur(10px)" }}>🏠</button>
      <button onClick={toggleTheme} className="ca-btn"
        style={{ position:"fixed", top:20, right:20, width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", zIndex:10, backdropFilter:"blur(10px)" }}>
        {theme==="dark" ? <Sun style={{width:17,height:17}}/> : <Moon style={{width:17,height:17}}/>}
      </button>

      <div style={{ width:"100%", maxWidth:440, position:"relative", zIndex:1, animation:"scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div style={{ position:"absolute", inset:-2, borderRadius:28, background:"linear-gradient(135deg,#7c3aed,#a78bfa,#c4b5fd,#7c3aed)", backgroundSize:"300% 300%", animation:"borderSpin 4s linear infinite", zIndex:-1, opacity:0.7 }} />
        <div style={{ background:"rgba(10,10,20,0.85)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:26, padding:"52px 44px", boxShadow:"0 32px 64px rgba(0,0,0,0.5)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)" }}>
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ position:"relative", display:"inline-block", marginBottom:20 }}>
              <div style={{ width:80, height:80, borderRadius:22, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, boxShadow:"0 12px 32px rgba(124,58,237,0.5)", animation:"float 3.5s ease-in-out infinite" }}>🛡️</div>
              <div style={{ position:"absolute", inset:-6, borderRadius:28, border:"2px solid rgba(167,139,250,0.35)", animation:"pulse 2s ease-in-out infinite" }} />
            </div>
            <div style={{ fontSize:28, fontWeight:900, color:"#fff", letterSpacing:"-0.04em", marginBottom:8 }}>체험단 관리자</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>체험단 허브 관리자 시스템</div>
          </div>
          <div style={{ position:"relative", marginBottom:14 }}>
            <input type={show?"text":"password"} placeholder="관리자 비밀번호" value={pw}
              className="ca-input"
              onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
              style={{ width:"100%", padding:"16px 52px 16px 20px", borderRadius:14, border:"1px solid rgba(167,139,250,0.3)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:15, fontFamily:"Pretendard, sans-serif" }} />
            <button onClick={()=>setShow(s=>!s)} className="ca-btn"
              style={{ position:"absolute", right:16, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.5)", padding:4 }}>
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
  const [, navigate]              = useLocation();
  const { theme, toggleTheme }    = useTheme();
  const [curPw, setCurPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [confPw, setConfPw] = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [chPwLoading, setChPwLoading] = useState(false);

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

  const pwFields = [
    { label:"현재 비밀번호", val:curPw, set:setCurPw, show:showCur, setShow:setShowCur },
    { label:"새 비밀번호",   val:newPw, set:setNewPw, show:showNew, setShow:setShowNew },
    { label:"비밀번호 확인", val:confPw,set:setConfPw,show:showConf,setShow:setShowConf },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--background)", fontFamily:"Pretendard, sans-serif", position:"relative" }}>
      <style>{CSS}</style>

      {/* 배경 장식 */}
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
            <div style={{ fontSize:18, fontWeight:900, color:"var(--foreground)", letterSpacing:"-0.04em" }}>체험단 관리자</div>
            <div style={{ fontSize:11, color:"#a78bfa", fontWeight:600 }}>비밀번호 관리</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
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
      <div style={{ maxWidth:680, margin:"0 auto", padding:"48px 28px 80px", position:"relative", zIndex:1 }}>
        {/* 비밀번호 변경 */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:20, padding:36, animation:"fadeUp 0.5s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
            <div style={{ width:44, height:44, borderRadius:13, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 20px rgba(124,58,237,0.4)" }}>
              <Shield style={{ width:20, height:20, color:"#fff" }} />
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:"var(--foreground)" }}>비밀번호 변경</div>
              <div style={{ fontSize:12, color:"var(--muted-foreground)" }}>변경 후 자동 로그아웃됩니다</div>
            </div>
          </div>
          <div className="pw-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
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

