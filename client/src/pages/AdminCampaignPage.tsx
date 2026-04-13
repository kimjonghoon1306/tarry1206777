/**
 * BlogAuto Pro - 체험단 관리자 페이지
 * BlogAuto Pro 계정과 완전히 별도인 독립 인증 시스템
 */

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink, LogOut, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const SESS_KEY = "campaign_admin_sess";

const CSS = `
@keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
@keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes glow     { 0%,100%{box-shadow:0 0 0 0 rgba(236,72,153,0)} 50%{box-shadow:0 0 16px 4px rgba(236,72,153,0.2)} }
@keyframes slideIn  { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
.ca-btn   { transition:all 0.18s; cursor:pointer; }
.ca-btn:hover   { opacity:0.85; transform:translateY(-1px); }
.ca-btn:active  { transform:scale(0.97); }
.ca-card  { animation:fadeUp 0.4s ease both; transition:all 0.2s; }
.ca-card:hover  { transform:translateY(-2px); }
.ca-back  { animation:bounce 2s ease-in-out infinite; transition:all 0.18s; }
.ca-back:hover  { animation:none; transform:scale(1.15); }
.ca-row   { animation:slideIn 0.3s ease both; transition:all 0.2s; }
.ca-row:hover   { background:rgba(255,255,255,0.03) !important; }
`;

async function campApi(action: string, extra: Record<string, any> = {}, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch("/api/scrape-campaigns", {
      method: "POST", headers,
      body: JSON.stringify({ action, ...extra }),
    });
    return await res.json();
  } catch { return { ok: false, error: "네트워크 오류" }; }
}

