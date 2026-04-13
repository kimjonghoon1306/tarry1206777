/**
 * BlogAuto Pro - 체험단 허브
 * 기본: 회사별 섹션 + 업데이트순
 * 지역 탭: 해당 지역 회사별 섹션
 * 정렬: 각 섹션 안에서 최신순/마감임박순
 */

import { useState, useMemo, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { ExternalLink, MapPin, Clock, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const SOURCES = [
  { name: "강남맛집체험단", url: "https://강남맛집.net",         color: "#ec4899", hot: true  },
  { name: "디너의여왕",     url: "https://dinnerqueen.net",      color: "#f97316", hot: true  },
  { name: "파블로",         url: "https://pavlovu.com",          color: "#10b981", hot: false },
  { name: "모두의체험단",   url: "https://www.modan.kr",         color: "#6366f1", hot: false },
  { name: "태그바이",       url: "https://www.tagby.io/recruit", color: "#0ea5e9", hot: false },
];

const FALLBACK = [
  { id:"f1",  title:"청담 오마카세 디너 체험단",    source:"강남맛집체험단", region:"서울", tags:["방문형","블로그"], reward:"18만원 상당", deadline:2,  rewardVal:180000, url:"https://강남맛집.net"         },
  { id:"f2",  title:"압구정 이탈리안 레스토랑 런치", source:"강남맛집체험단", region:"서울", tags:["방문형","인스타"], reward:"8만원 상당",  deadline:5,  rewardVal:80000,  url:"https://강남맛집.net"         },
  { id:"f3",  title:"강남 루프탑 바 디너 체험",      source:"디너의여왕",    region:"서울", tags:["방문형","블로그"], reward:"12만원 상당", deadline:3,  rewardVal:120000, url:"https://dinnerqueen.net"      },
  { id:"f4",  title:"신사 파스타 맛집 저녁 체험",    source:"디너의여왕",    region:"서울", tags:["방문형","인스타"], reward:"6만원 상당",  deadline:7,  rewardVal:60000,  url:"https://dinnerqueen.net"      },
  { id:"f5",  title:"홍대 카페 신메뉴 음료 체험단",  source:"파블로",        region:"서울", tags:["방문형","카페"],   reward:"2만원 상당",  deadline:4,  rewardVal:20000,  url:"https://pavlovu.com"          },
  { id:"f6",  title:"판교 샐러드 전문점 체험",       source:"파블로",        region:"경기", tags:["방문형","블로그"], reward:"3만원 상당",  deadline:7,  rewardVal:30000,  url:"https://pavlovu.com"          },
  { id:"f7",  title:"수원 고기집 저녁 체험단",       source:"모두의체험단",  region:"경기", tags:["방문형","블로그"], reward:"4만원 상당",  deadline:6,  rewardVal:40000,  url:"https://www.modan.kr"         },
  { id:"f8",  title:"속초 해산물 맛집 2인 코스",     source:"태그바이",      region:"강원", tags:["방문형","블로그"], reward:"6만원 상당",  deadline:11, rewardVal:60000,  url:"https://www.tagby.io/recruit" },
  { id:"f9",  title:"해운대 스파 & 마사지 체험",     source:"태그바이",      region:"부산", tags:["방문형","인스타"], reward:"12만원 상당", deadline:3,  rewardVal:120000, url:"https://www.tagby.io/recruit" },
  { id:"f10", title:"홈케어 스킨케어 세트 배송",     source:"모두의체험단",  region:"전국", tags:["배송형","블로그"], reward:"상품 제공",   deadline:14, rewardVal:50000,  url:"https://www.modan.kr"         },
];

const REGIONS = ["전체","서울","경기","강원","부산","대전","인천","전국"];

const CSS = `
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
.ch-card { animation:fadeUp 0.35s ease both; transition:transform 0.18s,box-shadow 0.18s; }
.ch-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.2); }
.ch-btn  { transition:opacity 0.15s,transform 0.15s; }
.ch-btn:hover  { opacity:0.85; transform:scale(1.04); }
.ch-rtab { transition:all 0.15s; }
.ch-src  { transition:all 0.15s; cursor:pointer; }
.ch-src:hover  { opacity:0.8; transform:translateY(-1px); }
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
  const [sort, setSort]           = useState<"deadline"|"latest">("latest");
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
    setCampaigns(list);
    if (ts) setUpdatedAt(ts);
    if (!silent) setLoading(false);
  }

  const fmtDate = (ts: string | null) => {
    if (!ts) return "";
    try { return new Date(ts).toLocaleString("ko-KR", { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return ""; }
  };

  // 지역 필터 적용
  const filtered = useMemo(() => {
    return region === "전체" ? campaigns : campaigns.filter(c => c.region === region);
  }, [region, campaigns]);

  // 회사별로 그룹핑 + 정렬
  const grouped = useMemo(() => {
    return SOURCES.map(src => {
      let items = filtered.filter(c => c.source === src.name);
      if (sort === "deadline") items = [...items].sort((a, b) => a.deadline - b.deadline);
      if (sort === "latest")   items = [...items]; // 서버에서 온 순서 = 업데이트순
      return { ...src, items };
    }).filter(g => g.items.length > 0);
  }, [filtered, sort]);

  const totalCount = filtered.length;
  const urgentCount = filtered.filter(c => c.deadline <= 3).length;

  const handleApply = (url: string, title: string) => {
    toast.success("신청 페이지로 이동합니다", { description: title, duration: 1800 });
    setTimeout(() => window.open(url, "_blank"), 450);
  };

  return (
    <Layout>
      <style>{CSS}</style>
      <div style={{ padding:"24px 28px 60px", opacity:ready?1:0, transform:ready?"none":"translateY(8px)", transition:"opacity 0.45s,transform 0.45s" }}>

        {/* ── 헤더 ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"5px" }}>
              <div style={{ background:"linear-gradient(135deg,#be185d,#ec4899)", borderRadius:"9px", padding:"7px", display:"flex" }}>
                <Sparkles style={{ width:16, height:16, color:"#fff" }} />
              </div>
              <h1 style={{ fontSize:"21px", fontWeight:700, margin:0, color:"var(--foreground)" }}>체험단 허브</h1>
              <span style={{ fontSize:"10px", padding:"2px 9px", borderRadius:"20px", background:"rgba(236,72,153,0.1)", color:"#f472b6", border:"1px solid rgba(236,72,153,0.25)", animation:"pulse 2.5s ease-in-out infinite" }}>실시간 수집</span>
            </div>
            <p style={{ fontSize:"12px", color:"var(--muted-foreground)", margin:0 }}>
              주요 체험단 사이트 모집 공고를 한 곳에서 확인하세요
            </p>
            {updatedAt && (
              <p style={{ fontSize:"11px", color:"var(--muted-foreground)", margin:"3px 0 0", opacity:0.55 }}>
                마지막 업데이트: {fmtDate(updatedAt)}
              </p>
            )}
          </div>

          {/* 새로고침 */}
          <button onClick={() => fetchData()} disabled={loading} className="ch-btn"
            style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", padding:"8px 14px", borderRadius:"8px", background:"var(--muted)", border:"1px solid var(--border)", color:"var(--foreground)", cursor:"pointer" }}>
            <RefreshCw style={{ width:13, height:13, animation:loading?"pulse 1s linear infinite":"none" }} />
            {loading ? "수집 중..." : "새로고침"}
          </button>
        </div>

        {/* ── 요약 카드 ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"22px" }}>
          {[
            { label:"전체 공고",   val:totalCount,       color:"var(--color-emerald)", sub:"수집된 캠페인"  },
            { label:"마감 임박",   val:urgentCount,      color:"#f97316",              sub:"3일 이내 마감"  },
            { label:"수집 사이트", val:SOURCES.length,   color:"#6366f1",              sub:"자동 갱신 중"   },
          ].map((s, i) => (
            <div key={i} style={{ background:"var(--muted)", border:"1px solid var(--border)", borderRadius:"10px", padding:"13px 16px", animation:`fadeUp 0.4s ${i*0.07}s ease both` }}>
              <div style={{ fontSize:"10px", color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"4px" }}>{s.label}</div>
              <div style={{ fontSize:"22px", fontWeight:700, color:s.color, lineHeight:1.2 }}>{s.val}</div>
              <div style={{ fontSize:"10px", color:"var(--muted-foreground)", marginTop:"2px" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── 필터 바 ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"22px", flexWrap:"wrap", gap:"10px" }}>
          {/* 지역 탭 */}
          <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
            {REGIONS.map(r => (
              <button key={r} className="ch-rtab" onClick={() => setRegion(r)}
                style={{ background:r===region?"linear-gradient(90deg,#be185d,#ec4899)":"transparent", border:`1px solid ${r===region?"#ec4899":"var(--border)"}`, color:r===region?"#fff":"var(--muted-foreground)", fontSize:"12px", padding:"5px 13px", borderRadius:"20px", cursor:"pointer", fontWeight:r===region?600:400 }}>
                {r}
              </button>
            ))}
          </div>

          {/* 정렬 */}
          <div style={{ display:"flex", gap:"6px" }}>
            {[
              { key:"latest",   label:"최신순"   },
              { key:"deadline", label:"마감임박순" },
            ].map(s => (
              <button key={s.key} className="ch-rtab" onClick={() => setSort(s.key as any)}
                style={{ background:sort===s.key?"var(--foreground)":"transparent", border:`1px solid ${sort===s.key?"var(--foreground)":"var(--border)"}`, color:sort===s.key?"var(--background)":"var(--muted-foreground)", fontSize:"12px", padding:"5px 13px", borderRadius:"8px", cursor:"pointer", fontWeight:sort===s.key?600:400 }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 회사별 섹션 ── */}
        {grouped.length === 0 && !loading && (
          <div style={{ textAlign:"center", padding:"60px", color:"var(--muted-foreground)", fontSize:"14px" }}>
            해당 지역의 캠페인이 없습니다
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:"28px" }}>
          {grouped.map((src, si) => (
            <div key={src.name} style={{ animation:`fadeUp 0.4s ${si*0.08}s ease both` }}>

              {/* 섹션 헤더 */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px", paddingBottom:"10px", borderBottom:`2px solid ${src.color}22` }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:src.color, boxShadow:`0 0 8px ${src.color}88` }} />
                  <span style={{ fontSize:"15px", fontWeight:700, color:"var(--foreground)" }}>{src.name}</span>
                  {src.hot && (
                    <span style={{ fontSize:"9px", background:src.color, color:"#fff", padding:"2px 6px", borderRadius:"4px", fontWeight:700 }}>추천</span>
                  )}
                  <span style={{ fontSize:"11px", color:"var(--muted-foreground)" }}>{src.items.length}개</span>
                </div>
                <button className="ch-src" onClick={() => window.open(src.url, "_blank")}
                  style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:src.color, background:"transparent", border:`1px solid ${src.color}44`, padding:"4px 10px", borderRadius:"6px" }}>
                  사이트 방문 <ExternalLink style={{ width:10, height:10 }} />
                </button>
              </div>

              {/* 카드 그리드 */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:"12px" }}>
                {src.items.map((c: any, idx: number) => {
                  const urgent = c.deadline <= 3;
                  return (
                    <div key={String(c.id)} className="ch-card"
                      style={{ background:"var(--muted)", border:`1px solid var(--border)`, borderRadius:"10px", padding:"14px", animationDelay:`${idx*0.04}s`, position:"relative", overflow:"hidden" }}>

                      {/* 상단 컬러 바 */}
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:src.color }} />

                      {/* 지역 태그 */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px", marginTop:"4px" }}>
                        <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"4px", background:"rgba(16,185,129,0.08)", color:"var(--color-emerald)", border:"1px solid rgba(16,185,129,0.2)", display:"flex", alignItems:"center", gap:"3px" }}>
                          <MapPin style={{ width:8, height:8 }} />{c.region}
                        </span>
                        {urgent && (
                          <span style={{ fontSize:"10px", color:"#f97316", fontWeight:600, display:"flex", alignItems:"center", gap:"3px" }}>
                            <Clock style={{ width:9, height:9 }} />D-{c.deadline}
                          </span>
                        )}
                      </div>

                      {/* 제목 */}
                      <div style={{ fontSize:"13px", fontWeight:600, color:"var(--foreground)", marginBottom:"8px", lineHeight:1.4, minHeight:"36px" }}>
                        {c.title}
                      </div>

                      {/* 태그 */}
                      {c.tags?.length > 0 && (
                        <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"10px" }}>
                          {c.tags.slice(0,3).map((t: string) => (
                            <span key={t} style={{ fontSize:"10px", padding:"2px 6px", borderRadius:"4px", background:"var(--background)", color:"var(--muted-foreground)", border:"1px solid var(--border)" }}>{t}</span>
                          ))}
                        </div>
                      )}

                      {/* 하단 */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"10px", borderTop:"1px solid var(--border)" }}>
                        <div>
                          <div style={{ fontSize:"12px", fontWeight:600, color:"var(--foreground)" }}>{c.reward}</div>
                          {!urgent && (
                            <div style={{ fontSize:"10px", color:"var(--muted-foreground)", marginTop:"1px" }}>D-{c.deadline}</div>
                          )}
                        </div>
                        <button className="ch-btn" onClick={() => handleApply(c.url, c.title)}
                          style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", fontWeight:600, color:"#fff", background:src.color, border:"none", padding:"6px 12px", borderRadius:"6px", cursor:"pointer" }}>
                          신청 <ExternalLink style={{ width:10, height:10 }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}
