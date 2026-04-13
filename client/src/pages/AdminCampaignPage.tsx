/**
 * BlogAuto Pro - 체험단 관리자
 * 강남맛집체험단 + 디너의여왕 집중
 */

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, LogOut, Eye, EyeOff, List, Settings, Activity } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const SESS_KEY = "campaign_admin_sess";

const SITES = [
  { name:"강남맛집체험단", url:"https://강남맛집.net",    key:"gangnam",     color:"#f97316", bg:"rgba(249,115,22,0.08)",  border:"rgba(249,115,22,0.25)"  },
  { name:"디너의여왕",     url:"https://dinnerqueen.net", key:"dinnerqueen", color:"#ec4899", bg:"rgba(236,72,153,0.08)",  border:"rgba(236,72,153,0.25)"  },
];

const CSS = `
@keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
@keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes glow    { 0%,100%{box-shadow:0 0 0 0 rgba(236,72,153,0)} 50%{box-shadow:0 0 14px 4px rgba(236,72,153,0.15)} }
@keyframes bounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
.ca-btn  { transition:all 0.18s; cursor:pointer; }
.ca-btn:hover  { opacity:0.85; transform:translateY(-1px); }
.ca-btn:active { transform:scale(0.97); }
.ca-card { animation:fadeUp 0.35s ease both; transition:transform 0.2s,box-shadow 0.2s; }
.ca-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.15); }
.ca-row  { transition:background 0.15s; }
.ca-row:hover  { background:rgba(255,255,255,0.03) !important; }
.ca-back { animation:bounce 2.5s ease-in-out infinite; transition:all 0.18s; }
.ca-back:hover { animation:none; transform:scale(1.15) rotate(-5deg); }
.ca-tab  { transition:all 0.15s; }
`;

async function campApi(action: string, extra: Record<string,any> = {}, token?: string) {
  const headers: Record<string,string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch("/api/scrape-campaigns", {
      method:"POST", headers,
      body: JSON.stringify({ action, ...extra }),
    });
    return await res.json();
  } catch { return { ok:false, error:"네트워크 오류" }; }
}

