// BlogAuto Pro - LoginPage v2.0
import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bot, Sun, Moon, Eye, EyeOff, ArrowRight, Lock, Mail, User, Copy, CheckCircle2 } from "lucide-react";
import { applyServerSettings } from "@/lib/user-storage";

type Mode = "login" | "find-id" | "reset-password";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // 로그인
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // 탭 모드
  const [mode, setMode] = useState<Mode>("login");

  // 아이디 찾기
  const [findEmail, setFindEmail] = useState("");
  const [foundId, setFoundId] = useState("");
  const [findLoading, setFindLoading] = useState(false);

  // 비밀번호 찾기
  const [resetId, setResetId] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [tempPw, setTempPw] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: email.trim(), password }),
      });
      const data = await resp.json();
      if (!data.ok) {
        toast.error(data.error || "로그인에 실패했습니다");
        setLoading(false);
        return;
      }
      localStorage.setItem("ba_token", data.token);
      localStorage.setItem("ba_user", JSON.stringify(data.user));
      await applyServerSettings();
      const settings = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ action: "loadSettings" }),
      }).then(r => r.json()).catch(() => ({}));
      if (settings.ok && settings.settings?.platform_custom_list) {
        localStorage.setItem("platform_custom_list", settings.settings.platform_custom_list);
      }
      toast.success(`환영합니다, ${data.user?.name || data.user?.email}!`);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/dashboard";
      navigate(redirect);
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    }
    setLoading(false);
  };

  const handleFindId = async () => {
    if (!findEmail.trim()) {
      toast.error("가입하실 때 사용한 이메일 주소를 입력해주세요");
      return;
    }
    setFindLoading(true);
    try {
      const resp = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find-id", email: findEmail.trim() }),
      });
      const data = await resp.json();
      if (!data.ok) {
        toast.error("해당 이메일로 가입된 계정을 찾을 수 없어요. 이메일 주소를 다시 확인해주세요.");
        return;
      }
      setFoundId(data.userId);
    } catch {
      toast.error("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    setFindLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetId.trim()) {
      toast.error("아이디를 입력해주세요");
      return;
    }
    if (!resetEmail.trim()) {
      toast.error("가입하실 때 사용한 이메일 주소를 입력해주세요");
      return;
    }
    setResetLoading(true);
    try {
      const resp = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", userId: resetId.trim(), email: resetEmail.trim() }),
      });
      const data = await resp.json();
      if (!data.ok) {
        toast.error("아이디 또는 이메일 정보가 올바르지 않아요. 다시 확인해주세요.");
        return;
      }
      setTempPw(data.tempPw);
    } catch {
      toast.error("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
    setResetLoading(false);
  };

  const copyTempPw = () => {
    navigator.clipboard.writeText(tempPw);
    setCopied(true);
    toast.success("임시 비밀번호가 복사됐어요!");
    setTimeout(() => setCopied(false), 3000);
  };

  const resetMode = (m: Mode) => {
    setMode(m);
    setFoundId("");
    setTempPw("");
    setCopied(false);
    setFindEmail("");
    setResetId("");
    setResetEmail("");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 h-16 border-b" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => navigate("/home")} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-emerald), var(--color-amber-brand))" }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            BlogAuto <span style={{ color: "var(--color-emerald)" }}>Pro</span>
          </span>
        </button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-9 h-9">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>

            {/* ── 로그인 ── */}
            {mode === "login" && (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "linear-gradient(135deg, var(--color-emerald), var(--color-amber-brand))" }}>
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-foreground mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    로그인
                  </h1>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    BlogAuto Pro에 오신 것을 환영합니다
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">이메일</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                      <Input type="email" placeholder="가입하신 이메일 주소를 입력하세요"
                        value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleLogin()}
                        className="pl-10 h-12" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">비밀번호</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                      <Input type={showPw ? "text" : "password"} placeholder="비밀번호를 입력하세요"
                        value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleLogin()}
                        className="pl-10 pr-10 h-12" />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--muted-foreground)" }}
                        onClick={() => setShowPw(p => !p)}>
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button className="w-full h-12 text-base font-bold gap-2 mt-2"
                    style={{ background: loading ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
                    onClick={handleLogin} disabled={loading}>
                    {loading ? "로그인 중..." : <>로그인 <ArrowRight className="w-4 h-4" /></>}
                  </Button>
                </div>

                {/* 아이디/비번 찾기 링크 */}
                <div className="mt-5 flex items-center justify-center gap-4">
                  <button className="text-sm hover:underline" style={{ color: "var(--muted-foreground)" }}
                    onClick={() => resetMode("find-id")}>
                    아이디 찾기
                  </button>
                  <span style={{ color: "var(--border)" }}>|</span>
                  <button className="text-sm hover:underline" style={{ color: "var(--muted-foreground)" }}
                    onClick={() => resetMode("reset-password")}>
                    비밀번호 찾기
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    계정이 없으신가요?{" "}
                    <button className="font-semibold hover:underline"
                      style={{ color: "var(--color-emerald)" }}
                      onClick={() => navigate("/signup")}>
                      회원가입
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* ── 아이디 찾기 ── */}
            {mode === "find-id" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-foreground mb-1">아이디 찾기</h1>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    가입하실 때 사용한 이메일 주소로 아이디를 찾을 수 있어요
                  </p>
                </div>

                {!foundId ? (
                  <div className="space-y-4">
                    {/* 안내 박스 */}
                    <div className="rounded-xl p-4 text-sm" style={{ background: "oklch(0.6 0.15 220/10%)", border: "1px solid oklch(0.6 0.15 220/30%)" }}>
                      <p className="font-semibold mb-1" style={{ color: "oklch(0.6 0.15 220)" }}>📧 이메일로 아이디 찾기</p>
                      <p style={{ color: "var(--muted-foreground)" }}>
                        회원가입 시 입력하셨던 이메일 주소를 아래에 입력해주시면 가입된 아이디를 알려드려요.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">이메일 주소</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                        <Input type="email" placeholder="가입하신 이메일 주소 입력"
                          value={findEmail} onChange={e => setFindEmail(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleFindId()}
                          className="pl-10 h-12" />
                      </div>
                    </div>

                    <Button className="w-full h-12 text-base font-bold"
                      style={{ background: findLoading ? "var(--muted)" : "#6366f1", color: "white" }}
                      onClick={handleFindId} disabled={findLoading}>
                      {findLoading ? "찾는 중..." : "아이디 찾기"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 결과 박스 */}
                    <div className="rounded-xl p-5 text-center" style={{ background: "oklch(0.696 0.17 162.48/10%)", border: "2px solid oklch(0.696 0.17 162.48/40%)" }}>
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-emerald)" }} />
                      <p className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>회원님의 아이디는</p>
                      <p className="text-2xl font-black text-foreground mb-2">{foundId}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        보안을 위해 일부 글자는 *로 표시됩니다
                      </p>
                    </div>
                    <p className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
                      아이디를 확인하셨나요? 이제 로그인 해보세요 😊
                    </p>
                    <Button className="w-full h-12 text-base font-bold"
                      style={{ background: "var(--color-emerald)", color: "white" }}
                      onClick={() => resetMode("login")}>
                      로그인 하러 가기
                    </Button>
                  </div>
                )}

                <div className="mt-5 text-center">
                  <button className="text-sm hover:underline" style={{ color: "var(--muted-foreground)" }}
                    onClick={() => resetMode("login")}>
                    ← 로그인으로 돌아가기
                  </button>
                </div>
              </>
            )}

            {/* ── 비밀번호 찾기 ── */}
            {mode === "reset-password" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-black text-foreground mb-1">비밀번호 찾기</h1>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    아이디와 이메일로 임시 비밀번호를 발급받을 수 있어요
                  </p>
                </div>

                {!tempPw ? (
                  <div className="space-y-4">
                    {/* 안내 박스 */}
                    <div className="rounded-xl p-4 text-sm" style={{ background: "oklch(0.769 0.188 70.08/10%)", border: "1px solid oklch(0.769 0.188 70.08/30%)" }}>
                      <p className="font-semibold mb-1" style={{ color: "var(--color-amber-brand)" }}>🔐 임시 비밀번호 발급 안내</p>
                      <p style={{ color: "var(--muted-foreground)" }}>
                        가입하신 아이디와 이메일 주소를 입력하시면 임시 비밀번호를 발급해드려요.
                        로그인 후 마이페이지에서 비밀번호를 꼭 변경해주세요!
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">아이디</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                        <Input type="text" placeholder="가입하신 아이디를 입력하세요"
                          value={resetId} onChange={e => setResetId(e.target.value)}
                          className="pl-10 h-12" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">이메일 주소</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                        <Input type="email" placeholder="가입하신 이메일 주소를 입력하세요"
                          value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleResetPassword()}
                          className="pl-10 h-12" />
                      </div>
                    </div>

                    <Button className="w-full h-12 text-base font-bold"
                      style={{ background: resetLoading ? "var(--muted)" : "#f59e0b", color: "white" }}
                      onClick={handleResetPassword} disabled={resetLoading}>
                      {resetLoading ? "확인 중..." : "임시 비밀번호 발급받기"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 임시 비밀번호 결과 */}
                    <div className="rounded-xl p-5" style={{ background: "oklch(0.769 0.188 70.08/10%)", border: "2px solid oklch(0.769 0.188 70.08/40%)" }}>
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-amber-brand)" }} />
                      <p className="text-sm text-center mb-3" style={{ color: "var(--muted-foreground)" }}>임시 비밀번호가 발급됐어요!</p>
                      <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                        <span className="flex-1 text-xl font-black text-center text-foreground tracking-widest">{tempPw}</span>
                        <button onClick={copyTempPw} className="shrink-0 p-2 rounded-lg transition-colors hover:bg-accent/20">
                          {copied
                            ? <CheckCircle2 className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
                            : <Copy className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />}
                        </button>
                      </div>
                    </div>

                    {/* 중요 안내 */}
                    <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: "oklch(0.65 0.22 25/10%)", border: "1px solid oklch(0.65 0.22 25/30%)" }}>
                      <p className="font-semibold" style={{ color: "oklch(0.65 0.22 25)" }}>⚠️ 꼭 읽어주세요!</p>
                      <p style={{ color: "var(--muted-foreground)" }}>① 위의 임시 비밀번호를 복사하거나 메모해두세요</p>
                      <p style={{ color: "var(--muted-foreground)" }}>② 임시 비밀번호로 로그인 후 마이페이지에서 새 비밀번호로 변경해주세요</p>
                      <p style={{ color: "var(--muted-foreground)" }}>③ 비밀번호는 영문 대소문자와 숫자를 포함해서 6자 이상으로 만들어주세요</p>
                    </div>

                    <Button className="w-full h-12 text-base font-bold"
                      style={{ background: "var(--color-emerald)", color: "white" }}
                      onClick={() => resetMode("login")}>
                      로그인 하러 가기
                    </Button>
                  </div>
                )}

                <div className="mt-5 text-center">
                  <button className="text-sm hover:underline" style={{ color: "var(--muted-foreground)" }}
                    onClick={() => resetMode("login")}>
                    ← 로그인으로 돌아가기
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
