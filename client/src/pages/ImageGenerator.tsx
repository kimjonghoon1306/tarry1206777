/**
 * BlogAuto Pro - Image Generator Page
 * 라이트박스(이미지 크게 보기) + 로딩 스켈레톤 + 8개 지원 + 전체선택 + 자동 워크플로우
 */

import { useState, useCallback, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Image, RefreshCw, Download, Grid3X3, List, Wand2,
  Check, ArrowRight, Sparkles, CheckSquare, Square, ArrowLeft,
  X, ChevronLeft, ChevronRight, ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getImageProvider, getAPIKey, IMAGE_AI_OPTIONS } from "@/lib/ai-config";
import { fetchPollinationsImage } from "@/lib/ai-client";
import { useLocation } from "wouter";

const STYLE_PROMPTS: Record<string, string> = {
  realistic: "photorealistic, 실사 사진, 고품질, 자연스러운 조명, DSLR 촬영",
  illustration: "디지털 일러스트, flat design, 깔끔한 벡터 스타일, 선명한 색상",
  infographic: "인포그래픽 디자인, 정보 시각화, 아이콘, 깔끔한 레이아웃, 화이트 배경",
  product: "제품 사진, 상업용 광고 사진, 화이트 배경, 깔끔한 조명, 고해상도",
};
const STYLES = [
  { value: "realistic", label: "실사 사진", desc: "실물처럼 사실적인 이미지" },
  { value: "illustration", label: "일러스트", desc: "깔끔한 디지털 일러스트" },
  { value: "infographic", label: "인포그래픽", desc: "정보 전달 중심 디자인" },
  { value: "product", label: "제품 사진", desc: "상품 홍보용 이미지" },
];

const STATS_KEY = "img_stats";
function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { todayCount: 0, todayDate: "", monthCount: 0, monthKey: "", times: [] as number[] };
    return JSON.parse(raw);
  } catch { return { todayCount: 0, todayDate: "", monthCount: 0, monthKey: "", times: [] as number[] }; }
}
function saveStats(s: ReturnType<typeof loadStats>) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch {} }
function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function getMonthKey() { return new Date().toISOString().slice(0, 7); }

type GalleryItem = {
  id: number; src: string; title: string;
  keyword: string; style: string; size: string; loading: boolean;
};