// ── 로그인 ────────────────────────────────────────────
function LoginGate({ onAuth }: { onAuth:(token:string)=>void }) {
  const [pw, setPw]           = useState("");
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate]          = useLocation();

  async function handleLogin() {
    if (!pw.trim()) { toast.error("비밀번호를 입력해주세요"); return; }
    setLoading(true);
    const d = await campApi("loginCampaignAdmin", { password: pw });
    if (d.ok) { sessionStorage.setItem(SESS_KEY, d.token); toast.success("✅ 로그인 성공"); onAuth(d.token); }
    else toast.error(d.error || "비밀번호가 올바르지 않습니다");
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--background)" }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 30% 20%, rgba(236,72,153,0.07) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(249,115,22,0.05) 0%, transparent 55%)", pointerEvents:"none" }} />
      <button className="ca-back" onClick={() => navigate("/campaigns")}
        style={{ position:"fixed", top:16, left:16, fontSize:"20px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"50%", width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}>
        🏠
      </button>
      <div style={{ width:"100%", maxWidth:380, padding:"44px 36px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"20px", animation:"fadeUp 0.5s ease both", position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"42px", marginBottom:"10px", animation:"bounce 2.5s ease-in-out infinite" }}>🛡️</div>
          <div style={{ fontSize:"20px", fontWeight:800, color:"var(--foreground)", letterSpacing:"-0.03em" }}>체험단 관리자</div>
          <div style={{ fontSize:"12px", color:"var(--muted-foreground)", marginTop:"5px" }}>강남맛집체험단 · 디너의여왕</div>
        </div>
        <div style={{ position:"relative", marginBottom:"12px" }}>
          <input type={show?"text":"password"} placeholder="관리자 비밀번호" value={pw}
            onChange={e => setPw(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()}
            style={{ width:"100%", padding:"13px 44px 13px 16px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"14px", boxSizing:"border-box", outline:"none", transition:"border-color 0.2s" }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor="#ec4899"}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor="var(--border)"} />
          <button onClick={() => setShow(s=>!s)} className="ca-btn"
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--muted-foreground)", padding:4 }}>
            {show ? <EyeOff style={{ width:16, height:16 }} /> : <Eye style={{ width:16, height:16 }} />}
          </button>
        </div>
        <button onClick={handleLogin} disabled={loading} className="ca-btn"
          style={{ width:"100%", padding:"13px", borderRadius:"10px", background:"linear-gradient(135deg,#be185d,#ec4899)", color:"#fff", fontWeight:700, fontSize:"14px", border:"none", opacity:loading?0.7:1, animation:"glow 3s ease-in-out infinite" }}>
          {loading ? "확인 중..." : "로그인 →"}
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
  const [tab, setTab]             = useState<"overview"|"campaigns"|"settings">("overview");
  const [siteFilter, setSiteFilter] = useState("전체");
  const [, navigate]              = useLocation();

  // 비번 변경
  const [curPw, setCurPw]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confPw, setConfPw]     = useState("");
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [chPwLoading, setChPwLoading] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [statusRes, campaignRes] = await Promise.all([
      campApi("status", {}, token),
      campApi("load", {}, token),
    ]);
    if (statusRes.ok) { setStatus(statusRes.status || []); setUpdatedAt(statusRes.updatedAt); setTotal(statusRes.total || 0); }
    else if (statusRes.error?.includes("인증")) { toast.error("세션 만료"); onLogout(); }
    if (campaignRes.ok) setCampaigns(campaignRes.campaigns || []);
    setLoading(false);
  }

  async function handleScrape() {
    setScraping(true);
    toast.loading("수집 중... (최대 30초)", { id:"scrape" });
    const d = await campApi("scrape", {}, token);
    if (d.ok) { toast.success(`✅ ${d.total}개 수집 완료`, { id:"scrape" }); await fetchAll(); }
    else toast.error(d.error || "실패", { id:"scrape" });
    setScraping(false);
  }

  async function handleChangePw() {
    if (!curPw||!newPw||!confPw) { toast.error("모든 항목을 입력해주세요"); return; }
    if (newPw!==confPw) { toast.error("새 비밀번호가 일치하지 않아요"); return; }
    if (newPw.length<4) { toast.error("4자 이상 입력해주세요"); return; }
    setChPwLoading(true);
    const d = await campApi("changeCampaignPw", { currentPw:curPw, newPw }, token);
    if (d.ok) { toast.success("비밀번호 변경 완료"); setTimeout(onLogout, 1200); }
    else toast.error(d.error||"변경 실패");
    setChPwLoading(false);
  }

  const fmtDate = (ts:string|null) => {
    if (!ts) return "없음";
    try { return new Date(ts).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
    catch { return ts; }
  };

  const filteredCampaigns = useMemo(() => {
    if (siteFilter==="전체") return campaigns.filter(c => SITES.some(s=>s.name===c.source));
    return campaigns.filter(c=>c.source===siteFilter);
  }, [campaigns, siteFilter]);

  const siteStatus = (key:string) => status.find(s=>s.name===SITES.find(x=>x.key===key)?.name);

  return (
    <div style={{ minHeight:"100vh", background:"var(--background)" }}>
      <style>{CSS}</style>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 15% 10%, rgba(236,72,153,0.05) 0%, transparent 50%)", pointerEvents:"none" }} />

      {/* 탑바 */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"var(--background)", borderBottom:"1px solid var(--border)", padding:"12px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", backdropFilter:"blur(8px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <button className="ca-back" onClick={() => navigate("/campaigns")}
            style={{ fontSize:"20px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"50%", width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            🏠
          </button>
          <div>
            <div style={{ fontSize:"15px", fontWeight:700, color:"var(--foreground)" }}>체험단 관리자</div>
            <div style={{ fontSize:"10px", color:"var(--muted-foreground)" }}>강남맛집체험단 · 디너의여왕</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={handleScrape} disabled={scraping} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 16px", borderRadius:"8px", background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.35)", color:"#f472b6" }}>
            <RefreshCw style={{ width:12, height:12, animation:scraping?"spin 1s linear infinite":"none" }} />
            {scraping?"수집 중...":"실시간 수집"}
          </button>
          <button onClick={onLogout} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", padding:"8px 14px", borderRadius:"8px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444" }}>
            <LogOut style={{ width:12, height:12 }} />
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ borderBottom:"1px solid var(--border)", padding:"0 24px", display:"flex", gap:"4px", background:"var(--background)", position:"sticky", top:57, zIndex:40 }}>
        {[
          { key:"overview",  label:"현황",   icon:<Activity style={{ width:13, height:13 }} /> },
          { key:"campaigns", label:"공고 목록", icon:<List style={{ width:13, height:13 }} /> },
          { key:"settings",  label:"설정",   icon:<Settings style={{ width:13, height:13 }} /> },
        ].map(t => (
          <button key={t.key} className="ca-tab" onClick={() => setTab(t.key as any)}
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", fontWeight:tab===t.key?700:400, padding:"12px 16px", background:"transparent", border:"none", borderBottom:`2px solid ${tab===t.key?"#ec4899":"transparent"}`, color:tab===t.key?"var(--foreground)":"var(--muted-foreground)", cursor:"pointer", transition:"all 0.15s" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px", position:"relative", zIndex:1 }}>

        {/* ── 현황 탭 ── */}
        {tab==="overview" && (
          <div style={{ animation:"fadeIn 0.3s ease both" }}>

            {/* 요약 */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"20px" }}>
              {[
                { label:"총 공고",    val:total,              color:"#10b981", emoji:"📋" },
                { label:"마지막 수집", val:fmtDate(updatedAt), color:"var(--foreground)", emoji:"🕐", small:true },
                { label:"수집 성공",  val:`${status.filter(s=>s.ok).length} / ${status.length}`, color:status.some(s=>!s.ok)?"#f97316":"#10b981", emoji:"✅" },
              ].map((s,i) => (
                <div key={i} className="ca-card" style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"12px", padding:"16px", animationDelay:`${i*0.07}s` }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:"10px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"5px" }}>{s.label}</div>
                      <div style={{ fontSize:(s as any).small?"12px":"22px", fontWeight:700, color:s.color }}>{s.val||"—"}</div>
                    </div>
                    <div style={{ fontSize:"22px" }}>{s.emoji}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 사이트별 상세 카드 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"20px" }}>
              {SITES.map((site, i) => {
                const st = siteStatus(site.key);
                const count = campaigns.filter(c=>c.source===site.name).length;
                return (
                  <div key={site.key} className="ca-card" style={{ background:site.bg, border:`1px solid ${site.border}`, borderRadius:"14px", padding:"18px 20px", animationDelay:`${i*0.1}s` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
                      <div>
                        <div style={{ fontSize:"15px", fontWeight:700, color:site.color }}>{site.name}</div>
                        <div style={{ fontSize:"11px", color:"var(--muted-foreground)", marginTop:"2px" }}>
                          {st ? (st.ok ? `✅ 수집 성공` : `❌ ${st.error}`) : "수집 대기 중"}
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:"28px", fontWeight:800, color:site.color }}>{count}</div>
                        <div style={{ fontSize:"10px", color:"var(--muted-foreground)" }}>공고</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:"10px", color:"var(--muted-foreground)", display:"flex", alignItems:"center", gap:"4px" }}>
                        <Clock style={{ width:9, height:9 }} />{st ? fmtDate(st.scrapedAt) : "—"}
                      </div>
                      <a href={site.url} target="_blank" rel="noreferrer" className="ca-btn"
                        style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", color:site.color, background:"transparent", border:`1px solid ${site.border}`, padding:"4px 10px", borderRadius:"6px", textDecoration:"none" }}>
                        방문 <ExternalLink style={{ width:9, height:9 }} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 수집 상태 상세 */}
            {status.length > 0 && (
              <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"12px", padding:"16px" }}>
                <div style={{ fontSize:"11px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.7px", marginBottom:"12px" }}>📡 수집 상태 상세</div>
                {status.filter(s => SITES.some(x=>x.name===s.name)).map((s:any, i:number) => (
                  <div key={s.name} className="ca-row" style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px", borderRadius:"8px", marginBottom:"6px", background:"var(--background)", border:"1px solid var(--border)", animationDelay:`${i*0.05}s` }}>
                    {s.ok ? <CheckCircle style={{ width:16, height:16, color:"#10b981", flexShrink:0 }} /> : <XCircle style={{ width:16, height:16, color:"#ef4444", flexShrink:0 }} />}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:600, color:"var(--foreground)" }}>{s.name}</div>
                      {s.error && <div style={{ fontSize:"11px", color:"#ef4444", marginTop:"2px" }}>{s.error}</div>}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:"13px", fontWeight:700, color:s.ok?"#10b981":"var(--muted-foreground)" }}>{s.ok?`${s.count}개`:"실패"}</div>
                      <div style={{ fontSize:"10px", color:"var(--muted-foreground)" }}>{fmtDate(s.scrapedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {status.length === 0 && !loading && (
              <div style={{ textAlign:"center", padding:"48px", background:"var(--muted)", borderRadius:"12px", border:"1px solid var(--border)" }}>
                <div style={{ fontSize:"32px", marginBottom:"10px" }}>📭</div>
                <div style={{ fontSize:"14px", color:"var(--muted-foreground)" }}>수집 기록이 없습니다</div>
                <div style={{ fontSize:"12px", color:"var(--muted-foreground)", marginTop:"4px" }}>위의 실시간 수집 버튼을 눌러주세요</div>
              </div>
            )}
          </div>
        )}

        {/* ── 공고 목록 탭 ── */}
        {tab==="campaigns" && (
          <div style={{ animation:"fadeIn 0.3s ease both" }}>
            <div style={{ display:"flex", gap:"8px", marginBottom:"16px", flexWrap:"wrap" }}>
              {["전체", ...SITES.map(s=>s.name)].map(f => (
                <button key={f} className="ca-tab" onClick={() => setSiteFilter(f)}
                  style={{ fontSize:"12px", padding:"6px 14px", borderRadius:"20px", cursor:"pointer", fontWeight:siteFilter===f?600:400,
                    background:siteFilter===f?"linear-gradient(90deg,#be185d,#ec4899)":"var(--muted)",
                    border:`1px solid ${siteFilter===f?"transparent":"var(--border)"}`,
                    color:siteFilter===f?"#fff":"var(--muted-foreground)" }}>
                  {f} {f!=="전체" && `(${campaigns.filter(c=>c.source===f).length})`}
                </button>
              ))}
            </div>

            {filteredCampaigns.length===0 ? (
              <div style={{ textAlign:"center", padding:"48px", background:"var(--muted)", borderRadius:"12px", border:"1px solid var(--border)" }}>
                <div style={{ fontSize:"28px", marginBottom:"8px" }}>📭</div>
                <div style={{ fontSize:"13px", color:"var(--muted-foreground)" }}>공고가 없습니다. 실시간 수집을 먼저 실행해주세요.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {filteredCampaigns.map((c:any, i:number) => {
                  const site = SITES.find(s=>s.name===c.source);
                  return (
                    <div key={String(c.id)} className="ca-row" style={{ display:"flex", alignItems:"center", gap:"14px", background:"var(--muted)", border:`1px solid var(--border)`, borderRadius:"10px", padding:"12px 16px", animation:`slideIn 0.3s ${i*0.02}s ease both` }}>
                      <div style={{ width:3, height:36, borderRadius:"2px", background:site?.color||"var(--border)", flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"13px", fontWeight:600, color:"var(--foreground)", marginBottom:"3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</div>
                        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                          <span style={{ fontSize:"10px", color:site?.color, fontWeight:600 }}>{c.source}</span>
                          <span style={{ fontSize:"10px", color:"var(--muted-foreground)" }}>{c.region||"전국"}</span>
                          <span style={{ fontSize:"10px", color:"var(--muted-foreground)" }}>{c.reward||"정보 확인"}</span>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
                        <span style={{ fontSize:"11px", color:c.deadline<=3?"#f97316":"var(--muted-foreground)", fontWeight:c.deadline<=3?600:400 }}>D-{c.deadline}</span>
                        <a href={c.url} target="_blank" rel="noreferrer" className="ca-btn"
                          style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", color:site?.color||"var(--foreground)", background:"transparent", border:`1px solid ${site?.border||"var(--border)"}`, padding:"4px 10px", borderRadius:"6px", textDecoration:"none" }}>
                          보기 <ExternalLink style={{ width:9, height:9 }} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 설정 탭 ── */}
        {tab==="settings" && (
          <div style={{ animation:"fadeIn 0.3s ease both", maxWidth:400 }}>
            <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"14px", padding:"22px" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"var(--foreground)", marginBottom:"18px", display:"flex", alignItems:"center", gap:"8px" }}>
                🔑 비밀번호 변경
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {[
                  { label:"현재 비밀번호", val:curPw, set:setCurPw, show:showCur, setShow:setShowCur },
                  { label:"새 비밀번호",   val:newPw, set:setNewPw, show:showNew, setShow:setShowNew },
                  { label:"새 비밀번호 확인", val:confPw, set:setConfPw, show:showConf, setShow:setShowConf },
                ].map(f => (
                  <div key={f.label} style={{ position:"relative" }}>
                    <input type={f.show?"text":"password"} placeholder={f.label} value={f.val}
                      onChange={e => f.set(e.target.value)}
                      style={{ width:"100%", padding:"11px 44px 11px 14px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"13px", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor="#ec4899"}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor="var(--border)"} />
                    <button onClick={() => f.setShow(!f.show)} className="ca-btn"
                      style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--muted-foreground)", padding:4 }}>
                      {f.show ? <EyeOff style={{ width:14, height:14 }} /> : <Eye style={{ width:14, height:14 }} />}
                    </button>
                  </div>
                ))}
                <button onClick={handleChangePw} disabled={chPwLoading} className="ca-btn"
                  style={{ padding:"11px", borderRadius:"8px", background:"rgba(236,72,153,0.1)", color:"#f472b6", border:"1px solid rgba(236,72,153,0.3)", fontWeight:600, fontSize:"13px", animation:"glow 3s ease-in-out infinite", marginTop:"4px" }}>
                  {chPwLoading?"변경 중...":"비밀번호 변경"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminCampaignPage() {
  const [token, setToken] = useState<string|null>(null);
  useEffect(() => {
    const saved = sessionStorage.getItem(SESS_KEY);
    if (saved) setToken(saved);
  }, []);
  if (!token) return <LoginGate onAuth={tk => setToken(tk)} />;
  return <AdminDashboard token={token} onLogout={() => { sessionStorage.removeItem(SESS_KEY); setToken(null); }} />;
}
