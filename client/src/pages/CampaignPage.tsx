/**
 * BlogAuto Pro - 체험단 허브
 * 사이트 링크 + 순위표 + 작성 도우미
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { ArrowUpRight, PenLine, Sparkles, Zap, Trophy, MapPin, Package } from "lucide-react";
import { useLocation } from "wouter";

// ── 체험단 사이트 전체 목록 ───────────────────────────
const SITES = [
  { name:"레뷰",         url:"https://www.revu.net/campaign",    label:"SNS 인플루언서", emoji:"📸", grad:"linear-gradient(135deg,#059669,#34d399)", glow:"rgba(52,211,153,0.4)",   badge:"1위" },
  { name:"리뷰노트",     url:"https://www.reviewnote.co.kr/",    label:"캠페인 수 최다",  emoji:"📋", grad:"linear-gradient(135deg,#dc2626,#f87171)", glow:"rgba(248,113,113,0.4)",  badge:"급상승" },
  { name:"디너의여왕",   url:"https://dinnerqueen.net",           label:"다이닝 특화",     emoji:"👑", grad:"linear-gradient(135deg,#db2777,#f472b6)", glow:"rgba(244,114,182,0.4)",  badge:"맛집" },
  { name:"리뷰플레이스", url:"https://www.reviewplace.co.kr/",   label:"제품·맛집",       emoji:"🛍️", grad:"linear-gradient(135deg,#4338ca,#818cf8)", glow:"rgba(129,140,248,0.4)",  badge:"" },
  { name:"서울오빠",     url:"https://www.seoulouba.co.kr/",     label:"맛집 기자단",     emoji:"🗺️", grad:"linear-gradient(135deg,#d97706,#fbbf24)", glow:"rgba(251,191,36,0.4)",   badge:"" },
  { name:"모두의체험단", url:"https://www.modan.kr",              label:"소상공인 특화",   emoji:"🏆", grad:"linear-gradient(135deg,#7c3aed,#a78bfa)", glow:"rgba(167,139,250,0.4)",  badge:"" },
  { name:"강남맛집체험단",url:"https://xn--939au0g4vj8sq.net",   label:"맛집 전문",       emoji:"🍽️", grad:"linear-gradient(135deg,#ea580c,#fb923c)", glow:"rgba(251,146,60,0.4)",   badge:"" },
  { name:"아싸뷰",       url:"https://assaview.co.kr/",          label:"선정률 높음",     emoji:"🎯", grad:"linear-gradient(135deg,#65a30d,#a3e635)", glow:"rgba(163,230,53,0.4)",   badge:"" },
  { name:"태그바이",     url:"https://www.tagby.io/recruit",     label:"브랜드 협찬",     emoji:"🏷️", grad:"linear-gradient(135deg,#2563eb,#60a5fa)", glow:"rgba(96,165,250,0.4)",   badge:"" },
  { name:"체험뷰",       url:"https://chvu.co.kr/",              label:"숏폼·인스타",     emoji:"🎬", grad:"linear-gradient(135deg,#0891b2,#22d3ee)", glow:"rgba(34,211,238,0.4)",   badge:"" },
  { name:"파블로",       url:"https://pavlovu.com/",             label:"빠른 선정",       emoji:"⚡", grad:"linear-gradient(135deg,#475569,#94a3b8)", glow:"rgba(148,163,184,0.4)",  badge:"" },
  { name:"링뷰",         url:"https://ringview.co.kr",           label:"무료 체험단",     emoji:"🔗", grad:"linear-gradient(135deg,#047857,#6ee7b7)", glow:"rgba(110,231,183,0.4)",  badge:"무료" },
  { name:"스타일씨",     url:"https://www.stylec.co.kr/",        label:"뷰티·인스타",     emoji:"💄", grad:"linear-gradient(135deg,#be185d,#fb7185)", glow:"rgba(251,113,133,0.4)",  badge:"" },
  { name:"포블로그",     url:"https://4blog.net/",               label:"방문·배송 통합",  emoji:"📝", grad:"linear-gradient(135deg,#6d28d9,#c084fc)", glow:"rgba(192,132,252,0.4)",  badge:"" },
];

// ── 순위 데이터 ──────────────────────────────────────
const VISIT_RANK = [
  { rank:1, name:"레뷰",          score:98, tag:"캠페인 700건+/일", url:"https://www.revu.net/campaign",    color:"#34d399" },
  { rank:2, name:"리뷰노트",      score:94, tag:"소상공인 무료 등록",url:"https://www.reviewnote.co.kr/",   color:"#f87171" },
  { rank:3, name:"디너의여왕",    score:88, tag:"다이닝·맛집 최강", url:"https://dinnerqueen.net",          color:"#f472b6" },
  { rank:4, name:"서울오빠",      score:82, tag:"맛집 기자단 특화",  url:"https://www.seoulouba.co.kr/",    color:"#fbbf24" },
  { rank:5, name:"강남맛집체험단",score:76, tag:"강남권 맛집 집중",  url:"https://xn--939au0g4vj8sq.net",   color:"#fb923c" },
  { rank:6, name:"아싸뷰",        score:70, tag:"선정률 높아 초보 추천",url:"https://assaview.co.kr/",     color:"#a3e635" },
  { rank:7, name:"파블로",        score:65, tag:"24시간 빠른 선정",  url:"https://pavlovu.com/",            color:"#94a3b8" },
  { rank:8, name:"체험뷰",        score:60, tag:"무제한 캠페인",     url:"https://chvu.co.kr/",             color:"#22d3ee" },
];

const DELIVERY_RANK = [
  { rank:1, name:"레뷰",          score:96, tag:"제품 캠페인 최다",  url:"https://www.revu.net/campaign",   color:"#34d399" },
  { rank:2, name:"리뷰노트",      score:92, tag:"무료 제품 체험단",  url:"https://www.reviewnote.co.kr/",   color:"#f87171" },
  { rank:3, name:"리뷰플레이스",  score:85, tag:"제품 리뷰 특화",    url:"https://www.reviewplace.co.kr/",  color:"#818cf8" },
  { rank:4, name:"태그바이",      score:80, tag:"브랜드 협찬 전문",  url:"https://www.tagby.io/recruit",    color:"#60a5fa" },
  { rank:5, name:"스타일씨",      score:74, tag:"뷰티·생활 배송",   url:"https://www.stylec.co.kr/",       color:"#fb7185" },
  { rank:6, name:"링뷰",          score:68, tag:"100% 무료 배송",    url:"https://ringview.co.kr",          color:"#6ee7b7" },
  { rank:7, name:"포블로그",      score:63, tag:"배송형 다수 보유",  url:"https://4blog.net/",              color:"#c084fc" },
  { rank:8, name:"체험뷰",        score:58, tag:"제품·숏폼 연계",   url:"https://chvu.co.kr/",             color:"#22d3ee" },
];

const MEDAL = ["🥇","🥈","🥉"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800;900&display=swap');

@keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes shimmer { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(250%) skewX(-15deg)} }
@keyframes glowCTA { 0%,100%{box-shadow:0 0 30px rgba(124,58,237,0.25)} 50%{box-shadow:0 0 60px rgba(124,58,237,0.5)} }
@keyframes barGrow { from{width:0} to{width:var(--w)} }
@keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.97)} }
@keyframes f-float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-10px) scale(1.04)} }
@keyframes f-glow  { 0%,100%{box-shadow:0 8px 32px rgba(234,179,8,.5)} 50%{box-shadow:0 20px 60px rgba(234,179,8,.9)} }
@keyframes f-shine { 0%{transform:translateX(-150%) skewX(-20deg)} 100%{transform:translateX(300%) skewX(-20deg)} }
@keyframes f-badge { 0%,100%{transform:scale(1) rotate(0deg)} 33%{transform:scale(1.2) rotate(-5deg)} 66%{transform:scale(1.1) rotate(5deg)} }
@keyframes f-ring  { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }

.ch-card {
  animation: fadeUp .4s ease both;
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s;
  position: relative; overflow: hidden;
}
.ch-card::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.04),transparent);
  pointer-events:none;
}
.ch-card:hover { transform:translateY(-5px) scale(1.02); box-shadow:0 20px 50px rgba(0,0,0,.3); }

.site-btn {
  position:relative; overflow:hidden;
  transition: all .2s cubic-bezier(.34,1.56,.64,1); cursor:pointer;
}
.site-btn::after {
  content:''; position:absolute; top:-50%; left:-60%;
  width:40%; height:200%; background:rgba(255,255,255,.18);
  transform:skewX(-20deg); transition:left .5s;
}
.site-btn:hover::after { left:120%; }
.site-btn:hover { transform:translateY(-2px) scale(1.04); }
.site-btn:active { transform:scale(.97); }

.rank-row {
  transition: all .18s ease; cursor:pointer;
  position:relative; overflow:hidden;
}
.rank-row:hover { background:rgba(255,255,255,.04) !important; transform:translateX(4px); }
.rank-bar { animation: barGrow .8s ease both; }

.tab-btn { transition: all .18s ease; cursor:pointer; }

@media(max-width:768px) {
  .main-layout { flex-direction:column !important; }
  .sites-col { width:100% !important; }
  .rank-col  { width:100% !important; }
  .sites-grid { grid-template-columns:repeat(3,1fr) !important; }
}
@media(max-width:480px) {
  .sites-grid { grid-template-columns:repeat(2,1fr) !important; }
}
`;

export default function CampaignPage() {
  const [, navigate] = useLocation();
  const [rankTab, setRankTab] = useState<"visit"|"delivery">("visit");
  const rankData = rankTab === "visit" ? VISIT_RANK : DELIVERY_RANK;

  return (
    <>
    <Layout>
      <style>{CSS}</style>
      <div style={{ padding:"24px 20px 100px", fontFamily:"Pretendard, sans-serif", minHeight:"100vh" }}>

        {/* 배경 */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-15%", right:"-8%", width:480, height:480, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,.06) 0%,transparent 70%)" }} />
          <div style={{ position:"absolute", bottom:"-10%", left:"-5%", width:380, height:380, borderRadius:"50%", background:"radial-gradient(circle,rgba(251,146,60,.04) 0%,transparent 70%)" }} />
        </div>

        <div style={{ position:"relative", zIndex:1, maxWidth:1280, margin:"0 auto" }}>

          {/* ── 헤더 ── */}
          <div style={{ marginBottom:20, animation:"fadeUp .5s ease both" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:24, fontWeight:900, color:"var(--foreground)", letterSpacing:"-.04em" }}>체험단 허브</span>
            </div>
            <p style={{ fontSize:12, color:"var(--muted-foreground)", margin:0, display:"flex", alignItems:"center", gap:4 }}>
              <Sparkles style={{ width:11, height:11, color:"#a78bfa" }} />
              체험단 사이트 바로가기 · 순위표 · AI 작성 도우미
            </p>
          </div>

          {/* ── 작성 도우미 CTA ── */}
          <div className="ch-card" onClick={() => navigate("/deploy?cheokdan=1")}
            style={{ background:"linear-gradient(135deg,#3b1d8a,#5b21b6,#7c3aed,#a78bfa)", borderRadius:18, padding:"24px 28px", marginBottom:20, border:"1px solid rgba(167,139,250,.4)", cursor:"pointer", animation:"fadeUp .5s .05s ease both, glowCTA 3s ease-in-out infinite" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 50%,rgba(255,255,255,.07),transparent 60%)", borderRadius:18, pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, overflow:"hidden", borderRadius:18, pointerEvents:"none" }}>
              <div style={{ position:"absolute", width:"35%", height:"100%", background:"linear-gradient(105deg,transparent,rgba(255,255,255,.06),transparent)", animation:"shimmer 3s ease-in-out infinite" }} />
            </div>
            <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:32, animation:"float 3s ease-in-out infinite", display:"inline-block" }}>✍️</span>
                <div>
                  <div style={{ fontSize:18, fontWeight:900, color:"#fff", letterSpacing:"-.03em" }}>체험단 블로그 작성 도우미</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.7)", marginTop:2 }}>가게명 입력 → AI 글 생성 → 네이버 발행까지 자동</div>
                </div>
              </div>
              <button className="site-btn" style={{ background:"#fff", border:"none", borderRadius:12, padding:"12px 24px", color:"#7c3aed", fontSize:13, fontWeight:900, display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
                <PenLine style={{ width:14, height:14 }} /> 작성 시작
              </button>
            </div>
          </div>

          {/* ── 메인 2컬럼 레이아웃 ── */}
          <div className="main-layout" style={{ display:"flex", gap:16, alignItems:"flex-start" }}>

            {/* ── 왼쪽: 사이트 카드들 ── */}
            <div className="sites-col" style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
                <Zap style={{ width:13, height:13, color:"#fbbf24" }} />
                <span style={{ fontSize:13, fontWeight:700, color:"var(--foreground)" }}>체험단 사이트 바로가기</span>
                <span style={{ fontSize:10, color:"var(--muted-foreground)", padding:"2px 7px", background:"var(--muted)", border:"1px solid var(--border)", borderRadius:20 }}>{SITES.length}개</span>
              </div>
              <div className="sites-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:9 }}>
                {SITES.map((s, i) => (
                  <div key={s.name} className="ch-card"
                    style={{ background:s.grad, borderRadius:13, padding:"14px 12px", color:"#fff", boxShadow:`0 6px 20px ${s.glow}`, animation:`fadeUp .4s ${.06+i*.04}s ease both`, border:"none" }}>
                    {s.badge && (
                      <div style={{ position:"absolute", top:8, right:8, fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:20, background:"rgba(255,255,255,.25)", border:"1px solid rgba(255,255,255,.4)", lineHeight:1.4 }}>{s.badge}</div>
                    )}
                    <div style={{ fontSize:20, marginBottom:6, animation:"float 3s ease-in-out infinite", animationDelay:`${i*.35}s`, display:"inline-block" }}>{s.emoji}</div>
                    <div style={{ fontSize:12, fontWeight:800, marginBottom:2, letterSpacing:"-.02em", lineHeight:1.3 }}>{s.name}</div>
                    <div style={{ fontSize:9, opacity:.8, marginBottom:10 }}>{s.label}</div>
                    <div style={{ display:"flex", gap:4 }}>
                      <button className="site-btn" onClick={() => window.open(s.url,"_blank","noopener,noreferrer")}
                        style={{ flex:1, background:"rgba(255,255,255,.2)", border:"none", borderRadius:16, padding:"5px 2px", color:"#fff", fontSize:9, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:1 }}>
                        방문 <ArrowUpRight style={{ width:8, height:8 }} />
                      </button>
                      <button className="site-btn"
                        onClick={() => { localStorage.setItem("cheokdan_prefill", JSON.stringify({shopName:"",region:"",category:""})); navigate("/deploy?cheokdan=1"); }}
                        style={{ flex:1, background:"rgba(255,255,255,.28)", border:"1px solid rgba(255,255,255,.45)", borderRadius:16, padding:"5px 2px", color:"#fff", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:1 }}>
                        <PenLine style={{ width:8, height:8 }} /> 글쓰기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 오른쪽: 순위표 ── */}
            <div className="rank-col" style={{ width:320, flexShrink:0 }}>
              <div style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:16, overflow:"hidden", animation:"fadeUp .5s .2s ease both" }}>

                {/* 탭 헤더 */}
                <div style={{ display:"flex", borderBottom:"1px solid var(--border)" }}>
                  {([["visit","방문체험단","🗺️"],["delivery","배송체험단","📦"]] as ["visit"|"delivery",string,string][]).map(([key, label, icon]) => (
                    <button key={key} className="tab-btn" onClick={() => setRankTab(key)}
                      style={{ flex:1, padding:"14px 8px", background:rankTab===key?"var(--background)":"transparent", border:"none", color:rankTab===key?"var(--foreground)":"var(--muted-foreground)", fontWeight:rankTab===key?800:500, fontSize:12, fontFamily:"Pretendard, sans-serif", borderBottom:rankTab===key?"2px solid #a78bfa":"2px solid transparent", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                      <span>{icon}</span>{label}
                    </button>
                  ))}
                </div>

                {/* 순위 제목 */}
                <div style={{ padding:"14px 16px 10px", display:"flex", alignItems:"center", gap:7 }}>
                  <Trophy style={{ width:14, height:14, color:"#fbbf24" }} />
                  <span style={{ fontSize:12, fontWeight:700, color:"var(--foreground)" }}>
                    {rankTab==="visit" ? "방문체험단 TOP 8" : "배송체험단 TOP 8"}
                  </span>
                  <span style={{ fontSize:10, color:"var(--muted-foreground)", marginLeft:"auto" }}>2025 기준</span>
                </div>

                {/* 순위 리스트 */}
                <div style={{ padding:"0 10px 14px" }}>
                  {rankData.map((item, i) => (
                    <div key={item.name} className="rank-row"
                      onClick={() => window.open(item.url,"_blank","noopener,noreferrer")}
                      style={{ padding:"9px 8px", borderRadius:10, marginBottom:4, background:"transparent" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:6 }}>
                        <span style={{ fontSize:i<3?16:13, width:22, textAlign:"center", flexShrink:0, fontWeight:900 }}>
                          {i<3 ? MEDAL[i] : <span style={{ color:"var(--muted-foreground)", fontSize:11 }}>#{item.rank}</span>}
                        </span>
                        <span style={{ fontSize:12, fontWeight:700, color:"var(--foreground)", flex:1 }}>{item.name}</span>
                        <span style={{ fontSize:10, fontWeight:800, color:item.color }}>{item.score}</span>
                        <ArrowUpRight style={{ width:10, height:10, color:"var(--muted-foreground)", opacity:.5 }} />
                      </div>
                      <div style={{ paddingLeft:31 }}>
                        <div style={{ fontSize:9, color:"var(--muted-foreground)", marginBottom:5 }}>{item.tag}</div>
                        <div style={{ height:4, background:"var(--border)", borderRadius:4, overflow:"hidden" }}>
                          <div className="rank-bar" style={{ height:"100%", borderRadius:4, background:`linear-gradient(90deg,${item.color}99,${item.color})`, width:`${item.score}%`, animationDelay:`${i*.08}s` } as any} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 하단 안내 */}
                <div style={{ margin:"0 10px 14px", padding:"10px 12px", background:"rgba(167,139,250,.08)", border:"1px solid rgba(167,139,250,.2)", borderRadius:10 }}>
                  <p style={{ fontSize:10, color:"var(--muted-foreground)", margin:0, lineHeight:1.6 }}>
                    💡 순위는 캠페인 수, 트래픽, 선정률 등을 종합한 참고 지표입니다.
                  </p>
                </div>
              </div>
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
  return (
    <>
      <style>{`
        @keyframes f-float{0%,100%{transform:translateY(0) scale(1)}25%{transform:translateY(-10px) scale(1.04)}75%{transform:translateY(-12px) scale(1.05)}}
        @keyframes f-glow{0%,100%{box-shadow:0 8px 32px rgba(234,179,8,.5)}50%{box-shadow:0 20px 60px rgba(234,179,8,.9)}}
        @keyframes f-shine{0%{transform:translateX(-150%) skewX(-20deg)}100%{transform:translateX(300%) skewX(-20deg)}}
        @keyframes f-badge{0%,100%{transform:scale(1) rotate(0deg)}33%{transform:scale(1.2) rotate(-5deg)}66%{transform:scale(1.1) rotate(5deg)}}
        @keyframes f-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
      `}</style>
      <div style={{ position:"fixed", bottom:40, right:40, zIndex:9998, width:56, height:56, borderRadius:"50%", border:"2px solid rgba(234,179,8,.6)", animation:"f-ring 2s ease-out infinite", pointerEvents:"none" }}/>
      <div style={{ position:"fixed", bottom:40, right:40, zIndex:9998, width:56, height:56, borderRadius:"50%", border:"2px solid rgba(234,179,8,.4)", animation:"f-ring 2s ease-out infinite .6s", pointerEvents:"none" }}/>
      <button onClick={() => navigate("/deploy?cheokdan=1")}
        style={{ position:"fixed", bottom:28, right:28, zIndex:9999, display:"flex", alignItems:"center", gap:9, padding:"13px 22px", borderRadius:99, background:"linear-gradient(135deg,#fbbf24,#f59e0b,#d97706,#b45309)", color:"#000", fontWeight:900, fontSize:13, border:"2px solid rgba(255,255,255,.3)", cursor:"pointer", fontFamily:"'Noto Sans KR',sans-serif", animation:"f-float 4s ease-in-out infinite, f-glow 2.5s ease-in-out infinite", overflow:"hidden" }}
        onMouseEnter={e=>{const el=e.currentTarget as HTMLButtonElement;el.style.animation="none";el.style.transform="translateY(-6px) scale(1.1)";el.style.boxShadow="0 24px 60px rgba(234,179,8,.9)";}}
        onMouseLeave={e=>{const el=e.currentTarget as HTMLButtonElement;el.style.animation="f-float 4s ease-in-out infinite, f-glow 2.5s ease-in-out infinite";el.style.transform="";el.style.boxShadow="";}}>
        <span style={{ position:"absolute", inset:0, background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,.5) 50%,transparent 70%)", animation:"f-shine 2s ease-in-out infinite", pointerEvents:"none" }}/>
        <span style={{ position:"relative", display:"flex" }}><PenLine style={{ width:15, height:15 }} /></span>
        <span style={{ position:"relative" }}>체험단 작성</span>
        <span style={{ position:"absolute", top:-8, right:-4, background:"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", fontSize:9, fontWeight:900, padding:"2px 6px", borderRadius:99, border:"2px solid #fff", boxShadow:"0 2px 8px rgba(239,68,68,.5)", animation:"f-badge 2s ease-in-out infinite" }}>NEW</span>
      </button>
    </>
  );
}
