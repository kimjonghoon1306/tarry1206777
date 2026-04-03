/**
 * BlogAuto Pro - Super Admin Page v5.0
 * ✅ 관리자 비번 서버(KV) 저장 → 배포해도 초기화 안됨
 * ✅ 회원 목록 / 등급 변경 / 삭제
 * ✅ API 키 직접 관리
 * ✅ OG 이미지 관리
 * ✅ 모바일 최적화 + 최강 디자인
 */

import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Shield, Key, Eye, EyeOff, Copy, Lock, Zap,
  CheckCircle2, Image, Upload, X, Globe, Link,
  Trash2, ExternalLink, Home, Save, Bot, Send,
  Users, Crown, UserX, RefreshCw, ChevronDown,
  Activity, Cpu, Database, HardDrive, Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { userGet, userSet, saveSettingsToServer, SETTINGS_KEYS } from "@/lib/user-storage";

const SESSION_KEY = "bap_admin_auth";
const OG_KEY = "blogauto_og_settings";

// ── 서버 API 헬퍼 ──────────────────────────────────────
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

// ── OG 타입 ───────────────────────────────────────────
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

// ── 파일 → base64 ─────────────────────────────────────
function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
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
        // 서버에서 설정 로드
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
      {/* 상단바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <button className="flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity" style={{ color: "var(--foreground)" }} onClick={() => window.location.href = "/"}>
          <Home className="w-4 h-4" /> 홈으로
        </button>
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)" }}>
          운영자 전용
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* 로고 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 relative"
              style={{ background: "linear-gradient(135deg, oklch(0.696 0.17 162.48), oklch(0.55 0.2 270))" }}>
              <Shield className="w-10 h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-amber-brand)" }}>
                <Lock className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>관리자 인증</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>운영자 전용 관리 패널</p>
          </div>

          {/* 입력 카드 */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                placeholder="관리자 비밀번호"
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                className="h-12 pr-12 text-base"
                autoComplete="current-password"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: "var(--muted-foreground)" }} onClick={() => setShow(v => !v)}>
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: loading ? "var(--muted)" : "linear-gradient(135deg, oklch(0.696 0.17 162.48), oklch(0.55 0.2 270))" }}
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
// API 키 관리
// ─────────────────────────────────────────────────────
const API_SECTIONS = [
  {
    title: "글 생성 AI", icon: Bot, color: "#10b981", gradient: "from-emerald-500/20 to-emerald-500/5",
    fields: [
      { label: "Gemini API Key", key: SETTINGS_KEYS.GEMINI_KEY, placeholder: "AIza...", link: "https://aistudio.google.com/app/apikey", badge: "무료" },
      { label: "Groq API Key", key: SETTINGS_KEYS.GROQ_KEY, placeholder: "gsk_...", link: "https://console.groq.com/keys", badge: "무료" },
      { label: "Claude API Key", key: SETTINGS_KEYS.CLAUDE_KEY, placeholder: "sk-ant-...", link: "https://console.anthropic.com/", badge: "유료" },
      { label: "OpenAI API Key", key: SETTINGS_KEYS.OPENAI_KEY, placeholder: "sk-...", link: "https://platform.openai.com/api-keys", badge: "유료" },
    ],
  },
  {
    title: "발행 플랫폼", icon: Send, color: "#6366f1", gradient: "from-indigo-500/20 to-indigo-500/5",
    fields: [
      { label: "워드프레스 URL", key: SETTINGS_KEYS.WP_URL, placeholder: "https://myblog.com", link: "", badge: "" },
      { label: "워드프레스 사용자명", key: SETTINGS_KEYS.WP_USER, placeholder: "admin", link: "", badge: "" },
      { label: "워드프레스 앱 비밀번호", key: SETTINGS_KEYS.WP_PASS, placeholder: "xxxx xxxx xxxx xxxx", link: "https://wordpress.com/support/application-passwords/", badge: "" },
      { label: "네이버 블로그 ID", key: SETTINGS_KEYS.NAVER_BLOG_ID, placeholder: "myblog", link: "", badge: "" },
      { label: "Webhook URL", key: SETTINGS_KEYS.WEBHOOK_URL, placeholder: "https://...", link: "", badge: "" },
    ],
  },
  {
    title: "수익화", icon: Zap, color: "#f59e0b", gradient: "from-amber-500/20 to-amber-500/5",
    fields: [
      { label: "쿠팡파트너스 Access Key", key: "coupang_access_key", placeholder: "Access Key", link: "https://partners.coupang.com", badge: "" },
      { label: "쿠팡파트너스 Secret Key", key: "coupang_secret_key", placeholder: "Secret Key", link: "https://partners.coupang.com", badge: "" },
    ],
  },
  {
    title: "네이버 검색광고", icon: Globe, color: "#03C75A", gradient: "from-green-500/20 to-green-500/5",
    fields: [
      { label: "API License", key: SETTINGS_KEYS.NAVER_LICENSE, placeholder: "License Key", link: "https://searchad.naver.com", badge: "" },
      { label: "Secret Key", key: SETTINGS_KEYS.NAVER_SECRET, placeholder: "Secret Key", link: "", badge: "" },
      { label: "Customer ID", key: SETTINGS_KEYS.NAVER_CUSTOMER, placeholder: "Customer ID", link: "", badge: "" },
    ],
  },
];

