import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Search, TrendingUp, TrendingDown, RefreshCw,
  Download, Star, StarOff, Zap, ArrowUpDown,
  Sparkles, ArrowRight, X, Trash2, Bot, CheckCircle2, AlertTriangle,
  Monitor, Smartphone, Users, BarChart2, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { getContentProvider, getAPIKey } from "@/lib/ai-config";
import { userGet, SETTINGS_KEYS, syncAdminSettingsToLocal, userGetWithSync } from "@/lib/user-storage";

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

// 황금 키워드 점수 계산 (경쟁 낮음 + 적당한 검색량 + 높은 클릭률)
function calcGoldScore(kw: { volume: number; competition: string; cpc: number; clicks: number }): number {
  const compScore = kw.competition === "낮음" ? 100 : kw.competition === "중" ? 50 : 10;
  const volScore = kw.volume >= 1000 && kw.volume <= 50000 ? 100 : kw.volume < 1000 ? 30 : 60;
  const ctrScore = kw.volume > 0 ? Math.min(100, (kw.clicks / kw.volume) * 1000) : 0;
  const cpcScore = Math.min(100, kw.cpc / 10);
  return Math.round(compScore * 0.4 + volScore * 0.3 + ctrScore * 0.2 + cpcScore * 0.1);
}

type KW = {
  id: number; keyword: string; volume: number; clicks: number;
  cpc: number; trend: "up"|"down"; competition: string;
  category: string; starred: boolean;
};

const INIT: KW[] = [];

const CHART = [
  {name:"음식",volume:89400},{name:"여행",volume:72100},{name:"금융",volume:65800},
  {name:"건강",volume:58200},{name:"인테리어",volume:49100},{name:"반려동물",volume:43700},
];

const STORAGE_KEY = "blogauto_keywords";
const TITLES_KEY = "blogauto_titles";
const SELKW_KEY = "blogauto_selkw";

