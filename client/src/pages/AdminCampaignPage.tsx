/**
 * BlogAuto Pro - 체험단 관리자
 * 수집 사이트: 모두의체험단
 */

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, LogOut, Eye, EyeOff, TrendingUp, Zap, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { useLocation } from "wouter";

const SESS_KEY = "campaign_admin_sess";

const SITES = [
  { name:"모두의체험단", url:"https://www.modan.kr", key:"modan", color:"#a78bfa", grad:"linear-gradient(135deg,#7c3aed,#a78bfa)", bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.25)" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800;900&display=swap');

@keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes spin     { to{transform:rotate(360deg)} }
@keyframes glow     { 0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,0)} 50%{box-shadow:0 0 24px 6px rgba(167,139,250,0.2)} }
@keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
@keyframes slideR   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
@keyframes float    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }

.ca-btn     { transition:all 0.18s cubic-bezier(0.34,1.56,0.64,1); cursor:pointer; }
.ca-btn:hover   { opacity:0.88; transform:translateY(-2px) scale(1.02); }
.ca-btn:active  { transform:scale(0.96) !important; }
.ca-card    { animation:fadeUp 0.4s ease both; transition:transform 0.22s,box-shadow 0.22s; }
.ca-card:hover  { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.18); }
.ca-row     { transition:background 0.15s,transform 0.15s; }
.ca-row:hover   { background:rgba(167,139,250,0.04) !important; transform:translateX(2px); }
.ca-back    { animation:bounce 2.8s ease-in-out infinite; transition:all 0.2s; }
.ca-back:hover  { animation:none; transform:scale(1.18) rotate(-8deg); }
.ca-input   { transition:border-color 0.2s,box-shadow 0.2s; outline:none; }
.ca-input:focus { box-shadow:0 0 0 3px rgba(167,139,250,0.15) !important; }

