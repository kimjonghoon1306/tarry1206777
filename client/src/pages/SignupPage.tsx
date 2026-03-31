import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

function Rule({ ok, text }: { ok:boolean; text:string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" style={{color:"var(--color-emerald)"}}/> : <XCircle className="w-3.5 h-3.5" style={{color:"var(--muted-foreground)"}}/>}
      <span style={{color: ok?"var(--color-emerald)":"var(--muted-foreground)"}}>{text}</span>
    </div>
  );
}

export default function SignupPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name:"", userId:"", email:"", password:"", confirm:"" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  const pw = form.password;
  const pwRules = {
    length: pw.length >= 6,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
  };
  const pwOk = Object.values(pwRules).every(Boolean);

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.name.trim()) e.name = "이름을 입력해주세요";
    if (!form.userId.trim()) e.userId = "아이디를 입력해주세요";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "올바른 이메일 형식이 아니에요";
    if (!pwOk) e.password = "비밀번호 조건을 확인해주세요";
    if (form.password !== form.confirm) e.confirm = "비밀번호가 일치하지 않아요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev=>({...prev,[k]:e.target.value}));
    setErrors(prev=>({...prev,[k]:""}));
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ action:"signup", name:form.name, userId:form.userId, email:form.email, password:form.password }),
      });
      const d = await r.json();
      if (!d.ok) { toast.error(d.error); return; }
      localStorage.setItem("ba_user", JSON.stringify(d.user));
      localStorage.setItem("ba_token", d.token);
      toast.success("가입 완료! 환영해요 🎉");
      navigate("/dashboard");
    } catch { toast.error("네트워크 오류"); }
    finally { setLoading(false); }
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
          <h1 className="text-2xl font-bold text-foreground" style={{fontFamily:"'Space Grotesk',sans-serif"}}>회원가입</h1>
        </div>

        {/* 가이드라인 */}
        <div className="rounded-xl p-4 text-sm space-y-1.5"
          style={{background:"oklch(0.696 0.17 162.48/10%)",border:"1px solid oklch(0.696 0.17 162.48/30%)"}}>
          <p className="font-semibold text-sm" style={{color:"var(--color-emerald)"}}>📋 회원가입 안내</p>
          <p style={{color:"var(--muted-foreground)", fontSize:"12px"}}>• 아이디: 영문/숫자 조합</p>
          <p style={{color:"var(--muted-foreground)", fontSize:"12px"}}>• 이메일: 실제 사용 가능한 이메일</p>
          <p style={{color:"var(--muted-foreground)", fontSize:"12px"}}>• 비밀번호: 영문 대소문자 + 숫자 포함 6자 이상</p>
        </div>

        {/* 폼 */}
        <div className="rounded-2xl p-6 space-y-4" style={{background:"var(--card)",border:"1px solid var(--border)"}}>
          {/* 이름 */}
          <div className="space-y-1">
            <Input placeholder="이름 (성명)" value={form.name} onChange={set("name")} className="h-12 text-base"
              style={{borderColor: errors.name?"oklch(0.65 0.22 25)":undefined}}/>
            {errors.name && <p className="text-xs" style={{color:"oklch(0.65 0.22 25)"}}>{errors.name}</p>}
          </div>

          {/* 아이디 */}
          <div className="space-y-1">
            <Input placeholder="아이디" value={form.userId} onChange={set("userId")} className="h-12 text-base"
              style={{borderColor: errors.userId?"oklch(0.65 0.22 25)":undefined}}/>
            {errors.userId && <p className="text-xs" style={{color:"oklch(0.65 0.22 25)"}}>{errors.userId}</p>}
          </div>

          {/* 이메일 */}
          <div className="space-y-1">
            <Input placeholder="이메일" type="email" value={form.email} onChange={set("email")} className="h-12 text-base"
              style={{borderColor: errors.email?"oklch(0.65 0.22 25)":undefined}}/>
            {errors.email && <p className="text-xs" style={{color:"oklch(0.65 0.22 25)"}}>{errors.email}</p>}
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <div className="relative">
              <Input type={showPw?"text":"password"} placeholder="비밀번호" value={form.password}
                onChange={set("password")} className="h-12 text-base pr-12"
                style={{borderColor: errors.password?"oklch(0.65 0.22 25)":undefined}}/>
              <button className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{color:"var(--muted-foreground)"}} onClick={()=>setShowPw(v=>!v)}>
                {showPw?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}
              </button>
            </div>
            {form.password && (
              <div className="space-y-1 px-1">
                <Rule ok={pwRules.length} text="6자 이상"/>
                <Rule ok={pwRules.upper} text="영문 대문자 포함"/>
                <Rule ok={pwRules.lower} text="영문 소문자 포함"/>
                <Rule ok={pwRules.number} text="숫자 포함"/>
              </div>
            )}
          </div>

          {/* 비밀번호 확인 */}
          <div className="space-y-1">
            <Input type="password" placeholder="비밀번호 확인" value={form.confirm} onChange={set("confirm")} className="h-12 text-base"
              style={{borderColor: errors.confirm?"oklch(0.65 0.22 25)":undefined}}/>
            {errors.confirm && <p className="text-xs" style={{color:"oklch(0.65 0.22 25)"}}>{errors.confirm}</p>}
          </div>

          <Button className="w-full h-12 text-base font-semibold"
            style={{background:"var(--color-emerald)",color:"white"}}
            onClick={handleSignup} disabled={loading}>
            {loading?"가입 중...":"회원가입 완료"}
          </Button>
        </div>

        <p className="text-center text-sm" style={{color:"var(--muted-foreground)"}}>
          이미 계정이 있으신가요?{" "}
          <button className="font-semibold" style={{color:"var(--color-emerald)"}}
            onClick={()=>navigate("/login")}>로그인</button>
        </p>
      </div>
    </div>
  );
}
