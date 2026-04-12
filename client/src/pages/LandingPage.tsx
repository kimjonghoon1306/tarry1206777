// BlogAuto Pro - LandingPage v4.0
/**
 * BlogAuto Pro - Landing Page
 * Design: Cinematic Dark SaaS — Immersive, Bold, Universal
 */

import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Search,
  FileText,
  Image,
  Send,
  Globe,
  Sun,
  Moon,
  Zap,
  Bot,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  DollarSign,
  Download,
  Settings,
  Sparkles,
  TrendingUp,
  BarChart3,
} from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/hero-dashboard-bg-4ZxYwSEJt8froqSKC2fNZb.webp";
const KEYWORD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/keyword-analytics-visual-XspDmCrENBwXQzrBnVdD2H.webp";
const CONTENT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/ai-content-generation-aRDuHC7gHwMgLJAjFXjdyv.webp";
const IMAGE_GEN_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/image-generation-visual-Y2GnT3gv3AaEqJvBKP7dSz.webp";
const DEPLOY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/deployment-visual-Df9Tr6zMZqCfL6CgepL5hz.webp";

const FEATURES = [
  { icon: Search, title: "스마트 키워드 수집", desc: "애드센스·애드포스트 연동으로 유입량과 클릭량이 높은 키워드를 실시간 자동 수집", img: KEYWORD_IMG, color: "#10b981", num: "01" },
  { icon: FileText, title: "AI 콘텐츠 자동 생성", desc: "수집된 키워드 기반으로 1,500자 이상의 SEO 최적화 글을 AI가 자동 작성", img: CONTENT_IMG, color: "#f59e0b", num: "02" },
  { icon: Image, title: "실사 이미지 자동 생성", desc: "글 내용에 맞는 디테일하고 실물 같은 고품질 이미지를 AI로 자동 생성", img: IMAGE_GEN_IMG, color: "#6366f1", num: "03" },
  { icon: Send, title: "예약 & 수동 배포", desc: "원하는 사이트에 예약 배포 및 원클릭 수동 배포로 완전 자동화", img: DEPLOY_IMG, color: "#ec4899", num: "04" },
];

const STATS = [
  { value: "10,000+", label: "월간 생성 콘텐츠", icon: FileText, color: "#10b981" },
  { value: "98.7%", label: "자동화 성공률", icon: Zap, color: "#f59e0b" },
  { value: "8개국", label: "언어 지원", icon: Globe, color: "#6366f1" },
  { value: "₩2.3M", label: "평균 월 수익 증가", icon: DollarSign, color: "#ec4899" },
];

