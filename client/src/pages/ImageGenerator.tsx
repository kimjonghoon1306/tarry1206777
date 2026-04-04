import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type ImageItem = {
  id: number;
  url: string;
  status: "pending" | "success" | "fail";
};

export default function ImageGenerator() {
  const [searchParams] = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ 콘텐츠에서 넘어온 프롬프트 자동 세팅
  useEffect(() => {
    const p = searchParams.get("prompt");
    if (p) {
      setPrompt(p);
      generateImages(p);
    }
  }, []);

  // ✅ 이미지 생성 (15개)
  const generateImages = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt) return;

    setLoading(true);

    const temp: ImageItem[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      url: "",
      status: "pending",
    }));

    setImages(temp);

    // 👉 실제 API 연결 부분 (현재는 더미)
    const results = await Promise.all(
      temp.map(async (item) => {
        try {
          // ⚠️ 여기에 실제 이미지 API 연결하면 됨
          await new Promise((res) => setTimeout(res, 500 + Math.random() * 1000));

          return {
            ...item,
            url: `https://picsum.photos/seed/${Math.random()}/400/400`,
            status: "success" as const,
          };
        } catch {
          return {
            ...item,
            status: "fail" as const,
            url: "",
          };
        }
      })
    );

    setImages(results);
    setLoading(false);
  };

  // ✅ 실패만 재생성
  const regenerateFailed = async () => {
    const failed = images.filter((i) => i.status === "fail");
    if (failed.length === 0) return;

    const updated = await Promise.all(
      images.map(async (item) => {
        if (item.status !== "fail") return item;

        try {
          await new Promise((res) => setTimeout(res, 500));

          return {
            ...item,
            url: `https://picsum.photos/seed/${Math.random()}/400/400`,
            status: "success" as const,
          };
        } catch {
          return item;
        }
      })
    );

    setImages(updated);
  };

  // ✅ 전체 초기화
  const resetAll = () => {
    setImages([]);
    setPrompt("");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0b0f14", color: "#fff" }}>
      
      {/* 왼쪽 컨트롤 */}
      <div style={{
        width: "350px",
        padding: "20px",
        borderRight: "1px solid #222"
      }}>
        <h2 style={{ marginBottom: "20px" }}>이미지 생성 스튜디오</h2>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="프롬프트 입력"
          style={{
            width: "100%",
            height: "150px",
            background: "#111",
            border: "1px solid #333",
            color: "#fff",
            padding: "10px",
            marginBottom: "20px"
          }}
        />

        <button
          onClick={() => generateImages()}
          style={{
            width: "100%",
            padding: "15px",
            background: "#4CAF50",
            border: "none",
            marginBottom: "10px",
            fontWeight: "bold"
          }}
        >
          15개 생성
        </button>

        <button
          onClick={regenerateFailed}
          style={{
            width: "100%",
            padding: "15px",
            background: "#d4a017",
            border: "none",
            marginBottom: "10px",
            fontWeight: "bold"
          }}
        >
          실패 재생성
        </button>

        <button
          onClick={resetAll}
          style={{
            width: "100%",
            padding: "15px",
            background: "#d32f2f",
            border: "none",
            fontWeight: "bold"
          }}
        >
          전체 초기화
        </button>
      </div>

      {/* 오른쪽 결과 */}
      <div style={{ flex: 1, padding: "20px", overflow: "auto" }}>
        <h3 style={{ marginBottom: "20px" }}>
          결과 ({images.filter(i => i.status === "success").length} / {images.length})
        </h3>

        {loading && <p>이미지 생성 중...</p>}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "10px"
        }}>
          {images.map((img) => (
            <div key={img.id} style={{
              width: "100%",
              height: "150px",
              background: "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px"
            }}>
              {img.status === "pending" && "대기중"}
              {img.status === "fail" && "실패"}
              {img.status === "success" && (
                <img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
