// BlogAuto Pro - ImageGenerator v3.1
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
import { getImageProvider, getAPIKey, IMAGE_AI_OPTIONS, getContentProvider } from "@/lib/ai-config";
import { useLocation } from "wouter";

// ── 이미지 URL 로드 테스트 ──────────────────────────
async function testImageUrl(url: string, timeoutMs = 12000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const done = (ok: boolean) => { clearTimeout(timer); img.onload = null; img.onerror = null; img.src = ""; resolve(ok); };
    const timer = setTimeout(() => done(false), timeoutMs);
    img.onload = () => done(true);
    img.onerror = () => done(false);
    img.src = url;
  });
}

// ── 한국어 → 영어 키워드 매핑 (확장판) ──────────────────────
const KO_EN_MAP: Record<string, string> = {
  // ── 부동산/주거 ──
  단기월세: "cozy studio apartment interior furniture city view, no people",
  주택가이드: "modern house exterior real estate neighborhood blue sky, no people",
  주택: "modern house exterior beautiful garden real estate, no people",
  아파트가이드: "luxury apartment building exterior modern architecture skyline, no people",
  전월세가이드: "apartment keys contract document real estate, no people",
  부동산가이드: "real estate property house for sale sign, no people",
  임대주택: "apartment complex residential building exterior, no people",
  원룸가이드: "cozy studio apartment interior minimal design, no people",
  월세: "apartment interior room keys rental document, no people",
  전세: "korean apartment lease contract document keys, no people",
  부동산: "real estate apartment building document keys, no people",
  아파트: "apartment building modern exterior architecture, no people",
  원룸: "studio apartment interior cozy minimal, no people",
  오피스텔: "officetel apartment interior modern, no people",
  빌라: "villa house exterior residential, no people",
  임대: "rental property apartment building sign, no people",
  분양: "new apartment complex building construction, no people",
  인테리어: "interior design home modern beautiful furniture, no people",
  리모델링: "home renovation interior remodel tools materials, no people",
  이사: "moving boxes cardboard packing tape, no people",
  전월세: "apartment contract document keys desk, no people",
  집: "home house interior cozy warm furniture, no people",
  방: "bedroom interior modern clean furniture, no people",
  // ── 음식/맛집 ──
  맛집: "delicious food dish gourmet plating restaurant table, no people",
  음식: "delicious food dish gourmet beautiful plating, no people",
  요리: "cooking ingredients vegetables cutting board kitchen tools, no people",
  카페: "cozy cafe coffee shop interior warm lighting cups, no people",
  빵: "fresh bread bakery artisan loaf pastry, no people",
  디저트: "dessert sweet cake pastry beautiful plate, no people",
  케이크: "celebration cake dessert beautiful slice, no people",
  커피: "coffee latte art cup cafe morning steam, no people",
  치킨: "crispy fried chicken korean food plate, no people",
  피자: "pizza italian food restaurant slice, no people",
  라면: "ramen noodle bowl hot steam korean, no people",
  삼겹살: "korean bbq pork belly grill smoke sizzling, no people",
  회: "sashimi japanese fresh fish seafood plate, no people",
  초밥: "sushi japanese restaurant fresh plate, no people",
  파스타: "pasta italian food restaurant plate, no people",
  브런치: "brunch cafe food table morning light plate, no people",
  술집: "bar drinks night glass bottles, no people",
  와인: "wine glass red white elegant bottle vineyard, no people",
  맥주: "beer mug glass cold refreshing foam, no people",
  막걸리: "korean traditional rice wine makgeolli bottle cup, no people",
  소주: "korean soju drink glass bottle table, no people",
  칵테일: "cocktail bar drink colorful glass, no people",
  스테이크: "steak beef grill plate fine dining, no people",
  햄버거: "hamburger burger fast food plate, no people",
  샐러드: "salad healthy fresh vegetables colorful bowl, no people",
  김치: "kimchi korean fermented food jar bowl, no people",
  // ── 여행 ──
  여행: "travel destination scenic beautiful landscape landmark, no people",
  관광: "tourism sightseeing famous landmark architecture, no people",
  호텔: "luxury hotel room interior elegant bed, no people",
  숙소: "accommodation cozy room interior bed, no people",
  해외여행: "international travel airplane airport passport suitcase, no people",
  국내여행: "domestic travel korea scenic nature, no people",
  제주: "jeju island scenic ocean cliffs korea nature, no people",
  서울: "seoul city skyline modern korea architecture, no people",
  부산: "busan beach ocean sunset korea, no people",
  강원: "gangwon mountains nature korea forest, no people",
  제주도: "jeju island beach volcanic landscape nature, no people",
  경주: "gyeongju historic temple korea architecture, no people",
  전주: "jeonju hanok village traditional korea architecture, no people",
  여수: "yeosu ocean night view korea bridge, no people",
  속초: "sokcho beach mountains east sea korea, no people",
  캠핑: "camping outdoor tent campfire nature stars, no people",
  글램핑: "glamping luxury tent outdoor nature, no people",
  펜션: "pension guesthouse cozy countryside exterior, no people",
  리조트: "resort pool luxury tropical exterior, no people",
  해변: "beach ocean waves sand summer sunset, no people",
  산: "mountain hiking trail scenic peak nature, no people",
  계곡: "valley stream nature cool water rocks, no people",
  // ── 건강/뷰티/다이어트 ──
  건강: "health wellness vitamins supplements healthy food, no people",
  다이어트: "diet healthy food vegetables scale measuring tape, no people",
  운동: "exercise equipment gym weights dumbbells, no people",
  헬스: "gym fitness equipment weights machines, no people",
  요가: "yoga mat meditation calm nature, no people",
  필라테스: "pilates equipment reformer exercise, no people",
  뷰티: "beauty makeup cosmetics products palette, no people",
  피부: "skincare face cream product bottles beauty, no people",
  헤어: "hair care products shampoo salon tools, no people",
  메이크업: "makeup beauty cosmetics products brush palette, no people",
  스킨케어: "skincare routine beauty products bottles cream, no people",
  탈모: "hair care treatment products scalp, no people",
  영양제: "supplements vitamins capsules pills health, no people",
  // ── 재테크/경제/금융 ──
  재테크: "coins stacked financial growth chart graph piggy bank, no people",
  주식: "stock market graph chart trading screen monitor, no people",
  코인: "cryptocurrency bitcoin gold coins digital, no people",
  돈: "money cash banknotes coins wallet, no people",
  절약: "coins jar saving money budget piggy bank, no people",
  대출: "bank building exterior loan document contract pen coins, no people",
  신용대출: "bank building credit card document financial paper, no people",
  부업: "laptop desk home office work tools, no people",
  ETF: "ETF investment chart graph financial document, no people",
  펀드: "fund investment chart portfolio document, no people",
  청약: "apartment application document form pen, no people",
  연금: "pension retirement savings coins calendar, no people",
  보험: "insurance document contract protection umbrella, no people",
  세금: "tax document finance accounting calculator, no people",
  경제: "economy finance graph chart growth, no people",
  금융: "financial bank building money coins chart, no people",
  신용점수: "credit score chart document financial, no people",
  카드: "credit card payment finance plastic, no people",
  // ── IT/기술 ──
  AI: "artificial intelligence circuit board technology digital, no people",
  챗GPT: "chatgpt AI interface laptop screen digital, no people",
  인공지능: "artificial intelligence technology circuit digital, no people",
  앱: "mobile app smartphone screen interface, no people",
  스마트폰: "smartphone mobile technology screen, no people",
  노트북: "laptop computer work desk keyboard, no people",
  컴퓨터: "computer desktop technology monitor setup, no people",
  유튜브: "youtube video content studio camera equipment, no people",
  블로그: "blog writing laptop desk workspace keyboard, no people",
  소셜미디어: "social media app icons phone screen, no people",
  게임: "gaming controller screen setup monitor, no people",
  코딩: "coding programming laptop dark screen code, no people",
  // ── 생활/육아/교육 ──
  육아: "baby toys nursery room crib stroller, no people",
  아이: "children toys playground equipment colorful, no people",
  임신: "pregnancy maternity baby items clothes, no people",
  출산: "newborn baby hospital items clothes, no people",
  청소: "cleaning supplies mop bucket spray, no people",
  정리: "organizing storage boxes shelves neat, no people",
  공부: "study books desk lamp stationery, no people",
  영어: "english learning books dictionary study desk, no people",
  취업: "job resume document briefcase office desk, no people",
  자격증: "certificate diploma document education, no people",
  대학생: "college campus books lecture hall study materials, no people",
  취준생: "resume document laptop study books, no people",
  // ── 자동차/교통 ──
  자동차: "car automobile exterior road highway, no people",
  중고차: "used car dealership lot exterior, no people",
  전기차: "electric vehicle car charging station, no people",
  오토바이: "motorcycle bike road exterior, no people",
  // ── 반려동물 ──
  강아지: "dog puppy cute playing toy bowl",
  고양이: "cat kitten cute indoor toy bowl",
  반려동물: "pet animal companion home toys food bowl",
  햄스터: "hamster small pet cage wheel cute",
  // ── 패션/쇼핑 ──
  패션: "fashion clothing outfit clothes rack display, no people",
  쇼핑: "shopping retail store bags display, no people",
  명품: "luxury brand fashion handbag display, no people",
  코디: "outfit coordination clothes display rack, no people",
  // ── 자연/계절 ──
  꽃: "flowers colorful nature bloom spring garden, no people",
  바다: "ocean sea beach waves sunset landscape, no people",
  숲: "forest trees nature green peaceful path, no people",
  봄: "spring flowers bloom nature cherry blossom, no people",
  여름: "summer beach ocean sun vacation, no people",
  가을: "autumn fall leaves colorful nature, no people",
  겨울: "winter snow cold white landscape, no people",
  // ── 기타 생활정보 ──
  정부지원: "government official document form pen desk, no people",
  지원금: "financial support benefit document money, no people",
  연말정산: "tax return document form calculator, no people",
  결혼: "wedding flowers decoration venue ceremony setup, no people",
  이혼: "legal document court paper pen, no people",
  취미: "hobby leisure activity tools materials, no people",
  독서: "reading books library shelf, no people",
  음악: "music instrument guitar piano headphones, no people",
  영화: "movie cinema popcorn screen ticket, no people",
  드라마: "tv entertainment remote screen couch, no people",
  // ── 비즈니스 ──
  창업: "startup business office desk equipment plan, no people",
  마케팅: "marketing digital strategy graph chart, no people",
  sns마케팅: "social media marketing content strategy icons, no people",
};



