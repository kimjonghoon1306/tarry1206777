import { useState } from "react";
import Layout from "@/components/Layout";

interface ImageItem {
  id: string;
  url: string;
  prompt: string;
  status: "loading" | "success" | "error";
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);

  const buildImageUrl = (text: string) =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?nologo=true&t=${Date.now()}`;

  const generateImage = () => {
    const text = prompt.trim();
    if (!text) return;

    const item: ImageItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: buildImageUrl(text),
      prompt: text,
      status: "loading",
    };

    setImages((prev) => [item, ...prev]);
  };

  const retryOne = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? {
              ...img,
              url: buildImageUrl(img.prompt),
              status: "loading",
            }
          : img
      )
    );
  };

  const retryAll = () => {
    setImages((prev) =>
      prev.map((img) =>
        img.status === "error"
          ? {
              ...img,
              url: buildImageUrl(img.prompt),
              status: "loading",
            }
          : img
      )
    );
  };

  const clearAll = () => {
    setImages([]);
  };

  const successCount = images.filter((img) => img.status === "success").length;
  const failedCount = images.filter((img) => img.status === "error").length;

  return (
    <Layout>
      <div className="p-6 space-y-6 text-white">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">이미지 생성</h1>
          <p className="text-zinc-400">
            설명을 입력하고 이미지를 생성하세요.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 md:p-6 space-y-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") generateImage();
              }}
              placeholder="예: 고급스러운 카페 인테리어, 따뜻한 조명, 감성적인 분위기"
              className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-4 text-white outline-none placeholder:text-zinc-500 focus:border-emerald-500"
            />

            <button
              onClick={generateImage}
              className="rounded-xl bg-emerald-500 px-4 py-4 font-bold text-white transition hover:bg-emerald-400"
            >
              생성
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={retryAll}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-semibold text-white transition hover:bg-zinc-800"
            >
              전체 재시도
            </button>

            <button
              onClick={clearAll}
              className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-2 font-semibold text-red-300 transition hover:bg-red-950/70"
            >
              초기화
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">이미지 갤러리</h2>
              <p className="text-zinc-400">
                총 {images.length}개 / 성공 {successCount}개 / 실패 {failedCount}개
              </p>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-black/30 text-center text-zinc-500">
              아직 생성된 이미지가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm"
                >
                  <div className="aspect-square w-full bg-black relative">
                    {img.status === "loading" && (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                        로딩중...
                      </div>
                    )}

                    <img
                      src={img.url}
                      alt={img.prompt}
                      onLoad={() => {
                        setImages((prev) =>
                          prev.map((item) =>
                            item.id === img.id
                              ? { ...item, status: "success" }
                              : item
                          )
                        );
                      }}
                      onError={() => {
                        setImages((prev) =>
                          prev.map((item) =>
                            item.id === img.id
                              ? { ...item, status: "error" }
                              : item
                          )
                        );
                      }}
                      className={`h-full w-full object-cover ${
                        img.status === "success" ? "block" : "hidden"
                      }`}
                    />

                    {img.status === "error" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#220b0d] text-red-400">
                        <div className="text-lg font-bold">로드 실패</div>
                        <button
                          onClick={() => retryOne(img.id)}
                          className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-400"
                        >
                          재시도
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="line-clamp-2 text-lg font-bold text-white">
                      {img.prompt}
                    </div>

                    <div className="text-sm text-zinc-400">
                      상태:{" "}
                      {img.status === "success"
                        ? "완료"
                        : img.status === "error"
                        ? "실패"
                        : "로딩중"}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => retryOne(img.id)}
                        className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-semibold text-white transition hover:bg-zinc-800"
                      >
                        재시도
                      </button>

                      {img.status === "success" && (
                        <a
                          href={img.url}
                          download={`image-${img.id}.jpg`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-semibold text-white transition hover:bg-zinc-800"
                        >
                          다운로드
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
