import { useState, useEffect } from "react";
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

/* =========================
   기본 유틸
========================= */

function generatePollinationsUrl(prompt: string, width: number, height: number, seed: number) {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&model=flux&enhance=true`;
}

type GalleryItem = {
  id: number;
  src: string;
  loading: boolean;
};

/* =========================
   메인 컴포넌트
========================= */

export default function ImageGenerator() {
  const [, navigate] = useLocation();

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const autoPrompt = params?.get("prompt") || "";

  const [prompt, setPrompt] = useState(autoPrompt || "");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [autoStarted, setAutoStarted] = useState(false);

  /* =========================
     자동 생성 (핵심)
  ========================= */

  useEffect(() => {
    if (!autoPrompt || autoStarted) return;

    setAutoStarted(true);
    setPrompt(autoPrompt);

    setTimeout(() => {
      handleGenerate(autoPrompt);
    }, 300);
  }, [autoPrompt]);

  /* =========================
     이미지 생성
  ========================= */

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);
    setProgress(0);

    const count = 15;

    const items: GalleryItem[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      src: "",
      loading: true,
    }));

    setGallery(items);

    let done = 0;

    const results = await Promise.all(
      items.map(async (item, i) => {
        const seed = Math.floor(Math.random() * 999999);

        const url = generatePollinationsUrl(finalPrompt, 1024, 1024, seed);

        done++;
        setProgress(Math.floor((done / count) * 100));

        return {
          ...item,
          src: url,
          loading: false,
        };
      })
    );

    setGallery(results);
    setLoading(false);

    toast.success("이미지 생성 완료");
  };

  /* =========================
     실패 재생성
  ========================= */

  const retryAll = async () => {
    if (gallery.length === 0) return;

    setLoading(true);

    const updated = await Promise.all(
      gallery.map(async (item) => {
        const seed = Math.floor(Math.random() * 999999);

        return {
          ...item,
          src: generatePollinationsUrl(prompt, 1024, 1024, seed),
          loading: false,
        };
      })
    );

    setGallery(updated);
    setLoading(false);
  };

  /* =========================
     초기화
  ========================= */

  const clearAll = () => {
    setGallery([]);
    setPrompt("");
  };

  /* =========================
     UI
  ========================= */

  return (
    <Layout>
      <div className="p-4 space-y-4">

        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">이미지 생성</h1>
        </div>

        {/* 모바일 포함 설정 패널 */}
        <div className="rounded-xl p-4 space-y-4 border">

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="프롬프트 입력"
          />

          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-green-500 text-white font-bold"
          >
            {loading ? "생성 중..." : "이미지 15개 생성"}
          </button>

          <button
            onClick={retryAll}
            className="w-full h-10 rounded-xl bg-yellow-500 text-black font-bold"
          >
            실패 재생성
          </button>

          <button
            onClick={clearAll}
            className="w-full h-10 rounded-xl bg-red-500 text-white font-bold"
          >
            전체 초기화
          </button>

          {loading && <Progress value={progress} />}
        </div>

        {/* 결과 */}
        <div className="grid grid-cols-2 gap-3">
          {gallery.map((img) => (
            <div key={img.id} className="aspect-square bg-black rounded-xl overflow-hidden">
              {img.loading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="animate-spin" />
                </div>
              ) : (
                <img src={img.src} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}
