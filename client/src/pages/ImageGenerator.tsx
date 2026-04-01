/**
 * BlogAuto Pro - Image Generator Page
 * ✅ 실패 이미지 전체 재시도
 * ✅ 갤러리 초기화 버튼
 * ✅ 이미지 로딩 완전 수정 (실패시 재시도 포함)
 * ✅ 배포 연동 수정
 */

import { useState, useCallback, useEffect } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Image, RefreshCw, Download, Grid3X3, List, Wand2,
  Check, ArrowRight, Sparkles, CheckSquare, Square, ArrowLeft,
  X, ChevronLeft, ChevronRight, ZoomIn, Trash2, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getImageProvider, getAPIKey, IMAGE_AI_OPTIONS } from "@/lib/ai-config";
import { useLocation } from "wouter";

// ── 이미지 URL 로드 테스트 ──────────────────────────
async function testImageUrl(url: string, timeoutMs = 25000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const timer = setTimeout(() => { img.onload = null; img.onerror = null; resolve(false); }, timeoutMs);
    img.onload = () => { clearTimeout(timer); resolve(true); };
    img.onerror = () => { clearTimeout(timer); resolve(false); };
    img.src = url;
  });
}

// ── 한국어 → 영어 키워드 매핑 ──────────────────────
const KO_EN_MAP: Record<string, string> = {
  // 음식/맛집
  맛집: "restaurant food", 음식: "food", 요리: "cooking", 카페: "cafe coffee",
  빵: "bread bakery", 디저트: "dessert", 케이크: "cake", 커피: "coffee",
  // 여행
  여행: "travel", 관광: "tourism", 호텔: "hotel", 해외: "travel abroad",
  제주: "jeju island nature", 서울: "seoul city", 부산: "busan ocean",
  // 건강/뷰티
  건강: "health wellness", 다이어트: "diet fitness", 운동: "exercise gym",
  뷰티: "beauty makeup", 피부: "skincare beauty", 헤어: "hair salon",
  // 육아/가족
  육아: "parenting baby", 아이: "children family", 임신: "pregnancy",
  // 인테리어/생활
  인테리어: "interior design home", 집: "home house", 청소: "cleaning home",
  // 재테크/경제
  재테크: "investment finance", 주식: "stock market", 부동산: "real estate",
  돈: "money finance", 절약: "saving money",
  // IT/기술
  AI: "artificial intelligence technology", 앱: "mobile app technology",
  // 반려동물
  강아지: "dog puppy", 고양이: "cat kitten", 반려동물: "pet animal",
  // 패션
  패션: "fashion style", 옷: "fashion clothing", 쇼핑: "shopping",
  // 교육
  공부: "study education", 학원: "education learning", 영어: "english study",
  // 자연
  꽃: "flowers nature", 식물: "plant garden", 바다: "ocean sea beach",
  산: "mountain hiking nature", 숲: "forest nature",
};

// ── 프롬프트에서 영어 검색 키워드 추출 (한국어 지원) ──
function extractKeyword(prompt: string): string {
  // 1. 한국어 키워드 매핑 먼저 시도
  for (const [ko, en] of Object.entries(KO_EN_MAP)) {
    if (prompt.includes(ko)) return en;
  }
  // 2. 프롬프트에서 영어 단어 추출
  const englishWords = prompt
    .replace(/[,，。、]/g, " ")
    .split(" ")
    .filter(w => /^[a-zA-Z0-9]+$/.test(w) && w.length > 2)
    .slice(0, 3)
    .join(",");
  if (englishWords) return englishWords;
  // 3. 프롬프트 전체를 번역 키워드로 (기본값)
  return "lifestyle blog";
}

