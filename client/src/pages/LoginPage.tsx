import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Eye, EyeOff, ArrowLeft, Mail, KeyRound, X } from "lucide-react";
import { toast } from "sonner";

// ── 아이디 찾기 모달 ─────────────────────────────
function FindIdModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFind = async () => {
    if (!email.trim()) { toast.error("이메일을 입력해주세요"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find-id", email: email.trim() }),
      });
      const d = await r.json();
      if (!d.ok) { toast.error(d.error || "이메일을 찾을 수 없어요"); return; }
      setResult(d.userId);
    } catch { toast.error("네트워크 오류"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-bold text-foreground">아이디 찾기</h3>
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X className="w-5 h-5" /></button>
        </div>
        {!result ? (
          <>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              가입 시 등록한 이메일을 입력하면 아이디를 알려드려요.
            </p>
            <Input placeholder="이메일 입력" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleFind()}
              className="h-12 text-base" />
            <Button className="w-full h-12 text-base font-semibold"
              style={{ background: "var(--color-emerald)", color: "white" }}
              onClick={handleFind} disabled={loading}>
              {loading ? "확인 중..." : "아이디 찾기"}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-4 text-center"
              style={{ background: "oklch(0.696 0.17 162.48/10%)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>회원님의 아이디</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-emerald)" }}>{result}</p>
            </div>
            <Button className="w-full h-12 text-base" variant="outline" onClick={onClose}>
              로그인 화면으로
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 비밀번호 찾기 모달 ───────────────────────────
function FindPwModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"input" | "sent">("input");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!userId.trim() || !email.trim()) { toast.error("아이디와 이메일을 모두 입력해주세요"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", userId: userId.trim(), email: email.trim() }),
      });
      const d = await r.json();
      if (!d.ok) { toast.error(d.error || "정보를 찾을 수 없어요"); return; }
      setStep("sent");
    } catch { toast.error("네트워크 오류"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
            <h3 className="font-bold text-foreground">비밀번호 찾기</h3>
          </div>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}><X className="w-5 h-5" /></button>
        </div>
        {step === "input" ? (
          <>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              아이디와 이메일을 입력하면 임시 비밀번호를 이메일로 보내드려요.
            </p>
            <Input placeholder="아이디" value={userId} onChange={e => setUserId(e.target.value)} className="h-12 text-base" />
            <Input placeholder="이메일" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className="h-12 text-base" />
            <Button className="w-full h-12 text-base font-semibold"
              style={{ background: "var(--color-amber-brand)", color: "white" }}
              onClick={handleSend} disabled={loading}>
              {loading ? "전송 중..." : "임시 비밀번호 전송"}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-4 text-center space-y-2"
              style={{ background: "oklch(0.769 0.188 70.08/10%)", border: "1px solid oklch(0.769 0.188 70.08/30%)" }}>
              <Mail className="w-8 h-8 mx-auto" style={{ color: "var(--color-amber-brand)" }} />
              <p className="text-sm font-semibold text-foreground">임시 비밀번호를 전송했어요!</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {email} 로 임시 비밀번호를 보냈어요.<br />
                로그인 후 반드시 비밀번호를 변경해주세요.
              </p>
            </div>
            <Button className="w-full h-12 text-base" variant="outline" onClick={onClose}>
              로그인 화면으로
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 메인 로그인 페이지 ───────────────────────────
export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login, loading } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [modal, setModal] = useState<null | "findId" | "findPw">(null);

  const handleLogin = async () => {
    if (!userId.trim() || !password) return;
    const ok = await login(userId.trim(), password);
    if (ok) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "var(--background)" }}>

      {/* 홈으로 돌아가기 */}
      <div className="w-full max-w-sm mb-4">
        <button onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}>
          <ArrowLeft className="w-4 h-4" /> 홈으로 돌아가기
        </button>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,var(--color-emerald),oklch(0.769 0.188 70.08))" }}>
            <Bot className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            BlogAuto Pro
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>블로그 자동화 플랫폼</p>
        </div>

        {/* 로그인 폼 */}
        <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-semibold text-foreground text-center">로그인</h2>
          <div className="space-y-3">
            <Input placeholder="아이디" value={userId}
              onChange={e => setUserId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              className="h-12 text-base" />
            <div className="relative">
              <Input type={showPw ? "text" : "password"} placeholder="비밀번호"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="h-12 text-base pr-12" />
              <button className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
                onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 아이디/비밀번호 찾기 */}
          <div className="flex justify-end gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <button onClick={() => setModal("findId")} className="hover:underline">아이디 찾기</button>
            <span>|</span>
            <button onClick={() => setModal("findPw")} className="hover:underline">비밀번호 찾기</button>
          </div>

          <Button className="w-full h-12 text-base font-semibold"
            style={{ background: "var(--color-emerald)", color: "white" }}
            onClick={handleLogin} disabled={loading || !userId || !password}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </div>

        <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          계정이 없으신가요?{" "}
          <button className="font-semibold" style={{ color: "var(--color-emerald)" }}
            onClick={() => navigate("/signup")}>회원가입</button>
        </p>
      </div>

      {modal === "findId" && <FindIdModal onClose={() => setModal(null)} />}
      {modal === "findPw" && <FindPwModal onClose={() => setModal(null)} />}
    </div>
  );
}
