import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Search, TrendingUp, TrendingDown, RefreshCw,
  Download, Star, StarOff, Zap, ArrowUpDown,
  Sparkles, ArrowRight, X, Trash2, Bot, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getContentProvider, getAPIKey } from "@/lib/ai-config";

// 대형 키워드 풀 - 다양한 카테고리
const POOLS: Record<string, string[]> = {
  "음식/맛집": ["맛집","레시피","요리","카페","디저트","배달음식","건강식","다이어트식단","브런치","홈쿡"],
  "여행": ["국내여행","해외여행","제주도","부산","서울","캠핑","호텔","항공권","여행코스","배낭여행"],
  "재테크/금융": ["주식","부동산","재테크","ETF","코인","절약","부업","투자","청약","연금"],
  "건강/뷰티": ["다이어트","운동","헬스","요가","필라테스","스킨케어","헤어케어","영양제","수면","명상"],
  "생활/인테리어": ["인테리어","정리수납","홈카페","셀프인테리어","가구","청소","미니멀","원룸","이사","소품"],
  "육아/교육": ["육아","임신","아기용품","영어","자격증","독서","온라인강의","이직","취업","스펙"],
  "취미/라이프": ["강아지","고양이","식물","독서","게임","넷플릭스","유튜브","사진","등산","자전거"],
  "쇼핑": ["명품","중고거래","해외직구","온라인쇼핑","아이폰","갤럭시","노트북","패션","신발","가방"],
};

function getRandomKeywords(count = 15): string[] {
  const all = Object.values(POOLS).flat();
  return [...all].sort(() => Math.random() - 0.5).slice(0, count);
}

type KW = {
  id: number; keyword: string; volume: number; clicks: number;
  cpc: number; trend: "up"|"down"; competition: string;
  category: string; starred: boolean;
};

const INIT: KW[] = [
  {id:1,keyword:"맛집 추천 2026",volume:89400,clicks:2340,cpc:450,trend:"up",competition:"중",category:"음식",starred:true},
  {id:2,keyword:"제주도 여행 코스",volume:72100,clicks:1980,cpc:380,trend:"up",competition:"높음",category:"여행",starred:true},
  {id:3,keyword:"직장인 재테크",volume:65800,clicks:1870,cpc:890,trend:"up",competition:"높음",category:"금융",starred:false},
  {id:4,keyword:"다이어트 식단표",volume:58200,clicks:1560,cpc:320,trend:"down",competition:"중",category:"건강",starred:false},
  {id:5,keyword:"인테리어 소품 추천",volume:49100,clicks:1340,cpc:560,trend:"up",competition:"낮음",category:"인테리어",starred:false},
  {id:6,keyword:"강아지 훈련 방법",volume:43700,clicks:1120,cpc:290,trend:"up",competition:"낮음",category:"반려동물",starred:false},
];

const CHART = [
  {name:"음식",volume:89400},{name:"여행",volume:72100},{name:"금융",volume:65800},
  {name:"건강",volume:58200},{name:"인테리어",volume:49100},{name:"반려동물",volume:43700},
];

const STORAGE_KEY = "blogauto_keywords";
const TITLES_KEY = "blogauto_titles";
const SELKW_KEY = "blogauto_selkw";

