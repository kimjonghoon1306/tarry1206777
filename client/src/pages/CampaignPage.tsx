/**
 * BlogAuto Pro - 체험단 허브
 * 강남맛집체험단 + 디너의여왕 집중
 */

import { useState, useMemo, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { ExternalLink, MapPin, Clock, Flame, RefreshCw, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const SOURCES = [
  { name: "강남맛집체험단", key: "gangnam",     url: "https://강남맛집.net",    color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.25)", label: "맛집 전문" },
  { name: "디너의여왕",     key: "dinnerqueen", url: "https://dinnerqueen.net", color: "#ec4899", bg: "rgba(236,72,153,0.08)",  border: "rgba(236,72,153,0.25)", label: "다이닝 특화" },
];

const FALLBACK: any[] = [
  { id:"f1", title:"청담 오마카세 디너 체험단",    source:"강남맛집체험단", region:"서울", reward:"18만원 상당", deadline:2,  rewardVal:180000, url:"https://강남맛집.net/cp/?id=1" },
  { id:"f2", title:"압구정 이탈리안 레스토랑 런치", source:"강남맛집체험단", region:"서울", reward:"8만원 상당",  deadline:5,  rewardVal:80000,  url:"https://강남맛집.net/cp/?id=2" },
  { id:"f3", title:"강남 루프탑 바 디너 체험",      source:"강남맛집체험단", region:"서울", reward:"12만원 상당", deadline:3,  rewardVal:120000, url:"https://강남맛집.net/cp/?id=3" },
  { id:"f4", title:"강남 루프탑 바 디너 체험",      source:"디너의여왕",    region:"서울", reward:"12만원 상당", deadline:3,  rewardVal:120000, url:"https://dinnerqueen.net/taste/1" },
  { id:"f5", title:"신사 파스타 맛집 저녁 체험",    source:"디너의여왕",    region:"서울", reward:"6만원 상당",  deadline:7,  rewardVal:60000,  url:"https://dinnerqueen.net/taste/2" },
  { id:"f6", title:"홍대 파인다이닝 코스 체험",     source:"디너의여왕",    region:"서울", reward:"15만원 상당", deadline:4,  rewardVal:150000, url:"https://dinnerqueen.net/taste/3" },
];

const REGIONS = ["전체","서울","경기","강원","부산","인천","전국"];

const CSS = `
@keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes glow    { 0%,100%{opacity:1} 50%{opacity:0.6} }
@keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
.ch-card  { animation:fadeUp 0.35s ease both; transition:transform 0.2s,box-shadow 0.2s,border-color 0.2s; }
.ch-card:hover { transform:translateY(-3px); }
.ch-btn   { transition:all 0.15s; }
.ch-btn:hover { opacity:0.88; transform:scale(1.03); }
.ch-tab   { transition:all 0.15s; }
.ch-rtab  { transition:all 0.15s; }
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
    setTimeout(() => setReady(true), 80);
    fetchData();
    timer.current = setInterval(() => fetchData(true), 45 * 60 * 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);

  async function fetchData(silent = false) {
    if (!silent) setLoading(true);
    const { list, updatedAt: ts } = await loadFromServer();
    setCampaigns(list);
    if (ts) setUpdatedAt(ts);
    if (!silent) setLoading(false);
  }

  const fmtDate = (ts: string | null) => {
    if (!ts) return "";
    try { return new Date(ts).toLocaleString("ko-KR", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return ""; }
  };

  const filtered = useMemo(() => {
    // 두 사이트만 필터
    const srcNames = SOURCES.map(s => s.name);
    let data = campaigns.filter(c => srcNames.includes(c.source));
    if (region !== "전체") data = data.filter(c => c.region === region);
    return data;
  }, [region, campaigns]);

  const grouped = useMemo(() => {
    return SOURCES.map(src => {
      let items = filtered.filter(c => c.source === src.name);
      if (sort === "deadline") items = [...items].sort((a, b) => a.deadline - b.deadline);
      if (sort === "reward")   items = [...items].sort((a, b) => b.rewardVal - a.rewardVal);
      return { ...src, items };
    });
  }, [filtered, sort]);

  const totalCount  = filtered.length;
  const urgentCount = filtered.filter(c => c.deadline <= 3).length;

  const handleApply = (url: string, title: string) => {
    toast.success("공고 페이지로 이동합니다", { description: title, duration: 1500 });
    setTimeout(() => window.open(url, "_blank"), 400);
  };

  return (
    <Layout>
      <style>{CSS}</style>
      <div style={{ padding:"28px 28px 60px", opacity:ready?1:0, transition:"opacity 0.4s" }}>

        {/* ── 헤더 ── */}
        <div style={{ marginBottom:"28px", animation:"fadeUp 0.4s ease both" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"12px" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                <div style={{ background:"linear-gradient(135deg,#f97316,#ec4899)", borderRadius:"10px", padding:"8px", display:"flex" }}>
                  <Flame style={{ width:16, height:16, color:"#fff" }} />
                </div>
                <h1 style={{ fontSize:"22px", fontWeight:800, margin:0, color:"var(--foreground)", letterSpacing:"-0.03em" }}>체험단 허브</h1>
                <span style={{ fontSize:"10px", padding:"2px 9px", borderRadius:"20px", background:"rgba(249,115,22,0.1)", color:"#f97316", border:"1px solid rgba(249,115,22,0.3)", fontWeight:600, animation:"glow 2.5s ease-in-out infinite" }}>LIVE</span>
              </div>
              <p style={{ fontSize:"12px", color:"var(--muted-foreground)", margin:0 }}>
                강남맛집체험단 · 디너의여왕 엄선 공고 모음
              </p>
              {updatedAt && (
                <p style={{ fontSize:"11px", color:"var(--muted-foreground)", margin:"3px 0 0", opacity:0.5 }}>
                  업데이트: {fmtDate(updatedAt)}
                </p>
              )}
            </div>
            <button onClick={() => fetchData()} disabled={loading} className="ch-btn"
              style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 16px", borderRadius:"8px", background:"var(--muted)", border:"1px solid var(--border)", color:"var(--muted-foreground)", cursor:"pointer" }}>
              <RefreshCw style={{ width:12, height:12, animation:loading?"glow 0.8s linear infinite":"none" }} />
              {loading ? "수집 중..." : "새로고침"}
            </button>
          </div>
        </div>

        {/* ── 사이트 카드 ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"12px", marginBottom:"24px" }}>
          {SOURCES.map((src, i) => (
            <div key={src.name} onClick={() => window.open(src.url, "_blank")}
              style={{ background:src.bg, border:`1px solid ${src.border}`, borderRadius:"12px", padding:"16px 20px", cursor:"pointer", animation:`fadeUp 0.4s ${i*0.08}s ease both`, transition:"transform 0.15s,opacity 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:700, color:src.color, marginBottom:"3px" }}>{src.name}</div>
                  <div style={{ fontSize:"11px", color:"var(--muted-foreground)" }}>{src.label}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:"22px", fontWeight:800, color:src.color }}>
                    {grouped.find(g => g.key === src.key)?.items.length || 0}
                  </div>
                  <div style={{ fontSize:"10px", color:"var(--muted-foreground)" }}>공고</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 통계 ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"24px" }}>
          {[
            { label:"전체 공고",  val:totalCount,   color:"var(--foreground)" },
            { label:"마감 임박",  val:urgentCount,  color:"#f97316" },
            { label:"혜택 합계",  val:filtered.reduce((s,c) => s + (c.rewardVal||0), 0) > 0
                ? `${Math.round(filtered.reduce((s,c) => s+(c.rewardVal||0),0)/10000)}만원+`
                : "-",
              color:"#ec4899" },
          ].map((s, i) => (
            <div key={i} style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"10px", padding:"12px 16px", animation:`fadeUp 0.4s ${0.1+i*0.06}s ease both` }}>
              <div style={{ fontSize:"10px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"4px" }}>{s.label}</div>
              <div style={{ fontSize:"20px", fontWeight:700, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* ── 필터 ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px", flexWrap:"wrap", gap:"10px" }}>
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
            {REGIONS.map(r => (
              <button key={r} className="ch-rtab" onClick={() => setRegion(r)}
                style={{ fontSize:"12px", padding:"5px 13px", borderRadius:"20px", cursor:"pointer", fontWeight:r===region?600:400,
                  background:r===region?"linear-gradient(90deg,#f97316,#ec4899)":"transparent",
                  border:`1px solid ${r===region?"transparent":"var(--border)"}`,
                  color:r===region?"#fff":"var(--muted-foreground)" }}>
                {r}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:"5px" }}>
            {[{k:"latest",label:"최신순"},{k:"deadline",label:"마감순"},{k:"reward",label:"혜택순"}].map(s => (
              <button key={s.k} className="ch-rtab" onClick={() => setSort(s.k as any)}
                style={{ fontSize:"11px", padding:"5px 11px", borderRadius:"7px", cursor:"pointer",
                  background:sort===s.k?"var(--foreground)":"transparent",
                  border:`1px solid ${sort===s.k?"var(--foreground)":"var(--border)"}`,
                  color:sort===s.k?"var(--background)":"var(--muted-foreground)",
                  fontWeight:sort===s.k?600:400 }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 회사별 섹션 ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"32px" }}>
          {grouped.map((src, si) => (
            <div key={src.name} style={{ animation:`fadeUp 0.4s ${si*0.1}s ease both` }}>

              {/* 섹션 헤더 */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ width:3, height:22, borderRadius:"2px", background:src.color }} />
                  <span style={{ fontSize:"16px", fontWeight:700, color:"var(--foreground)" }}>{src.name}</span>
                  <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"20px", background:src.bg, color:src.color, border:`1px solid ${src.border}`, fontWeight:600 }}>
                    {src.items.length}개
                  </span>
                </div>
                <button className="ch-btn" onClick={() => window.open(src.url, "_blank")}
                  style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", color:src.color, background:"transparent", border:`1px solid ${src.border}`, padding:"4px 10px", borderRadius:"6px", cursor:"pointer" }}>
                  전체보기 <ChevronRight style={{ width:11, height:11 }} />
                </button>
              </div>

              {src.items.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px", background:"var(--muted)", borderRadius:"10px", border:"1px solid var(--border)", fontSize:"13px", color:"var(--muted-foreground)" }}>
                  해당 조건의 공고가 없습니다
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"12px" }}>
                  {src.items.map((c: any, idx: number) => {
                    const urgent = c.deadline <= 3;
                    return (
                      <div key={String(c.id)} className="ch-card"
                        style={{ background:"var(--muted)", border:`1px solid ${urgent ? src.border : "var(--border)"}`, borderRadius:"12px", padding:"16px", animationDelay:`${idx*0.05}s`, position:"relative", overflow:"hidden" }}>

                        {/* 상단 라인 */}
                        <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:`linear-gradient(90deg,${src.color},${src.color}88)` }} />

                        {/* 지역 + 마감 */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px", marginTop:"4px" }}>
                          <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"4px", background:"var(--background)", color:"var(--muted-foreground)", border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"3px" }}>
                            <MapPin style={{ width:8, height:8 }} />{c.region || "전국"}
                          </span>
                          <span style={{ fontSize:"10px", fontWeight:600, color:urgent?"#f97316":"var(--muted-foreground)", display:"flex", alignItems:"center", gap:"3px" }}>
                            <Clock style={{ width:9, height:9 }} />
                            {urgent ? `D-${c.deadline} 임박` : `D-${c.deadline}`}
                          </span>
                        </div>

                        {/* 제목 */}
                        <div style={{ fontSize:"13px", fontWeight:600, color:"var(--foreground)", marginBottom:"12px", lineHeight:1.45, minHeight:"38px" }}>
                          {c.title}
                        </div>

                        {/* 하단 */}
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"10px", borderTop:"1px solid var(--border)" }}>
                          <div style={{ fontSize:"12px", fontWeight:600, color:src.color }}>
                            {c.reward || "정보 확인 필요"}
                          </div>
                          <button className="ch-btn" onClick={() => handleApply(c.url, c.title)}
                            style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", fontWeight:700, color:"#fff", background:src.color, border:"none", padding:"7px 13px", borderRadius:"7px", cursor:"pointer" }}>
                            신청 <ExternalLink style={{ width:10, height:10 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}
