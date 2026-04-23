// BlogAuto Pro - SettingsPage v3.1
/**
 * BlogAuto Pro - Settings Page
 * AI 툴 선택 + API 키 관리 + 발행 설정
 */

import { useState } from "react";
import React from "react";
import Layout from "@/components/Layout";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  Sun, Moon, Monitor, Globe, Bell,
  Palette, Download, Save, ChevronRight,
  Key, Eye, EyeOff, CheckCircle2, Bot,
  Wand2, Zap, ExternalLink, Newspaper,
  Smartphone, Upload, QrCode, Send, Plus, Trash2, RefreshCw,
  ShoppingCart, Link, DollarSign, Activity, Sparkles, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CONTENT_AI_OPTIONS, IMAGE_AI_OPTIONS,
  type ContentAIProvider, type ImageAIProvider,
} from "@/lib/ai-config";
import { userGet, userGetSettingsValue, userSet, SETTINGS_KEYS, saveSettingsToServer, applyServerSettings, loadSettingsFromServer, isAdminUser } from "@/lib/user-storage";

const LANGUAGES = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
];

function ApiKeyInput({ label, placeholder, storageKey, link }: {
  label: string; placeholder: string; storageKey: string; link: string;
}) {
  const [value, setValue] = useState(() => userGetSettingsValue(storageKey));
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  // 로그인 직후 서버에서 키 로드 - useState 초기값이 빈값일 때 서버에서 재시도
  React.useEffect(() => {
    if (!value && !isAdminUser()) {
      loadSettingsFromServer().then(settings => {
        if (settings && settings[storageKey]) {
          const serverVal = settings[storageKey];
          userSet(storageKey, serverVal);
          setValue(serverVal);
        }
      });
    }
  }, []);

  const handleSave = () => {
    if (!value.trim()) { toast.error("API 키를 입력해주세요"); return; }
    userSet(storageKey, value.trim());
    saveSettingsToServer({ [storageKey]: value.trim() });
    setSaved(true);
    toast.success(`${label} 저장됨`);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </label>
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs hover:underline"
          style={{ color: "var(--color-emerald)" }}>
          발급받기 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input type={show ? "text" : "password"} placeholder={placeholder}
            value={value} onChange={(e) => setValue(e.target.value)}
            className="pr-10 text-sm font-mono" />
          <button className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted-foreground)" }}
            onClick={() => setShow(v => !v)}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Button className="gap-1.5 shrink-0 text-sm"
          style={{ background: saved ? "var(--color-emerald)" : "oklch(0.75 0.12 300)", color: "white" }}
          onClick={handleSave}>
          {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
          {saved ? "저장됨" : "저장"}
        </Button>
      </div>
    </div>
  );
}


