/**
 * BlogAuto Pro - Settings Page
 * AI 툴 선택 + API 키 관리 + 발행 설정
 */

import { useState } from "react";
import React from "react";
import Layout from "@/components/Layout";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Sun, Moon, Monitor, Globe, Bell,
  Palette, Download, Save, ChevronRight,
  Key, Eye, EyeOff, CheckCircle2, Bot,
  Wand2, Zap, ExternalLink, Newspaper,
  Smartphone, Upload, QrCode, Send, Plus, Trash2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CONTENT_AI_OPTIONS, IMAGE_AI_OPTIONS,
  type ContentAIProvider, type ImageAIProvider,
} from "@/lib/ai-config";
import { userGet, userSet, SETTINGS_KEYS, saveSettingsToServer, applyServerSettings } from "@/lib/user-storage";
import { useAuth } from "@/contexts/AuthContext";

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
  const [value, setValue] = useState(() => userGet(storageKey));
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!value.trim()) { toast.error("API 키를 입력해주세요"); return; }
    userSet(storageKey, value.trim());
    // 서버에도 동기화
    saveSettingsToServer({ [storageKey]: value.trim() });
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

// ── 다중 플랫폼 섹션 컴포넌트 ──────────────────────
function PlatformSection({ title, color, logo, type, desc, link, fields }: {
  title: string; color: string; logo: string; type: string; desc: string; link: string;
  fields: { label: string; key: string; placeholder: string; secret?: boolean }[];
}) {
  const STORAGE_KEY = `platform_${type}_list`;
  const [accounts, setAccounts] = React.useState<Record<string, string>[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({});
  const [savedIdx, setSavedIdx] = React.useState<number | null>(null);

  const save = () => {
    const required = fields.filter(f => !f.secret || f === fields[0]);
    for (const f of required) {
      if (!form[f.key]?.trim()) { toast.error(`${f.label}을 입력해주세요`); return; }
    }
    const name = form[fields[0].key] || `${title} ${accounts.length + 1}`;
    const entry = { ...form, _name: name, _type: type };
    const updated = [...accounts, entry];
    setAccounts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // 배포 플랫폼 목록도 업데이트
    const platforms = JSON.parse(localStorage.getItem("blogauto_deploy_platforms") || "[]");
    platforms.push({ id: Math.random().toString(36).slice(2), type, name });
    localStorage.setItem("blogauto_deploy_platforms", JSON.stringify(platforms));
    setForm({});
    setShowAdd(false);
    toast.success(`${title} 추가됨`);
  };

  const remove = (idx: number) => {
    const updated = accounts.filter((_, i) => i !== idx);
    setAccounts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success("삭제됨");
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: color }}>{logo}</div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:underline" style={{ color }}>
              발급받기 <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Button size="sm" className="gap-1.5 text-xs h-7"
            style={{ background: color, color: "white" }}
            onClick={() => setShowAdd(v => !v)}>
            <Plus className="w-3.5 h-3.5" /> 추가
          </Button>
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>{desc}</p>

      {/* 등록된 계정 목록 */}
      {accounts.length > 0 && (
        <div className="space-y-2 mb-4">
          {accounts.map((account, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                <span className="text-sm text-foreground">{account._name || `${title} ${idx + 1}`}</span>
              </div>
              <button onClick={() => remove(idx)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
                style={{ color: "var(--muted-foreground)" }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 추가 폼 */}
      {showAdd && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          {fields.map(field => (
            <div key={field.key}>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
                {field.label}
              </label>
              {field.secret ? (
                <div className="relative">
                  <Input className="text-sm font-mono pr-10"
                    type={showSecrets[field.key] ? "text" : "password"}
                    placeholder={field.placeholder}
                    value={form[field.key] || ""}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                    onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}>
                    {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <Input className="text-sm" placeholder={field.placeholder}
                  value={form[field.key] || ""}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button className="gap-2 flex-1" style={{ background: color, color: "white" }} onClick={save}>
              <CheckCircle2 className="w-4 h-4" /> 저장
            </Button>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm({}); }}>취소</Button>
          </div>
        </div>
      )}

      {accounts.length === 0 && !showAdd && (
        <p className="text-xs text-center py-2" style={{ color: "var(--muted-foreground)" }}>
          추가 버튼을 눌러 {title} 계정을 등록하세요
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, saveSettings, loadSettings } = useAuth();
  const [contentLang, setContentLang] = useState(
    () => userGet(SETTINGS_KEYS.CONTENT_LANG, "ko")
  );
  const [contentAI, setContentAI] = useState<ContentAIProvider>(
    () => (userGet(SETTINGS_KEYS.CONTENT_AI) as ContentAIProvider) || "gemini"
  );
  const [imageAI, setImageAI] = useState<ImageAIProvider>(
    () => (userGet(SETTINGS_KEYS.IMAGE_AI) as ImageAIProvider) || "pollinations"
  );
  const [naverLicense, setNaverLicense] = useState(() => userGet(SETTINGS_KEYS.NAVER_LICENSE));
  const [naverSecret, setNaverSecret] = useState(() => userGet(SETTINGS_KEYS.NAVER_SECRET));
  const [naverCustomer, setNaverCustomer] = useState(() => userGet(SETTINGS_KEYS.NAVER_CUSTOMER));
  const [showNaverSecret, setShowNaverSecret] = useState(false);
  const [naverSaved, setNaverSaved] = useState(false);
  const [wpUrl, setWpUrl] = useState(() => userGet(SETTINGS_KEYS.WP_URL));
  const [wpUser, setWpUser] = useState(() => userGet(SETTINGS_KEYS.WP_USER));
  const [wpPass, setWpPass] = useState(() => userGet(SETTINGS_KEYS.WP_PASS));
  const [showWpPass, setShowWpPass] = useState(false);
  const [wpSaved, setWpSaved] = useState(false);

  // 네이버 블로그 배포
  const [naverBlogId, setNaverBlogId] = useState(() => userGet(SETTINGS_KEYS.NAVER_BLOG_ID));
  const [naverBlogToken, setNaverBlogToken] = useState(() => userGet(SETTINGS_KEYS.NAVER_BLOG_TOKEN));
  const [showNaverBlogToken, setShowNaverBlogToken] = useState(false);
  const [naverBlogSaved, setNaverBlogSaved] = useState(false);

  // 일반 웹사이트 배포
  const [webhookUrl, setWebhookUrl] = useState(() => userGet(SETTINGS_KEYS.WEBHOOK_URL));
  const [webhookKey, setWebhookKey] = useState(() => userGet(SETTINGS_KEYS.WEBHOOK_KEY));
  const [showWebhookKey, setShowWebhookKey] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true, deploy: true, revenue: true, error: true, weekly: false,
  });

  const handleSelectContentAI = (v: ContentAIProvider) => {
    setContentAI(v);
    userSet(SETTINGS_KEYS.CONTENT_AI, v);
    const s1 = { [SETTINGS_KEYS.CONTENT_AI]: v };
    saveSettingsToServer(s1); saveSettings(s1);
    toast.success(`글 생성 AI: ${CONTENT_AI_OPTIONS.find(o => o.value === v)?.label} 선택됨`);
  };

  const handleSelectImageAI = (v: ImageAIProvider) => {
    setImageAI(v);
    userSet(SETTINGS_KEYS.IMAGE_AI, v);
    const s2 = { [SETTINGS_KEYS.IMAGE_AI]: v };
    saveSettingsToServer(s2); saveSettings(s2);
    toast.success(`이미지 생성 AI: ${IMAGE_AI_OPTIONS.find(o => o.value === v)?.label} 선택됨`);
  };

  const handleSaveNaver = () => {
    if (!naverLicense || !naverSecret || !naverCustomer) {
      toast.error("네이버 API 정보를 모두 입력해주세요"); return;
    }
    userSet(SETTINGS_KEYS.NAVER_LICENSE, naverLicense);
    userSet(SETTINGS_KEYS.NAVER_SECRET, naverSecret);
    userSet(SETTINGS_KEYS.NAVER_CUSTOMER, naverCustomer);
    const sn = { [SETTINGS_KEYS.NAVER_LICENSE]: naverLicense, [SETTINGS_KEYS.NAVER_SECRET]: naverSecret, [SETTINGS_KEYS.NAVER_CUSTOMER]: naverCustomer };
    saveSettingsToServer(sn); saveSettings(sn);
    setNaverSaved(true);
    toast.success("네이버 검색광고 API 저장됨 ✅ 모든 기기 자동 적용");
    setTimeout(() => setNaverSaved(false), 3000);
  };

  const handleSaveWordPress = () => {
    if (!wpUrl || !wpUser || !wpPass) {
      toast.error("WordPress 정보를 모두 입력해주세요"); return;
    }
    userSet(SETTINGS_KEYS.WP_URL, wpUrl);
    userSet(SETTINGS_KEYS.WP_USER, wpUser);
    userSet(SETTINGS_KEYS.WP_PASS, wpPass);
    const sw = { [SETTINGS_KEYS.WP_URL]: wpUrl, [SETTINGS_KEYS.WP_USER]: wpUser, [SETTINGS_KEYS.WP_PASS]: wpPass };
    saveSettingsToServer(sw); saveSettings(sw);
    setWpSaved(true);
    toast.success("WordPress 설정 저장됨 ✅ 모든 기기 자동 적용");
    setTimeout(() => setWpSaved(false), 3000);
  };

  const handleSaveNaverBlog = () => {
    if (!naverBlogId || !naverBlogToken) {
      toast.error("네이버 블로그 정보를 모두 입력해주세요"); return;
    }
    userSet(SETTINGS_KEYS.NAVER_BLOG_ID, naverBlogId);
    userSet(SETTINGS_KEYS.NAVER_BLOG_TOKEN, naverBlogToken);
    const snb = { [SETTINGS_KEYS.NAVER_BLOG_ID]: naverBlogId, [SETTINGS_KEYS.NAVER_BLOG_TOKEN]: naverBlogToken };
    saveSettingsToServer(snb); saveSettings(snb);
    setNaverBlogSaved(true);
    toast.success("네이버 블로그 설정 저장됨 ✅ 모든 기기 자동 적용");
    setTimeout(() => setNaverBlogSaved(false), 3000);
  };

  const handleSaveWebhook = () => {
    if (!webhookUrl) {
      toast.error("Webhook URL을 입력해주세요"); return;
    }
    userSet(SETTINGS_KEYS.WEBHOOK_URL, webhookUrl);
    userSet(SETTINGS_KEYS.WEBHOOK_KEY, webhookKey);
    const shk = { [SETTINGS_KEYS.WEBHOOK_URL]: webhookUrl, [SETTINGS_KEYS.WEBHOOK_KEY]: webhookKey };
    saveSettingsToServer(shk); saveSettings(shk);
    setWebhookSaved(true);
    toast.success("웹사이트 설정 저장됨 ✅ 모든 기기 자동 적용");
    setTimeout(() => setWebhookSaved(false), 3000);
  };

  const requiredKeys = Array.from(
    new Map(
      [CONTENT_AI_OPTIONS.find(o => o.value === contentAI), IMAGE_AI_OPTIONS.find(o => o.value === imageAI)]
        .filter(Boolean)
        .filter(o => o!.keyStorageKey) // API 키 불필요한 항목 제외 (Pollinations 등)
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
      "naver_blog_id", "naver_blog_access_token",
      "webhook_url", "webhook_auth_key",
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

          {/* Pollinations 선택 시 안내 */}
          {imageAI === "pollinations" && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-3 mb-4"
              style={{ background: "oklch(0.696 0.17 162.48/10%)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
              <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "var(--color-emerald)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-emerald)" }}>
                  Pollinations AI는 API 키가 필요 없어요! 🎉
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  바로 이미지 생성 페이지에서 사용 가능합니다.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Pollinations 선택 시 - 키 불필요 안내 */}
            {imageAI === "pollinations" && requiredKeys.length === 0 && (
              <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: "oklch(0.696 0.17 162.48/10%)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "var(--color-emerald)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-emerald)" }}>
                    Pollinations AI는 API 키가 필요 없어요! 🎉
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    바로 이미지 생성 페이지에서 사용 가능합니다.
                  </p>
                </div>
              </div>
            )}
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

        {/* ─── 배포 대상 설정 (다중 추가 가능) ─── */}
        <div className="rounded-xl p-5" style={{ background: "oklch(0.696 0.17 162.48 / 6%)", border: "2px solid oklch(0.696 0.17 162.48 / 25%)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
              <h3 className="font-semibold text-foreground">배포 대상 설정</h3>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            각 플랫폼마다 여러 개 추가 가능 · 배포 페이지에서 선택해서 발행
          </p>
        </div>

        {/* 네이버 블로그 */}
        <PlatformSection
          title="네이버 블로그" color="#03C75A" logo="N" type="naver"
          desc="네이버 개발자센터에서 앱 등록 후 블로그 쓰기 권한으로 Access Token 발급"
          link="https://developers.naver.com/apps"
          fields={[
            { label: "블로그 ID", key: "naver_blog_id", placeholder: "myblog (naver.com/myblog)" },
            { label: "Access Token", key: "naver_blog_access_token", placeholder: "네이버 OAuth Access Token", secret: true },
          ]}
        />

        {/* 일반 웹사이트 */}
        <PlatformSection
          title="일반 웹사이트 (커스텀)" color="oklch(0.65 0.28 350)" logo="W" type="custom"
          desc="직접 제작한 사이트나 CMS에 Webhook으로 글을 전달합니다"
          link=""
          fields={[
            { label: "Webhook URL", key: "webhook_url", placeholder: "https://mysite.com/api/post" },
            { label: "인증 키 (선택)", key: "webhook_auth_key", placeholder: "Authorization 헤더 값", secret: true },
          ]}
        />

        {/* WordPress */}
        <PlatformSection
          title="WordPress" color="#21759B" logo="WP" type="wordpress"
          desc="WordPress 관리자 → 사용자 → 애플리케이션 비밀번호에서 발급"
          link=""
          fields={[
            { label: "사이트 URL", key: "wp_url", placeholder: "https://myblog.com" },
            { label: "사용자명", key: "wp_username", placeholder: "admin" },
            { label: "앱 비밀번호", key: "wp_app_password", placeholder: "xxxx xxxx xxxx", secret: true },
          ]}
        />

        {/* 모바일 ↔ PC 자동 동기화 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "2px solid oklch(0.6 0.15 220 / 40%)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5" style={{ color: "oklch(0.6 0.15 220)" }} />
            <h3 className="font-semibold text-foreground">모바일 ↔ PC 설정 자동 동기화</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            같은 계정으로 로그인하면 모든 설정이 자동으로 동기화됩니다.
          </p>

          {user ? (
            <div className="space-y-3">
              {/* 로그인 상태 표시 */}
              <div className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: "oklch(0.696 0.17 162.48/10%)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-black text-white"
                  style={{ background: "var(--color-emerald)" }}>✓</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-emerald)" }}>
                    자동 동기화 활성화됨
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                    <strong style={{ color: "var(--foreground)" }}>{user.name}</strong> 계정 · 설정 저장 시 서버에 자동 백업
                  </p>
                </div>
              </div>

              {/* 지금 바로 전체 저장 */}
              <Button className="w-full gap-2 h-11 font-semibold"
                style={{ background: "oklch(0.6 0.15 220)", color: "white" }}
                onClick={async () => {
                  const allData: Record<string,string> = {};
                  Object.values(SETTINGS_KEYS).forEach(k => {
                    const v = userGet(k); if (v) allData[k] = v;
                  });
                  await saveSettings(allData);
                  toast.success("✅ 모든 설정이 서버에 저장됐어요! 다른 기기에서 로그인하면 자동 적용됩니다");
                }}>
                <Upload className="w-4 h-4" /> 지금 모든 설정 서버에 저장하기
              </Button>

              {/* 서버에서 불러오기 */}
              <Button variant="outline" className="w-full gap-2 h-11 font-semibold"
                onClick={async () => {
                  const settings = await loadSettings();
                  if (!settings || Object.keys(settings).length === 0) {
                    toast.info("서버에 저장된 설정이 없어요. 위 버튼으로 먼저 저장해주세요");
                    return;
                  }
                  Object.entries(settings).forEach(([k,v]) => userSet(k, v as string));
                  toast.success("✅ 서버에서 최신 설정을 불러왔어요!");
                  setTimeout(() => window.location.reload(), 1200);
                }}>
                <RefreshCw className="w-4 h-4" /> 서버에서 최신 설정 불러오기
              </Button>

              <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                💡 API 키 저장 시 서버에도 자동 백업돼요. 모바일에서 로그인만 하면 자동 적용됩니다.
              </p>
            </div>
          ) : (
            <div className="rounded-xl p-5 flex items-start gap-4"
              style={{ background: "oklch(0.769 0.188 70.08/8%)", border: "1px solid oklch(0.769 0.188 70.08/30%)" }}>
              <div className="text-2xl">🔒</div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-amber-brand)" }}>
                  로그인하면 자동 동기화
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  로그인하면 API 키와 모든 설정이 서버에 저장되고,
                  모바일에서 로그인하면 자동으로 적용돼요. 링크나 코드 입력 불필요!
                </p>
                <Button size="sm" className="mt-3 gap-1.5"
                  style={{ background: "var(--color-amber-brand)", color: "white" }}
                  onClick={() => window.location.href = "/login"}>
                  로그인하러 가기
                </Button>
              </div>
            </div>
          )}
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
                  userSet(SETTINGS_KEYS.CONTENT_LANG, lang.code);
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
