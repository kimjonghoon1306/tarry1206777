/**
 * BlogAuto Pro - Super Admin Page
 * 운영자 전용 관리 페이지 (비밀번호 보호)
 * 시스템 현황, API 관리, 자동화 규칙, 로그, 비밀번호 변경
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Shield,
  Key,
  Activity,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Lock,
  Zap,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

// ── 비밀번호 저장/검증 헬퍼 ──────────────────────────
const PW_STORAGE_KEY = "bap_admin_pw";
const DEFAULT_PW_HASH = "MTIzNDU2"; // btoa("123456")

function getStoredHash(): string {
  return localStorage.getItem(PW_STORAGE_KEY) || DEFAULT_PW_HASH;
}

function setStoredHash(hash: string) {
  localStorage.setItem(PW_STORAGE_KEY, hash);
}

function verifyAdmin(input: string): boolean {
  try {
    return btoa(input) === getStoredHash();
  } catch {
    return false;
  }
}

const SESSION_KEY = "bap_admin_auth";

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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div
        className={`w-full max-w-sm rounded-2xl p-8 ${shake ? "animate-bounce" : ""}`}
        style={{ background: "var(--card)", border: "2px solid var(--border)" }}
      >
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "oklch(0.696 0.17 162.48 / 15%)", border: "1px solid oklch(0.696 0.17 162.48 / 30%)" }}
          >
            <Lock className="w-8 h-8" style={{ color: "var(--color-emerald)" }} />
          </div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            관리자 인증
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            운영자 전용 영역입니다
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              placeholder="비밀번호 입력"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="pr-10"
              autoComplete="new-password"
              name="bap-admin-secret"
              data-form-type="other"
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShow(v => !v)}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            className="w-full gap-2"
            style={{ background: "var(--color-emerald)", color: "white" }}
            onClick={handleSubmit}
          >
            <Shield className="w-4 h-4" />
            접속하기
          </Button>
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
    if (newPw === currentPw) { toast.error("현재 비밀번호와 동일합니다. 다른 비밀번호를 설정해주세요"); return; }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const newHash = btoa(newPw);
        setStoredHash(newHash);
        // 세션도 새 해시로 갱신 (로그아웃 방지)
        sessionStorage.setItem(SESSION_KEY, newHash);
        toast.success("✅ 비밀번호가 변경되었습니다!");
        onClose();
      } catch {
        toast.error("비밀번호 변경 중 오류가 발생했습니다");
      } finally {
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 mx-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.696 0.17 162.48/15%)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
            <Key className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
          </div>
          <div>
            <h2 className="font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>비밀번호 변경</h2>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>관리자 비밀번호를 새로 설정합니다</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
              현재 비밀번호
            </label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="현재 비밀번호 입력"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="pr-10"
                autoComplete="current-password"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                onClick={() => setShowCurrent(v => !v)}>
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
              새 비밀번호
            </label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="새 비밀번호 입력 (4자 이상)"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="pr-10"
                autoComplete="new-password"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                onClick={() => setShowNew(v => !v)}>
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* 비밀번호 강도 표시 */}
            {newPw.length > 0 && (
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
          </div>

          {/* 새 비밀번호 확인 */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
              새 비밀번호 확인
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="새 비밀번호 다시 입력"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleChange()}
                className={`pr-10 ${confirmPw && newPw !== confirmPw ? "border-red-400/60" : confirmPw && newPw === confirmPw ? "border-emerald-400/60" : ""}`}
                autoComplete="new-password"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* 일치 여부 표시 */}
            {confirmPw.length > 0 && (
              <p className="text-xs mt-1 flex items-center gap-1"
                style={{ color: newPw === confirmPw ? "var(--color-emerald)" : "oklch(0.65 0.22 25)" }}>
                {newPw === confirmPw
                  ? <><CheckCircle2 className="w-3 h-3" /> 비밀번호가 일치합니다</>
                  : "⚠ 비밀번호가 일치하지 않습니다"}
              </p>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button className="flex-1 gap-2"
            style={{ background: isLoading ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
            onClick={handleChange}
            disabled={isLoading}>
            {isLoading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> 변경 중...</>
              : <><Key className="w-4 h-4" /> 비밀번호 변경</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 관리자 대시보드 ─────────────────────────────────
function AdminDashboard() {
  const [showKeys, setShowKeys] = useState<number[]>([]);
  const [apiKeys, setApiKeys] = useState(API_KEYS_DEFAULT);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" style={{ color: "var(--color-emerald)" }} />
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                운영자 관리 패널
              </h1>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              시스템 설정, API 관리, 자동화 규칙
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
              style={{ background: "oklch(0.696 0.17 162.48 / 10%)", border: "1px solid oklch(0.696 0.17 162.48 / 20%)", color: "var(--color-emerald)" }}
            >
              <Shield className="w-4 h-4" />
              운영자
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowPasswordModal(true)}>
              <Key className="w-4 h-4" /> 비밀번호 변경
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              잠금
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "CPU 사용률", value: 34, icon: Cpu, color: "var(--color-emerald)" },
            { label: "메모리", value: 67, icon: HardDrive, color: "var(--color-amber-brand)" },
            { label: "API 호출", value: 78, icon: Wifi, color: "oklch(0.6 0.15 220)" },
            { label: "디스크", value: 45, icon: Database, color: "oklch(0.75 0.12 300)" },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{metric.label}</span>
                <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
              </div>
              <div className="text-2xl font-black mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: metric.color }}>
                {metric.value}%
              </div>
              <Progress value={metric.value} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* ── 보안 설정 카드 ── */}
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
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                현재 비밀번호를 새로운 비밀번호로 변경합니다
              </p>
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
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm text-foreground">{apiKey.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{apiKey.service}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: apiKey.active ? "oklch(0.696 0.17 162.48 / 15%)" : "var(--muted)",
                        color: apiKey.active ? "var(--color-emerald)" : "var(--muted-foreground)",
                      }}>
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
                      <span style={{ color: apiKey.usage > 80 ? "var(--color-amber-brand)" : "var(--color-emerald)" }}>
                        {apiKey.usage}%
                      </span>
                    </div>
                    <Progress value={apiKey.usage} className="h-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Automation Rules */}
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
            ].map((rule) => (
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

        {/* System Logs */}
        <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: "oklch(0.6 0.15 220)" }} />
              <h3 className="font-semibold text-foreground">시스템 로그</h3>
            </div>
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
              onClick={() => toast.info("로그 새로고침")}>
              <RefreshCw className="w-3.5 h-3.5" /> 새로고침
            </Button>
          </div>
          <div className="p-4 font-mono text-xs space-y-2 max-h-64 overflow-y-auto"
            style={{ background: "oklch(0.12 0.005 285.823)" }}>
            {SYSTEM_LOGS.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span style={{ color: "var(--muted-foreground)" }}>{log.time}</span>
                <span className="uppercase font-bold w-16 flex-shrink-0" style={{ color: LOG_COLORS[log.level] }}>
                  [{log.level}]
                </span>
                <span style={{ color: "oklch(0.8 0.005 65)" }}>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}
    </Layout>
  );
}

// ─── 메인 컴포넌트 (게이트 + 대시보드) ─────────────
export default function SuperAdminPage() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === getStoredHash()
  );

  if (!authed) {
    return <AdminGate onAuth={() => setAuthed(true)} />;
  }

  return <AdminDashboard />;
}
