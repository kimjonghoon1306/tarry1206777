import React, { useState } from "react";
import Layout from "@/components/Layout";

interface ImageItem {
  id: string;
  url: string;
  prompt: string;
  status: "loading" | "success" | "error";
}

const normalizePrompt = (text: string) => {
  return `${text}, high quality, detailed`;
};

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);

  const buildImageUrl = (text: string) => {
    const safe = normalizePrompt(text);

    return `https://image.pollinations.ai/prompt/${encodeURIComponent(
      safe
    )}?seed=${Date.now()}`;
  };

  const generateImage = () => {
    const text = prompt.trim();
    if (!text) return;

    const item: ImageItem = {
      id: Date.now().toString(),
      url: buildImageUrl(text),
      prompt: text,
      status: "loading",
    };

    setImages((prev) => [item, ...prev]);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6 text-white">

        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="이미지 설명 입력"
            className="flex-1 p-3 rounded bg-black border"
          />

          <button
            onClick={generateImage}
            className="bg-emerald-500 px-4 py-2 rounded"
          >
            생성
          </button>
        </div>

        <div>총 {images.length}개</div>

        <div className="grid grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border p-2">

              {img.status === "loading" && <p>로딩중...</p>}

              <img
                src={img.url}
                onLoad={() => {
                  setImages((prev) =>
                    prev.map((i) =>
                      i.id === img.id ? { ...i, status: "success" } : i
                    )
                  );
                }}
                onError={() => {
                  setImages((prev) =>
                    prev.map((i) =>
                      i.id === img.id ? { ...i, status: "error" } : i
                    )
                  );
                }}
                className="w-full"
              />

              <div>{img.prompt}</div>
              <div>상태: {img.status}</div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
};

export default ImageGenerator;
