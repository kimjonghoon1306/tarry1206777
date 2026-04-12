/**
 * BlogAuto Pro - 캠페인허브
 * 체험단 모집 정보 통합 조회 페이지
 */

import { useState, useMemo, useEffect } from "react";
import Layout from "@/components/Layout";
import { ExternalLink, RefreshCw, MapPin, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

const HOT_SITES = ["강남맛집체험단", "디너의여왕"];

const SOURCES = [
  { name: "강남맛집체험단", url: "https://gangnamfood.kr", count: 8 },
  { name: "디너의여왕", url: "https://dinnerqueen.net", count: 6 },
  { name: "파블로", url: "https://pavlovu.com", count: 12 },
  { name: "모두의체험단", url: "https://www.modan.kr", count: 9 },
  { name: "태그바이", url: "https://www.tagby.io/recruit", count: 7 },
];

const REGIONS = ["전체", "서울", "경기", "강원", "부산", "대전", "인천", "전국"];

const CAMPAIGNS = [
  { id: 1,  title: "청담 오마카세 디너 체험단",    source: "강남맛집체험단", region: "서울", tags: ["방문형","블로그","파인다이닝"], reward: "18만원 상당", deadline: 2,  rewardVal: 180000, url: "https://gangnamfood.kr" },
  { id: 2,  title: "압구정 이탈리안 레스토랑 런치", source: "강남맛집체험단", region: "서울", tags: ["방문형","인스타","맛집"],      reward: "8만원 상당",  deadline: 1,  rewardVal: 80000,  url: "https://gangnamfood.kr" },
  { id: 3,  title: "강남 루프탑 바 디너 체험",      source: "디너의여왕",    region: "서울", tags: ["방문형","블로그","다이닝"],     reward: "12만원 상당", deadline: 3,  rewardVal: 120000, url: "https://dinnerqueen.net" },
  { id: 4,  title: "신사 파스타 맛집 저녁 체험",    source: "디너의여왕",    region: "서울", tags: ["방문형","인스타","맛집"],      reward: "6만원 상당",  deadline: 5,  rewardVal: 60000,  url: "https://dinnerqueen.net" },
  { id: 5,  title: "홍대 카페 신메뉴 음료 체험단",  source: "파블로",        region: "서울", tags: ["방문형","블로그","카페"],       reward: "2만원 상당",  deadline: 4,  rewardVal: 20000,  url: "https://pavlovu.com" },
  { id: 6,  title: "판교 샐러드 전문점 체험",       source: "파블로",        region: "경기", tags: ["방문형","블로그","건강식"],     reward: "3만원 상당",  deadline: 7,  rewardVal: 30000,  url: "https://pavlovu.com" },
  { id: 7,  title: "수원 고기집 저녁 체험단",       source: "모두의체험단",  region: "경기", tags: ["방문형","블로그","맛집"],      reward: "4만원 상당",  deadline: 6,  rewardVal: 40000,  url: "https://www.modan.kr" },
  { id: 8,  title: "강릉 오션뷰 카페 베이커리",     source: "파블로",        region: "강원", tags: ["방문형","인스타","카페"],       reward: "3만원 상당",  deadline: 9,  rewardVal: 30000,  url: "https://pavlovu.com" },
  { id: 9,  title: "속초 해산물 맛집 2인 코스",     source: "태그바이",      region: "강원", tags: ["방문형","블로그","맛집"],      reward: "6만원 상당",  deadline: 11, rewardVal: 60000,  url: "https://www.tagby.io/recruit" },
  { id: 10, title: "해운대 스파 & 마사지 체험",     source: "태그바이",      region: "부산", tags: ["방문형","인스타","뷰티"],      reward: "12만원 상당", deadline: 3,  rewardVal: 120000, url: "https://www.tagby.io/recruit" },
  { id: 11, title: "홈케어 스킨케어 세트 배송",     source: "모두의체험단",  region: "전국", tags: ["배송형","블로그","뷰티"],      reward: "상품 제공",   deadline: 14, rewardVal: 50000,  url: "https://www.modan.kr" },
  { id: 12, title: "건강식 도시락 구독 체험",       source: "파블로",        region: "전국", tags: ["배송형","유튜브","푸드"],       reward: "15만원 상당", deadline: 2,  rewardVal: 150000, url: "https://pavlovu.com" },
];

const CSS = `
@keyframes fadeUp {
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes shimmer {
  0%,100% { opacity:1; }
  50%      { opacity:0.55; }
}
@keyframes pinkGlow {
  0%,100% { box-shadow:0 0 0 0 rgba(236,72,153,0); }
  50%      { box-shadow:0 0 14px 3px rgba(236,72,153,0.28); }
}
.ch-card { animation:fadeUp 0.42s ease both; transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s; }
.ch-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.22); }
.ch-hot  { animation:pinkGlow 3s ease-in-out infinite, fadeUp 0.42s ease both; transition:transform 0.2s,box-shadow 0.2s; }
.ch-hot:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(236,72,153,0.22); }
.ch-src  { transition:all 0.18s; cursor:pointer; }
.ch-src:hover { transform:translateY(-1px); }
.ch-rtab { transition:all 0.15s; }
.ch-apply { transition:all 0.18s; }
.ch-apply:hover { transform:scale(1.05); opacity:0.92; }
`;

export default function CampaignPage() {
  const [region, setRegion] = useState("전체");
  const [sort, setSort]     = useState("deadline");
  const [ready, setReady]   = useState(false);

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  const list = useMemo(() => {
    let data = region === "전체" ? [...CAMPAIGNS] : CAMPAIGNS.filter(c => c.region === region);
    if (sort === "deadline") data.sort((a, b) => a.deadline - b.deadline);
    if (sort === "reward")   data.sort((a, b) => b.rewardVal - a.rewardVal);
    return data;
  }, [region, sort]);

  const handleApply = (url: string, title: string) => {
    toast.success(`신청 페이지로 이동합니다`, { description: title, duration: 1800 });
    setTimeout(() => window.open(url, "_blank"), 450);
  };

  const handleRefresh = () => {
    toast.loading("캠페인 최신화 중...", { id: "ref" });
    setTimeout(() => toast.success("업데이트 완료!", { id: "ref" }), 1800);
  };

  return (
    <Layout>
      <style>{CSS}</style>
      <div style={{
        padding: "28px 28px 48px",
        opacity: ready ? 1 : 0,
        transform: ready ? "none" : "translateY(10px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>

        {/* ── 헤더 ── */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
              <div style={{
                background:"linear-gradient(135deg,#be185d,#ec4899)",
                borderRadius:"10px", padding:"8px",
                display:"flex", alignItems:"center", justifyContent:"center",
                animation:"pinkGlow 3s ease-in-out infinite",
              }}>
                <Sparkles style={{ width:18, height:18, color:"#fff" }} />
              </div>
              <h1 style={{ fontSize:"22px", fontWeight:700, margin:0, color:"var(--foreground)" }}>체험단 허브</h1>
              <span style={{
                fontSize:"11px", padding:"3px 10px", borderRadius:"20px",
                background:"rgba(236,72,153,0.12)", color:"#f472b6",
                border:"1px solid rgba(236,72,153,0.3)",
                animation:"shimmer 2.5s ease-in-out infinite",
              }}>실시간 수집</span>
            </div>
            <p style={{ fontSize:"13px", color:"var(--muted-foreground)", margin:0 }}>
              주요 체험단 사이트의 모집 공고를 한 곳에서 확인하고 신청하세요
            </p>
          </div>

          <button
            onClick={handleRefresh}
            style={{
              display:"flex", alignItems:"center", gap:"6px",
              fontSize:"12px", padding:"8px 16px", borderRadius:"8px", cursor:"pointer",
              background:"rgba(236,72,153,0.1)", color:"#f472b6",
              border:"1px solid rgba(236,72,153,0.3)", transition:"all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,72,153,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(236,72,153,0.1)"; }}
          >
            <RefreshCw style={{ width:13, height:13 }} /> 새로고침 (관리자)
          </button>
        </div>

        {/* ── 수집 사이트 칩 ── */}
        <div style={{ marginBottom:"20px" }}>
          <div style={{ fontSize:"10px", color:"var(--muted-foreground)", letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"10px" }}>수집 사이트</div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {SOURCES.map(s => {
              const hot = HOT_SITES.includes(s.name);
              return (
                <div key={s.name} className="ch-src"
                  onClick={() => window.open(s.url, "_blank")}
                  style={{
                    display:"flex", alignItems:"center", gap:"7px",
                    background: hot ? "rgba(236,72,153,0.08)" : "var(--muted)",
                    border:`1px solid ${hot ? "rgba(236,72,153,0.35)" : "var(--border)"}`,
                    borderRadius:"8px", padding:"7px 13px", fontSize:"12px",
                  }}
                >
                  <div style={{ width:6, height:6, borderRadius:"50%", background: hot ? "#ec4899" : "var(--color-emerald)" }} />
                  <span style={{ color: hot ? "#f472b6" : "var(--foreground)", fontWeight:500 }}>{s.name}</span>
                  {hot && <span style={{ fontSize:"9px", background:"#ec4899", color:"#fff", padding:"2px 5px", borderRadius:"3px", fontWeight:700 }}>추천</span>}
                  <span style={{ fontSize:"11px", color: hot ? "#f472b6" : "var(--color-emerald)" }}>{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 통계 ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"20px" }}>
          {[
            { label:"전체 캠페인", val: list.length,                              sub:"수집된 공고",  color:"var(--color-emerald)" },
            { label:"마감 임박",   val: list.filter(c=>c.deadline<=3).length,      sub:"3일 이내",    color:"#f97316" },
            { label:"추천 사이트", val:"강남맛집 · 디너의여왕",                    sub:"선정률 높음", color:"#f472b6" },
          ].map((s, i) => (
            <div key={i} style={{
              background:"var(--muted)", border:"1px solid var(--border)",
              borderRadius:"10px", padding:"14px 16px",
              animation:`fadeUp 0.4s ${i*0.08}s ease both`,
            }}>
              <div style={{ fontSize:"10px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"5px" }}>{s.label}</div>
              <div style={{ fontSize: typeof s.val==="number" ? "24px":"14px", fontWeight:700, color:s.color, lineHeight:1.2 }}>{s.val}</div>
              <div style={{ fontSize:"11px", color:"var(--muted-foreground)", marginTop:"3px" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── 필터 + 정렬 ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {REGIONS.map(r => (
              <button key={r} className="ch-rtab" onClick={() => setRegion(r)} style={{
                background: r===region ? "linear-gradient(90deg,#be185d,#ec4899)" : "transparent",
                border:`1px solid ${r===region ? "#ec4899" : "var(--border)"}`,
                color: r===region ? "#fff" : "var(--muted-foreground)",
                fontSize:"12px", padding:"6px 14px", borderRadius:"20px", cursor:"pointer",
                fontWeight: r===region ? 600 : 400,
              }}>{r}</button>
            ))}
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{
            background:"var(--muted)", border:"1px solid var(--border)",
            color:"var(--foreground)", fontSize:"12px",
            padding:"6px 12px", borderRadius:"8px", cursor:"pointer",
          }}>
            <option value="deadline">마감 임박순</option>
            <option value="reward">혜택 높은순</option>
          </select>
        </div>

        {/* ── 섹션 라벨 ── */}
        <div style={{ fontSize:"11px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"14px" }}>
          {region==="전체" ? "전체 캠페인" : `${region} 지역 캠페인`} ({list.length})
        </div>

        {/* ── 카드 그리드 ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(256px,1fr))", gap:"14px" }}>
          {list.map((c, idx) => {
            const hot    = HOT_SITES.includes(c.source);
            const urgent = c.deadline <= 3;
            return (
              <div key={c.id} className={hot ? "ch-hot" : "ch-card"}
                style={{
                  background:"var(--muted)",
                  border:`1px solid ${hot ? "rgba(236,72,153,0.35)" : "var(--border)"}`,
                  borderRadius:"12px", padding:"16px",
                  animationDelay:`${idx*0.05}s`,
                  position:"relative", overflow:"hidden",
                }}
              >
                {/* 상단 바 */}
                <div style={{
                  position:"absolute", top:0, left:0, right:0, height:"2px",
                  background: hot
                    ? "linear-gradient(90deg,#be185d,#ec4899)"
                    : "linear-gradient(90deg,var(--color-emerald),#34d399)",
                }} />

                {/* 소스 + 지역 */}
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px", marginTop:"4px" }}>
                  <span style={{
                    fontSize:"10px", padding:"2px 8px", borderRadius:"4px",
                    background: hot ? "rgba(236,72,153,0.12)" : "var(--background)",
                    color: hot ? "#f472b6" : "var(--muted-foreground)",
                    border:`1px solid ${hot ? "rgba(236,72,153,0.3)" : "var(--border)"}`,
                  }}>{c.source}{hot ? " ✓" : ""}</span>
                  <span style={{
                    fontSize:"10px", padding:"2px 8px", borderRadius:"4px",
                    background:"rgba(16,185,129,0.1)", color:"var(--color-emerald)",
                    border:"1px solid rgba(16,185,129,0.2)",
                    display:"flex", alignItems:"center", gap:"3px",
                  }}><MapPin style={{ width:9, height:9 }}/>{c.region}</span>
                </div>

                {/* 제목 */}
                <div style={{ fontSize:"14px", fontWeight:600, color:"var(--foreground)", marginBottom:"10px", lineHeight:1.4 }}>{c.title}</div>

                {/* 태그 */}
                <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"12px" }}>
                  {c.tags.map(t => (
                    <span key={t} style={{
                      fontSize:"10px", padding:"2px 7px", borderRadius:"4px",
                      background:"var(--background)", color:"var(--muted-foreground)",
                      border:"1px solid var(--border)",
                    }}>{t}</span>
                  ))}
                </div>

                {/* 푸터 */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"10px", borderTop:"1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize:"12px", fontWeight:500, color:"var(--foreground)" }}>{c.reward}</div>
                    <div style={{ fontSize:"10px", marginTop:"2px", color: urgent ? "#f97316" : "var(--muted-foreground)", display:"flex", alignItems:"center", gap:"3px" }}>
                      <Clock style={{ width:9, height:9 }}/>
                      {urgent ? `D-${c.deadline} 마감 임박` : `D-${c.deadline}`}
                    </div>
                  </div>
                  <button className="ch-apply" onClick={() => handleApply(c.url, c.title)} style={{
                    display:"flex", alignItems:"center", gap:"5px",
                    fontSize:"12px", fontWeight:600, color:"#fff",
                    background: hot
                      ? "linear-gradient(90deg,#be185d,#ec4899)"
                      : "linear-gradient(90deg,var(--color-emerald),#34d399)",
                    border:"none", padding:"7px 14px", borderRadius:"7px", cursor:"pointer",
                  }}>
                    신청 <ExternalLink style={{ width:11, height:11 }}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {list.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px", color:"var(--muted-foreground)", fontSize:"14px" }}>
            해당 지역의 캠페인이 없습니다
          </div>
        )}
      </div>
    </Layout>
  );
}
