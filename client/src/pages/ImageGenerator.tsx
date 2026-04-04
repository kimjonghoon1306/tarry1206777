import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";

type Status = "loading" | "success" | "error";

interface Item {
  id: string;
  prompt: string;
  url: string;
  status: Status;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const buildUrl = (text: string) => {
    const final = `high quality realistic ${text}`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      final
    )}?nologo=true&t=${Date.now()}`;
  };

  const generate = () => {
    if (!prompt.trim()) return;

    setLoading(true);

    const list: Item[] = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + "-" + i,
      prompt,
      url: buildUrl(prompt),
      status: "loading",
    }));

    setImages((prev) => [...list, ...prev]);
  };

  const update = (id: string, status: Status) => {
    setImages((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  };

  const retry = (id: string) => {
    setImages((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "loading", url: buildUrl(i.prompt) }
          : i
      )
    );
  };

  const retryAll = () => {
    setImages((prev) =>
      prev.map((i) =>
        i.status === "error"
          ? { ...i, status: "loading", url: buildUrl(i.prompt) }
          : i
      )
    );
  };

  const stats = useMemo(() => {
    return {
      total: images.length,
      success: images.filter((i) => i.status === "success").length,
      error: images.filter((i) => i.status === "error").length,
      loading: images.filter((i) => i.status === "loading").length,
    };
  }, [images]);

  useEffect(() => {
    if (stats.loading === 0) setLoading(false);
  }, [stats.loading]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#0b0f17] text-white p-6">

        {/* 🔥 상단 */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">이미지 생성 스튜디오</h1>
            <p className="text-zinc-400 text-sm">
              설정 + 생성 + 결과를 한 화면에서 관리
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-black/40 px-4 py-2 rounded-xl">
              총 {stats.total}
            </div>
            <div className="bg-green-500/20 px-4 py-2 rounded-xl text-green-300">
              성공 {stats.success}
            </div>
            <div className="bg-yellow-500/20 px-4 py-2 rounded-xl text-yellow-300">
              진행 {stats.loading}
            </div>
            <div className="bg-red-500/20 px-4 py-2 rounded-xl text-red-300">
              실패 {stats.error}
            </div>
          </div>
        </div>

        {/* 🔥 좌우 구조 */}
        <div className="grid grid-cols-[350px_1fr] gap-6">

          {/* 👉 왼쪽 설정 */}
          <div className="bg-black/40 rounded-2xl p-5 space-y-4">

            <div>
              <div className="text-sm mb-2 text-zinc-400">프롬프트</div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-40 p-3 rounded bg-black border border-white/10"
              />
            </div>

            <button
              onClick={generate}
              className="w-full bg-green-500 py-3 rounded-xl font-bold text-black"
            >
              15개 생성
            </button>

            <button
              onClick={retryAll}
              className="w-full bg-yellow-500 py-3 rounded-xl font-bold text-black"
            >
              실패 전체 재생성
            </button>

            <button
              onClick={() => setImages([])}
              className="w-full bg-red-500 py-3 rounded-xl font-bold"
            >
              전체 초기화
            </button>

          </div>

          {/* 👉 오른쪽 갤러리 */}
          <div className="grid grid-cols-3 gap-4">

            {images.map((img) => (
              <div
                key={img.id}
                className="bg-black/40 rounded-xl p-3 border border-white/10"
              >
                <div className="aspect-square bg-black rounded overflow-hidden">

                  <img
                    src={img.url}
                    onLoad={() => update(img.id, "success")}
                    onError={() => update(img.id, "error")}
                    className="w-full h-full object-cover"
                  />

                  {img.status === "loading" && (
                    <div className="text-center p-4">로딩중...</div>
                  )}

                  {img.status === "error" && (
                    <div className="text-center p-4 text-red-400">
                      실패
                      <button
                        onClick={() => retry(img.id)}
                        className="block mt-2 bg-red-500 px-3 py-1 rounded"
                      >
                        재생성
                      </button>
                    </div>
                  )}

                </div>

                <div className="mt-2 text-sm text-zinc-400">
                  {img.prompt}
                </div>

              </div>
            ))}

          </div>

        </div>

      </div>
    </Layout>
  );
}