// ── 이미지 생성: Pollinations 우선, fallback은 키워드 기반 ──
async function generatePollinationsUrl(
  prompt: string, width: number, height: number, seed: number
): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  const ts = Date.now();

  // 1차: Pollinations AI - 3번 시도 (타임아웃 늘림)
  const seeds = [seed, seed + 7, seed + 13];
  for (const s of seeds) {
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${s}&model=flux&t=${ts + s}`;
    const ok = await testImageUrl(url, 25000);
    if (ok) return url;
  }

  // 2차: Unsplash - 키워드 매핑으로 관련 이미지
  const keyword = extractKeyword(prompt);
  const unsplashUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keyword)}&sig=${seed}`;
  const unsplashOk = await testImageUrl(unsplashUrl, 10000);
  if (unsplashOk) return unsplashUrl;

  // 3차: Pollinations 다른 모델 시도
  const altUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed + 99}&model=turbo&t=${ts + 99}`;
  const altOk = await testImageUrl(altUrl, 15000);
  if (altOk) return altUrl;

  // 4차: Picsum (완전 랜덤 - 최후 수단)
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

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

type ImgStatus = "loading" | "ok" | "error";

type GalleryItem = {
  id: number;
  src: string;
  title: string;
  keyword: string;
  style: string;
  size: string;
  loading: boolean;
  // 재시도를 위한 원본 정보 저장
  _prompt?: string;
  _w?: number;
  _h?: number;
  _seed?: number;
};

// ── 개별 이미지 카드 ──────────────────────────────────
function GalleryCard({
  img, isSelected, viewMode, onSelect, onLightbox, onRetry,
}: {
  img: GalleryItem;
  isSelected: boolean;
  viewMode: "grid" | "list";
  onSelect: () => void;
  onLightbox: () => void;
  onRetry: () => void;
}) {
  const [status, setStatus] = useState<ImgStatus>(img.loading ? "loading" : img.src ? "loading" : "error");

  useEffect(() => {
    if (img.loading) { setStatus("loading"); return; }
    if (!img.src) { setStatus("error"); return; }
    setStatus("loading"); // 새 src → 다시 로딩 시도
  }, [img.src, img.loading]);

  if (viewMode === "list") {
    return (
      <div
        className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
        style={{ border: `2px solid ${isSelected ? "var(--color-emerald)" : "var(--border)"}`, background: "var(--background)" }}
        onClick={status === "ok" ? onLightbox : undefined}
      >
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "oklch(0.696 0.17 162.48/8%)" }}>
            <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "var(--color-emerald)" }} />
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 cursor-pointer" onClick={onRetry}>
            <span className="text-xs font-semibold" style={{ color: "oklch(0.65 0.22 25)" }}>실패</span>
            <RotateCcw className="w-3 h-3" style={{ color: "oklch(0.65 0.22 25)" }} />
          </div>
        )}
        {img.src && !img.loading && (
          <img
            src={img.src}
            alt={img.title}
            className="w-full h-full object-cover"
            style={{ opacity: status === "ok" ? 1 : 0, transition: "opacity 0.3s" }}
            onLoad={() => setStatus("ok")}
            onError={() => setStatus("error")}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden group"
      style={{
        aspectRatio: "1",
        background: "var(--background)",
        border: `2px solid ${isSelected ? "var(--color-emerald)" : status === "error" ? "oklch(0.65 0.22 25/30%)" : "transparent"}`,
      }}
    >
      {/* 로딩 중 */}
      {(status === "loading") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
          style={{ background: "oklch(0.696 0.17 162.48/8%)" }}>
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "var(--color-emerald)" }} />
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {img.loading ? "생성 중..." : "불러오는 중..."}
          </span>
        </div>
      )}

      {/* 실패 */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
          style={{ background: "oklch(0.65 0.22 25/8%)" }}>
          <span className="text-xs font-semibold" style={{ color: "oklch(0.65 0.22 25)" }}>로드 실패</span>
          <button
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
            style={{ background: "var(--color-emerald)", color: "white" }}
            onClick={onRetry}
          >
            <RotateCcw className="w-3 h-3" /> 재시도
          </button>
        </div>
      )}

      {/* 실제 이미지 */}
      {img.src && !img.loading && (
        <img
          src={img.src}
          alt={img.title}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
          style={{ opacity: status === "ok" ? 1 : 0, transition: "opacity 0.4s ease" }}
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
          onClick={status === "ok" ? onLightbox : undefined}
        />
      )}

      {/* 성공시 오버레이 */}
      {status === "ok" && (
        <>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all pointer-events-none flex items-center justify-center z-20">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <button
            className="absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center z-30 transition-all"
            style={{ background: isSelected ? "var(--color-emerald)" : "rgba(0,0,0,0.55)", border: "2px solid rgba(255,255,255,0.8)" }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
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

  const [prompt, setPrompt] = useState(() => {
    // URL 파라미터(콘텐츠 생성에서 넘어온 키워드)가 있으면 항상 우선 적용
    if (autoPrompt) return autoPrompt;
    try { return JSON.parse(localStorage.getItem("imggen_state") || "{}").prompt || "서울 강남 맛집, 고급 레스토랑 내부, 아름다운 음식 플레이팅, 따뜻한 조명"; } catch { return "서울 강남 맛집, 고급 레스토랑 내부, 아름다운 음식 플레이팅, 따뜻한 조명"; }
  });
  const [style, setStyle] = useState(() => {
    try { return JSON.parse(localStorage.getItem("imggen_state") || "{}").style || "realistic"; } catch { return "realistic"; }
  });
  const [size, setSize] = useState(() => {
    try { return JSON.parse(localStorage.getItem("imggen_state") || "{}").size || "1024x1024"; } catch { return "1024x1024"; }
  });
  const [count, setCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem("imggen_state") || "{}").count || "4"; } catch { return "4"; }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("imggen_gallery") || "[]");
      // URL 이미지만 복원 (base64는 너무 큼)
      return saved.filter((g: GalleryItem) => g.src && !g.src.startsWith("data:"));
    } catch { return []; }
  });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  // 갤러리 변경시 localStorage 저장 (URL 이미지만)
  useEffect(() => {
    try {
      const toSave = gallery.filter(g => !g.loading && g.src && !g.src.startsWith("data:"));
      localStorage.setItem("imggen_gallery", JSON.stringify(toSave.slice(0, 50)));
    } catch {}
  }, [gallery]);

  // URL 파라미터로 넘어온 경우 prompt 강제 업데이트
  useEffect(() => {
    if (autoPrompt) setPrompt(autoPrompt);
  }, [autoPrompt]);

  // 설정 변경시 localStorage 저장
  useEffect(() => {
    try { localStorage.setItem("imggen_state", JSON.stringify({ prompt, style, size, count })); } catch {}
  }, [prompt, style, size, count]);

  const successGallery = gallery.filter(g => !g.loading && g.src);
  const lightboxImg = lightboxIndex !== null ? successGallery[lightboxIndex] ?? null : null;
  const loadedCount = successGallery.length;
  const loadingCount = gallery.filter(g => g.loading).length;
  // 실패한 항목: src 없고 loading도 아닌 것
  const failedItems = gallery.filter(g => !g.loading && !g.src);
  const failedCount = failedItems.length;

  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex(i => i !== null ? (i > 0 ? i - 1 : successGallery.length - 1) : null);
      if (e.key === "ArrowRight") setLightboxIndex(i => i !== null ? (i < successGallery.length - 1 ? i + 1 : 0) : null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, successGallery.length]);

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

  // ── 이미지 생성 공통 로직 ──────────────────────────
  const generateImages = async (
    numImages: number,
    fullPrompt: string,
    w: number,
    h: number,
    styleLabel: string,
    sizeStr: string,
    existingIds?: number[], // 재시도용: 기존 placeholder id 재사용
  ) => {
    const provider = getImageProvider();
    const startTime = Date.now();

    if (provider === "pollinations") {
      const placeholderIds = existingIds ?? Array.from({ length: numImages }, (_, i) => Date.now() + i);

      if (!existingIds) {
        // 신규 생성: placeholder 추가
        setGallery(prev => [
          ...placeholderIds.map(id => ({
            id, src: "", title: `${prompt.slice(0, 20)}...`,
            keyword: prompt.slice(0, 15), style: styleLabel, size: sizeStr,
            loading: true,
            _prompt: fullPrompt, _w: w, _h: h, _seed: Math.floor(Math.random() * 999999),
          })),
          ...prev,
        ]);
        setSelectedImages([]);
      } else {
        // 재시도: 기존 아이템을 loading 상태로 복원
        setGallery(prev => prev.map(item =>
          existingIds.includes(item.id) ? { ...item, src: "", loading: true } : item
        ));
      }

      let successCount = 0;
      for (let i = 0; i < numImages; i++) {
        const pid = placeholderIds[i];
        const seed = Math.floor(Math.random() * 999999) + i * 1000;
        try {
          const src = await generatePollinationsUrl(fullPrompt, w, h, seed);
          setGallery(prev => prev.map(item =>
            item.id === pid
              ? { ...item, src, loading: false, _prompt: fullPrompt, _w: w, _h: h, _seed: seed }
              : item
          ));
          successCount++;
          setProgress(Math.round(((i + 1) / numImages) * 100));
          toast.loading(`${i + 1}/${numImages}번째 완료 ✓`, { id: "imggen" });
        } catch {
          // src="" loading=false → 실패 상태
          setGallery(prev => prev.map(item =>
            item.id === pid ? { ...item, src: "", loading: false } : item
          ));
        }
      }

      const elapsed = (Date.now() - startTime) / 1000;
      setStats(prev => {
        const u = { ...prev, todayCount: prev.todayCount + successCount, monthCount: prev.monthCount + successCount, times: [...(prev.times || []), elapsed].slice(-20) };
        saveStats(u);
        return u;
      });

      if (successCount === 0) {
        toast.error("모든 이미지 생성 실패. Pollinations 서버 상태를 확인해주세요.", { id: "imggen" });
      } else {
        toast.success(`✅ ${successCount}개 완성! ${numImages - successCount > 0 ? `(${numImages - successCount}개 실패)` : ""}`, { id: "imggen" });
      }
      return successCount;
    } else {
      // 다른 API provider
      const apiKey = getAPIKey(provider);
      const interval = setInterval(() => setProgress(prev => prev >= 85 ? 85 : prev + Math.random() * 18), 500);
      try {
        const resp = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, apiKey, prompt: fullPrompt, size: sizeStr, count: numImages, style }),
        });
        clearInterval(interval);
        if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "API 오류"); }
        const data = await resp.json();
        const images: string[] = data.images || [];
        if (images.length === 0) throw new Error("이미지 생성 결과가 없습니다");
        const elapsed = (Date.now() - startTime) / 1000;
        setStats(prev => {
          const u = { ...prev, todayCount: prev.todayCount + images.length, monthCount: prev.monthCount + images.length, times: [...(prev.times || []), elapsed].slice(-20) };
          saveStats(u);
          return u;
        });
        setGallery(prev => [
          ...images.map((src, i) => ({ id: Date.now() + i, src, title: `${prompt.slice(0, 20)}...`, keyword: prompt.slice(0, 15), style: styleLabel, size: sizeStr, loading: false })),
          ...prev,
        ]);
        setProgress(100);
        toast.success(`이미지 ${images.length}개 완성!`, { id: "imggen" });
        return images.length;
      } catch (e: any) {
        clearInterval(interval);
        toast.error(`생성 실패: ${e.message}`, { id: "imggen" });
        return 0;
      }
    }
  };

  // ── 신규 생성 ──────────────────────────────────────
  const handleGenerate = async () => {
    const provider = getImageProvider();
    const apiKey = getAPIKey(provider);
    if (provider !== "pollinations" && !apiKey) { toast.error(`설정에서 ${currentAI?.label} API 키를 입력해주세요`); return; }
    if (!prompt.trim()) { toast.error("프롬프트를 입력해주세요"); return; }

    setIsGenerating(true);
    setProgress(0);
    const numImages = parseInt(count) || 1;
    const fullPrompt = `${prompt.trim()}, ${STYLE_PROMPTS[style] || ""}`;
    const [w, h] = (size || "1024x1024").split("x").map(Number);
    const styleLabel = STYLES.find(s => s.value === style)?.label || style;

    toast.loading(`이미지 ${numImages}개 생성 중...`, { id: "imggen" });
    await generateImages(numImages, fullPrompt, w || 1024, h || 1024, styleLabel, size);
    setIsGenerating(false);
  };

  // ── 실패 항목 전체 재시도 ─────────────────────────
  const handleRetryAll = async () => {
    const failed = gallery.filter(g => !g.loading && !g.src && g._prompt);
    if (failed.length === 0) { toast.info("재시도할 실패 이미지가 없어요"); return; }

    setIsRetrying(true);
    setProgress(0);
    toast.loading(`실패 이미지 ${failed.length}개 재시도 중...`, { id: "imggen" });

    // 실패 항목을 loading 상태로 복원
    setGallery(prev => prev.map(item =>
      failed.some(f => f.id === item.id) ? { ...item, loading: true, src: "" } : item
    ));

    let successCount = 0;
    for (let i = 0; i < failed.length; i++) {
      const item = failed[i];
      const seed = Math.floor(Math.random() * 999999) + i * 1000 + Date.now();
      try {
        const src = await generatePollinationsUrl(
          item._prompt!,
          item._w || 1024,
          item._h || 1024,
          seed
        );
        setGallery(prev => prev.map(g => g.id === item.id ? { ...g, src, loading: false, _seed: seed } : g));
        successCount++;
        setProgress(Math.round(((i + 1) / failed.length) * 100));
        toast.loading(`재시도 ${i + 1}/${failed.length} 완료`, { id: "imggen" });
      } catch {
        setGallery(prev => prev.map(g => g.id === item.id ? { ...g, loading: false, src: "" } : g));
      }
    }

    toast[successCount > 0 ? "success" : "error"](
      successCount > 0
        ? `✅ ${successCount}/${failed.length}개 복구 완료!`
        : "재시도도 실패했습니다. Pollinations 서버가 불안정해요.",
      { id: "imggen" }
    );
    setIsRetrying(false);
  };

  // ── 개별 이미지 재시도 ────────────────────────────
  const handleRetrySingle = async (id: number) => {
    const item = gallery.find(g => g.id === id);
    if (!item || !item._prompt) return;

    setGallery(prev => prev.map(g => g.id === id ? { ...g, loading: true, src: "" } : g));
    const seed = Math.floor(Math.random() * 999999) + Date.now();
    try {
      const src = await generatePollinationsUrl(item._prompt, item._w || 1024, item._h || 1024, seed);
      setGallery(prev => prev.map(g => g.id === id ? { ...g, src, loading: false, _seed: seed } : g));
      toast.success("이미지 복구 완료!");
    } catch {
      setGallery(prev => prev.map(g => g.id === id ? { ...g, loading: false, src: "" } : g));
      toast.error("재시도 실패. 잠시 후 다시 시도해주세요.");
    }
  };

  // ── 갤러리 초기화 ─────────────────────────────────
  const handleClearGallery = () => {
    setGallery([]);
    setSelectedImages([]);
    setShowClearConfirm(false);
    localStorage.removeItem("blogauto_deploy_images");
    toast.success("갤러리가 초기화되었습니다");
  };

  const handleSelectAll = () => {
    setSelectedImages(selectedImages.length === loadedCount && loadedCount > 0 ? [] : successGallery.map(g => g.id));
  };
  const toggleSelect = (id: number) => setSelectedImages(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  // ── 15개 제한 배포 이동 ───────────────────────────
  const MAX_DEPLOY = 15;

  const sendToDeploy = (images: GalleryItem[]) => {
    const final = images.slice(0, MAX_DEPLOY);
    try {
      localStorage.setItem("blogauto_deploy_images", JSON.stringify(
        final.map(i => ({ id: i.id, src: i.src, alt: i.title, title: i.title, style: i.style, size: i.size, loading: false }))
      ));
    } catch {
      localStorage.setItem("blogauto_deploy_images", JSON.stringify(
        final.filter(i => !i.src.startsWith("data:")).map(i => ({ id: i.id, src: i.src, alt: i.title, title: i.title, style: i.style, size: i.size, loading: false }))
      ));
    }
    toast.success(`이미지 ${final.length}개 배포 페이지로 이동합니다!`);
    navigate("/deploy?autoInsert=true");
  };

  const goToDeployWithImages = () => {
    if (loadedCount === 0) { toast.error("이미지를 먼저 생성해주세요"); return; }
    const toSend = selectedImages.length > 0
      ? successGallery.filter(g => selectedImages.includes(g.id))
      : successGallery;
    if (toSend.length <= MAX_DEPLOY) {
      sendToDeploy(toSend);
    } else {
      setShowDeployModal(true);
    }
  };


  const isBusy = isGenerating || isRetrying;

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">

        {/* ── 헤더 ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {fromContent && (
              <button onClick={() => navigate("/content")}
                className="flex items-center gap-1 text-sm hover:opacity-70 transition-opacity"
                style={{ color: "var(--muted-foreground)" }}>
                <ArrowLeft className="w-4 h-4" /> 글 생성으로
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>이미지 생성</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>AI로 블로그 본문에 들어갈 이미지를 생성합니다</p>
            </div>
          </div>
          {loadedCount > 0 && (
            <Button className="gap-2 px-5 h-10 font-semibold"
              style={{ background: "var(--color-emerald)", color: "white" }}
              onClick={goToDeployWithImages}>
              <Sparkles className="w-4 h-4" />
              {selectedImages.length > 0 ? `선택 ${selectedImages.length}개로` : `전체 ${loadedCount}개로`} 배포 진행
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── 설정 패널 ── */}
          <div className="lg:col-span-1 rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-foreground">이미지 설정</h3>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>프롬프트</label>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder="생성할 이미지를 상세히 설명하세요..." className="text-sm min-h-24 resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>이미지 스타일</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button key={s.value} className="rounded-lg p-2.5 text-left transition-all"
                    style={{
                      background: style === s.value ? "oklch(0.696 0.17 162.48/15%)" : "var(--background)",
                      border: `1px solid ${style === s.value ? "oklch(0.696 0.17 162.48/50%)" : "var(--border)"}`,
                    }}
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
                    <SelectItem value="10">10개</SelectItem>
                    <SelectItem value="15">15개 (블로그 최적)</SelectItem>
                    <SelectItem value="20">20개</SelectItem>
                    <SelectItem value="30">30개</SelectItem>
                    <SelectItem value="50">50개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 생성 버튼 */}
            <Button className="w-full gap-2"
              style={{ background: isBusy ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
              onClick={handleGenerate} disabled={isBusy}>
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isGenerating ? `생성 중... (${Math.round(progress)}%)` : `이미지 ${count}개 생성`}
            </Button>

            {/* 실패 재시도 버튼 */}
            {failedCount > 0 && !isBusy && (
              <Button className="w-full gap-2" variant="outline"
                style={{ borderColor: "oklch(0.769 0.188 70.08/60%)", color: "var(--color-amber-brand)" }}
                onClick={handleRetryAll}>
                <RotateCcw className="w-4 h-4" />
                실패 {failedCount}개 전체 재시도
              </Button>
            )}

            {/* 재시도 중 표시 */}
            {isRetrying && (
              <Button className="w-full gap-2" disabled
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                <RefreshCw className="w-4 h-4 animate-spin" />
                재시도 중... ({Math.round(progress)}%)
              </Button>
            )}

            {/* 진행률 */}
            {isBusy && (
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                  <span>{isRetrying ? "재시도 진행률" : "생성 진행률"}</span>
                  <span style={{ color: "var(--color-emerald)" }}>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs mt-2 text-center" style={{ color: "var(--muted-foreground)" }}>
                  ⏳ 갤러리에서 한 장씩 나타납니다
                </p>
              </div>
            )}

            {/* 생성 통계 */}
            <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>생성 통계</div>
              {[
                { label: "오늘 생성", value: `${stats.todayCount}개` },
                { label: "이번달 총", value: `${stats.monthCount.toLocaleString()}개` },
                { label: "평균 시간", value: `${avgTime}초` },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
                  <span className="font-medium text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 갤러리 ── */}
          <div className="lg:col-span-2 space-y-3">

            {/* 실패 알림 배너 */}
            {failedCount > 0 && !isBusy && (
              <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                style={{ background: "oklch(0.65 0.22 25/8%)", border: "1px solid oklch(0.65 0.22 25/30%)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "oklch(0.65 0.22 25)" }}>
                    ⚠ {failedCount}개 이미지 로드 실패
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Pollinations 서버가 불안정할 수 있어요
                  </span>
                </div>
                <button
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap"
                  style={{ background: "var(--color-emerald)", color: "white" }}
                  onClick={handleRetryAll}>
                  <RotateCcw className="w-3.5 h-3.5" /> 전체 재시도
                </button>
              </div>
            )}

            {gallery.length > 0 && (
              <div className="rounded-xl px-4 py-2.5 flex items-center justify-between"
                style={{ background: "oklch(0.696 0.17 162.48/8%)", border: "1px solid oklch(0.696 0.17 162.48/20%)" }}>
                <p className="text-xs" style={{ color: "var(--color-emerald)" }}>
                  🔍 이미지 클릭 → 크게 보기 &nbsp;|&nbsp; ☑ 체크박스 → 선택 &nbsp;|&nbsp; ESC / ← → 키보드
                </p>
              </div>
            )}

            <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {/* 갤러리 헤더 */}
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">이미지 갤러리</h3>
                  {loadingCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium animate-pulse"
                      style={{ background: "oklch(0.769 0.188 70.08/15%)", color: "var(--color-amber-brand)" }}>
                      ⏳ {loadingCount}개 생성 중
                    </span>
                  )}
                  {loadedCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)" }}>
                      ✓ {loadedCount}개
                    </span>
                  )}
                  {failedCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(0.65 0.22 25/15%)", color: "oklch(0.65 0.22 25)" }}>
                      ✗ {failedCount}개 실패
                    </span>
                  )}
                  {selectedImages.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "oklch(0.75 0.12 300/15%)", color: "oklch(0.75 0.12 300)" }}>
                      {selectedImages.length}개 선택
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* 전체 선택 */}
                  {loadedCount > 0 && (
                    <button
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                      style={{
                        background: selectedImages.length === loadedCount ? "oklch(0.696 0.17 162.48/15%)" : "var(--background)",
                        border: "1px solid var(--border)",
                        color: selectedImages.length === loadedCount ? "var(--color-emerald)" : "var(--muted-foreground)",
                      }}
                      onClick={handleSelectAll}>
                      {selectedImages.length === loadedCount && loadedCount > 0
                        ? <><CheckSquare className="w-3.5 h-3.5" /> 전체 해제</>
                        : <><Square className="w-3.5 h-3.5" /> 전체 선택</>}
                    </button>
                  )}
                  {/* 갤러리 초기화 */}
                  {gallery.length > 0 && !isBusy && (
                    <button
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "oklch(0.65 0.22 25/10%)", border: "1px solid oklch(0.65 0.22 25/30%)", color: "oklch(0.65 0.22 25)" }}
                      onClick={() => setShowClearConfirm(true)}>
                      <Trash2 className="w-3.5 h-3.5" /> 초기화
                    </button>
                  )}
                  {/* 뷰 모드 토글 */}
                  <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <button className="p-2" style={{ background: viewMode === "grid" ? "var(--primary)" : "transparent" }}
                      onClick={() => setViewMode("grid")}>
                      <Grid3X3 className="w-4 h-4" style={{ color: viewMode === "grid" ? "white" : "var(--muted-foreground)" }} />
                    </button>
                    <button className="p-2" style={{ background: viewMode === "list" ? "var(--primary)" : "transparent" }}
                      onClick={() => setViewMode("list")}>
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
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>왼쪽 설정에서 이미지를 생성해보세요</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                  {gallery.map((img) => (
                    <GalleryCard
                      key={img.id}
                      img={img}
                      isSelected={selectedImages.includes(img.id)}
                      viewMode="grid"
                      onSelect={() => toggleSelect(img.id)}
                      onLightbox={() => {
                        const idx = successGallery.findIndex(g => g.id === img.id);
                        if (idx !== -1) setLightboxIndex(idx);
                      }}
                      onRetry={() => handleRetrySingle(img.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {gallery.map((img) => (
                    <div key={img.id} className="flex items-center gap-4 p-4 hover:bg-accent/20 transition-colors">
                      <GalleryCard
                        img={img}
                        isSelected={selectedImages.includes(img.id)}
                        viewMode="list"
                        onSelect={() => toggleSelect(img.id)}
                        onLightbox={() => {
                          const idx = successGallery.findIndex(g => g.id === img.id);
                          if (idx !== -1) setLightboxIndex(idx);
                        }}
                        onRetry={() => handleRetrySingle(img.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{img.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)" }}>
                            {img.style}
                          </span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{img.size}</span>
                          {img.loading && <span className="text-xs" style={{ color: "var(--color-amber-brand)" }}>생성 중...</span>}
                          {!img.loading && !img.src && (
                            <span className="text-xs" style={{ color: "oklch(0.65 0.22 25)" }}>로드 실패</span>
                          )}
                        </div>
                      </div>
                      {!img.loading && img.src && (
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              background: selectedImages.includes(img.id) ? "var(--color-emerald)" : "var(--background)",
                              border: "1px solid var(--border)",
                            }}
                            onClick={() => toggleSelect(img.id)}>
                            {selectedImages.includes(img.id)
                              ? <Check className="w-4 h-4 text-white" />
                              : <Square className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />}
                          </button>
                          <Button variant="ghost" size="icon" className="w-8 h-8"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = img.src;
                              a.download = `blogauto-image-${img.id}.jpg`;
                              a.target = "_blank";
                              a.click();
                            }}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {!img.loading && !img.src && (
                        <button
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                          style={{ background: "oklch(0.769 0.188 70.08/15%)", color: "var(--color-amber-brand)", border: "1px solid oklch(0.769 0.188 70.08/30%)" }}
                          onClick={() => handleRetrySingle(img.id)}>
                          <RotateCcw className="w-3 h-3" /> 재시도
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loadedCount > 0 && (
              <Button className="w-full h-12 gap-2 text-base font-semibold"
                style={{ background: "var(--color-emerald)", color: "white" }}
                onClick={goToDeployWithImages}>
                <Sparkles className="w-5 h-5" />
                {selectedImages.length > 0
                  ? `선택한 ${selectedImages.length}개로 배포 진행 (15개 제한)`
                  : `전체 ${loadedCount}개 중 15개 선택 후 배포`}
                <ArrowRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 초기화 확인 다이얼로그 ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 mx-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.65 0.22 25/15%)", border: "1px solid oklch(0.65 0.22 25/30%)" }}>
                <Trash2 className="w-5 h-5" style={{ color: "oklch(0.65 0.22 25)" }} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">갤러리 초기화</h3>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              생성된 이미지 {gallery.length}개를 모두 삭제할까요?<br />
              배포 페이지에 전달된 이미지도 함께 초기화됩니다.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowClearConfirm(false)}>취소</Button>
              <Button className="flex-1 gap-2"
                style={{ background: "oklch(0.65 0.22 25)", color: "white" }}
                onClick={handleClearGallery}>
                <Trash2 className="w-4 h-4" /> 초기화
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 라이트박스 ── */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{ background: "rgba(255,255,255,0.15)" }}
            onClick={() => setLightboxIndex(null)}>
            <X className="w-5 h-5 text-white" />
          </button>
          {loadedCount > 1 && (
            <button className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center z-10"
              style={{ background: "rgba(255,255,255,0.15)" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i > 0 ? i - 1 : loadedCount - 1) : 0); }}>
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {loadedCount > 1 && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center z-10"
              style={{ background: "rgba(255,255,255,0.15)" }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null ? (i < loadedCount - 1 ? i + 1 : 0) : 0); }}>
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
          <div className="relative mx-16 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImg.src} alt={lightboxImg.title}
              className="w-full rounded-xl object-contain shadow-2xl"
              style={{ maxHeight: "75vh" }} />
            <div className="flex items-center justify-between mt-4 gap-3 px-1">
              <span className="text-white/50 text-sm">{lightboxIndex !== null ? lightboxIndex + 1 : 1} / {loadedCount}</span>
              <div className="text-center flex-1">
                <div className="text-white/70 text-sm">{lightboxImg.style} · {lightboxImg.size}</div>
              </div>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: selectedImages.includes(lightboxImg.id) ? "var(--color-emerald)" : "rgba(255,255,255,0.2)", color: "white" }}
                onClick={() => toggleSelect(lightboxImg.id)}>
                {selectedImages.includes(lightboxImg.id)
                  ? <><Check className="w-4 h-4" /> 선택됨</>
                  : <><Square className="w-4 h-4" /> 선택하기</>}
              </button>
            </div>
            <p className="text-center text-white/25 text-xs mt-2">← → 이전/다음 &nbsp;|&nbsp; ESC 닫기</p>
          </div>
        </div>
      )}

      {/* ── 15개 선택 배포 모달 ── */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div>
                <h2 className="font-bold text-foreground">배포할 이미지 15개 선택</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  네이버 블로그 최적: 15장 · 현재 {selectedImages.length}/15 선택됨
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedImages.length > 0 && selectedImages.length <= 15 && (
                  <Button className="gap-1.5 h-9"
                    style={{ background: "var(--color-emerald)", color: "white" }}
                    onClick={() => {
                      const toSend = successGallery.filter(g => selectedImages.includes(g.id));
                      setShowDeployModal(false);
                      sendToDeploy(toSend);
                    }}>
                    <Sparkles className="w-4 h-4" />
                    {selectedImages.length}개로 배포
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
                <button className="w-9 h-9 flex items-center justify-center rounded-xl"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                  onClick={() => setShowDeployModal(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 안내 배너 */}
            <div className="px-4 py-2 shrink-0"
              style={{ background: selectedImages.length === 15 ? "oklch(0.696 0.17 162.48/10%)" : selectedImages.length > 15 ? "oklch(0.65 0.22 25/10%)" : "oklch(0.769 0.188 70.08/10%)" }}>
              <p className="text-xs font-medium text-center"
                style={{ color: selectedImages.length === 15 ? "var(--color-emerald)" : selectedImages.length > 15 ? "oklch(0.65 0.22 25)" : "var(--color-amber-brand)" }}>
                {selectedImages.length === 0 && "이미지를 클릭해서 선택하세요 (최대 15개)"}
                {selectedImages.length > 0 && selectedImages.length < 15 && `${15 - selectedImages.length}개 더 선택 가능`}
                {selectedImages.length === 15 && "✅ 15개 선택 완료! 위 '배포' 버튼을 눌러주세요"}
                {selectedImages.length > 15 && `⚠ ${selectedImages.length - 15}개 초과 — 15개까지만 선택 가능합니다`}
              </p>
            </div>

            {/* 이미지 그리드 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {successGallery.map((img, idx) => {
                  const isSelected = selectedImages.includes(img.id);
                  const isDisabled = !isSelected && selectedImages.length >= 15;
                  return (
                    <div key={img.id}
                      className="relative rounded-xl overflow-hidden cursor-pointer transition-all"
                      style={{
                        aspectRatio: "1",
                        border: `3px solid ${isSelected ? "var(--color-emerald)" : "transparent"}`,
                        opacity: isDisabled ? 0.35 : 1,
                      }}
                      onClick={() => {
                        if (isDisabled) { toast.error("최대 15개까지 선택 가능합니다"); return; }
                        toggleSelect(img.id);
                      }}>
                      <img src={img.src} alt={img.title} className="w-full h-full object-cover" />
                      {/* 선택 번호 표시 */}
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white z-10"
                          style={{ background: "var(--color-emerald)" }}>
                          {selectedImages.indexOf(img.id) + 1}
                        </div>
                      )}
                      {!isSelected && !isDisabled && (
                        <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.6)" }}>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-center"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <span className="text-white/70 text-xs">{idx + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 하단 빠른 선택 */}
            <div className="px-4 py-3 border-t flex items-center gap-2 flex-wrap shrink-0"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>빠른 선택:</span>
              {[5, 10, 15].map(n => (
                <button key={n}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  onClick={() => {
                    const first = successGallery.slice(0, n).map(g => g.id);
                    setSelectedImages(first);
                  }}>
                  앞 {n}개
                </button>
              ))}
              <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                onClick={() => setSelectedImages([])}>
                전체 해제
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
