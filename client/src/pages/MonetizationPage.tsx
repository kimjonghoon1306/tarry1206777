import { useState, useCallback } from "react";

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

// ─── 기본값 ───────────────────────────────────────────────
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

function loadState(): MonetizationState {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return { ...DEFAULT_STATE, ...JSON.parse(r) }; } catch {}
  return DEFAULT_STATE;
}
function saveState(s: MonetizationState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

// ─── Toggle ───────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: "relative", display: "inline-block", width: 44, height: 26, flexShrink: 0, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
      <span style={{
        position: "absolute", inset: 0, borderRadius: 13,
        background: checked ? "#00e5a0" : "rgba(255,255,255,0.12)",
        transition: "background 0.3s",
        boxShadow: checked ? "0 0 10px rgba(0,229,160,0.4)" : "none",
      }}>
        <span style={{
          position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff", transition: "left 0.25s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </span>
    </label>
  );
}

// ─── 카드 ─────────────────────────────────────────────────
function Card({ accent = "green", children }: { accent?: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    green: "#00e5a0", blue: "#3b82f6", purple: "#a855f7",
    orange: "#f97316", yellow: "#eab308", pink: "#ec4899", cyan: "#06b6d4",
  };
  const c = colors[accent] || colors.green;
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 18, padding: "20px 16px",
      position: "relative", overflow: "hidden",
      marginBottom: 12,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${c}, transparent)` }} />
      {children}
    </div>
  );
}

// ─── 카드 헤더 ────────────────────────────────────────────
function CardHeader({ icon, title, desc, badge, badgeColor }: {
  icon: string; title: string; desc: string; badge?: string; badgeColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
        </div>
      </div>
      {badge && (
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, flexShrink: 0,
          background: `${badgeColor}22`, border: `1px solid ${badgeColor}55`, color: badgeColor,
        }}>{badge}</span>
      )}
    </div>
  );
}

// ─── 입력 필드 ────────────────────────────────────────────
function Field({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--border)", borderRadius: 10,
          padding: "10px 12px", color: "var(--text)", fontSize: 13,
          outline: "none", fontFamily: "inherit", WebkitAppearance: "none",
        }}
      />
    </div>
  );
}

// ─── 토글 행 ─────────────────────────────────────────────
function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── 섹션 제목 ───────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ─── 상태 뱃지 ───────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    connected: ["#00e5a0", "✓ 연결됨"],
    warning: ["#eab308", "⚠ 미연동"],
    disconnected: ["#6b7a99", "미연동"],
  };
  const [color, label] = m[status] || m.disconnected;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: `${color}22`, border: `1px solid ${color}55`, color, flexShrink: 0 }}>
      {label}
    </span>
  );
}

// ─── 메인 ────────────────────────────────────────────────
export default function MonetizationPage() {
  const [state, setState] = useState<MonetizationState>(loadState);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("blogauto_theme") as "dark" | "light") || "dark"
  );
  const isLight = theme === "light";

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("blogauto_theme", next);
  };

  const update = useCallback(<K extends keyof MonetizationState>(
    section: K, patch: Partial<MonetizationState[K]>
  ) => {
    setState(prev => ({ ...prev, [section]: { ...prev[section], ...patch } }));
    setDirty(true); setSaved(false);
  }, []);

  const handleSave = () => {
    saveState(state); setDirty(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const progress = [
    state.adsense.status === "connected",
    state.backlink.domains.length > 0,
    state.platforms.blogger.connected || state.platforms.medium.connected,
    state.ping.enabled,
    state.gsc.connected,
  ];
  const progressPct = Math.round((progress.filter(Boolean).length / 5) * 100);

  // 다크/라이트 CSS 변수
  const bg     = isLight ? "#f0f4ff" : "#0a0e1a";
  const card   = isLight ? "#ffffff" : "#111827";
  const border = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";
  const text   = isLight ? "#0f1525" : "#f0f4ff";
  const headerBg = isLight ? "rgba(240,244,255,0.92)" : "rgba(10,14,26,0.88)";

  const css = `
    :root {
      --bg:${bg}; --card:${card}; --border:${border};
      --text:${text}; --muted:#6b7a99;
      --green:#00e5a0; --blue:#3b82f6; --purple:#a855f7;
      --orange:#f97316; --yellow:#eab308; --pink:#ec4899;
      --cyan:#06b6d4; --red:#ef4444;
    }
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    body{background:var(--bg);color:var(--text);font-family:'Pretendard',-apple-system,sans-serif;margin:0;}
    input,select,textarea{color:var(--text)!important;background:rgba(255,255,255,${isLight?"0.7":"0.05"});}
    select option{background:${card};}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

        {/* 배경 글로우 */}
        <div style={{ position: "fixed", top: -150, left: -150, width: 400, height: 400, background: "radial-gradient(circle,rgba(0,229,160,0.07) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: -150, right: -150, width: 400, height: 400, background: "radial-gradient(circle,rgba(168,85,247,0.07) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* ── 헤더 ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: headerBg, backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <a href="/superadmin" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← 뒤로</a>
            <div style={{ width: 1, height: 14, background: "var(--border)" }} />
            <span style={{ fontSize: 14, fontWeight: 800, background: "linear-gradient(135deg,#00e5a0,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              💰 수익화 센터
            </span>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              background: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
              color: "var(--text)", fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            }}
          >
            {isLight ? "🌙 밤" : "☀️ 낮"}
          </button>
        </div>

        {/* ── 메인 콘텐츠 ── */}
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 14px 100px", position: "relative", zIndex: 1 }}>

          {/* 진행률 */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 18, padding: "16px", marginBottom: 20,
            animation: "fadeUp 0.5s ease both",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>수익화 설정 진행률</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#00e5a0" }}>{progressPct}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, height: 8, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#00e5a0,#06b6d4)", borderRadius: 8, transition: "width 1s ease", boxShadow: "0 0 10px rgba(0,229,160,0.4)" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { n: progress.filter(Boolean).length, label: "완료", color: "#00e5a0" },
                { n: progress.filter(v => !v).length, label: "미설정", color: "#6b7a99" },
                { n: 5, label: "전체", color: "#3b82f6" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.n}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── STEP 1: 애드센스 ── */}
          <SectionTitle>💰 STEP 1 — 애드센스 연동</SectionTitle>

          <Card accent="green">
            <CardHeader icon="💵" title="Google AdSense"
              desc="광고 코드 및 계정 연동"
              badge={state.adsense.status === "connected" ? "✓ 연결됨" : "미연동"}
              badgeColor={state.adsense.status === "connected" ? "#00e5a0" : "#6b7a99"}
            />
            <Field label="Publisher ID (ca-pub-XXXXXXXX)" placeholder="ca-pub-1234567890" value={state.adsense.clientId} onChange={v => update("adsense", { clientId: v })} />
            <Field label="광고 슬롯 ID" placeholder="1234567890" value={state.adsense.slotId} onChange={v => update("adsense", { slotId: v })} />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>광고 유형</div>
              <select value={state.adsense.adUnit} onChange={e => update("adsense", { adUnit: e.target.value })}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", WebkitAppearance: "none" }}>
                <option value="auto">자동 광고 (권장)</option>
                <option value="display">디스플레이 광고</option>
                <option value="in-article">인아티클 광고</option>
                <option value="in-feed">인피드 광고</option>
              </select>
            </div>
            <ToggleRow label="자동 광고 활성화" sub="Google이 최적 위치에 자동 배치" checked={state.adsense.autoAds} onChange={v => update("adsense", { autoAds: v })} />
            <button onClick={() => {
              if (state.adsense.clientId && state.adsense.slotId) update("adsense", { status: "connected" });
              else alert("Publisher ID와 슬롯 ID를 입력해주세요.");
            }} style={{
              marginTop: 14, width: "100%", padding: "12px", borderRadius: 12,
              background: state.adsense.status === "connected" ? "rgba(0,229,160,0.1)" : "linear-gradient(135deg,#00e5a0,#06b6d4)",
              border: state.adsense.status === "connected" ? "1px solid rgba(0,229,160,0.3)" : "none",
              color: state.adsense.status === "connected" ? "#00e5a0" : "#000",
              fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            }}>
              {state.adsense.status === "connected" ? "✓ 연동 완료" : "🔗 애드센스 연동하기"}
            </button>
          </Card>

          <Card accent="yellow">
            <CardHeader icon="📊" title="광고 수익 현황" desc="오늘 예상 수익" />
            <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: 12, padding: "16px", textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#eab308" }}>$0.00</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>오늘 / 이번 달 $0.00</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[["👁", "페이지뷰", "—"], ["🖱", "클릭수", "—"], ["📈", "CTR", "—"], ["💵", "RPM", "—"]].map(([ic, lb, v], i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18 }}>{ic}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3 }}>{v}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{lb}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── STEP 2: 백링크 ── */}
          <SectionTitle>🔗 STEP 2 — 백링크 도메인 설정</SectionTitle>

          <Card accent="blue">
            <CardHeader icon="🌐" title="내 도메인 관리" desc="백링크 출처 도메인 등록" />
            {state.backlink.domains.map((d, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 10, marginBottom: 8, gap: 8,
                background: d === state.backlink.primaryDomain ? "rgba(0,229,160,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${d === state.backlink.primaryDomain ? "rgba(0,229,160,0.25)" : "var(--border)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: d === state.backlink.primaryDomain ? "#00e5a0" : "#6b7a99", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d}</span>
                  {d === state.backlink.primaryDomain && <span style={{ fontSize: 9, color: "#00e5a0", background: "rgba(0,229,160,0.1)", padding: "2px 6px", borderRadius: 8, flexShrink: 0 }}>대표</span>}
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  {d !== state.backlink.primaryDomain && (
                    <button onClick={() => update("backlink", { primaryDomain: d })} style={{ fontSize: 10, padding: "3px 7px", borderRadius: 6, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>대표</button>
                  )}
                  {state.backlink.domains.length > 1 && (
                    <button onClick={() => {
                      const nd = state.backlink.domains.filter((_, idx) => idx !== i);
                      update("backlink", { domains: nd, primaryDomain: d === state.backlink.primaryDomain ? nd[0] : state.backlink.primaryDomain });
                    }} style={{ fontSize: 10, padding: "3px 7px", borderRadius: 6, background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
                  )}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={newDomain} onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newDomain.trim()) { update("backlink", { domains: [...state.backlink.domains, newDomain.trim()] }); setNewDomain(""); } }}
                placeholder="example.com"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <button onClick={() => { if (newDomain.trim()) { update("backlink", { domains: [...state.backlink.domains, newDomain.trim()] }); setNewDomain(""); } }}
                style={{ padding: "10px 14px", borderRadius: 10, background: "#3b82f6", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, flexShrink: 0 }}>
                + 추가
              </button>
            </div>
          </Card>

          <Card accent="pink">
            <CardHeader icon="⚙️" title="발행 설정" desc="백링크 삽입 옵션" />
            <ToggleRow label="원본 링크 자동 삽입" sub="대표 도메인 링크를 글에 자동 추가" checked={state.backlink.autoInsert} onChange={v => update("backlink", { autoInsert: v })} />
            <ToggleRow label="Canonical 태그 적용" sub="중복 콘텐츠 방지 (필수 권장)" checked={state.backlink.canonical} onChange={v => update("backlink", { canonical: v })} />
            <ToggleRow label="발행 딜레이 (랜덤)" sub="봇 감지 방지용 랜덤 간격" checked={state.backlink.randomDelay} onChange={v => update("backlink", { randomDelay: v })} />
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", marginBottom: 5, textTransform: "uppercase" }}>링크 삽입 위치</div>
              <select value={state.backlink.insertPosition} onChange={e => update("backlink", { insertPosition: e.target.value as any })}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", WebkitAppearance: "none" }}>
                <option value="bottom">글 하단에 삽입</option>
                <option value="top">글 상단에 삽입</option>
                <option value="both">상단 + 하단 모두</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="링크 문구" placeholder="📌 원문 보기" value={state.backlink.linkText} onChange={v => update("backlink", { linkText: v })} />
            </div>
          </Card>

          {/* ── STEP 3: 외부 플랫폼 ── */}
          <SectionTitle>📡 STEP 3 — 외부 플랫폼 연동</SectionTitle>

          <Card accent="cyan">
            <CardHeader icon="🔗" title="플랫폼 연동" desc="동시 발행으로 자동 백링크 생성" />

            {/* WordPress */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: 12, background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)", marginBottom: 8, gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>📝</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>WordPress</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>tarryblog.org · 메인 발행</div>
                </div>
              </div>
              <Badge status="connected" />
            </div>

            {/* Blogger */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", marginBottom: 8, gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>🅱️</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Blogger</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Google OAuth 연동 필요</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Toggle checked={state.platforms.blogger.enabled} onChange={v => setState(p => ({ ...p, platforms: { ...p.platforms, blogger: { ...p.platforms.blogger, enabled: v } } }))} />
              </div>
            </div>

            {/* Medium */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>〽️</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Medium</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>API 토큰 등록 필요</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <Toggle checked={state.platforms.medium.enabled} onChange={v => setState(p => ({ ...p, platforms: { ...p.platforms, medium: { ...p.platforms.medium, enabled: v } } }))} />
              </div>
            </div>
          </Card>

          <Card accent="pink">
            <CardHeader icon="🔑" title="플랫폼 인증 정보" desc="각 플랫폼 연동 토큰/키" />
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f97316", marginBottom: 8 }}>🅱️ Blogger OAuth</div>
            <Field label="Google 계정 이메일" placeholder="your@gmail.com" value={state.platforms.blogger.account} onChange={v => setState(p => ({ ...p, platforms: { ...p.platforms, blogger: { ...p.platforms.blogger, account: v } } }))} />
            <button style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.3)", color: "#f97316", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>
              Google OAuth 인증하기 →
            </button>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>〽️ Medium API</div>
              <Field label="Integration Token" placeholder="토큰 입력" type="password" value={state.platforms.medium.token} onChange={v => setState(p => ({ ...p, platforms: { ...p.platforms, medium: { ...p.platforms.medium, token: v } } }))} />
              <button onClick={() => { if (state.platforms.medium.token) { setState(p => ({ ...p, platforms: { ...p.platforms, medium: { ...p.platforms.medium, connected: true } } })); setDirty(true); } }}
                style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {state.platforms.medium.connected ? "✓ 연동됨" : "Medium 연동하기 →"}
              </button>
            </div>
          </Card>

          {/* ── STEP 4: 핑 서비스 ── */}
          <SectionTitle>📶 STEP 4 — 핑 서비스</SectionTitle>

          <Card accent="green">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <CardHeader icon="📡" title="핑 서버 목록" desc="발행 후 자동 알림 전송" />
              <Toggle checked={state.ping.enabled} onChange={v => update("ping", { enabled: v })} />
            </div>
            {state.ping.servers.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 10, marginBottom: 6,
                background: s.active ? "rgba(0,229,160,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${s.active ? "rgba(0,229,160,0.15)" : "var(--border)"}`,
                opacity: state.ping.enabled ? 1 : 0.4,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.active ? "#00e5a0" : "#6b7a99", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: s.active ? "#00e5a0" : "var(--muted)" }}>{s.active ? "활성" : "비활성"}</span>
                <Toggle checked={s.active} onChange={v => {
                  const servers = state.ping.servers.map((sv, idx) => idx === i ? { ...sv, active: v } : sv);
                  update("ping", { servers });
                }} />
              </div>
            ))}
          </Card>

          <Card accent="blue">
            <CardHeader icon="⏱️" title="핑 발송 로그" desc="최근 발송 기록" />
            {[["트렌드 핫이슈 글 발행", "방금 전"], ["생활꿀팁 10가지", "2시간 전"], ["돈되는 정보 모음", "5시간 전"]].map(([title, time], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00e5a0", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13 }}>{title}</span>
                <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{time}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.15)", borderRadius: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              💡 글 발행 즉시 {state.ping.servers.filter(s => s.active).length}개 검색엔진에 자동으로 핑을 전송해 색인 속도를 높여요.
            </div>
          </Card>

          {/* ── STEP 5: GSC ── */}
          <SectionTitle>🔍 STEP 5 — GSC & 키워드 연동</SectionTitle>

          <Card accent="purple">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 }}>
              <CardHeader icon="🔍" title="Google Search Console" desc="실제 유입 키워드 연동" />
              <Badge status={state.gsc.connected ? "connected" : "disconnected"} />
            </div>
            {[
              { rank: 1, kw: "핫이슈 모음", clicks: 234, pos: 4 },
              { rank: 2, kw: "생활꿀팁 2026", clicks: 187, pos: 7 },
              { rank: 3, kw: "돈버는 방법", clicks: 156, pos: 11 },
              { rank: 4, kw: "오늘 핫이슈", clicks: 98, pos: 15 },
            ].map(kw => (
              <div key={kw.rank} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", width: 16, textAlign: "center", flexShrink: 0 }}>{kw.rank}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw.kw}</span>
                <span style={{ fontSize: 12, color: "#00e5a0", fontWeight: 700, flexShrink: 0 }}>↑ {kw.clicks}</span>
                <span style={{ fontSize: 11, color: "var(--muted)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 6, flexShrink: 0 }}>#{kw.pos}</span>
              </div>
            ))}
            <button style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              전체 키워드 보기 →
            </button>
          </Card>

          <Card accent="orange">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 }}>
              <CardHeader icon="🎯" title="구글 키워드 API" desc="틈새 키워드 자동 발굴" />
              <Badge status={state.gsc.googleAdsApiKey ? "connected" : "warning"} />
            </div>
            <Field label="Google Ads API Key" placeholder="API 키 입력" value={state.gsc.googleAdsApiKey} onChange={v => update("gsc", { googleAdsApiKey: v })} />
            <Field label="고객 ID (Customer ID)" placeholder="XXX-XXX-XXXX" value={state.gsc.customerId} onChange={v => update("gsc", { customerId: v })} />
            <ToggleRow label="틈새 키워드 자동 추천" sub="경쟁도 낮은 키워드 우선 추출" checked={state.gsc.nicheKeywords} onChange={v => update("gsc", { nicheKeywords: v })} />
            <ToggleRow label="CPC 높은 키워드 우선" sub="애드센스 수익 최적화" checked={state.gsc.highCpcFirst} onChange={v => update("gsc", { highCpcFirst: v })} />
            <button style={{ marginTop: 14, width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#f97316,#f59e0b)", border: "none", color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
              🔗 API 연동하기
            </button>
          </Card>

        </div>

        {/* ── 저장 바 ── */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
          background: isLight ? "rgba(240,244,255,0.97)" : "rgba(10,14,26,0.97)",
          backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          transform: dirty || saved ? "translateY(0)" : "translateY(80px)",
          transition: "transform 0.3s ease",
        }}>
          <span style={{ fontSize: 13, color: saved ? "#00e5a0" : "var(--muted)" }}>
            {saved ? "✓ 저장 완료!" : "변경사항 있음"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { if (confirm("초기화할까요?")) { setState(DEFAULT_STATE); saveState(DEFAULT_STATE); setDirty(false); } }}
              style={{ padding: "9px 14px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
              초기화
            </button>
            <button onClick={handleSave}
              style={{ padding: "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,#00e5a0,#06b6d4)", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              💾 저장
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
