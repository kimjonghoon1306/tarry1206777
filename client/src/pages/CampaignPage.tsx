/**
 * BlogAuto Pro - 체험단 허브
 * 외부 링크 + 체험단 작성 도우미 런처
 */

import Layout from "@/components/Layout";
import { ArrowUpRight, PenLine, Sparkles, Zap } from "lucide-react";
import { useLocation } from "wouter";

// ── 체험단 사이트 (모두의체험단 포함 전체 외부 링크) ──
const SITES = [
  { name: "모두의체험단", url: "https://www.modan.kr",            label: "맛집·생활 체험", emoji: "🏆", color: "#a78bfa", grad: "linear-gradient(135deg,#7c3aed,#a78bfa)", glow: "rgba(167,139,250,0.35)" },
  { name: "강남맛집체험단", url: "https://xn--939au0g4vj8sq.net", label: "맛집 전문",       emoji: "🍽️", color: "#fb923c", grad: "linear-gradient(135deg,#ea580c,#fb923c)", glow: "rgba(251,146,60,0.35)" },
  { name: "디너의여왕",     url: "https://dinnerqueen.net",       label: "다이닝 특화",     emoji: "👑", color: "#f472b6", grad: "linear-gradient(135deg,#db2777,#f472b6)", glow: "rgba(244,114,182,0.35)" },
  { name: "레뷰",           url: "https://www.revu.net/campaign", label: "SNS 인플루언서",  emoji: "📸", color: "#34d399", grad: "linear-gradient(135deg,#059669,#34d399)", glow: "rgba(52,211,153,0.35)" },
  { name: "태그바이",       url: "https://www.tagby.io/recruit",  label: "브랜드 협찬",     emoji: "🏷️", color: "#60a5fa", grad: "linear-gradient(135deg,#2563eb,#60a5fa)", glow: "rgba(96,165,250,0.35)" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800;900&display=swap');

@keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes float     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
@keyframes shimmer   { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
@keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.97)} }
@keyframes glowWrite { 0%,100%{box-shadow:0 0 30px rgba(167,139,250,0.3),0 0 60px rgba(167,139,250,0.1)} 50%{box-shadow:0 0 60px rgba(167,139,250,0.6),0 0 100px rgba(167,139,250,0.2)} }
@keyframes borderFlow { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
@keyframes f-float { 0%,100%{transform:translateY(0) scale(1)} 25%{transform:translateY(-10px) scale(1.04)} 50%{transform:translateY(-6px) scale(1.02)} 75%{transform:translateY(-12px) scale(1.05)} }
@keyframes f-glow  { 0%,100%{box-shadow:0 8px 32px rgba(234,179,8,.5)} 50%{box-shadow:0 20px 60px rgba(234,179,8,.9)} }
@keyframes f-shine { 0%{transform:translateX(-150%) skewX(-20deg)} 100%{transform:translateX(300%) skewX(-20deg)} }
@keyframes f-badge { 0%,100%{transform:scale(1) rotate(0deg)} 33%{transform:scale(1.2) rotate(-5deg)} 66%{transform:scale(1.1) rotate(5deg)} }
@keyframes f-ring  { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }

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
  background:linear-gradient(135deg,rgba(255,255,255,0.04),transparent);
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
  top:-50%; left:-60%;
  width:40%; height:200%;
  background:rgba(255,255,255,0.15);
  transform:skewX(-20deg);
  transition:left 0.5s ease;
}
.rec-btn:hover::after { left:120%; }
.rec-btn:hover { transform:translateY(-3px) scale(1.03); }
.rec-btn:active { transform:scale(0.97); }

