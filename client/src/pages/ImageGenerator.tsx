import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  RefreshCw,
  Grid3X3,
  List,
  Trash2,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getImageProvider, getAPIKey, IMAGE_AI_OPTIONS } from "@/lib/ai-config";

type ImgStatus = "loading" | "ok" | "error";
type ViewMode = "grid" | "list";

type GalleryItem = {
  id: number;
  src: string;
  prompt: string;
  status: ImgStatus;
};

const STYLE_PRESETS: Record<string, string> = {
  realistic: "ultra realistic photography, professional lighting, detailed, high quality",
  commercial: "commercial advertising photo, polished, attractive, premium branding",
  lifestyle: "cozy lifestyle photography, warm tone, modern aesthetic, pinterest style",
  illustration: "digital illustration, clean composition, vivid color palette, artistic",
};

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [size, setSize] = useState("1024x1024");
  const [count, setCount] = useState("4");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [lang, setLang] = useState("ko");

  const provider = getImageProvider();
  const apiKey = getAPIKey(provider);

  const selectedCount = selectedIds.length;
  const progressValue = useMemo(() => {
    if (gallery.length === 0) return 0;
    const okCount = gallery.filter((item) => item.status === "ok").length;
    return Math.round((okCount / gallery.length) * 100);
  }, [gallery]);

  const buildPrompt = (raw: string) => {
    const cleaned = raw.trim();
    const styleText = STYLE_PRESETS[style] || STYLE_PRESETS.realistic;
    return `${cleaned}, ${styleText}`;
  };

  const updateStatus = (id: number, status: ImgStatus) => {
    setGallery((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const generateImages = async () => {
    const raw = prompt.trim();
    if (!raw) {
      toast.error("이미지 설명을 입력해주세요");
      return;
    }

    if (provider === "openai" && !apiKey) {
      toast.error("설정 페이지에서 OpenAI API 키를 먼저 입력해주세요");
      return;
    }

    setIsGenerating(true);

    try {
      const finalPrompt = buildPrompt(raw);
      const requestCount = Math.max(1, Math.min(4, Number(count) || 4));

      const resp = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          prompt: finalPrompt,
          size,
          count: requestCount,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error || "이미지 생성에 실패했습니다");
      }

      const urls: string[] = Array.isArray(data?.images) ? data.images : [];
      if (urls.length === 0) {
        throw new Error("생성된 이미지가 없습니다");
      }

      const now = Date.now();
      const items: GalleryItem[] = urls.map((src, index) => ({
        id: now + index,
        src,
        prompt: raw,
        status: "loading",
      }));

      setGallery((prev) => [...items, ...prev]);
      toast.success(`${items.length}개 이미지 생성을 시작했어요`);
    } catch (error: any) {
      toast.error(error?.message || "이미지 생성 실패");
    } finally {
      setIsGenerating(false);
    }
  };

  const retryOne = async (item: GalleryItem) => {
    setPrompt(item.prompt);
    toast.info("같은 프롬프트로 다시 생성합니다");

    try {
      const retryPrompt = buildPrompt(item.prompt);
      const resp = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          prompt: retryPrompt,
          size,
          count: 1,
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || "재시도 실패");

      const src = Array.isArray(data?.images) ? data.images[0] : "";
      if (!src) throw new Error("재시도 이미지가 없습니다");

      setGallery((prev) => prev.map((g) => (g.id === item.id ? { ...g, src, status: "loading" } : g)));
      toast.success("이미지를 다시 불러오는 중입니다");
    } catch (error: any) {
      toast.error(error?.message || "재시도 실패");
    }
  };

  const retryFailed = async () => {
    const failed = gallery.filter((item) => item.status === "error");
    if (failed.length === 0) {
      toast.info("실패한 이미지가 없습니다");
      return;
    }

    for (const item of failed) {
      // eslint-disable-next-line no-await-in-loop
      await retryOne(item);
    }
  };

  const clearGallery = () => {
    setGallery([]);
    setSelectedIds([]);
    toast.success("갤러리를 초기화했습니다");
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === gallery.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(gallery.map((item) => item.id));
  };

  const removeSelected = () => {
    if (selectedIds.length === 0) {
      toast.info("선택된 이미지가 없습니다");
      return;
    }
    setGallery((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
    toast.success("선택한 이미지를 삭제했습니다");
  };

  const downloadImage = async (src: string, id: number) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${id}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("이미지 다운로드 실패");
    }
  };

  return (
    <Layout currentLang={lang} onLangChange={setLang}>
      <div className="max-w-7xl mx-auto space-y-6 px-4 py-5 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--color-emerald), oklch(0.769 0.188 70.08))" }}
              >
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              이미지 생성
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
              설정에서 선택한 이미지 AI로 이미지를 생성합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-2xl p-5 space-y-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-foreground">이미지 설명</label>
              <Textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 고급스러운 카페 인테리어, 따뜻한 조명, 감성적인 분위기"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">스타일</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="스타일 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">실사 사진</SelectItem>
                  <SelectItem value="commercial">광고/상업</SelectItem>
                  <SelectItem value="lifestyle">라이프스타일</SelectItem>
                  <SelectItem value="illustration">일러스트</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">크기</label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="크기 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">1024 × 1024</SelectItem>
                    <SelectItem value="1024x1536">1024 × 1536</SelectItem>
                    <SelectItem value="1536x1024">1536 × 1024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">개수</label>
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="개수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1개</SelectItem>
                    <SelectItem value="2">2개</SelectItem>
                    <SelectItem value="4">4개</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={generateImages} disabled={isGenerating} className="gap-2">
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {isGenerating ? "생성 중..." : "생성"}
            </Button>

            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "oklch(1 0 0 / 4%)", color: "var(--muted-foreground)" }}>
              현재 AI: {IMAGE_AI_OPTIONS.find((item) => item.value === provider)?.label || provider}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-bold text-foreground">이미지 갤러리</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                총 {gallery.length}개 / 선택 {selectedCount}개
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAll} className="gap-2">
                {selectedIds.length === gallery.length && gallery.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                전체 선택
              </Button>
              <Button variant="outline" size="sm" onClick={retryFailed} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                실패 재시도
              </Button>
              <Button variant="outline" size="sm" onClick={removeSelected} className="gap-2">
                <Trash2 className="w-4 h-4" />
                선택 삭제
              </Button>
              <Button variant="outline" size="sm" onClick={clearGallery} className="gap-2">
                <Trash2 className="w-4 h-4" />
                초기화
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span>로드 성공률</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} />
          </div>

          {gallery.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{ background: "oklch(1 0 0 / 3%)", border: "1px dashed var(--border)" }}
            >
              <ImageIcon className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
              <div className="font-semibold text-foreground">아직 생성된 이미지가 없습니다</div>
              <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                설명을 입력하고 생성 버튼을 눌러주세요.
              </div>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
              {gallery.map((item) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={viewMode === "grid" ? "rounded-2xl overflow-hidden" : "rounded-2xl overflow-hidden flex gap-4 p-4"}
                    style={{
                      background: "oklch(1 0 0 / 3%)",
                      border: selected ? "1px solid var(--color-emerald)" : "1px solid var(--border)",
                    }}
                  >
                    <div className={viewMode === "grid" ? "relative" : "relative shrink-0 w-44"}>
                      <button
                        className="absolute top-3 left-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
                        onClick={() => toggleSelect(item.id)}
                      >
                        {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>

                      {item.status === "error" ? (
                        <div className="aspect-square flex flex-col items-center justify-center gap-4 text-center px-4" style={{ background: "rgba(120,0,0,0.18)" }}>
                          <div className="text-sm font-bold text-red-400">로드 실패</div>
                          <Button size="sm" onClick={() => retryOne(item)} className="gap-2">
                            <RefreshCw className="w-4 h-4" />
                            재시도
                          </Button>
                        </div>
                      ) : (
                        <img
                          src={item.src}
                          alt={item.prompt}
                          className={viewMode === "grid" ? "w-full aspect-square object-cover" : "w-44 h-44 object-cover rounded-xl"}
                          loading="lazy"
                          onLoad={() => updateStatus(item.id, "ok")}
                          onError={() => updateStatus(item.id, "error")}
                        />
                      )}
                    </div>

                    <div className={viewMode === "grid" ? "p-4 space-y-3" : "flex-1 space-y-3 py-1"}>
                      <div className="text-sm font-medium line-clamp-2 text-foreground">{item.prompt}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        상태: {item.status === "loading" ? "로딩 중" : item.status === "ok" ? "완료" : "실패"}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => retryOne(item)} className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          재시도
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => downloadImage(item.src, item.id)} className="gap-2">
                          <Download className="w-4 h-4" />
                          다운로드
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