@media (max-width: 640px) {
  .ca-grid3   { grid-template-columns: 1fr 1fr !important; }
  .ca-topbar  { flex-wrap: wrap; gap: 10px !important; padding: 14px 16px !important; }
  .ca-topbtns { flex-wrap: wrap; gap: 10px !important; }
  .ca-main    { padding: 16px !important; }
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

// ── 로그인 ────────────────────────────────────────────
function LoginGate({ onAuth }: { onAuth:(t:string)=>void }) {
  const [pw, setPw]           = useState("");
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate]          = useLocation();
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
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--background)", padding:"20px", fontFamily:"Pretendard, sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 30% 30%, rgba(124,58,237,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(167,139,250,0.06) 0%, transparent 50%)", pointerEvents:"none" }} />

      <button className="ca-back" onClick={() => navigate("/campaigns")}
        style={{ position:"fixed", top:16, left:16, width:46, height:46, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", fontSize:"22px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}>
        🏠
      </button>
      <button onClick={toggleTheme} className="ca-btn"
        style={{ position:"fixed", top:16, right:16, width:42, height:42, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--foreground)", cursor:"pointer", zIndex:10 }}>
        {theme==="dark" ? <Sun style={{width:16,height:16}}/> : <Moon style={{width:16,height:16}}/>}
      </button>

      <div style={{ width:"100%", maxWidth:420, background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"24px", padding:"48px 40px", animation:"scaleIn 0.45s ease both", position:"relative", zIndex:1, boxShadow:"0 24px 48px rgba(0,0,0,0.15)" }}>
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <div style={{ width:72, height:72, borderRadius:"20px", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", margin:"0 auto 16px", boxShadow:"0 8px 24px rgba(124,58,237,0.35)", animation:"float 3s ease-in-out infinite" }}>🛡️</div>
          <div style={{ fontSize:"24px", fontWeight:800, color:"var(--foreground)", letterSpacing:"-0.04em", marginBottom:"6px" }}>체험단 관리자</div>
          <div style={{ fontSize:"13px", color:"var(--muted-foreground)" }}>모두의체험단 수집 관리</div>
        </div>

        <div style={{ position:"relative", marginBottom:"14px" }}>
          <input type={show?"text":"password"} placeholder="관리자 비밀번호" value={pw}
            className="ca-input"
            onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
            style={{ width:"100%", padding:"15px 52px 15px 18px", borderRadius:"12px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"15px", boxSizing:"border-box" }}
            onFocus={e=>(e.target as HTMLInputElement).style.borderColor="#a78bfa"}
            onBlur={e=>(e.target as HTMLInputElement).style.borderColor="var(--border)"} />
          <button onClick={()=>setShow(s=>!s)} className="ca-btn"
            style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--muted-foreground)", padding:6 }}>
            {show?<EyeOff style={{width:18,height:18}}/>:<Eye style={{width:18,height:18}}/>}
          </button>
        </div>

        <button onClick={login} disabled={loading} className="ca-btn"
          style={{ width:"100%", padding:"15px", borderRadius:"12px", background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", fontWeight:700, fontSize:"15px", border:"none", boxShadow:"0 8px 24px rgba(124,58,237,0.35)", animation:"glow 3s ease-in-out infinite", opacity:loading?0.7:1 }}>
          {loading?"확인 중...":"로그인 →"}
        </button>
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
  const { theme, toggleTheme }     = useTheme();

  const [curPw,  setCurPw]    = useState("");
  const [newPw,  setNewPw]    = useState("");
  const [confPw, setConfPw]   = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [chPwLoading, setChPwLoading] = useState(false);

  useEffect(()=>{ fetchAll(); },[]);

  async function fetchAll() {
    setLoading(true);
    const [sr, cr] = await Promise.all([
      campApi("status",{},token),
      campApi("load",{},token),
    ]);
    if (sr.ok) { setStatus(sr.status||[]); setUpdatedAt(sr.updatedAt); setTotal(sr.total||0); }
    else if (sr.error?.includes("인증")) { toast.error("세션 만료"); onLogout(); }
    if (cr.ok) setCampaigns(cr.campaigns||[]);
    setLoading(false);
  }

  async function handleScrape() {
    setScraping(true);
    toast.loading("수집 시작됨 — 1분 후 새로고침하세요", {id:"scrape", duration:60000});
    const d = await campApi("scrape",{},token);
    if (d.ok) { toast.success("✅ 수집 요청 완료 — 잠시 후 새로고침",{id:"scrape"}); }
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

  const site = SITES[0];
  const st   = status.find(s=>s.name===site.name);
  const cnt  = campaigns.filter(c=>c.source===site.name).length;

  const filteredCampaigns = useMemo(()=>
    campaigns.filter(c=>c.source===site.name)
  ,[campaigns]);

  const pwFields = [
    { label:"현재 비밀번호", val:curPw,  set:setCurPw,  show:showCur,  setShow:setShowCur  },
    { label:"새 비밀번호",   val:newPw,  set:setNewPw,  show:showNew,  setShow:setShowNew  },
    { label:"확인",          val:confPw, set:setConfPw, show:showConf, setShow:setShowConf },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--background)", fontFamily:"Pretendard, sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 10% 5%, rgba(124,58,237,0.05) 0%, transparent 40%), radial-gradient(ellipse at 90% 95%, rgba(167,139,250,0.05) 0%, transparent 40%)", pointerEvents:"none" }} />

      {/* ── 탑바 ── */}
      <div className="ca-topbar" style={{ position:"sticky", top:0, zIndex:50, background:"var(--background)cc", backdropFilter:"blur(12px)", borderBottom:"1px solid var(--border)", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <button className="ca-back" onClick={()=>navigate("/campaigns")}
            style={{ width:42, height:42, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", fontSize:"20px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            🏠
          </button>
          <div>
            <div style={{ fontSize:"16px", fontWeight:800, color:"var(--foreground)", letterSpacing:"-0.03em" }}>체험단 관리자</div>
            <div style={{ fontSize:"11px", color:"#a78bfa" }}>모두의체험단</div>
          </div>
        </div>
        <div className="ca-topbtns" style={{ display:"flex", gap:"10px" }}>
          <button onClick={fetchAll} disabled={loading} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"9px 14px", borderRadius:"10px", background:"var(--muted)", border:"1px solid var(--border)", color:"var(--foreground)", fontWeight:500 }}>
            <RefreshCw style={{ width:13, height:13, animation:loading?"spin 1s linear infinite":"none" }} />
          </button>
          <button onClick={handleScrape} disabled={scraping} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"13px", padding:"9px 18px", borderRadius:"10px", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.3)", color:"#a78bfa", fontWeight:600, animation:!scraping?"glow 3s ease-in-out infinite":"none" }}>
            <Zap style={{ width:14, height:14, animation:scraping?"spin 0.8s linear infinite":"none" }} />
            {scraping?"수집 중...":"실시간 수집"}
          </button>
          <button onClick={onLogout} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"9px 14px", borderRadius:"10px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444" }}>
            <LogOut style={{ width:13, height:13 }} />
          </button>
          <button onClick={toggleTheme} className="ca-btn"
            style={{ width:38, height:38, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--foreground)", flexShrink:0 }}>
            {theme==="dark" ? <Sun style={{width:15,height:15}}/> : <Moon style={{width:15,height:15}}/>}
          </button>
        </div>
      </div>

      {/* ── 메인 ── */}
      <div className="ca-main" style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px 80px", position:"relative", zIndex:1 }}>

        {/* ── 사이트 현황 카드 ── */}
        <div className="ca-card" style={{ background:site.bg, border:`1px solid ${site.border}`, borderRadius:20, padding:"28px 32px", marginBottom:20, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, borderRadius:"50%", background:site.color, opacity:0.06 }} />
          <div style={{ position:"absolute", bottom:-40, left:-20, width:120, height:120, borderRadius:"50%", background:site.color, opacity:0.04 }} />

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, position:"relative" }}>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:site.color, marginBottom:6, letterSpacing:"-0.03em" }}>{site.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {st ? (st.ok
                  ? <><CheckCircle style={{width:13,height:13,color:"#4ade80"}}/><span style={{fontSize:12,color:"#4ade80",fontWeight:700}}>수집 성공</span></>
                  : <><XCircle style={{width:13,height:13,color:"#f87171"}}/><span style={{fontSize:12,color:"#f87171"}}>{st.error}</span></>
                ) : <span style={{fontSize:12,color:"var(--muted-foreground)"}}>수집 대기</span>}
              </div>
              {st && <div style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:4, display:"flex", alignItems:"center", gap:4 }}><Clock style={{width:10,height:10}}/>{fmt(st.scrapedAt)}</div>}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:56, fontWeight:900, color:site.color, lineHeight:1 }}>{cnt}</div>
              <div style={{ fontSize:12, color:"var(--muted-foreground)", marginTop:2 }}>공고 수집됨</div>
            </div>
          </div>

          <a href={site.url} target="_blank" rel="noreferrer" className="ca-btn"
            style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, fontWeight:700, color:site.color, background:"rgba(167,139,250,0.12)", border:`1px solid ${site.border}`, padding:"9px 18px", borderRadius:10, textDecoration:"none" }}>
            사이트 방문 <ExternalLink style={{width:12,height:12}}/>
          </a>
        </div>

        {/* ── 요약 통계 ── */}
        <div className="ca-grid3" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
          {[
            { label:"총 수집 공고",  val:total,          color:"#a78bfa", emoji:"📋", sub:"전체 합산" },
            { label:"마지막 수집",   val:fmt(updatedAt), color:"var(--foreground)", emoji:"🕐", sub:"업데이트", small:true },
            { label:"수집 성공률",   val:status.length>0?`${Math.round(status.filter(s=>s.ok).length/status.length*100)}%`:"—", color:status.some(s=>!s.ok)?"#fb923c":"#4ade80", emoji:"📡", sub:"사이트 상태" },
          ].map((s,i)=>(
            <div key={i} className="ca-card"
              style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:14, padding:"18px 20px", animationDelay:`${0.1+i*0.07}s` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:(s as any).small?"13px":"26px", fontWeight:800, color:s.color, lineHeight:1.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.val||"—"}</div>
                  <div style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:4 }}>{s.sub}</div>
                </div>
                <div style={{ fontSize:24, marginLeft:8, flexShrink:0 }}>{s.emoji}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 공고 목록 ── */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:18, padding:24, marginBottom:20, animation:"fadeUp 0.4s 0.25s ease both" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <TrendingUp style={{ width:15, height:15, color:"#a78bfa" }} />
              <span style={{ fontSize:15, fontWeight:700, color:"var(--foreground)" }}>수집된 공고 목록</span>
              <span style={{ fontSize:12, padding:"2px 8px", borderRadius:20, background:"rgba(167,139,250,0.12)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.25)", fontWeight:600 }}>{filteredCampaigns.length}개</span>
            </div>
          </div>

          {loading ? (
            <div style={{ padding:"40px", textAlign:"center", color:"var(--muted-foreground)" }}>
              <RefreshCw style={{ width:24, height:24, margin:"0 auto 10px", display:"block", animation:"spin 1s linear infinite" }} />
              불러오는 중...
            </div>
          ) : filteredCampaigns.length===0 ? (
            <div style={{ padding:"48px", textAlign:"center" }}>
              <div style={{ fontSize:"36px", marginBottom:"12px" }}>📭</div>
              <div style={{ fontSize:"14px", color:"var(--muted-foreground)", marginBottom:4 }}>수집된 공고가 없습니다</div>
              <div style={{ fontSize:"12px", color:"var(--muted-foreground)", opacity:0.6 }}>실시간 수집 버튼을 눌러주세요</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:440, overflowY:"auto" }}>
              {filteredCampaigns.map((c:any,i:number)=>{
                const urgent = c.deadline<=3;
                return (
                  <div key={String(c.id)} className="ca-row"
                    style={{ display:"flex", alignItems:"center", gap:14, background:"var(--background)", border:`1px solid ${urgent?"rgba(251,146,60,0.3)":"var(--border)"}`, borderRadius:12, padding:"14px 18px", animation:`slideR 0.3s ${i*0.025}s ease both` }}>
                    <div style={{ width:4, height:40, borderRadius:2, background:urgent?"linear-gradient(180deg,#fb923c,#f97316)":"linear-gradient(180deg,#7c3aed,#a78bfa)", flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:"var(--foreground)", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontSize:11, color:"#a78bfa", fontWeight:600 }}>{c.source}</span>
                        <span style={{ fontSize:11, color:"var(--muted-foreground)" }}>📍 {c.region||"전국"}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:urgent?"#fb923c":"var(--muted-foreground)", background:urgent?"rgba(251,146,60,0.1)":"transparent", padding:urgent?"3px 8px":"0", borderRadius:6 }}>
                        D-{c.deadline}{urgent?" ⚡":""}
                      </span>
                      <a href={c.url} target="_blank" rel="noreferrer" className="ca-btn"
                        style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, color:"#a78bfa", background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.25)", padding:"7px 14px", borderRadius:8, textDecoration:"none", whiteSpace:"nowrap" }}>
                        공고 보기 <ExternalLink style={{width:11,height:11}}/>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 비밀번호 변경 ── */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:18, padding:28, animation:"fadeUp 0.4s 0.35s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:22 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🔑</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--foreground)" }}>비밀번호 변경</div>
              <div style={{ fontSize:11, color:"var(--muted-foreground)" }}>변경 후 자동 로그아웃됩니다</div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:16 }}>
            {pwFields.map(f=>(
              <div key={f.label}>
                <label style={{ fontSize:11, color:"var(--muted-foreground)", display:"block", marginBottom:6, fontWeight:500 }}>{f.label}</label>
                <div style={{ position:"relative" }}>
                  <input type={f.show?"text":"password"} placeholder={f.label} value={f.val}
                    className="ca-input"
                    onChange={e=>f.set(e.target.value)}
                    style={{ width:"100%", padding:"12px 44px 12px 16px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:14, boxSizing:"border-box" }}
                    onFocus={e=>(e.target as HTMLInputElement).style.borderColor="#a78bfa"}
                    onBlur={e=>(e.target as HTMLInputElement).style.borderColor="var(--border)"} />
                  <button onClick={()=>f.setShow(!f.show)} className="ca-btn"
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--muted-foreground)", padding:4 }}>
                    {f.show?<EyeOff style={{width:16,height:16}}/>:<Eye style={{width:16,height:16}}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleChangePw} disabled={chPwLoading} className="ca-btn"
            style={{ padding:"13px 28px", borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#a78bfa)", color:"#fff", fontWeight:700, fontSize:14, border:"none", boxShadow:"0 6px 20px rgba(124,58,237,0.35)", opacity:chPwLoading?0.7:1 }}>
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
