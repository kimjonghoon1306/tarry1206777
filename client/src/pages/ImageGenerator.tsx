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

  const generateImage = () => {
    if (!prompt.trim()) return;

    const id = Date.now().toString();

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;

    const newItem: ImageItem = {
      id,
      url,
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

  const retryAll = () => {
    const failed = images.filter((img) => img.status === "error");

    if (failed.length === 0) {
      toast("재시도할 이미지 없음");
      return;
    }

    const retryImages = failed.map((img) => ({
      ...img,
      status: "loading",
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(
        img.prompt
      )}?nologo=true&t=${Date.now()}`,
    }));

    setImages((prev) =>
      prev.map((img) => {
        const found = retryImages.find((r) => r.id === img.id);
        return found ? found : img;
      })
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* 입력 */}
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="이미지 설명 입력"
            className="flex-1 p-3 rounded bg-black text-white border"
          />
          <Button onClick={generateImage}>생성</Button>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <Button onClick={retryAll}>
            전체 재시도
          </Button>
        </div>

        {/* 갤러리 */}
        <div className="grid grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border rounded p-2">
              {img.status === "loading" && <p>로딩중...</p>}

              {img.status !== "error" && (
                <img
                  src={img.url}
                  onLoad={() => handleLoad(img.id)}
                  onError={() => handleError(img.id)}
                  className="w-full"
                />
              )}

              {img.status === "error" && (
                <div className="text-red-500 text-center">
                  로드 실패
                </div>
              )}

              <div className="text-sm mt-2">
                상태: {img.status}
              </div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}
