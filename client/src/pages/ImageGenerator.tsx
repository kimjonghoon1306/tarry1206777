import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  url: string;
  status: "loading" | "success" | "error";
  prompt: string;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);

  const buildImageUrl = (text: string) =>
    `/api/generate-image?prompt=${encodeURIComponent(text)}&t=${Date.now()}`;

  const generateImage = () => {
    if (!prompt.trim()) {
      toast("이미지 설명을 입력해주세요");
      return;
    }

    const id = Date.now().toString();

    const newItem: ImageItem = {
      id,
      url: buildImageUrl(prompt),
      status: "loading",
      prompt,
    };

    setImages((prev) => [newItem, ...prev]);
  };

  const handleLoad = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, status: "success" } : img
      )
    );
  };

  const handleError = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, status: "error" } : img
      )
    );
  };

  const retryOne = (id: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? {
              ...img,
              status: "loading",
              url: buildImageUrl(img.prompt),
            }
          : img
      )
    );
  };

  const retryAll = () => {
    const failed = images.filter((img) => img.status === "error");

    if (failed.length === 0) {
      toast("재시도할 이미지 없음");
      return;
    }

    setImages((prev) =>
      prev.map((img) =>
        img.status === "error"
          ? {
              ...img,
              status: "loading",
              url: buildImageUrl(img.prompt),
            }
          : img
      )
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") generateImage();
            }}
            placeholder="이미지 설명 입력"
            className="flex-1 p-3 rounded bg-black text-white border"
          />
          <Button onClick={generateImage}>생성</Button>
        </div>

        <Button onClick={retryAll}>전체 재시도</Button>

        <div className="text-sm text-zinc-400">
          총 {images.length}개
        </div>

        <div className="grid grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border rounded p-2 space-y-2">
              <div className="text-sm text-zinc-300 break-all">
                {img.prompt}
              </div>

              {img.status === "loading" && (
                <div className="h-[220px] flex items-center justify-center border rounded bg-zinc-900 text-zinc-400">
                  로딩중...
                </div>
              )}

              <img
                src={img.url}
                alt={img.prompt}
                onLoad={() => handleLoad(img.id)}
                onError={() => handleError(img.id)}
                className={`w-full rounded ${img.status === "success" ? "block" : "hidden"}`}
              />

              {img.status === "error" && (
                <div className="h-[220px] flex flex-col items-center justify-center border rounded bg-zinc-950 text-red-500 gap-3">
                  <div>로드 실패</div>
                  <Button variant="outline" onClick={() => retryOne(img.id)}>
                    재시도
                  </Button>
                </div>
              )}

              <div className="text-sm mt-2">상태: {img.status}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
