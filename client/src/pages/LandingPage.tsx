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
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
            {[
              { icon: CheckCircle2, text: "애드센스 연동" },
              { icon: CheckCircle2, text: "애드포스트 연동" },
              { icon: CheckCircle2, text: "네이버 블로그 배포" },
              { icon: CheckCircle2, text: "8개국 언어 지원" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 text-sm text-white/70">
                <item.icon className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
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

      {/* Ad Platform Section */}
      <section className="py-20 px-6" style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl lg:text-4xl font-black mb-4 text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              수익 플랫폼 선택
            </h2>
            <p style={{ color: "var(--muted-foreground)" }}>
              애드센스와 애드포스트 중 원하는 플랫폼을 선택하거나 동시에 활용하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: "Google AdSense",
                logo: "G",
                color: "#4285F4",
                desc: "전 세계 최대 광고 네트워크. 글로벌 트래픽 수익화에 최적화",
                features: ["CPC 기반 수익", "글로벌 광고주", "자동 최적화"],
              },
              {
                name: "Naver AdPost",
                logo: "N",
                color: "#03C75A",
                desc: "국내 최대 포털 네이버의 블로그 광고. 한국 트래픽 수익화에 최적",
                features: ["CPM 기반 수익", "국내 광고주", "네이버 블로그 연동"],
              },
            ].map((platform) => (
              <div
                key={platform.name}
                className="rounded-2xl p-6 feature-card"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white"
                    style={{ background: platform.color }}
                  >
                    {platform.logo}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{platform.name}</div>
                    <div className="text-xs badge-active px-2 py-0.5 rounded-full inline-block mt-0.5">연동 가능</div>
                  </div>
                </div>
                <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>{platform.desc}</p>
                <div className="space-y-2">
                  {platform.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-emerald)" }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
              { flag: "🇰🇷", lang: "한국어" },
              { flag: "🇺🇸", lang: "English" },
              { flag: "🇯🇵", lang: "日本語" },
              { flag: "🇨🇳", lang: "中文" },
              { flag: "🇪🇸", lang: "Español" },
              { flag: "🇫🇷", lang: "Français" },
              { flag: "🇩🇪", lang: "Deutsch" },
              { flag: "🇧🇷", lang: "Português" },
            ].map((item) => (
              <div
                key={item.lang}
                className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-foreground feature-card"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <span className="text-xl">{item.flag}</span>
                {item.lang}
              </div>
            ))}
          </div>
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
