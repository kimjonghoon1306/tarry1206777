import { useEffect, useState } from "react";

type ImageItem = {
  id: number;
  url: string;
  status: "pending" | "success" | "fail";
};

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");

    if (p) {
      setPrompt(p);
      setTimeout(() => {
        generateImages(p);
      }, 100);
    }
  }, []);

  const generateImages = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setLoading(true);

    const temp: ImageItem[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      url: "",
      status: "pending",
    }));

    setImages(temp);

    const results = await Promise.all(
      temp.map(async (item) => {
        try {
          await new Promise((res) => setTimeout(res, 300 + Math.random() * 700));

          return {
            ...item,
            url: `https://picsum.photos/seed/${Date.now()}-${item.id}/400/400`,
            status: "success" as const,
          };
        } catch {
          return {
            ...item,
            url: "",
            status: "fail" as const,
          };
        }
      })
    );

    setImages(results);
    setLoading(false);
  };

  const regenerateFailed = async () => {
    setLoading(true);

    const updated = await Promise.all(
      images.map(async (item) => {
        if (item.status !== "fail") return item;

        try {
          await new Promise((res) => setTimeout(res, 300 + Math.random() * 700));

          return {
            ...item,
            url: `https://picsum.photos/seed/retry-${Date.now()}-${item.id}/400/400`,
            status: "success" as const,
          };
        } catch {
          return item;
        }
      })
    );

    setImages(updated);
    setLoading(false);
  };

  const resetAll = () => {
    setPrompt("");
    setImages([]);
    setLoading(false);
  };

  const successCount = images.filter((i) => i.status === "success").length;
  const failCount = images.filter((i) => i.status === "fail").length;
  const pendingCount = images.filter((i) => i.status === "pending").length;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#060b16",
        color: "#ffffff",
      }}
    >
      {/* 왼쪽 컨트롤 패널 */}
      <div
        style={{
          width: "360px",
          minWidth: "360px",
          background: "#0a0f1c",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: "28px 22px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              marginBottom: "6px",
            }}
          >
            이미지 생성 스튜디오
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            설정 + 생성 + 결과를 한 화면에서 관리
          </div>
        </div>

        <div
          style={{
            background: "#050811",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            padding: "18px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            프롬프트
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="이미지 생성 프롬프트를 입력하세요"
            style={{
              width: "100%",
              height: "190px",
              resize: "none",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#000000",
              color: "#ffffff",
              padding: "14px",
              boxSizing: "border-box",
              outline: "none",
              fontSize: "14px",
            }}
          />

          <button
            onClick={() => generateImages()}
            disabled={loading}
            style={{
              width: "100%",
              height: "58px",
              border: "none",
              borderRadius: "16px",
              background: "#67c95d",
              color: "#08120a",
              fontSize: "18px",
              fontWeight: 800,
              marginTop: "18px",
              cursor: "pointer",
            }}
          >
            15개 생성
          </button>

          <button
            onClick={regenerateFailed}
            disabled={loading}
            style={{
              width: "100%",
              height: "58px",
              border: "none",
              borderRadius: "16px",
              background: "#d8b116",
              color: "#171204",
              fontSize: "18px",
              fontWeight: 800,
              marginTop: "14px",
              cursor: "pointer",
            }}
          >
            실패 전체 재생성
          </button>

          <button
            onClick={resetAll}
            disabled={loading}
            style={{
              width: "100%",
              height: "58px",
              border: "none",
              borderRadius: "16px",
              background: "#df4440",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 800,
              marginTop: "14px",
              cursor: "pointer",
            }}
          >
            전체 초기화
          </button>
        </div>
      </div>

      {/* 오른쪽 결과 영역 */}
      <div
        style={{
          flex: 1,
          padding: "28px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                marginBottom: "8px",
              }}
            >
              이미지 생성 구동 화면
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "14px",
              }}
            >
              생성 진행상태와 결과를 오른쪽에서 바로 확인
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "#050811",
                padding: "14px 18px",
                borderRadius: "16px",
                fontWeight: 800,
              }}
            >
              총 {images.length}
            </div>
            <div
              style={{
                background: "#17361d",
                color: "#81ef8c",
                padding: "14px 18px",
                borderRadius: "16px",
                fontWeight: 800,
              }}
            >
              성공 {successCount}
            </div>
            <div
              style={{
                background: "#3d320f",
                color: "#ffd95d",
                padding: "14px 18px",
                borderRadius: "16px",
                fontWeight: 800,
              }}
            >
              진행 {pendingCount}
            </div>
            <div
              style={{
                background: "#3a1618",
                color: "#ff8d8d",
                padding: "14px 18px",
                borderRadius: "16px",
                fontWeight: 800,
              }}
            >
              실패 {failCount}
            </div>
          </div>
        </div>

        {loading && (
          <div
            style={{
              marginBottom: "18px",
              color: "#9bb3ff",
              fontWeight: 700,
            }}
          >
            이미지 생성 중...
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "16px",
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                height: "180px",
                borderRadius: "18px",
                overflow: "hidden",
                background: "#0b101c",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {img.status === "pending" && (
                <div style={{ color: "rgba(255,255,255,0.65)", fontWeight: 700 }}>
                  생성 대기중
                </div>
              )}

              {img.status === "fail" && (
                <div style={{ color: "#ff8d8d", fontWeight: 700 }}>
                  생성 실패
                </div>
              )}

              {img.status === "success" && (
                <img
                  src={img.url}
                  alt={`generated-${img.id}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