export default function KeywordResearch() {
  const [location, navigate] = useLocation();
  const [adsenseOn, setAdsenseOn] = useState(true);
  const [adpostOn, setAdpostOn] = useState(true);
  const [inputKW, setInputKW] = useState("");
  const [isCollecting, setIsCollecting] = useState(false);

  // 1. localStorage에서 키워드 불러오기 (페이지 이탈해도 유지)
  const [keywords, setKeywords] = useState<KW[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INIT;
    } catch { return INIT; }
  });

  const [sort, setSort] = useState<"volume"|"hard"|"easy">("volume");
  const [selKW, setSelKW] = useState<string|null>(() => localStorage.getItem(SELKW_KEY) || null);
  const [titles, setTitles] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(TITLES_KEY) || "[]"); } catch { return []; }
  });
  const [isGenTitles, setIsGenTitles] = useState(false);
  const [collectCount, setCollectCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");

  // 제목/선택키워드 변경시 자동 저장
  useEffect(() => {
    try { localStorage.setItem(TITLES_KEY, JSON.stringify(titles)); } catch {}
  }, [titles]);
  useEffect(() => {
    try {
      if (selKW) localStorage.setItem(SELKW_KEY, selKW);
      else localStorage.removeItem(SELKW_KEY);
    } catch {}
  }, [selKW]);

  // 키워드 변경시 자동 저장
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords)); } catch {}
  }, [keywords]);

  // URL q 파라미터 처리 + 상단 검색창 이벤트 수신
  useEffect(() => {
    const q = new URLSearchParams(location.split("?")[1]||"").get("q")||"";
    if (q) { setInputKW(q); doCollect(q); }

    // 상단 검색창 Enter 이벤트 수신
    const handler = (e: Event) => {
      const val = (e as CustomEvent).detail;
      if (val) { setInputKW(val); doCollect(val); }
    };
    window.addEventListener("layout-search", handler);
    return () => window.removeEventListener("layout-search", handler);
  }, []);

  // 모바일/PC 동기화 코드 처리
  useEffect(() => {
    const sync = new URLSearchParams(location.split("?")[1]||"").get("sync")||"";
    if (sync) {
      try {
        const data = JSON.parse(atob(sync));
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v as string));
        toast.success("설정이 동기화되었습니다!");
      } catch {}
    }
  }, []);

  const sc = (c: string) => c==="높음"?3:c==="중"?2:1;
  const sorted = [...keywords].sort((a,b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1;
    if (sort==="hard") return sc(b.competition)-sc(a.competition);
    if (sort==="easy") return (sc(a.competition)*1e6+b.volume)-(sc(b.competition)*1e6+a.volume);
    return b.volume-a.volume;
  });

  const filtered = selectedCategory === "전체"
    ? sorted
    : sorted.filter(k => k.category === selectedCategory);

  const categories = ["전체", ...Array.from(new Set(keywords.map(k => k.category)))];

  const sortLabel = sort==="volume"?"검색량순":sort==="hard"?"어려운순":"가능성순";
  const sortColor = sort==="volume"?"var(--muted-foreground)":sort==="hard"?"oklch(0.65 0.22 25)":"var(--color-emerald)";

  function toggleStar(id: number) {
    setKeywords(prev => prev.map(k => k.id===id ? {...k, starred:!k.starred} : k));
  }
  function deleteKW(id: number) {
    setKeywords(prev => prev.filter(k => k.id !== id));
  }
  function clearAll() {
    setKeywords(INIT);
    setCollectCount(0);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("초기화되었습니다");
  }

  async function doCollect(query?: string) {
    const kw = (query ?? inputKW).trim();
    const accessLicense = localStorage.getItem("naver_access_license");
    const secretKey = localStorage.getItem("naver_secret_key");
    const customerId = localStorage.getItem("naver_customer_id");

    if (!accessLicense || !secretKey || !customerId) {
      toast.error("설정 페이지에서 네이버 검색광고 API 키를 먼저 입력해주세요");
      return;
    }

    setIsCollecting(true);
    toast.loading("키워드 수집 중...", { id:"collect" });

    try {
      // 5. 다양한 카테고리 키워드 사용
      const seeds = kw ? [kw] : getRandomKeywords(15);
      const batches = kw ? [[kw]] : [seeds.slice(0,5), seeds.slice(5,10), seeds.slice(10,15)];
      const allItems: any[] = [];

      for (const batch of batches) {
        const resp = await fetch(`/api/naver-keywords?_=${Date.now()}`, {
          method:"POST",
          headers:{"Content-Type":"application/json","Cache-Control":"no-cache"},
          body:JSON.stringify({ accessLicense, secretKey, customerId, keywords:batch }),
        });
        if (!resp.ok) { const err=await resp.json(); throw new Error(err.error||"API 오류"); }
        const data = await resp.json();
        allItems.push(...(data.keywordList||[]));
      }

      if (allItems.length===0) throw new Error("수집된 키워드가 없습니다");

      const newKWs: KW[] = allItems.slice(0,30).map((item:any,i:number) => {
        const pc=parseInt((item.monthlyPcQcCnt||"0").toString().replace(/,/g,""))||0;
        const mob=parseInt((item.monthlyMobileQcCnt||"0").toString().replace(/,/g,""))||0;
        const total=pc+mob;
        return {
          id:Date.now()+i, keyword:item.relKeyword||"알 수 없음",
          volume:total, clicks:Math.round(total*0.03),
          cpc:Math.round((parseFloat(item.avgMonthlyPC||"0")||0)*1000),
          trend:total>5000?"up":"down",
          competition:item.compIdx==="높음"?"높음":item.compIdx==="낮음"?"낮음":"중",
          category:kw||"수집", starred:false,
        };
      });

      setKeywords(prev => {
        const existing = new Set(prev.map(k=>k.keyword));
        const unique = newKWs.filter(k=>!existing.has(k.keyword));
        return [...unique, ...prev];
      });
      setCollectCount(c=>c+1);
      toast.success(`키워드 ${newKWs.length}개 수집 완료!`, { id:"collect" });
    } catch(e:any) {
      toast.error(`수집 실패: ${e.message}`, { id:"collect" });
    } finally { setIsCollecting(false); }
  }

  // 2. 제목 생성 - API 키 체크 개선
  async function genTitles(kw: string) {
    const provider = getContentProvider();
    const apiKey = getAPIKey(provider);

    if (!apiKey) {
      toast.error("설정 페이지에서 AI API 키를 입력해주세요 (Gemini 또는 Claude)", {
        duration: 4000,
      });
      return;
    }

    const isNewKeyword = kw !== selKW;
    setSelKW(kw);
    if (isNewKeyword) setTitles([]); // 새 키워드면 초기화, 다시 생성은 누적
    setIsGenTitles(true);

    try {
      const resp = await fetch("/api/generate-titles", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ provider, apiKey, keyword:kw }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      const newTitles: string[] = data.titles || [];
      setTitles(prev => {
        if (isNewKeyword) return newTitles; // 새 키워드 → 초기화
        if (prev.length >= 30) return newTitles; // 30개 꽉 찼으면 → 초기화 후 새로 생성
        // 누적 + 중복 제거
        const existingSet = new Set(prev);
        const unique = newTitles.filter(t => !existingSet.has(t));
        return [...prev, ...unique].slice(0, 30);
      });
    } catch(e:any) {
      toast.error(`제목 생성 실패: ${e.message}`);
    } finally { setIsGenTitles(false); }
  }

  function goContent(title: string) {
    navigate(`/content?keyword=${encodeURIComponent(selKW||"")}&title=${encodeURIComponent(title)}`);
  }

  const cs = (c: string) => ({
    bg: c==="낮음"?"oklch(0.696 0.17 162.48/15%)":c==="중"?"oklch(0.769 0.188 70.08/15%)":"oklch(0.65 0.22 25/15%)",
    fg: c==="낮음"?"var(--color-emerald)":c==="중"?"var(--color-amber-brand)":"oklch(0.65 0.22 25)",
  });

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{fontFamily:"'Space Grotesk',sans-serif"}}>키워드 수집</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs" style={{color:"var(--muted-foreground)"}}>총 <span className="font-bold" style={{color:"var(--color-emerald)"}}>{keywords.length}</span>개</span>
              <span className="text-xs" style={{color:"var(--muted-foreground)"}}>수집 <span className="font-bold" style={{color:"oklch(0.75 0.12 300)"}}>{collectCount}</span>회</span>
              <span className="text-xs" style={{color:"var(--muted-foreground)"}}>즐겨찾기 <span className="font-bold" style={{color:"var(--color-amber-brand)"}}>{keywords.filter(k=>k.starred).length}</span>개</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={clearAll}>
              <Trash2 className="w-3.5 h-3.5"/>초기화
            </Button>
            <Button size="sm" className="gap-1.5"
              style={{background:isCollecting?"var(--muted)":"var(--color-emerald)",color:"white"}}
              onClick={()=>doCollect()} disabled={isCollecting}>
              {isCollecting?<RefreshCw className="w-4 h-4 animate-spin"/>:<Zap className="w-4 h-4"/>}
              {isCollecting?"수집 중...":"키워드 수집"}
            </Button>
          </div>
        </div>

        {/* ── 제목 생성 패널 (헤더 바로 아래, 항상 보이는 위치) ── */}
        {(selKW || isGenTitles) && (
          <div className="rounded-xl overflow-hidden"
            style={{background:"var(--card)", border:"2px solid oklch(0.75 0.12 300/60%)"}}>
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{background:"oklch(0.75 0.12 300/12%)", borderBottom:"1px solid oklch(0.75 0.12 300/30%)"}}>
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 shrink-0" style={{color:"oklch(0.75 0.12 300)"}}/>
                <span className="text-sm font-bold text-foreground truncate">
                  제목 추천 —&nbsp;
                  <span style={{color:"oklch(0.75 0.12 300)"}}>{selKW}</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{background:"oklch(0.75 0.12 300/20%)", color:"oklch(0.75 0.12 300)"}}>
                  {titles.length}/30
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7"
                  onClick={()=>genTitles(selKW!)} disabled={isGenTitles}>
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenTitles?"animate-spin":""}`}/>
                  {titles.length >= 30 ? "초기화 후 재생성" : "10개 더"}
                </Button>
                <button onClick={()=>{setSelKW(null);setTitles([]);}}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent/20"
                  style={{color:"var(--muted-foreground)"}}>
                  <X className="w-4 h-4"/>
                </button>
              </div>
            </div>

            {/* 제목 목록 */}
            <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">

              {/* 30개 꽉 찼을 때 안내 문구 */}
              {titles.length >= 30 && !isGenTitles && (
                <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 mb-1"
                  style={{background:"oklch(0.769 0.188 70.08/12%)", border:"1px solid oklch(0.769 0.188 70.08/30%)"}}>
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" style={{color:"var(--color-amber-brand)"}}/>
                  <span className="text-xs" style={{color:"var(--color-amber-brand)"}}>
                    제목이 30개 모두 채워졌어요! <span className="font-bold">'초기화 후 재생성'</span>을 누르면 기존 목록을 지우고 새 제목 10개를 생성합니다.
                  </span>
                </div>
              )}
              {isGenTitles && titles.length === 0 ? (
                [...Array(10)].map((_,i)=>(
                  <div key={i} className="h-11 rounded-lg animate-pulse" style={{background:"var(--muted)"}}/>
                ))
              ) : titles.length === 0 ? (
                /* 빈 상태 - API 실패 또는 미생성 */
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Sparkles className="w-8 h-8 opacity-20" style={{color:"oklch(0.75 0.12 300)"}}/>
                  <p className="text-sm text-center" style={{color:"var(--muted-foreground)"}}>
                    아직 제목이 없어요.<br/>
                    <span className="text-xs">API 키가 설정됐는지 확인 후 아래 버튼을 눌러주세요.</span>
                  </p>
                  <Button size="sm" className="gap-2"
                    style={{background:"oklch(0.75 0.12 300)", color:"white"}}
                    onClick={()=>genTitles(selKW!)} disabled={isGenTitles}>
                    <RefreshCw className="w-3.5 h-3.5"/>제목 생성 시작
                  </Button>
                </div>
              ) : (
                <>
                  {titles.map((title, i) => (
                    <div key={i}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 group"
                      style={{background:"var(--background)", border:"1px solid var(--border)"}}>
                      <span className="text-xs font-black shrink-0 w-6 text-center"
                        style={{color:"oklch(0.75 0.12 300)"}}>{i+1}</span>
                      <span className="flex-1 text-sm text-foreground leading-snug">{title}</span>
                      <Button size="sm"
                        className="shrink-0 gap-1.5 text-xs h-8 px-3 opacity-80 group-hover:opacity-100"
                        style={{background:"var(--color-emerald)", color:"white"}}
                        onClick={()=>goContent(title)}>
                        글 생성 <ArrowRight className="w-3.5 h-3.5"/>
                      </Button>
                    </div>
                  ))}
                  {isGenTitles && (
                    [...Array(10)].map((_,i)=>(
                      <div key={`loading-${i}`} className="h-11 rounded-lg animate-pulse" style={{background:"var(--muted)"}}/>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 수익 플랫폼 */}
        <div className="rounded-xl p-4" style={{background:"var(--card)",border:"1px solid var(--border)"}}>
          <h3 className="font-semibold text-foreground mb-3 text-sm">수익 플랫폼</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:"Google AdSense",logo:"G",color:"#4285F4",state:adsenseOn,set:setAdsenseOn},
              {label:"Naver AdPost",logo:"N",color:"#03C75A",state:adpostOn,set:setAdpostOn},
            ].map(p=>(
              <div key={p.label} className="flex items-center justify-between rounded-xl p-3"
                style={{background:"var(--background)",border:"1px solid var(--border)"}}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white"
                    style={{background:p.color}}>{p.logo}</div>
                  <span className="font-medium text-foreground text-xs sm:text-sm">{p.label}</span>
                </div>
                <Switch checked={p.state} onCheckedChange={p.set}/>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{
                background: selectedCategory===cat ? "var(--color-emerald)" : "var(--card)",
                color: selectedCategory===cat ? "white" : "var(--muted-foreground)",
                border: `1px solid ${selectedCategory===cat ? "var(--color-emerald)" : "var(--border)"}`,
              }}
              onClick={()=>setSelectedCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* 키워드 테이블 */}
        <div className="rounded-xl" style={{background:"var(--card)",border:"1px solid var(--border)"}}>
          {/* 4. 검색창 - 실제 수집과 연동 */}
          <div className="flex items-center gap-2 p-3 sm:p-4 border-b" style={{borderColor:"var(--border)"}}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:"var(--muted-foreground)"}}/>
              <Input
                placeholder="키워드 입력 후 Enter → 수집 / 비우고 수집버튼 → 랜덤"
                className="pl-9 text-sm"
                value={inputKW}
                onChange={e=>setInputKW(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); doCollect(inputKW); }}}
              />
            </div>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5 text-xs"
              style={{color:sortColor,borderColor:sortColor}}
              onClick={()=>setSort(s=>s==="volume"?"hard":s==="hard"?"easy":"volume")}>
              <ArrowUpDown className="w-3.5 h-3.5"/>{sortLabel}
            </Button>
          </div>

          {/* 데스크탑 헤더 */}
          <div className="hidden sm:grid gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{gridTemplateColumns:"36px 36px 1fr 100px 80px 80px 36px 36px 36px",color:"var(--muted-foreground)",borderBottom:"1px solid var(--border)"}}>
            <div className="text-center">#</div>
            <div></div>
            <div>키워드 (클릭 → 제목 생성)</div>
            <div className="text-right">검색량</div>
            <div className="text-right">클릭수</div>
            <div className="text-right">CPC</div>
            <div className="text-center">추세</div>
            <div className="text-center">제목</div>
            <div className="text-center">삭제</div>
          </div>

          <div className="divide-y" style={{borderColor:"var(--border)"}}>
            {filtered.map((kw, idx) => {
              const style = cs(kw.competition);
              return (
                <div key={kw.id} className="px-3 sm:px-4 py-3 hover:bg-accent/10 transition-colors"
                  style={selKW === kw.keyword ? {background:"oklch(0.75 0.12 300/8%)", borderLeft:"3px solid oklch(0.75 0.12 300)"} : {}}>

                  {/* 모바일 - 키워드 텍스트 클릭 → 제목 생성 */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <span className="text-xs font-bold shrink-0 w-5 text-center" style={{color:"var(--muted-foreground)"}}>{idx+1}</span>
                    <button onClick={(e)=>{e.stopPropagation();toggleStar(kw.id);}} className="shrink-0 p-1">
                      {kw.starred?<Star className="w-4 h-4 fill-amber-400 text-amber-400"/>:<StarOff className="w-4 h-4" style={{color:"var(--muted-foreground)"}}/>}
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer active:opacity-70 py-1"
                      onClick={()=>genTitles(kw.keyword)}>
                      <div className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                        {kw.keyword}
                        <Sparkles className="w-3 h-3 shrink-0" style={{color:"oklch(0.75 0.12 300)"}}/>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{color:"var(--muted-foreground)"}}>{kw.volume.toLocaleString()}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{background:style.bg,color:style.fg}}>{kw.competition}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" style={{color:"oklch(0.75 0.12 300)"}}/>
                  </div>

                  {/* 데스크탑 - 키워드 클릭 → 제목 생성 */}
                  <div className="hidden sm:grid gap-2 items-center"
                    style={{gridTemplateColumns:"36px 36px 1fr 100px 80px 80px 36px 36px 36px"}}>
                    <div className="text-center text-xs font-bold" style={{color:"var(--muted-foreground)"}}>{idx+1}</div>
                    <button onClick={()=>toggleStar(kw.id)}>
                      {kw.starred?<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>:<StarOff className="w-3.5 h-3.5" style={{color:"var(--muted-foreground)"}}/>}
                    </button>
                    <div className="cursor-pointer hover:opacity-70" onClick={()=>genTitles(kw.keyword)}>
                      <div className="text-sm font-medium text-foreground flex items-center gap-1">
                        {kw.keyword}
                        {selKW === kw.keyword && isGenTitles
                          ? <RefreshCw className="w-3 h-3 animate-spin" style={{color:"oklch(0.75 0.12 300)"}}/>
                          : selKW === kw.keyword
                          ? <CheckCircle2 className="w-3 h-3" style={{color:"var(--color-emerald)"}}/>
                          : <Sparkles className="w-3 h-3" style={{color:"oklch(0.75 0.12 300)"}}/>
                        }
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{background:style.bg,color:style.fg}}>경쟁 {kw.competition}</span>
                    </div>
                    <div className="text-right text-sm text-foreground">{kw.volume.toLocaleString()}</div>
                    <div className="text-right text-sm text-foreground">{kw.clicks.toLocaleString()}</div>
                    <div className="text-right text-sm text-foreground">₩{kw.cpc.toLocaleString()}</div>
                    <div className="flex justify-center">
                      {kw.trend==="up"?<TrendingUp className="w-4 h-4" style={{color:"var(--color-emerald)"}}/>:<TrendingDown className="w-4 h-4" style={{color:"oklch(0.65 0.22 25)"}}/>}
                    </div>
                    <div className="flex justify-center">
                      <Button size="sm" className="h-7 w-7 p-0" style={{background:"oklch(0.75 0.12 300)",color:"white"}}
                        onClick={()=>genTitles(kw.keyword)}>
                        <Sparkles className="w-3.5 h-3.5"/>
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <button onClick={()=>deleteKW(kw.id)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
                        style={{color:"var(--muted-foreground)"}}>
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center" style={{color:"var(--muted-foreground)"}}>
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">키워드를 수집해주세요</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
