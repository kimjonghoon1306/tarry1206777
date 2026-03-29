/**
 * BlogAuto Pro - Keyword Research
 * 키워드 수집 → 제목 생성 → 콘텐츠 생성 플로우
 */

import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Search, TrendingUp, TrendingDown, RefreshCw,
  Download, Star, StarOff, Zap, ChevronRight,
  Sparkles, ArrowRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getContentProvider, getAPIKey } from "@/lib/ai-config";

const KEYWORDS = [
  { id: 1, keyword: "맛집 추천 2026", volume: 89400, clicks: 2340, cpc: 450, trend: "up", competition: "중", category: "음식", starred: true },
  { id: 2, keyword: "제주도 여행 코스", volume: 72100, clicks: 1980, cpc: 380, trend: "up", competition: "높음", category: "여행", starred: true },
  { id: 3, keyword: "직장인 재테크", volume: 65800, clicks: 1870, cpc: 890, trend: "up", competition: "높음", category: "금융", starred: false },
  { id: 4, keyword: "다이어트 식단표", volume: 58200, clicks: 1560, cpc: 320, trend: "down", competition: "중", category: "건강", starred: false },
  { id: 5, keyword: "인테리어 소품 추천", volume: 49100, clicks: 1340, cpc: 560, trend: "up", competition: "낮음", category: "인테리어", starred: false },
  { id: 6, keyword: "강아지 훈련 방법", volume: 43700, clicks: 1120, cpc: 290, trend: "up", competition: "낮음", category: "반려동물", starred: false },
];

const CHART_DATA = [
  { name: "음식", volume: 89400 }, { name: "여행", volume: 72100 },
  { name: "금융", volume: 65800 }, { name: "건강", volume: 58200 },
  { name: "인테리어", volume: 49100 }, { name: "반려동물", volume: 43700 },
];

