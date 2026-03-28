/**
 * BlogAuto Pro - Layout Component
 * Design: Modern Professional Dark SaaS
 * Fixed sidebar (240px) + top header + main content area
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Search,
  FileText,
  Image,
  Send,
  Settings,
  Shield,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Bell,
  Download,
  Menu,
  X,
  Zap,
  TrendingUp,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "대시보드", labelEn: "Dashboard" },
  { path: "/keywords", icon: Search, label: "키워드 수집", labelEn: "Keywords" },
  { path: "/content", icon: FileText, label: "콘텐츠 생성", labelEn: "Content" },
  { path: "/images", icon: Image, label: "이미지 생성", labelEn: "Images" },
  { path: "/deploy", icon: Send, label: "배포 관리", labelEn: "Deploy" },
  { path: "/admin", icon: Shield, label: "관리자", labelEn: "Admin" },
  { path: "/settings", icon: Settings, label: "설정", labelEn: "Settings" },
];

interface LayoutProps {
  children: React.ReactNode;
  currentLang?: string;
  onLangChange?: (lang: string) => void;
}

export default function Layout({ children, currentLang = "ko", onLangChange }: LayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(currentLang);

  const handleLangChange = (code: string) => {
    setSelectedLang(code);
    onLangChange?.(code);
    const lang = LANGUAGES.find(l => l.code === code);
    toast.success(`언어가 ${lang?.label}(으)로 변경되었습니다`);
  };

  const handleDownload = () => {
    toast.loading("ZIP 파일 준비 중...", { id: "zip-dl" });
    setTimeout(() => {
      try {
        const content = `BlogAuto Pro - 블로그 자동화 플랫폼\n====================================\n\n내보내기 날짜: ${new Date().toLocaleString("ko-KR")}\n\n== 포함된 기능 ==\n1. 키워드 수집 (애드센스/애드포스트 연동)\n2. AI 콘텐츠 자동 생성 (1,500자 이상)\n3. 실사 이미지 자동 생성\n4. 예약 배포 및 수동 배포\n5. 다국어 지원 (8개국)\n6. 다크/라이트 모드\n7. 관리자 페이지\n\n== 페이지 목록 ==\n- 랜딩 페이지 (/)\n- 대시보드 (/dashboard)\n- 키워드 수집 (/keywords)\n- 콘텐츠 생성 (/content)\n- 이미지 생성 (/images)\n- 배포 관리 (/deploy)\n- 관리자 페이지 (/admin)\n- 설정 (/settings)\n\n== 설치 방법 ==\n1. 압축 파일을 해제합니다\n2. pnpm install 실행\n3. pnpm run dev 로 개발 서버 시작\n4. http://localhost:3000 에서 확인\n\n© 2026 BlogAuto Pro. All rights reserved.\n`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "BlogAuto-Pro-Export.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("다운로드가 시작되었습니다!", { id: "zip-dl" });
      } catch {
        toast.error("다운로드 중 오류가 발생했습니다", { id: "zip-dl" });
      }
    }, 1000);
  };

  const currentLangInfo = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "240px",
          background: "var(--sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center glow-emerald"
            style={{ background: "linear-gradient(135deg, var(--color-emerald), oklch(0.769 0.188 70.08))" }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-sidebar-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              BlogAuto Pro
            </div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              자동화 플랫폼
            </div>
          </div>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-lg" style={{ background: "oklch(0.696 0.17 162.48 / 10%)", border: "1px solid oklch(0.696 0.17 162.48 / 20%)" }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary pulse-dot" />
            <span className="text-xs font-medium" style={{ color: "var(--color-emerald)" }}>시스템 정상 운영 중</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3 px-3" style={{ color: "var(--muted-foreground)" }}>
            메인 메뉴
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.path === "/keywords" && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded badge-active">NEW</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-lg p-2 text-center" style={{ background: "oklch(1 0 0 / 4%)" }}>
              <div className="text-sm font-bold" style={{ color: "var(--color-emerald)" }}>247</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>발행 글</div>
            </div>
            <div className="rounded-lg p-2 text-center" style={{ background: "oklch(1 0 0 / 4%)" }}>
              <div className="text-sm font-bold" style={{ color: "var(--color-amber-brand)" }}>₩89K</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>이번달 수익</div>
            </div>
          </div>

          {/* Download button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs"
            onClick={handleDownload}
          >
            <Download className="w-3.5 h-3.5" />
            ZIP 다운로드
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: "0", paddingLeft: "0" }}>
        {/* Top header */}
        <header
          className="sticky top-0 z-30 flex items-center gap-4 px-4 lg:px-6"
          style={{
            height: "60px",
            background: "var(--background)",
            borderBottom: "1px solid var(--border)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Mobile menu button */}
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop spacer */}
          <div className="hidden lg:block" style={{ width: "240px", flexShrink: 0 }} />

          {/* Search bar placeholder */}
          <div
            className="flex-1 max-w-md hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)", cursor: "pointer" }}
            onClick={() => toast.info("검색 기능은 준비 중입니다")}
          >
            <Search className="w-4 h-4" />
            <span>키워드, 콘텐츠 검색...</span>
            <span className="ml-auto text-xs opacity-60">⌘K</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentLangInfo.flag} {currentLangInfo.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLangChange(lang.code)}
                    className={selectedLang === lang.code ? "bg-accent" : ""}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                    {selectedLang === lang.code && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={toggleTheme}
              title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 relative"
              onClick={() => toast.info("알림이 없습니다")}
            >
              <Bell className="w-4 h-4" />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "var(--color-emerald)" }}
              />
            </Button>

            {/* User avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
              style={{
                background: "linear-gradient(135deg, var(--color-emerald), oklch(0.769 0.188 70.08))",
                color: "white",
              }}
              onClick={() => toast.info("프로필 설정은 준비 중입니다")}
            >
              A
            </div>
          </div>
        </header>

        {/* Page content with left padding for sidebar on desktop */}
        <main className="flex-1 overflow-auto" style={{ paddingLeft: "0" }}>
          <div className="lg:pl-60">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
