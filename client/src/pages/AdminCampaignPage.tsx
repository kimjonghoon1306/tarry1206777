/**
 * BlogAuto Pro - 체험단 관리자
 * 강남맛집체험단 + 디너의여왕
 * 모바일 최적화 + 풀 기능 + 애니메이션
 */

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, LogOut, Eye, EyeOff, TrendingUp, Zap } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const SESS_KEY = "campaign_admin_sess";

const SITES = [
  { name:"강남맛집체험단", url:"https://강남맛집.net",    key:"gangnam",     color:"#f97316", grad:"linear-gradient(135deg,#f97316,#fb923c)", bg:"rgba(249,115,22,0.08)", border:"rgba(249,115,22,0.2)" },
  { name:"디너의여왕",     url:"https://dinnerqueen.net", key:"dinnerqueen", color:"#ec4899", grad:"linear-gradient(135deg,#be185d,#ec4899)", bg:"rgba(236,72,153,0.08)", border:"rgba(236,72,153,0.2)" },
];

const CSS = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes spin     { to{transform:rotate(360deg)} }
@keyframes glow     { 0%,100%{box-shadow:0 0 0 0 rgba(236,72,153,0)} 50%{box-shadow:0 0 20px 4px rgba(236,72,153,0.18)} }
@keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
@keyframes scaleIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
@keyframes slideR   { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }

.ca-btn     { transition:all 0.18s cubic-bezier(0.34,1.56,0.64,1); cursor:pointer; }
.ca-btn:hover   { opacity:0.88; transform:translateY(-2px) scale(1.02); }
.ca-btn:active  { transform:scale(0.96) !important; }
.ca-card    { animation:fadeUp 0.4s ease both; transition:transform 0.22s,box-shadow 0.22s; }
.ca-card:hover  { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,0.18); }
.ca-row     { transition:background 0.15s,transform 0.15s; }
.ca-row:hover   { background:rgba(255,255,255,0.04) !important; transform:translateX(2px); }
.ca-back    { animation:bounce 2.8s ease-in-out infinite; transition:all 0.2s; }
.ca-back:hover  { animation:none; transform:scale(1.18) rotate(-8deg); }
.ca-input   { transition:border-color 0.2s,box-shadow 0.2s; outline:none; }
.ca-input:focus { box-shadow:0 0 0 3px rgba(236,72,153,0.15) !important; }

