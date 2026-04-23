import { useState, useCallback, useEffect } from "react";
import { userGet, userSet, saveSettingsToServer, SETTINGS_KEYS } from "@/lib/user-storage";
import { toast } from "sonner";

// ─── 타입 ─────────────────────────────────────────────────
interface AdSenseSettings {
  clientId: string; slotId: string; autoAds: boolean;
  adUnit: string; status: "connected" | "pending" | "error" | "disconnected";
}
interface BacklinkSettings {
  domains: string[]; primaryDomain: string; autoInsert: boolean;
  canonical: boolean; randomDelay: boolean;
  insertPosition: "bottom" | "top" | "both"; linkText: string;
}
interface PlatformSettings {
  blogger: { enabled: boolean; connected: boolean; account: string };
  medium: { enabled: boolean; connected: boolean; token: string };
  wordpress: { enabled: boolean; connected: boolean; url: string };
}
interface PingSettings {
  enabled: boolean;
  servers: { name: string; active: boolean; url: string }[];
}
interface GscSettings {
  connected: boolean; siteUrl: string; googleAdsApiKey: string;
  customerId: string; nicheKeywords: boolean; highCpcFirst: boolean;
}
interface MonetizationState {
  adsense: AdSenseSettings; backlink: BacklinkSettings;
  platforms: PlatformSettings; ping: PingSettings; gsc: GscSettings;
}

const DEFAULT_STATE: MonetizationState = {
  adsense: { clientId: "", slotId: "", autoAds: true, adUnit: "auto", status: "disconnected" },
  backlink: { domains: ["tarryblog.org"], primaryDomain: "tarryblog.org", autoInsert: true, canonical: true, randomDelay: true, insertPosition: "bottom", linkText: "📌 원문 보기" },
  platforms: {
    blogger: { enabled: false, connected: false, account: "" },
    medium: { enabled: false, connected: false, token: "" },
    wordpress: { enabled: true, connected: true, url: "tarryblog.org" },
  },
  ping: {
    enabled: true,
    servers: [
      { name: "Pingomatic", active: true, url: "rpc.pingomatic.com" },
      { name: "Google Ping", active: true, url: "blogsearch.google.com/ping" },
      { name: "Bing Webmaster", active: true, url: "www.bing.com/webmaster/ping" },
      { name: "Pingerfarm", active: false, url: "www.pingerfarm.com" },
      { name: "Bulkping", active: false, url: "www.bulkping.com" },
    ],
  },
  gsc: { connected: true, siteUrl: "tarryblog.org", googleAdsApiKey: "", customerId: "", nicheKeywords: true, highCpcFirst: true },
};

const STORAGE_KEY = "blogauto_monetization_v1";

// 서버 + 로컬 동시 저장
async function saveStateToServer(s: MonetizationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  // 주요 값들을 userStorage 키로도 저장 (다른 페이지와 공유)
  userSet("adsense_client_id", s.adsense.clientId);
  userSet("adsense_slot_id", s.adsense.slotId);
  userSet("monetization_backlink_domain", s.backlink.primaryDomain);
  userSet("monetization_backlink_insert", s.backlink.autoInsert ? "true" : "false");
  userSet("monetization_canonical", s.backlink.canonical ? "true" : "false");
  userSet("monetization_random_delay", s.backlink.randomDelay ? "true" : "false");
  userSet("monetization_insert_position", s.backlink.insertPosition);
  userSet("monetization_link_text", s.backlink.linkText);
  userSet("monetization_ping_enabled", s.ping.enabled ? "true" : "false");
  try {
    await saveSettingsToServer({
      adsense_client_id: s.adsense.clientId,
      adsense_slot_id: s.adsense.slotId,
      monetization_backlink_domain: s.backlink.primaryDomain,
      monetization_backlink_insert: s.backlink.autoInsert ? "true" : "false",
      monetization_canonical: s.backlink.canonical ? "true" : "false",
      monetization_random_delay: s.backlink.randomDelay ? "true" : "false",
      monetization_insert_position: s.backlink.insertPosition,
      monetization_link_text: s.backlink.linkText,
      monetization_ping_enabled: s.ping.enabled ? "true" : "false",
    });
  } catch (e) {
    console.warn("서버 저장 실패 (로컬 저장됨):", e);
  }
}

function loadState(): MonetizationState {
  // 서버 동기화 값 우선 반영
  const serverMerge: Partial<MonetizationState> = {};
  const clientId = userGet("adsense_client_id");
  const slotId = userGet("adsense_slot_id");
  if (clientId || slotId) {
    serverMerge.adsense = {
      ...DEFAULT_STATE.adsense,
      clientId: clientId || "",
      slotId: slotId || "",
      status: clientId ? "connected" : "disconnected",
    };
  }
  const backlinkDomain = userGet("monetization_backlink_domain");
  if (backlinkDomain) {
    serverMerge.backlink = {
      ...DEFAULT_STATE.backlink,
      primaryDomain: backlinkDomain,
      domains: [backlinkDomain],
      autoInsert: userGet("monetization_backlink_insert") !== "false",
      canonical: userGet("monetization_canonical") !== "false",
      randomDelay: userGet("monetization_random_delay") !== "false",
      insertPosition: (userGet("monetization_insert_position") as any) || "bottom",
      linkText: userGet("monetization_link_text") || "📌 원문 보기",
    };
  }
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) return { ...DEFAULT_STATE, ...JSON.parse(r), ...serverMerge };
  } catch {}
  return { ...DEFAULT_STATE, ...serverMerge };
}

