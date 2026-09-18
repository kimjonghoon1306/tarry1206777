// BlogAuto Pro — LandingPage v6.0 "Studio Note"
// 오브제 × 노트 에디토리얼: 크림 종이 · 고운바탕 명조 헤드라인 · 세이지 그린 · TARRY 오브제
import { useRef, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { ArrowRight, ArrowUpRight, Sun, Moon, Search, PenLine, Image as ImageIcon, Send } from "lucide-react";

const FEATURES = [
  { no: "01", icon: Search, title: "스마트 키워드 수집", en: "Keywords", desc: "애드센스·애드포스트에 연동해 유입과 클릭이 높은 키워드를 실시간으로 골라냅니다." },
  { no: "02", icon: PenLine, title: "AI 콘텐츠 생성", en: "Writing", desc: "수집한 키워드로 1,500자 이상의 SEO 최적화 글을 사람의 손길처럼 자연스럽게 씁니다." },
  { no: "03", icon: ImageIcon, title: "실사 이미지 생성", en: "Imagery", desc: "글 주제에 어울리는 이미지를 자동으로 만들어 본문에 그대로 얹습니다." },
  { no: "04", icon: Send, title: "모든 곳에 자동 배포", en: "Publish", desc: "워드프레스·Medium·커스텀 사이트까지 원클릭으로 발행하고 색인까지 챙깁니다." },
];

const PLATFORMS = ["WordPress", "Blogger", "Medium", "커스텀 사이트", "네이버 블로그"];

// 종이 그레인(SVG noise) — 데이터 URI
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  // 🔒 히든 관리자 진입: 로고 2초 내 7번 클릭
  const logoTapRef = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoTap = () => {
    logoTapRef.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => { logoTapRef.current = 0; }, 2000);
    if (logoTapRef.current >= 7) { logoTapRef.current = 0; navigate("/superadmin"); }
  };

  const startFree = () => navigate("/signup");
  const peek = () => { localStorage.setItem("guest_mode", "true"); toast.success("둘러보기 모드예요. 실제 기능은 가입 후 이용할 수 있어요."); navigate("/dashboard"); };
  const login = () => navigate("/login");

  const c = dark ? {
    bg: "#1a1714", paper: "#221e18", ink: "#ece5d6", sub: "#9b917f",
    line: "rgba(255,255,255,0.055)", hair: "rgba(255,255,255,0.12)",
    sage: "#9cb187", sageInk: "#c6d5b7", sageSoft: "rgba(156,177,135,0.14)",
    card: "#241f18", shadow: "0 24px 60px rgba(0,0,0,0.5)",
  } : {
    bg: "#f1ebdf", paper: "#faf6ec", ink: "#2b2820", sub: "#6d6555",
    line: "rgba(43,40,32,0.07)", hair: "rgba(43,40,32,0.14)",
    sage: "#5d7350", sageInk: "#465a3b", sageSoft: "#e6ecd9",
    card: "#fffdf7", shadow: "0 24px 55px rgba(74,66,45,0.16)",
  };
  const serifKo = "'Gowun Batang', serif";
  const serifEn = "'Fraunces', 'Gowun Batang', serif";
  const body = "'Gowun Dodum', 'Pretendard', sans-serif";

  const up = (d: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(18px)",
    transition: `opacity .8s ease ${d}s, transform .8s cubic-bezier(.2,.7,.2,1) ${d}s`,
  });

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.ink, fontFamily: body, position: "relative", overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { overflow-x: hidden; }
        ::selection { background: ${c.sage}; color: ${dark ? "#1a1714" : "#fff"}; }
        .sn-cta { transition: transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s ease, background .3s ease, color .3s ease; }
        .sn-cta:hover { transform: translateY(-2px); }
        .sn-card { transition: transform .4s cubic-bezier(.2,.7,.2,1), box-shadow .4s ease, border-color .3s ease; }
        .sn-card:hover { transform: translateY(-4px); }
        .sn-link { position: relative; transition: color .25s ease; }
        .sn-link::after { content:''; position:absolute; left:0; bottom:-3px; width:100%; height:1px; background:currentColor; transform:scaleX(0); transform-origin:right; transition:transform .3s ease; }
        .sn-link:hover::after { transform:scaleX(1); transform-origin:left; }
        @keyframes floaty { 0%,100%{ transform: rotate(-2.2deg) translateY(0);} 50%{ transform: rotate(-2.2deg) translateY(-10px);} }
        @media(max-width: 940px){ .sn-hero{ grid-template-columns:1fr !important; } .sn-hero-art{ order:-1; margin:0 auto 8px; max-width:440px; } .sn-h1{ font-size:clamp(38px,10vw,60px) !important; } .sn-feat{ grid-template-columns:1fr !important; } }
        @media(max-width: 600px){ .sn-nav{ padding-left:14px !important; padding-right:14px !important; } .sn-nav-right{ gap:12px !important; flex-wrap:nowrap !important; } .sn-logo-text{ font-size:16px !important; } .sn-nav-right .sn-cta{ padding:8px 13px !important; font-size:13px !important; white-space:nowrap; } .sn-login{ font-size:14px !important; } }
      `}</style>

      {/* 종이 그레인 + 노트 罫線 오버레이 */}
      <div aria-hidden style={{ position: "fixed", inset: 0, backgroundImage: GRAIN, opacity: dark ? 0.05 : 0.045, mixBlendMode: dark ? "screen" : "multiply", pointerEvents: "none", zIndex: 1 }} />
      <div aria-hidden style={{ position: "fixed", inset: 0, backgroundImage: `repeating-linear-gradient(${c.line} 0 1px, transparent 1px 34px)`, opacity: 0.6, pointerEvents: "none", zIndex: 1 }} />

      {/* ── NAV ── */}
      <nav className="sn-nav" style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px clamp(20px,5vw,72px)", background: dark ? "rgba(26,23,20,0.72)" : "rgba(241,235,223,0.72)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${c.line}` }}>
        <div onClick={handleLogoTap} title="BlogAuto Pro" style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", userSelect: "none" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: c.sage, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#1a1714" : "#fff", fontFamily: serifEn, fontWeight: 600, fontSize: 19, boxShadow: `0 4px 14px ${c.sageSoft}` }}>B</div>
          <span className="sn-logo-text" style={{ fontFamily: serifEn, fontSize: 20, letterSpacing: "-0.01em", fontWeight: 500 }}>BlogAuto <span style={{ fontStyle: "italic", color: c.sage }}>Pro</span></span>
        </div>
        <div className="sn-nav-right" style={{ display: "flex", alignItems: "center", gap: "clamp(14px,3vw,30px)" }}>
          <button onClick={toggleTheme} aria-label="테마 전환" style={{ background: "none", border: "none", cursor: "pointer", color: c.sub, display: "flex", padding: 6 }}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="sn-link sn-login" onClick={login} style={{ cursor: "pointer", fontSize: 15, color: c.ink }}>로그인</span>
          <button className="sn-cta" onClick={peek} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 999, border: `1px solid ${c.ink}`, background: "transparent", color: c.ink, cursor: "pointer", fontSize: 14.5, fontFamily: body }}>
            둘러보기 <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "clamp(48px,9vw,108px) clamp(20px,5vw,72px) clamp(40px,7vw,80px)" }}>
        <div className="sn-hero" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "clamp(32px,6vw,72px)", alignItems: "center" }}>
          {/* 좌: 카피 */}
          <div>
            <div style={{ ...up(0.05), display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
              <span style={{ width: 26, height: 1, background: c.sage }} />
              <span style={{ fontFamily: serifEn, fontStyle: "italic", fontSize: 15, letterSpacing: "0.02em", color: c.sage }}>AI Blog Automation, Studio Note</span>
            </div>
            <h1 className="sn-h1" style={{ ...up(0.12), fontFamily: serifKo, fontWeight: 700, fontSize: "clamp(44px,5.4vw,76px)", lineHeight: 1.16, letterSpacing: "-0.02em", margin: 0 }}>
              블로그의 모든 순간을,<br />
              <span style={{ position: "relative", color: c.sage }}>
                자동으로 씁니다
                <svg viewBox="0 0 300 12" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: "-0.12em", width: "100%", height: "0.4em" }}>
                  <path d="M2 8 Q 80 2 150 6 T 298 5" fill="none" stroke={c.sage} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
                </svg>
              </span>
            </h1>
            <p style={{ ...up(0.2), fontSize: "clamp(16px,1.5vw,18.5px)", lineHeight: 1.9, color: c.sub, maxWidth: 470, margin: "30px 0 0" }}>
              키워드 수집부터 글쓰기, 이미지, 발행까지.<br />
              블로그 운영의 지루한 반복을 AI에게 맡기고,<br />
              당신은 <span style={{ color: c.ink, borderBottom: `1px solid ${c.sage}` }}>수익과 성장</span>에만 집중하세요.
            </p>
            <div style={{ ...up(0.28), display: "flex", flexWrap: "wrap", gap: 14, marginTop: 40 }}>
              <button className="sn-cta" onClick={startFree} style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 28px", borderRadius: 999, border: "none", background: c.sage, color: dark ? "#191510" : "#fff", cursor: "pointer", fontSize: 16, fontFamily: body, boxShadow: `0 12px 30px ${c.sageSoft}` }}>
                무료로 시작하기 <ArrowUpRight size={18} />
              </button>
              <button className="sn-cta" onClick={peek} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 26px", borderRadius: 999, border: `1px solid ${c.hair}`, background: "transparent", color: c.ink, cursor: "pointer", fontSize: 16, fontFamily: body }}>
                먼저 둘러보기
              </button>
            </div>
            <div style={{ ...up(0.36), display: "flex", alignItems: "center", gap: 14, marginTop: 34, flexWrap: "wrap" }}>
              <span style={{ fontFamily: serifEn, fontStyle: "italic", fontSize: 13.5, color: c.sub }}>발행 채널</span>
              <span style={{ width: 20, height: 1, background: c.hair }} />
              {PLATFORMS.map((p) => (
                <span key={p} style={{ fontSize: 13.5, color: c.sub }}>{p}</span>
              ))}
            </div>
          </div>

          {/* 우: TARRY 오브제 카드 */}
          <div className="sn-hero-art" style={{ ...up(0.18), position: "relative" }}>
            <div style={{ position: "absolute", inset: "-18px -18px 22px", borderRadius: 26, border: `1px solid ${c.hair}`, transform: "rotate(1.5deg)", zIndex: 0 }} />
            <figure className="sn-card" style={{ margin: 0, position: "relative", zIndex: 1, background: c.card, padding: 14, borderRadius: 22, border: `1px solid ${c.hair}`, boxShadow: c.shadow, transform: "rotate(-2.2deg)", animation: "floaty 7s ease-in-out infinite" }}>
              <img src="/tarry-hero.webp" alt="BlogAuto Pro 매니저 TARRY" style={{ width: "100%", height: "auto", display: "block", borderRadius: 14 }} />
              <figcaption style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "14px 6px 4px" }}>
                <span style={{ fontFamily: serifEn, fontStyle: "italic", fontSize: 17, color: c.ink }}>Tarry,</span>
                <span style={{ fontSize: 13, color: c.sub }}>당신의 블로그 매니저</span>
              </figcaption>
            </figure>
            <div style={{ position: "absolute", top: -14, right: 8, zIndex: 2, background: c.sage, color: dark ? "#191510" : "#fff", fontFamily: serifEn, fontStyle: "italic", fontSize: 13.5, padding: "6px 14px", borderRadius: 999, transform: "rotate(4deg)", boxShadow: c.shadow }}>24시간 근무 중</div>
          </div>
        </div>
      </header>

      {/* ── FEATURES ── */}
      <section style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "clamp(40px,7vw,90px) clamp(20px,5vw,72px)" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderTop: `1px solid ${c.hair}`, paddingTop: 30, marginBottom: 46 }}>
          <h2 style={{ fontFamily: serifKo, fontWeight: 700, fontSize: "clamp(28px,3.4vw,42px)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.3 }}>
            네 가지 손을 대신합니다
          </h2>
          <span style={{ fontFamily: serifEn, fontStyle: "italic", fontSize: 15, color: c.sage }}>What Tarry does</span>
        </div>
        <div className="sn-feat" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "clamp(16px,2vw,26px)" }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article key={f.no} className="sn-card" style={{ background: c.paper, border: `1px solid ${c.line}`, borderRadius: 20, padding: "clamp(26px,3vw,38px)", position: "relative", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 26 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 13, background: c.sageSoft, color: c.sage, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={21} /></span>
                  <span style={{ fontFamily: serifEn, fontSize: 34, color: c.hair, lineHeight: 1 }}>{f.no}</span>
                </div>
                <div style={{ fontFamily: serifEn, fontStyle: "italic", fontSize: 14, color: c.sage, marginBottom: 8 }}>{f.en}</div>
                <h3 style={{ fontFamily: serifKo, fontWeight: 700, fontSize: "clamp(21px,2vw,25px)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 15.5, lineHeight: 1.85, color: c.sub, margin: 0 }}>{f.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "clamp(20px,4vw,50px) clamp(20px,5vw,72px) clamp(60px,9vw,110px)" }}>
        <div style={{ position: "relative", overflow: "hidden", background: dark ? c.paper : "#2b2820", color: dark ? c.ink : "#f5efe2", borderRadius: 28, padding: "clamp(44px,6vw,80px)", textAlign: "center", border: `1px solid ${c.hair}` }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(${dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.05)"} 0 1px, transparent 1px 34px)`, pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <span style={{ fontFamily: serifEn, fontStyle: "italic", fontSize: 16, color: c.sage }}>Start today</span>
            <h2 style={{ fontFamily: serifKo, fontWeight: 700, fontSize: "clamp(30px,4.4vw,52px)", letterSpacing: "-0.02em", lineHeight: 1.28, margin: "16px 0 0" }}>
              오늘부터, 블로그는<br />알아서 굴러갑니다
            </h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.8, color: dark ? c.sub : "rgba(245,239,226,0.7)", margin: "22px auto 40px", maxWidth: 440 }}>
              복잡한 설정 없이 5분이면 충분해요. 첫 글은 무료로 만들어 보세요.
            </p>
            <button className="sn-cta" onClick={startFree} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "17px 36px", borderRadius: 999, border: "none", background: c.sage, color: dark ? "#191510" : "#fff", cursor: "pointer", fontSize: 17, fontFamily: body, boxShadow: `0 16px 40px ${dark ? "rgba(0,0,0,0.4)" : "rgba(93,115,80,0.4)"}` }}>
              무료로 시작하기 <ArrowUpRight size={19} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: "relative", zIndex: 2, borderTop: `1px solid ${c.line}`, padding: "34px clamp(20px,5vw,72px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: c.sage, display: "flex", alignItems: "center", justifyContent: "center", color: dark ? "#1a1714" : "#fff", fontFamily: serifEn, fontWeight: 600, fontSize: 15 }}>B</div>
          <span style={{ fontFamily: serifEn, fontSize: 16 }}>BlogAuto Pro</span>
        </div>
        <span style={{ fontSize: 13, color: c.sub }}>© 2026 BlogAuto Pro · 블로그 자동화 스튜디오</span>
      </footer>
    </div>
  );
}
