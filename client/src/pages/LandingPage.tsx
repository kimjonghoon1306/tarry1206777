// BlogAuto Pro - LandingPage v5.0 — World Class UI
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { Search, FileText, Image, Send, Sun, Moon, Zap, Bot, ArrowRight, DollarSign, Download, Settings, Sparkles } from "lucide-react";

const LANGUAGES = [
  { flag: "🇰🇷", lang: "한국어", code: "ko", sub: "한국 블로그 최적화" },
  { flag: "🇺🇸", lang: "English", code: "en", sub: "Global SEO 최적화" },
];

const STATS = [
  { value: "10,000+", label: "월간 생성 콘텐츠", color: "#10b981" },
  { value: "98.7%", label: "자동화 성공률", color: "#6366f1" },
  { value: "8개국", label: "언어 지원", color: "#ec4899" },
  { value: "₩2.3M", label: "평균 월 수익 증가", color: "#f59e0b" },
];

function KeywordVisual() {
  return (
    <div style={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"flex-end",justifyContent:"center",gap:6,padding:"16px 24px 16px",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 110%,rgba(16,185,129,0.18),transparent 65%)"}}/>
      {[35,58,42,75,52,88,58,72,48,92,68,82,45,70].map((h,i)=>(
        <div key={i} style={{
          flex:1,height:`${h}%`,maxWidth:18,
          background:`linear-gradient(to top,#059669,#10b981,#34d399)`,
          borderRadius:"5px 5px 2px 2px",
          boxShadow:"0 0 14px rgba(16,185,129,0.55)",
          animation:`barUp 1.2s ${i*0.06}s ease both`,
          opacity:0.92,
        }}/>
      ))}
      <div style={{position:"absolute",top:14,left:14,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.35)",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#10b981",fontWeight:800,letterSpacing:"0.05em"}}>📈 +6% CTR</div>
      <div style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"4px 10px",fontSize:10,color:"rgba(255,255,255,0.5)",display:"flex",alignItems:"center",gap:5}}>
        LIVE <span style={{width:6,height:6,borderRadius:"50%",background:"#10b981",display:"inline-block",animation:"glowPulse 1s ease-in-out infinite"}}/>
      </div>
    </div>
  );
}