export default function KeywordResearch() {
  const [, navigate] = useLocation();
  const [adsenseOn, setAdsenseOn] = useState(true);
  const [adpostOn, setAdpostOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollecting, setIsCollecting] = useState(false);
  const [keywords, setKeywords] = useState(KEYWORDS);

  // 제목 생성 패널
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);

  const filtered = keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStar = (id: number) => {
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, starred: !k.starred } : k));
  };

  // 키워드 수집
  const handleCollect = async () => {
    const accessLicense = localStorage.getItem("naver_access_license");
    const secretKey = localStorage.getItem("naver_secret_key");
    const customerId = localStorage.getItem("naver_customer_id");

    if (!accessLicense || !secretKey || !customerId) {
      toast.error("설정 페이지에서 네이버 검색광고 API 키를 먼저 입력해주세요");
      return;
    }

    setIsCollecting(true);
    toast.loading("네이버에서 키워드 수집 중...", { id: "collect" });

    try {
      const batches = searchQuery.trim()
        ? [[searchQuery.trim()]]
        : [
            ["맛집", "여행", "재테크", "다이어트", "인테리어"],
            ["강아지", "건강", "운동", "주식", "부업"],
            ["육아", "요리", "뷰티", "패션", "독서"],
          ];

      const allItems: any[] = [];

      for (const batch of batches) {
        const resp = await fetch("/api/naver-keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessLicense, secretKey, customerId, keywords: batch }),
        });
        if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "API 오류"); }
        const data = await resp.json();
        allItems.push(...(data.keywordList || []));
      }

      if (allItems.length === 0) throw new Error("수집된 키워드가 없습니다");

      const newKeywords = allItems.slice(0, 30).map((item: any, i: number) => {
        const pc = parseInt((item.monthlyPcQcCnt || "0").toString().replace(/,/g, "")) || 0;
        const mobile = parseInt((item.monthlyMobileQcCnt || "0").toString().replace(/,/g, "")) || 0;
        const total = pc + mobile;
        return {
          id: Date.now() + i,
          keyword: item.relKeyword || "알 수 없음",
          volume: total,
          clicks: Math.round(total * 0.03),
          cpc: Math.round((parseFloat(item.avgMonthlyPC || "0") || 0) * 1000),
          trend: total > 5000 ? "up" as const : "down" as const,
          competition: item.compIdx === "높음" ? "높음" : item.compIdx === "낮음" ? "낮음" : "중",
          category: searchQuery.trim() || "수집",
          starred: false,
        };
      });

      setKeywords(prev => [...newKeywords, ...prev]);
      toast.success(`키워드 ${newKeywords.length}개 수집 완료!`, { id: "collect" });
    } catch (e: any) {
      toast.error(`수집 실패: ${e.message}`, { id: "collect" });
    } finally {
      setIsCollecting(false);
    }
  };

  // 제목 생성
  const handleGenerateTitles = async (keyword: string) => {
    const provider = getContentProvider();
    const apiKey = getAPIKey(provider);
    if (!apiKey) {
      toast.error("설정 페이지에서 AI API 키를 먼저 입력해주세요");
      return;
    }
    setSelectedKeyword(keyword);
    setTitles([]);
    setIsGeneratingTitles(true);

    try {
      const resp = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, keyword }),
      });
      if (!resp.ok) throw new Error("제목 생성 실패");
      const data = await resp.json();
      setTitles(data.titles || []);
    } catch (e: any) {
      toast.error(`제목 생성 실패: ${e.message}`);
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  // 제목 클릭 → 콘텐츠 생성 페이지로
  const handleTitleClick = (title: string) => {
    const params = new URLSearchParams({
      keyword: selectedKeyword || "",
      title,
    });
    navigate(`/content?${params.toString()}`);
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              키워드 수집
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              키워드 수집 → 제목 생성 → 글 작성
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("CSV 내보내기 준비 중")}>
              <Download className="w-4 h-4" /> 내보내기
            </Button>
            <Button size="sm" className="gap-2"
              style={{ background: isCollecting ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
              onClick={handleCollect} disabled={isCollecting}>
              {isCollecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isCollecting ? "수집 중..." : "키워드 수집"}
            </Button>
          </div>
        </div>

        {/* Ad Platform Toggle */}
        <div className="rounded-xl p-4 sm:p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base">수익 플랫폼 선택</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Google AdSense", desc: "글로벌 광고", logo: "G", color: "#4285F4", state: adsenseOn, setState: setAdsenseOn },
              { label: "Naver AdPost", desc: "국내 블로그 광고", logo: "N", color: "#03C75A", state: adpostOn, setState: setAdpostOn },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between rounded-xl p-3"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
                    style={{ background: p.color }}>{p.logo}</div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{p.label}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.desc}</div>
                  </div>
                </div>
                <Switch checked={p.state} onCheckedChange={p.setState} />
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-xl p-4 sm:p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base">카테고리별 검색량</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.62 0.015 286.067)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.62 0.015 286.067)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)", fontSize: "12px" }} />
              <Bar dataKey="volume" fill="oklch(0.696 0.17 162.48)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Search + Keyword Table */}
        <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 p-3 sm:p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <Input placeholder="키워드 입력 후 수집 버튼..." className="pl-9 text-sm"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCollect()} />
            </div>
          </div>

          {/* Table header - 모바일에서 간소화 */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>
            <div className="col-span-4">키워드</div>
            <div className="col-span-2 text-right">검색량</div>
            <div className="col-span-2 text-right">클릭수</div>
            <div className="col-span-2 text-right">CPC</div>
            <div className="col-span-1 text-center">추세</div>
            <div className="col-span-1 text-center">제목</div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((kw) => (
              <div key={kw.id} className="px-3 sm:px-4 py-3">
                {/* 모바일 레이아웃 */}
                <div className="flex items-center justify-between gap-2 sm:hidden">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button onClick={() => toggleStar(kw.id)}>
                      {kw.starred
                        ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        : <StarOff className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />}
                    </button>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{kw.keyword}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{kw.volume.toLocaleString()}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: kw.competition === "낮음" ? "oklch(0.696 0.17 162.48 / 15%)" : kw.competition === "중" ? "oklch(0.769 0.188 70.08 / 15%)" : "oklch(0.65 0.22 25 / 15%)", color: kw.competition === "낮음" ? "var(--color-emerald)" : kw.competition === "중" ? "var(--color-amber-brand)" : "oklch(0.65 0.22 25)" }}>
                          {kw.competition}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="shrink-0 gap-1 text-xs px-2 py-1 h-7"
                    style={{ background: "oklch(0.75 0.12 300)", color: "white" }}
                    onClick={() => handleGenerateTitles(kw.keyword)}>
                    <Sparkles className="w-3 h-3" /> 제목
                  </Button>
                </div>

                {/* 데스크탑 레이아웃 */}
                <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4 flex items-center gap-2">
                    <button onClick={() => toggleStar(kw.id)}>
                      {kw.starred
                        ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        : <StarOff className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />}
                    </button>
                    <div>
                      <div className="text-sm font-medium text-foreground">{kw.keyword}</div>
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: kw.competition === "낮음" ? "oklch(0.696 0.17 162.48 / 15%)" : kw.competition === "중" ? "oklch(0.769 0.188 70.08 / 15%)" : "oklch(0.65 0.22 25 / 15%)", color: kw.competition === "낮음" ? "var(--color-emerald)" : kw.competition === "중" ? "var(--color-amber-brand)" : "oklch(0.65 0.22 25)" }}>
                        경쟁 {kw.competition}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-sm text-foreground">{kw.volume.toLocaleString()}</div>
                  <div className="col-span-2 text-right text-sm text-foreground">{kw.clicks.toLocaleString()}</div>
                  <div className="col-span-2 text-right text-sm text-foreground">₩{kw.cpc.toLocaleString()}</div>
                  <div className="col-span-1 flex justify-center">
                    {kw.trend === "up"
                      ? <TrendingUp className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                      : <TrendingDown className="w-4 h-4" style={{ color: "oklch(0.65 0.22 25)" }} />}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button size="sm" className="h-7 w-7 p-0"
                      style={{ background: "oklch(0.75 0.12 300)", color: "white" }}
                      onClick={() => handleGenerateTitles(kw.keyword)}>
                      <Sparkles className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 제목 생성 패널 */}
        {selectedKeyword && (
          <div className="rounded-xl p-4 sm:p-5" style={{ background: "var(--card)", border: "2px solid oklch(0.75 0.12 300 / 50%)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  제목 생성 — <span style={{ color: "oklch(0.75 0.12 300)" }}>{selectedKeyword}</span>
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  클릭하면 바로 글 생성으로 이동해요
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                  onClick={() => handleGenerateTitles(selectedKeyword)}
                  disabled={isGeneratingTitles}>
                  {isGeneratingTitles ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  다시 생성
                </Button>
                <button onClick={() => { setSelectedKeyword(null); setTitles([]); }}
                  className="p-1 rounded" style={{ color: "var(--muted-foreground)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isGeneratingTitles ? (
              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--muted)" }} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {titles.map((title, i) => (
                  <button key={i}
                    className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-left hover:bg-accent/30 transition-colors group"
                    style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                    onClick={() => handleTitleClick(title)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold shrink-0" style={{ color: "oklch(0.75 0.12 300)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm text-foreground truncate">{title}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--color-emerald)" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