.write-cta {
  transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.write-cta:hover { transform: translateY(-4px) scale(1.01); }
.write-cta:active { transform: scale(0.98); }

@media(max-width:640px) {
  .sites-grid { grid-template-columns:1fr 1fr !important; }
}
`;

export default function CampaignPage() {
  const [, navigate] = useLocation();

  return (
    <>
    <Layout>
      <style>{CSS}</style>
      <div style={{ padding:"28px 24px 100px", fontFamily:"Pretendard, sans-serif" }}>

        {/* 배경 장식 */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-20%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(167,139,250,0.06) 0%,transparent 70%)" }} />
          <div style={{ position:"absolute", bottom:"-10%", left:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(251,146,60,0.04) 0%,transparent 70%)" }} />
        </div>

        <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto" }}>

          {/* ── 헤더 ── */}
          <div style={{ marginBottom:36, animation:"fadeUp 0.5s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <span style={{ fontSize:26, fontWeight:900, color:"var(--foreground)", letterSpacing:"-0.04em" }}>체험단 허브</span>
            </div>
            <p style={{ fontSize:12, color:"var(--muted-foreground)", margin:0, display:"flex", alignItems:"center", gap:5 }}>
              <Sparkles style={{ width:12, height:12, color:"#a78bfa" }} />
              체험단 사이트 바로가기 · AI 블로그 작성 도우미
            </p>
          </div>

          {/* ── 체험단 작성 도우미 CTA ── */}
          <div className="write-cta ch-card" onClick={() => navigate("/deploy?cheokdan=1")}
            style={{
              background:"linear-gradient(135deg,#3b1d8a,#5b21b6,#7c3aed,#a78bfa)",
              borderRadius:20,
              padding:"36px 40px",
              marginBottom:36,
              border:"1px solid rgba(167,139,250,0.4)",
              boxShadow:"0 0 40px rgba(124,58,237,0.25)",
              animation:"fadeUp 0.5s 0.05s ease both, glowWrite 3s ease-in-out infinite",
            }}>
            {/* 빛 레이어 */}
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 50%,rgba(255,255,255,0.08),transparent 60%)", pointerEvents:"none", borderRadius:20 }} />
            <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, overflow:"hidden", borderRadius:20, pointerEvents:"none" }}>
              <div style={{ position:"absolute", width:"40%", height:"100%", background:"linear-gradient(105deg,transparent,rgba(255,255,255,0.06),transparent)", animation:"shimmer 3s ease-in-out infinite" }} />
            </div>

            <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <span style={{ fontSize:36, animation:"float 3s ease-in-out infinite", display:"inline-block" }}>✍️</span>
                  <div>
                    <div style={{ fontSize:22, fontWeight:900, color:"#fff", letterSpacing:"-0.03em", lineHeight:1.2 }}>체험단 블로그 작성 도우미</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", marginTop:3 }}>AI가 방문 후기를 자동으로 작성해드려요</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {["가게명 입력", "AI 글 생성", "네이버 발행"].map((step, i) => (
                    <span key={i} style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:"rgba(255,255,255,0.15)", color:"#fff", fontWeight:600, border:"1px solid rgba(255,255,255,0.25)", display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ opacity:0.6 }}>{i+1}.</span> {step}
                    </span>
                  ))}
                </div>
              </div>
              <button className="rec-btn"
                style={{ background:"#fff", border:"none", borderRadius:14, padding:"16px 32px", color:"#7c3aed", fontSize:15, fontWeight:900, display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 24px rgba(0,0,0,0.2)", flexShrink:0 }}>
                <PenLine style={{ width:16, height:16 }} />
                작성 시작하기
                <ArrowUpRight style={{ width:14, height:14, opacity:0.7 }} />
              </button>
            </div>
          </div>

          {/* ── 체험단 사이트 ── */}
          <div style={{ animation:"fadeUp 0.5s 0.12s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <Zap style={{ width:14, height:14, color:"#fbbf24" }} />
              <span style={{ fontSize:13, fontWeight:700, color:"var(--foreground)" }}>체험단 사이트 바로가기</span>
              <span style={{ fontSize:11, color:"var(--muted-foreground)", padding:"2px 8px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:20 }}>외부 직접 방문</span>
            </div>
            <div className="sites-grid" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
              {SITES.map((site, i) => (
                <div key={site.name} className="ch-card"
                  style={{
                    background: site.grad,
                    borderRadius:14,
                    padding:"18px 14px",
                    color:"#fff",
                    boxShadow:`0 8px 24px ${site.glow}`,
                    animation:`fadeUp 0.5s ${0.1+i*0.05}s ease both`,
                    border:"none",
                  }}>
                  <div style={{ fontSize:22, marginBottom:8, animation:"float 3s ease-in-out infinite", animationDelay:`${i*0.4}s`, display:"inline-block" }}>{site.emoji}</div>
                  <div style={{ fontSize:13, fontWeight:800, marginBottom:3, letterSpacing:"-0.02em" }}>{site.name}</div>
                  <div style={{ fontSize:10, opacity:0.85, marginBottom:12 }}>{site.label}</div>
                  <div style={{ display:"flex", gap:5 }}>
                    <button className="rec-btn"
                      onClick={() => window.open(site.url, "_blank", "noopener,noreferrer")}
                      style={{ flex:1, background:"rgba(255,255,255,0.2)", border:"none", borderRadius:20, padding:"6px", color:"#fff", fontSize:10, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:2 }}>
                      방문 <ArrowUpRight style={{ width:9, height:9 }} />
                    </button>
                    <button className="rec-btn"
                      onClick={() => {
                        localStorage.setItem("cheokdan_prefill", JSON.stringify({ shopName:"", region:"", category:"" }));
                        navigate("/deploy?cheokdan=1");
                      }}
                      style={{ flex:1, background:"rgba(255,255,255,0.25)", border:"1px solid rgba(255,255,255,0.5)", borderRadius:20, padding:"6px", color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:2 }}>
                      <PenLine style={{ width:9, height:9 }} /> 글쓰기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
    <FloatingWriteBtn />
    </>
  );
}

function FloatingWriteBtn() {
  const [, navigate] = useLocation();
  const FLOAT_CSS = `
    @keyframes f-float { 0%,100%{transform:translateY(0) scale(1)} 25%{transform:translateY(-10px) scale(1.04)} 75%{transform:translateY(-12px) scale(1.05)} }
    @keyframes f-glow  { 0%,100%{box-shadow:0 8px 32px rgba(234,179,8,.5)} 50%{box-shadow:0 20px 60px rgba(234,179,8,.9)} }
    @keyframes f-shine { 0%{transform:translateX(-150%) skewX(-20deg)} 100%{transform:translateX(300%) skewX(-20deg)} }
    @keyframes f-badge { 0%,100%{transform:scale(1) rotate(0deg)} 33%{transform:scale(1.2) rotate(-5deg)} 66%{transform:scale(1.1) rotate(5deg)} }
    @keyframes f-ring  { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
    @keyframes f-svg-spin { 0%,100%{transform:rotate(-8deg) scale(1)} 50%{transform:rotate(8deg) scale(1.1)} }
  `;
  return (
    <>
      <style>{FLOAT_CSS}</style>
      <div style={{ position:"fixed", bottom:40, right:40, zIndex:9998, width:56, height:56, borderRadius:"50%", border:"2px solid rgba(234,179,8,.6)", animation:"f-ring 2s ease-out infinite", pointerEvents:"none" }}/>
      <div style={{ position:"fixed", bottom:40, right:40, zIndex:9998, width:56, height:56, borderRadius:"50%", border:"2px solid rgba(234,179,8,.4)", animation:"f-ring 2s ease-out infinite .6s", pointerEvents:"none" }}/>
      <button
        onClick={() => navigate("/deploy?cheokdan=1")}
        style={{ position:"fixed", bottom:28, right:28, zIndex:9999, display:"flex", alignItems:"center", gap:10, padding:"14px 24px", borderRadius:99, background:"linear-gradient(135deg,#fbbf24,#f59e0b,#d97706,#b45309)", color:"#000", fontWeight:900, fontSize:14, border:"2px solid rgba(255,255,255,.3)", cursor:"pointer", fontFamily:"'Noto Sans KR',sans-serif", letterSpacing:"-.01em", animation:"f-float 4s ease-in-out infinite, f-glow 2.5s ease-in-out infinite", overflow:"hidden" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.animation="none"; el.style.transform="translateY(-6px) scale(1.1)"; el.style.boxShadow="0 24px 60px rgba(234,179,8,.9)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.animation="f-float 4s ease-in-out infinite, f-glow 2.5s ease-in-out infinite"; el.style.transform=""; el.style.boxShadow=""; }}
      >
        <span style={{ position:"absolute", inset:0, background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%)", animation:"f-shine 2s ease-in-out infinite", pointerEvents:"none" }}/>
        <span style={{ position:"relative", animation:"f-svg-spin 2s ease-in-out infinite", display:"flex" }}>
          <PenLine style={{ width:16, height:16 }} />
        </span>
        <span style={{ position:"relative" }}>체험단 작성</span>
        <span style={{ position:"absolute", top:-8, right:-4, background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:99, border:"2px solid #fff", boxShadow:"0 2px 8px rgba(239,68,68,.5)", animation:"f-badge 2s ease-in-out infinite", letterSpacing:".05em" }}>NEW</span>
      </button>
    </>
  );
}