// ── 프롬프트에서 영어 검색 키워드 추출 (한국어 지원 강화) ──
function extractKeyword(prompt: string): string {
  // 1. 정확히 일치하는 한국어 키워드 매핑
  for (const [ko, en] of Object.entries(KO_EN_MAP)) {
    if (prompt.includes(ko)) return en;
  }
  // 2. 부분 일치 시도 (2글자 이상)
  const sorted = Object.keys(KO_EN_MAP).sort((a, b) => b.length - a.length);
  for (const ko of sorted) {
    if (ko.length >= 2 && prompt.includes(ko)) return KO_EN_MAP[ko];
  }
  // 3. 카테고리 자동 감지
  const p = prompt.toLowerCase();
  if (/맛집|음식|카페|식당|요리|레스토랑|먹|맛있/.test(p)) return "delicious food restaurant dining korean cuisine";
  if (/여행|관광|호텔|숙소|비행기|공항/.test(p)) return "travel destination scenic beautiful landscape";
  if (/건강|운동|다이어트|헬스|요가|필라테스/.test(p)) return "health fitness wellness lifestyle workout";
  if (/주식|코인|재테크|투자|돈|금융/.test(p)) return "investment finance money growth success";
  if (/강아지|고양이|반려/.test(p)) return "cute pet dog cat companion home";
  if (/패션|옷|코디|스타일/.test(p)) return "fashion style clothing trendy outfit";
  if (/아이|육아|아기|임신/.test(p)) return "family parenting baby children happy";
  if (/it|앱|ai|컴퓨터|스마트폰/.test(p)) return "technology digital innovation smartphone";
  if (/결혼|웨딩|신혼/.test(p)) return "wedding ceremony couple love celebration";
  if (/꽃|자연|봄|여름|가을|겨울/.test(p)) return "beautiful nature flowers seasons landscape";
  // 4. 영어 단어 추출
  const englishWords = prompt
    .replace(/[,，。、]/g, " ")
    .split(" ")
    .filter(w => /^[a-zA-Z0-9]+$/.test(w) && w.length > 2)
    .slice(0, 4)
    .join(" ");
  if (englishWords) return englishWords + " lifestyle blog photography";
  // 5. 기본값
  return "korean lifestyle blog beautiful photography";
}