function saveState(s: MonetizationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ─── Toggle ───────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: "relative", display: "inline-block", width: 42, height: 24, flexShrink: 0, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: "absolute", inset: 0, borderRadius: 12,
        background: checked ? "linear-gradient(135deg,#00e5a0,#06b6d4)" : "rgba(255,255,255,0.08)",
        transition: "all 0.3s", boxShadow: checked ? "0 0 12px rgba(0,229,160,0.5)" : "none",
      }}>
        <span style={{
          position: "absolute", top: 2, left: checked ? 20 : 2,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          transition: "left 0.25s", boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        }} />
      </span>
    </label>
  );
}

// ─── 글로우 카드 ─────────────────────────────────────────
function GlowCard({ color = "#00e5a0", children, style }: {
  color?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(15,21,37,0.85)",
        border: `1px solid ${hovered ? color + "55" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, padding: "20px",
        position: "relative", overflow: "hidden",
        transition: "all 0.3s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 8px 32px ${color}18, 0 0 0 1px ${color}15` : "none",
        ...style,
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},transparent)`, opacity: hovered ? 1 : 0.5, transition: "opacity 0.3s" }} />
      <div style={{ position: "absolute", top: -50, left: -50, width: 140, height: 140, background: `radial-gradient(circle,${color}0e,transparent 70%)`, pointerEvents: "none" }} />
      {children}
    </div>
  );
}

// ─── 스탯 카드 ───────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, connected }: {
  icon: string; label: string; value: string; sub: string; color: string; connected?: boolean;
}) {
  return (
    <GlowCard color={color}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ fontSize: 26 }}>{icon}</div>
        {connected !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800,
            color: connected ? "#00e5a0" : "#6b7a99",
            background: connected ? "rgba(0,229,160,0.1)" : "rgba(255,255,255,0.05)",
            padding: "3px 8px", borderRadius: 20,
            border: `1px solid ${connected ? "rgba(0,229,160,0.3)" : "rgba(255,255,255,0.08)"}`,
            letterSpacing: 0.5,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: connected ? "#00e5a0" : "#6b7a99",
              boxShadow: connected ? "0 0 6px #00e5a0" : "none",
              animation: connected ? "mPulse 2s infinite" : "none" }} />
            {connected ? "LIVE" : "OFF"}
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#f0f4ff", letterSpacing: -1, fontFamily: "'DM Mono','Courier New',monospace", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color, fontWeight: 800, marginTop: 5, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontSize: 10, color: "#6b7a99", marginTop: 2 }}>{sub}</div>
    </GlowCard>
  );
}

// ─── 섹션 헤더 ───────────────────────────────────────────
function SectionHeader({ step, title, color }: { step: string; title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ fontSize: 9, fontWeight: 900, padding: "4px 9px", borderRadius: 20, background: `${color}18`, border: `1px solid ${color}40`, color, letterSpacing: 1.5, textTransform: "uppercase", flexShrink: 0 }}>{step}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#f0f4ff" }}>{title}</div>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${color}30,transparent)` }} />
    </div>
  );
}

// ─── 인풋 ─────────────────────────────────────────────────
function Field({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: focused ? "#00e5a0" : "#6b7a99", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1, transition: "color 0.2s" }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: focused ? "rgba(0,229,160,0.05)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${focused ? "rgba(0,229,160,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 10, padding: "10px 14px", color: "#f0f4ff", fontSize: 13,
          outline: "none", fontFamily: "inherit", transition: "all 0.2s", WebkitAppearance: "none",
        }}
      />
    </div>
  );
}

