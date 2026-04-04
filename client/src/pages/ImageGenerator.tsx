import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import {
  Wand2,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Download,
  Settings2,
  Sparkles,
  Gauge,
  Rows3,
  Grid3X3,
  Palette,
  MonitorSmartphone,
} from "lucide-react";

type ImageStatus = "loading" | "success" | "error";

interface GalleryItem {
  id: string;
  prompt: string;
  enhancedPrompt: string;
  url: string;
  status: ImageStatus;
  createdAt: number;
  style: string;
  size: string;
}

const STYLE_OPTIONS = [
  {
    value: "editorial",
    label: "에디토리얼",
    desc: "잡지 화보 느낌",
    prompt:
      "editorial photography, premium composition, sophisticated mood, rich details, ultra high quality",
  },
  {
    value: "commercial",
    label: "커머셜",
    desc: "광고/상품성 강조",
    prompt:
      "commercial photography, premium advertising visual, clean product focus, luxury look, highly detailed",
  },
  {
    value: "lifestyle",
    label: "라이프스타일",
    desc: "감성 일상 무드",
    prompt:
      "lifestyle photography, warm natural lighting, cozy mood, aesthetic composition, realistic details",
  },
  {
    value: "cinematic",
    label: "시네마틱",
    desc: "강한 분위기 연출",
    prompt:
      "cinematic lighting, dramatic atmosphere, movie still quality, deep contrast, ultra detailed",
  },
];

const SIZE_OPTIONS = [
  { value: "1024x1024", label: "정사각형", desc: "1:1" },
  { value: "1280x720", label: "가로형", desc: "16:9" },
  { value: "720x1280", label: "세로형", desc: "9:16" },
  { value: "1536x1024", label: "와이드", desc: "3:2" },
];

const COUNT_OPTIONS = [4, 8, 12, 15];

const QUALITY_TAGS = [
  "high quality",
  "ultra detailed",
  "realistic",
  "sharp focus",
  "premium lighting",
];