// ── 로그인 게이트 ─────────────────────────────────────
function LoginGate({ onAuth }: { onAuth: (token: string) => void }) {
  const [pw, setPw]       = useState("");
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate]      = useLocation();

  async function handleLogin() {
    if (!pw.trim()) { toast.error("비밀번호를 입력해주세요"); return; }
    setLoading(true);
    const d = await campApi("loginCampaignAdmin", { password: pw });
    if (d.ok) {
      sessionStorage.setItem(SESS_KEY, d.token);
      toast.success("✅ 로그인 성공");
      onAuth(d.token);
    } else {
      toast.error(d.error || "비밀번호가 올바르지 않습니다");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--background)", position:"relative" }}>
      <style>{CSS}</style>

      {/* 배경 그라디언트 */}
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 30% 20%, rgba(236,72,153,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(249,115,22,0.05) 0%, transparent 60%)", pointerEvents:"none" }} />

      {/* 허브로 돌아가기 */}
      <button className="ca-back" onClick={() => navigate("/campaigns")}
        style={{ position:"fixed", top:16, left:16, fontSize:"22px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"50%", width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", zIndex:10 }}>
        🏠
      </button>

      <div style={{ width:"100%", maxWidth:380, padding:"40px 36px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"20px", animation:"fadeUp 0.5s ease both", position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"40px", marginBottom:"10px", animation:"bounce 2s ease-in-out infinite" }}>🛡️</div>
          <div style={{ fontSize:"20px", fontWeight:800, color:"var(--foreground)", letterSpacing:"-0.03em" }}>체험단 관리자</div>
          <div style={{ fontSize:"12px", color:"var(--muted-foreground)", marginTop:"4px" }}>BlogAuto Pro 와 별도 운영</div>
        </div>

        <div style={{ position:"relative", marginBottom:"14px" }}>
          <input
            type={show ? "text" : "password"}
            placeholder="관리자 비밀번호"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width:"100%", padding:"13px 44px 13px 16px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"14px", boxSizing:"border-box", outline:"none", transition:"border-color 0.2s" }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#ec4899"}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"}
          />
          <button onClick={() => setShow(s => !s)} className="ca-btn"
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

// ── 메인 대시보드 ─────────────────────────────────────
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [status, setStatus]       = useState<any[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [total, setTotal]         = useState(0);
  const [scraping, setScraping]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [, navigate]              = useLocation();

  const [curPw, setCurPw]     = useState("");
  const [newPw, setNewPw]     = useState("");
  const [confPw, setConfPw]   = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [chPwLoading, setChPwLoading] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoading(true);
    const d = await campApi("status", {}, token);
    if (d.ok) { setStatus(d.status || []); setUpdatedAt(d.updatedAt); setTotal(d.total || 0); }
    else if (d.error?.includes("인증")) { toast.error("세션이 만료되었습니다"); onLogout(); }
    setLoading(false);
  }

  async function handleScrape() {
    setScraping(true);
    toast.loading("스크래핑 중... (최대 30초)", { id:"scrape" });
    const d = await campApi("scrape", {}, token);
    if (d.ok) { toast.success(`✅ 완료! 총 ${d.total}개 수집`, { id:"scrape" }); await fetchStatus(); }
    else toast.error(d.error || "실패", { id:"scrape" });
    setScraping(false);
  }

  async function handleChangePw() {
    if (!curPw || !newPw || !confPw) { toast.error("모든 항목을 입력해주세요"); return; }
    if (newPw !== confPw) { toast.error("새 비밀번호가 일치하지 않아요"); return; }
    if (newPw.length < 4) { toast.error("4자 이상 입력해주세요"); return; }
    setChPwLoading(true);
    const d = await campApi("changeCampaignPw", { currentPw: curPw, newPw }, token);
    if (d.ok) { toast.success("비밀번호 변경 완료"); setTimeout(onLogout, 1200); }
    else toast.error(d.error || "변경 실패");
    setChPwLoading(false);
  }

  const fmtDate = (ts: string | null) => {
    if (!ts) return "없음";
    try { return new Date(ts).toLocaleString("ko-KR", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return ts; }
  };

  const SITES = [
    { name:"강남맛집체험단", url:"https://강남맛집.net"         },
    { name:"디너의여왕",     url:"https://dinnerqueen.net"      },
    { name:"레뷰",           url:"https://www.revu.net/campaign"},
    { name:"모두의체험단",   url:"https://www.modan.kr"         },
    { name:"태그바이",       url:"https://www.tagby.io/recruit" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--background)" }}>
      <style>{CSS}</style>

      {/* 배경 */}
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 20% 10%, rgba(236,72,153,0.05) 0%, transparent 50%)", pointerEvents:"none" }} />

      {/* 탑바 */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"var(--background)", borderBottom:"1px solid var(--border)", padding:"12px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", backdropFilter:"blur(8px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <button className="ca-back" onClick={() => navigate("/campaigns")}
            style={{ fontSize:"20px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"50%", width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            🏠
          </button>
          <div>
            <div style={{ fontSize:"15px", fontWeight:700, color:"var(--foreground)" }}>체험단 관리자</div>
            <div style={{ fontSize:"11px", color:"var(--muted-foreground)" }}>독립 운영 시스템</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={fetchStatus} disabled={loading} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 14px", borderRadius:"8px", background:"var(--muted)", border:"1px solid var(--border)", color:"var(--foreground)" }}>
            <RefreshCw style={{ width:12, height:12, animation:loading?"spin 1s linear infinite":"none" }} /> 갱신
          </button>
          <button onClick={handleScrape} disabled={scraping} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 16px", borderRadius:"8px", background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.35)", color:"#f472b6", animation:scraping?"pulse 1s ease-in-out infinite":"none" }}>
            <RefreshCw style={{ width:12, height:12, animation:scraping?"spin 1s linear infinite":"none" }} />
            {scraping ? "수집 중..." : "실시간 수집"}
          </button>
          <button onClick={onLogout} className="ca-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 14px", borderRadius:"8px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444" }}>
            <LogOut style={{ width:12, height:12 }} /> 로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"28px 24px 60px", position:"relative", zIndex:1 }}>

        {/* ── 요약 카드 ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"24px" }}>
          {[
            { label:"총 캠페인",   val:total,              color:"#10b981", emoji:"📋" },
            { label:"마지막 수집", val:fmtDate(updatedAt), color:"var(--foreground)", emoji:"🕐", small:true },
            { label:"사이트 상태", val:`${status.filter(s=>s.ok).length} / ${status.length}`, color:status.some(s=>!s.ok)?"#f97316":"#10b981", emoji:"🌐" },
          ].map((s, i) => (
            <div key={i} className="ca-card"
              style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"12px", padding:"16px", animationDelay:`${i*0.08}s` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:"10px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"6px" }}>{s.label}</div>
                  <div style={{ fontSize:(s as any).small?"13px":"24px", fontWeight:700, color:s.color, lineHeight:1.2 }}>{s.val || "—"}</div>
                </div>
                <div style={{ fontSize:"20px" }}>{s.emoji}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 사이트별 수집 상태 ── */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"14px", padding:"20px", marginBottom:"20px" }}>
          <div style={{ fontSize:"12px", fontWeight:600, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"14px" }}>
            📡 사이트별 수집 상태
          </div>

          {loading ? (
            <div style={{ padding:"32px", textAlign:"center", color:"var(--muted-foreground)", animation:"pulse 1.5s ease-in-out infinite" }}>수집 현황 불러오는 중...</div>
          ) : status.length === 0 ? (
            <div style={{ padding:"32px", textAlign:"center", color:"var(--muted-foreground)", fontSize:"13px" }}>
              <div style={{ fontSize:"28px", marginBottom:"8px" }}>📭</div>
              아직 수집 기록이 없습니다. 실시간 수집 버튼을 눌러주세요.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {status.map((s: any, i: number) => (
                <div key={s.name} className="ca-row"
                  style={{ display:"flex", alignItems:"center", gap:"12px", background:"var(--background)", border:`1px solid ${s.ok?"var(--border)":"rgba(239,68,68,0.2)"}`, borderRadius:"10px", padding:"13px 16px", animationDelay:`${i*0.05}s` }}>
                  <div style={{ flexShrink:0 }}>
                    {s.ok
                      ? <CheckCircle style={{ width:18, height:18, color:"#10b981" }} />
                      : <XCircle    style={{ width:18, height:18, color:"#ef4444" }} />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"13px", fontWeight:600, color:"var(--foreground)" }}>{s.name}</div>
                    {s.error && <div style={{ fontSize:"11px", color:"#ef4444", marginTop:"2px" }}>오류: {s.error}</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"14px", fontWeight:700, color:s.ok?"#10b981":"var(--muted-foreground)" }}>
                      {s.ok ? `${s.count}개` : "실패"}
                    </div>
                    <div style={{ fontSize:"10px", color:"var(--muted-foreground)", display:"flex", alignItems:"center", gap:"3px", justifyContent:"flex-end", marginTop:"2px" }}>
                      <Clock style={{ width:9, height:9 }} />{fmtDate(s.scrapedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 수집 대상 사이트 ── */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"14px", padding:"20px", marginBottom:"20px" }}>
          <div style={{ fontSize:"12px", fontWeight:600, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"14px" }}>
            🔗 수집 대상 사이트
          </div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {SITES.map((s, i) => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="ca-btn"
                style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", padding:"7px 14px", borderRadius:"8px", background:"var(--background)", border:"1px solid var(--border)", color:"var(--foreground)", textDecoration:"none", animationDelay:`${i*0.06}s` }}>
                {s.name} <ExternalLink style={{ width:10, height:10, opacity:0.5 }} />
              </a>
            ))}
          </div>
        </div>

        {/* ── 비밀번호 변경 ── */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"14px", padding:"20px" }}>
          <div style={{ fontSize:"12px", fontWeight:600, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"16px" }}>
            🔑 비밀번호 변경
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", maxWidth:360 }}>
            {[
              { label:"현재 비밀번호", val:curPw, set:setCurPw, show:showCur, setShow:setShowCur },
              { label:"새 비밀번호",   val:newPw, set:setNewPw, show:showNew, setShow:setShowNew },
              { label:"새 비밀번호 확인", val:confPw, set:setConfPw, show:showConf, setShow:setShowConf },
            ].map(f => (
              <div key={f.label} style={{ position:"relative" }}>
                <input
                  type={f.show ? "text" : "password"}
                  placeholder={f.label}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  style={{ width:"100%", padding:"10px 44px 10px 14px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"13px", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#ec4899"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"}
                />
                <button onClick={() => f.setShow(!f.show)} className="ca-btn"
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"var(--muted-foreground)" }}>
                  {f.show ? <EyeOff style={{ width:14, height:14 }} /> : <Eye style={{ width:14, height:14 }} />}
                </button>
              </div>
            ))}
            <button onClick={handleChangePw} disabled={chPwLoading} className="ca-btn"
              style={{ padding:"11px", borderRadius:"8px", background:"rgba(236,72,153,0.1)", color:"#f472b6", border:"1px solid rgba(236,72,153,0.3)", fontWeight:600, fontSize:"13px", animation:"glow 3s ease-in-out infinite" }}>
              {chPwLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────
export default function AdminCampaignPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESS_KEY);
    if (saved) setToken(saved);
  }, []);

  function handleAuth(tk: string) { setToken(tk); }
  function handleLogout() { sessionStorage.removeItem(SESS_KEY); setToken(null); }

  if (!token) return <LoginGate onAuth={handleAuth} />;
  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
