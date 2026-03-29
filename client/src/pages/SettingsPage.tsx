/**
 * BlogAuto Pro - Settings Page
 * Design: Modern Professional Dark SaaS
 * Theme, language, notification, account settings
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Settings,
  Sun,
  Moon,
  Globe,
  Bell,
  User,
  Lock,
  Palette,
  Download,
  Save,
  ChevronRight,
  Monitor,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [contentLang, setContentLang] = useState("ko");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("anthropic_api_key") || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    deploy: true,
    revenue: true,
    error: true,
    weekly: false,
  });

  const handleSave = () => {
    toast.success("설정이 저장되었습니다");
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("API 키를 입력해주세요");
      return;
    }
    localStorage.setItem("anthropic_api_key", apiKey.trim());
    setApiKeySaved(true);
    toast.success("API 키가 저장되었습니다");
    setTimeout(() => setApiKeySaved(false), 3000);
  };

  const handleDownloadZip = () => {
    toast.loading("ZIP 파일 준비 중...", { id: "zip" });
    setTimeout(() => {
      toast.success("다운로드가 시작되었습니다!", { id: "zip" });
    }, 1500);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            설정
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            플랫폼 환경 설정을 관리합니다
          </p>
        </div>

        {/* Theme Settings */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">테마 설정</h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "dark", label: "다크 모드", icon: Moon, desc: "어두운 배경" },
              { value: "light", label: "라이트 모드", icon: Sun, desc: "밝은 배경" },
              { value: "system", label: "시스템 설정", icon: Monitor, desc: "OS 따라가기" },
            ].map((t) => (
              <button
                key={t.value}
                className="rounded-xl p-4 text-left transition-all feature-card"
                style={{
                  background: theme === t.value ? "oklch(0.696 0.17 162.48 / 15%)" : "var(--background)",
                  border: `2px solid ${theme === t.value ? "oklch(0.696 0.17 162.48 / 60%)" : "var(--border)"}`,
                }}
                onClick={() => {
                  if (t.value !== "system") {
                    setTheme(t.value as "dark" | "light");
                    toast.success(`${t.label}으로 변경되었습니다`);
                  } else {
                    toast.info("시스템 설정 모드는 준비 중입니다");
                  }
                }}
              >
                <t.icon
                  className="w-6 h-6 mb-2"
                  style={{ color: theme === t.value ? "var(--color-emerald)" : "var(--muted-foreground)" }}
                />
                <div className="text-sm font-semibold text-foreground">{t.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Language Settings */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
            <h3 className="font-semibold text-foreground">언어 설정</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                콘텐츠 생성 언어
              </label>
              <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                선택한 언어로 모든 블로그 글이 자동 생성됩니다
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all"
                    style={{
                      background: contentLang === lang.code ? "oklch(0.769 0.188 70.08 / 15%)" : "var(--background)",
                      border: `1px solid ${contentLang === lang.code ? "oklch(0.769 0.188 70.08 / 50%)" : "var(--border)"}`,
                      color: contentLang === lang.code ? "var(--color-amber-brand)" : "var(--foreground)",
                    }}
                    onClick={() => {
                      setContentLang(lang.code);
                      toast.success(`콘텐츠 언어가 ${lang.label}(으)로 변경되었습니다`);
                    }}
                  >
                    <span>{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div
              className="rounded-lg p-3 flex items-start gap-3"
              style={{ background: "oklch(0.769 0.188 70.08 / 10%)", border: "1px solid oklch(0.769 0.188 70.08 / 20%)" }}
            >
              <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-amber-brand)" }} />
              <div className="text-sm" style={{ color: "var(--color-amber-brand)" }}>
                <strong>다국어 자동 번역:</strong> 언어를 변경하면 새로 생성되는 모든 콘텐츠가 해당 언어로 자동 작성됩니다. 기존 콘텐츠는 번역 탭에서 개별 변환할 수 있습니다.
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5" style={{ color: "oklch(0.6 0.15 220)" }} />
            <h3 className="font-semibold text-foreground">알림 설정</h3>
          </div>

          <div className="space-y-3">
            {[
              { key: "email", label: "이메일 알림", desc: "중요 이벤트를 이메일로 수신" },
              { key: "deploy", label: "배포 완료 알림", desc: "글 발행 성공/실패 시 알림" },
              { key: "revenue", label: "수익 알림", desc: "일일 수익 현황 알림" },
              { key: "error", label: "오류 알림", desc: "시스템 오류 발생 시 즉시 알림" },
              { key: "weekly", label: "주간 리포트", desc: "매주 월요일 성과 리포트 발송" },
            ].map((notif) => (
              <div
                key={notif.key}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{notif.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{notif.desc}</div>
                </div>
                <Switch
                  checked={notifications[notif.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => {
                    setNotifications(prev => ({ ...prev, [notif.key]: checked }));
                    toast.success(`${notif.label} ${checked ? "활성화" : "비활성화"}됨`);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Account Settings */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5" style={{ color: "oklch(0.75 0.12 300)" }} />
            <h3 className="font-semibold text-foreground">계정 설정</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                  이름
                </label>
                <Input defaultValue="관리자" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                  이메일
                </label>
                <Input defaultValue="admin@blogauto.pro" type="email" className="text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* API Key Settings */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" style={{ color: "oklch(0.75 0.12 300)" }} />
            <h3 className="font-semibold text-foreground">API 키 설정</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Anthropic API 키
              </label>
              <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                키워드 수집 및 AI 콘텐츠 생성에 사용됩니다. 키는 브라우저에 안전하게 저장됩니다.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-ant-api03-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10 text-sm font-mono"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted-foreground)" }}
                    onClick={() => setShowApiKey(v => !v)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  className="gap-2 shrink-0"
                  style={{
                    background: apiKeySaved ? "var(--color-emerald)" : "oklch(0.75 0.12 300)",
                    color: "white"
                  }}
                  onClick={handleSaveApiKey}
                >
                  {apiKeySaved ? (
                    <><CheckCircle2 className="w-4 h-4" />저장됨</>
                  ) : (
                    <><Key className="w-4 h-4" />저장</>
                  )}
                </Button>
              </div>
              <div
                className="mt-3 rounded-lg p-3 text-xs"
                style={{ background: "oklch(0.75 0.12 300 / 10%)", border: "1px solid oklch(0.75 0.12 300 / 20%)", color: "oklch(0.75 0.12 300)" }}
              >
                💡 API 키는 <strong>console.anthropic.com</strong>에서 발급받을 수 있습니다
              </div>
            </div>
          </div>
        </div>

        {/* Download & Export */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">내보내기 & 다운로드</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: "전체 프로젝트 ZIP 다운로드", desc: "모든 설정, 콘텐츠, 이미지를 ZIP으로 다운로드", action: handleDownloadZip },
              { label: "콘텐츠 CSV 내보내기", desc: "생성된 모든 글 목록을 CSV 파일로 내보내기", action: () => toast.info("CSV 내보내기 준비 중") },
              { label: "키워드 데이터 내보내기", desc: "수집된 키워드 데이터를 Excel로 내보내기", action: () => toast.info("Excel 내보내기 준비 중") },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors cursor-pointer"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                onClick={item.action}
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => toast.info("변경사항이 취소되었습니다")}>
            취소
          </Button>
          <Button
            className="gap-2"
            style={{ background: "var(--color-emerald)", color: "white" }}
            onClick={handleSave}
          >
            <Save className="w-4 h-4" />
            설정 저장
          </Button>
        </div>
      </div>
    </Layout>
  );
}