const LANGUAGES = [
  { flag: "🇰🇷", lang: "한국어", code: "ko" },
  { flag: "🇺🇸", lang: "English", code: "en" },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen" style={{ background: "#080c10", fontFamily: "'Pretendard Variable', sans-serif" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px #10b98150,0 0 40px #10b98120} 50%{box-shadow:0 0 60px #10b98190,0 0 100px #10b98140} }
        @keyframes neon-flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.4} 94%{opacity:1} 96%{opacity:0.6} 97%{opacity:1} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(120px) rotate(0deg)} to{transform:rotate(360deg) translateX(120px) rotate(-360deg)} }
        @keyframes orbit2 { from{transform:rotate(120deg) translateX(180px) rotate(-120deg)} to{transform:rotate(480deg) translateX(180px) rotate(-480deg)} }
        @keyframes orbit3 { from{transform:rotate(240deg) translateX(140px) rotate(-240deg)} to{transform:rotate(600deg) translateX(140px) rotate(-600deg)} }
        @keyframes particle { 0%{transform:translateY(0) translateX(0);opacity:1} 100%{transform:translateY(-120px) translateX(var(--dx));opacity:0} }
        @keyframes scanline { 0%{top:-10%} 100%{top:110%} }
        @keyframes counter { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes tilt3d { 0%,100%{transform:perspective(800px) rotateX(0deg) rotateY(0deg)} 25%{transform:perspective(800px) rotateX(3deg) rotateY(-3deg)} 75%{transform:perspective(800px) rotateX(-3deg) rotateY(3deg)} }
        @keyframes matrix-rain { 0%{transform:translateY(-100%);opacity:1} 100%{transform:translateY(1000%);opacity:0} }
        @keyframes rgb-shift { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
        @keyframes bounce-in { 0%{transform:scale(0) rotate(-10deg);opacity:0} 60%{transform:scale(1.1) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes slide-right { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes morph { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }

        .anim-float { animation: float 6s ease-in-out infinite; }
        .anim-fadeup { animation: fadeUp 0.8s ease both; }
        .anim-fadeup-1 { animation: fadeUp 0.8s 0.15s ease both; }
        .anim-fadeup-2 { animation: fadeUp 0.8s 0.3s ease both; }
        .anim-fadeup-3 { animation: fadeUp 0.8s 0.45s ease both; }
        .anim-fadeup-4 { animation: fadeUp 0.8s 0.6s ease both; }
        .anim-glow { animation: glow-pulse 3s ease-in-out infinite; }
        .anim-neon { animation: neon-flicker 8s ease-in-out infinite; }
        .anim-tilt { animation: tilt3d 8s ease-in-out infinite; }
        .anim-morph { animation: morph 8s ease-in-out infinite; }
        .anim-rgb { animation: rgb-shift 10s linear infinite; }

        .nav-blur { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }

        .grid-bg {
          background-image:
            linear-gradient(rgba(16,185,129,0.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(16,185,129,0.05) 1px,transparent 1px);
          background-size: 50px 50px;
        }

        .text-gradient { background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #f59e0b 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .text-gradient-hot { background: linear-gradient(135deg, #10b981, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; background-size: 200%; animation: rgb-shift 5s linear infinite; }

        .btn-shine { position:relative; overflow:hidden; cursor:pointer; }
        .btn-shine::before { content:''; position:absolute; top:0; left:-100%; width:50%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent); transition:0.5s; }
        .btn-shine:hover::before { left:150%; }
        .btn-shine:hover { transform: translateY(-2px); }
        .btn-shine:active { transform: scale(0.97); }

        .feature-card-3d {
          transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
          transform-style: preserve-3d;
          cursor: pointer;
        }
        .feature-card-3d:hover {
          transform: translateY(-10px) rotateX(4deg) rotateY(-4deg);
          box-shadow: 0 30px 60px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.2);
        }

        .stat-card {
          transition: all 0.4s cubic-bezier(0.23,1,0.32,1);
          position: relative;
          overflow: hidden;
        }
        .stat-card::after {
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(135deg,transparent 60%,rgba(16,185,129,0.08));
          opacity:0;
          transition:0.3s;
        }
        .stat-card:hover { transform: translateY(-8px) scale(1.03); }
        .stat-card:hover::after { opacity:1; }

        .lang-btn {
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          position: relative;
          overflow: hidden;
        }
        .lang-btn:hover { transform: translateY(-6px) scale(1.08); box-shadow: 0 12px 30px rgba(16,185,129,0.25); border-color: rgba(16,185,129,0.5) !important; }
        .lang-btn:active { transform: scale(0.95); }

        .platform-card {
          transition: all 0.35s cubic-bezier(0.23,1,0.32,1);
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
        }
        .platform-card::before {
          content:'';
          position:absolute;
          top:-50%;
          left:-50%;
          width:200%;
          height:200%;
          background:conic-gradient(transparent,rgba(16,185,129,0.05),transparent 30%);
          animation:rgb-shift 8s linear infinite;
          opacity:0;
          transition:0.4s;
        }
        .platform-card:hover { transform: translateY(-8px); border-color: rgba(16,185,129,0.3); box-shadow: 0 20px 50px rgba(16,185,129,0.1); }
        .platform-card:hover::before { opacity:1; }

        .scanline {
          position:absolute;
          left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,rgba(16,185,129,0.4),transparent);
          animation:scanline 4s linear infinite;
          pointer-events:none;
        }

        .orbit-dot-1 { position:absolute; width:8px; height:8px; border-radius:50%; background:#10b981; box-shadow:0 0 10px #10b981; animation:orbit 6s linear infinite; }
        .orbit-dot-2 { position:absolute; width:6px; height:6px; border-radius:50%; background:#6366f1; box-shadow:0 0 8px #6366f1; animation:orbit2 9s linear infinite; }
        .orbit-dot-3 { position:absolute; width:5px; height:5px; border-radius:50%; background:#f59e0b; box-shadow:0 0 8px #f59e0b; animation:orbit3 7s linear infinite; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12"
        style={{ height: "64px", background: "rgba(8,12,16,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10b981, #f59e0b)" }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            BlogAuto <span className="text-gradient-hot">Pro</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-8 h-8" style={{ color: "#94a3b8" }}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/login")}
            style={{ whiteSpace: "nowrap", borderColor: "rgba(255,255,255,0.15)", color: "#e2e8f0", background: "transparent" }}>
            로그인
          </Button>
          <button className="btn-shine flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.35)", whiteSpace: "nowrap" }}
            onClick={() => {
              localStorage.setItem("guest_mode", "true");
              toast.success("👀 둘러보기 모드입니다. 실제 기능은 가입 후 이용 가능해요!", { duration: 3000 });
              navigate("/dashboard");
            }}>
            둘러보기 <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button title="운영자" onClick={() => navigate("/superadmin")}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "#64748b", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex items-center justify-center overflow-hidden grid-bg"
        style={{ minHeight: "100vh", paddingTop: "64px" }}>
        {/* BG */}
        <div className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${HERO_BG})` }} />
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(16,185,129,0.08) 0%, transparent 70%), linear-gradient(to bottom, rgba(8,12,16,0.3) 0%, rgba(8,12,16,0.95) 100%)" }} />

        {/* 배경 글로우 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-15 anim-float"
          style={{ background: "radial-gradient(circle, #10b981, transparent)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full anim-float"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)", filter: "blur(90px)", opacity: 0.08, animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full anim-float"
          style={{ background: "radial-gradient(circle, #f59e0b, transparent)", filter: "blur(100px)", opacity: 0.06, animationDelay: "4s" }} />

        {/* 오비팅 파티클 */}
        <div className="absolute" style={{ top: "30%", left: "15%", width: 0, height: 0 }}>
          <div className="orbit-dot-1" />
        </div>
        <div className="absolute" style={{ top: "60%", right: "15%", width: 0, height: 0 }}>
          <div className="orbit-dot-2" />
        </div>
        <div className="absolute" style={{ top: "45%", left: "50%", width: 0, height: 0 }}>
          <div className="orbit-dot-3" />
        </div>

        {/* 스캔라인 */}
        <div className="scanline" />

        {/* 모핑 블롭 */}
        <div className="anim-morph absolute opacity-5"
          style={{ width: 400, height: 400, top: "20%", right: "5%", background: "radial-gradient(circle, #10b981, #6366f1)", filter: "blur(40px)" }} />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="anim-fadeup inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 tracking-widest uppercase"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
            <Sparkles className="w-3 h-3" /> AI 기반 블로그 완전 자동화 플랫폼
          </div>

          <h1 className="anim-fadeup-1 font-black mb-6 leading-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.04em" }}>
            블로그 수익을<br />
            <span className="text-gradient">자동으로 극대화</span>
          </h1>

          <p className="anim-fadeup-2 mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.6)" }}>
            키워드 수집부터 콘텐츠 작성, 이미지 생성, 자동 배포까지<br className="hidden sm:block" />
            블로그 운영의 모든 과정을 AI가 완전 자동화합니다
          </p>

          <div className="anim-fadeup-3 flex flex-row gap-3 justify-center flex-wrap">
            <Button size="lg" className="btn-shine gap-2 text-base px-8 py-6 anim-glow"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", whiteSpace: "nowrap" }}
              onClick={() => navigate("/signup")}>
              무료로 시작하기 <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="btn-shine gap-2 text-base px-8 py-6"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)", color: "white", whiteSpace: "nowrap" }}
              onClick={() => {
                localStorage.setItem("guest_mode", "true");
                toast.success("👀 둘러보기 모드입니다!", { duration: 3000 });
                navigate("/dashboard");
              }}>
              먼저 둘러보기
            </Button>
          </div>

          {/* STATS */}
          <div className="anim-fadeup-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="stat-card rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-2xl font-black mb-1" style={{ color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 스크롤 힌트 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: "rgba(255,255,255,0.15)" }}>
            <div className="w-1 h-2 rounded-full" style={{ background: "#10b981", animation: "float 2s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6" style={{ background: "#080c10" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#10b981" }}>FEATURES</p>
            <h2 className="font-black text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.03em" }}>
              블로그 자동화의 모든 것
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem" }}>
              복잡한 설정 없이 바로 시작하는 완전 자동화 파이프라인
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature-card-3d rounded-3xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", animationDelay: `${i * 0.1}s` }}>
                <div className="relative h-52 overflow-hidden">
                  <img src={f.img} alt={f.title} className="w-full h-full object-cover" style={{ opacity: 0.7 }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 30%, rgba(8,12,16,0.95) 100%)` }} />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                      <f.icon className="w-4 h-4" style={{ color: f.color }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Space Grotesk', sans-serif" }}>{f.num}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-white text-lg mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section className="py-24 px-6" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#6366f1" }}>PLATFORMS</p>
            <h2 className="font-black text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.03em" }}>
              모든 플랫폼에 자동 배포
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* WordPress */}
            <div className="platform-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white mb-4 text-sm"
                style={{ background: "#21759B" }}>WP</div>
              <div className="font-bold text-white mb-1">WordPress</div>
              <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block mb-3"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>⚡ 자동 발행</div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                WordPress REST API로 글·이미지·카테고리·태그를 완전 자동으로 발행
              </p>
            </div>

            {/* Blogger */}
            <div className="platform-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white mb-4 text-sm"
                style={{ background: "#FF5722" }}>B</div>
              <div className="font-bold text-white mb-1">블로거 (Blogger)</div>
              <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block mb-3"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>⚡ 자동 발행</div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                구글 블로거 API 연동으로 애드센스 최적화 글 자동 발행
              </p>
            </div>

            {/* Medium */}
            <div className="platform-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white mb-4 text-sm"
                style={{ background: "#333" }}>M</div>
              <div className="font-bold text-white mb-1">미디엄 (Medium)</div>
              <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block mb-3"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>⚡ 자동 발행</div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                영문 콘텐츠를 미디엄에 자동 발행해 글로벌 트래픽 확보
              </p>
            </div>

            {/* Custom */}
            <div className="platform-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white mb-4 text-sm"
                style={{ background: "oklch(0.65 0.28 350)" }}>C</div>
              <div className="font-bold text-white mb-1">커스텀 사이트</div>
              <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block mb-3"
                style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>⚡ Webhook 자동 발행</div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                어떤 CMS든 Webhook URL만 등록하면 자동으로 글이 전송됩니다
              </p>
            </div>

            {/* Naver */}
            <div className="platform-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white mb-4 text-sm"
                style={{ background: "#03C75A" }}>N</div>
              <div className="font-bold text-white mb-1">네이버 블로그</div>
              <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block mb-3"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>📋 원클릭 복사</div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                버튼 하나로 글·이미지·해시태그를 복사해 바로 붙여넣기
              </p>
            </div>

            {/* Coming Soon */}
            <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div className="text-3xl mb-3">🚀</div>
              <div className="font-bold text-white mb-2 text-sm">곧 추가 예정</div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                구글 Search Console 색인 요청<br />텔레그램 발행 알림
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── LANGUAGE ── */}
      <section className="py-24 px-6" style={{ background: "#080c10" }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#ec4899" }}>MULTILINGUAL</p>
          <h2 className="font-black text-white mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.03em" }}>
            한국어 · 영어로 동시 배포
          </h2>
          <p className="mb-10" style={{ color: "rgba(255,255,255,0.45)", fontSize: "1rem" }}>
            언어를 선택하면 콘텐츠가 자동으로 해당 언어로 생성됩니다
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {LANGUAGES.map((item) => (
              <button key={item.lang} className="lang-btn flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => {
                  localStorage.setItem("content_language", item.code);
                  toast.success(`✅ 콘텐츠 언어가 ${item.lang}(으)로 설정됐어요! 로그인 후 적용됩니다`, { duration: 3000 });
                }}>
                <span className="text-xl">{item.flag}</span>
                {item.lang}
              </button>
            ))}
          </div>
          <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>
            클릭하면 언어가 설정됩니다 · 로그인 후 콘텐츠 생성 시 자동 적용
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(99,102,241,0.08) 100%)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10b981, transparent)", filter: "blur(80px)" }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
            <Zap className="w-3 h-3" /> 지금 바로 시작하세요
          </div>
          <h2 className="font-black text-white mb-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.04em" }}>
            블로그 자동화로<br />수익을 극대화하세요
          </h2>
          <p className="mb-10" style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem" }}>
            복잡한 설정 없이 5분 안에 시작할 수 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-shine gap-2 text-base px-10 py-6"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", boxShadow: "0 8px 32px rgba(16,185,129,0.4)" }}
              onClick={() => navigate("/dashboard")}>
              대시보드 시작하기 <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="btn-shine gap-2 text-base px-10 py-6"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}
              onClick={() => {
                toast.loading("ZIP 파일 준비 중...", { id: "landing-zip" });
                setTimeout(() => {
                  const content = `BlogAuto Pro - 블로그 자동화 플랫폼\n====================================\n\n내보내기 날짜: ${new Date().toLocaleString("ko-KR")}\n\n== 포함된 기능 ==\n1. 키워드 수집 (애드센스/애드포스트 연동)\n2. AI 콘텐츠 자동 생성 (1,500자 이상)\n3. 실사 이미지 자동 생성\n4. 예약 배포 및 수동 배포\n5. 다국어 지원 (8개국)\n6. 다크/라이트 모드\n7. 관리자 페이지\n\n== 페이지 목록 ==\n- 랜딩 페이지 (/)\n- 대시보드 (/dashboard)\n- 키워드 수집 (/keywords)\n- 콘텐츠 생성 (/content)\n- 이미지 생성 (/images)\n- 배포 관리 (/deploy)\n- 관리자 페이지 (/admin)\n- 설정 (/settings)\n\n© 2026 BlogAuto Pro. All rights reserved.\n`;
                  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "BlogAuto-Pro-Export.txt";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success("다운로드가 시작되었습니다!", { id: "landing-zip" });
                }, 1000);
              }}>
              <Download className="w-5 h-5" />
              ZIP 다운로드
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 text-center text-sm"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10b981, #f59e0b)" }}>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white">BlogAuto Pro</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)" }}>© 2026 BlogAuto Pro. All rights reserved. | 블로그 자동화 플랫폼</p>
      </footer>
    </div>
  );
}
