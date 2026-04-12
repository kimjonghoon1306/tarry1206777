/**
 * BlogAuto Pro - Super Admin Page v6.0
 * ✅ 설정과 동일한 모든 키 항목 (티스토리/쿠팡/데이터랩/Webhook 포함)
 * ✅ 관리자 키 → 유저가 지워도 자동 폴백 적용
 * ✅ 비밀번호 서버 저장 (배포해도 유지)
 * ✅ 회원 목록 / 등급 변경 / 삭제
 * ✅ 모바일 최적화 + 색상 다양하게
 */

import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Shield, Key, Eye, EyeOff, Copy, Lock, Zap, Bell,
  CheckCircle2, Image, Upload, X, Globe, Link,
  Trash2, ExternalLink, Home, Save,
  Users, Crown, UserX, RefreshCw, ChevronDown,
  Activity, Cpu, Database, HardDrive, Wifi,
  Send, ShoppingCart, FileText, Search, BarChart3, Bot, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userGet, userSet, saveSettingsToServer, SETTINGS_KEYS } from "@/lib/user-storage";
import { CONTENT_AI_OPTIONS, IMAGE_AI_OPTIONS, type ContentAIProvider, type ImageAIProvider } from "@/lib/ai-config";

const SESSION_KEY = "bap_admin_auth";
const OG_KEY = "blogauto_og_settings";

// ── API 헬퍼 ─────────────────────────────────────────
async function adminApi(action: string, extra: Record<string, any> = {}) {
  const token = localStorage.getItem("ba_token") || "";
  try {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...extra }),
    });
    return await r.json();
  } catch { return { ok: false, error: "네트워크 오류" }; }
}

// ── 파일 → base64 ──────────────────────────────────
function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
}

// ── OG 타입 ─────────────────────────────────────────
interface OGSettings {
  siteTitle: string; siteDesc: string; siteImage: string;
  siteName: string; twitterCard: string;
  postImages: { id: string; title: string; image: string; url: string }[];
}
function loadOG(): OGSettings {
  try { const r = localStorage.getItem(OG_KEY); if (r) return JSON.parse(r); } catch {}
  return { siteTitle: "BlogAuto Pro - AI 블로그 자동화", siteDesc: "AI로 블로그 글을 자동 생성하고 수익을 극대화하세요", siteImage: "", siteName: "BlogAuto Pro", twitterCard: "summary_large_image", postImages: [] };
}
function saveOG(d: OGSettings) { try { localStorage.setItem(OG_KEY, JSON.stringify(d)); } catch {} }

// ✅ OG 설정 KV 서버에 저장
async function saveOGToServer(og: OGSettings) {
  saveOG(og); // localStorage에도 저장
  const token = localStorage.getItem("ba_token") || "";
  try {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "saveSettings", settings: { blogauto_og_settings: JSON.stringify(og) } }),
    });
  } catch {}
}

// ✅ OG 설정 KV 서버에서 불러오기
async function loadOGFromServer(): Promise<OGSettings | null> {
  const token = localStorage.getItem("ba_token") || "";
  try {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "loadSettings" }),
    });
    const d = await r.json();
    if (d.ok && d.settings?.blogauto_og_settings) {
      const og = JSON.parse(d.settings.blogauto_og_settings);
      saveOG(og); // 로컬에도 캐시
      return og;
    }
  } catch {}
  return null;
}

// ✅ imgbb에 이미지 업로드 → 영구 URL 반환
async function uploadImageToImgbb(file: File): Promise<string> {
  const imgbbKey = userGet("imgbb_api_key");
  if (!imgbbKey) throw new Error("imgbb API 키가 없습니다. 이미지 생성 AI 섹션에서 설정해주세요.");
  const b64 = await toBase64(file);
  const base64Data = b64.split(",")[1];
  const form = new URLSearchParams();
  form.append("key", imgbbKey);
  form.append("image", base64Data);
  const resp = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: form });
  const data = await resp.json();
  if (data.success && data.data?.url) return data.data.url;
  throw new Error("imgbb 업로드 실패");
}

// ── 전체 API 키 섹션 정의 (설정 페이지와 완전 동일) ──
const ICON_MAP: Record<string, any> = { Bot, Image, Search, BarChart3, FileText, Send, ShoppingCart, Globe, Link };

const API_SECTIONS = [
  {
    group: "ai", title: "글 생성 AI", icon: "Bot", color: "#10b981", grad: "linear-gradient(135deg,#10b981,#059669)",
    desc: "Gemini·Groq 무료, Claude·GPT 유료",
    fields: [
      { label: "Gemini API Key", key: "gemini_api_key", placeholder: "AIza...", link: "https://aistudio.google.com/app/apikey", badge: "무료", badgeColor: "#10b981" },
      { label: "Groq API Key (Llama 3)", key: "groq_api_key", placeholder: "gsk_...", link: "https://console.groq.com/keys", badge: "무료", badgeColor: "#10b981" },
      { label: "Claude API Key", key: "claude_api_key", placeholder: "sk-ant-...", link: "https://console.anthropic.com/", badge: "유료", badgeColor: "#f59e0b" },
      { label: "OpenAI API Key (GPT-4o)", key: "openai_api_key", placeholder: "sk-...", link: "https://platform.openai.com/api-keys", badge: "유료", badgeColor: "#f59e0b" },
    ],
  },
  {
    group: "ai", title: "이미지 생성 AI", icon: "Image", color: "#a78bfa", grad: "linear-gradient(135deg,#a78bfa,#7c3aed)",
    desc: "OpenAI · Replicate · imgbb",
    fields: [
      { label: "Gemini API Key (글쓰기 공용)", key: "gemini_api_key", placeholder: "AIza...", link: "https://aistudio.google.com/app/apikey", badge: "글쓰기용", badgeColor: "#4285F4" },
      { label: "OpenAI API Key (DALL-E 3)", key: "openai_api_key", placeholder: "sk-...", link: "https://platform.openai.com/api-keys", badge: "유료", badgeColor: "#f59e0b" },
      { label: "Replicate API Token (Flux)", key: "replicate_api_token", placeholder: "r8_...", link: "https://replicate.com/account/api-tokens", badge: "유료", badgeColor: "#f59e0b" },
      { label: "imgbb API Key (이미지 영구 저장)", key: "imgbb_api_key", placeholder: "imgbb API 키...", link: "https://api.imgbb.com", badge: "무료", badgeColor: "#10b981" },
    ],
  },
  {
    group: "keyword", title: "네이버 검색광고 API", icon: "Search", color: "#03C75A", grad: "linear-gradient(135deg,#03C75A,#02a44a)",
    desc: "키워드 수집 · 검색량 조회",
    fields: [
      { label: "API License", key: "naver_access_license", placeholder: "License Key", link: "https://searchad.naver.com", badge: "", badgeColor: "" },
      { label: "Secret Key", key: "naver_secret_key", placeholder: "Secret Key", link: "", badge: "", badgeColor: "" },
      { label: "Customer ID", key: "naver_customer_id", placeholder: "Customer ID", link: "", badge: "", badgeColor: "" },
    ],
  },
  {
    group: "keyword", title: "네이버 데이터랩", icon: "BarChart3", color: "#06b6d4", grad: "linear-gradient(135deg,#06b6d4,#0284c7)",
    desc: "트렌드 · 검색 인사이트",
    fields: [
      { label: "Client ID", key: "naver_datalab_client_id", placeholder: "Client ID", link: "https://developers.naver.com/apps", badge: "", badgeColor: "" },
      { label: "Client Secret", key: "naver_datalab_client_secret", placeholder: "Client Secret", link: "", badge: "", badgeColor: "" },
    ],
  },
  {
    group: "platform", title: "블로거 (Blogger)", icon: "FileText", color: "#FF5722", grad: "linear-gradient(135deg,#FF5722,#E64A19)",
    desc: "구글 블로거 자동 발행 · 애드센스 최적화",
    fields: [
      { label: "Blog ID", key: "blogger_blog_id", placeholder: "블로그 ID (숫자)", link: "https://www.blogger.com", badge: "자동발행", badgeColor: "#10b981" },
      { label: "Google API Key", key: "blogger_api_key", placeholder: "AIza...", link: "https://console.cloud.google.com/apis/credentials", badge: "발급", badgeColor: "#4285F4" },
      { label: "OAuth Client ID", key: "blogger_client_id", placeholder: "Client ID", link: "https://console.cloud.google.com/apis/credentials", badge: "", badgeColor: "" },
      { label: "OAuth Client Secret", key: "blogger_client_secret", placeholder: "Client Secret", link: "", badge: "", badgeColor: "" },
    ],
  },
  {
    group: "platform", title: "미디엄 (Medium)", icon: "Send", color: "#000000", grad: "linear-gradient(135deg,#333333,#000000)",
    desc: "미디엄 자동 발행 · 영문 콘텐츠 최적화",
    fields: [
      { label: "Integration Token", key: "medium_token", placeholder: "Integration Token", link: "https://medium.com/me/settings/security", badge: "자동발행", badgeColor: "#10b981" },
      { label: "Author ID (선택)", key: "medium_author_id", placeholder: "Author ID", link: "https://api.medium.com/v1/me", badge: "", badgeColor: "" },
    ],
  },
  {
    group: "keyword", title: "쿠팡파트너스", icon: "ShoppingCart", color: "#C00F0C", grad: "linear-gradient(135deg,#C00F0C,#9a0b09)",
    desc: "상품 링크 자동 삽입 → 수익",
    fields: [
      { label: "Access Key", key: "coupang_access_key", placeholder: "Access Key", link: "https://partners.coupang.com", badge: "", badgeColor: "" },
      { label: "Secret Key", key: "coupang_secret_key", placeholder: "Secret Key", link: "", badge: "", badgeColor: "" },
      { label: "Sub ID (선택)", key: "coupang_sub_id", placeholder: "Sub ID", link: "", badge: "", badgeColor: "" },
    ],
  },
  {
    group: "platform", title: "워드프레스", icon: "Globe", color: "#21759B", grad: "linear-gradient(135deg,#21759B,#1a5d7a)",
    desc: "자체 도메인 자동 발행",
    fields: [
      { label: "사이트 URL", key: "wp_url", placeholder: "https://myblog.com", link: "", badge: "", badgeColor: "" },
      { label: "사용자명", key: "wp_username", placeholder: "admin", link: "", badge: "", badgeColor: "" },
      { label: "앱 비밀번호", key: "wp_app_password", placeholder: "xxxx xxxx xxxx xxxx", link: "https://wordpress.com/support/application-passwords/", badge: "", badgeColor: "" },
    ],
  },
  // Webhook (커스텀) 섹션은 AdminCustomWebhookSection 컴포넌트로 별도 처리
];

