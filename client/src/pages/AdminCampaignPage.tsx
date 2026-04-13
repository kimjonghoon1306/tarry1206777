/**
 * BlogAuto Pro - 체험단 관리자 페이지
 * BlogAuto Pro 계정과 완전히 별도인 독립 인증 시스템
 * sessionStorage 키: campaign_admin_sess (bap_admin_auth 와 충돌 없음)
 */

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink, LogOut, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const SESS_KEY = "campaign_admin_sess"; // bap_admin_auth 와 완전히 다른 키

// ── API 헬퍼 ───────────────────────────────────────────
async function campApi(action: string, extra: Record<string, any> = {}, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch("/api/scrape-campaigns", {
      method: "POST",
      headers,
      body: JSON.stringify({ action, ...extra }),
    });
    return await res.json();
  } catch { return { ok: false, error: "네트워크 오류" }; }
}

// ── 비번 게이트 ────────────────────────────────────────
function LoginGate({ onAuth }: { onAuth: (token: string) => void }) {
  const [pw, setPw]       = useState("");
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!pw.trim()) { toast.error("비밀번호를 입력해주세요"); return; }
    setLoading(true);
    const d = await campApi("loginCampaignAdmin", { password: pw });
    if (d.ok) {
      sessionStorage.setItem(SESS_KEY, d.token);
      toast.success("로그인 성공");
      onAuth(d.token);
    } else {
      toast.error(d.error || "비밀번호가 올바르지 않습니다");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--background)" }}>
      <div style={{ width:"100%", maxWidth:360, padding:"40px 32px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"16px" }}>
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ fontSize:"32px", marginBottom:"8px" }}>🛡️</div>
          <div style={{ fontSize:"18px", fontWeight:700, color:"var(--foreground)" }}>체험단 관리자</div>
          <div style={{ fontSize:"12px", color:"var(--muted-foreground)", marginTop:"4px" }}>BlogAuto Pro 와 별도 운영</div>
        </div>
        <div style={{ position:"relative", marginBottom:"16px" }}>
          <input
            type={show ? "text" : "password"}
            placeholder="관리자 비밀번호"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width:"100%", padding:"12px 44px 12px 14px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"14px", boxSizing:"border-box", outline:"none" }}
          />
          <button onClick={() => setShow(s => !s)}
            style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--muted-foreground)" }}>
            {show ? <EyeOff style={{ width:16, height:16 }} /> : <Eye style={{ width:16, height:16 }} />}
          </button>
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{ width:"100%", padding:"12px", borderRadius:"8px", background:"linear-gradient(135deg,#be185d,#ec4899)", color:"#fff", fontWeight:700, fontSize:"14px", border:"none", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1 }}>
          {loading ? "확인 중..." : "로그인"}
        </button>
      </div>
    </div>
  );
}

