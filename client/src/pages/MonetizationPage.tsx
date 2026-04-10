import { useState, useEffect, useCallback } from "react";

// ─── 타입 정의 ────────────────────────────────────────────
interface AdSenseSettings {
  clientId: string;
  slotId: string;
  autoAds: boolean;
  adUnit: string;
  status: "connected" | "pending" | "error" | "disconnected";
}

interface BacklinkSettings {
  domains: string[];
  primaryDomain: string;
  autoInsert: boolean;
  canonical: boolean;
  randomDelay: boolean;
  insertPosition: "bottom" | "top" | "both";
  linkText: string;
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
  connected: boolean;
  siteUrl: string;
  googleAdsApiKey: string;
  customerId: string;
  nicheKeywords: boolean;
  highCpcFirst: boolean;
}

interface MonetizationState {
  adsense: AdSenseSettings;
  backlink: BacklinkSettings;
  platforms: PlatformSettings;
  ping: PingSettings;
  gsc: GscSettings;
}

// ─── 기본값 ────────────────────────────────────────────────
const DEFAULT_STATE: MonetizationState = {
  adsense: {
    clientId: "",
    slotId: "",
    autoAds: true,
    adUnit: "auto",
    status: "disconnected",
  },
  backlink: {
    domains: ["tarryblog.org"],
    primaryDomain: "tarryblog.org",
    autoInsert: true,
    canonical: true,
    randomDelay: true,
    insertPosition: "bottom",
    linkText: "📌 원문 보기",
  },
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
  gsc: {
    connected: true,
    siteUrl: "tarryblog.org",
    googleAdsApiKey: "",
    customerId: "",
    nicheKeywords: true,
    highCpcFirst: true,
  },
};

const STORAGE_KEY = "blogauto_monetization_v1";

// ─── 유틸 ─────────────────────────────────────────────────
function loadState(): MonetizationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STATE;
}

function saveState(state: MonetizationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── 서브 컴포넌트: Toggle ─────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, flexShrink: 0, cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={{
        position: "absolute", inset: 0, borderRadius: 12,
        background: checked ? "var(--green)" : "rgba(255,255,255,0.1)",
        transition: "background 0.3s",
        boxShadow: checked ? "0 0 10px rgba(0,229,160,0.4)" : "none",
      }}>
        <span style={{
          position: "absolute", top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff", transition: "left 0.3s",
        }} />
      </span>
    </label>
  );
}

// ─── 서브 컴포넌트: StatusBadge ────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    connected: { color: "var(--green)", label: "✓ 연결됨" },
    pending: { color: "var(--yellow)", label: "⏳ 대기중" },
    error: { color: "var(--red)", label: "✕ 오류" },
    disconnected: { color: "var(--muted)", label: "미연동" },
    warning: { color: "var(--yellow)", label: "⚠ 미연동" },
  };
  const s = map[status] || map.disconnected;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
      background: `${s.color}22`, border: `1px solid ${s.color}55`,
      color: s.color, whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

// ─── 서브 컴포넌트: SectionTitle ──────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 700, color: "var(--muted)",
      textTransform: "uppercase", letterSpacing: 1,
      marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
    }}>
      {children}
      <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ─── 서브 컴포넌트: Card ───────────────────────────────────