@media (max-width: 640px) {
  .ca-grid2   { grid-template-columns: 1fr !important; }
  .ca-grid3   { grid-template-columns: 1fr 1fr !important; }
  .ca-topbar  { flex-wrap: wrap; gap: 8px !important; }
  .ca-topbtns { flex-wrap: wrap; }
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
  const [pw, setPw]       = useState("");
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate]      = useLocation();

  async function login() {
    if (!pw.trim()) { toast.error("비밀번호를 입력해주세요"); return; }
    setLoading(true);
    const d = await campApi("loginCampaignAdmin", { password:pw });
    if (d.ok) { sessionStorage.setItem(SESS_KEY, d.token); toast.success("✅ 로그인 성공"); onAuth(d.token); }
    else toast.error(d.error || "비밀번호가 올바르지 않습니다");
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--background)", padding:"20px" }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 25% 25%, rgba(249,115,22,0.08) 0%, transparent 50%), radial-gradient(ellipse at 75% 75%, rgba(236,72,153,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />

      <button className="ca-back" onClick={() => navigate("/campaigns")}
        style={{ position:"fixed", top:16, left:16, width:46, height:46, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", fontSize:"22px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}>
        🏠
      </button>

      <div style={{ width:"100%", maxWidth:420, background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"24px", padding:"48px 40px", animation:"scaleIn 0.45s ease both", position:"relative", zIndex:1, boxShadow:"0 24px 48px rgba(0,0,0,0.15)" }}>
        {/* 로고 */}
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <div style={{ width:72, height:72, borderRadius:"20px", background:"linear-gradient(135deg,#f97316,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", margin:"0 auto 16px", boxShadow:"0 8px 24px rgba(236,72,153,0.3)", animation:"bounce 2.8s ease-in-out infinite" }}>🛡️</div>
          <div style={{ fontSize:"24px", fontWeight:800, color:"var(--foreground)", letterSpacing:"-0.04em", marginBottom:"6px" }}>체험단 관리자</div>
          <div style={{ fontSize:"13px", color:"var(--muted-foreground)" }}>강남맛집체험단 · 디너의여왕</div>
        </div>

        {/* 입력 */}
        <div style={{ position:"relative", marginBottom:"14px" }}>
          <input type={show?"text":"password"} placeholder="관리자 비밀번호" value={pw}
            className="ca-input"
            onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
            style={{ width:"100%", padding:"15px 52px 15px 18px", borderRadius:"12px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"15px", boxSizing:"border-box" }}
            onFocus={e=>(e.target as HTMLInputElement).style.borderColor="#ec4899"}
            onBlur={e=>(e.target as HTMLInputElement).style.borderColor="var(--border)"} />
          <button onClick={()=>setShow(s=>!s)} className="ca-btn"
            style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--muted-foreground)", padding:6 }}>
            {show?<EyeOff style={{width:18,height:18}}/>:<Eye style={{width:18,height:18}}/>}
          </button>
        </div>

        <button onClick={login} disabled={loading} className="ca-btn"
          style={{ width:"100%", padding:"15px", borderRadius:"12px", background:"linear-gradient(135deg,#be185d,#ec4899)", color:"#fff", fontWeight:700, fontSize:"15px", border:"none", animation:"glow 3s ease-in-out infinite", opacity:loading?0.7:1 }}>
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
  const [siteFilter, setSiteFilter] = useState("전체");
  const [, navigate]              = useLocation();

  // 비번
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
    toast.loading("수집 중... (최대 30초)", {id:"scrape"});
    const d = await campApi("scrape",{},token);
    if (d.ok) { toast.success(`✅ ${d.total}개 수집 완료`,{id:"scrape"}); await fetchAll(); }
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

  const filteredCampaigns = useMemo(()=>{
    const names = SITES.map(s=>s.name);
    let data = campaigns.filter(c=>names.includes(c.source));
    if (siteFilter!=="전체") data = data.filter(c=>c.source===siteFilter);
    return data;
  },[campaigns,siteFilter]);

  const siteData = (key:string) => {
    const site = SITES.find(s=>s.key===key)!;
    const st   = status.find(s=>s.name===site.name);
    const cnt  = campaigns.filter(c=>c.source===site.name).length;
    return { site, st, cnt };
  };

  const pwFields = [
    { label:"현재 비밀번호", val:curPw,  set:setCurPw,  show:showCur,  setShow:setShowCur  },
    { label:"새 비밀번호",   val:newPw,  set:setNewPw,  show:showNew,  setShow:setShowNew  },
    { label:"확인",          val:confPw, set:setConfPw, show:showConf, setShow:setShowConf },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--background)" }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 10% 5%, rgba(249,115,22,0.05) 0%, transparent 40%), radial-gradient(ellipse at 90% 95%, rgba(236,72,153,0.05) 0%, transparent 40%)", pointerEvents:"none" }} />

      {/* ── 탑바 ── */}
      <div className="ca-topbar" style={{ position:"sticky", top:0, zIndex:50, background:"var(--background)cc", backdropFilter:"blur(12px)", borderBottom:"1px solid var(--border)", padding:"12px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <button className="ca-back" onClick={()=>navigate("/campaigns")}
            style={{ width:42, height:42, borderRadius:"50%", background:"var(--muted)", border:"1px solid var(--border)", fontSize:"20px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            🏠
          </button>
          <div>
            <div style={{ fontSize:"16px", fontWeight:800, color:"var(--foreground)", letterSpacing:"-0.03em" }}>체험단 관리자</div>
            <div style={{ fontSize:"11px", color:"var(--muted-foreground)" }}>강남맛집체험단 · 디너의여왕</div>
          </div>
        </div>
        <div className="ca-topbtns" style={{ display:"flex", gap:"8px" }}>
          <button onClick={fetchAll} disabled={loading} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"9px 14px", borderRadius:"10px", background:"var(--muted)", border:"1px solid var(--border)", color:"var(--foreground)", fontWeight:500 }}>
            <RefreshCw style={{ width:13, height:13, animation:loading?"spin 1s linear infinite":"none" }} />
            <span style={{ display:"none" }} className="btn-label">갱신</span>
          </button>
          <button onClick={handleScrape} disabled={scraping} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"13px", padding:"9px 18px", borderRadius:"10px", background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.3)", color:"#f472b6", fontWeight:600, animation:!scraping?"glow 3s ease-in-out infinite":"none" }}>
            <Zap style={{ width:14, height:14, animation:scraping?"spin 0.8s linear infinite":"none" }} />
            {scraping?"수집 중...":"실시간 수집"}
          </button>
          <button onClick={onLogout} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"9px 14px", borderRadius:"10px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444" }}>
            <LogOut style={{ width:13, height:13 }} />
          </button>
        </div>
      </div>

      {/* ── 메인 ── */}
      <div className="ca-main" style={{ maxWidth:960, margin:"0 auto", padding:"28px 24px 80px", position:"relative", zIndex:1 }}>

        {/* ── 사이트 현황 카드 (2개) ── */}
        <div className="ca-grid2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"24px" }}>
          {SITES.map((site,i)=>{
            const { st, cnt } = siteData(site.key);
            return (
              <div key={site.key} className="ca-card"
                style={{ background:site.bg, border:`1px solid ${site.border}`, borderRadius:"18px", padding:"24px 28px", animationDelay:`${i*0.1}s`, position:"relative", overflow:"hidden" }}>
                {/* 배경 장식 */}
                <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:site.color, opacity:0.06 }} />
                <div style={{ position:"absolute", bottom:-30, left:-10, width:80, height:80, borderRadius:"50%", background:site.color, opacity:0.04 }} />

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"18px", position:"relative" }}>
                  <div>
                    <div style={{ fontSize:"17px", fontWeight:800, color:site.color, marginBottom:"4px", letterSpacing:"-0.02em" }}>{site.name}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      {st ? (st.ok
                        ? <><CheckCircle style={{width:12,height:12,color:"#10b981"}}/><span style={{fontSize:"11px",color:"#10b981",fontWeight:600}}>수집 성공</span></>
                        : <><XCircle style={{width:12,height:12,color:"#ef4444"}}/><span style={{fontSize:"11px",color:"#ef4444"}}>{st.error}</span></>
                      ) : <span style={{fontSize:"11px",color:"var(--muted-foreground)"}}>수집 대기</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"42px", fontWeight:900, color:site.color, lineHeight:1 }}>{cnt}</div>
                    <div style={{ fontSize:"11px", color:"var(--muted-foreground)", marginTop:"2px" }}>공고 수집됨</div>
                  </div>
                </div>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${site.border}`, paddingTop:"14px" }}>
                  <div style={{ fontSize:"11px", color:"var(--muted-foreground)", display:"flex", alignItems:"center", gap:"4px" }}>
                    <Clock style={{width:10,height:10}}/>
                    {st ? fmt(st.scrapedAt) : "—"}
                  </div>
                  <a href={site.url} target="_blank" rel="noreferrer" className="ca-btn"
                    style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:600, color:site.color, background:"transparent", border:`1px solid ${site.border}`, padding:"6px 14px", borderRadius:"8px", textDecoration:"none" }}>
                    사이트 방문 <ExternalLink style={{width:11,height:11}}/>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 요약 통계 ── */}
        <div className="ca-grid3" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"24px" }}>
          {[
            { label:"총 수집 공고",  val:total,              color:"#10b981", emoji:"📋", sub:"전체 합산" },
            { label:"마지막 수집",   val:fmt(updatedAt),     color:"var(--foreground)", emoji:"🕐", sub:"업데이트", small:true },
            { label:"수집 성공률",   val:status.length>0?`${Math.round(status.filter(s=>s.ok).length/status.length*100)}%`:"—", color:status.some(s=>!s.ok)?"#f97316":"#10b981", emoji:"📡", sub:"사이트 상태" },
          ].map((s,i)=>(
            <div key={i} className="ca-card"
              style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"14px", padding:"18px 20px", animationDelay:`${0.2+i*0.07}s` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"10px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:"6px" }}>{s.label}</div>
                  <div style={{ fontSize:(s as any).small?"13px":"26px", fontWeight:800, color:s.color, lineHeight:1.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.val||"—"}</div>
                  <div style={{ fontSize:"10px", color:"var(--muted-foreground)", marginTop:"4px" }}>{s.sub}</div>
                </div>
                <div style={{ fontSize:"24px", marginLeft:"8px", flexShrink:0 }}>{s.emoji}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 공고 목록 ── */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"18px", padding:"24px", marginBottom:"24px", animation:"fadeUp 0.4s 0.35s ease both" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px", flexWrap:"wrap", gap:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <TrendingUp style={{ width:16, height:16, color:"#ec4899" }} />
              <span style={{ fontSize:"15px", fontWeight:700, color:"var(--foreground)" }}>수집된 공고 목록</span>
              <span style={{ fontSize:"12px", color:"var(--muted-foreground)" }}>({filteredCampaigns.length}개)</span>
            </div>
            <div style={{ display:"flex", gap:"6px" }}>
              {["전체",...SITES.map(s=>s.name)].map(f=>{
                const site = SITES.find(s=>s.name===f);
                return (
                  <button key={f} className="ca-btn" onClick={()=>setSiteFilter(f)}
                    style={{ fontSize:"12px", padding:"6px 14px", borderRadius:"20px", fontWeight:siteFilter===f?700:400,
                      background:siteFilter===f?(site?.grad||"var(--foreground)"):"transparent",
                      border:`1px solid ${siteFilter===f?"transparent":"var(--border)"}`,
                      color:siteFilter===f?"#fff":"var(--muted-foreground)" }}>
                    {f==="전체"?"전체":f.replace("체험단","").replace("의여왕","여왕")}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div style={{ padding:"40px", textAlign:"center", color:"var(--muted-foreground)", animation:"pulse 1.5s ease-in-out infinite" }}>
              <RefreshCw style={{ width:24, height:24, margin:"0 auto 10px", display:"block", animation:"spin 1s linear infinite" }} />
              불러오는 중...
            </div>
          ) : filteredCampaigns.length===0 ? (
            <div style={{ padding:"48px", textAlign:"center" }}>
              <div style={{ fontSize:"36px", marginBottom:"12px" }}>📭</div>
              <div style={{ fontSize:"14px", color:"var(--muted-foreground)", marginBottom:"4px" }}>수집된 공고가 없습니다</div>
              <div style={{ fontSize:"12px", color:"var(--muted-foreground)", opacity:0.6 }}>위의 실시간 수집 버튼을 눌러주세요</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", maxHeight:440, overflowY:"auto" }}>
              {filteredCampaigns.map((c:any,i:number)=>{
                const site = SITES.find(s=>s.name===c.source);
                const urgent = c.deadline<=3;
                return (
                  <div key={String(c.id)} className="ca-row"
                    style={{ display:"flex", alignItems:"center", gap:"14px", background:"var(--background)", border:`1px solid ${urgent?site?.border||"var(--border)":"var(--border)"}`, borderRadius:"12px", padding:"14px 18px", animation:`slideR 0.3s ${i*0.025}s ease both` }}>
                    <div style={{ width:4, height:40, borderRadius:"2px", background:site?.grad||"var(--border)", flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"14px", fontWeight:600, color:"var(--foreground)", marginBottom:"4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                      <div style={{ display:"flex", gap:"10px", alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontSize:"11px", color:site?.color, fontWeight:600 }}>{c.source}</span>
                        <span style={{ fontSize:"11px", color:"var(--muted-foreground)" }}>📍 {c.region||"전국"}</span>
                        {c.reward && c.reward!=="정보 확인 필요" && <span style={{ fontSize:"11px", color:"var(--muted-foreground)" }}>💰 {c.reward}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
                      <span style={{ fontSize:"12px", fontWeight:700, color:urgent?"#f97316":"var(--muted-foreground)", background:urgent?"rgba(249,115,22,0.1)":"transparent", padding:urgent?"3px 8px":"0", borderRadius:"6px" }}>
                        D-{c.deadline}{urgent?" ⚡":""}
                      </span>
                      <a href={c.url} target="_blank" rel="noreferrer" className="ca-btn"
                        style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", fontWeight:600, color:site?.color||"var(--foreground)", background:site?.bg||"transparent", border:`1px solid ${site?.border||"var(--border)"}`, padding:"7px 14px", borderRadius:"8px", textDecoration:"none", whiteSpace:"nowrap" }}>
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
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"18px", padding:"28px", animation:"fadeUp 0.4s 0.45s ease both" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"22px" }}>
            <div style={{ width:32, height:32, borderRadius:"8px", background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🔑</div>
            <div>
              <div style={{ fontSize:"15px", fontWeight:700, color:"var(--foreground)" }}>비밀번호 변경</div>
              <div style={{ fontSize:"11px", color:"var(--muted-foreground)" }}>변경 후 자동 로그아웃됩니다</div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"12px", marginBottom:"16px" }}>
            {pwFields.map(f=>(
              <div key={f.label} style={{ position:"relative" }}>
                <label style={{ fontSize:"11px", color:"var(--muted-foreground)", display:"block", marginBottom:"6px", fontWeight:500 }}>{f.label}</label>
                <div style={{ position:"relative" }}>
                  <input type={f.show?"text":"password"} placeholder={f.label} value={f.val}
                    className="ca-input"
                    onChange={e=>f.set(e.target.value)}
                    style={{ width:"100%", padding:"12px 44px 12px 16px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"14px", boxSizing:"border-box" }}
                    onFocus={e=>(e.target as HTMLInputElement).style.borderColor="#ec4899"}
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
            style={{ padding:"13px 28px", borderRadius:"10px", background:"linear-gradient(135deg,#be185d,#ec4899)", color:"#fff", fontWeight:700, fontSize:"14px", border:"none", animation:"glow 3s ease-in-out infinite", opacity:chPwLoading?0.7:1 }}>
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
