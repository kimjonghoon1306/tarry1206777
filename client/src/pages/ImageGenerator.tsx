import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<any[]>([]);

  const generateImage = () => {
    console.log("🔥 클릭됨");

    const text = prompt.trim() || "테스트 이미지";

    const id = Date.now().toString();

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?t=${Date.now()}`;

    setImages((prev) => [
      {
        id,
        url,
        status: "loading",
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

          {/* 🔥 여기 확실하게 클릭 연결 */}
          <button
            onClick={generateImage}
            className="px-4 py-2 bg-green-500 rounded"
          >
            생성
          </button>
        </div>

        <div>총 {images.length}개</div>

        <div className="grid grid-cols-3 gap-4">
          {images.map((img) => (
            <div key={img.id} className="border p-2">

              <img
                src={img.url}
                className="w-full"
              />

              <div>{img.prompt}</div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}