function ApiKeyManager() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    API_SECTIONS.forEach(s => s.fields.forEach(f => { init[f.key] = userGet(f.key); }));
    return init;
  });
  const [showMap, setShowMap] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ "글 생성 AI": true });

  const handleSaveAll = async () => {
    setSaving(true);
    const toSave: Record<string, string> = {};
    Object.entries(values).forEach(([k, v]) => { if (v.trim()) { userSet(k, v.trim()); toSave[k] = v.trim(); } });
    await saveSettingsToServer(toSave);
    setSaving(false);
    toast.success("✅ 전체 저장 완료!");
  };

  return (
    <div className="space-y-3">
      {/* 상단 저장 버튼 */}
      <button
        className="w-full h-12 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{ background: saving ? "var(--muted)" : "linear-gradient(135deg, #10b981, #059669)" }}
        onClick={handleSaveAll} disabled={saving}>
        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "저장 중..." : "전체 저장하기"}
      </button>

      {API_SECTIONS.map(({ title, icon: Icon, color, fields }) => {
        const isOpen = openSections[title] !== false;
        const filledCount = fields.filter(f => values[f.key]?.trim()).length;
        return (
          <div key={title} className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {/* 섹션 헤더 */}
            <button
              className="w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-accent/20"
              onClick={() => setOpenSections(p => ({ ...p, [title]: !isOpen }))}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color }} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm text-foreground">{title}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {filledCount}/{fields.length} 입력됨
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {filledCount === fields.length && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#10b98120", color: "#10b981" }}>완료</span>
                )}
                <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "var(--muted-foreground)", transform: isOpen ? "rotate(180deg)" : "" }} />
              </div>
            </button>

            {/* 섹션 내용 */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="pt-3 space-y-3">
                  {fields.map(({ label, key, placeholder, link, badge }) => {
                    const uid = key + label;
                    const filled = !!values[key]?.trim();
                    return (
                      <div key={uid}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground">{label}</span>
                            {badge && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: badge === "무료" ? "#10b98118" : "#f59e0b18", color: badge === "무료" ? "#10b981" : "#f59e0b" }}>
                                {badge}
                              </span>
                            )}
                          </div>
                          {link && (
                            <a href={link} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#10b981" }}>
                              발급 <ExternalLink className="w-3 h-3" />
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
                            <button className="p-1.5 rounded-lg hover:bg-accent/30 transition-colors"
                              style={{ color: "var(--muted-foreground)" }}
                              onClick={() => setShowMap(p => ({ ...p, [uid]: !p[uid] }))}>
                              {showMap[uid] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {filled && (
                              <button className="p-1.5 rounded-lg hover:bg-accent/30 transition-colors"
                                style={{ color: "var(--muted-foreground)" }}
                                onClick={() => { navigator.clipboard.writeText(values[key]); toast.success("복사됨"); }}>
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {filled && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#10b981" }}>
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

      {/* 하단 저장 버튼 */}
      <button
        className="w-full h-12 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{ background: saving ? "var(--muted)" : "linear-gradient(135deg, #10b981, #059669)" }}
        onClick={handleSaveAll} disabled={saving}>
        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "저장 중..." : "전체 저장하기"}
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
    if (!confirm(`"${name}" 회원을 삭제할까요? 이 작업은 되돌릴 수 없어요.`)) return;
    const d = await adminApi("deleteUser", { targetUserId: userId });
    if (d.ok) { toast.success("삭제 완료"); await load(); }
    else toast.error(d.error || "삭제 실패");
  };

  const formatDate = (s: string) => {
    if (!s) return "-";
    try { return new Date(s).toLocaleDateString("ko-KR", { month: "short", day: "numeric", year: "2-digit" }); } catch { return s; }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">총 {users.length}명</div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>가입 회원 전체 목록</div>
        </div>
        <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all active:scale-95"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          onClick={load}>
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
          {users.map(u => (
            <div key={u.id} className="rounded-2xl p-4 transition-all" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {/* 상단: 이름 + 배지 */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: u.role === "admin" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                    {u.name[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">{u.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{
                          background: u.role === "admin" ? "#f59e0b20" : "#6366f120",
                          color: u.role === "admin" ? "#f59e0b" : "#6366f1",
                        }}>
                        {u.role === "admin" ? "👑 관리자" : "일반"}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>{u.id}</div>
                  </div>
                </div>
              </div>

              {/* 중단: 정보 */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--background)" }}>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>이메일</div>
                  <div className="text-xs font-medium text-foreground truncate mt-0.5">{u.email || "-"}</div>
                </div>
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--background)" }}>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>가입일</div>
                  <div className="text-xs font-medium text-foreground mt-0.5">{formatDate(u.createdAt)}</div>
                </div>
                <div className="rounded-xl px-3 py-2 col-span-2" style={{ background: "var(--background)" }}>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>발행 글</div>
                  <div className="text-xs font-medium text-foreground mt-0.5">{u.postCount}개</div>
                </div>
              </div>

              {/* 하단: 버튼 */}
              <div className="flex gap-2">
                <button
                  className="flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  style={{
                    background: u.role === "admin" ? "#6366f120" : "#f59e0b20",
                    color: u.role === "admin" ? "#6366f1" : "#f59e0b",
                    border: `1px solid ${u.role === "admin" ? "#6366f140" : "#f59e0b40"}`,
                  }}
                  disabled={changing === u.id}
                  onClick={() => changeRole(u.id, u.role === "admin" ? "user" : "admin")}>
                  {changing === u.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                  {u.role === "admin" ? "일반으로 변경" : "관리자 승급"}
                </button>
                <button
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95"
                  style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}
                  onClick={() => deleteUser(u.id, u.name)}>
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 비밀번호 변경 (서버 저장)
// ─────────────────────────────────────────────────────
function PasswordChanger() {
  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [conf, setConf] = useState("");
  const [showCur, setShowCur] = useState(false); const [showNw, setShowNw] = useState(false); const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = nw.length === 0 ? null : nw.length < 4 ? { label: "너무 짧음", color: "#ef4444", score: 1 } : nw.length < 6 ? { label: "약함", color: "#f59e0b", score: 2 } : nw.length < 8 ? { label: "보통", color: "#6366f1", score: 3 } : { label: "강함", color: "#10b981", score: 4 };

  const handle = async () => {
    if (!cur) { toast.error("현재 비밀번호를 입력해주세요"); return; }
    if (!nw || nw.length < 4) { toast.error("새 비밀번호는 4자 이상이어야 해요"); return; }
    if (nw !== conf) { toast.error("새 비밀번호가 일치하지 않아요"); return; }
    if (nw === cur) { toast.error("현재 비밀번호와 동일해요"); return; }
    setLoading(true);
    const d = await adminApi("changeAdminPassword", { currentPassword: cur, newPassword: nw });
    if (d.ok) {
      toast.success("✅ 비밀번호 변경 완료! 서버에 저장되어 배포해도 유지돼요.");
      setCur(""); setNw(""); setConf("");
      // 세션 갱신을 위해 재로그인
      setTimeout(() => { sessionStorage.removeItem(SESSION_KEY); window.location.reload(); }, 1500);
    } else {
      toast.error(d.error || "변경 실패");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#10b98120" }}>
          <Key className="w-5 h-5" style={{ color: "#10b981" }} />
        </div>
        <div>
          <div className="font-semibold text-foreground">비밀번호 변경</div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>변경 후 서버에 저장 → 배포해도 유지</div>
        </div>
      </div>

      {[
        { label: "현재 비밀번호", val: cur, set: setCur, show: showCur, setShow: setShowCur },
        { label: "새 비밀번호", val: nw, set: setNw, show: showNw, setShow: setShowNw },
        { label: "새 비밀번호 확인", val: conf, set: setConf, show: showConf, setShow: setShowConf },
      ].map(({ label, val, set, show, setShow }) => (
        <div key={label}>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>{label}</label>
          <div className="relative">
            <Input type={show ? "text" : "password"} placeholder={label} value={val}
              onChange={e => set(e.target.value)} className="pr-10 h-11" autoComplete="new-password" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} onClick={() => setShow((v: boolean) => !v)}>
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {label === "새 비밀번호" && strength && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">{[1,2,3,4].map(i => <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= strength.score ? strength.color : "var(--border)" }} />)}</div>
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
        style={{ background: loading ? "var(--muted)" : "linear-gradient(135deg, #10b981, #059669)" }}
        onClick={handle} disabled={loading}>
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
        {loading ? "변경 중..." : "비밀번호 변경"}
      </button>
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
  const siteRef = useRef<HTMLInputElement>(null);
  const postRef = useRef<HTMLInputElement>(null);

  const uploadSite = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 가능합니다"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB 이하만 가능합니다"); return; }
    const b64 = await toBase64(file);
    const u = { ...og, siteImage: b64 }; setOg(u); saveOG(u);
    toast.success("OG 이미지 설정 완료!");
  };

  const save = () => {
    saveOG(og);
    const setMeta = (prop: string, val: string) => { let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement; if (!el) { el = document.createElement("meta"); el.setAttribute("property", prop); document.head.appendChild(el); } el.setAttribute("content", val); };
    setMeta("og:title", og.siteTitle); setMeta("og:description", og.siteDesc); setMeta("og:site_name", og.siteName);
    if (og.siteImage) setMeta("og:image", og.siteImage.startsWith("data:") ? `${window.location.origin}/og-image.jpg` : og.siteImage);
    document.title = og.siteTitle;
    toast.success("✅ OG 설정 저장 완료!");
  };

  const code = `<meta property="og:title" content="${og.siteTitle}" />
<meta property="og:description" content="${og.siteDesc}" />
<meta property="og:site_name" content="${og.siteName}" />
<meta property="og:image" content="https://YOUR_DOMAIN/og-image.jpg" />
<meta name="twitter:card" content="${og.twitterCard}" />`;

  return (
    <div className="space-y-4">
      {/* 앱 OG */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-4 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Globe className="w-4.5 h-4.5" style={{ color: "#6366f1" }} />
          <div>
            <div className="font-semibold text-sm text-foreground">앱 전체 OG 이미지</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>카카오톡/SNS 공유 시 표시</div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {/* 이미지 업로드 */}
          {og.siteImage ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "1200/630", maxHeight: 180 }}>
              <img src={og.siteImage} alt="OG" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                <button className="px-3 py-2 rounded-lg text-xs text-white font-medium" style={{ background: "rgba(255,255,255,0.2)" }} onClick={() => siteRef.current?.click()}><Upload className="w-3.5 h-3.5 inline mr-1" />변경</button>
                <button className="px-3 py-2 rounded-lg text-xs text-white font-medium" style={{ background: "rgba(239,68,68,0.7)" }} onClick={() => { const u = { ...og, siteImage: "" }; setOg(u); saveOG(u); }}><X className="w-3.5 h-3.5 inline mr-1" />삭제</button>
              </div>
            </div>
          ) : (
            <button className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-all"
              style={{ border: `2px dashed ${drag ? "#10b981" : "var(--border)"}`, background: drag ? "#10b98108" : "var(--background)", aspectRatio: "1200/630", maxHeight: 160 }}
              onClick={() => siteRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={async e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) await uploadSite(f); }}>
              <Upload className="w-8 h-8 opacity-30" style={{ color: "var(--muted-foreground)" }} />
              <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>1200×630 권장 · 최대 5MB</span>
            </button>
          )}
          <input ref={siteRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await uploadSite(f); e.target.value = ""; }} />

          {/* 텍스트 */}
          <div className="space-y-3">
            <div><label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>사이트 제목</label><Input value={og.siteTitle} onChange={e => setOg(p => ({ ...p, siteTitle: e.target.value }))} className="h-11 text-sm" /></div>
            <div><label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>사이트명</label><Input value={og.siteName} onChange={e => setOg(p => ({ ...p, siteName: e.target.value }))} className="h-11 text-sm" /></div>
            <div><label className="text-xs font-medium mb-1 block" style={{ color: "var(--muted-foreground)" }}>설명</label><Textarea value={og.siteDesc} onChange={e => setOg(p => ({ ...p, siteDesc: e.target.value }))} className="text-sm resize-none min-h-[80px]" /></div>
          </div>
          <button className="w-full h-11 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }} onClick={save}>
            <CheckCircle2 className="w-4 h-4" /> OG 설정 저장
          </button>

          {/* 코드 */}
          <div className="rounded-xl p-3" style={{ background: "oklch(0.12 0.005 285)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#10b981" }}>index.html 코드</span>
              <button className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
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
          <div className="flex items-center gap-2">
            <Link className="w-4.5 h-4.5" style={{ color: "#a78bfa" }} />
            <div>
              <div className="font-semibold text-sm text-foreground">글별 OG 이미지</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{og.postImages.length}개 등록</div>
            </div>
          </div>
          <button className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }} onClick={() => setShowAdd(v => !v)}>
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
              <button className="w-full rounded-xl flex items-center justify-center gap-2 py-5 transition-all"
                style={{ border: "2px dashed var(--border)", background: "var(--card)" }}
                onClick={() => postRef.current?.click()}>
                <Upload className="w-5 h-5 opacity-30" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>이미지 업로드</span>
              </button>
            )}
            <input ref={postRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { const b64 = await toBase64(f); setNewPost(p => ({ ...p, image: b64 })); } e.target.value = ""; }} />
            <div className="flex gap-2">
              <button className="flex-1 h-11 rounded-xl font-semibold text-white text-sm transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}
                onClick={() => {
                  if (!newPost.title.trim()) { toast.error("글 제목을 입력해주세요"); return; }
                  if (!newPost.image) { toast.error("OG 이미지를 업로드해주세요"); return; }
                  const u = { ...og, postImages: [...og.postImages, { id: Date.now().toString(), ...newPost }] };
                  setOg(u); saveOG(u); setNewPost({ title: "", url: "", image: "" }); setShowAdd(false);
                  toast.success("추가됐어요!");
                }}>추가</button>
              <button className="px-4 h-11 rounded-xl text-sm font-medium transition-all" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }} onClick={() => { setShowAdd(false); setNewPost({ title: "", url: "", image: "" }); }}>취소</button>
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
                <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: "#ef4444" }}
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
// 관리자 대시보드
// ─────────────────────────────────────────────────────
const TABS = [
  { id: "apikeys", label: "API 키", icon: Key, color: "#10b981" },
  { id: "users", label: "회원 관리", icon: Users, color: "#6366f1" },
  { id: "security", label: "보안", icon: Shield, color: "#f59e0b" },
  { id: "og", label: "OG 이미지", icon: Image, color: "#a78bfa" },
] as const;