// ── 미디엄 연동 섹션 ──────────────────────────────
function MediumSection() {
  const [token, setToken] = React.useState(() => userGetSettingsValue("medium_token"));
  const [authorId, setAuthorId] = React.useState(() => userGetSettingsValue("medium_author_id"));
  const [showToken, setShowToken] = React.useState(false);

  const handleSave = () => {
    if (!token) { toast.error("Integration Token을 입력해주세요"); return; }
    userSet("medium_token", token);
    if (authorId) userSet("medium_author_id", authorId);
    saveSettingsToServer({ medium_token: token, medium_author_id: authorId });
    toast.success("✅ 미디엄 설정 저장됨");
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: "#333333" }}>M</div>
          <h3 className="font-semibold text-foreground">미디엄 (Medium)</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "oklch(0.696 0.17 162.48/20%)", color: "var(--color-emerald)" }}>
            ⚡ 자동발행
          </span>
        </div>
        <a href="https://medium.com/me/settings/security" target="_blank" rel="noopener noreferrer"
          className="text-xs flex items-center gap-1 hover:underline" style={{ color: "#333333" }}>
          토큰 발급받기 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        미디엄 Settings → Security → Integration tokens 에서 토큰을 발급받아 입력해주세요.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Integration Token</label>
          <div className="relative">
            <Input type={showToken ? "text" : "password"} value={token} onChange={e => setToken(e.target.value)}
              placeholder="Integration Token" className="text-sm font-mono pr-10" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShowToken(v => !v)}>
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Author ID (선택)</label>
          <Input value={authorId} onChange={e => setAuthorId(e.target.value)}
            placeholder="Author ID" className="text-sm font-mono" />
        </div>
        <Button className="gap-2" style={{ background: "#333333", color: "white" }} onClick={handleSave}>
          <Key className="w-4 h-4" /> 저장
        </Button>
      </div>
    </div>
  );
}
// ── 쿠팡파트너스 섹션 ────────────────────────────────
function UserGSCSection() {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [siteUrl, setSiteUrl] = React.useState(() => userGetSettingsValue("gsc_site_url"));
  const [clientEmail, setClientEmail] = React.useState(() => userGetSettingsValue("gsc_client_email"));
  const [privateKey, setPrivateKey] = React.useState(() => userGetSettingsValue("gsc_private_key"));
  const [saved, setSaved] = React.useState(false);
  const [guideTab, setGuideTab] = React.useState<"domain"|"key">("domain");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json.client_email) setClientEmail(json.client_email);
        if (json.private_key) setPrivateKey(json.private_key);
        toast.success("✅ JSON 파일 파싱 완료! 저장을 눌러주세요.");
      } catch { toast.error("JSON 파일 형식이 올바르지 않아요"); }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    if (!siteUrl || !clientEmail || !privateKey) { toast.error("모든 항목을 입력해주세요"); return; }
    userSet("gsc_site_url", siteUrl);
    userSet("gsc_client_email", clientEmail);
    userSet("gsc_private_key", privateKey);
    saveSettingsToServer({ gsc_site_url: siteUrl, gsc_client_email: clientEmail, gsc_private_key: privateKey });
    setSaved(true);
    toast.success("✅ 구글 서치콘솔 설정 저장됨!");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: "linear-gradient(135deg,#4285F4,#34A853)" }}>G</div>
          <h3 className="font-semibold text-foreground">구글 서치콘솔 (GSC)</h3>
        </div>
        {saved && <span className="text-xs font-semibold" style={{ color: "#34A853" }}>✅ 저장됨</span>}
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
        내 블로그에 구글 검색으로 유입된 키워드를 확인합니다.
      </p>

      {/* 가이드 버튼 */}
      <button onClick={() => { const el = document.getElementById("userGscGuidePopup"); if(el) el.style.display=el.style.display==="none"?"flex":"none"; }}
        className="w-full text-sm px-4 py-3 rounded-xl mb-4 font-bold flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg,rgba(66,133,244,0.1),rgba(52,168,83,0.08))", color: "#4285F4", border: "1.5px solid rgba(66,133,244,0.25)" }}>
        📖 처음이신가요? 설정 방법 보기 (클릭)
      </button>

      {/* 팝업 */}
      <div id="userGscGuidePopup" style={{display:"none",position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)",alignItems:"center",justifyContent:"center",padding:"16px"}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"24px",width:"100%",maxWidth:"540px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.7)"}}>
          {/* 팝업 헤더 */}
          <div style={{padding:"24px 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontWeight:900,fontSize:"1.05rem",letterSpacing:"-0.03em"}}>📖 구글 서치콘솔 설정 가이드</div>
            <button onClick={() => { const el = document.getElementById("userGscGuidePopup"); if(el) el.style.display="none"; }}
              style={{width:32,height:32,borderRadius:9,background:"var(--card2)",border:"none",cursor:"pointer",color:"var(--muted-foreground)",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          </div>
          <p style={{padding:"8px 24px 0",fontSize:"0.8rem",color:"var(--muted-foreground)"}}>처음부터 차근차근 따라하시면 누구나 설정할 수 있어요 😊</p>

          {/* 탭 */}
          <div style={{display:"flex",gap:8,padding:"16px 24px 0"}}>
            {([["domain","🌐 1단계: 도메인 등록"],["key","🔑 2단계: 키 발급"]] as [typeof guideTab, string][]).map(([tab, label]) => (
              <button key={tab} onClick={() => setGuideTab(tab)}
                style={{flex:1,padding:"10px 8px",borderRadius:12,border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",fontFamily:"inherit",
                  background: guideTab===tab ? "linear-gradient(135deg,#4285F4,#34A853)" : "var(--card2)",
                  color: guideTab===tab ? "white" : "var(--muted-foreground)",
                  boxShadow: guideTab===tab ? "0 4px 14px rgba(66,133,244,0.3)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* 탭 내용 */}
          <div style={{padding:"20px 24px 24px"}}>

            {/* 도메인 등록 탭 */}
            {guideTab === "domain" && (
              <div style={{display:"flex",flexDirection:"column",gap:14,fontSize:"0.84rem"}}>
                <div style={{background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.15)",borderRadius:14,padding:16}}>
                  <div style={{fontWeight:800,color:"#4285F4",marginBottom:6}}>이게 뭔가요?</div>
                  <div style={{color:"var(--muted-foreground)",lineHeight:1.75}}>구글 서치콘솔은 내 블로그가 구글 검색에 어떻게 노출되는지 보여주는 구글 공식 무료 서비스예요. 여기에 내 블로그를 등록해야 유입 키워드를 확인할 수 있어요.</div>
                </div>

                {[
                  {num:"1",color:"#4285F4",bg:"rgba(66,133,244,0.06)",border:"rgba(66,133,244,0.15)",
                   title:"구글 서치콘솔 접속",
                   steps:["아래 버튼을 클릭해서 구글 서치콘솔에 접속하세요","구글 계정으로 로그인하세요 (블로그 계정과 같은 계정 권장)"],
                   link:{href:"https://search.google.com/search-console",text:"🔗 구글 서치콘솔 바로가기"}},
                  {num:"2",color:"#34A853",bg:"rgba(52,168,83,0.06)",border:"rgba(52,168,83,0.15)",
                   title:"속성 추가 (블로그 등록)",
                   steps:["왼쪽 상단의 속성 검색 박스 옆 ▼ 클릭","속성 추가 클릭","도메인 방식 선택 (왼쪽) → 블로그 주소 입력 예) myblog.com","계속 버튼 클릭"]},
                  {num:"3",color:"#ea4335",bg:"rgba(234,67,53,0.06)",border:"rgba(234,67,53,0.15)",
                   title:"소유권 인증",
                   steps:["DNS 레코드 방식이 나오면 → DNS 관리 페이지에서 TXT 레코드 추가","또는 HTML 파일 방식 선택 → 파일을 블로그 루트에 업로드","인증 버튼 클릭 → 소유권 확인됨 메시지 확인"],
                   tip:"💡 티스토리/네이버 블로그는 HTML 태그 방식이 더 쉬워요"},
                  {num:"4",color:"#f59e0b",bg:"rgba(251,188,5,0.06)",border:"rgba(251,188,5,0.2)",
                   title:"사이트 URL 확인",
                   steps:["등록 완료 후 상단에 표시되는 URL을 메모해두세요","도메인 방식이면 sc-domain:myblog.com 형태","URL 방식이면 https://myblog.com 형태"],
                   tip:"💡 이 URL을 아래 설정에 입력해야 해요"},
                ].map(step => (
                  <div key={step.num} style={{background:step.bg,border:`1px solid ${step.border}`,borderRadius:14,padding:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:28,height:28,borderRadius:8,background:step.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"0.85rem",color:"white",flexShrink:0}}>{step.num}</div>
                      <div style={{fontWeight:800,color:"var(--foreground)"}}>{step.title}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {step.steps.map((s,i) => (
                        <div key={i} style={{display:"flex",gap:8,color:"var(--muted-foreground)",lineHeight:1.6}}>
                          <span style={{color:step.color,fontWeight:700,flexShrink:0}}>▸</span><span>{s}</span>
                        </div>
                      ))}
                      {"tip" in step && step.tip && <div style={{marginTop:6,fontSize:"0.78rem",padding:"6px 10px",borderRadius:8,background:`${step.color}15`,color:step.color,fontWeight:600}}>{step.tip}</div>}
                      {"link" in step && step.link && <a href={step.link.href} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,padding:"8px 14px",borderRadius:10,background:step.color,color:"white",fontWeight:700,fontSize:"0.8rem",textDecoration:"none"}}>{step.link.text}</a>}
                    </div>
                  </div>
                ))}

                <div style={{background:"rgba(52,168,83,0.08)",border:"1.5px solid rgba(52,168,83,0.3)",borderRadius:14,padding:14,textAlign:"center"}}>
                  <div style={{fontWeight:800,color:"#34A853",marginBottom:4}}>✅ 도메인 등록 완료!</div>
                  <div style={{fontSize:"0.8rem",color:"var(--muted-foreground)"}}>이제 2단계 탭을 눌러서 키 발급을 진행하세요 →</div>
                  <button onClick={() => setGuideTab("key")}
                    style={{marginTop:10,padding:"8px 20px",borderRadius:10,background:"linear-gradient(135deg,#4285F4,#34A853)",color:"white",fontWeight:700,fontSize:"0.82rem",border:"none",cursor:"pointer"}}>
                    🔑 2단계: 키 발급하기 →
                  </button>
                </div>
              </div>
            )}

            {/* 키 발급 탭 */}
            {guideTab === "key" && (
              <div style={{display:"flex",flexDirection:"column",gap:14,fontSize:"0.84rem"}}>
                <div style={{background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.15)",borderRadius:14,padding:16}}>
                  <div style={{fontWeight:800,color:"#4285F4",marginBottom:6}}>왜 키가 필요한가요?</div>
                  <div style={{color:"var(--muted-foreground)",lineHeight:1.75}}>BlogAuto Pro가 내 서치콘솔 데이터를 자동으로 가져오려면 허가증(키)이 필요해요. 구글 클라우드에서 무료로 발급받을 수 있어요.</div>
                </div>

                {[
                  {num:"1",color:"#4285F4",bg:"rgba(66,133,244,0.06)",border:"rgba(66,133,244,0.15)",
                   title:"Google Cloud Console 접속",
                   steps:["아래 버튼을 클릭해서 구글 클라우드 콘솔에 접속","구글 계정으로 로그인"],
                   link:{href:"https://console.cloud.google.com",text:"🔗 구글 클라우드 콘솔 바로가기"}},
                  {num:"2",color:"#34A853",bg:"rgba(52,168,83,0.06)",border:"rgba(52,168,83,0.15)",
                   title:"Search Console API 켜기",
                   steps:["왼쪽 메뉴 → API 및 서비스 → 라이브러리 클릭","검색창에 Search Console API 입력 후 엔터","검색 결과에서 Google Search Console API 클릭","파란색 사용 버튼 클릭"],
                   tip:"💡 이미 사용 설정됨이면 넘어가도 돼요"},
                  {num:"3",color:"#ea4335",bg:"rgba(234,67,53,0.06)",border:"rgba(234,67,53,0.15)",
                   title:"서비스 계정 만들기",
                   steps:["왼쪽 메뉴 → API 및 서비스 → 사용자 인증 정보 클릭","상단 + 사용자 인증 정보 만들기 → 서비스 계정 클릭","서비스 계정 이름에 아무 이름이나 입력 (예: my-gsc)","만들고 계속하기 → 계속 → 완료 클릭"]},
                  {num:"4",color:"#f59e0b",bg:"rgba(251,188,5,0.06)",border:"rgba(251,188,5,0.2)",
                   title:"JSON 키 파일 다운로드",
                   steps:["방금 만든 서비스 계정 이메일 클릭","상단 탭에서 키 클릭","키 추가 → 새 키 만들기 클릭","JSON 선택 (기본값) → 만들기 클릭","JSON 파일이 자동으로 다운로드돼요"],
                   tip:"⚠️ 이 파일은 절대 다른 사람에게 공유하지 마세요!"},
                  {num:"5",color:"#9c27b0",bg:"rgba(156,39,176,0.06)",border:"rgba(156,39,176,0.15)",
                   title:"서치콘솔에 권한 추가",
                   steps:["구글 서치콘솔로 돌아가기","왼쪽 하단 설정 → 사용자 및 권한 클릭","+ 사용자 추가 클릭","다운받은 JSON 파일을 메모장으로 열어서 client_email 값 복사 후 붙여넣기","권한: 전체 선택 → 추가 클릭"],
                   tip:"💡 client_email은 xxx@xxx.iam.gserviceaccount.com 형태예요"},
                  {num:"6",color:"#34A853",bg:"rgba(52,168,83,0.08)",border:"rgba(52,168,83,0.25)",
                   title:"BlogAuto Pro에 JSON 파일 업로드",
                   steps:["이 팝업을 닫고 아래 JSON 파일 선택 버튼 클릭","다운받은 JSON 파일 선택","내 블로그 URL 입력 후 저장 클릭","완료!"]},
                ].map(step => (
                  <div key={step.num} style={{background:step.bg,border:`1px solid ${step.border}`,borderRadius:14,padding:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:28,height:28,borderRadius:8,background:step.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"0.85rem",color:"white",flexShrink:0}}>{step.num}</div>
                      <div style={{fontWeight:800,color:"var(--foreground)"}}>{step.title}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {step.steps.map((s,i) => (
                        <div key={i} style={{display:"flex",gap:8,color:"var(--muted-foreground)",lineHeight:1.6}}>
                          <span style={{color:step.color,fontWeight:700,flexShrink:0}}>▸</span><span>{s}</span>
                        </div>
                      ))}
                      {"tip" in step && step.tip && <div style={{marginTop:6,fontSize:"0.78rem",padding:"6px 10px",borderRadius:8,background:`${step.color}15`,color:step.color,fontWeight:600}}>{step.tip}</div>}
                      {"link" in step && step.link && <a href={step.link.href} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,padding:"8px 14px",borderRadius:10,background:step.color,color:"white",fontWeight:700,fontSize:"0.8rem",textDecoration:"none"}}>{step.link.text}</a>}
                    </div>
                  </div>
                ))}

                <div style={{background:"rgba(52,168,83,0.08)",border:"1.5px solid rgba(52,168,83,0.3)",borderRadius:14,padding:14,textAlign:"center"}}>
                  <div style={{fontWeight:800,color:"#34A853",fontSize:"1rem",marginBottom:4}}>🎉 모든 설정 완료!</div>
                  <div style={{fontSize:"0.8rem",color:"var(--muted-foreground)"}}>팝업을 닫고 JSON 파일 업로드 후 저장하면 끝이에요!</div>
                  <button onClick={() => { const el = document.getElementById("userGscGuidePopup"); if(el) el.style.display="none"; }}
                    style={{marginTop:10,padding:"8px 24px",borderRadius:10,background:"linear-gradient(135deg,#34A853,#1a8a3a)",color:"white",fontWeight:700,fontSize:"0.82rem",border:"none",cursor:"pointer"}}>
                    ✅ 설정하러 가기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* 사이트 URL */}
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted-foreground)" }}>내 블로그 URL</label>
          <Input value={siteUrl} onChange={e => setSiteUrl(e.target.value)}
            placeholder="https://myblog.com 또는 sc-domain:myblog.com" className="text-sm font-mono" />
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>서치콘솔에 등록한 URL과 동일하게 입력</p>
        </div>

        {/* JSON 파일 업로드 */}
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted-foreground)" }}>서비스 계정 JSON 파일 업로드</label>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileUpload} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()}
            className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg,#4285F4,#34A853)", color: "white", boxShadow: "0 4px 14px rgba(66,133,244,0.25)" }}>
            📁 JSON 파일 선택
          </button>
          {clientEmail && (
            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#34A853" }}>
              ✅ {clientEmail}
            </p>
          )}
        </div>

        <button onClick={handleSave}
          className="w-full h-10 rounded-xl font-semibold text-sm text-white"
          style={{ background: "linear-gradient(135deg,#34A853,#1a8a3a)" }}>
          💾 저장
        </button>
      </div>
    </div>
  );
}

function CoupangSection() {
  const [accessKey, setAccessKey] = React.useState(() => userGetSettingsValue("coupang_access_key"));
  const [secretKey, setSecretKey] = React.useState(() => userGetSettingsValue("coupang_secret_key"));
  const [subId, setSubId] = React.useState(() => userGetSettingsValue("coupang_sub_id"));
  const [showSecret, setShowSecret] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [testResult, setTestResult] = React.useState<string>("");
  const [testing, setTesting] = React.useState(false);

  const handleSave = () => {
    if (!accessKey || !secretKey) { toast.error("Access Key와 Secret Key를 입력해주세요"); return; }
    userSet("coupang_access_key", accessKey);
    userSet("coupang_secret_key", secretKey);
    if (subId) userSet("coupang_sub_id", subId);
    saveSettingsToServer({ coupang_access_key: accessKey, coupang_secret_key: secretKey, coupang_sub_id: subId });
    setSaved(true);
    toast.success("✅ 쿠팡파트너스 설정 저장됨! 배포 페이지에서 자동 링크 삽입이 활성화됩니다");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    if (!accessKey || !secretKey) { toast.error("키를 먼저 저장해주세요"); return; }
    setTesting(true);
    setTestResult("");
    try {
      const resp = await fetch("/api/coupang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", accessKey, secretKey, keyword: "노트북", limit: 1 }),
      });
      const data = await resp.json();
      if (data.ok && data.products?.length > 0) {
        setTestResult(`✅ 연결 성공! "${data.products[0].productName.slice(0, 30)}..." 상품 검색됨`);
      } else {
        setTestResult("❌ " + (data.error || "상품 없음"));
      }
    } catch (e: any) {
      setTestResult("❌ " + e.message);
    } finally { setTesting(false); }
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: "#C00F0C" }}>CP</div>
          <h3 className="font-semibold text-foreground">쿠팡파트너스</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "oklch(0.769 0.188 70.08/20%)", color: "var(--color-amber-brand)" }}>
            💰 자동 링크 삽입
          </span>
        </div>
        <a href="https://partners.coupang.com" target="_blank" rel="noopener noreferrer"
          className="text-xs flex items-center gap-1 hover:underline" style={{ color: "#C00F0C" }}>
          파트너스 가입 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        쿠팡파트너스 → 계정관리 → API 설정에서 Access/Secret Key 발급
        글 발행 시 키워드 관련 쿠팡 상품 링크가 자동 삽입됩니다
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Access Key</label>
          <Input value={accessKey} onChange={e => setAccessKey(e.target.value)} placeholder="쿠팡파트너스 Access Key" className="text-sm font-mono" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Secret Key</label>
          <div className="relative">
            <Input type={showSecret ? "text" : "password"} value={secretKey} onChange={e => setSecretKey(e.target.value)}
              placeholder="Secret Key" className="text-sm font-mono pr-10" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShowSecret(v => !v)}>
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Sub ID (선택)</label>
          <Input value={subId} onChange={e => setSubId(e.target.value)} placeholder="수익 추적용 서브 ID" className="text-sm" />
        </div>
        {testResult && (
          <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
            {testResult}
          </div>
        )}
        <div className="flex gap-2">
          <Button className="gap-2" style={{ background: saved ? "var(--color-emerald)" : "#C00F0C", color: "white" }} onClick={handleSave}>
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Key className="w-4 h-4" />}
            {saved ? "저장됨" : "저장"}
          </Button>
          <Button variant="outline" className="gap-2 text-xs" onClick={handleTest} disabled={testing}>
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            연결 테스트
          </Button>
        </div>
      </div>
    </div>
  );
}


