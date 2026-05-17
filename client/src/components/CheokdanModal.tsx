// CheokdanModal.tsx — 체험단 블로그 작성 도우미 v1.0
import { useState, useRef } from "react";
import {
  X, Sun, Moon, Copy, Plus, Trash2, Sparkles,
  MapPin, Calendar, Users, Utensils, Star,
  CheckCircle2, Camera, Loader2, ChevronRight,
  BookOpen, PenLine, Rocket, Hash
} from "lucide-react";
import { getContentProvider, getAPIKey } from "@/lib/ai-config";
import { toast } from "sonner";

interface Menu { name: string; price: string }
interface Props { isOpen: boolean; onClose: () => void }

const CATEGORIES = ["한식","일식","중식","양식","카페","베이커리","치킨","피자","분식","해산물","고기구이","술집","디저트","기타"];
const COMPANIONS = ["혼자","연인","친구","가족","동료"];

function Stars({ value, onChange, color }: { value: number; onChange: (n:number)=>void; color: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)}
          onClick={()=>onChange(n)}
          style={{ background:"none", border:"none", cursor:"pointer", padding:2, fontSize:22,
            filter: (hover||value) >= n ? "none" : "grayscale(1) opacity(0.3)",
            transform: (hover||value) >= n ? "scale(1.15)" : "scale(1)",
            transition: "all .15s", color }}>
          ★
        </button>
      ))}
      <span style={{ fontSize:12, opacity:.6, alignSelf:"center", marginLeft:4 }}>{value}/5</span>
    </div>
  );
}

const GUIDE_STEPS = [
  {
    icon: <BookOpen size={20}/>, color: "#ff6b6b", bg: "rgba(255,107,107,0.12)",
    title: "체험단이란?",
    desc: "네이버 플레이스에 등록된 가게를 직접 방문해 음식·서비스·분위기를 경험하고, 블로그에 솔직한 후기를 작성하는 활동이에요.",
    tips: ["방문 전 가게 외관·간판 사진부터 찍어두세요","방문 당일 작성할수록 기억이 생생해요","영수증·메뉴판도 함께 촬영하면 글에 도움이 돼요"]
  },
  {
    icon: <Camera size={20}/>, color: "#4d96ff", bg: "rgba(77,150,255,0.12)",
    title: "📸 사진 15장 촬영 가이드",
    desc: "AI가 글에 사진 위치를 자동 표시해줘요. 아래 순서대로 15장을 찍어두면 완벽해요!",
    tips: [
      "① 가게 외관·간판 (2장)",
      "② 내부 분위기·인테리어 (2장)",
      "③ 메뉴판 또는 주문표 (1장)",
      "④ 음식 나오기 전 세팅 (1장)",
      "⑤ 메인 메뉴 클로즈업 (3장)",
      "⑥ 사이드·반찬·음료 (2장)",
      "⑦ 먹는 모습·분위기샷 (2장)",
      "⑧ 디저트·후식 또는 영수증 (1장)",
      "⑨ 가게 외부·골목 마무리샷 (1장)",
    ]
  },
  {
    icon: <Sparkles size={20}/>, color: "#6bcb77", bg: "rgba(107,203,119,0.12)",
    title: "🎬 영상 3개 촬영 가이드",
    desc: "짧은 영상(15~30초)을 3개 찍어두면 블로그 상위 노출에 유리해요. AI가 글 안에 영상 삽입 위치도 표시해줘요!",
    tips: [
      "① 입장 영상 — 가게 입구부터 내부까지 이동하며 촬영",
      "② 음식 영상 — 메인 메뉴 담음새·김 오르는 모습 클로즈업",
      "③ 분위기 영상 — 테이블 주변·창밖·손님들 자연스러운 컷",
    ]
  },
  {
    icon: <PenLine size={20}/>, color: "#ffd93d", bg: "rgba(255,217,61,0.12)",
    title: "정보 입력 & AI 글 생성",
    desc: "정보 입력 탭에서 가게 정보를 채운 뒤 'AI 글 생성' 버튼을 누르세요. 1,300자 이상의 체험단 글이 자동 완성돼요!",
    tips: ["가게명은 네이버 플레이스 정확한 이름으로 입력","메뉴와 가격 입력 시 글에 자동 반영","별점은 솔직하게 — 3~4점대 리뷰가 더 신뢰감","생성 후 '📸 사진 위치'와 '🎬 영상 위치'에 직접 찍은 사진·영상 삽입"]
  },
];