type TabId = typeof TABS[number]["id"];

function AdminDashboard() {
  const [tab, setTab] = useState<TabId>("apikeys");

  const handleLogout = () => { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem("ba_token"); localStorage.removeItem("ba_user"); window.location.reload(); };

  return (
    <Layout>
      <div className="pb-28">
        {/* 헤더 */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, oklch(0.696 0.17 162.48), oklch(0.55 0.2 270))" }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>운영자 패널</h1>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>BlogAuto Pro 관리자</p>
              </div>
            </div>
            <button className="text-xs px-3 py-2 rounded-xl font-medium transition-all active:scale-95"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }} onClick={handleLogout}>
              잠금
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="px-4 space-y-4">
          {tab === "apikeys" && <ApiKeyManager />}
          {tab === "users" && <UserManager />}
          {tab === "security" && (
            <div className="space-y-4">
              <PasswordChanger />
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4" style={{ color: "#6366f1" }} />
                  <span className="font-semibold text-sm text-foreground">시스템 현황</span>
                </div>
                {[
                  { label: "CPU", value: 34, color: "#10b981", icon: Cpu },
                  { label: "메모리", value: 67, color: "#f59e0b", icon: HardDrive },
                  { label: "API 호출", value: 78, color: "#6366f1", icon: Wifi },
                  { label: "디스크", value: 45, color: "#a78bfa", icon: Database },
                ].map(m => (
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
          )}
          {tab === "og" && <OGManager />}
        </div>
      </div>

      {/* 하단 탭바 (모바일 최적화) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-safe"
        style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center py-2 gap-1">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all active:scale-95"
                style={{ background: active ? `${t.color}18` : "transparent" }}
                onClick={() => setTab(t.id)}>
                <t.icon className="w-5 h-5" style={{ color: active ? t.color : "var(--muted-foreground)" }} />
                <span className="text-[10px] font-medium" style={{ color: active ? t.color : "var(--muted-foreground)" }}>
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
