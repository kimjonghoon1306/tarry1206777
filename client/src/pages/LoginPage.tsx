// BlogAuto Pro - LoginPage v1.0
import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bot, Sun, Moon, Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";
import { applyServerSettings } from "@/lib/user-storage";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

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
      // ✅ platform_custom_list 별도 복원
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

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {/* 헤더 */}
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

            {/* 입력 필드 */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    className="pl-10 pr-10 h-12"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted-foreground)" }}
                    onClick={() => setShowPw(p => !p)}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-12 text-base font-bold gap-2 mt-2"
                style={{ background: loading ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "로그인 중..." : <>로그인 <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </div>

            {/* 회원가입 링크 */}
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                계정이 없으신가요?{" "}
                <button
                  className="font-semibold hover:underline"
                  style={{ color: "var(--color-emerald)" }}
                  onClick={() => navigate("/signup")}
                >
                  회원가입
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