function ContentVisual() {
  const lines = [
    {t:"✍️  AI가 SEO 최적화 글을 작성 중...", c:"#34d399"},
    {t:"📊  키워드 밀도: ████████░░ 82%", c:"rgba(255,255,255,0.6)"},
    {t:"⭐  가독성 점수: ★★★★★", c:"rgba(255,255,255,0.55)"},
    {t:"⏱️  예상 체류시간: 3분 42초", c:"rgba(255,255,255,0.5)"},
  ];
  return (
    <div style={{position:"relative",width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"16px 20px",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 20% 50%,rgba(99,102,241,0.15),transparent 60%)"}}/>
      <div style={{background:"rgba(0,0,0,0.55)",borderRadius:14,border:"1px solid rgba(255,255,255,0.07)",padding:"14px 16px",backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
          <span style={{width:9,height:9,borderRadius:"50%",background:"#ff5f57",display:"inline-block"}}/>
          <span style={{width:9,height:9,borderRadius:"50%",background:"#febc2e",display:"inline-block"}}/>
          <span style={{width:9,height:9,borderRadius:"50%",background:"#28c840",display:"inline-block"}}/>
          <span style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginLeft:8,fontFamily:"monospace"}}>content_writer.ai</span>
        </div>
        {lines.map((l,i)=>(
          <div key={i} style={{fontSize:11,color:l.c,marginBottom:7,fontFamily:"'Courier New',monospace",animation:`typeIn 0.4s ${0.2+i*0.18}s ease both`,opacity:0}}>{l.t}</div>
        ))}
        <div style={{marginTop:10,height:3,background:"rgba(99,102,241,0.15)",borderRadius:2}}>
          <div style={{height:"100%",width:"78%",background:"linear-gradient(90deg,#10b981,#6366f1)",borderRadius:2,animation:"progressBar 2.5s 1s ease both"}}/>
        </div>
      </div>
    </div>
  );
}

function ImageGenVisual() {
  return (
    <div style={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 50%,rgba(236,72,153,0.12),transparent 65%)"}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:4,width:200,height:130}}>
        {Array.from({length:63}).map((_,i)=>{
          const revealed = i < 45;
          const hue = 140 + (i%4)*15;
          const lit = 18 + (i%5)*6;
          return (
            <div key={i} style={{
              borderRadius:3,
              background: revealed ? `hsl(${hue},65%,${lit}%)` : "rgba(30,30,40,0.8)",
              animation: revealed ? `pixelReveal 0.25s ${i*0.018}s ease both` : "none",
              opacity: revealed ? 1 : 0.25,
              boxShadow: revealed ? "0 0 5px rgba(16,185,129,0.25)" : "none",
            }}/>
          );
        })}
      </div>
      <div style={{position:"absolute",top:12,left:12,fontSize:10,color:"#ec4899",background:"rgba(236,72,153,0.1)",border:"1px solid rgba(236,72,153,0.3)",borderRadius:6,padding:"3px 8px",fontWeight:700,letterSpacing:"0.05em"}}>AI GENERATING...</div>
      <div style={{position:"absolute",bottom:14,right:16,fontSize:26,animation:"spin 10s linear infinite"}}>🎨</div>
    </div>
  );
}

function DeployVisual() {
  return (
    <div style={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 50%,rgba(245,158,11,0.1),transparent 65%)"}}/>
      <div style={{position:"relative",width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#d97706)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 30px rgba(245,158,11,0.6),0 0 60px rgba(245,158,11,0.25)",animation:"glowPulse2 2.5s ease-in-out infinite",fontSize:28,zIndex:2}}>
        🚀
      </div>
      {[0,45,90,135,180,225,270,315].map((angle,i)=>(
        <div key={i} style={{
          position:"absolute",
          width:56,height:2,
          background:`linear-gradient(90deg,rgba(245,158,11,0.9),transparent)`,
          transformOrigin:"0 50%",
          left:"50%",top:"calc(50% - 1px)",
          transform:`rotate(${angle}deg)`,
          animation:`rayShoot 2s ${i*0.12}s ease-in-out infinite`,
        }}/>
      ))}
      {[{e:"📝",s:{top:10,left:"8%"}},{e:"🌐",s:{top:10,right:"8%"}},{e:"📱",s:{bottom:10,left:"8%"}},{e:"💻",s:{bottom:10,right:"8%"}}].map((item,i)=>(
        <div key={i} style={{position:"absolute",fontSize:22,animation:`float 3s ${i*0.5}s ease-in-out infinite`,...item.s}}>{item.e}</div>
      ))}
    </div>
  );
}

const FEATURES = [
  { icon: Search, title: "스마트 키워드 수집", desc: "애드센스·애드포스트 연동으로 유입량과 클릭량이 높은 키워드를 실시간 자동 수집", Visual: KeywordVisual, color: "#10b981", accent: "rgba(16,185,129,0.12)", num: "01" },
  { icon: FileText, title: "AI 콘텐츠 자동 생성", desc: "수집된 키워드 기반으로 1,500자 이상의 SEO 최적화 글을 AI가 자동 작성", Visual: ContentVisual, color: "#6366f1", accent: "rgba(99,102,241,0.12)", num: "02" },
  { icon: Image, title: "실사 이미지 자동 생성", desc: "글 내용에 맞는 디테일하고 실물 같은 고품질 이미지를 AI로 자동 생성", Visual: ImageGenVisual, color: "#ec4899", accent: "rgba(236,72,153,0.12)", num: "03" },
  { icon: Send, title: "예약 & 수동 배포", desc: "원하는 사이트에 예약 배포 및 원클릭 수동 배포로 완전 자동화", Visual: DeployVisual, color: "#f59e0b", accent: "rgba(245,158,11,0.12)", num: "04" },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing-wrap" style={{minHeight:"100vh",background:theme==="light"?"#0d1a13":"#060a0e",fontFamily:"'Pretendard Variable',sans-serif",overflowX:"hidden"}}>
      <style>{`
        @keyframes barUp { from{transform:scaleY(0) translateY(10px);opacity:0} to{transform:scaleY(1) translateY(0);opacity:1} }
        @keyframes typeIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes progressBar { from{width:0} to{width:78%} }
        @keyframes pixelReveal { from{transform:scale(0) rotate(45deg);opacity:0;border-radius:50%} to{transform:scale(1) rotate(0deg);opacity:1;border-radius:3px} }
        @keyframes rayShoot { 0%,100%{opacity:0.2;transform:rotate(var(--r)) scaleX(0.4)} 50%{opacity:1;transform:rotate(var(--r)) scaleX(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 8px rgba(16,185,129,0.7)} 50%{box-shadow:0 0 20px rgba(16,185,129,1)} }
        @keyframes glowPulse2 { 0%,100%{box-shadow:0 0 20px rgba(245,158,11,0.5),0 0 40px rgba(245,158,11,0.2)} 50%{box-shadow:0 0 50px rgba(245,158,11,0.9),0 0 80px rgba(245,158,11,0.35)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(90px) rotate(0deg)} to{transform:rotate(360deg) translateX(90px) rotate(-360deg)} }
        @keyframes orbit2 { from{transform:rotate(120deg) translateX(140px) rotate(-120deg)} to{transform:rotate(480deg) translateX(140px) rotate(-480deg)} }
        @keyframes orbit3 { from{transform:rotate(240deg) translateX(110px) rotate(-240deg)} to{transform:rotate(600deg) translateX(110px) rotate(-600deg)} }
        @keyframes scanline { 0%{top:-4px} 100%{top:102%} }
        @keyframes morph { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }
        @keyframes shimmer { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(16,185,129,0.2)} 50%{border-color:rgba(16,185,129,0.55)} }
        @keyframes countUp { from{opacity:0;transform:scale(0.6) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes hueShift { from{filter:hue-rotate(0deg)} to{filter:hue-rotate(25deg)} }

        .nav-glass { backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); }
        .grid-bg {
          background-image:
            linear-gradient(rgba(16,185,129,0.04) 1px,transparent 1px),
            linear-gradient(90deg,rgba(16,185,129,0.04) 1px,transparent 1px);
          background-size:55px 55px;
        }
        .txt-grad { background:linear-gradient(135deg,#10b981 0%,#34d399 50%,#a7f3d0 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .txt-grad-hot { background:linear-gradient(90deg,#10b981,#6366f1,#ec4899,#f59e0b,#10b981); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; background-size:400%; animation:shimmer 5s linear infinite; }

        .btn-main { position:relative;overflow:hidden;cursor:pointer;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:14px;color:white;font-weight:700;transition:all 0.3s;box-shadow:0 4px 24px rgba(16,185,129,0.4); }
        .btn-main::before { content:'';position:absolute;top:0;left:-80%;width:40%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);transition:0.55s; }
        .btn-main:hover::before { left:130%; }
        .btn-main:hover { transform:translateY(-3px);box-shadow:0 10px 40px rgba(16,185,129,0.6),0 0 0 3px rgba(16,185,129,0.15); }
        .btn-main:active { transform:scale(0.97); }

        .btn-ghost { position:relative;overflow:hidden;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.11);border-radius:14px;color:white;font-weight:600;transition:all 0.3s; }
        .btn-ghost:hover { background:rgba(255,255,255,0.08);border-color:rgba(16,185,129,0.4);transform:translateY(-2px); }
        .btn-ghost:active { transform:scale(0.97); }

        .feat-card { position:relative;overflow:hidden;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:24px;transition:all 0.45s cubic-bezier(0.23,1,0.32,1);transform-style:preserve-3d; }
        .feat-card:hover { transform:translateY(-12px) rotateX(3deg) rotateY(-2deg);border-color:rgba(16,185,129,0.2);box-shadow:0 40px 80px rgba(0,0,0,0.5),0 0 0 1px rgba(16,185,129,0.12),inset 0 1px 0 rgba(255,255,255,0.06); }

        .platform-card { background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:20px;transition:all 0.35s cubic-bezier(0.23,1,0.32,1); }
        .platform-card:hover { transform:translateY(-8px);box-shadow:0 24px 60px rgba(0,0,0,0.4),0 0 0 1px rgba(16,185,129,0.18); }

        .stat-card { transition:all 0.35s cubic-bezier(0.23,1,0.32,1); }
        .stat-card:hover { transform:translateY(-8px) scale(1.04); }

        .lang-btn { transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer; }
        .lang-btn:hover { transform:translateY(-8px) scale(1.06);box-shadow:0 16px 40px rgba(16,185,129,0.2); }
        .lang-btn:active { transform:scale(0.96); }

        .od1::after { content:'';position:absolute;width:9px;height:9px;border-radius:50%;background:#10b981;box-shadow:0 0 14px #10b981;animation:orbit 7s linear infinite;margin:-4.5px; }
        .od2::after { content:'';position:absolute;width:7px;height:7px;border-radius:50%;background:#6366f1;box-shadow:0 0 12px #6366f1;animation:orbit2 10s linear infinite;margin:-3.5px; }
        .od3::after { content:'';position:absolute;width:5px;height:5px;border-radius:50%;background:#f59e0b;box-shadow:0 0 10px #f59e0b;animation:orbit3 8.5s linear infinite;margin:-2.5px; }
        .scanline { position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,rgba(16,185,129,0.45),transparent);animation:scanline 5.5s linear infinite;pointer-events:none; }
        @media(min-width:640px){.stat-grid{grid-template-columns:repeat(4,1fr)!important;}}
        @media(max-width:480px){.nav-btns .login-btn{display:none!important;} .hero-title{font-size:2.5rem!important;} .cta-flex{flex-direction:column!important;align-items:stretch!important;}}
        * { box-sizing: border-box; }
        body { overflow-x: hidden; }
        @media(min-width:640px){ #nav-login { display:flex !important; } }
        @media(prefers-color-scheme:light), [data-theme="light"] * {
          /* 랜딩페이지는 브랜드 특성상 다크 유지 */
        }
        .landing-light-mode { background: #0f1f18 !important; }
        html[class*="light"] .landing-wrap,
        body[class*="light"] .landing-wrap { background: #0d1a13 !important; }
      `}</style>

      {/* NAV */}
      <nav className="nav-glass" style={{position:"fixed",top:0,left:0,right:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:64,background:"rgba(6,10,14,0.82)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(16,185,129,0.45)"}}>
            <Bot style={{width:18,height:18,color:"white"}}/>
          </div>
          <span style={{fontWeight:800,fontSize:18,color:"white",fontFamily:"'Space Grotesk',sans-serif"}}>BlogAuto <span className="txt-grad">Pro</span></span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button style={{width:34,height:34,borderRadius:8,background:"transparent",border:"none",color:"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={toggleTheme}>
            {theme==="dark"?<Sun style={{width:16,height:16}}/>:<Moon style={{width:16,height:16}}/>}
          </button>
          <button className="btn-ghost" style={{padding:"8px 16px",fontSize:13,display:"none"}} id="nav-login" onClick={()=>navigate("/login")}>로그인</button>
          <button className="btn-main" style={{padding:"9px 16px",fontSize:13,display:"flex",alignItems:"center",gap:5}}
            onClick={()=>{localStorage.setItem("guest_mode","true");toast.success("👀 둘러보기 모드입니다. 실제 기능은 가입 후 이용 가능해요!",{duration:3000});navigate("/dashboard");}}>
            둘러보기 <ArrowRight style={{width:13,height:13}}/>
          </button>
          <button style={{width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#64748b",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
            title="운영자" onClick={()=>navigate("/superadmin")}>
            <Settings style={{width:15,height:15}}/>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="grid-bg" style={{minHeight:"100vh",paddingTop:64,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 80% 55% at 50% 30%,rgba(16,185,129,0.07),transparent 70%)"}}/>
        <div style={{position:"absolute",width:700,height:700,top:"5%",left:"50%",transform:"translateX(-50%)",background:"radial-gradient(circle,rgba(16,185,129,0.05),transparent 65%)",filter:"blur(50px)",animation:"morph 12s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:450,height:450,bottom:"8%",right:"3%",background:"radial-gradient(circle,rgba(99,102,241,0.07),transparent 70%)",filter:"blur(70px)",animation:"float 9s ease-in-out infinite"}}/>

        {/* 오비팅 파티클 */}
        <div className="od1" style={{position:"absolute",top:"32%",left:"18%",width:0,height:0}}/>
        <div className="od2" style={{position:"absolute",top:"58%",right:"20%",width:0,height:0}}/>
        <div className="od3" style={{position:"absolute",top:"22%",right:"32%",width:0,height:0}}/>
        <div className="scanline"/>

        <div style={{position:"relative",zIndex:10,textAlign:"center",padding:"40px 20px",maxWidth:920,margin:"0 auto"}}>
          {/* 히어로 로고 */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:24}}>
            <div style={{width:48,height:48,borderRadius:16,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 30px rgba(16,185,129,0.5)",animation:"glowPulse 3s ease-in-out infinite"}}>
              <Bot style={{width:26,height:26,color:"white"}}/>
            </div>
            <span style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:22,color:"white"}}>BlogAuto <span className="txt-grad">Pro</span></span>
          </div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.22)",borderRadius:999,padding:"7px 20px",marginBottom:32,animation:"borderGlow 3s ease-in-out infinite"}}>
            <Sparkles style={{width:13,height:13,color:"#10b981"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#10b981",letterSpacing:"0.12em",textTransform:"uppercase"}}>AI 기반 블로그 완전 자동화 플랫폼</span>
          </div>

          <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,lineHeight:1.08,color:"white",marginBottom:28,letterSpacing:"-0.045em",fontSize:"clamp(2.8rem,7.5vw,5.8rem)",animation:"fadeUp 0.9s ease forwards"}}>
            블로그 수익을<br/><span className="txt-grad">자동으로 극대화</span>
          </h1>

          <p style={{fontSize:"clamp(1rem,2vw,1.18rem)",color:"rgba(255,255,255,0.52)",lineHeight:1.85,marginBottom:44,maxWidth:580,margin:"0 auto 44px",animation:"fadeUp 0.9s 0.15s ease forwards"}}>
            키워드 수집부터 콘텐츠 작성, 이미지 생성, 자동 배포까지<br/>
            블로그 운영의 모든 과정을 AI가 완전 자동화합니다
          </p>

          <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap",marginBottom:64,animation:"fadeUp 0.9s 0.3s ease forwards"}}>
            <button className="btn-main" style={{padding:"17px 38px",fontSize:16,display:"flex",alignItems:"center",gap:8}}
              onClick={()=>navigate("/signup")}>
              <Sparkles style={{width:18,height:18}}/> 무료로 시작하기
            </button>
            <button className="btn-ghost" style={{padding:"17px 32px",fontSize:15,display:"flex",alignItems:"center",gap:8}}
              onClick={()=>{localStorage.setItem("guest_mode","true");toast.success("👀 둘러보기 모드!",{duration:3000});navigate("/dashboard");}}>
              먼저 둘러보기 <ArrowRight style={{width:16,height:16}}/>
            </button>
            <button className="btn-ghost" style={{padding:"17px 28px",fontSize:15,display:"flex",alignItems:"center",gap:8}}
              onClick={()=>navigate("/login")}>
              로그인
            </button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,maxWidth:680,margin:"0 auto",animation:"fadeUp 0.9s 0.45s ease forwards"}}>
            {STATS.map((s,i)=>(
              <div key={s.label} className="stat-card" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:"18px 8px",textAlign:"center",animation:`countUp 0.6s ${0.6+i*0.1}s ease forwards`}}>
                <div style={{fontSize:"clamp(1.3rem,3vw,1.9rem)",fontWeight:900,color:s.color,fontFamily:"'Space Grotesk',sans-serif",marginBottom:5}}>{s.value}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.38)",lineHeight:1.5}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
          <div style={{width:22,height:36,border:"2px solid rgba(255,255,255,0.1)",borderRadius:11,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:5}}>
            <div style={{width:3,height:9,background:"#10b981",borderRadius:2,animation:"float 1.8s ease-in-out infinite"}}/>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{padding:"110px 24px",background:"#060a0e"}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:68}}>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#10b981",marginBottom:14}}>FEATURES</p>
            <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,color:"white",fontSize:"clamp(1.9rem,4vw,3rem)",letterSpacing:"-0.035em",marginBottom:14}}>
              블로그 자동화의 <span className="txt-grad-hot">모든 것</span>
            </h2>
            <p style={{color:"rgba(255,255,255,0.42)",fontSize:"1.08rem"}}>복잡한 설정 없이 바로 시작하는 완전 자동화 파이프라인</p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,440px),1fr))",gap:18}}>
            {FEATURES.map((f)=>(
              <div key={f.title} className="feat-card">
                <div style={{height:230,background:`linear-gradient(135deg,${f.accent},rgba(6,10,14,0.4))`,borderBottom:"1px solid rgba(255,255,255,0.04)",position:"relative",overflow:"hidden"}}>
                  <f.Visual/>
                  <div style={{position:"absolute",top:14,right:16,fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,fontSize:13,color:"rgba(255,255,255,0.18)",letterSpacing:"0.1em"}}>{f.num}</div>
                </div>
                <div style={{padding:"26px 28px 30px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:13}}>
                    <div style={{width:38,height:38,borderRadius:11,background:`${f.color}18`,border:`1px solid ${f.color}35`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <f.icon style={{width:18,height:18,color:f.color}}/>
                    </div>
                    <h3 style={{fontWeight:700,color:"white",fontSize:17,fontFamily:"'Space Grotesk',sans-serif"}}>{f.title}</h3>
                  </div>
                  <p style={{fontSize:13,color:"rgba(255,255,255,0.48)",lineHeight:1.85}}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORMS */}
      <section style={{padding:"110px 24px",background:"rgba(255,255,255,0.008)",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:68}}>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#6366f1",marginBottom:14}}>PLATFORMS</p>
            <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,color:"white",fontSize:"clamp(1.9rem,4vw,3rem)",letterSpacing:"-0.035em"}}>
              모든 플랫폼에 <span className="txt-grad">자동 배포</span>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14}}>
            {[
              {logo:"WP",name:"WordPress",badge:"⚡ 자동 발행",desc:"REST API로 완전 자동화",color:"#21759B"},
              {logo:"B",name:"블로거",badge:"⚡ 자동 발행",desc:"구글 애드센스 최적화",color:"#FF5722"},
              {logo:"M",name:"Medium",badge:"⚡ 자동 발행",desc:"영문 글로벌 트래픽",color:"#444"},
              {logo:"C",name:"커스텀 사이트",badge:"⚡ Webhook",desc:"모든 CMS 호환",color:"oklch(0.65 0.28 350)"},
              {logo:"N",name:"네이버 블로그",badge:"📋 원클릭 복사",desc:"마크다운 자동 변환",color:"#03C75A"},
            ].map((p)=>(
              <div key={p.name} className="platform-card" style={{padding:"22px 20px"}}>
                <div style={{width:44,height:44,borderRadius:14,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"white",fontSize:14,marginBottom:14,boxShadow:`0 4px 18px ${p.color}55`}}>{p.logo}</div>
                <div style={{fontWeight:700,color:"white",fontSize:15,marginBottom:6}}>{p.name}</div>
                <div style={{display:"inline-block",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:999,background:"rgba(16,185,129,0.1)",color:"#10b981",marginBottom:10}}>{p.badge}</div>
                <p style={{fontSize:12,color:"rgba(255,255,255,0.38)",lineHeight:1.7}}>{p.desc}</p>
              </div>
            ))}
            <div style={{border:"1px dashed rgba(255,255,255,0.08)",borderRadius:20,padding:"22px 20px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>🚀</div>
              <div style={{fontWeight:700,color:"white",fontSize:14,marginBottom:6}}>곧 추가 예정</div>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.28)"}}>Search Console 색인<br/>텔레그램 알림</p>
            </div>
          </div>
        </div>
      </section>

      {/* LANGUAGE */}
      <section style={{padding:"110px 24px",background:"#060a0e"}}>
        <div style={{maxWidth:620,margin:"0 auto",textAlign:"center"}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:"#ec4899",marginBottom:14}}>MULTILINGUAL</p>
          <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,color:"white",fontSize:"clamp(1.9rem,4vw,3rem)",letterSpacing:"-0.035em",marginBottom:14}}>
            한국어 · 영어로<br/><span className="txt-grad">동시 배포</span>
          </h2>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:"1rem",marginBottom:44}}>언어를 선택하면 콘텐츠가 자동으로 해당 언어로 생성됩니다</p>
          <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:20}}>
            {LANGUAGES.map(item=>(
              <button key={item.lang} className="lang-btn" style={{display:"flex",alignItems:"center",gap:16,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"18px 32px",color:"white",textAlign:"left"}}
                onClick={()=>{localStorage.setItem("content_language",item.code);toast.success(`✅ 콘텐츠 언어가 ${item.lang}(으)로 설정됐어요! 로그인 후 적용됩니다`,{duration:3000});}}>
                <span style={{fontSize:38}}>{item.flag}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:17}}>{item.lang}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.38)",marginTop:3}}>{item.sub}</div>
                </div>
              </button>
            ))}
          </div>
          <p style={{fontSize:12,color:"rgba(255,255,255,0.22)",marginTop:24}}>클릭하면 언어가 설정됩니다 · 로그인 후 콘텐츠 생성 시 자동 적용</p>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"130px 24px",textAlign:"center",position:"relative",overflow:"hidden",background:"linear-gradient(135deg,rgba(16,185,129,0.06),rgba(99,102,241,0.06) 50%,rgba(236,72,153,0.06))",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
        <div style={{position:"absolute",width:600,height:600,top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"radial-gradient(circle,rgba(16,185,129,0.07),transparent 65%)",filter:"blur(70px)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:10,maxWidth:660,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:999,padding:"7px 20px",marginBottom:30}}>
            <Zap style={{width:13,height:13,color:"#10b981"}}/>
            <span style={{fontSize:12,fontWeight:700,color:"#10b981",letterSpacing:"0.12em",textTransform:"uppercase"}}>지금 바로 시작하세요</span>
          </div>
          <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:900,color:"white",fontSize:"clamp(2rem,5.5vw,3.8rem)",letterSpacing:"-0.045em",marginBottom:22,lineHeight:1.1}}>
            블로그 자동화로<br/><span className="txt-grad">수익을 극대화</span>하세요
          </h2>
          <p style={{color:"rgba(255,255,255,0.44)",fontSize:"1.08rem",marginBottom:48}}>복잡한 설정 없이 5분 안에 시작할 수 있습니다</p>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn-main" style={{padding:"19px 48px",fontSize:16,display:"flex",alignItems:"center",gap:9}}
              onClick={()=>navigate("/dashboard")}>
              대시보드 시작하기 <ArrowRight style={{width:19,height:19}}/>
            </button>
            <button className="btn-ghost" style={{padding:"19px 38px",fontSize:15,display:"flex",alignItems:"center",gap:9}}
              onClick={()=>{
                toast.loading("ZIP 파일 준비 중...",{id:"landing-zip"});
                setTimeout(()=>{
                  const content=`BlogAuto Pro - 블로그 자동화 플랫폼\n====================================\n\n내보내기 날짜: ${new Date().toLocaleString("ko-KR")}\n\n== 포함된 기능 ==\n1. 키워드 수집 (애드센스/애드포스트 연동)\n2. AI 콘텐츠 자동 생성 (1,500자 이상)\n3. 실사 이미지 자동 생성\n4. 예약 배포 및 수동 배포\n5. 다국어 지원 (8개국)\n6. 다크/라이트 모드\n7. 관리자 페이지\n\n© 2026 BlogAuto Pro. All rights reserved.\n`;
                  const blob=new Blob([content],{type:"text/plain;charset=utf-8"});
                  const url=URL.createObjectURL(blob);
                  const a=document.createElement("a");
                  a.href=url;a.download="BlogAuto-Pro-Export.txt";
                  document.body.appendChild(a);a.click();
                  document.body.removeChild(a);URL.revokeObjectURL(url);
                  toast.success("다운로드가 시작되었습니다!",{id:"landing-zip"});
                },1000);
              }}>
              <Download style={{width:19,height:19}}/> ZIP 다운로드
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"28px 24px",textAlign:"center",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
          <div style={{width:24,height:24,borderRadius:6,background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Bot style={{width:14,height:14,color:"white"}}/>
          </div>
          <span style={{fontWeight:700,color:"white",fontSize:15}}>BlogAuto Pro</span>
        </div>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.22)"}}>© 2026 BlogAuto Pro. All rights reserved. | 블로그 자동화 플랫폼</p>
      </footer>
    </div>
  );
}
