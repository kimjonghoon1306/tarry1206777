/**
 * BlogAuto Pro - Image Generator Page
 * Design: Modern Professional Dark SaaS
 * AI image generation with realistic/detailed style
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Image,
  Sparkles,
  RefreshCw,
  Download,
  Grid3X3,
  List,
  Wand2,
  Camera,
  Palette,
  ZoomIn,
  Check,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getImageProvider, getAPIKey, IMAGE_AI_OPTIONS } from "@/lib/ai-config";

const IMAGE_GEN_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/image-generation-visual-Y2GnT3gv3AaEqJvBKP7dSz.webp";
const KEYWORD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/keyword-analytics-visual-XspDmCrENBwXQzrBnVdD2H.webp";
const CONTENT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/ai-content-generation-aRDuHC7gHwMgLJAjFXjdyv.webp";
const DEPLOY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/deployment-visual-Df9Tr6zMZqCfL6CgepL5hz.webp";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/hero-dashboard-bg-4ZxYwSEJt8froqSKC2fNZb.webp";

const GALLERY_IMAGES: { id: number; src: string; title: string; keyword: string; style: string; size: string }[] = [];

// 스타일별 프롬프트 보조어
const STYLE_PROMPTS: Record<string, string> = {
  realistic: "photorealistic, 실사 사진, 고품질, 자연스러운 조명, DSLR 촬영",
  illustration: "디지털 일러스트, flat design, 깔끔한 벡터 스타일, 선명한 색상",
  infographic: "인포그래픽 디자인, 정보 시각화, 아이콘, 깔끔한 레이아웃, 화이트 배경",
  product: "제품 사진, 상업용 광고 사진, 화이트 배경, 깔끔한 조명, 고해상도",
};

// 통계 localStorage 관리
const STATS_KEY = "img_stats";
function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { todayCount: 0, todayDate: "", monthCount: 0, monthKey: "", times: [] as number[] };
    return JSON.parse(raw);
  } catch { return { todayCount: 0, todayDate: "", monthCount: 0, monthKey: "", times: [] as number[] }; }
}
function saveStats(stats: ReturnType<typeof loadStats>) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
}
function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function getMonthKey() { return new Date().toISOString().slice(0, 7); }

const STYLES = [
  { value: "realistic", label: "실사 사진", desc: "실물처럼 사실적인 이미지" },
  { value: "illustration", label: "일러스트", desc: "깔끔한 디지털 일러스트" },
  { value: "infographic", label: "인포그래픽", desc: "정보 전달 중심 디자인" },
  { value: "product", label: "제품 사진", desc: "상품 홍보용 이미지" },
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("서울 강남 맛집, 고급 레스토랑 내부, 아름다운 음식 플레이팅, 따뜻한 조명, 실사 사진");
  const [style, setStyle] = useState("realistic");
  const [size, setSize] = useState("1024x1024");
  const [count, setCount] = useState("4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [gallery, setGallery] = useState(GALLERY_IMAGES);

  // 실시간 통계 (localStorage)
  const [stats, setStats] = useState(() => {
    const s = loadStats();
    const today = getTodayKey();
    const month = getMonthKey();
    if (s.todayDate !== today) { s.todayCount = 0; s.todayDate = today; }
    if (s.monthKey !== month) { s.monthCount = 0; s.monthKey = month; }
    return s;
  });

  const avgTime = stats.times.length > 0
    ? (stats.times.slice(-10).reduce((a: number, b: number) => a + b, 0) / Math.min(stats.times.length, 10)).toFixed(1)
    : "0.0";

  const currentAI = IMAGE_AI_OPTIONS.find(o => o.value === getImageProvider());

  const handleGenerate = async () => {
    const provider = getImageProvider();
    const apiKey = getAPIKey(provider);
    // Pollinations는 API 키 불필요
    if (provider !== "pollinations" && !apiKey) {
      toast.error(`설정 페이지에서 ${currentAI?.label} API 키를 먼저 입력해주세요`);
      return;
    }
    if (!prompt.trim()) { toast.error("프롬프트를 입력해주세요"); return; }

    setIsGenerating(true);
    setProgress(0);
    toast.loading(`${currentAI?.label}로 이미지 생성 중...`, { id: "imggen" });

    const startTime = Date.now();
    const interval = setInterval(() => {
      setProgress(prev => prev >= 85 ? 85 : prev + Math.random() * 18);
    }, 500);

    // 스타일 프롬프트 합성
    const styleKeywords = STYLE_PROMPTS[style] || "";
    const fullPrompt = `${prompt.trim()}, ${styleKeywords}`;

    try {
      const resp = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey, prompt: fullPrompt, size, count: parseInt(count), style }),
      });

      clearInterval(interval);

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "API 오류");
      }

      const data = await resp.json();
      const images: string[] = data.images || [];

      if (images.length === 0) throw new Error("이미지 생성 결과가 없습니다");

      const elapsed = (Date.now() - startTime) / 1000;
      const genCount = images.length;

      // 통계 업데이트
      setStats(prev => {
        const updated = {
          ...prev,
          todayCount: prev.todayCount + genCount,
          monthCount: prev.monthCount + genCount,
          times: [...(prev.times || []), elapsed].slice(-20),
        };
        saveStats(updated);
        return updated;
      });

      const styleLabel = STYLES.find(s => s.value === style)?.label || style;
      const newItems = images.map((src, i) => ({
        id: Date.now() + i,
        src,
        title: `${prompt.slice(0, 20)}...`,
        keyword: prompt.slice(0, 15),
        style: styleLabel,
        size,
      }));

      setGallery(prev => [...newItems, ...prev]);
      setProgress(100);
      toast.success(`이미지 ${images.length}개 생성 완료!`, { id: "imggen" });
    } catch (e: any) {
      clearInterval(interval);
      toast.error(`생성 실패: ${e.message}`, { id: "imggen" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedImages(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              이미지 생성
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              글 내용에 맞는 실사 수준의 고품질 이미지를 AI로 자동 생성합니다
            </p>
          </div>
        </div>

        {/* Generation Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Controls */}
          <div
            className="lg:col-span-1 rounded-xl p-5 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h3 className="font-semibold text-foreground">이미지 설정</h3>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                프롬프트 (이미지 설명)
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="생성할 이미지를 상세히 설명하세요..."
                className="text-sm min-h-24 resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                이미지 스타일
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    className="rounded-lg p-2.5 text-left transition-all"
                    style={{
                      background: style === s.value ? "oklch(0.696 0.17 162.48 / 15%)" : "var(--background)",
                      border: `1px solid ${style === s.value ? "oklch(0.696 0.17 162.48 / 50%)" : "var(--border)"}`,
                    }}
                    onClick={() => setStyle(s.value)}
                  >
                    <div className="text-xs font-semibold text-foreground">{s.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                  해상도
                </label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512x512">512 × 512</SelectItem>
                    <SelectItem value="1024x1024">1024 × 1024</SelectItem>
                    <SelectItem value="1280x720">1280 × 720</SelectItem>
                    <SelectItem value="1920x1080">1920 × 1080</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                  생성 수량
                </label>
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1개</SelectItem>
                    <SelectItem value="2">2개</SelectItem>
                    <SelectItem value="4">4개</SelectItem>
                    <SelectItem value="8">8개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate button */}
            <Button
              className="w-full gap-2"
              style={{ background: isGenerating ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isGenerating ? "생성 중..." : `이미지 ${count}개 생성`}
            </Button>

            {isGenerating && (
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  <span>생성 진행률</span>
                  <span style={{ color: "var(--color-emerald)" }}>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Stats */}
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                생성 통계
              </div>
              {[
                { label: "오늘 생성", value: `${stats.todayCount}개` },
                { label: "이번달 총", value: `${stats.monthCount.toLocaleString()}개` },
                { label: "평균 생성 시간", value: `${avgTime}초` },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>{stat.label}</span>
                  <span className="font-medium text-foreground">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">이미지 갤러리</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full badge-active"
                  >
                    {gallery.length}개
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedImages.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => {
                        toast.success(`${selectedImages.length}개 이미지 다운로드`);
                        setSelectedImages([]);
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {selectedImages.length}개 다운로드
                    </Button>
                  )}
                  <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <button
                      className="p-2 transition-colors"
                      style={{ background: viewMode === "grid" ? "var(--primary)" : "transparent" }}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" style={{ color: viewMode === "grid" ? "white" : "var(--muted-foreground)" }} />
                    </button>
                    <button
                      className="p-2 transition-colors"
                      style={{ background: viewMode === "list" ? "var(--primary)" : "transparent" }}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" style={{ color: viewMode === "list" ? "white" : "var(--muted-foreground)" }} />
                    </button>
                  </div>
                </div>
              </div>

              {gallery.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Image className="w-10 h-10 opacity-20" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    아직 생성된 이미지가 없어요
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    왼쪽에서 프롬프트 입력 후 생성 버튼을 눌러주세요
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                  {gallery.map((img) => (
                    <div
                      key={img.id}
                      className="relative rounded-xl overflow-hidden cursor-pointer group"
                      style={{ aspectRatio: "1", border: `2px solid ${selectedImages.includes(img.id) ? "var(--color-emerald)" : "transparent"}` }}
                      onClick={() => toggleSelect(img.id)}
                    >
                      <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {selectedImages.includes(img.id) && (
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "var(--color-emerald)" }}
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-xs text-white font-medium truncate">{img.title}</div>
                        <div className="text-xs text-white/70">{img.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {gallery.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-4 p-4 hover:bg-accent/20 transition-colors cursor-pointer"
                      onClick={() => toggleSelect(img.id)}
                    >
                      <div
                        className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
                        style={{ border: `2px solid ${selectedImages.includes(img.id) ? "var(--color-emerald)" : "transparent"}` }}
                      >
                        <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{img.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs badge-active px-1.5 py-0.5 rounded">{img.style}</span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{img.size}</span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{img.keyword}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={(e) => { e.stopPropagation(); toast.success("이미지 다운로드 시작"); }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