function ImageGenerator() {
  const [prompt, setPrompt] = useState(
    "서울 강남의 고급스러운 카페 인테리어, 따뜻한 조명, 감각적인 디저트와 커피"
  );
  const [style, setStyle] = useState("editorial");
  const [size, setSize] = useState("1024x1024");
  const [count, setCount] = useState(15);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "wide">("grid");
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchId, setBatchId] = useState(0);

  const selectedStyle = STYLE_OPTIONS.find((s) => s.value === style) || STYLE_OPTIONS[0];

  const stats = useMemo(() => {
    const total = gallery.length;
    const success = gallery.filter((item) => item.status === "success").length;
    const error = gallery.filter((item) => item.status === "error").length;
    const loading = gallery.filter((item) => item.status === "loading").length;
    const progress = total === 0 ? 0 : Math.round(((success + error) / total) * 100);
    return { total, success, error, loading, progress };
  }, [gallery]);

  useEffect(() => {
    if (!isGenerating) return;
    if (stats.loading === 0) {
      setIsGenerating(false);
    }
  }, [stats.loading, isGenerating]);

  const buildEnhancedPrompt = (rawPrompt: string) => {
    return [
      rawPrompt.trim(),
      selectedStyle.prompt,
      ...QUALITY_TAGS,
    ].join(", ");
  };

  const buildImageUrl = (enhancedPrompt: string, sizeValue: string, seed?: number) => {
    const [w, h] = sizeValue.split("x");
    const finalSeed = seed ?? Date.now() + Math.floor(Math.random() * 100000);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt
    )}?width=${w}&height=${h}&seed=${finalSeed}&nologo=true&model=flux`;
  };

  const handleGenerate = () => {
    const clean = prompt.trim();
    if (!clean) return;

    const enhancedPrompt = buildEnhancedPrompt(clean);
    const now = Date.now();

    const newItems: GalleryItem[] = Array.from({ length: count }, (_, index) => {
      const seed = now + index * 97;
      return {
        id: `${now}-${index}`,
        prompt: clean,
        enhancedPrompt,
        url: buildImageUrl(enhancedPrompt, size, seed),
        status: "loading",
        createdAt: now + index,
        style: selectedStyle.label,
        size,
      };
    });

    setBatchId((prev) => prev + 1);
    setIsGenerating(true);
    setGallery((prev) => [...newItems, ...prev]);
  };

  const retryItem = (id: string) => {
    setGallery((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "loading",
              url: buildImageUrl(item.enhancedPrompt, item.size),
            }
          : item
      )
    );
    setIsGenerating(true);
  };

  const retryFailed = () => {
    const hasFailed = gallery.some((item) => item.status === "error");
    if (!hasFailed) return;

    setGallery((prev) =>
      prev.map((item) =>
        item.status === "error"
          ? {
              ...item,
              status: "loading",
              url: buildImageUrl(item.enhancedPrompt, item.size),
            }
          : item
      )
    );
    setIsGenerating(true);
  };

  const clearAll = () => {
    setGallery([]);
    setIsGenerating(false);
  };

  const downloadImage = (item: GalleryItem) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.download = `image-${item.id}.jpg`;
    link.click();
  };

  const updateStatus = (id: string, status: ImageStatus) => {
    setGallery((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111827_48%,#050816_100%)] text-white">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-4 md:px-6 md:py-6">
          <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-red-300">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-semibold tracking-[0.2em]">IMAGE STUDIO</span>
                </div>
                <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                  대한민국 최강 느낌의 이미지 생성 스튜디오
                </h1>
                <p className="mt-2 text-sm text-zinc-300 md:text-base">
                  왼쪽에서 설정하고, 오른쪽에서 생성 현황 · 실패 복구 · 15개 단위 결과를 한 번에 관리
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                  <div className="text-xs text-zinc-400">총 이미지</div>
                  <div className="mt-1 text-2xl font-black">{stats.total}</div>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                  <div className="text-xs text-emerald-200">성공</div>
                  <div className="mt-1 text-2xl font-black text-emerald-300">{stats.success}</div>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                  <div className="text-xs text-amber-200">대기/생성중</div>
                  <div className="mt-1 text-2xl font-black text-amber-300">{stats.loading}</div>
                </div>
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3">
                  <div className="text-xs text-red-200">실패</div>
                  <div className="mt-1 text-2xl font-black text-red-300">{stats.error}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid min-h-[calc(100vh-180px)] grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
            {/* LEFT PANEL */}
            <aside className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-red-500/15 p-3 text-red-300">
                  <Settings2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs tracking-[0.2em] text-zinc-400">CONTROL PANEL</div>
                  <div className="text-xl font-bold">전체 설정</div>
                </div>
              </div>

              <div className="space-y-5">
                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Palette className="h-4 w-4 text-red-300" />
                    <div className="text-sm font-bold">프롬프트 입력</div>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="원하는 장면, 사물, 무드, 색감, 배경을 구체적으로 적어줘"
                    className="min-h-[140px] w-full resize-none rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-red-400"
                  />
                  <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-zinc-400">
                    팁: 짧은 단어보다 문장형 설명이 훨씬 잘 나온다.
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-300" />
                    <div className="text-sm font-bold">스타일 선택</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {STYLE_OPTIONS.map((option) => {
                      const active = option.value === style;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setStyle(option.value)}
                          className={`rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-red-400 bg-red-500/15 shadow-[0_0_0_1px_rgba(248,113,113,0.3)]"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="text-sm font-bold">{option.label}</div>
                          <div className="mt-1 text-xs text-zinc-400">{option.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <MonitorSmartphone className="h-4 w-4 text-emerald-300" />
                      <div className="text-sm font-bold">해상도</div>
                    </div>
                    <div className="space-y-2">
                      {SIZE_OPTIONS.map((option) => {
                        const active = option.value === size;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setSize(option.value)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                              active
                                ? "border-emerald-400 bg-emerald-500/10"
                                : "border-white/10 bg-white/[0.03]"
                            }`}
                          >
                            <span>{option.label}</span>
                            <span className="text-xs text-zinc-400">{option.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Rows3 className="h-4 w-4 text-violet-300" />
                      <div className="text-sm font-bold">생성 수량</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {COUNT_OPTIONS.map((n) => {
                        const active = n === count;
                        return (
                          <button
                            key={n}
                            onClick={() => setCount(n)}
                            className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                              active
                                ? "border-violet-400 bg-violet-500/15 text-violet-200"
                                : "border-white/10 bg-white/[0.03]"
                            }`}
                          >
                            {n}개
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 rounded-xl bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
                      추천: 15개 단위로 생성
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-amber-300" />
                      <div className="text-sm font-bold">퀄리티 태그</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUALITY_TAGS.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/20 via-fuchsia-500/10 to-sky-500/10 p-4">
                  <div className="mb-4 text-sm font-bold">실행</div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-orange-400 text-base font-black text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5" />
                        이미지 {count}개 생성하기
                      </>
                    )}
                  </button>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={retryFailed}
                      className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200 transition hover:bg-amber-500/15"
                    >
                      실패 재생성
                    </button>
                    <button
                      onClick={clearAll}
                      className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15"
                    >
                      전체 초기화
                    </button>
                  </div>
                </section>
              </div>
            </aside>

            {/* RIGHT PANEL */}
            <main className="space-y-5">
              <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs tracking-[0.2em] text-zinc-400">LIVE STATUS</div>
                    <div className="mt-1 text-2xl font-black">생성 현황 & 구동 상태</div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`rounded-2xl border px-4 py-2 text-sm font-bold ${
                        viewMode === "grid"
                          ? "border-red-400 bg-red-500/15 text-red-200"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        그리드
                      </div>
                    </button>
                    <button
                      onClick={() => setViewMode("wide")}
                      className={`rounded-2xl border px-4 py-2 text-sm font-bold ${
                        viewMode === "wide"
                          ? "border-sky-400 bg-sky-500/15 text-sky-200"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Rows3 className="h-4 w-4" />
                        와이드
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mb-4 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-red-500 via-fuchsia-500 to-sky-400 transition-all duration-500"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center gap-2 text-zinc-400">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-xs">배치 번호</span>
                    </div>
                    <div className="text-2xl font-black">{batchId}</div>
                  </div>

                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">완료</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-300">{stats.success}</div>
                  </div>

                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-amber-200">
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-xs">구동중</span>
                    </div>
                    <div className="text-2xl font-black text-amber-300">{stats.loading}</div>
                  </div>

                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                    <div className="mb-2 flex items-center gap-2 text-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">실패</span>
                    </div>
                    <div className="text-2xl font-black text-red-300">{stats.error}</div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs tracking-[0.2em] text-zinc-400">RESULT GALLERY</div>
                    <div className="mt-1 text-2xl font-black">생성 이미지</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-zinc-300">
                    현재 프롬프트: <span className="font-bold text-white">{prompt || "-"}</span>
                  </div>
                </div>

                {gallery.length === 0 ? (
                  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/20 text-center">
                    <ImageIcon className="mb-4 h-14 w-14 text-zinc-600" />
                    <div className="text-2xl font-black text-zinc-300">아직 생성된 이미지가 없습니다</div>
                    <p className="mt-2 max-w-md text-sm text-zinc-500">
                      왼쪽에서 설정을 고르고 생성 버튼을 누르면, 오른쪽에 15개 단위로 결과가 꽉 차게 나옵니다.
                    </p>
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3"
                        : "grid grid-cols-1 gap-4"
                    }
                  >
                    {gallery.map((item) => (
                      <div
                        key={item.id}
                        className={`overflow-hidden rounded-[24px] border border-white/10 bg-black/25 shadow-xl ${
                          viewMode === "wide" ? "grid min-h-[220px] grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]" : ""
                        }`}
                      >
                        <div className="relative bg-zinc-950">
                          <div className={`${viewMode === "wide" ? "h-full min-h-[220px]" : "aspect-square"} w-full`}>
                            <img
                              src={item.url}
                              alt={item.prompt}
                              onLoad={() => updateStatus(item.id, "success")}
                              onError={() => updateStatus(item.id, "error")}
                              className={`h-full w-full object-cover ${
                                item.status === "loading" ? "opacity-0" : "opacity-100"
                              } transition`}
                            />

                            {item.status === "loading" && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                                <RefreshCw className="h-8 w-8 animate-spin text-amber-300" />
                                <div className="text-sm font-bold text-zinc-200">이미지 생성 중...</div>
                              </div>
                            )}

                            {item.status === "error" && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                                <AlertTriangle className="h-8 w-8 text-red-400" />
                                <div className="text-sm font-bold text-red-300">생성 실패</div>
                                <button
                                  onClick={() => retryItem(item.id, item.prompt)}
                                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
                                >
                                  다시 생성
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-between p-4">
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                                {item.style}
                              </span>
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-300">
                                {item.size}
                              </span>
                            </div>

                            <div className="line-clamp-2 text-lg font-black">{item.prompt}</div>
                            <div className="mt-2 text-sm text-zinc-400">
                              상태:{" "}
                              <span
                                className={
                                  item.status === "success"
                                    ? "font-bold text-emerald-300"
                                    : item.status === "error"
                                    ? "font-bold text-red-300"
                                    : "font-bold text-amber-300"
                                }
                              >
                                {item.status === "success"
                                  ? "완료"
                                  : item.status === "error"
                                  ? "실패"
                                  : "생성중"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => retryItem(item.id, item.prompt)}
                              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white hover:bg-white/[0.08]"
                            >
                              재생성
                            </button>

                            <button
                              onClick={() => downloadImage(item)}
                              className="flex items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-emerald-200 hover:bg-emerald-500/15"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() =>
                                setGallery((prev) => prev.filter((img) => img.id !== item.id))
                              }
                              className="flex items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-200 hover:bg-red-500/15"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ImageGenerator;
