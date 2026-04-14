/**
 * BlogAuto Pro - Layout Component
 * Design: Modern Professional Dark SaaS
 * Fixed sidebar (240px) + top header + main content area
 */

import { useState, useEffect } from "react";
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
  User,
  LogOut,
  Gift,
} from "lucide-react";
import { clearUserLocalCache, loadNotificationsFromServer, markNotificationsRead } from "@/lib/user-storage";
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
  { path: "/dashboard", icon: LayoutDashboard, label: "대시보드", labelEn: "Dashboard", pink: false },
  { path: "/keywords", icon: Search, label: "키워드 수집", labelEn: "Keywords", pink: false },
  { path: "/content", icon: FileText, label: "콘텐츠 생성", labelEn: "Content", pink: false },
  { path: "/images", icon: Image, label: "이미지 생성", labelEn: "Images", pink: false },
  { path: "/deploy", icon: Send, label: "배포 관리", labelEn: "Deploy", pink: false },
  { path: "/campaigns", icon: Gift, label: "체험단 허브", labelEn: "Campaigns", pink: true },
  { path: "/mypage", icon: User, label: "마이페이지", labelEn: "My Page", pink: false },
  { path: "/settings", icon: Settings, label: "설정", labelEn: "Settings", pink: false },
];

interface LayoutProps {
  children: React.ReactNode;
  currentLang?: string;
  onLangChange?: (lang: string) => void;
}

const PINK_KEYFRAME = `
@keyframes pinkPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0); }
  50% { box-shadow: 0 0 8px 2px rgba(236,72,153,0.35); }
}
`;

