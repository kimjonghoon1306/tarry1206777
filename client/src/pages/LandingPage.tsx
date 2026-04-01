/**
 * BlogAuto Pro - Landing Page
 * Design: Modern Professional Dark SaaS
 * Hero section with CTA, feature highlights, platform overview
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
          {/* 운영자 전용 톱니바퀴 */}
          <button
            title="운영자"
            onClick={() => navigate("/superadmin")}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "100vh", paddingTop: "64px" }}
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.75) 50%, var(--background) 100%)" }}
        />

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
            style={{
              background: "oklch(0.696 0.17 162.48 / 15%)",
              border: "1px solid oklch(0.696 0.17 162.48 / 30%)",
              color: "var(--color-emerald)",
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            AI 기반 블로그 완전 자동화
          </div>

          <h1
            className="text-5xl lg:text-7xl font-black mb-6 leading-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}
          >
            블로그 수익을
            <br />
            <span className="gradient-text">자동으로 극대화</span>
          </h1>

          <p className="text-lg lg:text-xl mb-10 max-w-2xl mx-auto text-white/80">
            키워드 수집부터 콘텐츠 작성, 이미지 생성, 자동 배포까지
            <br className="hidden sm:block" />
            블로그 운영의 모든 과정을 AI가 완전 자동화합니다
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2 text-base px-8 py-6 glow-emerald"
              style={{ background: "var(--color-emerald)", color: "white" }}
              onClick={() => navigate("/signup")}
            >
              <Bot className="w-5 h-5" />
              무료로 시작하기
            </Button>
            <Button
              size="lg"
              className="gap-2 text-base px-8 py-6"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
              onClick={() => navigate("/login")}
            >
              <BarChart3 className="w-5 h-5" />
              로그인
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
            {[
              { text: "애드센스 최적화 키워드", ok: true },
              { text: "애드포스트 최적화 키워드", ok: true },
              { text: "워드프레스 자동 배포", ok: true },
              { text: "커스텀 사이트 Webhook 배포", ok: true },
              { text: "네이버 블로그 원클릭 복사", ok: true },
              { text: "8개국 언어 지원", ok: true },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 text-sm"
                style={{ color: "rgba(255,255,255,0.8)" }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

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
