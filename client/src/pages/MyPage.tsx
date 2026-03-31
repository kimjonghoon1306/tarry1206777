/**
 * BlogAuto Pro - My Page
 * 사용자 프로필, 현황, 연결된 플랫폼 확인
 */

import Layout from "@/components/Layout";
import { clearUserLocalCache, userGet, SETTINGS_KEYS } from "@/lib/user-storage";
import { useLocation } from "wouter";
import {
  User,
  Crown,
  FileText,
  Image,
  Search,
  Globe,
  CheckCircle2,
  XCircle,
  Settings,
  LogOut,
  ChevronRight,
  Calendar,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// 연결된 플랫폼 확인 (회원별 저장소 기반)
function getPlatformStatus() {
  return [
    {
      name: "네이버 블로그",
      color: "#03C75A",
      logo: "N",
      configured: !!(userGet(SETTINGS_KEYS.NAVER_BLOG_ID) && userGet(SETTINGS_KEYS.NAVER_BLOG_TOKEN)),
      settingsPath: "/settings",
    },
    {
      name: "일반 웹사이트",
      color: "oklch(0.6 0.15 220)",
      logo: "W",
      configured: !!userGet(SETTINGS_KEYS.WEBHOOK_URL),
      settingsPath: "/settings",
    },
    {
      name: "WordPress",
      color: "#21759B",
      logo: "WP",
      configured: !!(userGet(SETTINGS_KEYS.WP_URL) && userGet(SETTINGS_KEYS.WP_USER) && userGet(SETTINGS_KEYS.WP_PASS)),
      settingsPath: "/settings",
    },
  ];
}

const USAGE_STATS = [
  { label: "이번 달 발행 글", value: "24", icon: FileText, color: "var(--color-emerald)" },
  { label: "생성된 이미지", value: "87", icon: Image, color: "oklch(0.75 0.12 300)" },
  { label: "수집된 키워드", value: "1,204", icon: Search, color: "var(--color-amber-brand)" },
  { label: "활성 언어", value: "3", icon: Globe, color: "oklch(0.6 0.15 220)" },
];

export default function MyPage() {
  const [, navigate] = useLocation();
  const platforms = getPlatformStatus();
  const connectedCount = platforms.filter(p => p.configured).length;

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            마이페이지
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            계정 정보 및 사용 현황을 확인합니다
          </p>
        </div>

        {/* Profile Card */}
        <div
          className="rounded-xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--color-emerald), oklch(0.769 0.188 70.08))" }}
            >
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Admin
                </h2>
                <span
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: "oklch(0.769 0.188 70.08 / 15%)", color: "var(--color-amber-brand)" }}
                >
                  <Crown className="w-3 h-3" />
                  Pro 플랜
                </span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                BlogAuto Pro 사용자
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <Calendar className="w-3 h-3" />
                가입일: 2026년 1월
              </div>
            </div>
          </div>
        </div>

        {/* Usage This Month */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">이번 달 사용 현황</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {USAGE_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4 text-center"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
                <div
                  className="text-2xl font-black mb-1"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Platforms */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
              <h3 className="font-semibold text-foreground">연결된 배포 플랫폼</h3>
            </div>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{
                background: connectedCount > 0 ? "oklch(0.696 0.17 162.48 / 15%)" : "var(--muted)",
                color: connectedCount > 0 ? "var(--color-emerald)" : "var(--muted-foreground)",
              }}
            >
              {connectedCount} / {platforms.length} 연결됨
            </span>
          </div>
          <div className="space-y-3">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: platform.color }}
                  >
                    {platform.logo}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{platform.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {platform.configured ? "연결 완료" : "설정 필요"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {platform.configured ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
                  ) : (
                    <button
                      onClick={() => navigate("/settings")}
                      className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: "var(--color-amber-brand)" }}
                    >
                      설정하기 <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h3 className="font-semibold text-foreground mb-4">빠른 설정</h3>
          <div className="space-y-2">
            {[
              { label: "AI 및 API 설정", desc: "글/이미지 생성 AI와 API 키 관리", icon: Settings, path: "/settings" },
              { label: "배포 플랫폼 설정", desc: "네이버 블로그, 웹사이트, WordPress 연결", icon: Globe, path: "/settings" },
              { label: "키워드 수집 시작", desc: "새 키워드 수집 파이프라인 실행", icon: Search, path: "/keywords" },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors hover:bg-accent/10"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-emerald)" }} />
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="gap-2 text-sm"
            onClick={() => {
              clearUserLocalCache();
              toast.success("로그아웃되었습니다");
              setTimeout(() => (window.location.href = "/"), 1000);
            }}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>
    </Layout>
  );
}
