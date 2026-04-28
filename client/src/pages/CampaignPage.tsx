/**
 * BlogAuto Pro - 체험단 허브
 * 수집: 모두의체험단 | 추천: 강남맛집/디너의여왕/레뷰/태그바이
 */

import { useState, useMemo, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { ExternalLink, MapPin, Clock, RefreshCw, Sparkles, ArrowUpRight, Zap } from "lucide-react";

// ── 수집 사이트 (모두의체험단만) ──────────────────────
const SCRAPE_SOURCE = { name: "모두의체험단", key: "modan", url: "https://www.modan.kr", color: "#a78bfa", grad: "linear-gradient(135deg,#7c3aed,#a78bfa)", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" };

// ── 추천 사이트 (직접 방문) ───────────────────────────
const RECOMMEND = [
  { name: "강남맛집체험단", url: "https://xn--939au0g4vj8sq.net", label: "맛집 전문", emoji: "🍽️", color: "#fb923c", grad: "linear-gradient(135deg,#ea580c,#fb923c)", glow: "rgba(251,146,60,0.35)" },
  { name: "디너의여왕",     url: "https://dinnerqueen.net",       label: "다이닝 특화", emoji: "👑", color: "#f472b6", grad: "linear-gradient(135deg,#db2777,#f472b6)", glow: "rgba(244,114,182,0.35)" },
  { name: "레뷰",           url: "https://www.revu.net/campaign", label: "SNS 인플루언서", emoji: "📸", color: "#34d399", grad: "linear-gradient(135deg,#059669,#34d399)", glow: "rgba(52,211,153,0.35)" },
  { name: "태그바이",       url: "https://www.tagby.io/recruit",  label: "브랜드 협찬", emoji: "🏷️", color: "#60a5fa", grad: "linear-gradient(135deg,#2563eb,#60a5fa)", glow: "rgba(96,165,250,0.35)" },
];

const FALLBACK: any[] = [];
const REGIONS = ["전체","서울","경기","부산","인천","강원","제주","전국"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800;900&display=swap');

@keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.97)} }
@keyframes spin      { to{transform:rotate(360deg)} }
@keyframes shimmer   { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
@keyframes float     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
@keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(167,139,250,0.2)} 50%{box-shadow:0 0 40px rgba(167,139,250,0.5)} }
@keyframes borderFlow { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }

.ch-card {
  animation: fadeUp 0.4s ease both;
  transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s;
  position: relative;
  overflow: hidden;
}
.ch-card::before {
  content:'';
  position:absolute;
  inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,0.03),transparent);
  pointer-events:none;
}
.ch-card:hover { transform:translateY(-5px) scale(1.01); box-shadow:0 20px 50px rgba(0,0,0,0.3); }

.rec-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
  cursor: pointer;
}
.rec-btn::after {
  content:'';
  position:absolute;
  top:-50%;
  left:-60%;
  width:40%;
  height:200%;
  background:rgba(255,255,255,0.15);
  transform:skewX(-20deg);
  transition:left 0.5s ease;
}
.rec-btn:hover::after { left:120%; }
.rec-btn:hover { transform:translateY(-4px) scale(1.03); }
.rec-btn:active { transform:scale(0.97); }

.ch-filter {
  transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
  cursor: pointer;
}
.ch-filter:hover { opacity:0.85; transform:scale(1.05); }

.refresh-btn {
  transition: all 0.2s;
  cursor: pointer;
}
.refresh-btn:hover { opacity:0.85; transform:scale(1.04); }
.refresh-btn:active { transform:scale(0.95); }

.live-dot {
  width:7px; height:7px; border-radius:50%;
  background:#4ade80;
  box-shadow:0 0 8px #4ade80;
  animation:pulse 1.8s ease-in-out infinite;
  display:inline-block;
}

