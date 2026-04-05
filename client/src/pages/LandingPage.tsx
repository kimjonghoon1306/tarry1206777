// BlogAuto Pro - LandingPage v3.1
/**
 * BlogAuto Pro - Landing Page
 * Design: Modern Professional Dark SaaS
 * Hero section with CTA, feature highlights, platform overview
 */

import { useEffect, useRef } from "react";
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
  TrendingUp,
  Zap,
  Bot,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  DollarSign,
  Download,
  Settings,
} from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/hero-dashboard-bg-4ZxYwSEJt8froqSKC2fNZb.webp";
const KEYWORD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/keyword-analytics-visual-XspDmCrENBwXQzrBnVdD2H.webp";
const CONTENT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/ai-content-generation-aRDuHC7gHwMgLJAjFXjdyv.webp";
const IMAGE_GEN_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/image-generation-visual-Y2GnT3gv3AaEqJvBKP7dSz.webp";
const DEPLOY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663486730627/d5vsRxSD6NaHGBMn6mcWxj/deployment-visual-Df9Tr6zMZqCfL6CgepL5hz.webp";

// ── 3D Deep Green Hero Canvas ──────────────────────────────────────────────
function HeroCanvas({ onNavigate }: { onNavigate: (path: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let animId: number;

    function initThree() {
      const THREE = (window as any).THREE;
      if (!THREE || !canvasRef.current) return;

      const canvas = canvasRef.current!
    const W = canvas.parentElement!.offsetWidth;
    const H = Math.max(window.innerHeight - 64, 560);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a12);

    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    scene.add(new THREE.AmbientLight(0x0a2a15, 0.8));
    const l1 = new THREE.DirectionalLight(0x2ecc71, 3); l1.position.set(5, 5, 5); scene.add(l1);
    const l2 = new THREE.DirectionalLight(0x1a7a4a, 2); l2.position.set(-5, -3, 2); scene.add(l2);
    const l3 = new THREE.PointLight(0x2ecc71, 2, 20); l3.position.set(2, 3, 4); scene.add(l3);
    const l4 = new THREE.PointLight(0x0f6e3a, 3, 15); l4.position.set(-3, 2, -2); scene.add(l4);

    const mat = new THREE.MeshStandardMaterial({ color: 0x1a7a4a, metalness: 0.95, roughness: 0.08 });
    const group = new THREE.Group(); scene.add(group);
    group.add(new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, 0.32, 200, 32, 2, 3), mat));

    const r1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.04, 16, 120),
      new THREE.MeshStandardMaterial({ color: 0x2ecc71, metalness: 1, roughness: 0.1, transparent: true, opacity: 0.7 })
    );
    r1.rotation.x = Math.PI / 4; group.add(r1);

    const r2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.03, 16, 120),
      new THREE.MeshStandardMaterial({ color: 0x0f6e3a, metalness: 1, roughness: 0.1, transparent: true, opacity: 0.5 })
    );
    r2.rotation.x = -Math.PI / 5; r2.rotation.y = Math.PI / 3; group.add(r2);

    const pg = new THREE.BufferGeometry();
    const pp = new Float32Array(300 * 3);
    for (let i = 0; i < 300 * 3; i++) pp[i] = (Math.random() - 0.5) * 12;
    pg.setAttribute("position", new THREE.BufferAttribute(pp, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x2ecc71, size: 0.03, transparent: true, opacity: 0.5 }));
    scene.add(pts);

    let mx = 0, my = 0, t = 0;
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = -((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    sectionRef.current?.addEventListener("mousemove", onMove);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.008;
      group.rotation.x += (my * 0.5 - group.rotation.x) * 0.05;
      group.rotation.y += (mx * 0.5 + t * 0.3 - group.rotation.y) * 0.05;
      r1.rotation.z += 0.005;
      r2.rotation.z -= 0.003;
      l3.position.x = Math.sin(t * 0.7) * 4;
      l3.position.y = Math.cos(t * 0.5) * 3;
      l4.position.x = Math.cos(t * 0.4) * 4;
      pts.rotation.y += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = canvas.parentElement!.offsetWidth;
      const h = Math.max(window.innerHeight - 64, 560);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      window.removeEventListener("resize", onResize);
      sectionRef.current?.removeEventListener("mousemove", onMove);
    };
    } // end initThree

    // Three.js 동적 로딩
    if ((window as any).THREE) {
      initThree();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.onload = () => initThree();
      document.head.appendChild(script);
    }
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        style={{ position: "relative", width: "100%", minHeight: "calc(100vh - 64px)", overflow: "hidden", background: "#050a12", marginTop: "64px" }}
      >
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

        {/* 비네트 */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 40%, #020d07 100%)", zIndex: 5, pointerEvents: "none" }} />

        {/* 오버레이 */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none", textAlign: "center", padding: "0 20px" }}>

          {/* 뱃지 */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", padding: "6px 16px", fontSize: "14px", fontWeight: 600, marginBottom: "24px", background: "rgba(46,204,113,0.15)", border: "1px solid rgba(46,204,113,0.3)", color: "#2ecc71" }}>
            <Zap style={{ width: 14, height: 14 }} />
            AI 기반 블로그 완전 자동화
          </div>

          {/* 제목 */}
          <h1 style={{ fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif", fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", textShadow: "0 2px 20px rgba(0,0,0,0.95)", marginBottom: "20px", lineHeight: 1.1 }}>
            블로그 수익을<br />
            <span style={{ color: "#2ecc71" }}>자동으로 극대화</span>
          </h1>

          {/* 부제목 */}
          <p style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: "clamp(15px, 2vw, 20px)", color: "rgba(255,255,255,0.8)", marginBottom: "40px", lineHeight: 1.7 }}>
            키워드 수집부터 콘텐츠 작성, 이미지 생성, 자동 배포까지<br />
            블로그 운영의 모든 과정을 AI가 완전 자동화합니다
          </p>

          {/* 버튼 */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", pointerEvents: "all" }}>
            <button
              onClick={() => onNavigate("/dashboard")}
              style={{ padding: "14px 38px", borderRadius: "50px", border: "none", background: "#2ecc71", color: "#ffffff", fontSize: "16px", fontWeight: 800, cursor: "pointer", letterSpacing: "0.5px", boxShadow: "0 4px 24px rgba(46,204,113,0.4)", transition: "all 0.22s", display: "flex", alignItems: "center", gap: "8px" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; (e.currentTarget as HTMLElement).style.background = "#27ae60"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.background = "#2ecc71"; }}
            >
              <Bot style={{ width: 18, height: 18 }} />
              무료로 시작하기
            </button>
            <button
              onClick={() => onNavigate("/login")}
              style={{ padding: "14px 38px", borderRadius: "50px", border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.1)", color: "#ffffff", fontSize: "16px", fontWeight: 700, cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.22s", display: "flex", alignItems: "center", gap: "8px" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
            >
              <BarChart3 style={{ width: 18, height: 18 }} />
              로그인
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", marginTop: "48px" }}>
            {["애드센스 최적화 키워드", "애드포스트 최적화 키워드", "워드프레스 자동 배포", "커스텀 사이트 Webhook 배포", "네이버 블로그 원클릭 복사", "8개국 언어 지원"].map(text => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                <CheckCircle2 style={{ width: 14, height: 14, color: "#2ecc71" }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
// ───────────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Search,
    title: "스마트 키워드 수집",
    desc: "애드센스·애드포스트 연동으로 유입량과 클릭량이 높은 키워드를 실시간 자동 수집",
    img: KEYWORD_IMG,
    color: "var(--color-emerald)",
  },
  {
    icon: FileText,
    title: "AI 콘텐츠 자동 생성",
    desc: "수집된 키워드 기반으로 1,500자 이상의 SEO 최적화 글을 AI가 자동 작성",
    img: CONTENT_IMG,
    color: "var(--color-amber-brand)",
  },
  {
    icon: Image,
    title: "실사 이미지 자동 생성",
    desc: "글 내용에 맞는 디테일하고 실물 같은 고품질 이미지를 AI로 자동 생성",
    img: IMAGE_GEN_IMG,
    color: "oklch(0.6 0.15 220)",
  },
  {
    icon: Send,
    title: "예약 & 수동 배포",
    desc: "네이버 블로그, 티스토리 등 지정 사이트에 예약 배포 및 원클릭 수동 배포",
    img: DEPLOY_IMG,
    color: "oklch(0.75 0.12 300)",
  },
];

const STATS = [
  { value: "10,000+", label: "월간 생성 콘텐츠", icon: FileText },
  { value: "98.7%", label: "자동화 성공률", icon: Zap },
  { value: "8개", label: "지원 언어", icon: Globe },
  { value: "₩2.3M", label: "평균 월 수익 증가", icon: DollarSign },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12"
        style={{
          height: "64px",
          background: "var(--background)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-emerald), var(--color-amber-brand))" }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            BlogAuto <span className="gradient-text">Pro</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-9 h-9">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/login")}
            className="hidden sm:flex"
          >
            로그인
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/signup")}
            style={{ background: "var(--color-emerald)", color: "white" }}
          >
            시작하기 <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          {/* 운영자 전용 톱니바퀴 - 다크/라이트 모두 보이도록 */}
          <button
            title="운영자"
            onClick={() => navigate("/superadmin")}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--muted-foreground)", background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section - 3D Deep Green */}
      <HeroCanvas onNavigate={navigate} />

      {/* Stats Section */}
      <section className="py-16 px-6" style={{ background: "var(--card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-3xl lg:text-4xl font-black mb-1 gradient-text"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-5xl font-black mb-4 text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              완전 자동화 파이프라인
            </h2>
            <p style={{ color: "var(--muted-foreground)" }} className="text-lg max-w-2xl mx-auto">
              수동 작업 없이 수익형 블로그를 운영하는 4단계 자동화 시스템
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {FEATURES.map((feature, idx) => (
              <div
                key={feature.title}
                className="feature-card rounded-2xl overflow-hidden"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {/* Feature image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={feature.img}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, var(--card) 0%, transparent 60%)" }}
                  />
                  <div
                    className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${feature.color}20`, border: `1px solid ${feature.color}40` }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <div
                    className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: feature.color }}
                  >
                    {idx + 1}
                  </div>
                </div>

                {/* Feature content */}
                <div className="p-6">
                  <h3
                    className="text-xl font-bold mb-2 text-foreground"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {feature.desc}
                  </p>
                  <button
                    className="mt-4 flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ color: feature.color }}
                    onClick={() => navigate("/dashboard")}
                  >
                    자세히 보기 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 수익화 전략 섹션 */}
      <section className="py-20 px-6" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black mb-4 text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              수익화 전략
            </h2>
            <p style={{ color: "var(--muted-foreground)" }}>
              네이버 검색광고 API 기반으로 고수익 키워드를 자동 선별합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google AdSense */}
            <div className="rounded-2xl p-6 feature-card"
              style={{ background: "var(--background)", border: "2px solid #4285F440" }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white"
                  style={{ background: "#4285F4" }}>G</div>
                <div>
                  <div className="font-bold text-foreground">Google AdSense</div>
                  <div className="text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 font-semibold"
                    style={{ background: "oklch(0.696 0.17 162.48/20%)", color: "var(--color-emerald)" }}>
                    CPC 최적화 키워드 수집
                  </div>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                CPC(클릭당 단가)가 높은 키워드를 자동 선별해 애드센스 수익을 극대화합니다
              </p>
              <div className="space-y-2">
                {[
                  "클릭당 단가(CPC) 높은 키워드 자동 선별",
                  "글로벌 트래픽 유입 최적화",
                  "워드프레스·커스텀사이트에 자동 발행",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#4285F4" }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Naver AdPost */}
            <div className="rounded-2xl p-6 feature-card"
              style={{ background: "var(--background)", border: "2px solid #03C75A40" }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white"
                  style={{ background: "#03C75A" }}>N</div>
                <div>
                  <div className="font-bold text-foreground">Naver AdPost</div>
                  <div className="text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 font-semibold"
                    style={{ background: "oklch(0.696 0.17 162.48/20%)", color: "var(--color-emerald)" }}>
                    CPM 최적화 키워드 수집
                  </div>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                네이버 검색광고 API로 조회수·클릭량 높은 키워드를 수집해 애드포스트 수익을 높입니다
              </p>
              <div className="space-y-2">
                {[
                  "네이버 검색광고 API 기반 키워드 수집",
                  "국내 트래픽 최적화 키워드 자동 추천",
                  "네이버 블로그 원클릭 복사 배포",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#03C75A" }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 배포 플랫폼 섹션 */}
      <section className="py-20 px-6" style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black mb-4 text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              멀티 플랫폼 배포
            </h2>
            <p style={{ color: "var(--muted-foreground)" }}>
              글 한 편으로 여러 플랫폼에 동시 배포해 수익을 극대화하세요
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* 워드프레스 */}
            <div className="rounded-2xl p-6 feature-card relative overflow-hidden"
              style={{ background: "var(--card)", border: "2px solid oklch(0.696 0.17 162.48/50%)" }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10"
                style={{ background: "var(--color-emerald)" }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: "#21759B" }}>WP</div>
                <div>
                  <div className="font-bold text-foreground">WordPress</div>
                  <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block"
                    style={{ background: "oklch(0.696 0.17 162.48/20%)", color: "var(--color-emerald)" }}>
                    ⚡ 완전 자동 발행
                  </div>
                </div>
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                REST API 연동으로 글·이미지·태그·카테고리까지 클릭 한 번에 자동 발행
              </p>
              <div className="space-y-1.5">
                {["즉시 발행 / 예약 발행", "이미지 자동 첨부", "해시태그 자동 등록"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--foreground)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-emerald)" }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* 커스텀 웹사이트 */}
            <div className="rounded-2xl p-6 feature-card relative overflow-hidden"
              style={{ background: "var(--card)", border: "2px solid oklch(0.696 0.17 162.48/50%)" }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10"
                style={{ background: "oklch(0.6 0.15 220)" }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: "oklch(0.65 0.28 350)" }}>C</div>
                <div>
                  <div className="font-bold text-foreground">커스텀 사이트</div>
                  <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block"
                    style={{ background: "oklch(0.696 0.17 162.48/20%)", color: "var(--color-emerald)" }}>
                    ⚡ Webhook 자동 발행
                  </div>
                </div>
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                직접 만든 사이트나 어떤 CMS든 Webhook URL만 등록하면 자동으로 글이 전송됩니다
              </p>
              <div className="space-y-1.5">
                {["모든 CMS·플랫폼 호환", "인증키 보안 지원", "JSON 데이터 자동 전송"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--foreground)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-emerald)" }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* 네이버 블로그 */}
            <div className="rounded-2xl p-6 feature-card relative overflow-hidden"
              style={{ background: "var(--card)", border: "2px solid oklch(0.769 0.188 70.08/50%)" }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10"
                style={{ background: "var(--color-amber-brand)" }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: "#03C75A" }}>N</div>
                <div>
                  <div className="font-bold text-foreground">네이버 블로그</div>
                  <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block"
                    style={{ background: "oklch(0.769 0.188 70.08/20%)", color: "var(--color-amber-brand)" }}>
                    📋 원클릭 복사 발행
                  </div>
                </div>
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                네이버 정책상 자동 발행은 불가하지만, 버튼 하나로 글·이미지·해시태그를 복사해 바로 붙여넣기
              </p>
              <div className="space-y-1.5">
                {["마크다운 → 네이버 형식 자동 변환", "해시태그 포함 복사", "이미지 배치 안내 포함"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--foreground)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-amber-brand)" }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 추가 예정 */}
          <div className="mt-6 rounded-2xl p-5 text-center"
            style={{ background: "var(--card)", border: "1px dashed var(--border)" }}>
            <p className="text-sm font-semibold text-foreground mb-1">🚀 곧 추가 예정</p>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              티스토리 자동 배포 · 구글 Search Console 색인 요청 · 텔레그램 발행 알림
            </p>
          </div>
        </div>
      </section>

      {/* Language Support Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Globe className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--color-emerald)" }} />
          <h2
            className="text-3xl lg:text-4xl font-black mb-4 text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            8개국 언어 자동 번역
          </h2>
          <p className="text-lg mb-10" style={{ color: "var(--muted-foreground)" }}>
            언어를 선택하면 모든 콘텐츠가 해당 국가의 언어로 자동 변환됩니다
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { flag: "🇰🇷", lang: "한국어", code: "ko" },
              { flag: "🇺🇸", lang: "English", code: "en" },
              { flag: "🇯🇵", lang: "日本語", code: "ja" },
              { flag: "🇨🇳", lang: "中文", code: "zh" },
              { flag: "🇪🇸", lang: "Español", code: "es" },
              { flag: "🇫🇷", lang: "Français", code: "fr" },
              { flag: "🇩🇪", lang: "Deutsch", code: "de" },
              { flag: "🇧🇷", lang: "Português", code: "pt" },
            ].map((item) => (
              <button
                key={item.lang}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-foreground feature-card transition-all active:scale-95"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                onClick={() => {
                  localStorage.setItem("content_language", item.code);
                  toast.success(`✅ 콘텐츠 언어가 ${item.lang}(으)로 설정됐어요! 로그인 후 적용됩니다`, { duration: 3000 });
                }}
              >
                <span className="text-xl">{item.flag}</span>
                {item.lang}
              </button>
            ))}
          </div>
          <p className="text-sm mt-6" style={{ color: "var(--muted-foreground)" }}>
            클릭하면 언어가 설정됩니다 · 로그인 후 콘텐츠 생성 시 자동 적용
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-24 px-6 text-center relative overflow-hidden"
        style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2
            className="text-4xl lg:text-5xl font-black mb-6 text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            지금 바로 시작하세요
          </h2>
          <p className="text-lg mb-8" style={{ color: "var(--muted-foreground)" }}>
            블로그 자동화로 월 수익을 극대화하고 시간을 절약하세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2 text-base px-10 py-6 glow-emerald"
              style={{ background: "var(--color-emerald)", color: "white" }}
              onClick={() => navigate("/dashboard")}
            >
              대시보드 시작하기 <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base px-10 py-6"
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
              }}
            >
              <Download className="w-5 h-5" />
              ZIP 다운로드
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center text-sm"
        style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-emerald), var(--color-amber-brand))" }}
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">BlogAuto Pro</span>
        </div>
        <p>© 2026 BlogAuto Pro. All rights reserved. | 블로그 자동화 플랫폼</p>
      </footer>
    </div>
  );
}