// ── 이미지 생성: Pollinations URL 즉시 반환 (img 태그가 직접 로드) ──
function generatePollinationsUrl(
  prompt: string, width: number, height: number, seed: number
): string {
  const encoded = encodeURIComponent(prompt);
  // t= 캐시버스터 제거 → 브라우저 캐시 활용
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&enhance=true`;
}

const STYLE_PROMPTS: Record<string, string> = {
  // 실사 - 최상급 품질
  realistic: [
    "ultra realistic photography",
    "professional DSLR camera shot",
    "cinematic lighting",
    "8K ultra high resolution",
    "perfect composition rule of thirds",
    "sharp crisp focus",
    "magazine cover quality",
    "award winning photograph",
    "vivid rich colors",
    "professional retouching",
  ].join(", "),

  // 광고/상업 - 구매욕 자극
  commercial: [
    "luxury commercial advertisement photo",
    "mouth watering delicious",
    "desire inducing",
    "premium brand aesthetic",
    "soft bokeh background",
    "golden hour warm lighting",
    "appetizing fresh vibrant",
    "lifestyle marketing photo",
    "high end product photography",
  ].join(", "),

  // 인테리어/라이프스타일 - 살고싶은 느낌
  lifestyle: [
    "cozy lifestyle photography",
    "warm inviting atmosphere",
    "modern minimalist interior",
    "natural window light",
    "editorial interior design",
    "pinterest worthy aesthetic",
    "hygge cozy feeling",
    "architectural digest quality",
  ].join(", "),

  // 일러스트 - 감각적
  illustration: [
    "modern digital illustration",
    "vibrant color palette",
    "trendy flat design",
    "clean vector style",
    "instagram aesthetic",
    "contemporary graphic art",
  ].join(", "),
};

const STYLES = [
  { value: "realistic", label: "📸 실사 사진", desc: "최상급 퀄리티 리얼 사진" },
  { value: "commercial", label: "✨ 광고/상업", desc: "구매욕 자극하는 매력적 사진" },
  { value: "lifestyle", label: "🏠 라이프스타일", desc: "살고싶은 인테리어/일상" },
  { value: "illustration", label: "🎨 일러스트", desc: "감각적인 디지털 아트" },
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
  failed?: boolean;
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
    setStatus("loading"); // 새 src → img 태그가 onLoad 후 ok로 전환
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
  const maxImagesFromContent = params?.get("maxImages") ? parseInt(params.get("maxImages")!) : 0;

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
    // 콘텐츠에서 넘어온 경우 단락 기반 최적 수량으로 고정
    if (maxImagesFromContent > 0) return String(maxImagesFromContent);
    try { return JSON.parse(localStorage.getItem("imggen_state") || "{}").count || "4"; } catch { return "4"; }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedPrompt, setTranslatedPrompt] = useState("");
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
      const toSave = gallery.filter(g => !g.loading && g.src && !g.failed && !g.src.startsWith("data:"));
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

  useEffect(() => {
    if (maxImagesFromContent > 0) {
      setTimeout(() => {
        toast.info(`📊 이 글엔 ${maxImagesFromContent}장이 적합합니다`, { duration: 4000 });
      }, 500);
      setTimeout(() => {
        toast.info("✏️ 원하시면 수량을 임의로 변경하실 수 있어요", { duration: 4000 });
      }, 1500);
    }
  }, []);

  const successGallery = gallery.filter(g => !g.loading && !!g.src && !g.failed);
  const lightboxImg = lightboxIndex !== null ? successGallery[lightboxIndex] ?? null : null;
  const loadedCount = successGallery.length;
  const loadingCount = gallery.filter(g => g.loading).length;
  // 실패한 항목: src 없고 loading도 아닌 것
  const failedItems = gallery.filter(g => !g.loading && (g.failed || !g.src));
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
            loading: true, failed: false,
            _prompt: fullPrompt, _w: w, _h: h, _seed: Math.floor(Math.random() * 999999),
          })),
          ...prev,
        ]);
        setSelectedImages([]);
      } else {
        // 재시도: 기존 아이템을 loading 상태로 복원
        setGallery(prev => prev.map(item =>
          existingIds.includes(item.id) ? { ...item, src: "", loading: true, failed: false } : item
        ));
      }

      // Pollinations는 URL만 만든다고 끝이 아니라 실제 이미지 로드를 확인해야 함
      // 동시에 너무 많이 때리면 실패율이 올라가서 2개씩 배치로 검증
      let successCount = 0;
      const batchSize = 2;

      for (let start = 0; start < placeholderIds.length; start += batchSize) {
        const batch = placeholderIds.slice(start, start + batchSize);

        await Promise.all(
          batch.map(async (id, batchIndex) => {
            const globalIndex = start + batchIndex;
            const seed = Math.floor(Math.random() * 999999) + globalIndex * 1000 + Date.now();
            const src = generatePollinationsUrl(fullPrompt, w, h, seed);
            const ok = await testImageUrl(src, 15000);

            if (ok) successCount++;

            setGallery(prev => prev.map(item => {
              if (item.id !== id) return item;
              return {
                ...item,
                src: ok ? src : "",
                loading: false,
                failed: !ok,
                _prompt: fullPrompt,
                _w: w,
                _h: h,
                _seed: seed,
              };
            }));

            setProgress(Math.round(((globalIndex + 1) / numImages) * 100));
          })
        );
      }

      const elapsed = (Date.now() - startTime) / 1000;
      setStats(prev => {
        const u = {
          ...prev,
          todayCount: prev.todayCount + successCount,
          monthCount: prev.monthCount + successCount,
          times: [...(prev.times || []), elapsed].slice(-20),
        };
        saveStats(u);
        return u;
      });

      if (successCount > 0) {
        toast.success(`✅ ${successCount}개 이미지 생성 완료`, { id: "imggen" });
      } else {
        toast.error("이미지 로드에 모두 실패했습니다. 잠시 후 다시 시도해주세요.", { id: "imggen" });
      }
      return successCount;
    } else {
      // ── Replicate / Gemini / OpenAI ──
      const apiKey = getAPIKey(provider);
      const imgbbKey = getAPIKey("imgbb");
      const interval = setInterval(() => setProgress(prev => prev >= 85 ? 85 : prev + Math.random() * 8), 800);

      try {
        const allImages: string[] = [];

        // Replicate: 브라우저 직접 폴링 (Vercel 타임아웃 완전 우회)
        if (provider === "replicate") {
          const batchSize = 4;
          const batches = Math.ceil(numImages / batchSize);

          for (let b = 0; b < batches; b++) {
            const batchCount = Math.min(batchSize, numImages - b * batchSize);
            toast.loading(`이미지 생성 요청 중... (${b + 1}/${batches})`, { id: "imggen" });
            setProgress(Math.round((b / batches) * 30)); // 시작 시 진행률 표시

            // 1단계: 예측 시작 → prediction ID 받기
            const startResp = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider, apiKey, prompt: fullPrompt,
                size: sizeStr, count: batchCount, imgbbKey,
                action: "start",
              }),
            });
            if (!startResp.ok) {
              const err = await startResp.json();
              throw new Error(err.error || "API 오류");
            }
            const startData = await startResp.json();

            // 즉시 완료된 경우
            if (startData.done && startData.images?.length > 0) {
              allImages.push(...startData.images);
              setProgress(Math.round(((b + 1) / batches) * 90));
              continue;
            }

            // 2단계: 브라우저에서 직접 폴링 (최대 3분)
            const predictionId = startData.predictionId;
            if (!predictionId) throw new Error("Replicate 예측 ID를 받지 못했습니다");

            toast.loading(`이미지 생성 중... (${b + 1}/${batches}) ⏳`, { id: "imggen" });
            const deadline = Date.now() + 180000; // 3분
            let done = false;
            let pollCount = 0;
            while (Date.now() < deadline && !done) {
              await new Promise(r => setTimeout(r, 3000));
              pollCount++;
              // 폴링 중 progress 30~85% 사이로 서서히 올리기
              setProgress(Math.round((b / batches) * 85 + Math.min(pollCount * 5, 50)));
              const pollResp = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  provider, apiKey, imgbbKey,
                  action: "poll",
                  predictionId,
                }),
              });
              if (!pollResp.ok) continue;
              const pollData = await pollResp.json();

              if (pollData.status === "succeeded" && pollData.images?.length > 0) {
                allImages.push(...pollData.images);
                done = true;
              } else if (pollData.status === "failed") {
                throw new Error(pollData.error || "Replicate 생성 실패");
              }
            }
            if (!done) throw new Error("이미지 생성 시간이 너무 오래 걸립니다. 다시 시도해주세요.");
            setProgress(Math.round(((b + 1) / batches) * 90));
          }

        } else {
          // Gemini / OpenAI — 기존 방식
          for (let i = 0; i < numImages; i++) {
            if (i > 0) {
              toast.loading(`이미지 생성 중... (${allImages.length}/${numImages}개 완료)`, { id: "imggen" });
              await new Promise(r => setTimeout(r, 3000));
            }
            const resp = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider, apiKey, prompt: fullPrompt, size: sizeStr, count: 1, imgbbKey }),
            });
            if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "API 오류"); }
            const data = await resp.json();
            allImages.push(...(data.images || []));
          }
        }

        clearInterval(interval);
        if (allImages.length === 0) throw new Error("이미지 생성 결과가 없습니다");
        const elapsed = (Date.now() - startTime) / 1000;
        setStats(prev => {
          const u = { ...prev, todayCount: prev.todayCount + allImages.length, monthCount: prev.monthCount + allImages.length, times: [...(prev.times || []), elapsed].slice(-20) };
          saveStats(u);
          return u;
        });
        setGallery(prev => [
          ...allImages.map((src, i) => ({ id: Date.now() + i, src, title: `${prompt.slice(0, 20)}...`, keyword: prompt.slice(0, 15), style: styleLabel, size: sizeStr, loading: false, failed: false })),
          ...prev,
        ]);
        setProgress(100);
        toast.success(`이미지 ${allImages.length}개 완성!`, { id: "imggen" });
        return allImages.length;
      } catch (e: any) {
        clearInterval(interval);
        let msg = e.message || "";
        if (msg.includes("429") || msg.includes("throttled") || msg.includes("rate limit")) {
          msg = "요청이 너무 빨라요. 잠시 후 다시 시도해주세요.";
        } else if (msg.includes("402") || msg.includes("credit")) {
          msg = "Replicate 크레딧이 부족해요. replicate.com에서 충전해주세요.";
        } else if (msg.includes("401")) {
          msg = "API 키가 잘못됐어요. 설정을 확인해주세요.";
        }
        toast.error(`생성 실패: ${msg}`, { id: "imggen" });
        return 0;
      }
    }
  };

  // ── 신규 생성 ──────────────────────────────────────
  // 한국어 → 영어 이미지 프롬프트 자동 변환
  // ── 한국어 → 영어 이미지 프롬프트 자동 변환 ──────────────
  // 전용 translate-prompt API 사용 → 어떤 주제든 정확하게 변환
  const autoTranslatePrompt = async (koreanPrompt: string): Promise<string> => {
    const p = koreanPrompt.trim();
    const NP = "no people, no portrait, no face, object focused";

    // 이미 영문이면 그대로 + no people 추가
    if (!/[가-힣]/.test(p)) {
      return `${p}, ${NP}, professional photography, 8K ultra realistic`;
    }

    const baseKeyword = autoKeyword.trim() || p;

    // ── Step 1: 전용 번역 API ───────────
    const aiProvider = getContentProvider();
    const aiKey = getAPIKey(aiProvider);
    if (aiKey) {
      try {
        const resp = await fetch("/api/translate-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: aiProvider, apiKey: aiKey, topic: baseKeyword }),
        });
        const data = await resp.json();
        if (data.ok && data.prompt && data.prompt.length > 5) {
          return `${data.prompt}, ${NP}, professional photography, 8K ultra realistic`;
        }
      } catch {}
    }

    // ── Step 2: KO_EN_MAP 매핑 (길이 긴 것 우선) ───────────────────
    const sortedEntries = Object.entries(KO_EN_MAP).sort((a, b) => b[0].length - a[0].length);
    for (const [ko, en] of sortedEntries) {
      if (baseKeyword.includes(ko) || p.includes(ko)) {
        return `${en}, professional photography, natural lighting, 8K ultra realistic`;
      }
    }

    // ── Step 3: 카테고리 폴백 (no people 적용) ──────────────────────
    const target = baseKeyword + " " + p;
    if (/절약|저축|재테크|투자|사회초년생|직장인|월급|금융|경제|대출|신용/.test(target))
      return `coins stacked piggy bank savings jar financial document, ${NP}, professional photography, 8K`;
    if (/맛집|음식|카페|식당|요리|커피|치킨|스테이크|라면/.test(target))
      return `delicious Korean food beautiful plating restaurant table, ${NP}, professional photography, 8K`;
    if (/여행|관광|제주|부산|호텔|해외/.test(target))
      return `beautiful travel destination landscape scenic view golden hour, ${NP}, professional photography, 8K`;
    if (/다이어트|운동|헬스|요가|건강|피트니스/.test(target))
      return `gym equipment weights healthy food vegetables, ${NP}, professional photography, 8K`;
    if (/패션|뷰티|스킨케어|메이크업|옷/.test(target))
      return `cosmetics products skincare bottles beauty items, ${NP}, professional photography, 8K`;
    if (/육아|아이|아기|가족/.test(target))
      return `baby toys nursery room stroller crib, ${NP}, professional photography, 8K`;
    if (/IT|앱|AI|테크|컴퓨터|블로그/.test(target))
      return `laptop screen code monitor technology desk, ${NP}, professional photography, 8K`;
    if (/취업|공부|학생|수능/.test(target))
      return `study books desk lamp stationery notebook, ${NP}, professional photography, 8K`;
    if (/강아지|고양이|반려동물/.test(target))
      return `dog puppy cat kitten playing toy bowl cute`;
    if (/인테리어|집|거실|홈|부동산|아파트/.test(target))
      return `modern interior design living room minimalist aesthetic, ${NP}, professional photography, 8K`;

    // 완전 최후 수단
    return `informational blog object still life clean background, ${NP}, professional photography, 8K`;
  };


  const handleGenerate = async () => {
    const provider = getImageProvider();
    const apiKey = getAPIKey(provider);
    if (provider !== "pollinations" && !apiKey) { 
      toast.error(`설정에서 ${currentAI?.label} API 키를 입력해주세요`); 
      return; 
    }
    if (!prompt.trim()) { toast.error("프롬프트를 입력해주세요"); return; }

    setIsGenerating(true);
    setProgress(0);
    const numImages = parseInt(count) || 1;

    // 한국어 자동 번역 (이미 번역된 것 있으면 사용)
    const translated = translatedPrompt || await autoTranslatePrompt(prompt.trim());
    setTranslatedPrompt(translated);
    const qualityBoost = "professional photography, stunning visual, highly detailed, perfect lighting";
    const fullPrompt = `${translated}, ${STYLE_PROMPTS[style] || STYLE_PROMPTS.realistic}, ${qualityBoost}`;
    const [w, h] = (size || "1024x1024").split("x").map(Number);
    const styleLabel = STYLES.find(s => s.value === style)?.label || style;

    toast.loading(`이미지 ${numImages}개 생성 중...`, { id: "imggen" });
    await generateImages(numImages, fullPrompt, w || 1024, h || 1024, styleLabel, size);
    setIsGenerating(false);
  };

  // ── 실패 항목 전체 재시도 ─────────────────────────
  const handleRetryAll = async () => {
    const failed = gallery.filter(g => !g.loading && (g.failed || !g.src) && g._prompt);
    if (failed.length === 0) { toast.info("재시도할 실패 이미지가 없어요"); return; }

    setIsRetrying(true);
    setProgress(0);
    toast.loading(`실패 이미지 ${failed.length}개 재시도 중...`, { id: "imggen" });

    // 실패 항목을 loading 상태로 복원
    setGallery(prev => prev.map(item =>
      failed.some(f => f.id === item.id) ? { ...item, loading: true, src: "", failed: false } : item
    ));

    let successCount = 0;
    const batchSize = 2;

    for (let start = 0; start < failed.length; start += batchSize) {
      const batch = failed.slice(start, start + batchSize);

      await Promise.all(
        batch.map(async (item, batchIndex) => {
          const globalIndex = start + batchIndex;
          const seed = Math.floor(Math.random() * 999999) + globalIndex * 1000 + Date.now();
          const src = generatePollinationsUrl(
            item._prompt!,
            item._w || 1024,
            item._h || 1024,
            seed
          );
          const ok = await testImageUrl(src, 15000);

          if (ok) successCount++;

          setGallery(prev => prev.map(g => g.id === item.id ? {
            ...g,
            src: ok ? src : "",
            loading: false,
            failed: !ok,
            _seed: seed
          } : g));

          setProgress(Math.round(((globalIndex + 1) / failed.length) * 100));
        })
      );
    }

    toast[successCount > 0 ? "success" : "error"](
      successCount > 0
        ? `✅ ${successCount}/${failed.length}개 복구 완료!`
        : "재시도 후에도 이미지 로드에 실패했습니다. 잠시 후 다시 시도해주세요.",
      { id: "imggen" }
    );
    setIsRetrying(false);
  };

  // ── 개별 이미지 재시도 ────────────────────────────
  const handleRetrySingle = async (id: number) => {
    const item = gallery.find(g => g.id === id);
    if (!item || !item._prompt) return;

    setGallery(prev => prev.map(g => g.id === id ? { ...g, loading: true, src: "", failed: false } : g));
    const seed = Math.floor(Math.random() * 999999) + Date.now();

    const src = generatePollinationsUrl(item._prompt, item._w || 1024, item._h || 1024, seed);
    const ok = await testImageUrl(src, 15000);

    if (ok) {
      setGallery(prev => prev.map(g => g.id === id ? { ...g, src, loading: false, failed: false, _seed: seed } : g));
      toast.success("이미지 복구 완료!");
    } else {
      setGallery(prev => prev.map(g => g.id === id ? { ...g, loading: false, src: "", failed: true } : g));
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
            <Button className="hidden sm:flex gap-2 px-5 h-10 font-semibold"
              style={{ background: "var(--color-emerald)", color: "white" }}
              onClick={goToDeployWithImages}>
              <Sparkles className="w-4 h-4" />
              {selectedImages.length > 0 ? `선택 ${selectedImages.length}개로` : `전체 ${loadedCount}개로`} 배포 진행
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── 설정 패널 — 모바일에서 숨기고 데스크탑만 표시 ── */}
          <div className="hidden lg:block lg:col-span-1 rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-foreground">이미지 설정</h3>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>프롬프트</label>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)" }}>
                  {/[가-힣]/.test(prompt) ? "한글 → 자동 영문 변환" : "영문 직접 입력"}
                </span>
              </div>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                placeholder="키워드 또는 영문 프롬프트 입력&#10;예) 사회초년생 절약&#10;또는) young professional saving money, desk, warm lighting"
                className="text-sm min-h-28 resize-none" />
              {/[가-힣]/.test(prompt) && (
                <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                  💡 한글 입력 시 AI가 자동으로 영문 이미지 프롬프트로 변환해요
                </p>
              )}
              {translatedPrompt && (
                <div className="mt-2">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#10b981" }}>🔤 변환된 영문 프롬프트 (수정 가능)</label>
                  <textarea
                    value={translatedPrompt}
                    onChange={e => setTranslatedPrompt(e.target.value)}
                    className="w-full text-xs rounded-lg p-2.5 resize-none font-mono"
                    rows={3}
                    style={{ background: "var(--background)", border: "1px solid #10b98150", color: "var(--foreground)" }}
                  />
                </div>
              )}
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
                {maxImagesFromContent > 0 && (
                  <p className="text-xs mb-1.5" style={{ color: "oklch(0.75 0.12 300)" }}>
                    💡 글 기준 추천: {maxImagesFromContent}개 (변경 가능)
                  </p>
                )}
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1개</SelectItem>
                    <SelectItem value="4">4개</SelectItem>
                    <SelectItem value="8">8개</SelectItem>
                    <SelectItem value="10">10개</SelectItem>
                    <SelectItem value="15">15개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── 메인 생성 버튼 ── */}
            <button
              className="w-full relative overflow-hidden rounded-2xl font-bold text-white transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                height: 56,
                background: isBusy
                  ? "var(--muted)"
                  : "linear-gradient(135deg, oklch(0.35 0.12 162) 0%, oklch(0.5 0.18 162) 100%)",
                boxShadow: isBusy ? "none" : "0 8px 32px oklch(0.5 0.18 162 / 50%), 0 2px 8px oklch(0.5 0.18 162 / 30%)",
              }}
              onClick={handleGenerate}
              disabled={isBusy}>
              {!isBusy && (
                <div className="absolute inset-0 opacity-20"
                  style={{ background: "linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)", transform: "skewX(-20deg) translateX(-100%)", animation: "shimmer 3s infinite" }} />
              )}
              <div className="flex items-center justify-center gap-2.5 relative z-10">
                {isGenerating
                  ? <><RefreshCw className="w-5 h-5 animate-spin" /><span className="text-base">생성 중... {Math.round(progress)}%</span></>
                  : <><Wand2 className="w-5 h-5" /><span className="text-base">✨ 이미지 {count}개 생성하기</span></>
                }
              </div>
            </button>

            {/* ── 발행하기 버튼 ── */}
            {loadedCount > 0 && !isBusy && (
              <button
                className="w-full relative overflow-hidden rounded-2xl font-bold text-white transition-all active:scale-[0.97]"
                style={{
                  height: 52,
                  background: "linear-gradient(135deg, oklch(0.55 0.22 320) 0%, oklch(0.45 0.25 340) 100%)",
                  boxShadow: "0 8px 28px oklch(0.55 0.22 320 / 50%)",
                  animation: "pulse-glow 2s ease-in-out infinite",
                }}
                onClick={goToDeployWithImages}>
                <div className="flex items-center justify-center gap-2.5 relative z-10">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-base">
                    🚀 {selectedImages.length > 0 ? `선택 ${selectedImages.length}개` : `전체 ${loadedCount}개`} 발행하기
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            )}

            {/* 실패 재시도 버튼 */}
            {failedCount > 0 && !isBusy && (
              <button
                className="w-full rounded-2xl font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                style={{
                  height: 44,
                  background: "oklch(0.75 0.18 350)",
                  border: "none",
                  color: "white",
                  boxShadow: "0 4px 16px oklch(0.75 0.18 350 / 40%)",
                }}
                onClick={handleRetryAll}>
                <RotateCcw className="w-4 h-4" />
                실패 {failedCount}개 전체 재시도
              </button>
            )}

            {/* 재시도 중 */}
            {isRetrying && (
              <button disabled
                className="w-full rounded-2xl font-semibold flex items-center justify-center gap-2"
                style={{ height: 44, background: "var(--muted)", color: "var(--muted-foreground)" }}>
                <RefreshCw className="w-4 h-4 animate-spin" />
                재시도 중... {Math.round(progress)}%
              </button>
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
          {/* ── 갤러리 — 모바일 full width, 데스크탑 2/3 ── */}
          <div className="lg:col-span-2 space-y-3 col-span-1">

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
                  style={{ background: "oklch(0.75 0.18 350)", color: "white" }}
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

      {/* ── 모바일 하단 고정 바 ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 flex gap-2"
        style={{ background: "var(--background)", borderTop: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
        <button
          className="flex-1 h-12 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 relative overflow-hidden"
          style={{
            background: isBusy ? "var(--muted)" : "linear-gradient(135deg, oklch(0.35 0.12 162), oklch(0.5 0.18 162))",
            boxShadow: isBusy ? "none" : "0 4px 16px oklch(0.5 0.18 162 / 40%)",
          }}
          onClick={handleGenerate}
          disabled={isBusy}>
          {isGenerating
            ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>생성 중... {Math.round(progress)}%</span></>
            : <><Wand2 className="w-4 h-4" /><span>✨ {count}개 생성</span></>
          }
        </button>
        {loadedCount > 0 && (
          <button
            className="flex-1 h-12 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.22 320), oklch(0.45 0.25 340))",
              boxShadow: "0 4px 16px oklch(0.55 0.22 320 / 40%)",
            }}
            onClick={goToDeployWithImages}>
            <Sparkles className="w-4 h-4" />
            <span>🚀 {selectedImages.length > 0 ? `${selectedImages.length}개` : `${loadedCount}개`} 발행</span>
          </button>
        )}
      </div>

      {/* 모바일 하단바 여백 */}
      <div className="lg:hidden h-20" />

    </Layout>
  );
}