@media(max-width:640px) {
  .rec-grid { grid-template-columns:1fr 1fr !important; }
  .stat-grid { grid-template-columns:1fr 1fr !important; }
}
`;

async function loadFromServer() {
  try {
    const res = await fetch("/api/scrape-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "load" }),
    });
    const d = await res.json();
    if (d.ok && d.campaigns?.length > 0) return { list: d.campaigns, updatedAt: d.updatedAt };
  } catch {}
  return { list: FALLBACK, updatedAt: null };
}

export default function CampaignPage() {
  const [region, setRegion]       = useState("전체");
  const [sort, setSort]           = useState<"latest"|"deadline"|"reward">("latest");
  const [ready, setReady]         = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>(FALLBACK);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    setTimeout(() => setReady(true), 60);
    fetchData();
    timer.current = setInterval(() => fetchData(true), 45 * 60 * 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  async function fetchData(silent = false) {
    if (!silent) setLoading(true);
    const { list, updatedAt: ts } = await loadFromServer();
    setCampaigns(list.filter((c: any) => c.source === SCRAPE_SOURCE.name));
    if (ts) setUpdatedAt(ts);
    if (!silent) setLoading(false);
  }

  const fmtDate = (ts: string | null) => {
    if (!ts) return "";
    try { return new Date(ts).toLocaleString("ko-KR", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return ""; }
  };

  const filtered = useMemo(() => {
    let data = [...campaigns];
    if (region !== "전체") data = data.filter(c => c.region === region);
    if (sort === "deadline") data.sort((a, b) => a.deadline - b.deadline);
    if (sort === "reward")   data.sort((a, b) => b.rewardVal - a.rewardVal);
    return data;
  }, [region, campaigns, sort]);

  const urgentCount = filtered.filter(c => c.deadline <= 3).length;

  return (
    <>
    <Layout>
      <style>{CSS}</style>
      <div style={{ padding:"28px 24px 80px", opacity:ready?1:0, transition:"opacity 0.5s", fontFamily:"Pretendard, sans-serif" }}>

        {/* ── 배경 장식 ── */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-20%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.06) 0%,transparent 70%)" }} />
          <div style={{ position:"absolute", bottom:"-10%", left:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(251,146,60,0.04) 0%,transparent 70%)" }} />
        </div>

        <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto" }}>

          {/* ── 헤더 ── */}
          <div style={{ marginBottom:32, animation:"fadeUp 0.5s ease both" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                  <span style={{ fontSize:26, fontWeight:900, color:"var(--foreground)", letterSpacing:"-0.04em" }}>체험단 허브</span>
                  <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, padding:"3px 10px", borderRadius:20, background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80", fontWeight:700 }}>
                    <span className="live-dot" /> LIVE
                  </span>
                </div>
                <p style={{ fontSize:12, color:"var(--muted-foreground)", margin:0, display:"flex", alignItems:"center", gap:5 }}>
                  <Sparkles style={{ width:12, height:12, color:"#a78bfa" }} />
                  실시간 체험단 공고 수집 · 자동 업데이트
                  {updatedAt && <span style={{ opacity:0.5 }}>· {fmtDate(updatedAt)}</span>}
                </p>
              </div>
              <button className="refresh-btn" onClick={() => fetchData()} disabled={loading}
                style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, padding:"9px 18px", borderRadius:10, background:"var(--muted)", border:"1px solid var(--border)", color:"var(--muted-foreground)" }}>
                <RefreshCw style={{ width:13, height:13, animation:loading?"spin 0.8s linear infinite":"none" }} />
                {loading ? "수집 중..." : "새로고침"}
              </button>
            </div>
          </div>

          {/* ── 추천 사이트 ── */}
          <div style={{ marginBottom:32, animation:"fadeUp 0.5s 0.05s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <Zap style={{ width:14, height:14, color:"#fbbf24" }} />
              <span style={{ fontSize:13, fontWeight:700, color:"var(--foreground)" }}>추천 체험단 사이트</span>
              <span style={{ fontSize:11, color:"var(--muted-foreground)", padding:"2px 8px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:20 }}>직접 방문 추천</span>
            </div>
            <div className="rec-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {RECOMMEND.map((site, i) => (
                <button key={site.name} className="rec-btn"
                  onClick={() => window.open(site.url, "_blank", "noopener,noreferrer")}
                  style={{
                    background: site.grad,
                    border: "none",
                    borderRadius: 14,
                    padding: "16px 14px",
                    color: "#fff",
                    textAlign: "left",
                    boxShadow: `0 8px 24px ${site.glow}`,
                    animation: `fadeUp 0.5s ${0.08+i*0.06}s ease both`,
                  }}>
                  <div style={{ fontSize:22, marginBottom:8, animation:"float 3s ease-in-out infinite", animationDelay:`${i*0.4}s`, display:"inline-block" }}>{site.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:3, letterSpacing:"-0.02em" }}>{site.name}</div>
                  <div style={{ fontSize:10, opacity:0.85, marginBottom:10 }}>{site.label}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, background:"rgba(255,255,255,0.2)", padding:"4px 10px", borderRadius:20, width:"fit-content" }}>
                    방문하기 <ArrowUpRight style={{ width:10, height:10 }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── 통계 ── */}
          <div className="stat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24, animation:"fadeUp 0.5s 0.12s ease both" }}>
            {[
              { label:"수집 공고", val:filtered.length, color:"#a78bfa", icon:"📋" },
              { label:"마감 임박", val:urgentCount,     color:"#fb923c", icon:"⏰" },
              { label:"업데이트", val:updatedAt ? fmtDate(updatedAt) : "대기중", color:"#4ade80", icon:"🔄" },
            ].map((s, i) => (
              <div key={i} style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <span style={{ fontSize:14 }}>{s.icon}</span>
                  <span style={{ fontSize:10, color:"var(--muted-foreground)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</span>
                </div>
                <div style={{ fontSize:typeof s.val==="number"?22:13, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* ── 필터 ── */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10, animation:"fadeUp 0.5s 0.15s ease both" }}>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {REGIONS.map(r => (
                <button key={r} className="ch-filter" onClick={() => setRegion(r)}
                  style={{
                    fontSize:12, padding:"5px 14px", borderRadius:20, border:"none", fontWeight:r===region?700:400,
                    background:r===region?"linear-gradient(135deg,#7c3aed,#a78bfa)":"var(--muted)",
                    color:r===region?"#fff":"var(--muted-foreground)",
                    boxShadow:r===region?"0 4px 14px rgba(124,58,237,0.4)":"none",
                  }}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:5 }}>
              {[{k:"latest",v:"최신순"},{k:"deadline",v:"마감순"},{k:"reward",v:"혜택순"}].map(s => (
                <button key={s.k} className="ch-filter" onClick={() => setSort(s.k as any)}
                  style={{
                    fontSize:11, padding:"5px 12px", borderRadius:8, border:`1px solid ${sort===s.k?"#a78bfa":"var(--border)"}`,
                    background:sort===s.k?"rgba(167,139,250,0.15)":"transparent",
                    color:sort===s.k?"#a78bfa":"var(--muted-foreground)", fontWeight:sort===s.k?700:400,
                  }}>
                  {s.v}
                </button>
              ))}
            </div>
          </div>

          {/* ── 캠페인 목록 ── */}
          <div style={{ animation:"fadeUp 0.5s 0.18s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:3, height:20, borderRadius:2, background:"linear-gradient(180deg,#7c3aed,#a78bfa)" }} />
                <span style={{ fontSize:15, fontWeight:700, color:"var(--foreground)" }}>모두의체험단</span>
                <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:"rgba(167,139,250,0.12)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.25)", fontWeight:600 }}>{filtered.length}개</span>
              </div>
              <button className="rec-btn" onClick={() => window.open(SCRAPE_SOURCE.url, "_blank", "noopener,noreferrer")}
                style={{ background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:8, padding:"5px 12px", color:"#a78bfa", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                전체보기 <ArrowUpRight style={{ width:11, height:11 }} />
              </button>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", background:"var(--muted)", borderRadius:16, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
                <div style={{ fontSize:14, fontWeight:600, color:"var(--foreground)", marginBottom:6 }}>수집된 공고가 없습니다</div>
                <div style={{ fontSize:12, color:"var(--muted-foreground)" }}>새로고침 버튼을 눌러 최신 공고를 불러오세요</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
                {filtered.map((c: any, idx: number) => {
                  const urgent = c.deadline <= 3;
                  return (
                    <div key={String(c.id)} className="ch-card"
                      style={{
                        background:"var(--muted)",
                        border:`1px solid ${urgent ? "rgba(251,146,60,0.4)" : "var(--border)"}`,
                        borderRadius:14,
                        padding:18,
                        animationDelay:`${idx*0.04}s`,
                        boxShadow: urgent ? "0 0 20px rgba(251,146,60,0.1)" : "none",
                      }}>

                      {/* 상단 컬러 바 */}
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:urgent?"linear-gradient(90deg,#fb923c,#f97316)":"linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius:"14px 14px 0 0" }} />

                      <div style={{ marginTop:4 }}>
                        {/* 지역 + 마감 */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"var(--background)", color:"var(--muted-foreground)", border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:3 }}>
                            <MapPin style={{ width:8, height:8 }} />{c.region || "전국"}
                          </span>
                          <span style={{ fontSize:10, fontWeight:700, color:urgent?"#fb923c":"var(--muted-foreground)", display:"flex", alignItems:"center", gap:3, background:urgent?"rgba(251,146,60,0.1)":"transparent", padding:urgent?"2px 7px":"0", borderRadius:6 }}>
                            <Clock style={{ width:9, height:9 }} />
                            {urgent ? `D-${c.deadline} 임박!` : `D-${c.deadline}`}
                          </span>
                        </div>

                        {/* 제목 */}
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--foreground)", marginBottom:14, lineHeight:1.5, minHeight:40 }}>
                          {c.title}
                        </div>

                        {/* 하단 */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:"1px solid var(--border)" }}>
                          <div style={{ fontSize:11, fontWeight:600, color:"#a78bfa" }}>{c.reward || "정보 확인 필요"}</div>
                          <button className="rec-btn"
                            onClick={() => window.open(c.url, "_blank", "noopener,noreferrer")}
                            style={{ background:"linear-gradient(135deg,#7c3aed,#a78bfa)", border:"none", borderRadius:8, padding:"6px 13px", color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", gap:4, boxShadow:"0 4px 12px rgba(124,58,237,0.35)" }}>
                            신청 <ExternalLink style={{ width:10, height:10 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
    <FloatingAutoPublishBtn />
    </>
  );
}
function FloatingAutoPublishBtn() {
  const FLOAT_CSS = `
    @keyframes f-float {
      0%   { transform: translateY(0px) rotate(0deg) scale(1); }
      25%  { transform: translateY(-10px) rotate(-1deg) scale(1.04); }
      50%  { transform: translateY(-6px) rotate(1deg) scale(1.02); }
      75%  { transform: translateY(-12px) rotate(-0.5deg) scale(1.05); }
      100% { transform: translateY(0px) rotate(0deg) scale(1); }
    }
    @keyframes f-glow {
      0%,100% { box-shadow: 0 8px 32px rgba(234,179,8,.5), 0 0 0 0 rgba(234,179,8,.4), 0 0 60px rgba(234,179,8,.1); }
      50%     { box-shadow: 0 20px 60px rgba(234,179,8,.9), 0 0 0 12px rgba(234,179,8,0), 0 0 100px rgba(234,179,8,.2); }
    }
    @keyframes f-shine {
      0%   { transform: translateX(-150%) skewX(-20deg); opacity:0.8; }
      100% { transform: translateX(300%) skewX(-20deg); opacity:0; }
    }
    @keyframes f-badge {
      0%,100% { transform: scale(1) rotate(0deg); }
      33%     { transform: scale(1.2) rotate(-5deg); }
      66%     { transform: scale(1.1) rotate(5deg); }
    }
    @keyframes f-ring {
      0%   { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @keyframes f-orbit {
      from { transform: rotate(0deg) translateX(28px) rotate(0deg); }
      to   { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
    }
    @keyframes f-svg-spin {
      0%,100% { transform: rotate(-8deg) scale(1); }
      50%     { transform: rotate(8deg) scale(1.1); }
    }
  `;

  return (
    <>
      <style>{FLOAT_CSS}</style>

      {/* 링 파동 효과 */}
      <div style={{
        position:"fixed", bottom:40, right:40, zIndex:9998,
        width:56, height:56, borderRadius:"50%",
        border:"2px solid rgba(234,179,8,.6)",
        animation:"f-ring 2s ease-out infinite",
        pointerEvents:"none",
      }}/>
      <div style={{
        position:"fixed", bottom:40, right:40, zIndex:9998,
        width:56, height:56, borderRadius:"50%",
        border:"2px solid rgba(234,179,8,.4)",
        animation:"f-ring 2s ease-out infinite .6s",
        pointerEvents:"none",
      }}/>

      {/* 궤도 도는 별 SVG */}
      <div style={{
        position:"fixed", bottom:54, right:54, zIndex:9999,
        width:0, height:0, pointerEvents:"none",
      }}>
        <div style={{animation:"f-orbit 3s linear infinite"}}>
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" fill="#fbbf24"/>
          </svg>
        </div>
      </div>

      <button
        onClick={() => { window.location.href = "/naver"; }}
        style={{
          position:"fixed", bottom:28, right:28, zIndex:9999,
          display:"flex", alignItems:"center", gap:10,
          padding:"14px 24px", borderRadius:99,
          background:"linear-gradient(135deg,#fbbf24,#f59e0b,#d97706,#b45309)",
          color:"#000", fontWeight:900, fontSize:14,
          border:"2px solid rgba(255,255,255,.3)",
          cursor:"pointer",
          fontFamily:"'Noto Sans KR',sans-serif",
          letterSpacing:"-.01em",
          animation:"f-float 4s ease-in-out infinite, f-glow 2.5s ease-in-out infinite",
          overflow:"hidden",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.animation = "none";
          el.style.transform = "translateY(-6px) scale(1.1)";
          el.style.boxShadow = "0 24px 60px rgba(234,179,8,.9), 0 0 0 4px rgba(234,179,8,.3)";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.animation = "f-float 4s ease-in-out infinite, f-glow 2.5s ease-in-out infinite";
          el.style.transform = "";
          el.style.boxShadow = "";
        }}
      >
        {/* 반짝임 레이어 */}
        <span style={{
          position:"absolute", inset:0,
          background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%)",
          animation:"f-shine 2s ease-in-out infinite",
          pointerEvents:"none",
        }}/>

        {/* 배경 그라디언트 오버레이 */}
        <span style={{
          position:"absolute", inset:0,
          background:"radial-gradient(circle at 30% 50%,rgba(255,255,255,.15),transparent 60%)",
          pointerEvents:"none",
        }}/>

        {/* 번개 SVG - 애니메이션 */}
        <span style={{position:"relative", animation:"f-svg-spin 2s ease-in-out infinite", display:"flex"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#78350f"/>
                <stop offset="100%" stopColor="#000"/>
              </linearGradient>
            </defs>
            <path d="M13 2L4.5 13.5H11L10 22L20.5 10H14L13 2Z"
              fill="url(#bolt-grad)" stroke="#000" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </span>

        <span style={{position:"relative", textShadow:"0 1px 2px rgba(0,0,0,.15)"}}>자동 발행</span>

        {/* 오른쪽 화살표 SVG */}
        <span style={{position:"relative", opacity:.7}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>

        {/* NEW 배지 */}
        <span style={{
          position:"absolute", top:-8, right:-4,
          background:"linear-gradient(135deg,#ef4444,#dc2626)",
          color:"#fff", fontSize:9, fontWeight:900,
          padding:"2px 6px", borderRadius:99,
          border:"2px solid #fff",
          boxShadow:"0 2px 8px rgba(239,68,68,.5)",
          animation:"f-badge 2s ease-in-out infinite",
          letterSpacing:".05em",
        }}>NEW</span>
      </button>
    </>
  );
}