// ─── 토글 행 ─────────────────────────────────────────────
function ToggleRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f4ff" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "#6b7a99", marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── 테마 버튼 (호버 애니메이션) ────────────────────────
function ThemeNavBtn({ isLight, onToggle, border, textColor }: {
  isLight: boolean; onToggle: () => void; border: string; textColor: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "8px 13px", borderRadius: 12, flexShrink: 0,
        border: `1.5px solid ${hov ? (isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)") : border}`,
        background: hov
          ? (isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)")
          : (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"),
        color: textColor, fontSize: 16, fontWeight: 800,
        cursor: "pointer", fontFamily: "inherit",
        transform: hov ? "translateY(-3px) scale(1.08)" : "translateY(0) scale(1)",
        boxShadow: hov ? (isLight ? "0 6px 20px rgba(0,0,0,0.12)" : "0 6px 20px rgba(255,255,255,0.08)") : "none",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
      <span>{isLight ? "🌙" : "☀️"}</span>
      <span className="theme-label" style={{ fontSize: 12 }}>{isLight ? "밤" : "낮"}</span>
    </button>
  );
}

// ─── 네비게이션 아이콘 버튼 (호버 애니메이션) ───────────
function NavBtn({ emoji, title: ttl, href, bg, bgHov, border, borderHov, color, glow }: {
  emoji: string; title: string; href: string;
  bg: string; bgHov: string; border: string; borderHov: string; color: string; glow: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => window.location.href = href}
      title={ttl}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "8px 13px", borderRadius: 10, flexShrink: 0,
        background: hov ? bgHov : bg,
        border: `1.5px solid ${hov ? borderHov : border}`,
        color, cursor: "pointer", fontSize: 17, lineHeight: 1,
        transform: hov ? "translateY(-3px) scale(1.08)" : "translateY(0) scale(1)",
        boxShadow: hov ? `0 6px 20px ${glow}, 0 0 0 1px ${border}` : "none",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
      {emoji}
    </button>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function MonetizationPage() {
  const [state, setState] = useState<MonetizationState>(loadState);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("blogauto_theme") as "dark" | "light") || "dark"
  );
  const isLight = theme === "light";

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); localStorage.setItem("blogauto_theme", next);
  };

  const update = useCallback(<K extends keyof MonetizationState>(section: K, patch: Partial<MonetizationState[K]>) => {
    setState(prev => ({ ...prev, [section]: { ...prev[section], ...patch } }));
    setDirty(true); setSaved(false);
  }, []);

  const handleSave = async () => {
    saveState(state);
    setDirty(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    await saveStateToServer(state);
    toast.success("✅ 수익화 설정이 저장됐어요!");
  };

  // 실제 GSC 키워드 불러오기
  const [gscKeywords, setGscKeywords] = useState<{keyword:string;clicks:number;position:string}[]>([]);
  const [gscLoading, setGscLoading] = useState(false);

  useEffect(() => {
    const clientEmail = userGet(SETTINGS_KEYS.GSC_CLIENT_EMAIL);
    const privateKey = userGet(SETTINGS_KEYS.GSC_PRIVATE_KEY);
    const siteUrl = userGet(SETTINGS_KEYS.GSC_SITE_URL);
    if (!clientEmail || !privateKey || !siteUrl) return;
    setGscLoading(true);
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "gscGetKeywords", clientEmail, privateKey, siteUrl, rowLimit: 5 }),
    })
      .then(r => r.json())
      .then(d => { if (d.ok) setGscKeywords(d.keywords || []); })
      .catch(() => {})
      .finally(() => setGscLoading(false));
  }, []);

  // 실제 발행 로그 (최근 발행글)
  const [pingLogs, setPingLogs] = useState<{title:string;time:string;pings:number}[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("ba_token");
    if (!token) return;
    fetch("https://www.blogautopro.com/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ action: "getPosts", limit: 3 }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.posts?.length) {
          setPingLogs(d.posts.slice(0, 3).map((p: any) => ({
            title: p.title || "발행된 글",
            time: p.createdAt ? new Date(p.createdAt).toLocaleDateString("ko-KR") : "최근",
            pings: state.ping.servers.filter(s => s.active).length,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const progress = [
    state.adsense.status === "connected",
    state.backlink.domains.length > 0,
    state.platforms.blogger.connected || state.platforms.medium.connected,
    state.ping.enabled,
    state.gsc.connected,
  ];
  const progressPct = Math.round((progress.filter(Boolean).length / 5) * 100);
  const activePings = state.ping.servers.filter(s => s.active).length;

  const STEPS = [
    { id: 1, icon: "💰", label: "애드센스", color: "#f59e0b", done: state.adsense.status === "connected" },
    { id: 2, icon: "🔗", label: "백링크",   color: "#3b82f6", done: state.backlink.domains.length > 0 },
    { id: 3, icon: "📡", label: "플랫폼",   color: "#06b6d4", done: state.platforms.blogger.connected || state.platforms.medium.connected },
    { id: 4, icon: "📶", label: "핑서비스", color: "#00e5a0", done: state.ping.enabled },
    { id: 5, icon: "🔍", label: "GSC",      color: "#a855f7", done: state.gsc.connected },
  ];

  const TICKER = ["ADSENSE RPM ▲ $3.24", "방문자 ▲ 1,847", "CTR ▼ 2.8%", "이번달 ▲ ₩142,800", `핑서버 ▲ ${activePings}개`, "발행글 ▲ 247개", `도메인 ▲ ${state.backlink.domains.length}개`, "GSC 키워드 ▲ 4위"];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800;900&display=swap');
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    @keyframes mPulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes scanline{0%{top:-2px}100%{top:100vh}}
    @keyframes btnPop{0%{transform:scale(1) translateY(0)}50%{transform:scale(1.13) translateY(-3px)}100%{transform:scale(1.08) translateY(-2px)}}
    .nav-icon-btn{transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1)!important;}
    .nav-icon-btn:hover{transform:translateY(-3px) scale(1.08)!important;}
    .nav-icon-btn:active{transform:translateY(0) scale(0.95)!important;}
    input::placeholder{color:rgba(107,122,153,0.5);}
    select option{background:#0f1525;color:#f0f4ff;}
    .m-step:hover{transform:translateY(-1px);transition:all 0.2s;}
    /* ── 반응형 그리드 ── */
    .m-stat{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
    .m-main{display:flex;flex-direction:column;gap:12px;}
    .m-side{display:none;}
    @media(min-width:768px){
      .m-stat{grid-template-columns:repeat(4,1fr);gap:16px;}
    }
    @media(min-width:1024px){
      .m-main{display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start;}
      .m-side{display:flex;flex-direction:column;gap:12px;}
    }
    .theme-label{display:none;}
    .progress-bar{display:none!important;}
    @media(min-width:600px){.theme-label{display:inline;}.progress-bar{display:flex!important;}}
    @media(min-width:1280px){
      .m-main{grid-template-columns:300px 1fr 300px;}
      .m-side{display:flex;}
    }
  `;

  // 라이트 오버라이드
  const lc = {
    bg: isLight ? "#eef2fc" : "#080c18",
    card: isLight ? "rgba(255,255,255,0.9)" : "rgba(15,21,37,0.85)",
    border: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)",
    text: isLight ? "#0f1525" : "#f0f4ff",
    muted: isLight ? "#6b7a99" : "#6b7a99",
    headerBg: isLight ? "rgba(238,242,252,0.95)" : "rgba(8,12,24,0.92)",
  };

  const cardStyle = { background: lc.card, border: `1px solid ${lc.border}` };

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: lc.bg, color: lc.text, fontFamily: "'Syne',-apple-system,sans-serif", position: "relative", overflow: "hidden" }}>

        {/* 배경 글로우 */}
        {!isLight && <>
          <div style={{ position: "fixed", top: -200, left: -200, width: 600, height: 600, background: "radial-gradient(circle,rgba(0,229,160,0.05) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
          <div style={{ position: "fixed", bottom: -200, right: -200, width: 600, height: 600, background: "radial-gradient(circle,rgba(168,85,247,0.05) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
          {/* 스캔라인 */}
          <div style={{ position: "fixed", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,rgba(0,229,160,0.04),transparent)", animation: "scanline 10s linear infinite", pointerEvents: "none", zIndex: 0 }} />
        </>}

        {/* ── 티커 바 ── */}
        <div style={{ background: isLight ? "rgba(0,0,0,0.04)" : "rgba(0,229,160,0.05)", borderBottom: `1px solid ${isLight ? "rgba(0,0,0,0.07)" : "rgba(0,229,160,0.12)"}`, padding: "7px 0", overflow: "hidden", position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", animation: "ticker 25s linear infinite", width: "max-content", gap: 48, whiteSpace: "nowrap" }}>
            {[...Array(2)].map((_, ri) => (
              <div key={ri} style={{ display: "flex", gap: 48 }}>
                {TICKER.map((t, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono','Courier New',monospace", color: t.includes("▲") ? "#00e5a0" : "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: lc.muted, opacity: 0.5 }}>{t.split(" ")[0]}</span>
                    <span>{t.split(" ").slice(1).join(" ")}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── 헤더 ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 100, background: lc.headerBg, backdropFilter: "blur(24px)", borderBottom: `1px solid ${lc.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#00e5a0,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>💰</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: lc.text, lineHeight: 1.1, letterSpacing: -0.3, whiteSpace: "nowrap" }}>수익화 센터</div>
              <div style={{ fontSize: 9, color: "#00e5a0", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'DM Mono',monospace", whiteSpace: "nowrap" }}>BLOGAUTO PRO</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* 미니 진행률 - 모바일 숨김 */}
            <div className="progress-bar" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 20, background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", border: `1px solid ${lc.border}` }}>
              <div style={{ width: 72, height: 4, borderRadius: 4, background: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#00e5a0,#06b6d4)", borderRadius: 4, transition: "width 1s ease" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#00e5a0", fontFamily: "'DM Mono',monospace" }}>{progressPct}%</span>
            </div>
            {/* 테마 - PC: 아이콘+텍스트, 모바일: 아이콘만 */}
            <ThemeNavBtn isLight={isLight} onToggle={toggleTheme} border={lc.border} textColor={lc.text} />
            {/* 슈퍼어드민 버튼 - 연한 빨강 + 호버 애니메이션 */}
            <NavBtn
              emoji="🏠"
              title="슈퍼어드민"
              href="/superadmin"
              bg="#ff000018"
              bgHov="#ff000030"
              border="#ff000045"
              borderHov="#ff000080"
              color="#ff6b6b"
              glow="#ff000040"
            />
            {/* 대시보드 버튼 - 연한 핑크 + 호버 애니메이션 */}
            <NavBtn
              emoji="📊"
              title="수익 대시보드"
              href="/admin-revenue-dashboard"
              bg="#ec489918"
              bgHov="#ec489930"
              border="#ec489945"
              borderHov="#ec489980"
              color="#ec4899"
              glow="#ec489940"
            />
          </div>
        </div>

        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px 100px", position: "relative", zIndex: 1 }}>

          {/* ── 상단 스탯 4개 ── */}
          <div className="m-stat" style={{ marginBottom: 20, animation: "fadeUp 0.5s ease both" }}>
            <StatCard icon="💰" label="ADSENSE REVENUE" value="$0.00" sub={`오늘 예상 수익 · ${state.adsense.status === "connected" ? "활성" : "미연동"}`} color="#f59e0b" connected={state.adsense.status === "connected"} />
            <StatCard icon="🌐" label="DOMAINS" value={`${state.backlink.domains.length}`} sub={`대표: ${state.backlink.primaryDomain}`} color="#3b82f6" connected />
            <StatCard icon="📡" label="PING SERVERS" value={`${activePings}/${state.ping.servers.length}`} sub="색인 자동화 활성" color="#00e5a0" connected={state.ping.enabled} />
            <StatCard icon="🔍" label="GSC TOP KW" value={gscKeywords.length > 0 ? `#${gscKeywords[0].position}` : "—"} sub={gscKeywords.length > 0 ? `${gscKeywords[0].keyword} ↑${gscKeywords[0].clicks}클릭` : "GSC 미연동"} color="#a855f7" connected={gscKeywords.length > 0} />
          </div>

          {/* ── 스텝 네비게이터 ── */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, padding: "10px 12px", background: lc.card, borderRadius: 14, border: `1px solid ${lc.border}`, overflowX: "auto" }}>
            {STEPS.map(s => (
              <button key={s.id} className="m-step"
                onClick={() => setActiveStep(s.id)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 10px", borderRadius: 10, border: `1px solid ${activeStep === s.id ? s.color + "60" : lc.border}`, background: activeStep === s.id ? `${s.color}12` : "transparent", color: activeStep === s.id ? s.color : lc.muted, fontSize: 18, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, position: "relative" }}>
                <span>{s.icon}</span>
                {s.done && <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", boxShadow: "0 0 6px #00e5a0" }} />}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: lc.muted, fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>
              <span style={{ color: "#00e5a0", fontWeight: 900 }}>{progress.filter(Boolean).length}</span>/{STEPS.length}
            </div>
          </div>

          {/* ── 3열 메인 레이아웃 ── */}
          <div className="m-main">

            {/* 왼쪽 설정 패널 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {activeStep === 1 && (
                <GlowCard color="#f59e0b" style={cardStyle}>
                  <SectionHeader step="STEP 01" title="애드센스 연동" color="#f59e0b" />
                  <Field label="Publisher ID" placeholder="ca-pub-XXXXXXXXXX" value={state.adsense.clientId} onChange={v => update("adsense", { clientId: v })} />
                  <Field label="광고 슬롯 ID" placeholder="1234567890" value={state.adsense.slotId} onChange={v => update("adsense", { slotId: v })} />
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7a99", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>광고 유형</div>
                    <select value={state.adsense.adUnit} onChange={e => update("adsense", { adUnit: e.target.value })}
                      style={{ width: "100%", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border: `1px solid ${lc.border}`, borderRadius: 10, padding: "10px 14px", color: lc.text, fontSize: 13, fontFamily: "inherit", WebkitAppearance: "none" }}>
                      <option value="auto">자동 광고 (권장)</option>
                      <option value="display">디스플레이 광고</option>
                      <option value="in-article">인아티클 광고</option>
                      <option value="in-feed">인피드 광고</option>
                    </select>
                  </div>
                  <ToggleRow label="자동 광고" sub="Google이 최적 위치에 자동 배치" checked={state.adsense.autoAds} onChange={v => update("adsense", { autoAds: v })} />
                  <button onClick={() => {
                    if (state.adsense.clientId && state.adsense.slotId) {
                      update("adsense", { status: "connected" });
                      userSet("adsense_client_id", state.adsense.clientId);
                      userSet("adsense_slot_id", state.adsense.slotId);
                      saveSettingsToServer({ adsense_client_id: state.adsense.clientId, adsense_slot_id: state.adsense.slotId });
                      toast.success("✅ 애드센스 연동됐어요!");
                    } else {
                      toast.error("Publisher ID와 슬롯 ID를 입력해주세요");
                    }
                  }}
                    style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 12, background: state.adsense.status === "connected" ? "rgba(0,229,160,0.12)" : "linear-gradient(135deg,#f59e0b,#f97316)", border: state.adsense.status === "connected" ? "1px solid rgba(0,229,160,0.3)" : "none", color: state.adsense.status === "connected" ? "#00e5a0" : "#000", fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5 }}>
                    {state.adsense.status === "connected" ? "✓ 연동 완료" : "🔗 연동하기"}
                  </button>
                </GlowCard>
              )}

              {activeStep === 2 && (
                <GlowCard color="#3b82f6" style={cardStyle}>
                  <SectionHeader step="STEP 02" title="백링크 도메인" color="#3b82f6" />
                  {state.backlink.domains.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 10, marginBottom: 6, gap: 8, background: d === state.backlink.primaryDomain ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${d === state.backlink.primaryDomain ? "rgba(59,130,246,0.35)" : lc.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: d === state.backlink.primaryDomain ? "#00e5a0" : "#6b7a99", flexShrink: 0, boxShadow: d === state.backlink.primaryDomain ? "0 0 6px #00e5a0" : "none" }} />
                        <span style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Mono',monospace", color: lc.text }}>{d}</span>
                        {d === state.backlink.primaryDomain && <span style={{ fontSize: 8, color: "#00e5a0", background: "rgba(0,229,160,0.1)", padding: "2px 6px", borderRadius: 8, flexShrink: 0, fontWeight: 900, letterSpacing: 0.5 }}>MAIN</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {d !== state.backlink.primaryDomain && <button onClick={() => update("backlink", { primaryDomain: d })} style={{ fontSize: 10, padding: "3px 7px", borderRadius: 6, background: "transparent", border: `1px solid ${lc.border}`, color: lc.muted, cursor: "pointer", fontFamily: "inherit" }}>대표</button>}
                        {state.backlink.domains.length > 1 && <button onClick={() => { const nd = state.backlink.domains.filter((_, idx) => idx !== i); update("backlink", { domains: nd, primaryDomain: d === state.backlink.primaryDomain ? nd[0] : state.backlink.primaryDomain }); }} style={{ fontSize: 10, padding: "3px 7px", borderRadius: 6, background: "transparent", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444", cursor: "pointer", fontFamily: "inherit" }}>✕</button>}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <input value={newDomain} onChange={e => setNewDomain(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && newDomain.trim()) { update("backlink", { domains: [...state.backlink.domains, newDomain.trim()] }); setNewDomain(""); } }}
                      placeholder="example.com"
                      style={{ flex: 1, background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border: `1px solid ${lc.border}`, borderRadius: 10, padding: "9px 12px", color: lc.text, fontSize: 12, fontFamily: "'DM Mono',monospace", outline: "none" }} />
                    <button onClick={() => { if (newDomain.trim()) { update("backlink", { domains: [...state.backlink.domains, newDomain.trim()] }); setNewDomain(""); } }}
                      style={{ padding: "9px 14px", borderRadius: 10, background: "#3b82f6", border: "none", color: "#fff", fontWeight: 900, cursor: "pointer", fontFamily: "inherit", fontSize: 12, flexShrink: 0 }}>+ ADD</button>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <ToggleRow label="원본 링크 자동 삽입" sub="대표 도메인 링크 자동 추가" checked={state.backlink.autoInsert} onChange={v => update("backlink", { autoInsert: v })} />
                    <ToggleRow label="Canonical 태그" sub="중복 콘텐츠 방지 (필수)" checked={state.backlink.canonical} onChange={v => update("backlink", { canonical: v })} />
                    <ToggleRow label="랜덤 딜레이" sub="봇 감지 방지" checked={state.backlink.randomDelay} onChange={v => update("backlink", { randomDelay: v })} />
                  </div>
                </GlowCard>
              )}

              {activeStep === 3 && (
                <GlowCard color="#06b6d4" style={cardStyle}>
                  <SectionHeader step="STEP 03" title="외부 플랫폼" color="#06b6d4" />
                  {[
                    { icon: "📝", name: "WordPress", desc: "tarryblog.org · 메인", connected: true, key: "wordpress" as const },
                    { icon: "🅱️", name: "Blogger", desc: "Google OAuth", connected: state.platforms.blogger.connected, key: "blogger" as const },
                    { icon: "〽️", name: "Medium", desc: "API 토큰", connected: state.platforms.medium.connected, key: "medium" as const },
                  ].map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", borderRadius: 12, marginBottom: 8, background: p.connected ? "rgba(0,229,160,0.06)" : isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)", border: `1px solid ${p.connected ? "rgba(0,229,160,0.2)" : lc.border}` }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: lc.text }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: lc.muted }}>{p.desc}</div>
                      </div>
                      {p.key !== "wordpress" && <Toggle checked={(state.platforms[p.key] as any).enabled} onChange={v => setState(prev => ({ ...prev, platforms: { ...prev.platforms, [p.key]: { ...prev.platforms[p.key], enabled: v } } }))} />}
                      <div style={{ fontSize: 9, fontWeight: 900, color: p.connected ? "#00e5a0" : lc.muted, background: p.connected ? "rgba(0,229,160,0.1)" : "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 10, border: `1px solid ${p.connected ? "rgba(0,229,160,0.25)" : lc.border}`, letterSpacing: 0.5, flexShrink: 0 }}>
                        {p.connected ? "✓ ON" : "OFF"}
                      </div>
                    </div>
                  ))}
                  <Field label="Blogger Gmail" placeholder="your@gmail.com" value={state.platforms.blogger.account} onChange={v => setState(p => ({ ...p, platforms: { ...p.platforms, blogger: { ...p.platforms.blogger, account: v } } }))} />
                  <Field label="Medium Token" placeholder="Integration Token" type="password" value={state.platforms.medium.token} onChange={v => setState(p => ({ ...p, platforms: { ...p.platforms, medium: { ...p.platforms.medium, token: v } } }))} />
                  <button
                    onClick={() => {
                      const bloggerAccount = state.platforms.blogger.account;
                      const mediumToken = state.platforms.medium.token;
                      if (!bloggerAccount && !mediumToken) { toast.error("Blogger Gmail 또는 Medium Token을 입력해주세요"); return; }
                      if (bloggerAccount) {
                        userSet("blogger_account", bloggerAccount);
                        setState(p => ({ ...p, platforms: { ...p.platforms, blogger: { ...p.platforms.blogger, connected: true } } }));
                      }
                      if (mediumToken) {
                        userSet("medium_token", mediumToken);
                        setState(p => ({ ...p, platforms: { ...p.platforms, medium: { ...p.platforms.medium, connected: true } } }));
                      }
                      saveSettingsToServer({
                        ...(bloggerAccount ? { blogger_account: bloggerAccount } : {}),
                        ...(mediumToken ? { medium_token: mediumToken } : {}),
                      });
                      toast.success("✅ 플랫폼 연동 저장됐어요!");
                      setDirty(true);
                    }}
                    style={{ marginTop: 14, width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#06b6d4,#3b82f6)", border: "none", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5 }}>
                    🔗 플랫폼 연동하기
                  </button>
                </GlowCard>
              )}

              {activeStep === 4 && (
                <GlowCard color="#00e5a0" style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <SectionHeader step="STEP 04" title="핑 서비스" color="#00e5a0" />
                    <Toggle checked={state.ping.enabled} onChange={v => update("ping", { enabled: v })} />
                  </div>
                  {state.ping.servers.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 6, background: s.active ? "rgba(0,229,160,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${s.active ? "rgba(0,229,160,0.2)" : lc.border}`, opacity: state.ping.enabled ? 1 : 0.4, transition: "opacity 0.3s" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.active ? "#00e5a0" : "#6b7a99", flexShrink: 0, boxShadow: s.active ? "0 0 8px #00e5a0" : "none", animation: s.active && state.ping.enabled ? "mPulse 2s infinite" : "none" }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono',monospace", color: lc.text }}>{s.name}</span>
                      <span style={{ fontSize: 9, color: s.active ? "#00e5a0" : lc.muted, fontWeight: 900, letterSpacing: 0.5 }}>{s.active ? "LIVE" : "OFF"}</span>
                      <Toggle checked={s.active} onChange={v => { const servers = state.ping.servers.map((sv, idx) => idx === i ? { ...sv, active: v } : sv); update("ping", { servers }); }} />
                    </div>
                  ))}
                </GlowCard>
              )}

              {activeStep === 5 && (
                <GlowCard color="#a855f7" style={cardStyle}>
                  <SectionHeader step="STEP 05" title="GSC & 키워드" color="#a855f7" />
                  <Field label="Google Ads API Key" placeholder="API 키" value={state.gsc.googleAdsApiKey} onChange={v => update("gsc", { googleAdsApiKey: v })} />
                  <Field label="Customer ID" placeholder="XXX-XXX-XXXX" value={state.gsc.customerId} onChange={v => update("gsc", { customerId: v })} />
                  <ToggleRow label="틈새 키워드 자동 추천" sub="경쟁도 낮은 키워드 우선" checked={state.gsc.nicheKeywords} onChange={v => update("gsc", { nicheKeywords: v })} />
                  <ToggleRow label="CPC 높은 키워드 우선" sub="애드센스 수익 최적화" checked={state.gsc.highCpcFirst} onChange={v => update("gsc", { highCpcFirst: v })} />
                  <button
                    onClick={() => {
                      if (!state.gsc.googleAdsApiKey) { toast.error("Google Ads API Key를 입력해주세요"); return; }
                      userSet("google_ads_api_key", state.gsc.googleAdsApiKey);
                      userSet("google_ads_customer_id", state.gsc.customerId);
                      userSet("gsc_niche_keywords", state.gsc.nicheKeywords ? "true" : "false");
                      userSet("gsc_high_cpc_first", state.gsc.highCpcFirst ? "true" : "false");
                      saveSettingsToServer({
                        google_ads_api_key: state.gsc.googleAdsApiKey,
                        google_ads_customer_id: state.gsc.customerId,
                        gsc_niche_keywords: state.gsc.nicheKeywords ? "true" : "false",
                        gsc_high_cpc_first: state.gsc.highCpcFirst ? "true" : "false",
                      });
                      update("gsc", { connected: true });
                      toast.success("✅ GSC 설정 저장됐어요!");
                    }}
                    style={{ marginTop: 14, width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#a855f7,#6366f1)", border: "none", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5 }}>
                    🔗 API 연동하기
                  </button>
                </GlowCard>
              )}
            </div>

            {/* 중앙 메인 패널 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* 진행률 대형 */}
              <GlowCard color="#00e5a0" style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#6b7a99", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>수익화 진행률</div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: "#00e5a0", fontFamily: "'DM Mono',monospace", lineHeight: 1, letterSpacing: -2 }}>{progressPct}<span style={{ fontSize: 22, opacity: 0.7 }}>%</span></div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ n: progress.filter(Boolean).length, label: "완료", color: "#00e5a0" }, { n: progress.filter(v => !v).length, label: "대기", color: "#6b7a99" }, { n: 5, label: "전체", color: "#3b82f6" }].map((s, i) => (
                      <div key={i} style={{ textAlign: "center", padding: "10px 14px", borderRadius: 12, background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border: `1px solid ${lc.border}` }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: "'DM Mono',monospace" }}>{s.n}</div>
                        <div style={{ fontSize: 9, color: lc.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 프로그레스 바 */}
                <div style={{ background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)", borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#00e5a0,#06b6d4,#3b82f6)", borderRadius: 8, transition: "width 1.2s ease", boxShadow: "0 0 16px rgba(0,229,160,0.5)" }} />
                </div>
                {/* 5단계 아이콘 */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {STEPS.map(s => (
                    <button key={s.id} onClick={() => setActiveStep(s.id)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", background: "none", border: "none", padding: "6px", borderRadius: 12, transition: "all 0.2s" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.done ? `${s.color}18` : isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", border: `2px solid ${activeStep === s.id ? s.color : s.done ? s.color + "60" : lc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: s.done ? 14 : 16, color: s.done ? s.color : lc.text, fontWeight: 900, transition: "all 0.2s", boxShadow: activeStep === s.id ? `0 0 12px ${s.color}40` : "none" }}>
                        {s.done ? "✓" : s.icon}
                      </div>
                      <span style={{ fontSize: 9, color: activeStep === s.id ? s.color : s.done ? s.color : lc.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </GlowCard>

              {/* 발행 설정 */}
              <GlowCard color="#ec4899" style={cardStyle}>
                <SectionHeader step="CONFIG" title="발행 옵션" color="#ec4899" />
                <ToggleRow label="원본 링크 자동 삽입" sub="대표 도메인 링크를 글에 자동 추가" checked={state.backlink.autoInsert} onChange={v => update("backlink", { autoInsert: v })} />
                <ToggleRow label="Canonical 태그 적용" sub="중복 콘텐츠 방지 (필수 권장)" checked={state.backlink.canonical} onChange={v => update("backlink", { canonical: v })} />
                <ToggleRow label="랜덤 딜레이 발행" sub="봇 감지 방지용 랜덤 간격" checked={state.backlink.randomDelay} onChange={v => update("backlink", { randomDelay: v })} />
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#6b7a99", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>링크 삽입 위치</div>
                  <select value={state.backlink.insertPosition} onChange={e => update("backlink", { insertPosition: e.target.value as any })}
                    style={{ width: "100%", background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", border: `1px solid ${lc.border}`, borderRadius: 10, padding: "10px 14px", color: lc.text, fontSize: 13, fontFamily: "inherit", WebkitAppearance: "none" }}>
                    <option value="bottom">글 하단에 삽입</option>
                    <option value="top">글 상단에 삽입</option>
                    <option value="both">상단 + 하단 모두</option>
                  </select>
                </div>
              </GlowCard>

              {/* 핑 로그 */}
              <GlowCard color="#06b6d4" style={cardStyle}>
                <SectionHeader step="LOG" title="핑 발송 로그" color="#06b6d4" />
                {pingLogs.length > 0 ? pingLogs.map((log, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${lc.border}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", boxShadow: "0 0 6px #00e5a0", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: lc.text }}>{log.title}</span>
                    <span style={{ fontSize: 10, color: "#00e5a0", fontFamily: "'DM Mono',monospace", fontWeight: 800, flexShrink: 0 }}>×{log.pings}</span>
                    <span style={{ fontSize: 10, color: lc.muted, flexShrink: 0 }}>{log.time}</span>
                  </div>
                )) : (
                  <div style={{ padding: "16px 0", textAlign: "center", color: lc.muted, fontSize: 12 }}>
                    발행된 글이 없거나 로그인이 필요해요
                  </div>
                )}
                <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.15)", borderRadius: 10, fontSize: 11, color: lc.muted, lineHeight: 1.7 }}>
                  💡 발행 즉시 {activePings}개 검색엔진 자동 핑 → 색인 속도 향상
                </div>
              </GlowCard>
            </div>

            {/* 오른쪽 사이드 패널 (1280px+) */}
            <div className="m-side">

              {/* GSC 키워드 순위 */}
              <GlowCard color="#a855f7" style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#6b7a99", textTransform: "uppercase", letterSpacing: 1 }}>GSC 키워드</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: lc.text, marginTop: 2 }}>유입 키워드 순위</div>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 900, color: gscKeywords.length > 0 ? "#00e5a0" : "#6b7a99", background: gscKeywords.length > 0 ? "rgba(0,229,160,0.1)" : "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 10, border: `1px solid ${gscKeywords.length > 0 ? "rgba(0,229,160,0.2)" : "rgba(255,255,255,0.08)"}`, letterSpacing: 0.5 }}>
                    {gscLoading ? "로딩중..." : gscKeywords.length > 0 ? "✓ LIVE" : "미연동"}
                  </div>
                </div>
                {gscKeywords.length > 0 ? gscKeywords.map((kw, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${lc.border}` }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: i === 0 ? "#f59e0b" : lc.muted, width: 14, textAlign: "center", flexShrink: 0, fontFamily: "'DM Mono',monospace" }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: lc.text }}>{kw.keyword}</span>
                    <span style={{ fontSize: 11, color: "#00e5a0", fontWeight: 900, fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>↑{kw.clicks}</span>
                    <span style={{ fontSize: 10, background: "rgba(168,85,247,0.12)", color: "#a855f7", padding: "2px 6px", borderRadius: 6, fontFamily: "'DM Mono',monospace", flexShrink: 0, fontWeight: 700 }}>#{kw.position}</span>
                  </div>
                )) : (
                  <div style={{ padding: "20px 0", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>🔍</div>
                    <div style={{ fontSize: 12, color: lc.muted }}>설정에서 GSC 연동 후 확인하세요</div>
                  </div>
                )}
              </GlowCard>

              {/* 수익 현황 */}
              <GlowCard color="#f59e0b" style={cardStyle}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#6b7a99", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>애드센스 수익</div>
                <div style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12, padding: "16px", textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: lc.muted, marginBottom: 4, fontWeight: 700 }}>오늘 예상</div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: "#f59e0b", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>$0.00</div>
                  <div style={{ fontSize: 11, color: lc.muted, marginTop: 6 }}>이번달 누적 $0.00</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[["👁","PV","—"],["🖱","CLK","—"],["📈","CTR","—"],["💵","RPM","—"]].map(([ic,lb,v],i) => (
                    <div key={i} style={{ background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)", border: `1px solid ${lc.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 18 }}>{ic}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4, fontFamily: "'DM Mono',monospace", color: lc.text }}>{v}</div>
                      <div style={{ fontSize: 9, color: lc.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>{lb}</div>
                    </div>
                  ))}
                </div>
              </GlowCard>

              {/* 구글 키워드 API */}
              <GlowCard color="#f97316" style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: lc.text }}>구글 키워드 API</div>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "3px 8px", borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)", letterSpacing: 0.5 }}>⚠ 미연동</span>
                </div>
                <Field label="Google Ads API Key" placeholder="API 키 입력" value={state.gsc.googleAdsApiKey} onChange={v => update("gsc", { googleAdsApiKey: v })} />
                <Field label="Customer ID" placeholder="XXX-XXX-XXXX" value={state.gsc.customerId} onChange={v => update("gsc", { customerId: v })} />
                <button style={{ width: "100%", padding: "11px", borderRadius: 12, background: "linear-gradient(135deg,#f97316,#f59e0b)", border: "none", color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5 }}>🎯 API 연동하기</button>
              </GlowCard>
            </div>
          </div>
        </div>

        {/* ── 저장 바 ── */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: isLight ? "rgba(238,242,252,0.97)" : "rgba(6,10,20,0.97)", backdropFilter: "blur(20px)", borderTop: `1px solid ${lc.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, transform: dirty || saved ? "translateY(0)" : "translateY(80px)", transition: "transform 0.3s ease" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: saved ? "#00e5a0" : lc.muted, fontFamily: "'DM Mono',monospace", letterSpacing: 0.5 }}>
            {saved ? "● SAVED" : "● UNSAVED CHANGES"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { if (confirm("초기화할까요?")) { setState(DEFAULT_STATE); saveState(DEFAULT_STATE); setDirty(false); } }}
              style={{ padding: "9px 16px", borderRadius: 10, background: "transparent", border: `1px solid ${lc.border}`, color: lc.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>RESET</button>
            <button onClick={handleSave}
              style={{ padding: "9px 24px", borderRadius: 10, background: "linear-gradient(135deg,#00e5a0,#06b6d4)", border: "none", color: "#000", fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.8 }}>💾 SAVE</button>
          </div>
        </div>
      </div>
    </>
  );
}