// ── 메인 관리자 화면 ────────────────────────────────────
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [status, setStatus]       = useState<any[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [total, setTotal]         = useState(0);
  const [scraping, setScraping]   = useState(false);
  const [loading, setLoading]     = useState(true);
  // 비번 변경
  const [curPw, setCurPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [confPw, setConfPw] = useState("");
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
    toast.loading("전체 사이트 스크래핑 중... (최대 30초)", { id: "scrape" });
    const d = await campApi("scrape", {}, token);
    if (d.ok) {
      toast.success(`완료! 총 ${d.total}개 수집`, { id: "scrape" });
      await fetchStatus();
    } else {
      toast.error(d.error || "스크래핑 실패", { id: "scrape" });
    }
    setScraping(false);
  }

  async function handleChangePw() {
    if (!curPw || !newPw || !confPw) { toast.error("모든 항목을 입력해주세요"); return; }
    if (newPw !== confPw) { toast.error("새 비밀번호가 일치하지 않습니다"); return; }
    if (newPw.length < 4) { toast.error("새 비밀번호는 4자 이상이어야 합니다"); return; }
    setChPwLoading(true);
    const d = await campApi("changeCampaignPw", { currentPw: curPw, newPw }, token);
    if (d.ok) {
      toast.success("비밀번호가 변경되었습니다. 다시 로그인해주세요");
      setTimeout(onLogout, 1500);
    } else { toast.error(d.error || "변경 실패"); }
    setChPwLoading(false);
  }

  async function handleLogout() {
    await campApi("logoutCampaignAdmin", {}, token);
    onLogout();
  }

  const fmtDate = (ts: string | null) => {
    if (!ts) return "없음";
    try { return new Date(ts).toLocaleString("ko-KR", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return ts; }
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--background)", padding:"28px 24px 60px" }}>
      <div style={{ maxWidth:860, margin:"0 auto" }}>

        {/* 헤더 */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"28px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <h1 style={{ fontSize:"20px", fontWeight:700, margin:0, color:"var(--foreground)" }}>🛡️ 체험단 관리자</h1>
            <p style={{ fontSize:"12px", color:"var(--muted-foreground)", margin:"4px 0 0" }}>BlogAuto Pro 계정과 독립 운영</p>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button onClick={fetchStatus} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 14px", borderRadius:"8px", cursor:"pointer", background:"var(--muted)", color:"var(--foreground)", border:"1px solid var(--border)" }}>
              <RefreshCw style={{ width:13, height:13 }} /> 상태 갱신
            </button>
            <button onClick={handleScrape} disabled={scraping}
              style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 16px", borderRadius:"8px", cursor:scraping?"not-allowed":"pointer", background:"rgba(236,72,153,0.15)", color:"#f472b6", border:"1px solid rgba(236,72,153,0.4)", opacity:scraping?0.6:1 }}>
              <RefreshCw style={{ width:13, height:13 }} />
              {scraping ? "수집 중..." : "실시간 수집"}
            </button>
            <button onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 14px", borderRadius:"8px", cursor:"pointer", background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)" }}>
              <LogOut style={{ width:13, height:13 }} /> 로그아웃
            </button>
          </div>
        </div>

        {/* 요약 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"24px" }}>
          {[
            { label:"총 캠페인",   val: total,                                                 color:"var(--color-emerald)" },
            { label:"마지막 수집", val: fmtDate(updatedAt),                                    color:"var(--foreground)", small:true },
            { label:"사이트 상태", val: `${status.filter(s=>s.ok).length} / ${status.length}`, color: status.some(s=>!s.ok) ? "#f97316" : "var(--color-emerald)" },
          ].map((s, i) => (
            <div key={i} style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"10px", padding:"14px 16px" }}>
              <div style={{ fontSize:"10px", color:"var(--muted-foreground)", textTransform:"uppercase", marginBottom:"6px" }}>{s.label}</div>
              <div style={{ fontSize:(s as any).small?"14px":"22px", fontWeight:700, color:s.color }}>{s.val || "—"}</div>
            </div>
          ))}
        </div>

        {/* 사이트별 상태 */}
        <div style={{ marginBottom:"24px" }}>
          <div style={{ fontSize:"11px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>사이트별 수집 상태</div>
          {loading ? (
            <div style={{ padding:"40px", textAlign:"center", color:"var(--muted-foreground)" }}>불러오는 중...</div>
          ) : status.length === 0 ? (
            <div style={{ padding:"36px", textAlign:"center", color:"var(--muted-foreground)", fontSize:"13px", background:"var(--muted)", borderRadius:"10px", border:"1px solid var(--border)" }}>
              <AlertTriangle style={{ width:22, height:22, margin:"0 auto 8px", display:"block" }} />
              아직 수집 기록이 없습니다. 위의 "실시간 수집" 버튼을 눌러주세요.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {status.map((s: any) => (
                <div key={s.name} style={{ display:"flex", alignItems:"center", gap:"12px", background:"var(--muted)", border:`1px solid ${s.ok?"var(--border)":"rgba(239,68,68,0.3)"}`, borderRadius:"10px", padding:"14px 16px" }}>
                  {s.ok ? <CheckCircle style={{ width:18, height:18, color:"var(--color-emerald)", flexShrink:0 }} />
                        : <XCircle    style={{ width:18, height:18, color:"#ef4444",              flexShrink:0 }} />}
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:600, color:"var(--foreground)" }}>{s.name}</div>
                    {s.error && <div style={{ fontSize:"12px", color:"#ef4444", marginTop:"2px" }}>오류: {s.error}</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"13px", fontWeight:700, color:s.ok?"var(--color-emerald)":"var(--muted-foreground)" }}>
                      {s.ok ? `${s.count}개` : "실패"}
                    </div>
                    <div style={{ fontSize:"11px", color:"var(--muted-foreground)", display:"flex", alignItems:"center", gap:"3px", justifyContent:"flex-end", marginTop:"2px" }}>
                      <Clock style={{ width:9, height:9 }} />{fmtDate(s.scrapedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 사이트 바로가기 */}
        <div style={{ marginBottom:"24px" }}>
          <div style={{ fontSize:"11px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"12px" }}>수집 대상 사이트</div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {[
              { name:"강남맛집체험단", url:"https://강남맛집.net"         },
              { name:"디너의여왕",     url:"https://dinnerqueen.net"      },
              { name:"파블로",         url:"https://pavlovu.com"          },
              { name:"모두의체험단",   url:"https://www.modan.kr"         },
              { name:"태그바이",       url:"https://www.tagby.io/recruit" },
            ].map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"12px", padding:"7px 13px", borderRadius:"8px", background:"var(--muted)", border:"1px solid var(--border)", color:"var(--foreground)", textDecoration:"none" }}>
                {s.name} <ExternalLink style={{ width:10, height:10 }} />
              </a>
            ))}
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"12px", padding:"20px 24px" }}>
          <div style={{ fontSize:"14px", fontWeight:600, color:"var(--foreground)", marginBottom:"16px" }}>🔑 비밀번호 변경</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", maxWidth:360 }}>
            {[
              { label:"현재 비밀번호", val:curPw, set:setCurPw },
              { label:"새 비밀번호",   val:newPw, set:setNewPw },
              { label:"새 비밀번호 확인", val:confPw, set:setConfPw },
            ].map(f => (
              <input key={f.label} type="password" placeholder={f.label} value={f.val}
                onChange={e => f.set(e.target.value)}
                style={{ padding:"10px 14px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--background)", color:"var(--foreground)", fontSize:"13px", outline:"none" }} />
            ))}
            <button onClick={handleChangePw} disabled={chPwLoading}
              style={{ padding:"10px", borderRadius:"8px", background:"rgba(236,72,153,0.15)", color:"#f472b6", border:"1px solid rgba(236,72,153,0.4)", fontWeight:600, fontSize:"13px", cursor:"pointer" }}>
              {chPwLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────
export default function AdminCampaignPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESS_KEY);
    if (saved) setToken(saved);
  }, []);

  function handleAuth(tk: string) { setToken(tk); }
  function handleLogout() {
    sessionStorage.removeItem(SESS_KEY);
    setToken(null);
  }

  if (!token) return <LoginGate onAuth={handleAuth} />;
  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