// ── 데이터랩 컴포넌트 ──────────────────────────────────
function DataLabPanel() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    const kw = keyword.trim();
    if (!kw) { setError("키워드를 입력해주세요"); return; }
    // 키 없으면 admin sync 후 자동 재시도
    const clientId = await userGetWithSync("naver_datalab_client_id");
    const clientSecret = await userGetWithSync("naver_datalab_client_secret");
    if (!clientId || !clientSecret) {
      setError("설정 페이지에서 네이버 데이터랩 Client ID/Secret을 입력해주세요");
      return;
    }
    setLoading(true); setError(""); setData(null);
    try {
      const resp = await fetch("/api/naver-datalab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, keyword: kw }),
      });
      const d = await resp.json();
      if (!d.ok) throw new Error(d.error);
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const DEVICE_COLORS = ["#6366f1", "#22d3ee"];
  const GENDER_COLORS = ["#3b82f6", "#f472b6"];
  const AGE_COLORS = ["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f87171"];

  const ageData = data ? Object.entries(data.ages).map(([name, value]) => ({ name, value })) : [];
  const deviceData = data ? [
    { name: "모바일", value: data.device.mobile },
    { name: "PC", value: data.device.pc },
  ] : [];
  const genderData = data ? [
    { name: "여성", value: data.gender.female },
    { name: "남성", value: data.gender.male },
  ] : [];

  return (
    <div className="rounded-xl p-4 sm:p-5 space-y-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5" style={{ color: "oklch(0.75 0.18 200)" }} />
        <h3 className="font-bold text-foreground">네이버 데이터랩 분석</h3>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.75 0.18 200/15%)", color: "oklch(0.75 0.18 200)" }}>
          디바이스 · 성별 · 연령
        </span>
      </div>

      {/* 검색 */}
      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && analyze()}
          placeholder="분석할 키워드 입력 (예: 다이어트)"
          className="flex-1 h-10 px-3 rounded-lg text-sm text-foreground"
          style={{ background: "var(--background)", border: "1px solid var(--border)" }}
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="h-10 px-4 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-50"
          style={{ background: "oklch(0.75 0.18 200)", color: "white" }}
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "분석 중..." : "분석"}
        </button>
      </div>

      {error && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "oklch(0.65 0.22 25/10%)", color: "oklch(0.65 0.22 25)", border: "1px solid oklch(0.65 0.22 25/30%)" }}>
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "oklch(0.75 0.18 200/10%)", border: "1px solid oklch(0.75 0.18 200/30%)" }}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Smartphone className="w-3.5 h-3.5" style={{ color: "oklch(0.75 0.18 200)" }} />
                <span className="text-xs font-semibold" style={{ color: "oklch(0.75 0.18 200)" }}>모바일</span>
              </div>
              <div className="text-2xl font-black" style={{ color: "oklch(0.75 0.18 200)", fontFamily: "'Space Grotesk',sans-serif" }}>
                {data.device.mobile}%
              </div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "oklch(0.7 0.18 330/10%)", border: "1px solid oklch(0.7 0.18 330/30%)" }}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5" style={{ color: "oklch(0.7 0.18 330)" }} />
                <span className="text-xs font-semibold" style={{ color: "oklch(0.7 0.18 330)" }}>
                  {data.gender.female >= data.gender.male ? "여성" : "남성"} 우세
                </span>
              </div>
              <div className="text-2xl font-black" style={{ color: "oklch(0.7 0.18 330)", fontFamily: "'Space Grotesk',sans-serif" }}>
                {Math.max(data.gender.female, data.gender.male)}%
              </div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "oklch(0.696 0.17 162/10%)", border: "1px solid oklch(0.696 0.17 162/30%)" }}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart2 className="w-3.5 h-3.5" style={{ color: "var(--color-emerald)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--color-emerald)" }}>주 연령</span>
              </div>
              <div className="text-2xl font-black" style={{ color: "var(--color-emerald)", fontFamily: "'Space Grotesk',sans-serif" }}>
                {Object.entries(data.ages).sort((a: any, b: any) => b[1] - a[1])[0]?.[0]}
              </div>
            </div>
          </div>

          {/* 차트 3개 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 디바이스 */}
            <div className="rounded-xl p-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5 mb-3">
                <Monitor className="w-4 h-4" style={{ color: DEVICE_COLORS[0] }} />
                <span className="text-xs font-bold text-foreground">디바이스</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {deviceData.map((_, i) => <Cell key={i} fill={DEVICE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-1">
                {deviceData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: DEVICE_COLORS[i] }} />
                    <span style={{ color: "var(--muted-foreground)" }}>{d.name} {d.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 성별 */}
            <div className="rounded-xl p-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5 mb-3">
                <Users className="w-4 h-4" style={{ color: GENDER_COLORS[0] }} />
                <span className="text-xs font-bold text-foreground">성별</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-1">
                {genderData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: GENDER_COLORS[i] }} />
                    <span style={{ color: "var(--muted-foreground)" }}>{d.name} {d.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 연령대 */}
            <div className="rounded-xl p-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5 mb-3">
                <BarChart2 className="w-4 h-4" style={{ color: AGE_COLORS[2] }} />
                <span className="text-xs font-bold text-foreground">연령대</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={ageData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {ageData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i % AGE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 트렌드 라인 */}
          {data.trend && data.trend.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                <span className="text-xs font-bold text-foreground">검색 트렌드 ({data.keyword})</span>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={data.trend.map((d: any) => ({ date: d.period.slice(5), ratio: d.ratio }))}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ratio" stroke="var(--color-emerald)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="py-8 text-center">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "oklch(0.75 0.18 200)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>키워드를 입력하고 분석 버튼을 눌러주세요</p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>설정에서 네이버 데이터랩 Client ID/Secret을 먼저 입력하세요</p>
        </div>
      )}
    </div>
  );
}

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

  const [sort, setSort] = useState<"volume"|"hard"|"easy"|"gold">("gold");
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
    if (sort==="gold") return calcGoldScore(b)-calcGoldScore(a);
    return b.volume-a.volume;
  });

  const filtered = selectedCategory === "전체"
    ? sorted
    : sorted.filter(k => k.category === selectedCategory);

  const categories = ["전체", ...Array.from(new Set(keywords.map(k => k.category)))];

  const sortLabel = sort==="gold"?"🏆 황금키워드":sort==="volume"?"검색량순":sort==="hard"?"어려운순":"가능성순";
  const sortColor = sort==="gold"?"oklch(0.769 0.188 70.08)":sort==="volume"?"var(--muted-foreground)":sort==="hard"?"oklch(0.65 0.22 25)":"var(--color-emerald)";

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

  // AI 키워드 추천 (네이버 API 없을 때 사용)
  async function doCollectAI(kw: string) {
    const provider = getContentProvider();
    const apiKey = getAPIKey(provider);
    if (!apiKey) {
      toast.error("설정에서 AI API 키를 먼저 입력해주세요");
      return;
    }
    setIsCollecting(true);
    toast.loading("AI가 키워드를 추천 중...", { id: "collect" });
    try {
      const prompt = `"${kw}" 주제로 블로그에 쓸 수 있는 롱테일 키워드 20개를 추천해줘.
조건:
- 경쟁이 낮고 검색량이 적당한 (월 1000~30000) 키워드
- 실제 사람들이 검색할 법한 구체적인 표현
- 반드시 JSON 배열로만 응답: [{"keyword":"키워드","competition":"낮음","volume":5000},...]
- competition은 낮음/중/높음 중 하나
- volume은 예상 월간 검색량 숫자
- 한글, 영어, 숫자만 사용`;

      const resp = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, keyword: kw, mode: "keywords", prompt }),
      });
      const data = await resp.json();
      
      // generate-titles가 titles 반환하면 키워드로 변환
      const raw = data.titles || data.keywords || [];
      let newKWs: KW[];
      
      if (typeof raw[0] === "object") {
        newKWs = raw.map((item: any, i: number) => ({
          id: Date.now() + i,
          keyword: item.keyword || item,
          volume: item.volume || Math.floor(Math.random() * 20000 + 1000),
          clicks: Math.floor((item.volume || 5000) * 0.03),
          cpc: Math.floor(Math.random() * 500 + 100),
          trend: "up" as const,
          competition: item.competition || "낮음",
          category: kw,
          starred: false,
        }));
      } else {
        newKWs = raw.map((kword: string, i: number) => ({
          id: Date.now() + i,
          keyword: kword,
          volume: Math.floor(Math.random() * 20000 + 1000),
          clicks: Math.floor(Math.random() * 600 + 30),
          cpc: Math.floor(Math.random() * 500 + 100),
          trend: "up" as const,
          competition: ["낮음", "낮음", "중"][Math.floor(Math.random() * 3)] as "낮음" | "중" | "높음",
          category: kw,
          starred: false,
        }));
      }

      setKeywords(prev => {
        const existing = new Set(prev.map(k => k.keyword));
        const unique = newKWs.filter(k => !existing.has(k.keyword));
        return [...unique, ...prev];
      });
      setCollectCount(c => c + 1);
      toast.success(`AI 키워드 ${newKWs.length}개 추천 완료!`, { id: "collect" });
    } catch (e: any) {
      toast.error(`AI 키워드 추천 실패: ${e.message}`, { id: "collect" });
    } finally {
      setIsCollecting(false);
    }
  }

  async function doCollect(query?: string) {
    const kw = (query ?? inputKW).trim();
    const accessLicense = userGet(SETTINGS_KEYS.NAVER_LICENSE);
    const secretKey = userGet(SETTINGS_KEYS.NAVER_SECRET);
    const customerId = userGet(SETTINGS_KEYS.NAVER_CUSTOMER);

    // 네이버 API 없으면 AI로 키워드 추천
    if (!accessLicense || !secretKey || !customerId) {
      if (!kw) {
        toast.error("키워드를 입력하거나 설정에서 네이버 검색광고 API 키를 입력해주세요");
        return;
      }
      await doCollectAI(kw);
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

  // 2. 제목 생성 - forceNew=true면 항상 초기화 후 생성
  async function genTitles(kw: string, forceNew = false) {
    const provider = getContentProvider();
    const apiKey = getAPIKey(provider);

    if (!apiKey) {
      toast.error("설정 페이지에서 AI API 키를 입력해주세요 (Gemini 또는 Claude)", {
        duration: 4000,
      });
      return;
    }

    const isReset = kw !== selKW || forceNew;
    setSelKW(kw);
    if (isReset) setTitles([]);
    setIsGenTitles(true);
    toast.loading("제목 생성 중...", { id: "gen-titles" });

    // 제목 패널로 자동 스크롤
    setTimeout(() => {
      document.getElementById("title-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
      const resp = await fetch("/api/generate-titles", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ provider, apiKey, keyword:kw }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      const newTitles: string[] = data.titles || [];
      if (newTitles.length === 0) throw new Error("생성된 제목이 없습니다. API 키를 확인해주세요.");
      setTitles(prev => {
        if (isReset) return newTitles;
        if (prev.length >= 30) return newTitles; // 30개 꽉 찼으면 초기화 후 재생성
        const existingSet = new Set(prev);
        const unique = newTitles.filter(t => !existingSet.has(t));
        return [...prev, ...unique].slice(0, 30);
      });
      toast.success(`제목 ${newTitles.length}개 생성 완료!`, { id: "gen-titles" });
    } catch(e:any) {
      toast.error(`제목 생성 실패: ${e.message}`, { id: "gen-titles" });
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
          <div id="title-panel" className="rounded-xl overflow-hidden"
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
                {/* 제목 생성 (초기화 후 새로 생성) */}
                <Button size="sm" className="gap-1.5 text-xs h-7"
                  style={{background:"oklch(0.75 0.12 300)", color:"white"}}
                  onClick={()=>genTitles(selKW!, true)} disabled={isGenTitles}>
                  <Sparkles className={`w-3.5 h-3.5 ${isGenTitles?"animate-spin":""}`}/>
                  제목 생성
                </Button>
                {/* 10개 더 (누적) */}
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

        {/* 키워드 150개 초과 알림 */}
        {keywords.length >= 150 && (
          <div className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{background:"oklch(0.65 0.22 25/12%)", border:"1px solid oklch(0.65 0.22 25/40%)"}}>
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0" style={{color:"oklch(0.65 0.22 25)"}}/>
              <span className="text-sm" style={{color:"oklch(0.65 0.22 25)"}}>
                키워드가 <span className="font-bold">{keywords.length}개</span>로 많아졌어요!
                초기화 후 새로 수집하면 더 빠르게 관리할 수 있어요.
              </span>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 ml-3 gap-1.5 text-xs"
              style={{borderColor:"oklch(0.65 0.22 25/50%)", color:"oklch(0.65 0.22 25)"}}
              onClick={clearAll}>
              <Trash2 className="w-3.5 h-3.5"/>초기화
            </Button>
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
              onClick={()=>setSort(s=>s==="gold"?"volume":s==="volume"?"hard":s==="hard"?"easy":"gold")}>
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
              <div className="py-12 text-center">
                <div className="inline-flex flex-col items-center gap-4 max-w-xs mx-auto">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "oklch(0.696 0.17 162.48/12%)" }}>
                    <Sparkles className="w-8 h-8" style={{ color: "var(--color-emerald)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">키워드가 없어요!</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                      위 검색창에 키워드를 입력하고<br/>
                      <span className="font-semibold" style={{ color: "var(--color-emerald)" }}>수집하기</span>를 누르거나<br/>
                      <span className="font-semibold" style={{ color: "oklch(0.769 0.188 70.08)" }}>🏆 황금키워드</span> 버튼을 눌러보세요
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-full" style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)" }}>
                      💡 예: 맛집, 다이어트, 여행
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 데이터랩 분석 섹션 ── */}
        <DataLabPanel />

      </div>
    </Layout>
  );
}
