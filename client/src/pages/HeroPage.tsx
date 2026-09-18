// BlogAuto Pro — HeroPage (인트로 영상)
// 풀스크린 영상 재생 → 끝나면 랜딩(/home)으로 자동 전환. 건너뛰기 버튼 제공.
import { useRef, useEffect } from "react";
import { useLocation } from "wouter";

export default function HeroPage() {
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const goLanding = () => navigate("/home");

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // muted 자동재생 보장(모바일/사파리 정책 대응)
    v.play().catch(() => {});
    // 안전장치: 영상이 어떤 이유로 안 끝나도 최대 14초 후 랜딩으로
    const fallback = setTimeout(goLanding, 14000);
    return () => clearTimeout(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#161310", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={goLanding}
        onError={goLanding}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
      />
      {/* 건너뛰기 */}
      <button
        onClick={goLanding}
        aria-label="인트로 건너뛰기"
        style={{
          position: "absolute", right: "clamp(18px,4vw,40px)", bottom: "clamp(18px,4vw,40px)",
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "11px 22px", borderRadius: 999,
          background: "rgba(236,229,214,0.1)", border: "1px solid rgba(236,229,214,0.28)",
          color: "#ece5d6", cursor: "pointer",
          fontFamily: "'Fraunces', 'Gowun Batang', serif", fontStyle: "italic", fontSize: 15,
          backdropFilter: "blur(6px)", transition: "background .25s ease, transform .25s ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(236,229,214,0.2)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(236,229,214,0.1)"; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
      >
        Skip intro →
      </button>
    </div>
  );
}
