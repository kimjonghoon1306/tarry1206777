import { useState } from "react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateImage = () => {
    if (!prompt.trim()) return;

    setLoading(true);

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;

    setImages((prev) => [url, ...prev]);

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>이미지 생성</h1>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="이미지 설명 입력"
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={generateImage}>생성</button>
      </div>

      {loading && <p>생성중...</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        {images.map((url, i) => (
          <img
            key={i}
            src={url}
            alt=""
            style={{ width: "100%" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ))}
      </div>
    </div>
  );
}
