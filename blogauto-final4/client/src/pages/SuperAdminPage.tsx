// BlogAuto Pro - SuperAdminPage v3.1
/**
 * BlogAuto Pro - Super Admin Page
 * ✅ OG 이미지 관리 (앱 전체 + 글별)
 * ✅ 비밀번호 변경
 * ✅ 시스템 현황, API 관리, 자동화 규칙, 로그
 */

import { useState, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Shield, Key, Activity, Database, Cpu, HardDrive,
  Wifi, RefreshCw, Eye, EyeOff, Copy, Plus, Lock,
  Zap, Settings, CheckCircle2, Image, Upload, X,
  Globe, Link, Trash2, ExternalLink, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

// ── 비밀번호 ──────────────────────────────────────────
const PW_STORAGE_KEY = "bap_admin_pw";
const DEFAULT_PW_HASH = "MTIzNDU2";

function getStoredHash(): string {
  return localStorage.getItem(PW_STORAGE_KEY) || DEFAULT_PW_HASH;
}
function setStoredHash(hash: string) {
  localStorage.setItem(PW_STORAGE_KEY, hash);
}
function verifyAdmin(input: string): boolean {
  try { return btoa(input) === getStoredHash(); } catch { return false; }
}

const SESSION_KEY = "bap_admin_auth";

// ── OG 설정 저장 키 ──────────────────────────────────
const OG_KEY = "blogauto_og_settings";

interface OGSettings {
  siteTitle: string;
  siteDesc: string;
  siteImage: string;   // base64 or URL
  siteName: string;
  twitterCard: string;
  // 글별 OG
  postImages: { id: string; title: string; image: string; url: string }[];
}

function loadOG(): OGSettings {
  try {
    const raw = localStorage.getItem(OG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    siteTitle: "BlogAuto Pro - AI 블로그 자동화",
    siteDesc: "AI로 블로그 글을 자동 생성하고 수익을 극대화하세요",
    siteImage: "",
    siteName: "BlogAuto Pro",
    twitterCard: "summary_large_image",
    postImages: [],
  };
}

function saveOG(data: OGSettings) {
  try { localStorage.setItem(OG_KEY, JSON.stringify(data)); } catch {}
}

const API_KEYS_DEFAULT = [
  { id: 1, name: "OpenAI API Key", key: "sk-proj-xxxxxxxxxxxxxxxxxxxx", service: "OpenAI GPT-4", active: true, usage: 78 },
  { id: 2, name: "Stability AI Key", key: "sk-xxxxxxxxxxxxxxxxxxxxxxxx", service: "이미지 생성", active: true, usage: 45 },
  { id: 3, name: "Naver Blog API", key: "naver_xxxxxxxxxxxxxxxxxx", service: "네이버 블로그", active: true, usage: 62 },
];

const SYSTEM_LOGS = [
  { time: "14:32:18", level: "info", message: "키워드 수집 완료 - 142개 수집됨" },
  { time: "14:28:45", level: "success", message: "콘텐츠 생성 완료 - '맛집 추천 2026' (1,847자)" },
  { time: "14:25:12", level: "info", message: "이미지 생성 완료 - 4개 생성됨" },
  { time: "14:20:33", level: "success", message: "네이버 블로그 발행 성공 - '서울 강남 숨은 맛집'" },
  { time: "14:15:08", level: "warning", message: "API 사용량 80% 초과 - OpenAI" },
  { time: "14:05:22", level: "info", message: "자동화 파이프라인 시작" },
];

const LOG_COLORS: Record<string, string> = {
  info: "oklch(0.6 0.15 220)",
  success: "var(--color-emerald)",
  warning: "var(--color-amber-brand)",
  error: "oklch(0.65 0.22 25)",
};

// ─── 비밀번호 게이트 ─────────────────────────────────
function AdminGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(false);

  // 현재 언어
  const langMap: Record<string, string> = {
    ko: "🇰🇷 한국어", en: "🇺🇸 English", ja: "🇯🇵 日本語", zh: "🇨🇳 中文",
    es: "🇪🇸 Español", fr: "🇫🇷 Français", de: "🇩🇪 Deutsch", pt: "🇧🇷 Português",
  };
  const currentLang = langMap[localStorage.getItem("content_language") || "ko"] || "🇰🇷 한국어";

  const handleSubmit = () => {
    if (verifyAdmin(pw)) {
      sessionStorage.setItem(SESSION_KEY, getStoredHash());
      onAuth();
    } else {
      setShake(true);
      toast.error("비밀번호가 올바르지 않습니다");
      setPw("");
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 상단 네비 */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <button
          className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--foreground)" }}
          onClick={() => window.location.href = "/"}>
          <Home className="w-4 h-4" />
          홈으로
        </button>
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
          <Globe className="w-3.5 h-3.5" />
          {currentLang}
        </div>
      </div>

      {/* 로그인 카드 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`w-full max-w-sm rounded-2xl p-8 ${shake ? "animate-bounce" : ""}`}
          style={{ background: "var(--card)", border: "2px solid var(--border)" }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "oklch(0.696 0.17 162.48 / 15%)", border: "1px solid oklch(0.696 0.17 162.48 / 30%)" }}>
              <Lock className="w-8 h-8" style={{ color: "var(--color-emerald)" }} />
            </div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>관리자 인증</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>운영자 전용 영역입니다</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Input type={show ? "text" : "password"} placeholder="비밀번호 입력"
                value={pw} onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="pr-10" autoComplete="new-password" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
                onClick={() => setShow(v => !v)}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button className="w-full gap-2 h-11" style={{ background: "var(--color-emerald)", color: "white" }} onClick={handleSubmit}>
              <Shield className="w-4 h-4" /> 접속하기
            </Button>
            <button className="w-full text-sm text-center hover:underline"
              style={{ color: "var(--muted-foreground)" }}
              onClick={() => window.location.href = "/dashboard"}>
              대시보드로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 비밀번호 변경 모달 ──────────────────────────────
function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getStrength = (pw: string) => {
    if (pw.length === 0) return { score: 0, label: "", color: "" };
    if (pw.length < 4) return { score: 1, label: "너무 짧음", color: "oklch(0.65 0.22 25)" };
    if (pw.length < 6) return { score: 2, label: "약함", color: "var(--color-amber-brand)" };
    if (pw.length < 8) return { score: 3, label: "보통", color: "oklch(0.6 0.15 220)" };
    return { score: 4, label: "강함", color: "var(--color-emerald)" };
  };
  const strength = getStrength(newPw);

  const handleChange = () => {
    if (!currentPw) { toast.error("현재 비밀번호를 입력해주세요"); return; }
    if (!verifyAdmin(currentPw)) { toast.error("현재 비밀번호가 올바르지 않습니다"); return; }
    if (newPw.length < 4) { toast.error("새 비밀번호는 4자 이상이어야 합니다"); return; }
    if (newPw !== confirmPw) { toast.error("새 비밀번호가 일치하지 않습니다"); return; }
    if (newPw === currentPw) { toast.error("현재 비밀번호와 동일합니다"); return; }

    setIsLoading(true);
    setTimeout(() => {
      try {
        setStoredHash(btoa(newPw));
        sessionStorage.setItem(SESSION_KEY, btoa(newPw));
        toast.success("✅ 비밀번호가 변경되었습니다!");
        onClose();
      } catch { toast.error("변경 중 오류가 발생했습니다"); }
      finally { setIsLoading(false); }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 mx-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.696 0.17 162.48/15%)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
            <Key className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
          </div>
          <div>
            <h2 className="font-bold text-foreground">비밀번호 변경</h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>관리자 비밀번호를 새로 설정합니다</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: "현재 비밀번호", val: currentPw, set: setCurrentPw, show: showCurrent, setShow: setShowCurrent },
            { label: "새 비밀번호", val: newPw, set: setNewPw, show: showNew, setShow: setShowNew },
            { label: "새 비밀번호 확인", val: confirmPw, set: setConfirmPw, show: showConfirm, setShow: setShowConfirm },
          ].map(({ label, val, set, show, setShow }) => (
            <div key={label}>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>{label}</label>
              <div className="relative">
                <Input type={show ? "text" : "password"} placeholder={label} value={val}
                  onChange={e => set(e.target.value)} className="pr-10" autoComplete="new-password" />
                <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                  onClick={() => setShow((v: boolean) => !v)}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {label === "새 비밀번호" && newPw.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: i <= strength.score ? strength.color : "var(--border)" }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
              {label === "새 비밀번호 확인" && confirmPw.length > 0 && (
                <p className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: newPw === confirmPw ? "var(--color-emerald)" : "oklch(0.65 0.22 25)" }}>
                  {newPw === confirmPw ? <><CheckCircle2 className="w-3 h-3" /> 일치</> : "⚠ 불일치"}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>취소</Button>
          <Button className="flex-1 gap-2"
            style={{ background: isLoading ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
            onClick={handleChange} disabled={isLoading}>
            {isLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> 변경 중...</> : <><Key className="w-4 h-4" /> 비밀번호 변경</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── OG 이미지 관리 섹션 ─────────────────────────────
function OGManager() {
  const [og, setOg] = useState<OGSettings>(loadOG);
  const [newPost, setNewPost] = useState({ title: "", url: "", image: "" });
  const [showAddPost, setShowAddPost] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const siteImgRef = useRef<HTMLInputElement>(null);
  const postImgRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSiteImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 가능합니다"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB 이하만 가능합니다"); return; }
    const b64 = await fileToBase64(file);
    const updated = { ...og, siteImage: b64 };
    setOg(updated); saveOG(updated);
    toast.success("사이트 OG 이미지가 설정됐어요!");
  };

  const handlePostImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 가능합니다"); return; }
    const b64 = await fileToBase64(file);
    setNewPost(prev => ({ ...prev, image: b64 }));
  };

  const saveSiteOG = () => {
    saveOG(og);

    // index.html의 OG 태그를 동적으로 업데이트
    const updateMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const updateMetaName = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    updateMeta("og:title", og.siteTitle);
    updateMeta("og:description", og.siteDesc);
    updateMeta("og:site_name", og.siteName);
    if (og.siteImage) updateMeta("og:image", og.siteImage.startsWith("data:") ? window.location.origin + "/og-image.jpg" : og.siteImage);
    updateMetaName("twitter:card", og.twitterCard);
    updateMetaName("twitter:title", og.siteTitle);
    updateMetaName("twitter:description", og.siteDesc);
    document.title = og.siteTitle;

    toast.success("✅ OG 설정이 저장됐어요! index.html도 같이 업데이트해주세요.");
  };

  const addPostOG = () => {
    if (!newPost.title.trim()) { toast.error("글 제목을 입력해주세요"); return; }
    if (!newPost.image) { toast.error("OG 이미지를 업로드해주세요"); return; }
    const entry = { id: Date.now().toString(), title: newPost.title, image: newPost.image, url: newPost.url };
    const updated = { ...og, postImages: [...og.postImages, entry] };
    setOg(updated); saveOG(updated);
    setNewPost({ title: "", url: "", image: "" });
    setShowAddPost(false);
    toast.success("글별 OG 이미지가 추가됐어요!");
  };

  const removePostOG = (id: string) => {
    const updated = { ...og, postImages: og.postImages.filter(p => p.id !== id) };
    setOg(updated); saveOG(updated);
    toast.success("삭제됐어요");
  };

  const getIndexHtmlCode = () => {
    return `<!-- index.html <head> 안에 추가 -->
<meta property="og:type" content="website" />
<meta property="og:title" content="${og.siteTitle}" />
<meta property="og:description" content="${og.siteDesc}" />
<meta property="og:site_name" content="${og.siteName}" />
<meta property="og:image" content="https://YOUR_DOMAIN/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="${og.twitterCard}" />
<meta name="twitter:title" content="${og.siteTitle}" />
<meta name="twitter:description" content="${og.siteDesc}" />
<meta name="twitter:image" content="https://YOUR_DOMAIN/og-image.jpg" />`;
  };

  return (
    <div className="space-y-6">

      {/* ── 앱 전체 OG 이미지 ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Globe className="w-5 h-5" style={{ color: "oklch(0.6 0.15 220)" }} />
          <h3 className="font-semibold text-foreground">앱 전체 OG 이미지</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.6 0.15 220/15%)", color: "oklch(0.6 0.15 220)" }}>
            카카오톡/SNS 링크 공유 시 표시
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* OG 이미지 업로드 */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
              OG 이미지 (권장: 1200×630px)
            </label>
            {og.siteImage ? (
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1200/630", maxHeight: 240 }}>
                <img src={og.siteImage} alt="OG 이미지" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                    onClick={() => siteImgRef.current?.click()}>
                    <Upload className="w-4 h-4" /> 변경
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: "rgba(239,68,68,0.7)" }}
                    onClick={() => { const u = { ...og, siteImage: "" }; setOg(u); saveOG(u); }}>
                    <X className="w-4 h-4" /> 삭제
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="rounded-xl flex flex-col items-center justify-center gap-3 py-10 transition-all cursor-pointer"
                style={{
                  border: `2px dashed ${isDragging ? "var(--color-emerald)" : "var(--border)"}`,
                  background: isDragging ? "oklch(0.696 0.17 162.48/8%)" : "var(--background)",
                  aspectRatio: "1200/630", maxHeight: 200,
                }}
                onClick={() => siteImgRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={async e => {
                  e.preventDefault(); setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) await handleSiteImageUpload(file);
                }}>
                <Image className="w-10 h-10 opacity-30" style={{ color: "var(--muted-foreground)" }} />
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>클릭하거나 드래그해서 업로드</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>권장 크기: 1200 × 630px · 최대 5MB</p>
                </div>
              </div>
            )}
            <input ref={siteImgRef} type="file" accept="image/*" className="hidden"
              onChange={async e => { const f = e.target.files?.[0]; if (f) await handleSiteImageUpload(f); e.target.value = ""; }} />
          </div>

          {/* OG 텍스트 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>사이트 제목</label>
              <Input value={og.siteTitle} onChange={e => setOg(p => ({ ...p, siteTitle: e.target.value }))}
                placeholder="BlogAuto Pro" className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>사이트명</label>
              <Input value={og.siteName} onChange={e => setOg(p => ({ ...p, siteName: e.target.value }))}
                placeholder="BlogAuto Pro" className="text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>설명</label>
              <Textarea value={og.siteDesc} onChange={e => setOg(p => ({ ...p, siteDesc: e.target.value }))}
                placeholder="사이트 설명..." className="text-sm resize-none min-h-16" />
            </div>
          </div>

          <Button className="gap-2 w-full sm:w-auto" style={{ background: "var(--color-emerald)", color: "white" }} onClick={saveSiteOG}>
            <CheckCircle2 className="w-4 h-4" /> OG 설정 저장
          </Button>
        </div>

        {/* index.html 코드 복사 */}
        <div className="px-5 pb-5">
          <div className="rounded-xl p-4" style={{ background: "oklch(0.12 0.005 285)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "var(--color-emerald)" }}>📋 index.html에 추가할 코드</span>
              <button className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                onClick={() => { navigator.clipboard.writeText(getIndexHtmlCode()); toast.success("코드가 복사됐어요! index.html <head>에 붙여넣으세요"); }}>
                <Copy className="w-3 h-3" /> 복사
              </button>
            </div>
            <pre className="text-xs overflow-x-auto" style={{ color: "oklch(0.75 0.1 150)", lineHeight: 1.6 }}>
              {getIndexHtmlCode()}
            </pre>
          </div>
        </div>
      </div>

      {/* ── 글별 OG 이미지 ── */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5" style={{ color: "oklch(0.75 0.12 300)" }} />
            <h3 className="font-semibold text-foreground">글별 OG 이미지</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.75 0.12 300/15%)", color: "oklch(0.75 0.12 300)" }}>
              {og.postImages.length}개 등록됨
            </span>
          </div>
          <Button size="sm" className="gap-1.5"
            style={{ background: "oklch(0.75 0.12 300)", color: "white" }}
            onClick={() => setShowAddPost(v => !v)}>
            <Plus className="w-3.5 h-3.5" /> 글 OG 추가
          </Button>
        </div>

        {/* 추가 폼 */}
        {showAddPost && (
          <div className="p-5 border-b space-y-4" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>글 제목</label>
                <Input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                  placeholder="블로그 글 제목" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>글 URL (선택)</label>
                <Input value={newPost.url} onChange={e => setNewPost(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://myblog.com/post/..." className="text-sm" />
              </div>
            </div>

            {/* 글 OG 이미지 업로드 */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>OG 이미지</label>
              {newPost.image ? (
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1200/630", maxHeight: 160 }}>
                  <img src={newPost.image} alt="미리보기" className="w-full h-full object-cover" />
                  <button className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                    onClick={() => setNewPost(p => ({ ...p, image: "" }))}>
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <button className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-6 transition-all"
                  style={{ border: "2px dashed var(--border)", background: "var(--card)" }}
                  onClick={() => postImgRef.current?.click()}>
                  <Upload className="w-6 h-6 opacity-30" style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>이미지 업로드 (1200×630 권장)</span>
                </button>
              )}
              <input ref={postImgRef} type="file" accept="image/*" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) await handlePostImageUpload(f); e.target.value = ""; }} />
            </div>

            <div className="flex gap-2">
              <Button className="gap-2 flex-1" style={{ background: "oklch(0.75 0.12 300)", color: "white" }} onClick={addPostOG}>
                <CheckCircle2 className="w-4 h-4" /> 추가
              </Button>
              <Button variant="outline" onClick={() => { setShowAddPost(false); setNewPost({ title: "", url: "", image: "" }); }}>취소</Button>
            </div>
          </div>
        )}

        {/* 글별 목록 */}
        {og.postImages.length === 0 && !showAddPost ? (
          <div className="p-8 text-center">
            <Link className="w-8 h-8 opacity-20 mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              글별 OG 이미지를 추가하면 각 글 링크 공유 시 해당 이미지가 표시돼요
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {og.postImages.map(post => (
              <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-accent/10 transition-colors">
                <div className="w-20 h-12 rounded-lg overflow-hidden shrink-0"
                  style={{ border: "1px solid var(--border)", background: "var(--background)" }}>
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                  {post.url && (
                    <a href={post.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 mt-0.5 hover:underline truncate"
                      style={{ color: "oklch(0.6 0.15 220)" }}>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      {post.url}
                    </a>
                  )}
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-colors shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                  onClick={() => removePostOG(post.id)}>
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

// ─── 관리자 대시보드 ─────────────────────────────────
function AdminDashboard() {
  const [showKeys, setShowKeys] = useState<number[]>([]);
  const [apiKeys, setApiKeys] = useState(API_KEYS_DEFAULT);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"system" | "og" | "automation">("system");

  const toggleShowKey = (id: number) => {
    setShowKeys(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleKeyActive = (id: number) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, active: !k.active } : k));
    toast.success("API 키 상태가 변경되었습니다");
  };
  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API 키가 복사되었습니다");
  };
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  const TABS = [
    { id: "system", label: "시스템", icon: Cpu },
    { id: "og", label: "OG 이미지", icon: Image },
    { id: "automation", label: "자동화", icon: Zap },
  ] as const;

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" style={{ color: "var(--color-emerald)" }} />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                운영자 관리 패널
              </h1>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>시스템 설정, OG 이미지, 자동화 규칙</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
              style={{ background: "oklch(0.696 0.17 162.48 / 10%)", border: "1px solid oklch(0.696 0.17 162.48 / 20%)", color: "var(--color-emerald)" }}>
              <Shield className="w-4 h-4" /> 운영자
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowPasswordModal(true)}>
              <Key className="w-4 h-4" /> 비밀번호 변경
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}>잠금</Button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--muted)" }}>
          {TABS.map(tab => (
            <button key={tab.id}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.id ? "var(--card)" : "transparent",
                color: activeTab === tab.id ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
              onClick={() => setActiveTab(tab.id)}>
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── 시스템 탭 ── */}
        {activeTab === "system" && (
          <div className="space-y-6">
            {/* 시스템 현황 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "CPU 사용률", value: 34, icon: Cpu, color: "var(--color-emerald)" },
                { label: "메모리", value: 67, icon: HardDrive, color: "var(--color-amber-brand)" },
                { label: "API 호출", value: 78, icon: Wifi, color: "oklch(0.6 0.15 220)" },
                { label: "디스크", value: 45, icon: Database, color: "oklch(0.75 0.12 300)" },
              ].map(metric => (
                <div key={metric.label} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{metric.label}</span>
                    <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                  <div className="text-2xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: metric.color }}>
                    {metric.value}%
                  </div>
                  <Progress value={metric.value} className="h-1.5" />
                </div>
              ))}
            </div>

            {/* 보안 설정 */}
            <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5" style={{ color: "oklch(0.75 0.12 300)" }} />
                <h3 className="font-semibold text-foreground">보안 설정</h3>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div>
                  <div className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4" style={{ color: "oklch(0.75 0.12 300)" }} />
                    관리자 비밀번호
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>현재 비밀번호를 새로운 비밀번호로 변경합니다</p>
                </div>
                <Button size="sm"
                  style={{ background: "oklch(0.75 0.12 300/15%)", color: "oklch(0.75 0.12 300)", border: "1px solid oklch(0.75 0.12 300/40%)" }}
                  onClick={() => setShowPasswordModal(true)}>
                  <Key className="w-4 h-4 mr-1.5" /> 변경하기
                </Button>
              </div>
            </div>

            {/* API Keys */}
            <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
                  <h3 className="font-semibold text-foreground">API 키 관리</h3>
                </div>
                <Button size="sm" variant="outline" className="gap-2"
                  onClick={() => toast.info("API 키 추가 기능은 준비 중입니다")}>
                  <Plus className="w-4 h-4" /> 키 추가
                </Button>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {apiKeys.map(apiKey => (
                  <div key={apiKey.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm text-foreground">{apiKey.name}</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{apiKey.service}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: apiKey.active ? "oklch(0.696 0.17 162.48 / 15%)" : "var(--muted)", color: apiKey.active ? "var(--color-emerald)" : "var(--muted-foreground)" }}>
                          {apiKey.active ? "활성" : "비활성"}
                        </span>
                        <Switch checked={apiKey.active} onCheckedChange={() => toggleKeyActive(apiKey.id)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs"
                      style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                      <span className="flex-1 truncate" style={{ color: "var(--muted-foreground)" }}>
                        {showKeys.includes(apiKey.id) ? apiKey.key : "•".repeat(28)}
                      </span>
                      <button onClick={() => toggleShowKey(apiKey.id)} className="text-muted-foreground hover:text-foreground">
                        {showKeys.includes(apiKey.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => copyKey(apiKey.key)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {apiKey.active && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                          <span>사용량</span>
                          <span style={{ color: apiKey.usage > 80 ? "var(--color-amber-brand)" : "var(--color-emerald)" }}>{apiKey.usage}%</span>
                        </div>
                        <Progress value={apiKey.usage} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* System Logs */}
            <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" style={{ color: "oklch(0.6 0.15 220)" }} />
                  <h3 className="font-semibold text-foreground">시스템 로그</h3>
                </div>
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => toast.info("로그 새로고침")}>
                  <RefreshCw className="w-3.5 h-3.5" /> 새로고침
                </Button>
              </div>
              <div className="p-4 font-mono text-xs space-y-2 max-h-64 overflow-y-auto" style={{ background: "oklch(0.12 0.005 285.823)" }}>
                {SYSTEM_LOGS.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span style={{ color: "var(--muted-foreground)" }}>{log.time}</span>
                    <span className="uppercase font-bold w-16 flex-shrink-0" style={{ color: LOG_COLORS[log.level] }}>[{log.level}]</span>
                    <span style={{ color: "oklch(0.8 0.005 65)" }}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── OG 이미지 탭 ── */}
        {activeTab === "og" && <OGManager />}

        {/* ── 자동화 탭 ── */}
        {activeTab === "automation" && (
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
              <h3 className="font-semibold text-foreground">자동화 규칙</h3>
            </div>
            <div className="space-y-3">
              {[
                { rule: "키워드 수집 자동 실행", desc: "매 3시간마다 새 키워드 자동 수집", active: true },
                { rule: "콘텐츠 자동 생성", desc: "수집된 키워드로 즉시 글 생성", active: true },
                { rule: "이미지 자동 생성", desc: "글 생성 후 관련 이미지 자동 생성", active: true },
                { rule: "자동 배포", desc: "생성 완료 후 예약 배포 자동 등록", active: false },
                { rule: "수익 리포트 알림", desc: "일일 수익 현황 이메일 발송", active: true },
              ].map(rule => (
                <div key={rule.rule} className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                  <div>
                    <div className="text-sm font-medium text-foreground">{rule.rule}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{rule.desc}</div>
                  </div>
                  <Switch checked={rule.active}
                    onCheckedChange={() => toast.success(`${rule.rule} ${rule.active ? "비활성화" : "활성화"}됨`)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
    </Layout>
  );
}

// ─── 메인 ─────────────────────────────────────────────
export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === getStoredHash()
  );
  if (!authed) return <AdminGate onAuth={() => setAuthed(true)} />;
  return <AdminDashboard />;
}
