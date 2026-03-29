/**
 * BlogAuto Pro - Settings Page
 * AI 툴 선택 + API 키 관리 + 발행 설정
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Sun, Moon, Monitor, Globe, Bell,
  Palette, Download, Save, ChevronRight,
  Key, Eye, EyeOff, CheckCircle2, Bot,
  Wand2, Zap, ExternalLink, Newspaper,
  Smartphone, Upload, QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CONTENT_AI_OPTIONS, IMAGE_AI_OPTIONS,
  type ContentAIProvider, type ImageAIProvider,
} from "@/lib/ai-config";

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

function ApiKeyInput({ label, placeholder, storageKey, link }: {
  label: string; placeholder: string; storageKey: string; link: string;
}) {
  const [value, setValue] = useState(() => localStorage.getItem(storageKey) || "");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!value.trim()) { toast.error("API 키를 입력해주세요"); return; }
    localStorage.setItem(storageKey, value.trim());
    setSaved(true);
    toast.success(`${label} 저장됨`);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </label>
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:underline"
          style={{ color: "var(--color-emerald)" }}>
          발급받기 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input type={show ? "text" : "password"} placeholder={placeholder}
            value={value} onChange={(e) => setValue(e.target.value)}
            className="pr-10 text-sm font-mono" />
          <button className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted-foreground)" }}
            onClick={() => setShow(v => !v)}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button className="gap-1.5 shrink-0 text-sm"
          style={{ background: saved ? "var(--color-emerald)" : "oklch(0.75 0.12 300)", color: "white" }}
          onClick={handleSave}>
          {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
          {saved ? "저장됨" : "저장"}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [contentLang, setContentLang] = useState(
    () => localStorage.getItem("content_language") || "ko"
  );
  const [contentAI, setContentAI] = useState<ContentAIProvider>(
    () => (localStorage.getItem("content_ai_provider") as ContentAIProvider) || "gemini"
  );
  const [imageAI, setImageAI] = useState<ImageAIProvider>(
    () => (localStorage.getItem("image_ai_provider") as ImageAIProvider) || "flux"
  );
  const [naverLicense, setNaverLicense] = useState(() => localStorage.getItem("naver_access_license") || "");
  const [naverSecret, setNaverSecret] = useState(() => localStorage.getItem("naver_secret_key") || "");
  const [naverCustomer, setNaverCustomer] = useState(() => localStorage.getItem("naver_customer_id") || "");
  const [showNaverSecret, setShowNaverSecret] = useState(false);
  const [naverSaved, setNaverSaved] = useState(false);
  const [wpUrl, setWpUrl] = useState(() => localStorage.getItem("wp_url") || "");
  const [wpUser, setWpUser] = useState(() => localStorage.getItem("wp_username") || "");
  const [wpPass, setWpPass] = useState(() => localStorage.getItem("wp_app_password") || "");
  const [showWpPass, setShowWpPass] = useState(false);
  const [wpSaved, setWpSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true, deploy: true, revenue: true, error: true, weekly: false,
  });

  const handleSelectContentAI = (v: ContentAIProvider) => {
    setContentAI(v);
    localStorage.setItem("content_ai_provider", v);
    toast.success(`글 생성 AI: ${CONTENT_AI_OPTIONS.find(o => o.value === v)?.label} 선택됨`);
  };

  const handleSelectImageAI = (v: ImageAIProvider) => {
    setImageAI(v);
    localStorage.setItem("image_ai_provider", v);
    toast.success(`이미지 생성 AI: ${IMAGE_AI_OPTIONS.find(o => o.value === v)?.label} 선택됨`);
  };

  const handleSaveNaver = () => {
    if (!naverLicense || !naverSecret || !naverCustomer) {
      toast.error("네이버 API 정보를 모두 입력해주세요"); return;
    }
    localStorage.setItem("naver_access_license", naverLicense);
    localStorage.setItem("naver_secret_key", naverSecret);
    localStorage.setItem("naver_customer_id", naverCustomer);
    setNaverSaved(true);
    toast.success("네이버 검색광고 API 저장됨");
    setTimeout(() => setNaverSaved(false), 3000);
  };

  const handleSaveWordPress = () => {
    if (!wpUrl || !wpUser || !wpPass) {
      toast.error("WordPress 정보를 모두 입력해주세요"); return;
    }
    localStorage.setItem("wp_url", wpUrl);
    localStorage.setItem("wp_username", wpUser);
    localStorage.setItem("wp_app_password", wpPass);
    setWpSaved(true);
    toast.success("WordPress 발행 설정 저장됨");
    setTimeout(() => setWpSaved(false), 3000);
  };

  const requiredKeys = Array.from(
    new Map(
      [CONTENT_AI_OPTIONS.find(o => o.value === contentAI), IMAGE_AI_OPTIONS.find(o => o.value === imageAI)]
        .filter(Boolean)
        .map(o => [o!.keyStorageKey, o!])
    ).values()
  );

  // 모바일 동기화
  const [syncCode, setSyncCode] = useState("");
  const [importCode, setImportCode] = useState("");
  const [showImport, setShowImport] = useState(false);

  const handleExportSettings = () => {
    const keys = [
      "naver_access_license", "naver_secret_key", "naver_customer_id",
      "gemini_api_key", "claude_api_key", "openai_api_key", "flux_api_key",
      "wp_url", "wp_username", "wp_app_password",
      "content_ai_provider", "image_ai_provider", "content_language",
    ];
    const data: Record<string, string> = {};
    keys.forEach(k => { const v = localStorage.getItem(k); if (v) data[k] = v; });
    const code = btoa(JSON.stringify(data));
    setSyncCode(code);
    navigator.clipboard.writeText(code).then(() => toast.success("설정 코드가 클립보드에 복사됐어요!"));
  };

  const handleImportSettings = () => {
    try {
      const data = JSON.parse(atob(importCode.trim()));
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v as string));
      toast.success("설정이 가져와졌어요! 페이지를 새로고침해주세요.");
      setShowImport(false);
      setImportCode("");
    } catch {
      toast.error("올바르지 않은 코드예요");
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            설정
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            AI 툴, API 키, 발행 설정을 관리합니다
          </p>
        </div>

        {/* 글 생성 AI 선택 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">글 생성 AI 선택</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONTENT_AI_OPTIONS.map((opt) => (
              <button key={opt.value}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: contentAI === opt.value ? "oklch(0.696 0.17 162.48 / 12%)" : "var(--background)",
                  border: `2px solid ${contentAI === opt.value ? "oklch(0.696 0.17 162.48 / 60%)" : "var(--border)"}`,
                }}
                onClick={() => handleSelectContentAI(opt.value)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                    style={{ background: opt.logoColor }}>{opt.logo}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: opt.badge === "무료" ? "oklch(0.696 0.17 162.48 / 20%)" : "oklch(0.769 0.188 70.08 / 20%)", color: opt.badge === "무료" ? "var(--color-emerald)" : "var(--color-amber-brand)" }}>
                    {opt.badge}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{opt.desc}</div>
                {contentAI === opt.value && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--color-emerald)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 선택됨
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 생성 AI 선택 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5" style={{ color: "oklch(0.75 0.12 300)" }} />
            <h3 className="font-semibold text-foreground">이미지 생성 AI 선택</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {IMAGE_AI_OPTIONS.map((opt) => (
              <button key={opt.value}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: imageAI === opt.value ? "oklch(0.75 0.12 300 / 12%)" : "var(--background)",
                  border: `2px solid ${imageAI === opt.value ? "oklch(0.75 0.12 300 / 60%)" : "var(--border)"}`,
                }}
                onClick={() => handleSelectImageAI(opt.value)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                    style={{ background: opt.logoColor }}>{opt.logo}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: opt.badge === "무료" ? "oklch(0.696 0.17 162.48 / 20%)" : "oklch(0.769 0.188 70.08 / 20%)", color: opt.badge === "무료" ? "var(--color-emerald)" : "var(--color-amber-brand)" }}>
                    {opt.badge}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{opt.desc}</div>
                {imageAI === opt.value && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "oklch(0.75 0.12 300)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 선택됨
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* API 키 관리 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
            <h3 className="font-semibold text-foreground">API 키 관리</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            선택한 AI에 필요한 키만 표시됩니다. 키는 브라우저에 저장됩니다.
          </p>
          <div className="space-y-4">
            {requiredKeys.map((opt) => (
              <ApiKeyInput key={opt.keyStorageKey} label={opt.keyLabel}
                placeholder={opt.keyPlaceholder} storageKey={opt.keyStorageKey} link={opt.keyLink} />
            ))}
          </div>
        </div>

        {/* 네이버 검색광고 API */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: "#03C75A" }} />
              <h3 className="font-semibold text-foreground">네이버 검색광고 API</h3>
            </div>
            <a href="https://manage.searchad.naver.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:underline"
              style={{ color: "#03C75A" }}>
              발급받기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            키워드 수집용 · 로그인 후 우측 상단 계정명 → API 관리
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Access License</label>
              <Input className="text-sm font-mono" placeholder="발급된 라이선스 키"
                value={naverLicense} onChange={e => setNaverLicense(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Secret Key</label>
              <div className="relative">
                <Input className="text-sm font-mono pr-10" type={showNaverSecret ? "text" : "password"}
                  placeholder="시크릿 키" value={naverSecret} onChange={e => setNaverSecret(e.target.value)} />
                <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                  onClick={() => setShowNaverSecret(v => !v)}>
                  {showNaverSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Customer ID</label>
              <Input className="text-sm font-mono" placeholder="고객 ID (숫자)"
                value={naverCustomer} onChange={e => setNaverCustomer(e.target.value)} />
            </div>
            <Button className="gap-2"
              style={{ background: naverSaved ? "var(--color-emerald)" : "#03C75A", color: "white" }}
              onClick={handleSaveNaver}>
              {naverSaved ? <CheckCircle2 className="w-4 h-4" /> : <Key className="w-4 h-4" />}
              {naverSaved ? "저장됨" : "네이버 API 저장"}
            </Button>
          </div>
        </div>

        {/* WordPress 발행 설정 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="w-5 h-5" style={{ color: "#21759B" }} />
            <h3 className="font-semibold text-foreground">WordPress 발행 설정</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            WordPress 관리자 → 사용자 → 애플리케이션 비밀번호에서 발급
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>사이트 URL</label>
              <Input className="text-sm" placeholder="https://myblog.com"
                value={wpUrl} onChange={e => setWpUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>사용자명</label>
                <Input className="text-sm" placeholder="admin"
                  value={wpUser} onChange={e => setWpUser(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>앱 비밀번호</label>
                <div className="relative">
                  <Input className="text-sm font-mono pr-10" type={showWpPass ? "text" : "password"}
                    placeholder="xxxx xxxx xxxx" value={wpPass} onChange={e => setWpPass(e.target.value)} />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                    onClick={() => setShowWpPass(v => !v)}>
                    {showWpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button className="gap-2"
              style={{ background: wpSaved ? "var(--color-emerald)" : "#21759B", color: "white" }}
              onClick={handleSaveWordPress}>
              {wpSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {wpSaved ? "저장됨" : "WordPress 설정 저장"}
            </Button>
          </div>
        </div>

        {/* 모바일 설정 동기화 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "2px solid oklch(0.6 0.15 220 / 40%)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5" style={{ color: "oklch(0.6 0.15 220)" }} />
            <h3 className="font-semibold text-foreground">모바일 설정 동기화</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            PC에서 저장한 API 키를 모바일에서도 쓸 수 있어요. 코드를 복사해서 모바일 설정 페이지에 붙여넣으세요.
          </p>
          <div className="space-y-3">
            <Button className="w-full gap-2" style={{ background: "oklch(0.6 0.15 220)", color: "white" }}
              onClick={handleExportSettings}>
              <Upload className="w-4 h-4" /> 설정 내보내기 (코드 복사)
            </Button>

            {syncCode && (
              <div className="rounded-lg p-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div className="text-xs font-semibold mb-1.5" style={{ color: "var(--muted-foreground)" }}>설정 코드 (복사됨)</div>
                <div className="text-xs font-mono break-all select-all" style={{ color: "oklch(0.6 0.15 220)" }}>
                  {syncCode.substring(0, 80)}...
                </div>
              </div>
            )}

            <button className="w-full text-sm text-center py-2"
              style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShowImport(v => !v)}>
              ▼ 모바일에서 코드 가져오기
            </button>

            {showImport && (
              <div className="space-y-2">
                <textarea
                  className="w-full rounded-lg p-3 text-xs font-mono resize-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)", minHeight: "80px" }}
                  placeholder="PC에서 복사한 설정 코드를 여기에 붙여넣으세요..."
                  value={importCode}
                  onChange={e => setImportCode(e.target.value)}
                />
                <Button className="w-full gap-2" style={{ background: "var(--color-emerald)", color: "white" }}
                  onClick={handleImportSettings}>
                  <Download className="w-4 h-4" /> 설정 가져오기
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 테마 설정 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
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
              <button key={t.value}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: theme === t.value ? "oklch(0.696 0.17 162.48 / 15%)" : "var(--background)",
                  border: `2px solid ${theme === t.value ? "oklch(0.696 0.17 162.48 / 60%)" : "var(--border)"}`,
                }}
                onClick={() => {
                  if (t.value !== "system") { setTheme(t.value as "dark" | "light"); toast.success(`${t.label}으로 변경됨`); }
                  else toast.info("시스템 모드 준비 중");
                }}>
                <t.icon className="w-6 h-6 mb-2"
                  style={{ color: theme === t.value ? "var(--color-emerald)" : "var(--muted-foreground)" }} />
                <div className="text-sm font-semibold text-foreground">{t.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 언어 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
            <h3 className="font-semibold text-foreground">콘텐츠 생성 언어</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LANGUAGES.map((lang) => (
              <button key={lang.code}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all"
                style={{
                  background: contentLang === lang.code ? "oklch(0.769 0.188 70.08 / 15%)" : "var(--background)",
                  border: `1px solid ${contentLang === lang.code ? "oklch(0.769 0.188 70.08 / 50%)" : "var(--border)"}`,
                  color: contentLang === lang.code ? "var(--color-amber-brand)" : "var(--foreground)",
                }}
                onClick={() => {
                  setContentLang(lang.code);
                  localStorage.setItem("content_language", lang.code);
                  toast.success(`콘텐츠 언어: ${lang.label}`);
                }}>
                <span>{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
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
              <div key={notif.key}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div>
                  <div className="text-sm font-medium text-foreground">{notif.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{notif.desc}</div>
                </div>
                <Switch
                  checked={notifications[notif.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => {
                    setNotifications(prev => ({ ...prev, [notif.key]: checked }));
                    toast.success(`${notif.label} ${checked ? "활성화" : "비활성화"}됨`);
                  }} />
              </div>
            ))}
          </div>
        </div>

        {/* 내보내기 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">내보내기 & 다운로드</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "전체 프로젝트 ZIP 다운로드", desc: "모든 설정, 콘텐츠, 이미지를 ZIP으로 다운로드" },
              { label: "콘텐츠 CSV 내보내기", desc: "생성된 모든 글 목록을 CSV로" },
              { label: "키워드 데이터 내보내기", desc: "수집된 키워드 데이터를 Excel로" },
            ].map((item) => (
              <div key={item.label}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors cursor-pointer"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                onClick={() => toast.info(`${item.label} 준비 중`)}>
                <div>
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
