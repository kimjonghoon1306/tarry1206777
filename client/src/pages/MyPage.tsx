/**
 * BlogAuto Pro - My Page
 * 사용자 프로필, 현황, 연결된 플랫폼 확인
 */

import { useState } from "react";
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
  Share2,
  Copy,
  Download,
  Key,
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
      configured: (() => { try { return JSON.parse(localStorage.getItem("platform_custom_list") || "[]").length > 0; } catch { return false; } })(),
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
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePw = async () => {
    if (!curPw || !newPw || !confirmPw) { toast.error("모든 항목을 입력해주세요"); return; }
    if (newPw !== confirmPw) { toast.error("새 비밀번호가 일치하지 않아요"); return; }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/.test(newPw)) { toast.error("비밀번호는 영문 대소문자+숫자 포함 6자 이상이어야 해요"); return; }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("ba_token") || "";
      const resp = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "changePassword", currentPassword: curPw, newPassword: newPw }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "변경 실패");
      toast.success("비밀번호가 변경됐어요!");
      setCurPw(""); setNewPw(""); setConfirmPw("");
    } catch (e: any) {
      toast.error(e.message || "비밀번호 변경 실패");
    } finally {
      setPwLoading(false);
    }
  };
  const connectedCount = platforms.filter(p => p.configured).length;

  // 로그인한 회원 정보
  const baUser = (() => { try { return JSON.parse(localStorage.getItem("ba_user") || "{}"); } catch { return {}; } })();
  const userName = baUser?.name || baUser?.id || "사용자";
  const userEmail = baUser?.email || "";
  const userId = baUser?.id || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const joinDate = baUser?.createdAt ? new Date(baUser.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long" }) : "알 수 없음";

  // 추천 링크
  const refLink = userId ? `https://www.blogautopro.com/signup?ref=${userId}` : "https://www.blogautopro.com/signup";

  const copyRefLink = () => {
    navigator.clipboard.writeText(refLink);
    toast.success("추천 링크가 복사됐어요!");
  };

  const shareKakao = () => {
    const kakaoUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=KAKAO_APP_KEY&validation_action=default&validation_params=%7B%7D`;
    const msg = encodeURIComponent(`BlogAuto Pro - AI 블로그 자동화 시스템

블로그 글을 자동으로 생성하고 수익을 극대화하세요!

👉 ${refLink}`);
    const shareUrl = `https://story.kakao.com/share?url=${encodeURIComponent(refLink)}&text=${msg}`;
    // 카카오톡 공유 (웹 공유 API 활용)
    if (navigator.share) {
      navigator.share({
        title: "BlogAuto Pro",
        text: "AI 블로그 자동화 시스템 - 블로그 글을 자동으로 생성하고 수익을 극대화하세요!",
        url: refLink,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(refLink);
      toast.success("링크가 복사됐어요! 카카오톡에 붙여넣기 해주세요 😊");
    }
  };

  return (
    <Layout>
      <div className="p-6"><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-6 min-w-0">
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
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {userName}
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
                {userEmail}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <Calendar className="w-3 h-3" />
                가입일: {joinDate}
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

        {/* 추천 링크 공유 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="w-5 h-5" style={{ color: "#ec4899" }} />
            <h3 className="font-semibold text-foreground">친구 초대</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
            내 추천 링크로 친구가 가입하면 함께 시작할 수 있어요 😊
          </p>
          <div className="flex items-center gap-2 p-3 rounded-xl mb-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <span className="flex-1 text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{refLink}</span>
            <button onClick={copyRefLink} className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-accent/20">
              <Copy className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={copyRefLink}
              className="flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "var(--color-emerald)" }}>
              <Copy className="w-4 h-4" /> 링크 복사
            </button>
            <button onClick={shareKakao}
              className="flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "#FEE500", color: "#000" }}>
              <Share2 className="w-4 h-4" /> 카카오 공유
            </button>
          </div>
        </div>

        {/* 수익화 가이드 PDF */}
        <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, oklch(0.696 0.17 162.48/10%), oklch(0.769 0.188 70.08/10%))", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">수익화 가이드 (무료)</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
            애드센스 vs 애드포스트 완전 비교 분석 + 자동화 수익 시스템 구축 가이드
          </p>
          <a href="/adsense_guide.pdf" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 w-full"
            style={{ background: "linear-gradient(135deg, var(--color-emerald), oklch(0.769 0.188 70.08))" }}>
            <Download className="w-4 h-4" /> PDF 다운로드
          </a>
        </div>

        {/* 비밀번호 변경 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">비밀번호 변경</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted-foreground)" }}>현재 비밀번호</label>
              <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted-foreground)" }}>새 비밀번호</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted-foreground)" }}>새 비밀번호 확인</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }} />
            </div>
            <button onClick={handleChangePw} disabled={pwLoading}
              className="w-full h-10 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              style={{ background: "var(--color-emerald)" }}>
              {pwLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
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

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, oklch(0.696 0.17 162.48/12%), oklch(0.769 0.188 70.08/12%))", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                <h3 className="font-semibold text-foreground">오늘의 작업 흐름</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "AI 세팅 확인", value: "완료" },
                  { label: "이미지 생성 점검", value: "진행 중" },
                  { label: "배포 플랫폼 연결", value: `${connectedCount}/${platforms.length}` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{item.label}</div>
                    <div className="text-sm font-semibold text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="font-semibold text-foreground mb-3">빠른 이동</h3>
              <div className="space-y-2">
                {[
                  ["키워드 수집", "/keywords"],
                  ["이미지 생성", "/images"],
                  ["설정", "/settings"],
                ].map(([label, path]) => (
                  <button key={String(label)} onClick={() => navigate(String(path))} className="w-full rounded-xl px-3 py-2 text-left text-sm transition-all hover:translate-x-0.5" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div></div>
    </Layout>
  );
}