export default function Layout({ children, currentLang = "ko", onLangChange }: LayoutProps) {
  const [location, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(currentLang);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; desc: string; createdAt: string; read: boolean }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isGuestMode = localStorage.getItem("guest_mode") === "true";

  useEffect(() => {
    // 대시보드에서 저장한 발행 글 수 읽기
    const count = parseInt(localStorage.getItem("blogauto_post_count") || "0");
    if (count > 0) setTotalPosts(count);
  }, []);

  useEffect(() => {
    // 알림 불러오기 (로그인 상태일 때만)
    if (!isGuestMode && localStorage.getItem("ba_token")) {
      loadNotificationsFromServer().then(list => {
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.read).length);
      });
    }
  }, []);

  const handleGuestBlock = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.error("🔒 가입 후 이용 가능한 기능이에요!", {
      action: { label: "회원가입", onClick: () => { localStorage.removeItem("guest_mode"); navigate("/signup"); } },
      duration: 4000,
    });
  };

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
    <div className="min-h-screen bg-background flex" style={{ overflowX:"hidden", maxWidth:"100vw" }}>
      <style>{PINK_KEYFRAME}</style>
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
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
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
                  🏠 홈으로
                </div>
              </div>
            </div>
          </Link>
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
            const isDashboard = item.path === "/dashboard";
            return (
              <div key={item.path}
                onClick={isGuestMode && !isDashboard ? handleGuestBlock : undefined}
                style={isGuestMode && !isDashboard ? { cursor: "not-allowed", opacity: 0.5 } : {}}>
                <Link href={isGuestMode && !isDashboard ? "#" : item.path}>
                  <div
                    className={`nav-item ${isActive ? "active" : ""}`}
                    onClick={() => !isGuestMode && setSidebarOpen(false)}
                    style={item.pink ? {
                      color: isActive ? "#fff" : "#f472b6",
                      background: isActive ? "linear-gradient(90deg,#be185d,#ec4899)" : "rgba(236,72,153,0.08)",
                      border: "1px solid rgba(236,72,153,0.25)",
                      borderRadius: "8px",
                      marginTop: "4px",
                      animation: "pinkPulse 2.5s ease-in-out infinite",
                    } : {}}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                    {item.path === "/keywords" && !isGuestMode && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded badge-active">NEW</span>
                    )}
                    {item.pink && !isGuestMode && (
                      <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{background:"rgba(236,72,153,0.2)",color:"#f472b6"}}>HOT</span>
                    )}
                    {isGuestMode && !isDashboard && (
                      <span className="ml-auto text-xs">🔒</span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-lg p-2 text-center" style={{ background: "oklch(1 0 0 / 4%)" }}>
              <div className="text-sm font-bold" style={{ color: "var(--color-emerald)" }}>{totalPosts}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>발행 글</div>
            </div>
            <div className="rounded-lg p-2 text-center" style={{ background: "oklch(1 0 0 / 4%)" }}>
              <div className="text-sm font-bold" style={{ color: "var(--color-amber-brand)" }}>—</div>
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

          {/* Search bar - keywords 페이지로 이동 */}
          <form
            className="flex-1 max-w-md hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--muted)", cursor: "text" }}
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector("input") as HTMLInputElement;
              const val = input?.value?.trim();
              if (val) {
                // 이미 keywords 페이지면 이벤트로 전달
                window.dispatchEvent(new CustomEvent("layout-search", { detail: val }));
                // keywords 페이지가 아니면 이동
                if (!window.location.pathname.includes("/keywords")) {
                  window.location.href = `/keywords?q=${encodeURIComponent(val)}`;
                }
                input.value = "";
              }
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--foreground)" }}
              placeholder="키워드 입력 후 Enter → 수집..."
            />
            <span className="ml-auto text-xs opacity-60" style={{ color: "var(--muted-foreground)" }}>Enter</span>
          </form>

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
            <DropdownMenu onOpenChange={(open) => {
              if (open && unreadCount > 0) {
                markNotificationsRead();
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
              }
            }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 relative">
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 ? (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: "#ef4444", color: "white", padding: "0 3px" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : (
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ background: "var(--color-emerald)" }}
                    />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                style={{ width: "min(320px, calc(100vw - 24px))", maxHeight: 420, overflowY: "auto", padding: 0 }}
              >
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>알림</span>
                  <span style={{ fontSize: 12, color: "var(--muted-foreground)", background: "var(--muted)", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>{notifications.length}개</span>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "var(--muted-foreground)" }}>
                    알림이 없습니다
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n, i) => (
                    <DropdownMenuItem key={n.id}
                      style={{ flexDirection: "column", alignItems: "flex-start", gap: 3, padding: "12px 16px", borderBottom: i < notifications.length - 1 ? "1px solid var(--border)" : "none", cursor: "default" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>
                          {n.type === "deploy" ? "🚀" : n.type === "content" ? "✍️" : n.type === "image" ? "🖼️" : "🔍"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", flex: 1 }}>{n.title}</span>
                        {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-emerald)", flexShrink: 0 }} />}
                      </div>
                      <span style={{ fontSize: 12, color: "var(--muted-foreground)", paddingLeft: 24 }}>{n.desc}</span>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)", opacity: 0.55, paddingLeft: 24 }}>
                        {new Date(n.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full cursor-pointer hover:bg-accent/20 transition-colors" style={{ border: "1px solid var(--border)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--color-emerald), oklch(0.769 0.188 70.08))", color: "white" }}>
                    {(() => { try { const u = JSON.parse(localStorage.getItem("ba_user") || "{}"); return (u.name || u.id || "A").charAt(0).toUpperCase(); } catch { return "A"; } })()}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline" style={{ color: "var(--foreground)", maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(() => { try { const u = JSON.parse(localStorage.getItem("ba_user") || "{}"); return u.name || u.id || "내 계정"; } catch { return "내 계정"; } })()}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" style={{ color: "var(--muted-foreground)" }} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => navigate("/mypage")}>
                  <User className="w-4 h-4 mr-2" /> 마이페이지
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { clearUserLocalCache(); toast.success("로그아웃되었습니다"); setTimeout(() => window.location.href = "/", 1000); }} style={{ color: "#ef4444" }}>
                  <LogOut className="w-4 h-4 mr-2" /> 로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 관리자 톱니바퀴 */}
            <button
              title="관리자"
              onClick={() => navigate("/superadmin")}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-accent/20"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content with left padding for sidebar on desktop */}
        <main className="flex-1 overflow-auto" style={{ paddingLeft: "0", overflowX:"hidden" }}>
          <div className="lg:pl-60" style={{ minWidth:0, width:"100%" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