// ── 개별 이미지 아이템 (자체 로딩 상태 관리) ──────────
function GalleryImageItem({
  img, isSelected, viewMode,
  onSelect, onLightbox,
}: {
  img: GalleryItem;
  isSelected: boolean;
  viewMode: "grid" | "list";
  onSelect: () => void;
  onLightbox: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // src가 바뀌면 로딩 상태 리셋
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [img.src]);

  if (viewMode === "list") {
    return (
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer relative"
        style={{ border: `2px solid ${isSelected ? "var(--color-emerald)" : "var(--border)"}`, background: "var(--background)" }}
        onClick={onLightbox}>
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center animate-pulse" style={{ background: "oklch(0.696 0.17 162.48/8%)" }}>
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--color-emerald)" }} />
          </div>
        )}
        {img.src && (
          <img src={img.src} alt={img.title} className="w-full h-full object-cover"
            style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)} />
        )}
        {imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>실패</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden group"
      style={{ aspectRatio: "1", background: "var(--background)", border: `2px solid ${isSelected ? "var(--color-emerald)" : "transparent"}` }}>
      
      {/* 로딩 중 (src 없거나 아직 로드 전) */}
      {(img.loading || (!imgLoaded && !imgError && img.src)) && (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 animate-pulse z-10"
          style={{ background: "oklch(0.696 0.17 162.48/8%)" }}>
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "var(--color-emerald)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {img.loading ? "생성 중..." : "불러오는 중..."}
          </span>
        </div>
      )}

      {/* 실제 이미지 */}
      {img.src && !img.loading && (
        <img src={img.src} alt={img.title}
          className="w-full h-full object-cover cursor-pointer transition-all group-hover:scale-105"
          style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(false); }}
          onClick={onLightbox} />
      )}

      {/* 로드 실패 */}
      {imgError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ background: "oklch(0.65 0.22 25/10%)" }}>
          <span className="text-xs" style={{ color: "oklch(0.65 0.22 25)" }}>이미지 로드 실패</span>
          <button className="text-xs px-2 py-1 rounded" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
            onClick={() => { setImgError(false); setImgLoaded(false); }}>
            재시도
          </button>
        </div>
      )}

      {/* 이미지 로드 완료 시 오버레이 */}
      {imgLoaded && (
        <>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all pointer-events-none flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <button className="absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center z-10 transition-all"
            style={{ background: isSelected ? "var(--color-emerald)" : "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.8)" }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="text-xs text-white/70">{img.style} · {img.size}</div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ImageGenerator() {
  const [, navigate] = useLocation();
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const autoPrompt = params?.get("prompt") || "";
  const fromContent = !!autoPrompt;

  const [prompt, setPrompt] = useState(autoPrompt || "서울 강남 맛집, 고급 레스토랑 내부, 아름다운 음식 플레이팅, 따뜻한 조명");
  const [style, setStyle] = useState("realistic");
  const [size, setSize] = useState("1024x1024");
  const [count, setCount] = useState("4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const loadedGallery = gallery.filter(g => !g.loading && g.src);
  const lightboxImg = lightboxIndex !== null ? loadedGallery[lightboxIndex] ?? null : null;
  const loadedCount = loadedGallery.length;
  const loadingCount = gallery.filter(g => g.loading).length;

  // 키보드 단축키 (라이트박스)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex(i => i !== null ? (i > 0 ? i - 1 : loadedGallery.length - 1) : null);
      if (e.key === "ArrowRight") setLightboxIndex(i => i !== null ? (i < loadedGallery.length - 1 ? i + 1 : 0) : null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, loadedGallery.length]);

  const [stats, setStats] = useState(() => {
    const s = loadStats();
    const today = getTodayKey(); const month = getMonthKey();
    if (s.todayDate !== today) { s.todayCount = 0; s.todayDate = today; }
    if (s.monthKey !== month) { s.monthCount = 0; s.monthKey = month; }
    return s;
  });

  const avgTime = stats.times.length > 0
    ? (stats.times.slice(-10).reduce((a: number, b: number) => a + b, 0) / Math.min(stats.times.length, 10)).toFixed(1)
    : "0.0";

  const currentAI = IMAGE_AI_OPTIONS.find(o => o.value === getImageProvider());

  const handleImageLoaded = useCallback((id: number) => {
    setGallery(prev => prev.map(item => item.id === id ? { ...item, loading: false } : item));
  }, []);
  const handleImageError = useCallback((id: number) => {
    setGallery(prev => prev.map(item => item.id === id ? { ...item, loading: false } : item));
  }, []);

  const handleGenerate = async () => {
    const provider = getImageProvider();
    const apiKey = getAPIKey(provider);
    if (provider !== "pollinations" && !apiKey) { toast.error(`설정에서 ${currentAI?.label} API 키를 입력해주세요`); return; }
    if (!prompt.trim()) { toast.error("프롬프트를 입력해주세요"); return; }

    setIsGenerating(true);
    setProgress(0);
    const startTime = Date.now();
    const fullPrompt = `${prompt.trim()}, ${STYLE_PROMPTS[style] || ""}`;
    const [w, h] = (size || "1024x1024").split("x").map(Number);

    if (provider === "pollinations") {
      const numImages = parseInt(count) || 1;
      toast.loading(`이미지 ${numImages}개 생성 중... (한 장씩 순서대로 나타납니다)`, { id: "imggen" });
      const styleLabel = STYLES.find(s => s.value === style)?.label || style;
      const placeholderIds = Array.from({ length: numImages }, (_, i) => Date.now() + i);
      setGallery(prev => [...placeholderIds.map(id => ({ id, src: "", title: `${prompt.slice(0, 20)}...`, keyword: prompt.slice(0, 15), style: styleLabel, size, loading: true })), ...prev]);
      setSelectedImages([]);

      let successCount = 0;
      for (let i = 0; i < numImages; i++) {
        const seed = Math.floor(Math.random() * 999999) + i * 1000;
        const pid = placeholderIds[i];
        try {
          const src = await fetchPollinationsImage(fullPrompt, w || 1024, h || 1024, seed);
          setGallery(prev => prev.map(item => item.id === pid ? { ...item, src, loading: false } : item));
          successCount++;
          setProgress(Math.round(((i + 1) / numImages) * 100));
          toast.loading(`${i + 1}/${numImages}번째 이미지 완료 ✓`, { id: "imggen" });
        } catch { setGallery(prev => prev.filter(item => item.id !== pid)); }
      }
      const elapsed = (Date.now() - startTime) / 1000;
      setStats(prev => { const u = { ...prev, todayCount: prev.todayCount + successCount, monthCount: prev.monthCount + successCount, times: [...(prev.times || []), elapsed].slice(-20) }; saveStats(u); return u; });
      toast[successCount === 0 ? "error" : "success"](successCount === 0 ? "이미지 생성 실패. 다시 시도해주세요." : `✅ 이미지 ${successCount}개 완성! 클릭하면 크게 볼 수 있어요`, { id: "imggen" });
    } else {
      const interval = setInterval(() => setProgress(prev => prev >= 85 ? 85 : prev + Math.random() * 18), 500);
      toast.loading(`${currentAI?.label}로 이미지 생성 중...`, { id: "imggen" });
      try {
        const resp = await fetch("/api/generate-image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey, prompt: fullPrompt, size, count: parseInt(count), style }) });
        clearInterval(interval);
        if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "API 오류"); }
        const data = await resp.json();
        const images: string[] = data.images || [];
        if (images.length === 0) throw new Error("이미지 생성 결과가 없습니다");
        const elapsed = (Date.now() - startTime) / 1000;
        setStats(prev => { const u = { ...prev, todayCount: prev.todayCount + images.length, monthCount: prev.monthCount + images.length, times: [...(prev.times || []), elapsed].slice(-20) }; saveStats(u); return u; });
        const styleLabel = STYLES.find(s => s.value === style)?.label || style;
        setGallery(prev => [...images.map((src, i) => ({ id: Date.now() + i, src, title: `${prompt.slice(0, 20)}...`, keyword: prompt.slice(0, 15), style: styleLabel, size, loading: false })), ...prev]);
        setProgress(100);
        toast.success(`이미지 ${images.length}개 생성 완료!`, { id: "imggen" });
      } catch (e: any) { clearInterval(interval); toast.error(`생성 실패: ${e.message}`, { id: "imggen" }); }
    }
    setIsGenerating(false);
  };

  const handleSelectAll = () => {
    setSelectedImages(selectedImages.length === loadedCount && loadedCount > 0 ? [] : loadedGallery.map(g => g.id));
  };
  const toggleSelect = (id: number) => setSelectedImages(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const goToDeployWithImages = () => {
    const toSend = selectedImages.length > 0 ? loadedGallery.filter(g => selectedImages.includes(g.id)) : loadedGallery;
    if (toSend.length === 0) { toast.error("이미지를 먼저 생성해주세요"); return; }
    try { localStorage.setItem("blogauto_deploy_images", JSON.stringify(toSend.map(i => ({ ...i, loading: false })))); }
    catch { localStorage.setItem("blogauto_deploy_images", JSON.stringify(toSend.map(i => ({ ...i, src: i.src.startsWith("data:") ? "" : i.src, loading: false })))); }
    toast.success(`이미지 ${toSend.length}개 전달 → 본문에 자동 삽입됩니다!`);
    navigate("/deploy?autoInsert=true"); // ← 배포관리에서 자동 이미지 삽입 트리거
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {fromContent && (
              <button onClick={() => navigate("/content")} className="flex items-center gap-1 text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--muted-foreground)" }}>
                <ArrowLeft className="w-4 h-4" /> 글 생성으로
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>이미지 생성</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>AI로 블로그 본문에 들어갈 이미지를 생성합니다</p>
            </div>
          </div>
          {loadedCount > 0 && (
            <Button className="gap-2 px-5 h-10 font-semibold" style={{ background: "var(--color-emerald)", color: "white" }} onClick={goToDeployWithImages}>
              <Sparkles className="w-4 h-4" />
              {selectedImages.length > 0 ? `선택 ${selectedImages.length}개로` : `전체 ${loadedCount}개로`} 배포 진행
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 설정 패널 */}
          <div className="lg:col-span-1 rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-foreground">이미지 설정</h3>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>프롬프트</label>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="생성할 이미지를 상세히 설명하세요..." className="text-sm min-h-24 resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>이미지 스타일</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button key={s.value} className="rounded-lg p-2.5 text-left transition-all"
                    style={{ background: style === s.value ? "oklch(0.696 0.17 162.48/15%)" : "var(--background)", border: `1px solid ${style === s.value ? "oklch(0.696 0.17 162.48/50%)" : "var(--border)"}` }}
                    onClick={() => setStyle(s.value)}>
                    <div className="text-xs font-semibold text-foreground">{s.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>해상도</label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512x512">512 × 512</SelectItem>
                    <SelectItem value="1024x1024">1024 × 1024</SelectItem>
                    <SelectItem value="1280x720">1280 × 720</SelectItem>
                    <SelectItem value="1920x1080">1920 × 1080</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>생성 수량</label>
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1개</SelectItem>
                    <SelectItem value="2">2개</SelectItem>
                    <SelectItem value="4">4개</SelectItem>
                    <SelectItem value="6">6개</SelectItem>
                    <SelectItem value="8">8개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full gap-2" style={{ background: isGenerating ? "var(--muted)" : "var(--color-emerald)", color: "white" }} onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isGenerating ? `생성 중... (${Math.round(progress)}%)` : `이미지 ${count}개 생성`}
            </Button>
            {isGenerating && (
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  <span>진행률</span><span style={{ color: "var(--color-emerald)" }}>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {loadingCount > 0 && <p className="text-xs mt-2 text-center" style={{ color: "var(--muted-foreground)" }}>⏳ 갤러리에서 한 장씩 나타납니다</p>}
              </div>
            )}
            <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>생성 통계</div>
              {[{ label: "오늘 생성", value: `${stats.todayCount}개` }, { label: "이번달 총", value: `${stats.monthCount.toLocaleString()}개` }, { label: "평균 시간", value: `${avgTime}초` }].map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
                  <span className="font-medium text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 갤러리 */}
          <div className="lg:col-span-2 space-y-3">
            {gallery.length > 0 && (
              <div className="rounded-xl px-4 py-2.5 flex items-center" style={{ background: "oklch(0.696 0.17 162.48/8%)", border: "1px solid oklch(0.696 0.17 162.48/20%)" }}>
                <p className="text-xs" style={{ color: "var(--color-emerald)" }}>
                  🔍 이미지 클릭 → 크게 보기 &nbsp;&nbsp;|&nbsp;&nbsp; ☑ 체크박스 → 선택 &nbsp;&nbsp;|&nbsp;&nbsp; ESC / ← → 키보드 지원
                </p>
              </div>
            )}
            <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">이미지 갤러리</h3>
                  {loadingCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium animate-pulse" style={{ background: "oklch(0.769 0.188 70.08/15%)", color: "var(--color-amber-brand)" }}>⏳ {loadingCount}개 생성 중</span>}
                  {loadedCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full badge-active">{loadedCount}개</span>}
                  {selectedImages.length > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)" }}>{selectedImages.length}개 선택됨</span>}
                </div>
                <div className="flex items-center gap-2">
                  {loadedCount > 0 && (
                    <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                      style={{ background: selectedImages.length === loadedCount ? "oklch(0.696 0.17 162.48/15%)" : "var(--background)", border: "1px solid var(--border)", color: selectedImages.length === loadedCount ? "var(--color-emerald)" : "var(--muted-foreground)" }}
                      onClick={handleSelectAll}>
                      {selectedImages.length === loadedCount && loadedCount > 0 ? <><CheckSquare className="w-3.5 h-3.5" /> 전체 해제</> : <><Square className="w-3.5 h-3.5" /> 전체 선택</>}
                    </button>
                  )}
                  <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <button className="p-2" style={{ background: viewMode === "grid" ? "var(--primary)" : "transparent" }} onClick={() => setViewMode("grid")}>
                      <Grid3X3 className="w-4 h-4" style={{ color: viewMode === "grid" ? "white" : "var(--muted-foreground)" }} />
                    </button>
                    <button className="p-2" style={{ background: viewMode === "list" ? "var(--primary)" : "transparent" }} onClick={() => setViewMode("list")}>
                      <List className="w-4 h-4" style={{ color: viewMode === "list" ? "white" : "var(--muted-foreground)" }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 갤러리 본체 */}
              {gallery.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Image className="w-10 h-10 opacity-20" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>아직 생성된 이미지가 없어요</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                  {gallery.map((img) => (
                    <GalleryImageItem
                      key={img.id}
                      img={img}
                      isSelected={selectedImages.includes(img.id)}
                      viewMode="grid"
                      onSelect={() => toggleSelect(img.id)}
                      onLightbox={() => {
                        const idx = loadedGallery.findIndex(g => g.id === img.id);
                        if (idx !== -1) setLightboxIndex(idx);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {gallery.map((img) => (
                    <div key={img.id} className="flex items-center gap-4 p-4 hover:bg-accent/20 transition-colors">
                      <GalleryImageItem
                        img={img}
                        isSelected={selectedImages.includes(img.id)}
                        viewMode="list"
                        onSelect={() => toggleSelect(img.id)}
                        onLightbox={() => {
                          if (!img.loading && img.src) {
                            const idx = loadedGallery.findIndex(g => g.id === img.id);
                            if (idx !== -1) setLightboxIndex(idx);
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{img.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs badge-active px-1.5 py-0.5 rounded">{img.style}</span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{img.size}</span>
                          {img.loading && <span className="text-xs" style={{ color: "var(--color-amber-brand)" }}>생성 중...</span>}
                        </div>
                      </div>
                      {!img.loading && img.src && (
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: selectedImages.includes(img.id) ? "var(--color-emerald)" : "var(--background)", border: "1px solid var(--border)" }}
                            onClick={() => toggleSelect(img.id)}>
                            {selectedImages.includes(img.id) ? <Check className="w-4 h-4 text-white" /> : <Square className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />}
                          </button>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => {
                            const a = document.createElement("a");
                            a.href = img.src;
                            a.download = `image-${img.id}.jpg`;
                            a.target = "_blank";
                            a.click();
                          }}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loadedCount > 0 && (
              <Button className="w-full h-12 gap-2 text-base font-semibold" style={{ background: "var(--color-emerald)", color: "white" }} onClick={goToDeployWithImages}>
                <Sparkles className="w-5 h-5" />
                {selectedImages.length > 0 ? `선택한 ${selectedImages.length}개 이미지로 배포 관리 진행` : `생성된 ${loadedCount}개 이미지 모두 배포 관리로 진행`}
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 라이트박스 ─────────────────────────────── */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setLightboxIndex(null)}>
          {/* 닫기 */}
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: "rgba(255,255,255,0.15)" }} onClick={() => setLightboxIndex(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
          {/* 이전 */}
          {loadedCount > 1 && (
            <button className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center z-10" style={{ background: "rgba(255,255,255,0.15)" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i > 0 ? i - 1 : loadedCount - 1) : 0); }}>
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {/* 다음 */}
          {loadedCount > 1 && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center z-10" style={{ background: "rgba(255,255,255,0.15)" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i < loadedCount - 1 ? i + 1 : 0) : 0); }}>
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
          {/* 이미지 + 하단 바 */}
          <div className="relative mx-16 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImg.src} alt={lightboxImg.title} className="w-full rounded-xl object-contain shadow-2xl" style={{ maxHeight: "75vh" }} />
            <div className="flex items-center justify-between mt-4 gap-3 px-1">
              <span className="text-white/50 text-sm">{lightboxIndex !== null ? lightboxIndex + 1 : 1} / {loadedCount}</span>
              <div className="text-center flex-1">
                <div className="text-white/70 text-sm">{lightboxImg.style} · {lightboxImg.size}</div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: selectedImages.includes(lightboxImg.id) ? "var(--color-emerald)" : "rgba(255,255,255,0.2)", color: "white" }}
                onClick={() => toggleSelect(lightboxImg.id)}>
                {selectedImages.includes(lightboxImg.id) ? <><Check className="w-4 h-4" /> 선택됨</> : <><Square className="w-4 h-4" /> 선택하기</>}
              </button>
            </div>
            <p className="text-center text-white/25 text-xs mt-2">← → 이전/다음 &nbsp;|&nbsp; ESC 닫기</p>
          </div>
        </div>
      )}
    </Layout>
  );
}
