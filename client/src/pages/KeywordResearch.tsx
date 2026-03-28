/**
 * BlogAuto Pro - Keyword Research Page
 * Design: Modern Professional Dark SaaS
 * Keyword collection with AdSense/AdPost toggle, analytics
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Filter,
  Star,
  StarOff,
  ArrowUpRight,
  BarChart3,
  MousePointerClick,
  Eye,
  Zap,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const KEYWORDS = [
  { id: 1, keyword: "맛집 추천 2026", volume: 89400, clicks: 2340, cpc: 450, trend: "up", competition: "중", category: "음식", starred: true },
  { id: 2, keyword: "제주도 여행 코스", volume: 72100, clicks: 1980, cpc: 380, trend: "up", competition: "높음", category: "여행", starred: true },
  { id: 3, keyword: "직장인 재테크", volume: 65800, clicks: 1870, cpc: 890, trend: "up", competition: "높음", category: "금융", starred: false },
  { id: 4, keyword: "다이어트 식단표", volume: 58200, clicks: 1560, cpc: 320, trend: "down", competition: "중", category: "건강", starred: false },
  { id: 5, keyword: "인테리어 소품 추천", volume: 49100, clicks: 1340, cpc: 560, trend: "up", competition: "낮음", category: "인테리어", starred: false },
  { id: 6, keyword: "강아지 훈련 방법", volume: 43700, clicks: 1120, cpc: 290, trend: "up", competition: "낮음", category: "반려동물", starred: false },
  { id: 7, keyword: "주식 투자 초보", volume: 38900, clicks: 980, cpc: 1200, trend: "down", competition: "높음", category: "금융", starred: false },
  { id: 8, keyword: "홈트레이닝 루틴", volume: 35600, clicks: 890, cpc: 240, trend: "up", competition: "중", category: "건강", starred: false },
];

const CHART_DATA = [
  { name: "음식", volume: 89400 },
  { name: "여행", volume: 72100 },
  { name: "금융", volume: 65800 },
  { name: "건강", volume: 58200 },
  { name: "인테리어", volume: 49100 },
  { name: "반려동물", volume: 43700 },
];

export default function KeywordResearch() {
  const [adsenseOn, setAdsenseOn] = useState(true);
  const [adpostOn, setAdpostOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [keywords, setKeywords] = useState(KEYWORDS);

  const filtered = keywords.filter(k =>
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleStar = (id: number) => {
    setKeywords(prev =>
      prev.map(k => k.id === id ? { ...k, starred: !k.starred } : k)
    );
  };

  const handleCollect = () => {
    setIsCollecting(true);
    toast.loading("키워드 수집 중...", { id: "collect" });
    setTimeout(() => {
      setIsCollecting(false);
      toast.success("새 키워드 142개가 수집되었습니다!", { id: "collect" });
    }, 2500);
  };

  const handleGenerateContent = () => {
    if (selectedIds.length === 0) {
      toast.error("키워드를 먼저 선택해주세요");
      return;
    }
    toast.success(`${selectedIds.length}개 키워드로 콘텐츠 생성을 시작합니다`);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              키워드 수집
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              유입량과 클릭량이 높은 키워드를 실시간으로 수집합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("CSV 내보내기 준비 중")}>
              <Download className="w-4 h-4" />
              내보내기
            </Button>
            <Button
              size="sm"
              className="gap-2"
              style={{ background: isCollecting ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
              onClick={handleCollect}
              disabled={isCollecting}
            >
              {isCollecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isCollecting ? "수집 중..." : "키워드 수집"}
            </Button>
          </div>
        </div>

        {/* Ad Platform Toggle */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h3 className="font-semibold text-foreground mb-4">수익 플랫폼 선택</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AdSense */}
            <div
              className={`rounded-xl p-4 transition-all duration-200 ${adsenseOn ? "glow-emerald" : ""}`}
              style={{
                background: adsenseOn ? "oklch(0.696 0.17 162.48 / 10%)" : "var(--background)",
                border: `1px solid ${adsenseOn ? "oklch(0.696 0.17 162.48 / 40%)" : "var(--border)"}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white"
                    style={{ background: "#4285F4" }}
                  >
                    G
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Google AdSense</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      글로벌 광고 네트워크
                    </div>
                  </div>
                </div>
                <Switch
                  checked={adsenseOn}
                  onCheckedChange={setAdsenseOn}
                />
              </div>
              {adsenseOn && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "평균 CPC", value: "₩580" },
                    { label: "CTR", value: "3.2%" },
                    { label: "수익", value: "₩89K" },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className="text-sm font-bold" style={{ color: "var(--color-emerald)" }}>{stat.value}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AdPost */}
            <div
              className={`rounded-xl p-4 transition-all duration-200 ${adpostOn ? "" : ""}`}
              style={{
                background: adpostOn ? "oklch(0.769 0.188 70.08 / 10%)" : "var(--background)",
                border: `1px solid ${adpostOn ? "oklch(0.769 0.188 70.08 / 40%)" : "var(--border)"}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white"
                    style={{ background: "#03C75A" }}
                  >
                    N
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Naver AdPost</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      국내 최대 블로그 광고
                    </div>
                  </div>
                </div>
                <Switch
                  checked={adpostOn}
                  onCheckedChange={setAdpostOn}
                />
              </div>
              {adpostOn && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "평균 CPM", value: "₩1,200" },
                    { label: "노출수", value: "48K" },
                    { label: "수익", value: "₩57K" },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className="text-sm font-bold" style={{ color: "var(--color-amber-brand)" }}>{stat.value}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart + Search */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className="lg:col-span-2 rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-foreground mb-4">카테고리별 검색량</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                <XAxis dataKey="name" tick={{ fill: "oklch(0.62 0.015 286.067)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.62 0.015 286.067)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="volume" fill="oklch(0.696 0.17 162.48)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-foreground mb-4">수집 현황</h3>
            <div className="space-y-4">
              {[
                { label: "총 키워드", value: "1,247", color: "var(--color-emerald)" },
                { label: "즐겨찾기", value: "38", color: "var(--color-amber-brand)" },
                { label: "오늘 수집", value: "142", color: "oklch(0.6 0.15 220)" },
                { label: "콘텐츠 생성됨", value: "89", color: "oklch(0.75 0.12 300)" },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{stat.label}</span>
                  <span className="font-bold text-sm" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keyword Table */}
        <div
          className="rounded-xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <Input
                placeholder="키워드 검색..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {selectedIds.length > 0 && (
              <Button
                size="sm"
                className="gap-2"
                style={{ background: "var(--color-emerald)", color: "white" }}
                onClick={handleGenerateContent}
              >
                <Zap className="w-4 h-4" />
                {selectedIds.length}개 콘텐츠 생성
              </Button>
            )}
          </div>

          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="col-span-1" />
            <div className="col-span-4">키워드</div>
            <div className="col-span-2 text-right">검색량</div>
            <div className="col-span-2 text-right">클릭수</div>
            <div className="col-span-2 text-right">CPC</div>
            <div className="col-span-1 text-center">추세</div>
          </div>

          {/* Table rows */}
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filtered.map((kw) => (
              <div
                key={kw.id}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-accent/20 transition-colors cursor-pointer ${
                  selectedIds.includes(kw.id) ? "bg-primary/5" : ""
                }`}
                onClick={() => toggleSelect(kw.id)}
              >
                <div className="col-span-1 flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center"
                    style={{
                      background: selectedIds.includes(kw.id) ? "var(--color-emerald)" : "transparent",
                      border: `1px solid ${selectedIds.includes(kw.id) ? "var(--color-emerald)" : "var(--border)"}`,
                    }}
                  >
                    {selectedIds.includes(kw.id) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStar(kw.id); }}
                    className="text-muted-foreground hover:text-amber-400 transition-colors"
                  >
                    {kw.starred ? (
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ) : (
                      <StarOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div>
                    <div className="text-sm font-medium text-foreground">{kw.keyword}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                      >
                        {kw.category}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: kw.competition === "낮음" ? "oklch(0.696 0.17 162.48 / 15%)" : kw.competition === "중" ? "oklch(0.769 0.188 70.08 / 15%)" : "oklch(0.65 0.22 25 / 15%)",
                          color: kw.competition === "낮음" ? "var(--color-emerald)" : kw.competition === "중" ? "var(--color-amber-brand)" : "oklch(0.65 0.22 25)",
                        }}
                      >
                        경쟁 {kw.competition}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right text-sm font-medium text-foreground">
                  {kw.volume.toLocaleString()}
                </div>
                <div className="col-span-2 text-right text-sm text-foreground">
                  {kw.clicks.toLocaleString()}
                </div>
                <div className="col-span-2 text-right text-sm text-foreground">
                  ₩{kw.cpc.toLocaleString()}
                </div>
                <div className="col-span-1 flex justify-center">
                  {kw.trend === "up" ? (
                    <TrendingUp className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                  ) : (
                    <TrendingDown className="w-4 h-4" style={{ color: "oklch(0.65 0.22 25)" }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
