import { useState } from "react";
import Layout from "@/components/Layout";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<any[]>([]);

  const generateImage = () => {
    const text = prompt.trim() || "테스트 이미지";

    const id = Date.now().toString();

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?t=${Date.now()}`;

    setImages((prev) => [
      {
        id,
        url,
        prompt: text,
      },
      ...prev,
    ]);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">

        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="이미지 설명 입력"
            className="flex-1 p-3 rounded bg-black text-white border"
          />

          {/* 🔥 이게 핵심 */}
          <button
            onClick={generateImage}
            style={{
              background: "#22c55e",
              padding: "10px 16px",
              borderRadius: "6px",
              color: "white",
            }}
          >
            생성
          </button>
        </div>

        <div>총 {images.length}개</div>

        <div className="grid grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border p-2">
              <img src={img.url} className="w-full" />
              <div>{img.prompt}</div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}