export default function CheokdanModal({ isOpen, onClose }: Props) {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<"guide"|"form"|"result">("guide");
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [shopName, setShopName] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [companion, setCompanion] = useState("");
  const [menus, setMenus] = useState<Menu[]>([{name:"",price:""},{name:"",price:""}]);
  const [tasteStar, setTasteStar] = useState(4);
  const [atmosphereStar, setAtmosphereStar] = useState(4);
  const [serviceStar, setServiceStar] = useState(4);
  const [highlight, setHighlight] = useState("");
  const [weakness, setWeakness] = useState("");

  // Result state
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const t = {
    bg: dark ? "#0a0a16" : "#f4f4ff",
    card: dark ? "rgba(255,255,255,0.06)" : "#ffffff",
    border: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    text: dark ? "#f0f0ff" : "#1a1a2e",
    muted: dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)",
    input: dark ? "rgba(255,255,255,0.07)" : "#f8f8ff",
    inputBorder: dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
    label: dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
    shadow: dark ? "0 32px 80px rgba(0,0,0,0.7)" : "0 32px 80px rgba(0,0,0,0.18)",
  };

  const RAINBOW = "linear-gradient(135deg, #ff6b6b 0%, #ffd93d 22%, #6bcb77 44%, #4d96ff 66%, #c77dff 88%, #ff6b6b 100%)";

  // 1300자 미만이면 서버(/api/generate-content)에 이어쓰기 요청, 1500자 초과하면 자르기
  async function extendToMin(content: string, provider: string, apiKey: string): Promise<string> {
    let current = content;
    let attempts = 0;
    while (current.length < 1300 && attempts < 3) {
      attempts++;
      try {
        const resp = await fetch("/api/generate-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, apiKey, extendMode: true, existingContent: current }),
        });
        const data = await resp.json();
        if (data.content) {
          const extended = current + "\n\n" + data.content;
          // 1500자 초과 시 자연스러운 문장 단위로 자르기
          if (extended.length > 1500) {
            // 1500자 근처에서 문장 끝(. ! ? \n) 찾기
            const cutTarget = extended.slice(0, 1500);
            const lastSentence = Math.max(
              cutTarget.lastIndexOf(".\n"),
              cutTarget.lastIndexOf("!\n"),
              cutTarget.lastIndexOf("?\n"),
              cutTarget.lastIndexOf("\n\n"),
            );
            current = lastSentence > 1200 ? extended.slice(0, lastSentence + 1) : cutTarget;
          } else {
            current = extended;
          }
        } else break;
      } catch { break; }
    }
    // 최종 1500자 초과 방지
    if (current.length > 1500) {
      const cutTarget = current.slice(0, 1500);
      const lastSentence = Math.max(
        cutTarget.lastIndexOf(".\n"),
        cutTarget.lastIndexOf("!\n"),
        cutTarget.lastIndexOf("?\n"),
        cutTarget.lastIndexOf("\n\n"),
      );
      current = lastSentence > 1200 ? current.slice(0, lastSentence + 1) : cutTarget;
    }
    return current;
  }

  async function generate() {
    if (!shopName.trim()) { toast.error("가게명을 입력해주세요!"); return; }
    setLoading(true);
    setTab("result");
    try {
      const provider = getContentProvider();
      const apiKey = getAPIKey(provider);
      if (!apiKey) { toast.error("AI API 키가 설정되지 않았습니다. 설정 페이지에서 키를 입력해주세요."); setLoading(false); return; }

      const resp = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider, apiKey,
          cheokdanMode: true,
          keyword: shopName,
          shopName, region, category, visitDate, companions: companion,
          menus: menus.filter(m => m.name.trim()),
          tasteStar, atmosphereStar, serviceStar,
          highlight, weakness,
          minChars: 1300,
          maxChars: 1499,
          // 핵심 지시: 한자 절대 금지, 글자수 1300~1499자, 사진 15장/영상 3개 위치 명시
          systemInstructions: [
            "절대 한자(漢字)를 사용하지 마세요. 한자가 포함되면 무조건 한글로 변환하세요. 예: 訪問→방문, 料理→요리, 雰圍氣→분위기 등.",
            "완성된 글의 총 글자수는 반드시 1300자 이상 1499자 이하여야 합니다. 이 범위를 벗어나면 안 됩니다.",
            "글 전체에 걸쳐 [📸 사진설명] 마커를 정확히 15개 배치하세요. 각 마커는 해당 단락의 내용에 맞는 구체적인 사진 설명을 포함하세요.",
            "글 전체에 걸쳐 [🎬 영상설명] 마커를 정확히 3개 배치하세요. ① 입장/외관 영상, ② 음식 영상, ③ 분위기 영상 순서로 배치하세요.",
            "사진과 영상 마커는 해당 내용이 나오는 문단 바로 다음 줄에 배치해 자연스럽게 흐르도록 하세요.",
          ].join(" "),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) throw new Error(data.error || "생성 실패");

      let content = (data.content || "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/^#{1,3}\s+/gm, "")
        // 한자 완전 제거: 유니코드 한자 범위(CJK) 제거 후 공백 정리
        .replace(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // 1300자 미만이면 자동으로 이어쓰기
      if (content.length < 1300) {
        toast.info("✍️ 글이 짧아서 자동으로 보완 중이에요...", { duration: 4000 });
        content = await extendToMin(content, provider, apiKey);
      }
      // 1500자 이상이면 문장 단위로 자르기
      if (content.length >= 1500) {
        const cutTarget = content.slice(0, 1499);
        const lastSentence = Math.max(
          cutTarget.lastIndexOf(".\n"),
          cutTarget.lastIndexOf("!\n"),
          cutTarget.lastIndexOf("?\n"),
          cutTarget.lastIndexOf("\n\n"),
        );
        content = lastSentence > 1200 ? content.slice(0, lastSentence + 1) : cutTarget;
      }

      setResult(content);
      toast.success(`✅ 체험단 글 완성! (${content.length.toLocaleString()}자)`);
    } catch (e: any) {
      toast.error(e.message || "글 생성 중 오류가 발생했습니다.");
      setTab("form");
    } finally {
      setLoading(false);
    }
  }

  // ── 미리보기 렌더러 ──
  function renderPreview(text: string): string {
    if (!text) return "";
    const lines = text.split("\n");
    const html = lines.map(line => {
      const l = line.trim();
      if (!l) return "";
      // 📸 마커
      if (/^\[📸/.test(l)) {
        const desc = l.replace(/^\[📸\s*/, "").replace(/\]$/, "").trim();
        return `<div class="ckd-pv-img">📸 ${desc || "사진을 여기에 삽입하세요"}</div>`;
      }
      // 🎬 마커
      if (/^\[🎬/.test(l)) {
        const desc = l.replace(/^\[🎬\s*/, "").replace(/\]$/, "").trim();
        return `<div class="ckd-pv-vid">🎬 ${desc || "영상을 여기에 삽입하세요"}</div>`;
      }
      // 해시태그
      if (l.startsWith("#")) return `<div class="ckd-pv-hash">${l.replace(/&/g,"&amp;")}</div>`;
      // 일반 텍스트
      return `<p class="ckd-pv-p">${l.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`;
    }).join("");
    return html;
  }

  function copyResult() {
    if (!result) return;
    // AI가 생성한 [📸 ...] [🎬 ...] 마커를 네이버에서 눈에 잘 보이는 형태로 변환
    const formatted = result
      .replace(/\[📸\s*([^\]]+)\]/g, (_: string, desc: string) =>
        `\n━━━━━━━━━━━━━━━━━━━━━━\n📸 ${desc.trim()}\n━━━━━━━━━━━━━━━━━━━━━━\n`
      )
      .replace(/\[🎬\s*([^\]]+)\]/g, (_: string, desc: string) =>
        `\n▶▶▶ 🎬 ${desc.trim()} ◀◀◀\n`
      )
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    navigator.clipboard.writeText(formatted).then(() =>
      toast.success("📋 복사 완료! 📸 위치에 사진을, 🎬 위치에 영상을 삽입하세요!", { duration: 5000 })
    );
  }

  function addMenu() { setMenus(m => [...m, { name:"", price:"" }]); }
  function removeMenu(i: number) { setMenus(m => m.filter((_,idx) => idx !== i)); }
  function updateMenu(i: number, field: keyof Menu, val: string) {
    setMenus(m => m.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: 10, padding: "10px 13px", color: t.text, fontSize: 14,
    outline: "none", boxSizing: "border-box", transition: "border-color .2s",
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: t.label, marginBottom: 5, display: "block", letterSpacing: ".5px" };
  const fieldStyle: React.CSSProperties = { marginBottom: 16 };

  const tabs = [
    { id:"guide", label:"📖 사용 가이드", icon: <BookOpen size={15}/> },
    { id:"form",  label:"✍️ 체험단 작성", icon: <PenLine size={15}/> },
    { id:"result",label:"🎉 완성 글", icon: <Rocket size={15}/> },
  ] as const;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background: "rgba(0,0,0,0.75)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding: "env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0)",
    }}>

      {/* ── 미리보기 풀스크린 오버레이 ── */}
      {previewMode && result && (
        <div style={{
          position:"fixed", inset:0, zIndex:10100,
          background:"rgba(0,0,0,0.85)", backdropFilter:"blur(12px)",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"16px",
        }} onClick={()=>setPreviewMode(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:"100%", maxWidth:720,
            maxHeight:"92vh",
            background: dark ? "#0d0d1e" : "#ffffff",
            borderRadius:20, overflow:"hidden",
            display:"flex", flexDirection:"column",
            boxShadow:"0 40px 100px rgba(0,0,0,0.8)",
            border:`1px solid ${t.border}`,
          }}>
            {/* 미리보기 헤더 */}
            <div style={{
              padding:"14px 20px", borderBottom:`1px solid ${t.border}`,
              display:"flex", alignItems:"center", justifyContent:"space-between",
              flexShrink:0,
              background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontSize:18 }}>📝</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:900, color:t.text }}>블로그 미리보기</div>
                  <div style={{ fontSize:11, color:t.muted, marginTop:1 }}>네이버 블로그에 발행될 글 미리보기</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{
                  fontSize:11, fontWeight:700, borderRadius:8, padding:"3px 8px",
                  color: result.length >= 1300 && result.length < 1500 ? "#6bcb77" : "#ff6b6b",
                  background: result.length >= 1300 && result.length < 1500 ? "rgba(107,203,119,0.15)" : "rgba(255,107,107,0.15)",
                  border: `1px solid ${result.length >= 1300 && result.length < 1500 ? "rgba(107,203,119,0.4)" : "rgba(255,107,107,0.4)"}`,
                }}>
                  {result.length.toLocaleString()}자
                </span>
                <button onClick={()=>setPreviewMode(false)} style={{
                  width:36, height:36, borderRadius:10,
                  border:`1px solid ${t.border}`, background:t.card,
                  color:t.text, cursor:"pointer", fontSize:18,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>✕</button>
              </div>
            </div>
            {/* 미리보기 본문 */}
            <div style={{ flex:1, overflowY:"auto", padding:"24px 28px", WebkitOverflowScrolling:"touch" } as React.CSSProperties}>
              <style>{`
                .ckd-pv-title{font-size:17px;font-weight:900;color:${t.text};margin-bottom:14px;line-height:1.5}
                .ckd-pv-img{background:${dark?"rgba(107,203,119,0.12)":"rgba(107,203,119,0.18)"};border:2px dashed rgba(107,203,119,0.5);border-radius:12px;padding:16px 18px;text-align:center;color:#6bcb77;font-weight:800;font-size:13px;margin:14px 0;display:flex;align-items:center;justify-content:center;gap:8px}
                .ckd-pv-vid{background:${dark?"rgba(77,150,255,0.12)":"rgba(77,150,255,0.18)"};border:2px dashed rgba(77,150,255,0.5);border-radius:12px;padding:16px 18px;text-align:center;color:#4d96ff;font-weight:800;font-size:13px;margin:14px 0;display:flex;align-items:center;justify-content:center;gap:8px}
                .ckd-pv-p{font-size:14.5px;color:${t.text};line-height:1.95;margin:0 0 10px}
                .ckd-pv-hash{font-size:13px;color:#4d96ff;margin-top:20px;line-height:1.8;font-weight:600}
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: renderPreview(result) }} />
            </div>
            {/* 미리보기 하단 버튼 */}
            <div style={{
              padding:"14px 20px", borderTop:`1px solid ${t.border}`,
              display:"flex", gap:10, flexShrink:0,
              background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            }}>
              <button onClick={copyResult} style={{
                flex:1, padding:"13px", borderRadius:12, border:"none",
                background:"#03C75A", color:"white",
                fontSize:14, fontWeight:900, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                boxShadow:"0 4px 16px rgba(3,199,90,.35)",
              }}>
                <Copy size={16}/> 네이버 블로그에 복사하기 📋
              </button>
              <button onClick={()=>setPreviewMode(false)} style={{
                padding:"13px 18px", borderRadius:12,
                border:`1px solid ${t.border}`, background:t.card,
                color:t.muted, fontSize:13, fontWeight:700, cursor:"pointer",
              }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal */}
      <div className="ckd-modal" style={{
        width:"calc(100vw - 24px)", maxWidth:1600, maxHeight:"96vh",
        background: t.bg, borderRadius: 20,
        boxShadow: t.shadow,
        display:"flex", flexDirection:"column",
        overflow:"hidden", margin: 12,
        border: `1px solid ${t.border}`,
        animation: "ckdSlideUp .35s cubic-bezier(.22,1,.36,1) both",
      }}>
        <style>{`
          @keyframes ckdSlideUp { from { opacity:0; transform:translateY(32px) scale(.97) } to { opacity:1; transform:none } }
          .ckd-input:focus { border-color: #6bcb77 !important; box-shadow: 0 0 0 3px rgba(107,203,119,.18) !important; }
          .ckd-pill { transition: all .18s; cursor:pointer; }
          .ckd-pill:hover { transform:scale(1.05); }
          .ckd-tab { transition: all .2s; }
          ::-webkit-scrollbar { width:5px; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius:10px; }

          @media (max-width:768px) {
            .ckd-modal { margin:0 !important; border-radius:0 !important;
              width:100vw !important; max-width:100vw !important;
              height:100dvh !important; max-height:100dvh !important; }
            .ckd-body { flex-direction:column !important; flex:1 !important; overflow:hidden !important; min-height:0 !important; }
            .ckd-panel { display:none !important; }
            .ckd-panel.active { display:flex !important; flex:1 !important; width:100% !important; min-height:0 !important; overflow-y:auto !important; -webkit-overflow-scrolling:touch !important; }
            .ckd-mobile-tabs { display:flex !important; }
            .ckd-desktop-only { display:none !important; }
            .ckd-2col { grid-template-columns: 1fr !important; gap:10px !important; }
            .ckd-form-inner { padding:14px 14px !important; }
            .ckd-menu-num { display:none !important; }
            .ckd-header { padding:12px 14px !important; }
            .ckd-header-logo { width:32px !important; height:32px !important; font-size:16px !important; }
            .ckd-header-title { font-size:14px !important; }
            .ckd-header-sub { display:none !important; }
            .ckd-tab-label-short { display:inline !important; }
            .ckd-tab-label-long { display:none !important; }
          }
          @media (min-width:769px) {
            .ckd-mobile-tabs { display:none !important; }
            .ckd-panel { display:flex !important; }
            .ckd-tab-label-short { display:none !important; }
            .ckd-tab-label-long { display:inline !important; }
          }
        `}</style>

        {/* Rainbow top bar */}
        <div style={{ height:5, background:RAINBOW, flexShrink:0 }} />

        {/* Header */}
        <div className="ckd-header" style={{
          padding:"16px 20px", display:"flex", alignItems:"center", gap:12,
          borderBottom:`1px solid ${t.border}`, flexShrink:0,
          background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        }}>
          {/* Logo */}
          <div className="ckd-header-logo" style={{
            width:40, height:40, borderRadius:12, flexShrink:0,
            background:RAINBOW, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:20, boxShadow:"0 4px 16px rgba(0,0,0,.3)",
          }}>🍽️</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="ckd-header-title" style={{ fontWeight:900, fontSize:16, color:t.text, letterSpacing:"-.3px" }}>
              체험단 블로그 작성 도우미
            </div>
            <div className="ckd-header-sub" style={{ fontSize:11, color:t.muted, marginTop:1 }}>
              AI가 생생한 방문 후기를 자동으로 작성해드려요
            </div>
          </div>
          {/* Theme toggle */}
          <button onClick={()=>setDark(d=>!d)} style={{
            width:36, height:36, borderRadius:10, border:`1px solid ${t.border}`,
            background:t.card, color:t.text, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          {/* Close */}
          <button onClick={onClose} style={{
            width:36, height:36, borderRadius:10, border:`1px solid ${t.border}`,
            background:t.card, color:t.text, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }}>
            <X size={16}/>
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="ckd-mobile-tabs" style={{
          display:"none", borderBottom:`1px solid ${t.border}`, flexShrink:0,
          background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        }}>
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={()=>setTab(id as any)} className="ckd-tab" style={{
              flex:1, padding:"12px 4px", border:"none", background:"none", cursor:"pointer",
              fontSize:12, fontWeight:700, color: tab===id ? "#6bcb77" : t.muted,
              borderBottom: tab===id ? "2px solid #6bcb77" : "2px solid transparent",
              transition:"all .2s", whiteSpace:"nowrap",
            }}>
              <span className="ckd-tab-label-long">{label}</span>
              <span className="ckd-tab-label-short">{id==="guide"?"📖 가이드":id==="form"?"✍️ 작성":"🎉 결과"}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="ckd-body" style={{ display:"flex", flex:1, overflow:"hidden" }}>

          {/* LEFT — Guide Panel */}
          <div className={`ckd-panel ${tab==="guide"?"active":""}`} style={{
            width:400, flexShrink:0, flexDirection:"column",
            overflowY:"auto", borderRight:`1px solid ${t.border}`,
            background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          }}>
            <div style={{ padding:"20px 18px" }}>
              <div style={{ fontSize:13, fontWeight:900, color:t.muted, letterSpacing:2, marginBottom:16 }}>
                사용 가이드
              </div>
              {GUIDE_STEPS.map((step, i) => (
                <div key={i} style={{
                  background:step.bg, border:`1px solid ${step.color}33`,
                  borderRadius:14, padding:"16px 16px", marginBottom:12,
                  borderLeft:`3px solid ${step.color}`,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{
                      width:32, height:32, borderRadius:10, background:step.color,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#000", flexShrink:0,
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:step.color, letterSpacing:1 }}>
                        {i+1}단계
                      </div>
                      <div style={{ fontSize:14, fontWeight:800, color:t.text }}>{step.title}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12.5, color:t.muted, lineHeight:1.7, marginBottom:10 }}>
                    {step.desc}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {step.tips.map((tip, j) => (
                      <div key={j} style={{ display:"flex", gap:7, alignItems:"flex-start" }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:step.color, flexShrink:0, marginTop:6 }} />
                        <div style={{ fontSize:11.5, color:t.muted, lineHeight:1.6 }}>{tip}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Pro tip box */}
              <div style={{
                background: RAINBOW, borderRadius:14, padding:2, marginTop:4,
              }}>
                <div style={{
                  background: dark ? "#0d0d1e" : "#fff",
                  borderRadius:12, padding:"14px 16px",
                }}>
                  <div style={{ fontSize:12, fontWeight:900, color:"#ffd93d", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                    <Sparkles size={14}/> 프로 팁
                  </div>
                  <div style={{ fontSize:12, color:t.muted, lineHeight:1.7 }}>
                    체험단 글은 <strong style={{color:t.text}}>솔직함</strong>이 생명이에요. 좋은 점만 나열하는 것보다 아쉬운 점도 살짝 언급하면 독자들에게 훨씬 신뢰감을 줄 수 있어요. 진짜 후기처럼 보이는 게 핵심!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE — Form Panel */}
          <div className={`ckd-panel ${tab==="form"?"active":""}`} style={{
            flex:1, flexDirection:"column", overflowY:"auto",
            minWidth:0,
          }}>
            <div className="ckd-form-inner" style={{ padding:"20px 22px" }}>
              <div style={{ fontSize:13, fontWeight:900, color:t.muted, letterSpacing:2, marginBottom:18 }}>
                체험단 정보 입력
              </div>

              {/* 가게명 + 지역 */}
              <div className="ckd-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div>
                  <label style={labelStyle}><MapPin size={11} style={{display:"inline",marginRight:4}}/>가게명 *</label>
                  <input className="ckd-input" style={inputStyle}
                    placeholder="해오름 보리굴비" value={shopName}
                    onChange={e=>setShopName(e.target.value)}/>
                </div>
                <div>
                  <label style={labelStyle}><MapPin size={11} style={{display:"inline",marginRight:4}}/>지역</label>
                  <input className="ckd-input" style={inputStyle}
                    placeholder="전남 영광" value={region}
                    onChange={e=>setRegion(e.target.value)}/>
                </div>
              </div>

              {/* 업종 */}
              <div style={fieldStyle}>
                <label style={labelStyle}><Utensils size={11} style={{display:"inline",marginRight:4}}/>업종 카테고리</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {CATEGORIES.map(c => (
                    <button key={c} className="ckd-pill" onClick={()=>setCategory(cat=>cat===c?"":c)}
                      style={{
                        padding:"6px 12px", borderRadius:100, fontSize:12, fontWeight:700,
                        border:`1.5px solid ${category===c?"#6bcb77":t.inputBorder}`,
                        background: category===c ? "rgba(107,203,119,0.18)" : t.input,
                        color: category===c ? "#6bcb77" : t.text, cursor:"pointer",
                      }}>{c}</button>
                  ))}
                </div>
              </div>

              {/* 방문일 + 동반인 */}
              <div className="ckd-2col" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div>
                  <label style={labelStyle}><Calendar size={11} style={{display:"inline",marginRight:4}}/>방문일</label>
                  <input className="ckd-input" type="date" style={inputStyle}
                    value={visitDate} onChange={e=>setVisitDate(e.target.value)}/>
                </div>
                <div>
                  <label style={labelStyle}><Users size={11} style={{display:"inline",marginRight:4}}/>동반인</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:2 }}>
                    {COMPANIONS.map(c => (
                      <button key={c} className="ckd-pill" onClick={()=>setCompanion(cc=>cc===c?"":c)}
                        style={{
                          padding:"6px 10px", borderRadius:100, fontSize:12, fontWeight:700,
                          border:`1.5px solid ${companion===c?"#4d96ff":t.inputBorder}`,
                          background: companion===c ? "rgba(77,150,255,0.18)" : t.input,
                          color: companion===c ? "#4d96ff" : t.text, cursor:"pointer",
                        }}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 메뉴 */}
              <div style={fieldStyle}>
                <label style={labelStyle}><Utensils size={11} style={{display:"inline",marginRight:4}}/>주문 메뉴 & 가격</label>
                {menus.map((m, i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
                    <div className="ckd-menu-num" style={{ fontSize:11, color:t.muted, width:18, flexShrink:0, textAlign:"center" }}>{i+1}</div>
                    <input className="ckd-input" style={{...inputStyle, flex:2}}
                      placeholder="메뉴명 (예: 보리굴비정식)" value={m.name}
                      onChange={e=>updateMenu(i,"name",e.target.value)}/>
                    <input className="ckd-input" style={{...inputStyle, flex:1}}
                      placeholder="가격 (원)" value={m.price}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        const formatted = raw ? Number(raw).toLocaleString("ko-KR") : "";
                        updateMenu(i, "price", formatted);
                      }}/>
                    {menus.length>1 && (
                      <button onClick={()=>removeMenu(i)} style={{
                        width:30, height:30, borderRadius:8, border:`1px solid ${t.inputBorder}`,
                        background:t.input, color:"#ff6b6b", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                      }}><Trash2 size={13}/></button>
                    )}
                  </div>
                ))}
                <button onClick={addMenu} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
                  borderRadius:10, border:`1px dashed ${t.inputBorder}`,
                  background:"none", color:t.muted, cursor:"pointer", fontSize:12, fontWeight:600,
                }}>
                  <Plus size={13}/> 메뉴 추가
                </button>
              </div>

              {/* 별점 */}
              <div style={{ ...fieldStyle, background:t.card, borderRadius:14, padding:16, border:`1px solid ${t.border}` }}>
                <label style={{...labelStyle, marginBottom:14}}>⭐ 평점</label>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    { label:"맛", color:"#ff6b6b", val:tasteStar, set:setTasteStar },
                    { label:"분위기", color:"#ffd93d", val:atmosphereStar, set:setAtmosphereStar },
                    { label:"서비스", color:"#6bcb77", val:serviceStar, set:setServiceStar },
                  ].map(row => (
                    <div key={row.label} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:50, fontSize:12, fontWeight:700, color:t.text, flexShrink:0 }}>{row.label}</div>
                      <Stars value={row.val} onChange={row.set} color={row.color}/>
                    </div>
                  ))}
                </div>
              </div>

              {/* 특별했던 점 */}
              <div style={fieldStyle}>
                <label style={labelStyle}><CheckCircle2 size={11} style={{display:"inline",marginRight:4}}/>특별했던 점 *</label>
                <textarea className="ckd-input" style={{...inputStyle, resize:"vertical", minHeight:80, lineHeight:1.6}}
                  placeholder="특히 인상적이었던 점을 자유롭게 적어주세요&#10;예: 굴비 2마리 + 간장게장이 함께 나오는 푸짐한 구성, 주인분이 직접 손질해서 주심"
                  value={highlight} onChange={e=>setHighlight(e.target.value)}/>
              </div>

              {/* 아쉬운 점 */}
              <div style={fieldStyle}>
                <label style={labelStyle}>💬 아쉬운 점 <span style={{fontWeight:400,opacity:.6}}>(선택)</span></label>
                <textarea className="ckd-input" style={{...inputStyle, resize:"vertical", minHeight:60, lineHeight:1.6}}
                  placeholder="예: 주말 웨이팅 30분 이상, 주차공간 협소"
                  value={weakness} onChange={e=>setWeakness(e.target.value)}/>
              </div>

              {/* Generate button */}
              <button onClick={generate} disabled={loading} style={{
                width:"100%", padding:"16px", borderRadius:14, border:"none",
                background: loading ? t.card : RAINBOW,
                color: loading ? t.muted : "#000",
                fontSize:15, fontWeight:900, cursor: loading ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                boxShadow: loading ? "none" : "0 8px 32px rgba(107,203,119,.3)",
                transition:"all .25s", letterSpacing:"-.2px",
                backgroundSize:"200% 200%",
              }}>
                {loading
                  ? <><Loader2 size={18} style={{animation:"spin 1s linear infinite"}}/> AI가 글을 쓰고 있어요...</>
                  : <><Sparkles size={18}/> 🌈 AI 체험단 글 생성하기</>
                }
              </button>
              <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
            </div>
          </div>

          {/* RIGHT — Result Panel */}
          <div className={`ckd-panel ${tab==="result"?"active":""}`} style={{
            width:480, flexShrink:0, flexDirection:"column",
            borderLeft:`1px solid ${t.border}`,
          }}>
            <div style={{ padding:"14px 20px 10px", borderBottom:`1px solid ${t.border}`, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:13, fontWeight:900, color:t.muted, letterSpacing:2 }}>
                  완성된 글
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {result && (
                    <span style={{
                      fontSize:11, fontWeight:700,
                      color: result.length >= 1300 && result.length < 1500 ? "#6bcb77" : result.length >= 1500 ? "#ffd93d" : "#ff6b6b",
                      background: result.length >= 1300 && result.length < 1500 ? "rgba(107,203,119,0.15)" : result.length >= 1500 ? "rgba(255,217,61,0.15)" : "rgba(255,107,107,0.15)",
                      border: `1px solid ${result.length >= 1300 && result.length < 1500 ? "rgba(107,203,119,0.4)" : result.length >= 1500 ? "rgba(255,217,61,0.4)" : "rgba(255,107,107,0.4)"}`,
                      borderRadius:8, padding:"3px 8px",
                    }}>
                      {result.length.toLocaleString()}자 {result.length >= 1300 && result.length < 1500 ? "✓ 적정" : result.length >= 1500 ? "⚠️ 초과" : `/ 1300자 필요`}
                    </span>
                  )}
                  {result && (
                    <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid ${t.border}` }}>
                      <button onClick={()=>setPreviewMode(false)} style={{
                        padding:"5px 10px", fontSize:11, fontWeight:700, border:"none", cursor:"pointer",
                        background: !previewMode ? "#6bcb77" : t.input, color: !previewMode ? "#000" : t.muted,
                      }}>✏️ 편집</button>
                      <button onClick={()=>setPreviewMode(true)} style={{
                        padding:"5px 10px", fontSize:11, fontWeight:700, border:"none", cursor:"pointer",
                        background: previewMode ? "#6bcb77" : t.input, color: previewMode ? "#000" : t.muted,
                      }}>👁️ 미리보기 (전체화면)</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
              {loading ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:16 }}>
                  <div style={{ fontSize:40, animation:"spin 2s linear infinite" }}>🌈</div>
                  <div style={{ fontSize:14, color:t.muted, textAlign:"center", lineHeight:1.6 }}>
                    AI가 체험단 글을<br/>열심히 작성 중이에요...
                  </div>
                </div>
              ) : result ? (
                  <textarea ref={resultRef}
                    value={result} onChange={e=>setResult(e.target.value)}
                    style={{
                      width:"100%", height:"100%", minHeight:300,
                      background:t.input, border:`1px solid ${t.inputBorder}`,
                      borderRadius:12, padding:14, color:t.text, fontSize:13,
                      lineHeight:1.8, resize:"none", outline:"none", boxSizing:"border-box",
                      fontFamily:"inherit",
                    }}/>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12, opacity:.5 }}>
                  <div style={{ fontSize:48 }}>✍️</div>
                  <div style={{ fontSize:13, color:t.muted, textAlign:"center", lineHeight:1.6 }}>
                    왼쪽에서 정보를 입력하고<br/>'AI 글 생성' 버튼을 눌러보세요
                  </div>
                </div>
              )}
            </div>

            {result && result.length < 1300 && (
              <div style={{
                margin:"0 20px 8px", padding:"10px 13px", borderRadius:10, flexShrink:0,
                background:"rgba(255,107,107,0.12)", border:"1px solid rgba(255,107,107,0.35)",
                fontSize:12, color:"#ff6b6b", lineHeight:1.6,
              }}>
                ⚠️ 현재 <strong>{result.length}자</strong>에요. 체험단 글은 <strong>1,300자 이상</strong>이어야 해요. '다시 생성하기'를 눌러보세요.
              </div>
            )}
            {result && (
              <div style={{ padding:"14px 20px", borderTop:`1px solid ${t.border}`, flexShrink:0, display:"flex", flexDirection:"column", gap:10 }}>
                {/* 복사 방법 안내 */}
                <div style={{
                  background:"rgba(107,203,119,0.1)", border:"1px solid rgba(107,203,119,0.25)",
                  borderRadius:10, padding:"10px 13px", fontSize:11.5, color:"#6bcb77", lineHeight:1.6,
                }}>
                  <strong>📸 복사 후</strong> 네이버 블로그 에디터에 붙여넣고, '여기에 사진 삽입' 위치에 직접 찍은 사진을 추가하세요!
                </div>
                <button onClick={copyResult} style={{
                  width:"100%", padding:"13px", borderRadius:12, border:"none",
                  background:"#03C75A", color:"white",
                  fontSize:14, fontWeight:900, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow:"0 4px 16px rgba(3,199,90,.35)",
                  transition:"all .2s",
                }}>
                  <Copy size={16}/> 네이버 블로그에 복사하기 📋
                </button>
                <button onClick={generate} disabled={loading} style={{
                  width:"100%", padding:"10px", borderRadius:12,
                  border:`1px solid ${t.border}`, background:t.card,
                  color:t.muted, fontSize:12, fontWeight:700, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                }}>
                  <Sparkles size={13}/> 다시 생성하기
                </button>
              </div>
            )}
          </div>

        </div>{/* end body */}
      </div>
    </div>
  );
}