// ── 커스텀 웹사이트 Webhook 섹션 (인증 방식 선택) ──
const AUTH_HEADER_OPTIONS = [
  { value: "Authorization", label: "Authorization", example: "Bearer {키} 또는 {키}" },
  { value: "X-API-Key", label: "X-API-Key", example: "API 키 직접 입력" },
  { value: "X-Auth-Token", label: "X-Auth-Token", example: "토큰 직접 입력" },
  { value: "X-Custom-Auth", label: "X-Custom-Auth", example: "커스텀 인증" },
  { value: "none", label: "인증 없음", example: "공개 API" },
];

function CustomWebhookSection() {
  const [accounts, setAccounts] = React.useState<Record<string, string>[]>(() => {
    try { return JSON.parse(localStorage.getItem("platform_custom_list") || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [authKey, setAuthKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);

  const handleSave = () => {
    if (!url.trim()) { toast.error("Webhook URL을 입력해주세요"); return; }
    const domain = url.replace("https://", "").replace("http://", "").split("/")[0];
    const entry = {
      _name: domain,
      _type: "custom",
      custom_domain: domain,
      webhook_url: url.trim(),
      webhook_auth_header: "Authorization",
      webhook_auth_key: authKey.trim(),
    };
    const updated = [...accounts, entry];
    setAccounts(updated);
    localStorage.setItem("platform_custom_list", JSON.stringify(updated));
    userSet(SETTINGS_KEYS.WEBHOOK_URL, url.trim());
    userSet(SETTINGS_KEYS.WEBHOOK_KEY, authKey.trim());
    userSet("webhook_auth_header", "Authorization");
    userSet("custom_domain", domain);
    localStorage.setItem("custom_domain", domain);
    localStorage.setItem("admin_custom_domain", domain);
    localStorage.setItem("blogauto_custom_domain", domain);
    const platforms = JSON.parse(localStorage.getItem("blogauto_deploy_platforms") || "[]");
    platforms.push({ id: Math.random().toString(36).slice(2), type: "custom", name: domain });
    localStorage.setItem("blogauto_deploy_platforms", JSON.stringify(platforms));
    saveSettingsToServer({ [SETTINGS_KEYS.WEBHOOK_URL]: url, [SETTINGS_KEYS.WEBHOOK_KEY]: authKey, custom_domain: domain });
    setShowAdd(false);
    setUrl(""); setAuthKey("");
    toast.success("✅ 웹사이트 등록됐어요!");
  };

  const remove = (idx: number) => {
    const removed = accounts[idx];
    const updated = accounts.filter((_, i) => i !== idx);
    setAccounts(updated);
    localStorage.setItem("platform_custom_list", JSON.stringify(updated));
    // blogauto_deploy_platforms에서도 해당 항목 제거
    try {
      const platforms = JSON.parse(localStorage.getItem("blogauto_deploy_platforms") || "[]");
      const updatedPlatforms = platforms.filter((p: any) => !(p.type === "custom" && p.name === removed._name));
      localStorage.setItem("blogauto_deploy_platforms", JSON.stringify(updatedPlatforms));
    } catch {}
    // 남은 커스텀 계정이 없으면 도메인 관련 키 정리
    if (updated.length === 0) {
      localStorage.removeItem("custom_domain");
      localStorage.removeItem("admin_custom_domain");
      localStorage.removeItem("blogauto_custom_domain");
    }
    toast.success("삭제됐어요");
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: "oklch(0.65 0.28 350)" }}>W</div>
          <h3 className="font-semibold text-foreground">일반 웹사이트 (커스텀)</h3>
        </div>
        <Button size="sm" className="gap-1.5 text-xs h-7"
          style={{ background: "oklch(0.65 0.28 350)", color: "white" }}
          onClick={() => setShowAdd(v => !v)}>
          <Plus className="w-3.5 h-3.5" /> 추가
        </Button>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        직접 제작한 사이트나 CMS에 Webhook으로 글을 자동 전달합니다
      </p>

      {accounts.length > 0 && (
        <div className="space-y-2 mb-4">
          {accounts.map((acc, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--color-emerald)" }} />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{acc._name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{acc.webhook_url}</p>
                </div>
              </div>
              <button onClick={() => remove(idx)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/20"
                style={{ color: "var(--muted-foreground)" }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
              WEBHOOK URL
            </label>
            <Input value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://mysite.com/api/posts" className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
              인증 키 값
            </label>
            <div className="relative">
              <Input type={showKey ? "text" : "password"} value={authKey}
                onChange={e => setAuthKey(e.target.value)}
                placeholder="Bearer {키} 또는 {키}"
                className="text-sm font-mono pr-10" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
                onClick={() => setShowKey(v => !v)}>
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 flex-1"
              style={{ background: "oklch(0.65 0.28 350)", color: "white" }}
              onClick={handleSave}>
              <CheckCircle2 className="w-4 h-4" /> 저장
            </Button>
            <Button variant="outline" onClick={() => { setShowAdd(false); setUrl(""); setAuthKey(""); }}>취소</Button>
          </div>
        </div>
      )}

      {accounts.length === 0 && !showAdd && (
        <p className="text-xs text-center py-2" style={{ color: "var(--muted-foreground)" }}>
          추가 버튼을 눌러 웹사이트를 등록하세요
        </p>
      )}
    </div>
  );
}

// ── 다중 플랫폼 섹션 컴포넌트 ──────────────────────
function PlatformSection({ title, color, logo, type, desc, link, fields }: {
  title: string; color: string; logo: string; type: string; desc: string; link: string;
  fields: { label: string; key: string; placeholder: string; secret?: boolean; isAuthHeader?: boolean }[];
}) {
  const STORAGE_KEY = `platform_${type}_list`;
  const [accounts, setAccounts] = React.useState<Record<string, string>[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [showAdd, setShowAdd] = React.useState(false);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({});
  const [savedIdx, setSavedIdx] = React.useState<number | null>(null);

  const save = () => {
    const required = fields.filter(f => !f.secret || f === fields[0]);
    for (const f of required) {
      if (!form[f.key]?.trim()) { toast.error(`${f.label}을 입력해주세요`); return; }
    }
    const name = form[fields[0].key] || `${title} ${accounts.length + 1}`;
    const entry = { ...form, _name: name, _type: type };
    const updated = [...accounts, entry];
    setAccounts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // 배포 플랫폼 목록도 업데이트
    const platforms = JSON.parse(localStorage.getItem("blogauto_deploy_platforms") || "[]");
    platforms.push({ id: Math.random().toString(36).slice(2), type, name });
    localStorage.setItem("blogauto_deploy_platforms", JSON.stringify(platforms));
    setForm({});
    setShowAdd(false);
    toast.success(`${title} 추가됨`);
  };

  const remove = (idx: number) => {
    const removed = accounts[idx];
    const updated = accounts.filter((_, i) => i !== idx);
    setAccounts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // blogauto_deploy_platforms에서도 해당 항목 제거
    try {
      const platforms = JSON.parse(localStorage.getItem("blogauto_deploy_platforms") || "[]");
      const updatedPlatforms = platforms.filter((p: any) => !(p.type === type && p.name === removed._name));
      localStorage.setItem("blogauto_deploy_platforms", JSON.stringify(updatedPlatforms));
    } catch {}
    toast.success("삭제됨");
  };

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: color }}>{logo}</div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:underline" style={{ color }}>
              발급받기 <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <Button size="sm" className="gap-1.5 text-xs h-7"
            style={{ background: color, color: "white" }}
            onClick={() => setShowAdd(v => !v)}>
            <Plus className="w-3.5 h-3.5" /> 추가
          </Button>
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>{desc}</p>

      {/* 등록된 계정 목록 */}
      {accounts.length > 0 && (
        <div className="space-y-2 mb-4">
          {accounts.map((account, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                <span className="text-sm text-foreground">{account._name || `${title} ${idx + 1}`}</span>
              </div>
              <button onClick={() => remove(idx)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
                style={{ color: "var(--muted-foreground)" }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 추가 폼 */}
      {showAdd && (
        <div className="space-y-3 p-4 rounded-xl" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          {fields.map(field => (
            <div key={field.key}>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>
                {field.label}
              </label>
              {field.secret ? (
                <div className="relative">
                  <Input className="text-sm font-mono pr-10"
                    type={showSecrets[field.key] ? "text" : "password"}
                    placeholder={field.placeholder}
                    value={form[field.key] || ""}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                    onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}>
                    {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <Input className="text-sm" placeholder={field.placeholder}
                  value={form[field.key] || ""}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))} />
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Button className="gap-2 flex-1" style={{ background: color, color: "white" }} onClick={save}>
              <CheckCircle2 className="w-4 h-4" /> 저장
            </Button>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm({}); }}>취소</Button>
          </div>
        </div>
      )}

      {accounts.length === 0 && !showAdd && (
        <p className="text-xs text-center py-2" style={{ color: "var(--muted-foreground)" }}>
          추가 버튼을 눌러 {title} 계정을 등록하세요
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  // 로그인 유저 직접 읽기 (순환 import 방지)
  const [user] = useState<{id:string;name:string;email:string}|null>(() => {
    try { return JSON.parse(localStorage.getItem("ba_user") || "null"); } catch { return null; }
  });
  const token = localStorage.getItem("ba_token") || "";
  const [adPlatform, setAdPlatform] = React.useState(() => userGetSettingsValue("selected_ad_platform") || "both");

  const saveAllToServer = async (settings: Record<string,string>) => {
    if (!token) return;
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "saveSettings", settings }),
      });
    } catch {}
  };

  const loadFromServer = async (): Promise<Record<string,string>> => {
    if (!token) return {};
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "loadSettings" }),
      });
      const d = await r.json();
      return d.settings || {};
    } catch { return {}; }
  };
  const [contentLang, setContentLang] = useState(
    () => userGetSettingsValue(SETTINGS_KEYS.CONTENT_LANG, "ko")
  );
  const [contentAI, setContentAI] = useState<ContentAIProvider>(
    () => (userGetSettingsValue(SETTINGS_KEYS.CONTENT_AI) as ContentAIProvider) || "gemini"
  );
  const [imageAI, setImageAI] = useState<ImageAIProvider>(
    () => (userGetSettingsValue(SETTINGS_KEYS.IMAGE_AI) as ImageAIProvider) || "gemini"
  );
  const [naverLicense, setNaverLicense] = useState(() => userGetSettingsValue(SETTINGS_KEYS.NAVER_LICENSE));
  const [naverSecret, setNaverSecret] = useState(() => userGetSettingsValue(SETTINGS_KEYS.NAVER_SECRET));
  const [naverCustomer, setNaverCustomer] = useState(() => userGetSettingsValue(SETTINGS_KEYS.NAVER_CUSTOMER));
  const [showNaverSecret, setShowNaverSecret] = useState(false);
  const [naverSaved, setNaverSaved] = useState(false);
  const [wpUrl, setWpUrl] = useState(() => userGetSettingsValue(SETTINGS_KEYS.WP_URL));
  const [wpUser, setWpUser] = useState(() => userGetSettingsValue(SETTINGS_KEYS.WP_USER));
  const [wpPass, setWpPass] = useState(() => userGetSettingsValue(SETTINGS_KEYS.WP_PASS));
  const [showWpPass, setShowWpPass] = useState(false);
  const [wpSaved, setWpSaved] = useState(false);

  // 네이버 블로그 배포
  const [naverBlogId, setNaverBlogId] = useState(() => userGetSettingsValue(SETTINGS_KEYS.NAVER_BLOG_ID));
  const [naverBlogToken, setNaverBlogToken] = useState(() => userGetSettingsValue(SETTINGS_KEYS.NAVER_BLOG_TOKEN));
  const [showNaverBlogToken, setShowNaverBlogToken] = useState(false);
  const [naverBlogSaved, setNaverBlogSaved] = useState(false);

  // 데이터랩 키는 관리자 페이지 전용
  const [datalabId, setDatalabId] = useState("");
  const [datalabSecret, setDatalabSecret] = useState("");
  const [datalabSaved, setDatalabSaved] = useState(false);
  const [showDatalabSecret, setShowDatalabSecret] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => userGetSettingsValue(SETTINGS_KEYS.WEBHOOK_URL));
  const [webhookKey, setWebhookKey] = useState(() => userGetSettingsValue(SETTINGS_KEYS.WEBHOOK_KEY));
  const [showWebhookKey, setShowWebhookKey] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true, deploy: true, revenue: true, error: true, weekly: false,
  });

  const handleSelectContentAI = (v: ContentAIProvider) => {
    setContentAI(v);
    userSet(SETTINGS_KEYS.CONTENT_AI, v);
    const s1 = { [SETTINGS_KEYS.CONTENT_AI]: v };
    saveSettingsToServer(s1); saveAllToServer(s1);
    toast.success(`글 생성 AI: ${CONTENT_AI_OPTIONS.find(o => o.value === v)?.label} 선택됨`);
  };

  const handleSelectImageAI = (v: ImageAIProvider) => {
    setImageAI(v);
    userSet(SETTINGS_KEYS.IMAGE_AI, v);
    const s2 = { [SETTINGS_KEYS.IMAGE_AI]: v };
    saveSettingsToServer(s2); saveAllToServer(s2);
    toast.success(`이미지 생성 AI: ${IMAGE_AI_OPTIONS.find(o => o.value === v)?.label} 선택됨`);
  };

  const handleSaveDatalab = () => {
    setDatalabSaved(true);
    toast.info("데이터랩 키는 관리자 페이지에서만 저장됩니다.");
    setTimeout(() => setDatalabSaved(false), 3000);
  };

  const handleSaveNaver = () => {
    if (!naverLicense || !naverSecret || !naverCustomer) {
      toast.error("네이버 API 정보를 모두 입력해주세요"); return;
    }
    userSet(SETTINGS_KEYS.NAVER_LICENSE, naverLicense);
    userSet(SETTINGS_KEYS.NAVER_SECRET, naverSecret);
    userSet(SETTINGS_KEYS.NAVER_CUSTOMER, naverCustomer);
    const sn = { [SETTINGS_KEYS.NAVER_LICENSE]: naverLicense, [SETTINGS_KEYS.NAVER_SECRET]: naverSecret, [SETTINGS_KEYS.NAVER_CUSTOMER]: naverCustomer };
    saveSettingsToServer(sn); saveAllToServer(sn);
    setNaverSaved(true);
    toast.success("네이버 검색광고 API 저장됨 ✅ 모든 기기 자동 적용");
    setTimeout(() => setNaverSaved(false), 3000);
  };

  const handleSaveWordPress = () => {
    if (!wpUrl || !wpUser || !wpPass) {
      toast.error("WordPress 정보를 모두 입력해주세요"); return;
    }
    userSet(SETTINGS_KEYS.WP_URL, wpUrl);
    userSet(SETTINGS_KEYS.WP_USER, wpUser);
    userSet(SETTINGS_KEYS.WP_PASS, wpPass);
    const sw = { [SETTINGS_KEYS.WP_URL]: wpUrl, [SETTINGS_KEYS.WP_USER]: wpUser, [SETTINGS_KEYS.WP_PASS]: wpPass };
    saveSettingsToServer(sw); saveAllToServer(sw);
    setWpSaved(true);
    toast.success("WordPress 설정 저장됨 ✅ 모든 기기 자동 적용");
    setTimeout(() => setWpSaved(false), 3000);
  };

  const handleSaveNaverBlog = () => {
    if (!naverBlogId || !naverBlogToken) {
      toast.error("네이버 블로그 정보를 모두 입력해주세요"); return;
    }
    userSet(SETTINGS_KEYS.NAVER_BLOG_ID, naverBlogId);
    userSet(SETTINGS_KEYS.NAVER_BLOG_TOKEN, naverBlogToken);
    const snb = { [SETTINGS_KEYS.NAVER_BLOG_ID]: naverBlogId, [SETTINGS_KEYS.NAVER_BLOG_TOKEN]: naverBlogToken };
    saveSettingsToServer(snb); saveAllToServer(snb);
    setNaverBlogSaved(true);
    toast.success("네이버 블로그 설정 저장됨 ✅ 모든 기기 자동 적용");
    setTimeout(() => setNaverBlogSaved(false), 3000);
  };

  const handleSaveWebhook = () => {
    if (!webhookUrl) {
      toast.error("Webhook URL을 입력해주세요"); return;
    }
    userSet(SETTINGS_KEYS.WEBHOOK_URL, webhookUrl);
    userSet(SETTINGS_KEYS.WEBHOOK_KEY, webhookKey);
    const shk = { [SETTINGS_KEYS.WEBHOOK_URL]: webhookUrl, [SETTINGS_KEYS.WEBHOOK_KEY]: webhookKey };
    saveSettingsToServer(shk); saveAllToServer(shk);
    setWebhookSaved(true);
    toast.success("웹사이트 설정 저장됨 ✅ 모든 기기 자동 적용");
    setTimeout(() => setWebhookSaved(false), 3000);
  };

  // 글 생성 AI 키 (글 생성 AI 섹션에서만 사용)
  const contentRequiredKeys = Array.from(
    new Map(
      [CONTENT_AI_OPTIONS.find(o => o.value === contentAI)]
        .filter(Boolean)
        .filter(o => o!.keyStorageKey)
        .map(o => [o!.keyStorageKey, o!])
    ).values()
  );

  // 이미지 AI 키 (이미지 AI 섹션에서만 사용, 글 생성 AI 키와 같으면 중복 제거)
  const imageRequiredKeys = Array.from(
    new Map(
      [IMAGE_AI_OPTIONS.find(o => o.value === imageAI)]
        .filter(Boolean)
        .filter(o => o!.keyStorageKey)
        .map(o => [o!.keyStorageKey, o!])
    ).values()
  );

  // API 키 관리 섹션에는 중복 없이 둘 다 표시
  const requiredKeys = Array.from(
    new Map(
      [...contentRequiredKeys, ...imageRequiredKeys].map(o => [o.keyStorageKey, o])
    ).values()
  );

  // 모바일 동기화
  const [syncCode, setSyncCode] = useState("");
  const [importCode, setImportCode] = useState("");
  const [showImport, setShowImport] = useState(false);

  const handleExportSettings = () => {
    const keys = Object.values(SETTINGS_KEYS);
    const data: Record<string, string> = {};
    keys.forEach(k => { const v = userGetSettingsValue(k); if (v) data[k] = v; });
    const code = btoa(JSON.stringify(data));
    setSyncCode(code);
    navigator.clipboard.writeText(code).then(() => toast.success("설정 코드가 클립보드에 복사됐어요!"));
  };

  const handleImportSettings = () => {
    try {
      const data = JSON.parse(atob(importCode.trim()));
      Object.entries(data).forEach(([k, v]) => userSet(k, v as string));
      toast.success("설정이 가져와졌어요! 페이지를 새로고침해주세요.");
      setShowImport(false);
      setImportCode("");
    } catch {
      toast.error("올바르지 않은 코드예요");
    }
  };

  const [settingsTab, setSettingsTab] = React.useState("ai");

  return (
    <Layout>
      <div className="p-6"><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-6 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            설정
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            AI 툴, API 키, 발행 설정을 관리합니다
          </p>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <button className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: settingsTab === "ai" ? "var(--color-emerald)" : "transparent", color: settingsTab === "ai" ? "white" : "var(--muted-foreground)" }}
            onClick={() => setSettingsTab("ai")}>🤖 AI 설정</button>
          <button className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: settingsTab === "platform" ? "var(--color-emerald)" : "transparent", color: settingsTab === "platform" ? "white" : "var(--muted-foreground)" }}
            onClick={() => setSettingsTab("platform")}>📤 발행 플랫폼</button>
          <button className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: settingsTab === "sync" ? "var(--color-emerald)" : "transparent", color: settingsTab === "sync" ? "white" : "var(--muted-foreground)" }}
            onClick={() => setSettingsTab("sync")}>🔄 동기화</button>
        </div>

        {settingsTab === "ai" && (
          <div className="space-y-6">
        {/* 글 생성 AI 선택 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">글 생성 AI 선택</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONTENT_AI_OPTIONS.map((opt) => (
              <button key={opt.value}
                className="rounded-xl p-4 text-left transition-all active:scale-[0.97] relative overflow-hidden"
                style={{
                  background: contentAI === opt.value ? `${opt.logoColor}18` : "var(--background)",
                  border: `2px solid ${contentAI === opt.value ? opt.logoColor : "var(--border)"}`,
                  boxShadow: contentAI === opt.value ? `0 0 20px ${opt.logoColor}30` : "none",
                  outline: contentAI === opt.value ? `2px solid ${opt.logoColor}50` : "none",
                  outlineOffset: "2px",
                }}
                onClick={() => handleSelectContentAI(opt.value)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                    style={{ background: opt.logoColor }}>{opt.logo}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: opt.badge === "무료" ? "oklch(0.696 0.17 162.48 / 20%)" : "oklch(0.769 0.188 70.08 / 20%)", color: opt.badge === "무료" ? "var(--color-emerald)" : "var(--color-amber-brand)" }}>
                    {opt.badge}
                  </span>
                </div>
                <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{opt.desc}</div>
                {contentAI === opt.value && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "var(--color-emerald)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 선택됨
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 생성 AI 선택 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5" style={{ color: "oklch(0.75 0.12 300)" }} />
            <h3 className="font-semibold text-foreground">이미지 생성 AI 선택</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {IMAGE_AI_OPTIONS.map((opt: any) => {
              const selected = imageAI === opt.value;
              return (
                <button key={opt.value}
                  className="rounded-2xl p-4 text-left transition-all relative overflow-hidden active:scale-[0.97]"
                  style={{
                    background: selected ? `${opt.logoColor}18` : "var(--background)",
                    border: `2px solid ${selected ? opt.logoColor : "var(--border)"}`,
                    boxShadow: selected ? `0 0 24px ${opt.logoColor}40` : "none",
                    outline: selected ? `2px solid ${opt.logoColor}60` : "none",
                    outlineOffset: "2px",
                  }}
                  onClick={() => handleSelectImageAI(opt.value)}>
                  {selected && (
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{ background: `linear-gradient(135deg, ${opt.logoColor}, transparent)` }} />
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white"
                        style={{ background: opt.logoColor }}>{opt.logo}</div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{opt.label}</div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: opt.badgeColor + "25",
                            color: opt.badgeColor,
                          }}>
                          {opt.badge}
                        </span>
                      </div>
                    </div>
                    {selected && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: opt.logoColor }}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* 설명 */}
                  <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>{opt.desc}</p>

                  {/* 장단점 */}
                  {opt.pros && (
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <span className="text-xs mt-0.5" style={{ color: "var(--color-emerald)" }}>✓</span>
                        <span className="text-xs" style={{ color: "var(--color-emerald)" }}>{opt.pros}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.22 25)" }}>✗</span>
                        <span className="text-xs" style={{ color: "oklch(0.65 0.22 25)" }}>{opt.cons}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* API 키 관리 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
            <h3 className="font-semibold text-foreground">API 키 관리</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            선택한 AI에 필요한 키만 표시됩니다. 키는 브라우저에 저장됩니다.
          </p>


          <div className="space-y-4">
            {requiredKeys.map((opt) => (
              <ApiKeyInput key={opt.keyStorageKey} label={opt.keyLabel}
                placeholder={opt.keyPlaceholder} storageKey={opt.keyStorageKey} link={opt.keyLink} />
            ))}
          </div>
        </div>

          </div>
        )}

        {settingsTab === "platform" && (
          <div className="space-y-6">
        {/* 네이버 검색광고 API */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: "#03C75A" }} />
              <h3 className="font-semibold text-foreground">네이버 검색광고 API</h3>
            </div>
            <a href="https://manage.searchad.naver.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:underline"
              style={{ color: "#03C75A" }}>
              발급받기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            키워드 수집용 · 로그인 후 우측 상단 계정명 → API 관리
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Access License</label>
              <Input className="text-sm font-mono" placeholder="발급된 라이선스 키"
                value={naverLicense} onChange={e => setNaverLicense(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Secret Key</label>
              <div className="relative">
                <Input className="text-sm font-mono pr-10" type={showNaverSecret ? "text" : "password"}
                  placeholder="시크릿 키" value={naverSecret} onChange={e => setNaverSecret(e.target.value)} />
                <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                  onClick={() => setShowNaverSecret(v => !v)}>
                  {showNaverSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Customer ID</label>
              <Input className="text-sm font-mono" placeholder="고객 ID (숫자)"
                value={naverCustomer} onChange={e => setNaverCustomer(e.target.value)} />
            </div>
            <Button className="gap-2"
              style={{ background: naverSaved ? "var(--color-emerald)" : "#03C75A", color: "white" }}
              onClick={handleSaveNaver}>
              {naverSaved ? <CheckCircle2 className="w-4 h-4" /> : <Key className="w-4 h-4" />}
              {naverSaved ? "저장됨" : "네이버 API 저장"}
            </Button>
          </div>
        </div>

        {/* 네이버 데이터랩 API */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: "oklch(0.75 0.18 200)" }} />
              <h3 className="font-semibold text-foreground">네이버 데이터랩 API</h3>
            </div>
            <a href="https://developers.naver.com/apps/#/register" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs hover:underline"
              style={{ color: "oklch(0.75 0.18 200)" }}>
              발급받기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            키워드 디바이스·성별·연령 분석용 · 네이버 개발자센터에서 앱 등록 후 발급
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Client ID</label>
              <Input className="text-sm font-mono" placeholder="네이버 Client ID"
                value={datalabId} onChange={e => setDatalabId(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>Client Secret</label>
              <div className="relative">
                <Input className="text-sm font-mono pr-10" type={showDatalabSecret ? "text" : "password"}
                  placeholder="Client Secret" value={datalabSecret} onChange={e => setDatalabSecret(e.target.value)} />
                <button className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}
                  onClick={() => setShowDatalabSecret(v => !v)}>
                  {showDatalabSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button className="gap-2"
              style={{ background: datalabSaved ? "var(--color-emerald)" : "oklch(0.75 0.18 200)", color: "white" }}
              onClick={handleSaveDatalab}>
              {datalabSaved ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {datalabSaved ? "관리자 전용" : "관리자 페이지에서 설정"}
            </Button>
          </div>
        </div>

        {/* ── 수익 플랫폼 선택 (글/이미지 최적화) ── */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "2px solid oklch(0.769 0.188 70.08/30%)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
              <h3 className="font-semibold text-foreground">수익 플랫폼 최적화</h3>
            </div>
            <button onClick={() => { const el = document.getElementById("adPlatformGuidePopup"); if(el) el.style.display=el.style.display==="none"?"flex":"none"; }}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: "rgba(245,166,35,0.1)", color: "var(--color-amber-brand)", border: "1px solid rgba(245,166,35,0.25)" }}>
              ❓ 사용방법
            </button>
          </div>

          {/* 팝업 */}
          <div id="adPlatformGuidePopup" style={{display:"none",position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)",alignItems:"center",justifyContent:"center",padding:"16px"}}>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:"24px",width:"100%",maxWidth:"540px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.7)"}}>
              <div style={{padding:"24px 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontWeight:900,fontSize:"1.05rem",letterSpacing:"-0.03em"}}>💰 수익 플랫폼 최적화 가이드</div>
                <button onClick={() => { const el = document.getElementById("adPlatformGuidePopup"); if(el) el.style.display="none"; }}
                  style={{width:32,height:32,borderRadius:9,background:"var(--card2)",border:"none",cursor:"pointer",color:"var(--muted-foreground)",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
              </div>
              <p style={{padding:"8px 24px 0",fontSize:"0.8rem",color:"var(--muted-foreground)"}}>글을 쓸 때 어떤 광고 수익 방식에 맞게 최적화할지 선택하는 기능이에요</p>

              <div style={{padding:"20px 24px 24px",display:"flex",flexDirection:"column",gap:14,fontSize:"0.84rem"}}>

                {/* 이게 뭔가요 */}
                <div style={{background:"rgba(245,166,35,0.06)",border:"1px solid rgba(245,166,35,0.2)",borderRadius:14,padding:16}}>
                  <div style={{fontWeight:800,color:"var(--color-amber-brand)",marginBottom:8}}>📌 이 기능이 뭔가요?</div>
                  <div style={{color:"var(--muted-foreground)",lineHeight:1.75}}>
                    블로그 글을 자동으로 쓸 때 <strong style={{color:"var(--foreground)"}}>어떤 방식으로 수익을 낼 건지</strong>에 따라 글쓰기 스타일이 달라져요.<br/>
                    예를 들어 애드센스는 클릭을 유도하는 글이, 애드포스트는 오래 읽게 만드는 글이 유리해요.
                  </div>
                </div>

                {/* 애드센스 */}
                <div style={{background:"rgba(66,133,244,0.06)",border:"1px solid rgba(66,133,244,0.2)",borderRadius:14,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:32,height:32,borderRadius:9,background:"#4285F4",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"white",fontSize:"0.9rem",flexShrink:0}}>G</div>
                    <div>
                      <div style={{fontWeight:800,color:"#4285F4"}}>Google AdSense 선택 시</div>
                      <div style={{fontSize:"0.75rem",color:"var(--muted-foreground)"}}>수익 = 광고 클릭 × CPC 단가</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,color:"var(--muted-foreground)",lineHeight:1.65}}>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#4285F4",fontWeight:700,flexShrink:0}}>▸</span><span><strong style={{color:"var(--foreground)"}}>정보성 키워드 밀도</strong>를 높게 → 광고 관련 키워드가 글에 자연스럽게 많이 포함</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#4285F4",fontWeight:700,flexShrink:0}}>▸</span><span><strong style={{color:"var(--foreground)"}}>클릭 유도 문구</strong> 삽입 → "자세히 알아보기", "확인해보세요" 등</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#4285F4",fontWeight:700,flexShrink:0}}>▸</span><span><strong style={{color:"var(--foreground)"}}>단락을 짧게</strong> → 광고가 자주 노출될 수 있도록 문단 구성</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#4285F4",fontWeight:700,flexShrink:0}}>▸</span><span>IT·재테크·리뷰 등 <strong style={{color:"var(--foreground)"}}>CPC 단가 높은 주제</strong> 강조</span></div>
                  </div>
                  <div style={{marginTop:10,padding:"8px 12px",borderRadius:10,background:"rgba(66,133,244,0.08)",fontSize:"0.78rem",color:"#4285F4",fontWeight:600}}>
                    💡 추천 블로그: IT 리뷰, 금융·보험, 제품 비교, 건강 정보
                  </div>
                </div>

                {/* 애드포스트 */}
                <div style={{background:"rgba(3,199,90,0.06)",border:"1px solid rgba(3,199,90,0.2)",borderRadius:14,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:32,height:32,borderRadius:9,background:"#03C75A",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"white",fontSize:"0.9rem",flexShrink:0}}>N</div>
                    <div>
                      <div style={{fontWeight:800,color:"#03C75A"}}>Naver AdPost 선택 시</div>
                      <div style={{fontSize:"0.75rem",color:"var(--muted-foreground)"}}>수익 = 광고 노출 × CPM 단가</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,color:"var(--muted-foreground)",lineHeight:1.65}}>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#03C75A",fontWeight:700,flexShrink:0}}>▸</span><span><strong style={{color:"var(--foreground)"}}>감성적 스토리텔링</strong> 방식 → 공감을 유도해 오래 읽게 만들기</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#03C75A",fontWeight:700,flexShrink:0}}>▸</span><span><strong style={{color:"var(--foreground)"}}>이미지 삽입 위치</strong>를 많이 → 스크롤을 유도해 체류시간 증가</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#03C75A",fontWeight:700,flexShrink:0}}>▸</span><span><strong style={{color:"var(--foreground)"}}>문단을 길게</strong> → 읽는 데 시간이 걸리도록 구성</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#03C75A",fontWeight:700,flexShrink:0}}>▸</span><span>맛집·여행·일상 등 <strong style={{color:"var(--foreground)"}}>공감형 주제</strong> 강조</span></div>
                  </div>
                  <div style={{marginTop:10,padding:"8px 12px",borderRadius:10,background:"rgba(3,199,90,0.08)",fontSize:"0.78rem",color:"#03C75A",fontWeight:600}}>
                    💡 추천 블로그: 맛집, 여행, 육아, 일상 다이어리, 뷰티
                  </div>
                </div>

                {/* 둘 다 */}
                <div style={{background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.2)",borderRadius:14,padding:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:32,height:32,borderRadius:9,background:"#a855f7",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"white",fontSize:"0.9rem",flexShrink:0}}>★</div>
                    <div>
                      <div style={{fontWeight:800,color:"#a855f7"}}>둘 다 선택 시 (기본값)</div>
                      <div style={{fontSize:"0.75rem",color:"var(--muted-foreground)"}}>애드센스 + 애드포스트 통합 최적화</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,color:"var(--muted-foreground)",lineHeight:1.65}}>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#a855f7",fontWeight:700,flexShrink:0}}>▸</span><span>두 플랫폼의 장점을 <strong style={{color:"var(--foreground)"}}>균형있게</strong> 적용</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#a855f7",fontWeight:700,flexShrink:0}}>▸</span><span>처음 시작하거나 <strong style={{color:"var(--foreground)"}}>어떤 걸 선택할지 모를 때</strong> 추천</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"#a855f7",fontWeight:700,flexShrink:0}}>▸</span><span>두 플랫폼 <strong style={{color:"var(--foreground)"}}>동시 운영</strong>할 때 유리</span></div>
                  </div>
                </div>

                {/* 어디에 적용되나요 */}
                <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:14,padding:16}}>
                  <div style={{fontWeight:800,color:"var(--color-emerald)",marginBottom:8}}>🔧 어디에 적용되나요?</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,color:"var(--muted-foreground)",lineHeight:1.65}}>
                    <div style={{display:"flex",gap:8}}><span style={{color:"var(--color-emerald)",fontWeight:700,flexShrink:0}}>✓</span><span><strong style={{color:"var(--foreground)"}}>콘텐츠 생성</strong> → 글쓰기 스타일, 문단 구성, 문체 변경</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"var(--color-emerald)",fontWeight:700,flexShrink:0}}>✓</span><span><strong style={{color:"var(--foreground)"}}>키워드 수집</strong> → 플랫폼에 맞는 키워드 정렬 방식 변경</span></div>
                    <div style={{display:"flex",gap:8}}><span style={{color:"var(--color-emerald)",fontWeight:700,flexShrink:0}}>✓</span><span><strong style={{color:"var(--foreground)"}}>이미지 생성</strong> → 광고 친화적 or 감성적 이미지 스타일 변경</span></div>
                  </div>
                </div>

                <button onClick={() => { const el = document.getElementById("adPlatformGuidePopup"); if(el) el.style.display="none"; }}
                  style={{width:"100%",padding:"12px",borderRadius:14,background:"linear-gradient(135deg,#4285F4,#a855f7)",color:"white",fontWeight:800,fontSize:"0.9rem",border:"none",cursor:"pointer"}}>
                  ✅ 이해했어요! 설정하러 가기
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            선택한 플랫폼에 맞게 글 스타일과 이미지가 자동 최적화됩니다
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "adsense", label: "Google AdSense", desc: "CPC 최적화 · 클릭 유도형 글", color: "#4285F4", logo: "G",
                tip: "정보성 키워드 밀도 높게, 광고 친화적 단락" },
              { id: "adpost", label: "Naver AdPost", desc: "CPM 최적화 · 체류시간 늘리기", color: "#03C75A", logo: "N",
                tip: "감성적 스토리, 이미지 풍부하게, 공감 유도" },
              { id: "both", label: "둘 다", desc: "통합 최적화", color: "#a855f7", logo: "★",
                tip: "균형잡힌 구성으로 양쪽 모두 최적화" },
            ].map(platform => {
              const selected = adPlatform === platform.id;
              return (
                <button key={platform.id}
                  className="rounded-xl p-4 text-left transition-all"
                  style={{
                    background: selected ? `${platform.color}18` : "var(--background)",
                    border: `2px solid ${selected ? platform.color : "var(--border)"}`,
                    boxShadow: selected ? `0 0 0 3px ${platform.color}22, 0 4px 20px ${platform.color}25` : "none",
                    transform: selected ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                  onClick={() => {
                    userSet("selected_ad_platform", platform.id);
                    setAdPlatform(platform.id);
                    saveSettingsToServer({ selected_ad_platform: platform.id });
                    toast.success(`${platform.label} 최적화 모드로 설정됐어요!`);
                  }}
                  onMouseEnter={e => { if(!selected) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { if(!selected) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                      style={{ background: platform.color, boxShadow: selected ? `0 4px 12px ${platform.color}50` : "none" }}>{platform.logo}</div>
                    {selected
                      ? <div style={{display:"flex",alignItems:"center",gap:4,fontSize:"0.7rem",fontWeight:800,color:platform.color,background:`${platform.color}15`,padding:"3px 8px",borderRadius:100}}>
                          <CheckCircle2 className="w-3 h-3" /> 선택됨
                        </div>
                      : <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid var(--border)`}}/>
                    }
                  </div>
                  <div className="text-sm font-semibold text-foreground">{platform.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{platform.desc}</div>
                  <div className="text-xs mt-1.5 px-2 py-1 rounded-lg"
                    style={{ background: `${platform.color}10`, color: platform.color }}>
                    {platform.tip}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 배포 대상 설정 (다중 추가 가능) ─── */}
        <div className="rounded-xl p-5" style={{ background: "oklch(0.696 0.17 162.48 / 6%)", border: "2px solid oklch(0.696 0.17 162.48 / 25%)" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
              <h3 className="font-semibold text-foreground">배포 대상 설정</h3>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            각 플랫폼마다 여러 개 추가 가능 · 배포 페이지에서 선택해서 발행
          </p>
        </div>

        {/* 블로거 (Blogger) */}
        <PlatformSection
          title="블로거 (Blogger)" color="#FF5722" logo="B" type="blogger"
          desc="구글 블로거 자동 발행 · Google Cloud Console에서 API 키 발급"
          link="https://console.cloud.google.com/apis/credentials"
          fields={[
            { label: "Blog ID", key: "blogger_blog_id", placeholder: "블로그 ID (숫자)" },
            { label: "Google API Key", key: "blogger_api_key", placeholder: "AIza...", secret: true },
            { label: "OAuth Client ID", key: "blogger_client_id", placeholder: "Client ID" },
            { label: "OAuth Client Secret", key: "blogger_client_secret", placeholder: "Client Secret", secret: true },
          ]}
        />

        {/* 일반 웹사이트 */}
        {/* 커스텀 웹사이트 - 인증 방식 선택 포함 */}
        <CustomWebhookSection />

        {/* WordPress */}
        <PlatformSection
          title="WordPress" color="#21759B" logo="WP" type="wordpress"
          desc="WordPress 관리자 → 사용자 → 애플리케이션 비밀번호에서 발급"
          link=""
          fields={[
            { label: "사이트 URL", key: "wp_url", placeholder: "https://myblog.com" },
            { label: "사용자명", key: "wp_username", placeholder: "admin" },
            { label: "앱 비밀번호", key: "wp_app_password", placeholder: "xxxx xxxx xxxx", secret: true },
          ]}
        />

        {/* 미디엄 (Medium) */}
        <MediumSection />

{/* 쿠팡파트너스 */}
        <CoupangSection />

        {/* 구글 서치콘솔 */}
        <UserGSCSection />

          </div>
        )}

        {settingsTab === "sync" && (
          <div className="space-y-6">
        {/* 모바일 ↔ PC 자동 동기화 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "2px solid oklch(0.6 0.15 220 / 40%)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5" style={{ color: "oklch(0.6 0.15 220)" }} />
            <h3 className="font-semibold text-foreground">모바일 ↔ PC 설정 자동 동기화</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            같은 계정으로 로그인하면 모든 설정이 자동으로 동기화됩니다.
          </p>

          {user ? (
            <div className="space-y-3">
              {/* 로그인 상태 표시 */}
              <div className="rounded-xl p-4 flex items-center gap-3"
                style={{ background: "oklch(0.696 0.17 162.48/10%)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg font-black text-white"
                  style={{ background: "var(--color-emerald)" }}>✓</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-emerald)" }}>
                    자동 동기화 활성화됨
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                    <strong style={{ color: "var(--foreground)" }}>{user.name}</strong> 계정 · 설정 저장 시 서버에 자동 백업
                  </p>
                </div>
              </div>

              {/* 지금 바로 전체 저장 */}
              <Button className="w-full gap-2 h-11 font-semibold"
                style={{ background: "oklch(0.6 0.15 220)", color: "white" }}
                onClick={async () => {
                  const allData: Record<string,string> = {};
                  Object.values(SETTINGS_KEYS).forEach(k => {
                    const v = userGetSettingsValue(k); if (v) allData[k] = v;
                  });
                  await saveAllToServer(allData);
                  toast.success("✅ 모든 설정이 서버에 저장됐어요! 다른 기기에서 로그인하면 자동 적용됩니다");
                }}>
                <Upload className="w-4 h-4" /> 지금 모든 설정 서버에 저장하기
              </Button>

              {/* 서버에서 불러오기 */}
              <Button variant="outline" className="w-full gap-2 h-11 font-semibold"
                onClick={async () => {
                  const settings = await loadFromServer();
                  if (!settings || Object.keys(settings).length === 0) {
                    toast.info("서버에 저장된 설정이 없어요. 위 버튼으로 먼저 저장해주세요");
                    return;
                  }
                  Object.entries(settings).forEach(([k,v]) => userSet(k, v as string));
                  toast.success("✅ 서버에서 최신 설정을 불러왔어요!");
                  setTimeout(() => window.location.reload(), 1200);
                }}>
                <RefreshCw className="w-4 h-4" /> 서버에서 최신 설정 불러오기
              </Button>

              <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                💡 API 키 저장 시 서버에도 자동 백업돼요. 모바일에서 로그인만 하면 자동 적용됩니다.
              </p>
            </div>
          ) : (
            <div className="rounded-xl p-5 flex items-start gap-4"
              style={{ background: "oklch(0.769 0.188 70.08/8%)", border: "1px solid oklch(0.769 0.188 70.08/30%)" }}>
              <div className="text-2xl">🔒</div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-amber-brand)" }}>
                  로그인하면 자동 동기화
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  로그인하면 API 키와 모든 설정이 서버에 저장되고,
                  모바일에서 로그인하면 자동으로 적용돼요. 링크나 코드 입력 불필요!
                </p>
                <Button size="sm" className="mt-3 gap-1.5"
                  style={{ background: "var(--color-amber-brand)", color: "white" }}
                  onClick={() => window.location.href = "/login"}>
                  로그인하러 가기
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 테마 설정 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">테마 설정</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "dark", label: "다크 모드", icon: Moon, desc: "어두운 배경" },
              { value: "light", label: "라이트 모드", icon: Sun, desc: "밝은 배경" },
              { value: "system", label: "시스템 설정", icon: Monitor, desc: "OS 따라가기" },
            ].map((t) => (
              <button key={t.value}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: theme === t.value ? "oklch(0.696 0.17 162.48 / 15%)" : "var(--background)",
                  border: `2px solid ${theme === t.value ? "oklch(0.696 0.17 162.48 / 60%)" : "var(--border)"}`,
                }}
                onClick={() => {
                  if (t.value !== "system") { setTheme(t.value as "dark" | "light"); toast.success(`${t.label}으로 변경됨`); }
                  else toast.info("시스템 모드 준비 중");
                }}>
                <t.icon className="w-6 h-6 mb-2"
                  style={{ color: theme === t.value ? "var(--color-emerald)" : "var(--muted-foreground)" }} />
                <div className="text-sm font-semibold text-foreground">{t.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 언어 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5" style={{ color: "var(--color-amber-brand)" }} />
            <h3 className="font-semibold text-foreground">콘텐츠 생성 언어</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LANGUAGES.map((lang) => (
              <button key={lang.code}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all"
                style={{
                  background: contentLang === lang.code ? "oklch(0.769 0.188 70.08 / 15%)" : "var(--background)",
                  border: `1px solid ${contentLang === lang.code ? "oklch(0.769 0.188 70.08 / 50%)" : "var(--border)"}`,
                  color: contentLang === lang.code ? "var(--color-amber-brand)" : "var(--foreground)",
                }}
                onClick={() => {
                  setContentLang(lang.code);
                  userSet(SETTINGS_KEYS.CONTENT_LANG, lang.code);
                  toast.success(`콘텐츠 언어: ${lang.label}`);
                }}>
                <span>{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5" style={{ color: "oklch(0.6 0.15 220)" }} />
            <h3 className="font-semibold text-foreground">알림 설정</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "email", label: "이메일 알림", desc: "중요 이벤트를 이메일로 수신" },
              { key: "deploy", label: "배포 완료 알림", desc: "글 발행 성공/실패 시 알림" },
              { key: "revenue", label: "수익 알림", desc: "일일 수익 현황 알림" },
              { key: "error", label: "오류 알림", desc: "시스템 오류 발생 시 즉시 알림" },
              { key: "weekly", label: "주간 리포트", desc: "매주 월요일 성과 리포트 발송" },
            ].map((notif) => (
              <div key={notif.key}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <div>
                  <div className="text-sm font-medium text-foreground">{notif.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{notif.desc}</div>
                </div>
                <Switch
                  checked={notifications[notif.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => {
                    setNotifications(prev => ({ ...prev, [notif.key]: checked }));
                    toast.success(`${notif.label} ${checked ? "활성화" : "비활성화"}됨`);
                  }} />
              </div>
            ))}
          </div>
        </div>

        {/* 내보내기 */}
        <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5" style={{ color: "var(--color-emerald)" }} />
            <h3 className="font-semibold text-foreground">내보내기 & 다운로드</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "전체 프로젝트 ZIP 다운로드", desc: "모든 설정, 콘텐츠, 이미지를 ZIP으로 다운로드" },
              { label: "콘텐츠 CSV 내보내기", desc: "생성된 모든 글 목록을 CSV로" },
              { label: "키워드 데이터 내보내기", desc: "수집된 키워드 데이터를 Excel로" },
            ].map((item) => (
              <div key={item.label}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors cursor-pointer"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                onClick={() => toast.info(`${item.label} 준비 중`)}>
                <div>
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
              </div>
            ))}
          </div>
        </div>

          </div>
        )}

        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, oklch(0.696 0.17 162.48/10%), oklch(0.75 0.12 300/10%))", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: "oklch(0.75 0.12 300)" }} />
                <h3 className="font-semibold text-foreground">작업 대시보드</h3>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>오른쪽 공간을 작업 요약 공간으로 채웠어요. 현재 선택된 AI와 연결 상태를 한눈에 볼 수 있습니다.</p>
              <div className="space-y-3">
                <div className="rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>글 생성 AI</div>
                  <div className="text-sm font-semibold text-foreground">{CONTENT_AI_OPTIONS.find(opt => opt.value === contentAI)?.label || "미선택"}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>이미지 생성 AI</div>
                  <div className="text-sm font-semibold text-foreground">{IMAGE_AI_OPTIONS.find(opt => opt.value === imageAI)?.label || "미선택"}</div>
                </div>
                <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>연결 상태</span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)" }}>준비 완료</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      ["네이버 블로그", !!userGetSettingsValue("naver_blog_id")],
                      ["웹사이트", !!userGetSettingsValue("webhook_url")],
                      ["WordPress", !!userGetSettingsValue("wp_url")],
                    ].map(([label, ok]) => (
                      <div key={String(label)} className="flex items-center justify-between text-sm">
                        <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
                        <span style={{ color: ok ? "var(--color-emerald)" : "var(--color-amber-brand)" }}>{ok ? "연결" : "설정 필요"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div></div>
    </Layout>
  );
}
//fix