function Card({ accent, children, style }: {
  accent: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  const accentMap: Record<string, string> = {
    green: "#00e5a0", blue: "#3b82f6", purple: "#a855f7",
    orange: "#f97316", yellow: "#eab308", pink: "#ec4899", cyan: "#06b6d4",
  };
  const color = accentMap[accent] || accentMap.green;
  return (
    <div style={{
      background: "var(--card)",
      border: `1px solid var(--border)`,
      borderRadius: 20, padding: "24px 24px 20px",
      position: "relative", overflow: "hidden",
      boxShadow: `0 0 30px ${color}0a`,
      transition: "transform 0.2s, box-shadow 0.2s",
      ...style,
    }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px ${color}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${color}0a`;
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
      {children}
    </div>
  );
}

// ─── 서브 컴포넌트: InputField ─────────────────────────────
function InputField({ label, placeholder, value, onChange, type = "text" }: {
  label: string; placeholder?: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)", borderRadius: 10,
          padding: "10px 14px", color: "var(--text)", fontSize: 13,
          outline: "none", transition: "border 0.2s",
          fontFamily: "inherit",
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,160,0.4)"; e.target.style.background = "rgba(0,229,160,0.04)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
      />
    </div>
  );
}

// ─── 서브 컴포넌트: ToggleRow ──────────────────────────────
function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────
export default function MonetizationPage() {
  const [state, setState] = useState<MonetizationState>(loadState);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [newDomain, setNewDomain] = useState("");

  // deep update helper
  const update = useCallback(<K extends keyof MonetizationState>(
    section: K,
    patch: Partial<MonetizationState[K]>
  ) => {
    setState((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
    setDirty(true);
    setSaved(false);
  }, []);

  const handleSave = () => {
    saveState(state);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm("설정을 초기화할까요?")) {
      setState(DEFAULT_STATE);
      saveState(DEFAULT_STATE);
      setDirty(false);
    }
  };

  // 진행률 계산
  const progress = [
    state.adsense.status === "connected",
    state.backlink.domains.length > 0,
    state.platforms.blogger.connected || state.platforms.medium.connected,
    state.ping.enabled,
    state.gsc.connected,
  ];
  const progressPct = Math.round((progress.filter(Boolean).length / progress.length) * 100);

  const CSS_VARS = `
    :root {
      --bg: #0a0e1a; --bg2: #0f1525; --bg3: #151d35;
      --card: #111827; --border: rgba(255,255,255,0.07);
      --text: #f0f4ff; --muted: #6b7a99;
      --green: #00e5a0; --blue: #3b82f6; --purple: #a855f7;
      --orange: #f97316; --yellow: #eab308; --pink: #ec4899;
      --cyan: #06b6d4; --red: #ef4444;
    }
    * { box-sizing: border-box; }
    body { background: var(--bg); color: var(--text); font-family: 'Pretendard', -apple-system, sans-serif; }
    select, option { background: #111827; color: var(--text); }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
  `;

  return (
    <>
      <style>{CSS_VARS}</style>
      <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative", overflow: "hidden" }}>

        {/* 배경 글로우 */}
        <div style={{ position: "fixed", top: -200, left: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: -200, right: -200, width: 600, height: 600, background: "radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* 헤더 */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(10,14,26,0.85)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/settings" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              ← 돌아가기
            </a>
            <div style={{ width: 1, height: 16, background: "var(--border)" }} />
            <span style={{
              fontSize: 17, fontWeight: 800,
              background: "linear-gradient(135deg, var(--green), var(--cyan))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>BlogAuto Pro</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
              background: "linear-gradient(135deg, rgba(0,229,160,0.15), rgba(6,182,212,0.15))",
              border: "1px solid rgba(0,229,160,0.3)", color: "var(--green)",
            }}>수익화 센터</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)", animation: "pulse 2s infinite" }} />
            자동 저장 활성
          </div>
        </div>

        {/* 메인 */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 120px", position: "relative", zIndex: 1 }}>

          {/* 히어로 */}
          <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeUp 0.6s ease both" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.25)",
              color: "var(--green)", fontSize: 12, fontWeight: 600,
              padding: "5px 14px", borderRadius: 20, marginBottom: 20, letterSpacing: 0.5,
            }}>
              💰 수익화 자동화 센터
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.2, marginBottom: 14, letterSpacing: -1 }}>
              블로그 수익을{" "}
              <span style={{
                background: "linear-gradient(135deg, var(--green) 0%, var(--cyan) 50%, var(--blue) 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>자동화</span>하세요
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.6 }}>
              애드센스 연동부터 색인 최적화까지 — 수익화에 필요한 모든 기능을 한 곳에서
            </p>
          </div>

          {/* 전체 진행률 */}
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "28px 32px", marginBottom: 36,
            display: "flex", alignItems: "center", gap: 32,
            animation: "fadeUp 0.6s ease 0.1s both",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>전체 설정 진행률</div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, height: 10, overflow: "hidden", marginBottom: 8 }}>
                <div style={{
                  height: "100%", borderRadius: 10, width: `${progressPct}%`,
                  background: "linear-gradient(90deg, var(--green), var(--cyan))",
                  boxShadow: "0 0 12px rgba(0,229,160,0.4)", transition: "width 1s ease",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
                <span>{progress.filter(Boolean).length}단계 완료</span>
                <span>{progressPct}%</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { num: progress.filter(Boolean).length, label: "완료", color: "var(--green)" },
                { num: progress.filter(v => !v).length, label: "미설정", color: "var(--muted)" },
                { num: 5, label: "전체 단계", color: "var(--blue)" },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── STEP 1: 애드센스 ─────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <SectionTitle>💰 STEP 1 — 애드센스 연동</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              <Card accent="green">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(0,229,160,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💰</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>Google AdSense</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>광고 코드 등록 및 상태 확인</div>
                    </div>
                  </div>
                  <StatusBadge status={state.adsense.status} />
                </div>

                <InputField label="Publisher ID (ca-pub-XXXXXXXX)" placeholder="ca-pub-1234567890" value={state.adsense.clientId} onChange={(v) => update("adsense", { clientId: v })} />
                <InputField label="광고 슬롯 ID" placeholder="1234567890" value={state.adsense.slotId} onChange={(v) => update("adsense", { slotId: v })} />

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6, textTransform: "uppercase" }}>광고 유형</label>
                  <select
                    value={state.adsense.adUnit}
                    onChange={(e) => update("adsense", { adUnit: e.target.value })}
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 13, fontFamily: "inherit" }}
                  >
                    <option value="auto">자동 광고 (권장)</option>
                    <option value="display">디스플레이 광고</option>
                    <option value="in-article">인아티클 광고</option>
                    <option value="in-feed">인피드 광고</option>
                  </select>
                </div>

                <ToggleRow label="자동 광고 활성화" sub="Google이 최적 위치에 자동 배치" checked={state.adsense.autoAds} onChange={(v) => update("adsense", { autoAds: v })} />

                <button
                  onClick={() => {
                    if (state.adsense.clientId && state.adsense.slotId) {
                      update("adsense", { status: "connected" });
                    } else {
                      alert("Publisher ID와 슬롯 ID를 입력해주세요.");
                    }
                  }}
                  style={{
                    marginTop: 16, width: "100%", padding: "12px", borderRadius: 12,
                    background: state.adsense.status === "connected" ? "rgba(0,229,160,0.1)" : "linear-gradient(135deg, var(--green), var(--cyan))",
                    border: state.adsense.status === "connected" ? "1px solid rgba(0,229,160,0.3)" : "none",
                    color: state.adsense.status === "connected" ? "var(--green)" : "#000",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {state.adsense.status === "connected" ? "✓ 연동 완료" : "🔗 애드센스 연동하기"}
                </button>
              </Card>

              <Card accent="yellow">
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(234,179,8,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>광고 수익 현황</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>오늘 예상 수익</div>
                  </div>
                </div>

                <div style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: 14, padding: 20, marginBottom: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "var(--yellow)" }}>$0.00</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>오늘 / 이번 달 $0.00</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "페이지뷰", val: "—", icon: "👁" },
                    { label: "클릭수", val: "—", icon: "🖱" },
                    { label: "CTR", val: "—", icon: "📈" },
                    { label: "RPM", val: "—", icon: "💵" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: 18 }}>{s.icon}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)", borderRadius: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                  💡 애드센스를 연동하면 실시간 수익 데이터가 표시됩니다.
                </div>
              </Card>
            </div>
          </div>

          {/* ─── STEP 2: 백링크 ───────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <SectionTitle>🔗 STEP 2 — 백링크 도메인 설정</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              <Card accent="blue">
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌐</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>내 도메인 관리</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>백링크 출처 도메인 등록</div>
                  </div>
                </div>

                {state.backlink.domains.map((d, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 10, marginBottom: 8,
                    background: d === state.backlink.primaryDomain ? "rgba(0,229,160,0.08)" : "rgba(255,255,255,0.03)",
                    border: d === state.backlink.primaryDomain ? "1px solid rgba(0,229,160,0.25)" : "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: d === state.backlink.primaryDomain ? "var(--green)" : "var(--muted)", boxShadow: d === state.backlink.primaryDomain ? "0 0 6px var(--green)" : "none" }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d}</span>
                      {d === state.backlink.primaryDomain && <span style={{ fontSize: 10, color: "var(--green)", background: "rgba(0,229,160,0.1)", padding: "2px 8px", borderRadius: 10 }}>대표</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {d !== state.backlink.primaryDomain && (
                        <button onClick={() => update("backlink", { primaryDomain: d })} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>대표 설정</button>
                      )}
                      {state.backlink.domains.length > 1 && (
                        <button onClick={() => {
                          const newDomains = state.backlink.domains.filter((_, idx) => idx !== i);
                          update("backlink", { domains: newDomains, primaryDomain: d === state.backlink.primaryDomain ? newDomains[0] : state.backlink.primaryDomain });
                        }} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
                      )}
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newDomain.trim()) {
                        update("backlink", { domains: [...state.backlink.domains, newDomain.trim()] });
                        setNewDomain("");
                      }
                    }}
                    placeholder="example.com 입력 후 Enter"
                    style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                  />
                  <button
                    onClick={() => {
                      if (newDomain.trim()) {
                        update("backlink", { domains: [...state.backlink.domains, newDomain.trim()] });
                        setNewDomain("");
                      }
                    }}
                    style={{ padding: "10px 16px", borderRadius: 10, background: "var(--blue)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
                  >+ 추가</button>
                </div>
              </Card>

              <Card accent="pink">
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(236,72,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚙️</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>발행 설정</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>백링크 삽입 옵션</div>
                  </div>
                </div>

                <ToggleRow label="원본 링크 자동 삽입" sub="대표 도메인 링크를 글에 자동 추가" checked={state.backlink.autoInsert} onChange={(v) => update("backlink", { autoInsert: v })} />
                <ToggleRow label="Canonical 태그 적용" sub="중복 콘텐츠 방지 (필수 권장)" checked={state.backlink.canonical} onChange={(v) => update("backlink", { canonical: v })} />
                <ToggleRow label="발행 딜레이 (랜덤)" sub="봇 감지 방지용 랜덤 간격" checked={state.backlink.randomDelay} onChange={(v) => update("backlink", { randomDelay: v })} />

                <div style={{ marginTop: 16, marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6, textTransform: "uppercase" }}>링크 삽입 위치</label>
                  <select value={state.backlink.insertPosition} onChange={(e) => update("backlink", { insertPosition: e.target.value as any })} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 13, fontFamily: "inherit" }}>
                    <option value="bottom">글 하단에 삽입</option>
                    <option value="top">글 상단에 삽입</option>
                    <option value="both">상단 + 하단 모두</option>
                  </select>
                </div>
                <InputField label="링크 문구" placeholder="📌 원문 보기" value={state.backlink.linkText} onChange={(v) => update("backlink", { linkText: v })} />
              </Card>
            </div>
          </div>

          {/* ─── STEP 3: 외부 플랫폼 ──────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <SectionTitle>📡 STEP 3 — 외부 플랫폼 동시 발행 (백링크)</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              <Card accent="cyan">
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(6,182,212,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔗</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>플랫폼 연동</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>동시 발행으로 자동 백링크 생성</div>
                  </div>
                </div>

                {/* WordPress (항상 연결됨) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(234,179,8,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>📝</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>WordPress</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>tarryblog.org · 메인 발행</div>
                    </div>
                  </div>
                  <StatusBadge status="connected" />
                </div>

                {/* Blogger */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>🅱️</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Blogger</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>Google 계정 OAuth 연동 필요</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Toggle checked={state.platforms.blogger.enabled} onChange={(v) => setState(prev => ({ ...prev, platforms: { ...prev.platforms, blogger: { ...prev.platforms.blogger, enabled: v } } }))} />
                    <button style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>연동하기</button>
                  </div>
                </div>

                {/* Medium */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>〽️</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Medium</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>API 토큰 등록 필요</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Toggle checked={state.platforms.medium.enabled} onChange={(v) => setState(prev => ({ ...prev, platforms: { ...prev.platforms, medium: { ...prev.platforms.medium, enabled: v } } }))} />
                    <button style={{ fontSize: 11, padding: "5px 12px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>연동하기</button>
                  </div>
                </div>
              </Card>

              {/* Medium API 토큰 입력 (medium 활성화 시) */}
              <Card accent="pink">
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(236,72,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔑</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>플랫폼 인증 정보</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>각 플랫폼 연동 토큰/키</div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--orange)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    🅱️ Blogger OAuth
                  </div>
                  <InputField label="Google 계정 이메일" placeholder="your@gmail.com" value={state.platforms.blogger.account} onChange={(v) => setState(prev => ({ ...prev, platforms: { ...prev.platforms, blogger: { ...prev.platforms.blogger, account: v } } }))} />
                  <button style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(234,88,12,0.1)", border: "1px solid rgba(234,88,12,0.3)", color: "var(--orange)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    Google OAuth 인증하기 →
                  </button>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    〽️ Medium API
                  </div>
                  <InputField label="Medium Integration Token" placeholder="토큰 입력" type="password" value={state.platforms.medium.token} onChange={(v) => setState(prev => ({ ...prev, platforms: { ...prev.platforms, medium: { ...prev.platforms.medium, token: v } } }))} />
                  <button
                    onClick={() => {
                      if (state.platforms.medium.token) {
                        setState(prev => ({ ...prev, platforms: { ...prev.platforms, medium: { ...prev.platforms.medium, connected: true } } }));
                        setDirty(true);
                      }
                    }}
                    style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    {state.platforms.medium.connected ? "✓ 연동됨" : "Medium 연동하기 →"}
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* ─── STEP 4: 핑 서비스 ──────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <SectionTitle>📶 STEP 4 — 핑 서비스 (색인 속도 향상)</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              <Card accent="green">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(0,229,160,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📡</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>핑 서버 목록</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>발행 후 자동으로 알림 전송</div>
                    </div>
                  </div>
                  <Toggle checked={state.ping.enabled} onChange={(v) => update("ping", { enabled: v })} />
                </div>

                {state.ping.servers.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 12px", borderRadius: 10, marginBottom: 8,
                    background: s.active ? "rgba(0,229,160,0.04)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${s.active ? "rgba(0,229,160,0.15)" : "var(--border)"}`,
                    opacity: state.ping.enabled ? 1 : 0.5,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.active ? "var(--green)" : "var(--muted)", boxShadow: s.active ? "0 0 6px var(--green)" : "none", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: s.active ? "var(--green)" : "var(--muted)" }}>{s.active ? "활성" : "비활성"}</span>
                    <Toggle checked={s.active} onChange={(v) => {
                      const servers = state.ping.servers.map((sv, idx) => idx === i ? { ...sv, active: v } : sv);
                      update("ping", { servers });
                    }} />
                  </div>
                ))}
              </Card>

              <Card accent="blue">
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏱️</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>핑 발송 로그</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>최근 발송 기록</div>
                  </div>
                </div>

                {[
                  { title: "트렌드 핫이슈 글 발행", time: "방금 전", ok: true },
                  { title: "생활꿀팁 10가지", time: "2시간 전", ok: true },
                  { title: "돈되는 정보 모음", time: "5시간 전", ok: true },
                ].map((log, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{log.title}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{log.time}</span>
                  </div>
                ))}

                <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.15)", borderRadius: 10, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                  💡 글 발행 즉시 {state.ping.servers.filter(s => s.active).length}개 검색엔진에 자동으로 핑을 전송해 색인 속도를 높여요.
                </div>
              </Card>
            </div>
          </div>

          {/* ─── STEP 5: GSC ──────────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <SectionTitle>🔍 STEP 5 — GSC & 키워드 연동</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              <Card accent="purple">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(168,85,247,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔍</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>Google Search Console</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>실제 유입 키워드 데이터 연동</div>
                    </div>
                  </div>
                  <StatusBadge status={state.gsc.connected ? "connected" : "disconnected"} />
                </div>

                {[
                  { rank: 1, kw: "핫이슈 모음", clicks: 234, pos: 4 },
                  { rank: 2, kw: "생활꿀팁 2026", clicks: 187, pos: 7 },
                  { rank: 3, kw: "돈버는 방법", clicks: 156, pos: 11 },
                  { rank: 4, kw: "오늘 핫이슈", clicks: 98, pos: 15 },
                ].map((kw) => (
                  <div key={kw.rank} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", width: 16, textAlign: "center" }}>{kw.rank}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{kw.kw}</span>
                    <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 700 }}>↑ {kw.clicks}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 6 }}>#{kw.pos}</span>
                  </div>
                ))}

                <button style={{ marginTop: 14, width: "100%", padding: "10px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  전체 키워드 보기 →
                </button>
              </Card>

              <Card accent="orange">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎯</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>구글 키워드 API</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>틈새 키워드 자동 발굴</div>
                    </div>
                  </div>
                  <StatusBadge status={state.gsc.googleAdsApiKey ? "connected" : "warning"} />
                </div>

                <InputField label="Google Ads API Key" placeholder="API 키 입력" value={state.gsc.googleAdsApiKey} onChange={(v) => update("gsc", { googleAdsApiKey: v })} />
                <InputField label="고객 ID (Customer ID)" placeholder="XXX-XXX-XXXX" value={state.gsc.customerId} onChange={(v) => update("gsc", { customerId: v })} />

                <ToggleRow label="틈새 키워드 자동 추천" sub="경쟁도 낮은 키워드 우선 추출" checked={state.gsc.nicheKeywords} onChange={(v) => update("gsc", { nicheKeywords: v })} />
                <ToggleRow label="CPC 높은 키워드 우선" sub="애드센스 수익 최적화" checked={state.gsc.highCpcFirst} onChange={(v) => update("gsc", { highCpcFirst: v })} />

                <button style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg, var(--orange), #f59e0b)", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  🔗 API 연동하기
                </button>
              </Card>
            </div>
          </div>

        </div>

        {/* 저장 바 */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
          background: "rgba(10,14,26,0.95)", backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--border)", padding: "16px 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          transform: dirty || saved ? "translateY(0)" : "translateY(80px)",
          transition: "transform 0.3s ease",
        }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {saved
              ? <span style={{ color: "var(--green)" }}>✓ 저장 완료!</span>
              : <span>변경사항이 있습니다</span>
            }
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleReset} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>초기화</button>
            <button onClick={handleSave} style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, var(--green), var(--cyan))", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              💾 설정 저장
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
