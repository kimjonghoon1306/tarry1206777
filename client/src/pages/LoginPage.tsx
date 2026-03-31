import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login, loading } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async () => {
    if (!userId.trim() || !password) return;
    const ok = await login(userId.trim(), password);
    if (ok) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:"var(--background)"}}>
      <div className="w-full max-w-sm space-y-6">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{background:"linear-gradient(135deg,var(--color-emerald),oklch(0.769 0.188 70.08))"}}>
            <Bot className="w-9 h-9 text-white"/>
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{fontFamily:"'Space Grotesk',sans-serif"}}>BlogAuto Pro</h1>
          <p className="text-sm" style={{color:"var(--muted-foreground)"}}>블로그 자동화 플랫폼</p>
        </div>

        {/* 로그인 폼 */}
        <div className="rounded-2xl p-6 space-y-4" style={{background:"var(--card)",border:"1px solid var(--border)"}}>
          <h2 className="text-lg font-semibold text-foreground text-center">로그인</h2>
          <div className="space-y-3">
            <Input
              placeholder="아이디"
              value={userId}
              onChange={e=>setUserId(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              className="h-12 text-base"
            />
            <div className="relative">
              <Input
                type={showPw?"text":"password"}
                placeholder="비밀번호"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                className="h-12 text-base pr-12"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{color:"var(--muted-foreground)"}}
                onClick={()=>setShowPw(v=>!v)}>
                {showPw?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}
              </button>
            </div>
          </div>
          <Button className="w-full h-12 text-base font-semibold"
            style={{background:"var(--color-emerald)",color:"white"}}
            onClick={handleLogin} disabled={loading||!userId||!password}>
            {loading?"로그인 중...":"로그인"}
          </Button>
        </div>

        {/* 회원가입 링크 */}
        <p className="text-center text-sm" style={{color:"var(--muted-foreground)"}}>
          계정이 없으신가요?{" "}
          <button className="font-semibold" style={{color:"var(--color-emerald)"}}
            onClick={()=>navigate("/signup")}>
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
}