// ─────────────────────────────────────────────────────
// 커스텀 웹사이트 Webhook 섹션 (어드민용)
// ─────────────────────────────────────────────────────
const AUTH_HEADER_OPTIONS = [
  { value: "Authorization", label: "Authorization", example: "Bearer {키} 또는 {키}" },
  { value: "X-API-Key", label: "X-API-Key", example: "API 키 직접 입력" },
  { value: "X-Auth-Token", label: "X-Auth-Token", example: "토큰 직접 입력" },
  { value: "X-Custom-Auth", label: "X-Custom-Auth", example: "커스텀 인증" },
  { value: "none", label: "인증 없음", example: "공개 API" },
];

function AdminCustomWebhookSection() {
  const [accounts, setAccounts] = useState<Record<string, string>[]>(() => {
    try { return JSON.parse(localStorage.getItem("admin_custom_list") || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [url, setUrl] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [authHeader, setAuthHeader] = useState("Authorization");
  const [authKey, setAuthKey] = useState("");

  const handleSave = () => {
    if (!url.trim()) { toast.error("Webhook URL을 입력해주세요"); return; }
    const normalizedDomain = (customDomain.trim() || url.replace(/^https?:\/\//, "").split("/")[0]).trim();
    const entry: Record<string, string> = {
      _name: normalizedDomain || url.replace("https://", "").split("/")[0],
      _type: "custom",
      custom_domain: normalizedDomain,
      webhook_url: url.trim(),
      webhook_auth_header: authHeader,
      webhook_auth_key: authKey.trim(),
    };
    const updated = [...accounts, entry];
    setAccounts(updated);
    localStorage.setItem("admin_custom_list", JSON.stringify(updated));
    userSet(SETTINGS_KEYS.WEBHOOK_URL, url.trim());
    userSet(SETTINGS_KEYS.WEBHOOK_KEY, authKey.trim());
    userSet("webhook_auth_header", authHeader);
    userSet("custom_domain", normalizedDomain);
    localStorage.setItem("custom_domain", normalizedDomain);
    localStorage.setItem("admin_custom_domain", normalizedDomain);
    localStorage.setItem("blogauto_custom_domain", normalizedDomain);
    const platforms = JSON.parse(localStorage.getItem("blogauto_deploy_platforms") || "[]");
    platforms.push({ id: Math.random().toString(36).slice(2), type: "custom", name: entry._name });
    localStorage.setItem("blogauto_deploy_platforms", JSON.stringify(platforms));
    saveSettingsToServer({ [SETTINGS_KEYS.WEBHOOK_URL]: url, webhook_auth_header: authHeader, [SETTINGS_KEYS.WEBHOOK_KEY]: authKey, custom_domain: normalizedDomain, admin_custom_list: JSON.stringify(updated) });
    setShowAdd(false);
    setUrl(""); setAuthKey(""); setAuthHeader("Authorization"); setCustomDomain(""); setCategoryInput("");
    toast.success("✅ 웹사이트 등록됐어요!");
  };

  const remove = (idx: number) => {
    const removedName = accounts[idx]?._name;
    const updated = accounts.filter((_: any, i: number) => i !== idx);
    setAccounts(updated);
    localStorage.setItem("admin_custom_list", JSON.stringify(updated));

    // blogauto_deploy_platforms에서도 동기 삭제
    try {
      const deployPlatforms = JSON.parse(localStorage.getItem("blogauto_deploy_platforms") || "[]");
      const updatedDeploy = deployPlatforms.filter((p: any) => p.name !== removedName);
      localStorage.setItem("blogauto_deploy_platforms", JSON.stringify(updatedDeploy));
    } catch {}

    toast.success("삭제됐어요");
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
          <Link className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="font-semibold text-sm text-foreground">Webhook (커스텀)</div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>커스텀 사이트 자동 발행</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
          <Plus className="w-3.5 h-3.5" /> 추가
        </button>
      </div>

      {/* 등록된 사이트 목록 */}
      {accounts.length > 0 && (
        <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="pt-3 space-y-2">
            {accounts.map((acc: Record<string, string>, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#6366f1" }} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{acc._name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>URL: {acc.webhook_url}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>헤더: {acc.webhook_auth_header || "Authorization"}</p>
                  </div>
                </div>
                <button onClick={() => remove(idx)} className="p-1.5 rounded-lg hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 추가 폼 */}
      {showAdd && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="pt-3 space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Webhook URL *</label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://mysite.com/api/webhook" className="h-11 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Auth Header 방식</label>
              <Select value={authHeader} onValueChange={setAuthHeader}>
                <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUTH_HEADER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {authHeader !== "none" && (
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Auth Key</label>
                <Input value={authKey} onChange={e => setAuthKey(e.target.value)} placeholder="Bearer Token 또는 API 키" className="h-11 text-sm" />
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>취소</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// API 키 관리 컴포넌트
// ─────────────────────────────────────────────────────
function ApiKeyManager() {
  // AI 선택 상태
  const [contentAI, setContentAI] = useState<ContentAIProvider>(
    () => (userGet(SETTINGS_KEYS.CONTENT_AI) as ContentAIProvider) || "gemini"
  );
  const [imageAI, setImageAI] = useState<ImageAIProvider>(
    () => (userGet(SETTINGS_KEYS.IMAGE_AI) as ImageAIProvider) || "gemini"
  );

  const handleSelectContentAI = (v: ContentAIProvider) => {
    setContentAI(v);
    userSet(SETTINGS_KEYS.CONTENT_AI, v);
    saveSettingsToServer({ [SETTINGS_KEYS.CONTENT_AI]: v });
    toast.success(`글 생성 AI: ${CONTENT_AI_OPTIONS.find(o => o.value === v)?.label} 선택됨`);
  };
  const handleSelectImageAI = (v: ImageAIProvider) => {
    setImageAI(v);
    userSet(SETTINGS_KEYS.IMAGE_AI, v);
    saveSettingsToServer({ [SETTINGS_KEYS.IMAGE_AI]: v });
    toast.success(`이미지 AI: ${IMAGE_AI_OPTIONS.find(o => o.value === v)?.label} 선택됨`);
  };

  // 모든 키 초기값 로드
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    API_SECTIONS.forEach(s => s.fields.forEach(f => {
      init[f.key] = userGet(f.key);
    }));
    return init;
  });
  const [showMap, setShowMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ "글 생성 AI": true });

  const handleSaveAll = async () => {
    setSaving(true);
    const toSave: Record<string, string> = {};

    // AI 선택값도 함께 저장
    userSet(SETTINGS_KEYS.CONTENT_AI, contentAI);
    userSet(SETTINGS_KEYS.IMAGE_AI, imageAI);
    toSave[SETTINGS_KEYS.CONTENT_AI] = contentAI;
    toSave[SETTINGS_KEYS.IMAGE_AI] = imageAI;

    // API 키 저장 (중복 키 처리)
    const seen = new Set<string>();
    API_SECTIONS.forEach(s => s.fields.forEach(f => {
      if (!seen.has(f.key)) {
        seen.add(f.key);
        const v = values[f.key];
        if (v?.trim()) {
          userSet(f.key, v.trim());
          toSave[f.key] = v.trim();
        }
      }
    }));

    await saveSettingsToServer(toSave);
    setSaving(false);
    toast.success("✅ 관리자 페이지에 저장 완료!");
  };

  return (
    <div className="space-y-3">
      {/* 안내 배너 */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "linear-gradient(135deg, #10b98115, #05966905)", border: "1px solid #10b98130" }}>
        <Shield className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#10b981" }} />
        <div>
          <p className="text-sm font-semibold text-foreground">관리자 API 키 관리</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            관리자 계정(admin)의 API 키를 저장합니다. 네이버 데이터랩 키는 관리자 페이지에서만 저장되고, 일반 설정에는 표시되지 않아요.
          </p>
        </div>
      </div>

      {/* ── 글 생성 AI 선택 ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Bot className="w-4 h-4" style={{ color: "#10b981" }} />
          <span className="font-semibold text-sm text-foreground">글 생성 AI 선택</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "#10b98120", color: "#10b981" }}>
            현재: {CONTENT_AI_OPTIONS.find(o => o.value === contentAI)?.label}
          </span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {CONTENT_AI_OPTIONS.map(opt => {
            const active = contentAI === opt.value;
            const hasKey = !!values[opt.keyStorageKey]?.trim();
            return (
              <button key={opt.value}
                className="rounded-xl p-3 text-left transition-all active:scale-[0.97] relative overflow-hidden"
                style={{
                  background: active ? `${opt.logoColor}18` : "var(--background)",
                  border: `2px solid ${active ? opt.logoColor : "var(--border)"}`,
                  boxShadow: active ? `0 0 20px ${opt.logoColor}30` : "none",
                  outline: active ? `2px solid ${opt.logoColor}50` : "none",
                  outlineOffset: "2px",
                }}
                onClick={() => handleSelectContentAI(opt.value)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                    style={{ background: opt.logoColor }}>{opt.logo}</div>
                  <div className="flex items-center gap-1">
                    {active && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: opt.logoColor }} />}
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: opt.badge === "무료" ? "#10b98118" : "#f59e0b18", color: opt.badge === "무료" ? "#10b981" : "#f59e0b" }}>
                      {opt.badge}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-semibold text-foreground">{opt.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{opt.desc}</div>
                {/* 키 입력 여부 표시 */}
                <div className="mt-1.5 text-xs flex items-center gap-1"
                  style={{ color: hasKey ? "#10b981" : "#f59e0b" }}>
                  {hasKey ? <><CheckCircle2 className="w-3 h-3" />키 있음</> : "⚠ 키 없음"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 이미지 생성 AI 선택 ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Image className="w-4 h-4" style={{ color: "#a78bfa" }} />
          <span className="font-semibold text-sm text-foreground">이미지 생성 AI 선택</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "#a78bfa20", color: "#a78bfa" }}>
            현재: {IMAGE_AI_OPTIONS.find(o => o.value === imageAI)?.label}
          </span>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {IMAGE_AI_OPTIONS.map((opt: any) => {
            const active = imageAI === opt.value;
            const hasKey = !opt.keyStorageKey || !!values[opt.keyStorageKey]?.trim();
            return (
              <button key={opt.value}
                className="rounded-xl p-3 text-left transition-all active:scale-[0.97] overflow-hidden"
                style={{
                  background: active ? `${opt.logoColor}18` : "var(--background)",
                  border: `2px solid ${active ? opt.logoColor : "var(--border)"}`,
                  boxShadow: active ? `0 0 20px ${opt.logoColor}30` : "none",
                  outline: active ? `2px solid ${opt.logoColor}50` : "none",
                  outlineOffset: "2px",
                }}
                onClick={() => handleSelectImageAI(opt.value)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                    style={{ background: opt.logoColor }}>{opt.logo}</div>
                  <div className="flex items-center gap-1">
                    {active && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: opt.logoColor }} />}
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: "#10b98118", color: "#10b981" }}>
                      {opt.badge}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-semibold text-foreground">{opt.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{opt.desc}</div>
                <div className="mt-1.5 text-xs flex items-center gap-1"
                  style={{ color: hasKey ? "#10b981" : "#f59e0b" }}>
                  {hasKey ? <><CheckCircle2 className="w-3 h-3" />사용 가능</> : "⚠ 키 없음"}
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택된 이미지 AI 키 입력 */}
        {(() => {
          const opt = IMAGE_AI_OPTIONS.find(o => o.value === imageAI);
          if (!opt?.keyStorageKey) return null;
          const uid = opt.keyStorageKey + "_img";
          return (
            <div className="px-3 pb-3">
              <div className="p-3 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">{opt.keyLabel}</span>
                  {opt.keyLink && (
                    <a href={opt.keyLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#a78bfa" }}>
                      발급받기 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showMap[uid] ? "text" : "password"}
                    placeholder={opt.keyPlaceholder}
                    value={values[opt.keyStorageKey] || ""}
                    onChange={e => setValues(p => ({ ...p, [opt.keyStorageKey!]: e.target.value }))}
                    className="pr-10 font-mono text-sm h-10"
                    style={{ borderColor: values[opt.keyStorageKey]?.trim() ? "#a78bfa60" : undefined }}
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: "var(--muted-foreground)" }}
                    onClick={() => setShowMap(p => ({ ...p, [uid]: !p[uid] }))}>
                    {showMap[uid] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {values[opt.keyStorageKey]?.trim() && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#a78bfa" }}>
                    <CheckCircle2 className="w-3 h-3" /> 키 입력됨
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </div>
      <button
        className="w-full h-12 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{ background: saving ? "var(--muted)" : "linear-gradient(135deg, #10b981, #059669)" }}
        onClick={handleSaveAll} disabled={saving}>
        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "저장 중..." : "관리자 키 저장"}
      </button>

      {/* 섹션별 키 입력 - 그룹별 분리 */}
      {[
        { groupKey: "ai",       groupLabel: "🤖 글 · 이미지 AI",  groupColor: "#10b981" },
        { groupKey: "platform", groupLabel: "📡 배포 플랫폼 · 커스텀 사이트", groupColor: "#6366f1" },
        { groupKey: "keyword",  groupLabel: "🔍 키워드 · 기타",   groupColor: "#f59e0b" },
      ].map(({ groupKey, groupLabel, groupColor }) => (
        <div key={groupKey} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <div className="h-px flex-1" style={{ background: `${groupColor}40` }} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${groupColor}15`, color: groupColor }}>{groupLabel}</span>
            <div className="h-px flex-1" style={{ background: `${groupColor}40` }} />
          </div>
          {API_SECTIONS.filter((s: any) => s.group === groupKey).map(({ title, icon: iconName, color, grad, desc, fields }) => {
        const Icon = ICON_MAP[iconName] || Key;
        const isOpen = openSections[title] !== false;
        // 중복 키 제거 후 실제 입력 필드 수
        const uniqueKeys = [...new Set(fields.map(f => f.key))];
        const filledCount = uniqueKeys.filter(k => values[k]?.trim()).length;
        const total = uniqueKeys.length;

        return (
          <div key={title} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {/* 헤더 */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/10"
              onClick={() => setOpenSections(p => ({ ...p, [title]: !isOpen }))}>
              {/* 아이콘 */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: grad }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-sm text-foreground">{title}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{desc}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* 입력 진행률 */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: i < filledCount ? color : "var(--border)" }} />
                  ))}
                </div>
                <span className="text-xs font-medium" style={{ color: filledCount === total ? color : "var(--muted-foreground)" }}>
                  {filledCount}/{total}
                </span>
                <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "var(--muted-foreground)", transform: isOpen ? "rotate(180deg)" : "" }} />
              </div>
            </button>

            {/* 내용 */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="pt-3 space-y-3">
                  {fields.map(({ label, key, placeholder, link, badge, badgeColor, type, options }: any) => {
                    const uid = key + label;
                    const filled = !!values[key]?.trim();

                    // ── Select 드롭다운 타입 ──
                    if (type === "select" && options) {
                      return (
                        <div key={uid}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-foreground">{label}</span>
                          </div>
                          <Select
                            value={values[key] || options[0]?.value || ""}
                            onValueChange={v => setValues(p => ({ ...p, [key]: v }))}>
                            <SelectTrigger className="h-11 text-sm" style={{ borderColor: filled ? `${color}60` : undefined }}>
                              <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((opt: { value: string; label: string }) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {filled && (
                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color }}>
                              <CheckCircle2 className="w-3 h-3" /> {options.find((o: any) => o.value === values[key])?.label}
                            </p>
                          )}
                        </div>
                      );
                    }

                    // ── 기본 Input 타입 ──
                    return (
                      <div key={uid}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground">{label}</span>
                            {badge && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: `${badgeColor}18`, color: badgeColor }}>
                                {badge}
                              </span>
                            )}
                          </div>
                          {link && (
                            <a href={link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs hover:underline"
                              style={{ color }}>
                              발급받기 <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="relative">
                          <Input
                            type={showMap[uid] ? "text" : "password"}
                            placeholder={placeholder}
                            value={values[key] || ""}
                            onChange={e => setValues(p => ({ ...p, [key]: e.target.value }))}
                            className="pr-20 font-mono text-sm h-11"
                            style={{ borderColor: filled ? `${color}60` : undefined }}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-accent/30"
                              style={{ color: "var(--muted-foreground)" }}
                              onClick={() => setShowMap(p => ({ ...p, [uid]: !p[uid] }))}>
                              {showMap[uid] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {filled && (
                              <button className="p-1.5 rounded-lg hover:bg-accent/30"
                                style={{ color: "var(--muted-foreground)" }}
                                onClick={() => { navigator.clipboard.writeText(values[key]); toast.success("복사됨"); }}>
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {filled && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color }}>
                            <CheckCircle2 className="w-3 h-3" /> 저장된 키 있음
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
          })}
          {groupKey === "platform" && <AdminCustomWebhookSection />}
        </div>
      ))}

      {/* 하단 저장 버튼 */}
      <button
        className="w-full h-12 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{ background: saving ? "var(--muted)" : "linear-gradient(135deg, #10b981, #059669)" }}
        onClick={handleSaveAll} disabled={saving}>
        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "저장 중..." : "관리자 키 저장"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 회원 목록 관리
// ─────────────────────────────────────────────────────
interface UserRow { id: string; name: string; email: string; role: string; createdAt: string; postCount: number; }

function UserManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const d = await adminApi("listUsers");
    if (d.ok) setUsers(d.users || []);
    else toast.error(d.error || "불러오기 실패");
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId: string, newRole: string) => {
    setChanging(userId);
    const d = await adminApi("changeUserRole", { targetUserId: userId, newRole });
    if (d.ok) { toast.success("등급 변경 완료"); await load(); }
    else toast.error(d.error || "변경 실패");
    setChanging(null);
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!confirm(`"${name}" 회원을 삭제할까요?`)) return;
    const d = await adminApi("deleteUser", { targetUserId: userId });
    if (d.ok) { toast.success("삭제 완료"); await load(); }
    else toast.error(d.error || "삭제 실패");
  };

  const formatDate = (s: string) => {
    if (!s) return "-";
    try { return new Date(s).toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "2-digit" }); } catch { return s; }
  };

  const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    admin: { bg: "#f59e0b20", text: "#f59e0b", label: "👑 관리자" },
    user:  { bg: "#6366f120", text: "#6366f1", label: "일반" },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">총 {users.length}명</div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>가입 회원 전체 목록</div>
        </div>
        <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all active:scale-95"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }} onClick={load}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> 새로고침
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>불러오는 중...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>아직 가입한 회원이 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(u => {
            const rc = ROLE_COLORS[u.role] || ROLE_COLORS.user;
            const avatarGrad = u.role === "admin"
              ? "linear-gradient(135deg,#f59e0b,#d97706)"
              : "linear-gradient(135deg,#6366f1,#4f46e5)";
            return (
              <div key={u.id} className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: avatarGrad }}>
                    {u.name[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{u.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: rc.bg, color: rc.text }}>{rc.label}</span>
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                      {u.id} · {u.email}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-xl px-3 py-2" style={{ background: "var(--background)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>가입일</div>
                    <div className="text-xs font-medium text-foreground mt-0.5">{formatDate(u.createdAt)}</div>
                  </div>
                  <div className="rounded-xl px-3 py-2" style={{ background: "var(--background)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>발행 글</div>
                    <div className="text-xs font-medium text-foreground mt-0.5">{u.postCount}개</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    style={{
                      background: u.role === "admin" ? "#6366f118" : "#f59e0b18",
                      color: u.role === "admin" ? "#6366f1" : "#f59e0b",
                      border: `1px solid ${u.role === "admin" ? "#6366f130" : "#f59e0b30"}`,
                    }}
                    disabled={changing === u.id}
                    onClick={() => changeRole(u.id, u.role === "admin" ? "user" : "admin")}>
                    {changing === u.id
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <Crown className="w-3.5 h-3.5" />}
                    {u.role === "admin" ? "일반으로 변경" : "관리자 승급"}
                  </button>
                  <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                    style={{ background: "#ef444418", color: "#ef4444", border: "1px solid #ef444430" }}
                    onClick={() => deleteUser(u.id, u.name)}>
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 보안 (비밀번호 변경 + 시스템 현황)
// ─────────────────────────────────────────────────────
function SecurityPanel() {
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [conf, setConf] = useState("");
  const [showCur, setShowCur] = useState(false); const [showNw, setShowNw] = useState(false); const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = nw.length === 0 ? null
    : nw.length < 4 ? { label: "너무 짧음", color: "#ef4444", score: 1 }
    : nw.length < 6 ? { label: "약함", color: "#f59e0b", score: 2 }
    : nw.length < 8 ? { label: "보통", color: "#6366f1", score: 3 }
    : { label: "강함", color: "#10b981", score: 4 };

  const handle = async () => {
    if (!cur) { toast.error("현재 비밀번호를 입력해주세요"); return; }
    if (!nw || nw.length < 4) { toast.error("새 비밀번호는 4자 이상이어야 해요"); return; }
    if (nw !== conf) { toast.error("새 비밀번호가 일치하지 않아요"); return; }
    setLoading(true);
    const d = await adminApi("changeAdminPassword", { currentPassword: cur, newPassword: nw });
    if (d.ok) {
      toast.success("✅ 비밀번호 변경 완료! 서버에 저장됩니다.");
      setCur(""); setNw(""); setConf("");
      setTimeout(() => { sessionStorage.removeItem(SESSION_KEY); window.location.reload(); }, 1500);
    } else {
      toast.error(d.error || "변경 실패");
    }
    setLoading(false);
  };

  const sysMetrics = [
    { label: "CPU", value: 34, color: "#10b981", icon: Cpu },
    { label: "메모리", value: 67, color: "#f59e0b", icon: HardDrive },
    { label: "API 호출", value: 78, color: "#6366f1", icon: Wifi },
    { label: "디스크", value: 45, color: "#a78bfa", icon: Database },
  ];

  return (
    <div className="space-y-4">
      {/* 비밀번호 변경 */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-foreground">비밀번호 변경</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>변경 후 서버 저장 → 배포해도 유지</div>
          </div>
        </div>

        {([
          { label: "현재 비밀번호", val: cur, set: setCur, show: showCur, setShow: setShowCur },
          { label: "새 비밀번호", val: nw, set: setNw, show: showNw, setShow: setShowNw },
          { label: "새 비밀번호 확인", val: conf, set: setConf, show: showConf, setShow: setShowConf },
        ] as const).map(({ label, val, set, show, setShow }) => (
          <div key={label}>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>{label}</label>
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder={label} value={val}
                onChange={e => (set as any)(e.target.value)} className="pr-10 h-11" autoComplete="new-password" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                onClick={() => (setShow as any)((v: boolean) => !v)}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {label === "새 비밀번호" && strength && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= strength.score ? strength.color : "var(--border)" }} />)}
                </div>
                <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            )}
            {label === "새 비밀번호 확인" && conf.length > 0 && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: nw === conf ? "#10b981" : "#ef4444" }}>
                {nw === conf ? <><CheckCircle2 className="w-3 h-3" />일치</> : "⚠ 불일치"}
              </p>
            )}
          </div>
        ))}

        <button
          className="w-full h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: loading ? "var(--muted)" : "linear-gradient(135deg,#10b981,#059669)" }}
          onClick={handle} disabled={loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          {loading ? "변경 중..." : "비밀번호 변경"}
        </button>
      </div>

      {/* 시스템 현황 */}
      <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4" style={{ color: "#6366f1" }} />
          <span className="font-semibold text-sm text-foreground">시스템 현황</span>
        </div>
        <div className="space-y-3">
          {sysMetrics.map(m => (
            <div key={m.label} className="flex items-center gap-3">
              <m.icon className="w-4 h-4 shrink-0" style={{ color: m.color }} />
              <span className="text-xs w-14 text-foreground">{m.label}</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "var(--muted)" }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${m.value}%`, background: m.color }} />
              </div>
              <span className="text-xs w-8 text-right font-medium" style={{ color: m.color }}>{m.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 카테고리 관리
// ─────────────────────────────────────────────────────
const CUSTOM_COLORS = ["#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#ec4899","#f97316","#14b8a6","#6366f1","#84cc16"];

const FIXED_PLATFORMS = [
  { key: "wordpress", label: "워드프레스", color: "#21759B" },
  { key: "blogger",   label: "블로거",     color: "#FF5722" },
  { key: "medium",    label: "미디엄",     color: "#333333" },
];

function loadPlatformCategories(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem("platform_categories") || "{}"); } catch { return {}; }
}

function savePlatformCategories(data: Record<string, string[]>) {
  localStorage.setItem("platform_categories", JSON.stringify(data));
  saveSettingsToServer({ platform_categories: JSON.stringify(data) });
}

function PlatformCategoryCard({ platformKey, label, color, allData, onUpdate }: {
  platformKey: string; label: string; color: string;
  allData: Record<string, string[]>; onUpdate: (data: Record<string, string[]>) => void;
}) {
  const cats = allData[platformKey] || [];
  const [newCat, setNewCat] = useState("");

  const add = () => {
    const trimmed = newCat.trim();
    if (!trimmed) { toast.error("카테고리명을 입력해주세요"); return; }
    if (cats.includes(trimmed)) { toast.error("이미 있는 카테고리예요"); return; }
    const updated = { ...allData, [platformKey]: [...cats, trimmed] };
    onUpdate(updated);
    setNewCat("");
    toast.success(`"${trimmed}" 추가됐어요`);
  };

  const remove = (idx: number) => {
    const updated = { ...allData, [platformKey]: cats.filter((_: string, i: number) => i !== idx) };
    onUpdate(updated);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const list = [...cats];
    [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
    onUpdate({ ...allData, [platformKey]: list });
  };

  const moveDown = (idx: number) => {
    if (idx === cats.length - 1) return;
    const list = [...cats];
    [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
    onUpdate({ ...allData, [platformKey]: list });
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: `2px solid ${color}30` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="font-semibold text-sm text-foreground">{label}</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>
          {cats.length}개
        </span>
      </div>
      <div className="space-y-1.5 mb-3">
        {cats.length === 0 && (
          <p className="text-xs text-center py-3" style={{ color: "var(--muted-foreground)" }}>카테고리가 없어요</p>
        )}
        {cats.map((cat: string, idx: number) => (
          <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <span className="text-xs font-bold w-5 text-center" style={{ color }}>{idx + 1}</span>
            <span className="flex-1 text-sm text-foreground">{cat}</span>
            <div className="flex items-center gap-0.5">
              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent/20" style={{ color: "var(--muted-foreground)" }} onClick={() => moveUp(idx)}>
                <ChevronDown className="w-3 h-3 rotate-180" />
              </button>
              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent/20" style={{ color: "var(--muted-foreground)" }} onClick={() => moveDown(idx)}>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20" style={{ color: "#ef4444" }} onClick={() => remove(idx)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newCat} onChange={e => setNewCat(e.target.value)}
          placeholder="카테고리 입력 후 Enter"
          className="h-9 text-sm flex-1"
          onKeyDown={e => e.key === "Enter" && add()} />
        <button className="h-9 px-3 rounded-xl font-semibold text-white text-xs transition-all active:scale-95"
          style={{ background: color }} onClick={add}>추가</button>
      </div>
    </div>
  );
}

function CategoryManager() {
  const [allData, setAllData] = useState<Record<string, string[]>>(loadPlatformCategories);
  const [customList, setCustomList] = useState<any[]>(() => {
    try {
      const admin = JSON.parse(localStorage.getItem("admin_custom_list") || "[]");
      const platform = JSON.parse(localStorage.getItem("platform_custom_list") || "[]");
      // 둘 다 합쳐서 중복 제거 (webhook_url 기준)
      const merged = [...admin, ...platform].filter((e, i, arr) =>
        arr.findIndex(x => x.webhook_url === e.webhook_url) === i
      );
      return merged;
    } catch { return []; }
  });

  // 커스텀 사이트 목록 새로고침
  const refreshCustomList = () => {
    try {
      const admin = JSON.parse(localStorage.getItem("admin_custom_list") || "[]");
      const platform = JSON.parse(localStorage.getItem("platform_custom_list") || "[]");
      const merged = [...admin, ...platform].filter((e, i, arr) =>
        arr.findIndex(x => x.webhook_url === e.webhook_url) === i
      );
      setCustomList(merged);
    } catch {}
  };

  // 고정 플랫폼 (번호 없이 그대로)
  const numberedFixed = FIXED_PLATFORMS;

  // 커스텀 사이트 번호 붙이기
  const customPlatforms = customList.map((e: any, idx: number) => ({
    key: `custom_${idx}`,
    label: `커스텀 ${idx + 1}${e._name ? ` · ${e._name}` : ""}`,
    color: CUSTOM_COLORS[idx % CUSTOM_COLORS.length],
  }));

  const allPlatforms = [...numberedFixed, ...customPlatforms];

  const handleUpdate = (updated: Record<string, string[]>) => {
    setAllData(updated);
    savePlatformCategories(updated);
  };

  return (
    <div className="space-y-4 py-2">
      {/* 안내 + 계정 추가 버튼 */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-3" style={{ background: "oklch(0.6 0.15 220/10%)", border: "1px solid oklch(0.6 0.15 220/30%)" }}>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          플랫폼별로 카테고리를 따로 관리해요. 배포 시 선택한 플랫폼의 카테고리만 표시돼요.
        </p>
        <button onClick={refreshCustomList}
          className="h-8 px-3 rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
          새로고침
        </button>
      </div>
      {/* 플랫폼별 카테고리 카드 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {allPlatforms.map(p => (
          <PlatformCategoryCard key={p.key} platformKey={p.key} label={p.label} color={p.color} allData={allData} onUpdate={handleUpdate} />
        ))}
      </div>
      {customPlatforms.length === 0 && (
        <div className="text-center py-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
          커스텀 사이트가 없어요. API 키 탭 → 커스텀 Webhook에서 추가 후 새로고침 해주세요.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// OG 이미지 관리
// ─────────────────────────────────────────────────────
function OGManager() {
  const [og, setOg] = useState<OGSettings>(loadOG);
  const [newPost, setNewPost] = useState({ title: "", url: "", image: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const siteRef = useRef<HTMLInputElement>(null);
  const postRef = useRef<HTMLInputElement>(null);

  // ✅ 마운트 시 서버에서 최신 OG 설정 불러오기
  useEffect(() => {
    loadOGFromServer().then(serverOg => {
      if (serverOg) setOg(serverOg);
    });
  }, []);

  const uploadSite = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 가능합니다"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB 이하만 가능합니다"); return; }
    setUploading(true);
    try {
      const url = await uploadImageToImgbb(file);
      const u = { ...og, siteImage: url };
      setOg(u);
      await saveOGToServer(u);
      toast.success("✅ OG 이미지 업로드 완료! 모든 기기에서 공유됩니다.");
    } catch (e: any) {
      toast.error(e.message || "이미지 업로드 실패");
    }
    setUploading(false);
  };

  const save = async () => {
    await saveOGToServer(og);
    const setMeta = (prop: string, val: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); }
      el.setAttribute("content", val);
    };
    setMeta("og:title", og.siteTitle); setMeta("og:description", og.siteDesc); setMeta("og:site_name", og.siteName);
    document.title = og.siteTitle;
    toast.success("✅ OG 설정 저장 완료! 모든 기기에서 적용됩니다.");
  };

  const code = `<meta property="og:title" content="${og.siteTitle}" />\n<meta property="og:description" content="${og.siteDesc}" />\n<meta property="og:site_name" content="${og.siteName}" />\n<meta property="og:image" content="https://YOUR_DOMAIN/og-image.jpg" />\n<meta name="twitter:card" content="${og.twitterCard}" />`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
            <Globe className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">앱 전체 OG 이미지</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>카카오톡/SNS 링크 공유 시 표시</div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {og.siteImage ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1200/630", maxHeight: 180 }}>
              <img src={og.siteImage} alt="OG" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <button className="px-3 py-2 rounded-lg text-xs text-white font-medium" style={{ background: "rgba(255,255,255,0.2)" }} onClick={() => siteRef.current?.click()}><Upload className="w-3.5 h-3.5 inline mr-1" />변경</button>
                <button className="px-3 py-2 rounded-lg text-xs text-white font-medium" style={{ background: "rgba(239,68,68,0.7)" }} onClick={async () => { const u = { ...og, siteImage: "" }; setOg(u); await saveOGToServer(u); }}><X className="w-3.5 h-3.5 inline mr-1" />삭제</button>
              </div>
            </div>
          ) : (
            <button className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-all"
              style={{ border: `2px dashed ${drag ? "#6366f1" : "var(--border)"}`, background: drag ? "#6366f108" : "var(--background)", maxHeight: 160 }}
              onClick={() => siteRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={async e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) await uploadSite(f); }}>
              <Upload className="w-8 h-8 opacity-30" style={{ color: "var(--muted-foreground)" }} />
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{uploading ? "업로드 중..." : "1200×630 권장 · 최대 5MB"}</span>
            </button>
          )}
          <input ref={siteRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await uploadSite(f); e.target.value = ""; }} />
          <div className="space-y-3">
            <div><label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>사이트 제목</label><Input value={og.siteTitle} onChange={e => setOg(p => ({ ...p, siteTitle: e.target.value }))} className="h-11 text-sm" /></div>
            <div><label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>사이트명</label><Input value={og.siteName} onChange={e => setOg(p => ({ ...p, siteName: e.target.value }))} className="h-11 text-sm" /></div>
            <div><label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>설명</label><Textarea value={og.siteDesc} onChange={e => setOg(p => ({ ...p, siteDesc: e.target.value }))} className="text-sm resize-none min-h-[80px]" /></div>
          </div>
          <button className="w-full h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }} onClick={save}>
            <CheckCircle2 className="w-4 h-4" /> OG 설정 저장
          </button>
          <div className="rounded-xl p-3" style={{ background: "oklch(0.12 0.005 285)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#10b981" }}>index.html 코드</span>
              <button className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                onClick={() => { navigator.clipboard.writeText(code); toast.success("복사됐어요!"); }}>
                <Copy className="w-3 h-3" /> 복사
              </button>
            </div>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap" style={{ color: "#6ee7b7", lineHeight: 1.7 }}>{code}</pre>
          </div>
        </div>
      </div>

      {/* 글별 OG */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)" }}>
              <Link className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">글별 OG 이미지</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{og.postImages.length}개 등록</div>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)" }} onClick={() => setShowAdd(v => !v)}>
            + 추가
          </button>
        </div>
        {showAdd && (
          <div className="p-4 border-b space-y-3" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            <Input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="글 제목" className="h-11 text-sm" />
            <Input value={newPost.url} onChange={e => setNewPost(p => ({ ...p, url: e.target.value }))} placeholder="글 URL (선택)" className="h-11 text-sm" />
            {newPost.image ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1200/630", maxHeight: 140 }}>
                <img src={newPost.image} alt="미리보기" className="w-full h-full object-cover" />
                <button className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setNewPost(p => ({ ...p, image: "" }))}><X className="w-3.5 h-3.5 text-white" /></button>
              </div>
            ) : (
              <button className="w-full rounded-xl flex items-center justify-center gap-2 py-5 transition-all" style={{ border: "2px dashed var(--border)", background: "var(--card)" }} onClick={() => postRef.current?.click()}>
                <Upload className="w-5 h-5 opacity-30" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>이미지 업로드</span>
              </button>
            )}
            <input ref={postRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const b64 = await toBase64(f); setNewPost(p => ({ ...p, image: b64 })); } e.target.value = ""; }} />
            <div className="flex gap-2">
              <button className="flex-1 h-11 rounded-xl font-semibold text-white text-sm transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#a78bfa,#7c3aed)" }}
                onClick={() => {
                  if (!newPost.title.trim()) { toast.error("글 제목을 입력해주세요"); return; }
                  if (!newPost.image) { toast.error("OG 이미지를 업로드해주세요"); return; }
                  const u = { ...og, postImages: [...og.postImages, { id: Date.now().toString(), ...newPost }] };
                  setOg(u); saveOG(u); setNewPost({ title: "", url: "", image: "" }); setShowAdd(false);
                  toast.success("추가됐어요!");
                }}>추가</button>
              <button className="px-4 h-11 rounded-xl text-sm font-medium" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }} onClick={() => { setShowAdd(false); setNewPost({ title: "", url: "", image: "" }); }}>취소</button>
            </div>
          </div>
        )}
        {og.postImages.length === 0 && !showAdd ? (
          <div className="py-10 text-center"><p className="text-sm" style={{ color: "var(--muted-foreground)" }}>글별 OG 이미지를 추가해주세요</p></div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {og.postImages.map(post => (
              <div key={post.id} className="flex items-center gap-3 p-3">
                <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}><img src={post.image} alt={post.title} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                  {post.url && <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{post.url}</p>}
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: "#ef4444" }}
                  onClick={() => { const u = { ...og, postImages: og.postImages.filter(p => p.id !== post.id) }; setOg(u); saveOG(u); toast.success("삭제됐어요"); }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 공지 팝업 관리
// ─────────────────────────────────────────────────────
function PopupManager() {
  const [popups, setPopups] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newStartAt, setNewStartAt] = useState("");
  const [newEndAt, setNewEndAt] = useState("");
  const [newEmoji, setNewEmoji] = useState("📢");
  const [newColor, setNewColor] = useState("#10b981");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState<"title"|"content"|null>(null);
  const [editingId, setEditingId] = useState<string|null>(null);

  const EMOJI_LIST = ["😀","😊","🎉","🔥","💡","⭐","✅","❌","📢","📣","🎁","💰","🚀","💎","🏆","❤️","👍","🙌","😍","🤩","📌","🔔","💬","📝","📱","💻","🌟","✨","🎯","🎊","🎈","🎀","🛒","💳","📦","🔗","📧","📞","🌈","🌙","☀️","⚡","🌺","🍀","🦋","🐝","💐","🍎","☕","🎵"];

  const insertEmoji = (emoji: string, target: "title" | "content") => {
    if (target === "title") setNewTitle(prev => prev + emoji);
    if (target === "content") setNewContent(prev => prev + emoji);
    setShowEmojiPicker(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("ba_token") || "";
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "loadPopups" }),
    }).then(r => r.json()).then(d => {
      if (d.ok && Array.isArray(d.popups)) setPopups(d.popups);
    }).catch(() => {});
  }, []);

  const save = async (list: any[]) => {
    setSaving(true);
    const token = localStorage.getItem("ba_token") || "";
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "savePopups", popups: list }),
    });
    setSaving(false);
    toast.success("✅ 팝업 저장됨");
  };

  const addPopup = async () => {
    if (!newTitle.trim()) { toast.error("제목을 입력해주세요"); return; }
    if (!newContent.trim()) { toast.error("내용을 입력해주세요"); return; }
    const popup = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      enabled: true,
      startAt: newStartAt || "",
      endAt: newEndAt || "",
      emoji: newEmoji || "📢",
      color: newColor || "#10b981",
      fileUrl: newFileUrl.trim() || "",
    };
    const updated = [...popups, popup];
    setPopups(updated);
    await save(updated);
    setNewTitle(""); setNewContent(""); setNewStartAt(""); setNewEndAt("");
    setNewEmoji("📢"); setNewColor("#10b981"); setNewFileUrl("");
    setShowAdd(false);
  };

  const toggleEnabled = async (id: string) => {
    const updated = popups.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
    setPopups(updated);
    await save(updated);
  };

  const deletePopup = async (id: string) => {
    const updated = popups.filter(p => p.id !== id);
    setPopups(updated);
    await save(updated);
    toast.success("삭제됐어요");
  };

  const startEdit = (popup: any) => {
    setEditingId(popup.id);
    setNewTitle(popup.title || "");
    setNewContent(popup.content || "");
    setNewStartAt(popup.startAt || "");
    setNewEndAt(popup.endAt || "");
    setNewEmoji(popup.emoji || "📢");
    setNewColor(popup.color || "#10b981");
    setNewFileUrl(popup.fileUrl || "");
    setShowAdd(true);
  };

  const saveEdit = async () => {
    if (!newTitle.trim()) { toast.error("제목을 입력해주세요"); return; }
    if (!newContent.trim()) { toast.error("내용을 입력해주세요"); return; }
    const updated = popups.map(p => p.id === editingId ? {
      ...p,
      title: newTitle.trim(),
      content: newContent.trim(),
      startAt: newStartAt || "",
      endAt: newEndAt || "",
      emoji: newEmoji || "📢",
      color: newColor || "#10b981",
      fileUrl: newFileUrl.trim() || "",
    } : p);
    setPopups(updated);
    await save(updated);
    setEditingId(null);
    setNewTitle(""); setNewContent(""); setNewStartAt(""); setNewEndAt("");
    setNewEmoji("📢"); setNewColor("#10b981"); setNewFileUrl("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 py-4">
      {/* 안내 */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "oklch(0.65 0.22 350/10%)", border: "1px solid oklch(0.65 0.22 350/30%)" }}>
        <Bell className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#ec4899" }} />
        <div>
          <p className="text-sm font-semibold text-foreground">회원 공지 팝업 관리</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            활성화된 팝업이 대시보드에 표시돼요. 회원이 닫기 또는 일주일 보지 않기를 선택할 수 있어요.
          </p>
        </div>
      </div>

      {/* 팝업 목록 */}
      {popups.map((popup, idx) => (
        <div key={popup.id} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: popup.enabled ? "oklch(0.696 0.17 162.48/20%)" : "var(--muted)", color: popup.enabled ? "#10b981" : "var(--muted-foreground)" }}>
                {popup.enabled ? "활성" : "비활성"}
              </span>
              <span className="font-semibold text-sm text-foreground">{popup.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* 활성 토글 */}
              <div className="relative w-11 h-6 rounded-full cursor-pointer transition-colors"
                style={{ background: popup.enabled ? "#10b981" : "var(--muted)" }}
                onClick={() => toggleEnabled(popup.id)}>
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow"
                  style={{ left: popup.enabled ? "22px" : "2px" }} />
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/10"
                onClick={() => startEdit(popup)}>
                <span style={{ fontSize: 14 }}>✏️</span>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10"
                onClick={() => deletePopup(popup.id)}>
                <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
              </button>
            </div>
          </div>
          <p className="text-xs whitespace-pre-line" style={{ color: "var(--muted-foreground)" }}>{popup.content}</p>
          {(popup.startAt || popup.endAt) && (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {popup.startAt && `시작: ${popup.startAt}`}{popup.startAt && popup.endAt && " ~ "}{popup.endAt && `종료: ${popup.endAt}`}
            </p>
          )}
        </div>
      ))}

      {popups.length === 0 && !showAdd && (
        <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>등록된 팝업이 없어요</div>
      )}

      {/* 추가 폼 */}
      {showAdd && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid #ec489940" }}>
          <p className="font-semibold text-sm text-foreground">{editingId ? "팝업 수정" : "새 팝업 추가"}</p>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>제목</label>
              <button type="button" onClick={() => setShowEmojiPicker(v => v === "title" ? null : "title")}
                className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                😊 이모티콘
              </button>
            </div>
            {showEmojiPicker === "title" && (
              <div className="flex flex-wrap gap-1 p-2 mb-2 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                {EMOJI_LIST.map(e => (
                  <button key={e} type="button" onClick={() => insertEmoji(e, "title")}
                    className="text-lg hover:scale-125 transition-transform p-0.5">{e}</button>
                ))}
              </div>
            )}
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="팝업 제목" className="text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>내용</label>
              <button type="button" onClick={() => setShowEmojiPicker(v => v === "content" ? null : "content")}
                className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                😊 이모티콘
              </button>
            </div>
            {showEmojiPicker === "content" && (
              <div className="flex flex-wrap gap-1 p-2 mb-2 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                {EMOJI_LIST.map(e => (
                  <button key={e} type="button" onClick={() => insertEmoji(e, "content")}
                    className="text-lg hover:scale-125 transition-transform p-0.5">{e}</button>
                ))}
              </div>
            )}
            <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="팝업 내용" className="text-sm min-h-[120px] font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>노출 시작일 (선택)</label>
              <Input type="date" value={newStartAt} onChange={e => setNewStartAt(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>노출 종료일 (선택)</label>
              <Input type="date" value={newEndAt} onChange={e => setNewEndAt(e.target.value)} className="text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>이모지 아이콘</label>
              <Input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="📢" className="text-sm" maxLength={4} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>헤더 색상</label>
              <div className="flex items-center gap-2">
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer border-0" style={{ background: "transparent" }} />
                <Input value={newColor} onChange={e => setNewColor(e.target.value)} placeholder="#10b981" className="text-sm flex-1" maxLength={7} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>파일 다운로드 URL (선택)</label>
            <Input value={newFileUrl} onChange={e => setNewFileUrl(e.target.value)} placeholder="https://... 또는 /파일경로.pdf" className="text-sm" />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" style={{ background: "#ec4899", color: "white" }} onClick={editingId ? saveEdit : addPopup} disabled={saving}>
              {saving ? "저장 중..." : editingId ? "✅ 수정 저장" : "✅ 추가"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => { setShowAdd(false); setEditingId(null); setNewTitle(""); setNewContent(""); setNewStartAt(""); setNewEndAt(""); setNewEmoji("📢"); setNewColor("#10b981"); setNewFileUrl(""); }}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 추가 버튼 */}
      {!showAdd && (
        <button className="w-full h-11 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#ec4899,#db2777)" }}
          onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> 팝업 추가
        </button>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────
// 관리자 대시보드
// ─────────────────────────────────────────────────────
const TABS = [
  { id: "apikeys", label: "API 키", icon: Key, color: "#10b981", grad: "linear-gradient(135deg,#10b981,#059669)" },
  { id: "users",   label: "회원",   icon: Users, color: "#6366f1", grad: "linear-gradient(135deg,#6366f1,#4f46e5)" },
  { id: "security",label: "보안",   icon: Shield, color: "#f59e0b", grad: "linear-gradient(135deg,#f59e0b,#d97706)" },
  { id: "category",label: "카테고리", icon: FileText, color: "#06b6d4", grad: "linear-gradient(135deg,#06b6d4,#0284c7)" },
  { id: "og",      label: "OG",    icon: Image, color: "#a78bfa", grad: "linear-gradient(135deg,#a78bfa,#7c3aed)" },
  { id: "popup",   label: "공지",  icon: Bell, color: "#ec4899", grad: "linear-gradient(135deg,#ec4899,#db2777)" },
] as const;
type TabId = typeof TABS[number]["id"];

function AdminDashboard() {
  const [tab, setTab] = useState<TabId>("apikeys");
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("ba_token");
    localStorage.removeItem("ba_user");
    window.location.reload();
  };
  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <Layout>
      <div className="pb-24">
        {/* 헤더 */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: activeTab.grad }}>
                <activeTab.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>운영자 패널</h1>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{activeTab.label} 관리</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-xs px-3 py-2 rounded-xl font-bold transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", boxShadow: "0 0 12px rgba(239,68,68,0.4)" }}
                onClick={() => window.location.href = "/monetization"}>
                💰 수익화
              </button>
              <button className="text-xs px-3 py-2 rounded-xl font-medium transition-all active:scale-95"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }} onClick={handleLogout}>
                잠금
              </button>
            </div>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="px-4">
          {tab === "apikeys"  && <ApiKeyManager />}
          {tab === "users"    && <UserManager />}
          {tab === "security" && <SecurityPanel />}
          {tab === "category" && <CategoryManager />}
          {tab === "og"       && <OGManager />}
          {tab === "popup"    && <PopupManager />}
        </div>
      </div>

      {/* 하단 탭바 */}
      <div className="fixed bottom-0 left-0 right-0 z-50"
        style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center px-2 py-2 gap-1">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all active:scale-95"
                style={{ background: active ? `${t.color}18` : "transparent" }}
                onClick={() => setTab(t.id)}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: active ? t.grad : "transparent" }}>
                  <t.icon className="w-4 h-4" style={{ color: active ? "white" : "var(--muted-foreground)" }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: active ? t.color : "var(--muted-foreground)" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

// ─────────────────────────────────────────────────────
// 비밀번호 게이트
// ─────────────────────────────────────────────────────
function AdminGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", userId: "admin", password: pw }),
      });
      const d = await r.json();
      if (d.ok) {
        localStorage.setItem("ba_token", d.token);
        localStorage.setItem("ba_user", JSON.stringify(d.user));
        sessionStorage.setItem(SESSION_KEY, d.token);
        // 서버 설정 로드
        const sr = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${d.token}` },
          body: JSON.stringify({ action: "loadSettings" }),
        });
        const sd = await sr.json();
        if (sd.ok && sd.settings) {
          Object.entries(sd.settings).forEach(([k, v]) => {
            if (typeof v === "string") localStorage.setItem(`u:admin:${k}`, v);
          });
        }
        onAuth();
      } else {
        toast.error("비밀번호가 올바르지 않아요");
        setPw("");
      }
    } catch { toast.error("네트워크 오류"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <button className="flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100" style={{ color: "var(--foreground)" }} onClick={() => window.location.href = "/"}>
          <Home className="w-4 h-4" /> 홈으로
        </button>
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#10b98115", color: "#10b981" }}>운영자 전용</span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 relative"
              style={{ background: "linear-gradient(135deg, #10b981, #6366f1)" }}>
              <Shield className="w-10 h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#f59e0b" }}>
                <Lock className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>관리자 인증</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>운영자 전용 관리 패널</p>
          </div>

          <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                placeholder="관리자 비밀번호"
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="h-12 pr-12 text-base"
                name="blogauto-admin-passcode"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="text"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "var(--muted-foreground)" }} onClick={() => setShow(v => !v)}>
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: loading ? "var(--muted)" : "linear-gradient(135deg, #10b981, #6366f1)" }}
              onClick={handleSubmit} disabled={loading}>
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              {loading ? "인증 중..." : "접속하기"}
            </button>
          </div>
          <button className="w-full mt-4 text-sm text-center hover:underline" style={{ color: "var(--muted-foreground)" }} onClick={() => window.location.href = "/dashboard"}>
            대시보드로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────
export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(() => {
    const s = sessionStorage.getItem(SESSION_KEY);
    return !!s && !!localStorage.getItem("ba_token");
  });
  if (!authed) return <AdminGate onAuth={() => setAuthed(true)} />;
  return <AdminDashboard />;
}
//fix

