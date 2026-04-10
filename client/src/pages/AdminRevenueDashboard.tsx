import { useState, useEffect, useRef } from "react";

const THEME = {
  dark: {
    bg: "#060b14",
    bg2: "#0d1525",
    bg3: "#111c30",
    card: "rgba(13,21,37,0.95)",
    border: "rgba(255,255,255,0.07)",
    text: "#e8f0ff",
    muted: "#5a6a88",
    sub: "#8899bb",
  },
  light: {
    bg: "#f0f4ff",
    bg2: "#e4ecfa",
    bg3: "#dae5f8",
    card: "rgba(255,255,255,0.95)",
    border: "rgba(0,0,0,0.08)",
    text: "#0d1525",
    muted: "#8899bb",
    sub: "#5a6a88",
  },
};

const ACCENTS = {
  amber: "#f59e0b",
  cyan: "#06b6d4",
  green: "#10b981",
  pink: "#ec4899",
  purple: "#a855f7",
  blue: "#3b82f6",
  orange: "#f97316",
  rose: "#f43f5e",
};

function useTheme() {
  const [dark, setDark] = useState(true);
  return [dark, () => setDark(d => !d), dark ? THEME.dark : THEME.light];
}

function GlowBadge({ color, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 999,
      background: color + "18", border: `1px solid ${color}40`,
      fontSize: 10, fontWeight: 800, color, letterSpacing: 0.8,
      fontFamily: "'DM Mono', monospace",
    }}>{children}</span>
  );
}

function MiniBar({ value, max, color }) {
  return (
    <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

function AnimatedNumber({ target, prefix = "", suffix = "", decimals = 0, color }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = 60;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVal(+(target * (i / steps)).toFixed(decimals));
      if (i >= steps) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span style={{ color: color || "inherit" }}>
      {prefix}{decimals > 0 ? val.toFixed(decimals) : val.toLocaleString()}{suffix}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color, prefix = "", suffix = "", decimals = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `linear-gradient(135deg, ${color}12, ${color}06)` : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? color + "40" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, padding: "18px 20px",
        transition: "all 0.3s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 12px 40px ${color}20` : "none",
        position: "relative", overflow: "hidden",
        cursor: "default",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: hov ? 1 : 0.4, transition: "opacity 0.3s" }} />
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6a88", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'DM Mono', monospace", lineHeight: 1, marginBottom: 4 }}>
        <AnimatedNumber target={typeof value === "number" ? value : 0} prefix={prefix} suffix={suffix} decimals={decimals} color={color} />
      </div>
      <div style={{ fontSize: 11, color: "#5a6a88", fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

function SparkLine({ data, color, height = 50 }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth, H = height;
    canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2);
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((v - min) / range) * (H - 6) - 3 }));
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color + "44"); grad.addColorStop(1, color + "00");
    ctx.beginPath(); ctx.moveTo(pts[0].x, H);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  }, [data, color, height]);
  return <canvas ref={canvasRef} style={{ width: "100%", height }} />;
}

function BarChart({ data, color, labels }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth, H = 120;
    canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2);
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...data);
    const bw = (W / data.length) * 0.6, gap = (W / data.length) * 0.4;
    data.forEach((v, i) => {
      const x = i * (bw + gap) + gap / 2;
      const h = (v / max) * (H - 20);
      const grad = ctx.createLinearGradient(0, H - h, 0, H);
      grad.addColorStop(0, color); grad.addColorStop(1, color + "44");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, H - h - 16, bw, h, [4, 4, 0, 0]);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], x + bw / 2, H - 4);
    });
  }, [data, color, labels]);
  return <canvas ref={canvasRef} style={{ width: "100%", height: 120 }} />;
}

function NavBtn({ label, emoji, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 20px", borderRadius: 12,
        background: hov ? `linear-gradient(135deg, ${color}, ${color}cc)` : "transparent",
        border: `1.5px solid ${hov ? color : color + "60"}`,
        color: hov ? "#000" : color,
        fontWeight: 800, fontSize: 13, cursor: "pointer",
        fontFamily: "inherit", transition: "all 0.2s",
        letterSpacing: 0.3,
        boxShadow: hov ? `0 0 20px ${color}50` : "none",
      }}
    >{emoji} {label}</button>
  );
}

function ThemeBtn({ dark, toggle }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "10px 18px", borderRadius: 12,
        background: hov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
        border: "1.5px solid rgba(255,255,255,0.12)",
        color: "#e8f0ff", fontWeight: 800, fontSize: 13,
        cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
      }}
    >{dark ? "☀️ 라이트" : "🌙 다크"}</button>
  );
}

function PipelineCard({ tc }) {
  const steps = [
    { label: "키워드", icon: "🔍", val: 142, color: ACCENTS.cyan },
    { label: "콘텐츠", icon: "✍️", val: 38, color: ACCENTS.purple },
    { label: "이미지", icon: "🖼", val: 24, color: ACCENTS.pink },
    { label: "배포", icon: "🚀", val: 12, color: ACCENTS.green },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          background: `linear-gradient(135deg, ${s.color}12, ${s.color}06)`,
          border: `1px solid ${s.color}30`,
          borderRadius: 14, padding: "16px 12px", textAlign: "center",
          position: "relative",
        }}>
          {i < steps.length - 1 && (
            <div style={{ position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)", color: s.color, fontSize: 12, zIndex: 2 }}>→</div>
          )}
          <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.val}</div>
          <div style={{ fontSize: 10, color: tc.muted, fontWeight: 700, marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function KeywordRow({ rank, kw, clicks, pos }) {
  const colors = [ACCENTS.amber, ACCENTS.cyan, ACCENTS.green, ACCENTS.purple, ACCENTS.pink];
  const c = colors[(rank - 1) % colors.length];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: c + "22", border: `1px solid ${c}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: c, flexShrink: 0 }}>{rank}</span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw}</span>
      <span style={{ fontSize: 11, color: ACCENTS.green, fontWeight: 900, fontFamily: "'DM Mono', monospace" }}>↑{clicks}</span>
      <span style={{ background: c + "18", border: `1px solid ${c}40`, color: c, fontSize: 9, fontWeight: 900, padding: "2px 7px", borderRadius: 6, fontFamily: "'DM Mono', monospace" }}>#{pos}</span>
    </div>
  );
}

function RevenueCard({ tc }) {
  const daily = [1.2, 0.8, 2.1, 1.8, 3.2, 2.7, 4.1];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted, textTransform: "uppercase", letterSpacing: 1 }}>7일 수익 트렌드</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: ACCENTS.amber, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>$15.90</div>
          <div style={{ fontSize: 11, color: tc.sub, marginTop: 2 }}>이번주 누적 • <span style={{ color: ACCENTS.green }}>↑ 23.4%</span></div>
        </div>
        <GlowBadge color={ACCENTS.green}>● LIVE</GlowBadge>
      </div>
      <SparkLine data={daily} color={ACCENTS.amber} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
        {[["👁","노출","12.4K"],["🖱","클릭","284"],["📈","CTR","2.3%"],["💵","RPM","$1.28"]].map(([ic,lb,v],i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 16 }}>{ic}</div>
            <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "'DM Mono', monospace", color: ACCENTS.amber, marginTop: 4 }}>{v}</div>
            <div style={{ fontSize: 9, color: tc.muted, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>{lb}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ color = ACCENTS.cyan, title, badge, children, tc }) {
  return (
    <div style={{
      background: tc.card,
      border: `1px solid ${color}25`,
      borderRadius: 20,
      padding: "22px",
      backdropFilter: "blur(20px)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}44, transparent)` }} />
      <div style={{ position: "absolute", top: -60, right: -60, width: 160, height: 160, background: `radial-gradient(circle, ${color}0a, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: tc.text }}>{title}</div>
        {badge && <GlowBadge color={color}>{badge}</GlowBadge>}
      </div>
      {children}
    </div>
  );
}

function PlatformStatus({ tc }) {
  const platforms = [
    { name: "WordPress", icon: "🔵", status: true, posts: 38, color: ACCENTS.blue },
    { name: "Naver Blog", icon: "🟢", status: true, posts: 24, color: ACCENTS.green },
    { name: "Medium", icon: "⚫", status: false, posts: 0, color: ACCENTS.muted },
    { name: "Blogger", icon: "🟠", status: false, posts: 0, color: ACCENTS.orange },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {platforms.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${p.status ? p.color + "30" : "rgba(255,255,255,0.05)"}`, borderRadius: 12 }}>
          <span style={{ fontSize: 16 }}>{p.icon}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: tc.text }}>{p.name}</span>
          {p.status ? (
            <>
              <span style={{ fontSize: 11, color: p.color, fontWeight: 900 }}>{p.posts}개</span>
              <GlowBadge color={p.color}>연동됨</GlowBadge>
            </>
          ) : (
            <GlowBadge color={tc.muted}>미연동</GlowBadge>
          )}
        </div>
      ))}
    </div>
  );
}

function MonthlyChart({ tc }) {
  const canvasRef = useRef();
  const data = [420, 680, 1100, 890, 1450, 2100, 1800];
  const labels = ["4/5", "4/6", "4/7", "4/8", "4/9", "4/10", "4/11"];
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth, H = 140;
    canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2);
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...data);
    const pts = data.map((v, i) => ({
      x: 40 + (i / (data.length - 1)) * (W - 60),
      y: 10 + (1 - v / max) * (H - 40),
    }));
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, ACCENTS.cyan + "55");
    grad.addColorStop(1, ACCENTS.cyan + "00");
    ctx.beginPath(); ctx.moveTo(pts[0].x, H - 30);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, H - 30);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = ACCENTS.cyan; ctx.lineWidth = 2.5; ctx.stroke();
    const grad2 = ctx.createLinearGradient(0, 0, 0, H);
    grad2.addColorStop(0, ACCENTS.purple + "44");
    grad2.addColorStop(1, ACCENTS.purple + "00");
    const data2 = [210, 340, 580, 440, 720, 1050, 900];
    const pts2 = data2.map((v, i) => ({
      x: 40 + (i / (data2.length - 1)) * (W - 60),
      y: 10 + (1 - v / max) * (H - 40),
    }));
    ctx.beginPath(); ctx.moveTo(pts2[0].x, H - 30);
    pts2.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts2[pts2.length - 1].x, H - 30);
    ctx.closePath(); ctx.fillStyle = grad2; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts2[0].x, pts2[0].y);
    pts2.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = ACCENTS.purple; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
    labels.forEach((l, i) => {
      ctx.fillText(l, 40 + (i / (data.length - 1)) * (W - 60), H - 16);
    });
    const yVals = [0, 1000, 2000];
    yVals.forEach(v => {
      const y = 10 + (1 - v / max) * (H - 40);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.textAlign = "right";
      ctx.fillText(v >= 1000 ? (v / 1000) + "K" : v, 34, y + 3);
      ctx.beginPath(); ctx.moveTo(38, y); ctx.lineTo(W - 16, y);
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1; ctx.stroke();
    });
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = ACCENTS.cyan; ctx.fill();
    });
  }, []);
  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        {[["방문자", ACCENTS.cyan], ["수익 비례", ACCENTS.purple]].map(([l, c], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#5a6a88" }}>
            <div style={{ width: 20, height: 2, background: c, borderRadius: 2 }} />
            {l}
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", height: 140 }} />
    </div>
  );
}

function PingStatus({ tc }) {
  const logs = [
    { title: "트렌드 핫이슈 글 발행", time: "방금 전", pings: 3, color: ACCENTS.green },
    { title: "생활꿀팁 10가지 정리", time: "2시간 전", pings: 3, color: ACCENTS.green },
    { title: "돈되는 정보 모음 2026", time: "5시간 전", pings: 2, color: ACCENTS.amber },
    { title: "재테크 입문 가이드", time: "어제", pings: 3, color: ACCENTS.cyan },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {logs.map((l, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.025)", borderRadius: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, boxShadow: `0 0 6px ${l.color}`, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: tc.text }}>{l.title}</span>
          <span style={{ fontSize: 10, color: l.color, fontWeight: 900, fontFamily: "'DM Mono', monospace" }}>×{l.pings}</span>
          <span style={{ fontSize: 10, color: tc.muted }}>{l.time}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminRevenueDashboard() {
  const [isDark, toggleTheme, tc] = useTheme();
  const scrollRef = useRef();

  const styles = {
    wrap: {
      minHeight: "100vh",
      background: isDark
        ? `radial-gradient(ellipse 80% 60% at 20% 10%, ${ACCENTS.cyan}0a, transparent), radial-gradient(ellipse 60% 50% at 80% 80%, ${ACCENTS.purple}08, transparent), ${tc.bg}`
        : `radial-gradient(ellipse 80% 60% at 20% 10%, ${ACCENTS.blue}08, transparent), radial-gradient(ellipse 60% 50% at 80% 80%, ${ACCENTS.purple}06, transparent), ${tc.bg}`,
      color: tc.text,
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      transition: "background 0.4s",
    },
    header: {
      position: "sticky", top: 0, zIndex: 100,
      background: isDark ? "rgba(6,11,20,0.92)" : "rgba(240,244,255,0.92)",
      backdropFilter: "blur(24px)",
      borderBottom: `1px solid ${tc.border}`,
      padding: "12px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: 10,
    },
    main: { padding: "28px", maxWidth: 1400, margin: "0 auto" },
  };

  return (
    <div style={styles.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .anim-card { animation: slideUp 0.5s ease both; }
        @media (max-width: 768px) {
          .header-nav { flex-direction: row !important; gap: 6px !important; flex-wrap: nowrap !important; }
          .grid-4 { grid-template-columns: repeat(2,1fr) !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .pipeline-grid { grid-template-columns: repeat(2,1fr) !important; }
          .main-pad { padding: 16px !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${ACCENTS.cyan}, ${ACCENTS.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: `0 0 20px ${ACCENTS.cyan}40`,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: tc.text, letterSpacing: -0.3 }}>BlogAuto Pro</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: tc.muted, textTransform: "uppercase", letterSpacing: 1 }}>관리자 수익 컨트롤 타워</div>
          </div>
        </div>

        <div className="header-nav" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: ACCENTS.green + "15", border: `1px solid ${ACCENTS.green}40`, borderRadius: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENTS.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: ACCENTS.green, fontFamily: "'DM Mono', monospace" }}>LIVE</span>
          </div>
          <ThemeBtn dark={isDark} toggle={toggleTheme} />
          <button
            onClick={() => window.location.href = "/superadmin"}
            title="슈퍼어드민으로 이동"
            style={{ padding: "8px 11px", borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", border: "none", cursor: "pointer", fontSize: 17, lineHeight: 1, boxShadow: "0 0 10px rgba(239,68,68,0.4)", flexShrink: 0 }}>
            🏠
          </button>
          <button
            onClick={() => window.location.href = "/monetization"}
            title="수익화 페이지로 이동"
            style={{ padding: "8px 11px", borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", border: "none", cursor: "pointer", fontSize: 17, lineHeight: 1, boxShadow: "0 0 10px rgba(239,68,68,0.4)", flexShrink: 0 }}>
            💰
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main} className="main-pad">

        {/* 히어로 헤더 */}
        <div style={{ marginBottom: 28, paddingTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: tc.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            TARRY · ADMIN ONLY DASHBOARD
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: tc.text, letterSpacing: -0.5, lineHeight: 1.2 }}>
            실시간 수익 컨트롤 타워
            <span style={{ display: "inline-block", marginLeft: 12 }}>
              <GlowBadge color={ACCENTS.cyan}>LIVE</GlowBadge>
            </span>
          </div>
          <div style={{ fontSize: 13, color: tc.muted, marginTop: 6 }}>
            오늘 {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })} · tarryblog.org 기준
          </div>
        </div>

        {/* 스탯 카드 4개 */}
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <div className="anim-card" style={{ animationDelay: "0ms" }}>
            <StatCard icon="💰" label="오늘 수익" value={4.27} prefix="$" decimals={2} color={ACCENTS.amber} sub="어제 대비 ↑ 23%" />
          </div>
          <div className="anim-card" style={{ animationDelay: "80ms" }}>
            <StatCard icon="👥" label="오늘 방문자" value={2140} color={ACCENTS.cyan} sub="전주 동일요일 ↑ 18%" />
          </div>
          <div className="anim-card" style={{ animationDelay: "160ms" }}>
            <StatCard icon="📝" label="발행 글 수" value={38} suffix="개" color={ACCENTS.purple} sub="이번달 누적 142개" />
          </div>
          <div className="anim-card" style={{ animationDelay: "240ms" }}>
            <StatCard icon="🎯" label="이번달 수익" value={31.84} prefix="$" decimals={2} color={ACCENTS.green} sub="목표 $100 · 31% 달성" />
          </div>
        </div>

        {/* 메인 그리드: 트래픽 + 수익 */}
        <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
          <div className="anim-card" style={{ animationDelay: "300ms" }}>
            <Card color={ACCENTS.cyan} title="📊 트래픽 & 수익 추이 (7일)" badge="LIVE" tc={tc}>
              <MonthlyChart tc={tc} />
            </Card>
          </div>
          <div className="anim-card" style={{ animationDelay: "360ms" }}>
            <Card color={ACCENTS.amber} title="💵 애드센스 상세" badge="연동됨" tc={tc}>
              <RevenueCard tc={tc} />
            </Card>
          </div>
        </div>

        {/* 자동화 파이프라인 */}
        <div className="anim-card" style={{ animationDelay: "400ms", marginBottom: 14 }}>
          <Card color={ACCENTS.green} title="⚡ 자동화 파이프라인 현황" badge="진행중" tc={tc}>
            <div className="pipeline-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "키워드 수집", icon: "🔍", val: 142, status: "완료", color: ACCENTS.cyan },
                { label: "콘텐츠 생성", icon: "✍️", val: 38, status: "진행 중", color: ACCENTS.purple },
                { label: "이미지 생성", icon: "🖼️", val: 24, status: "대기 중", color: ACCENTS.pink },
                { label: "배포 예약", icon: "🚀", val: 12, status: "예약됨", color: ACCENTS.green },
              ].map((s, i) => (
                <div key={i} style={{
                  background: `linear-gradient(135deg, ${s.color}12, ${s.color}06)`,
                  border: `1px solid ${s.color}30`, borderRadius: 14, padding: "16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: tc.muted, marginTop: 4, fontWeight: 700 }}>{s.label}</div>
                  <GlowBadge color={s.color}>{s.status}</GlowBadge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 하단 3열 */}
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

          {/* 인기 키워드 */}
          <div className="anim-card" style={{ animationDelay: "440ms" }}>
            <Card color={ACCENTS.purple} title="🏆 인기 키워드 TOP 5" badge="GSC" tc={tc}>
              {[
                { rank: 1, kw: "맛집 추천", clicks: 8500, pos: 3 },
                { rank: 2, kw: "여행 코스", clicks: 7200, pos: 5 },
                { rank: 3, kw: "재테크 방법", clicks: 6500, pos: 8 },
                { rank: 4, kw: "다이어트 식단", clicks: 5800, pos: 11 },
                { rank: 5, kw: "인테리어 소품", clicks: 4900, pos: 14 },
              ].map((kw, i) => (
                <KeywordRow key={i} {...kw} />
              ))}
            </Card>
          </div>

          {/* 플랫폼 현황 */}
          <div className="anim-card" style={{ animationDelay: "500ms" }}>
            <Card color={ACCENTS.blue} title="🌐 플랫폼 연동 현황" tc={tc}>
              <PlatformStatus tc={tc} />
              <div style={{ marginTop: 14, padding: "12px", background: ACCENTS.blue + "0d", border: `1px solid ${ACCENTS.blue}25`, borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: ACCENTS.blue, fontFamily: "'DM Mono', monospace" }}>62</div>
                  <div style={{ fontSize: 9, color: tc.muted, fontWeight: 700 }}>총 발행</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: ACCENTS.green, fontFamily: "'DM Mono', monospace" }}>2</div>
                  <div style={{ fontSize: 9, color: tc.muted, fontWeight: 700 }}>연동 플랫폼</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: ACCENTS.amber, fontFamily: "'DM Mono', monospace" }}>3</div>
                  <div style={{ fontSize: 9, color: tc.muted, fontWeight: 700 }}>핑 서버 활성</div>
                </div>
              </div>
            </Card>
          </div>

          {/* 핑 & 발행 로그 */}
          <div className="anim-card" style={{ animationDelay: "560ms" }}>
            <Card color={ACCENTS.pink} title="📡 핑 발송 로그" badge="자동" tc={tc}>
              <PingStatus tc={tc} />
              <div style={{ marginTop: 12, padding: "10px 12px", background: ACCENTS.green + "0d", border: `1px solid ${ACCENTS.green}25`, borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: tc.muted, lineHeight: 1.7 }}>
                  💡 발행 즉시 <strong style={{ color: ACCENTS.green }}>3개</strong> 검색엔진 자동 핑 → 색인 속도 향상
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 월 목표 달성률 */}
        <div className="anim-card" style={{ animationDelay: "620ms", marginTop: 14 }}>
          <Card color={ACCENTS.rose} title="🎯 이번달 목표 달성률" tc={tc}>
            <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              {[
                { label: "수익 목표", current: 31.84, target: 100, unit: "$", color: ACCENTS.amber },
                { label: "발행 글", current: 142, target: 300, unit: "개", color: ACCENTS.purple },
                { label: "방문자", current: 14200, target: 50000, unit: "명", color: ACCENTS.cyan },
                { label: "키워드", current: 28, target: 50, unit: "개", color: ACCENTS.green },
              ].map((g, i) => {
                const pct = Math.round((g.current / g.target) * 100);
                return (
                  <div key={i} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted }}>{g.label}</div>
                      <span style={{ fontSize: 13, fontWeight: 900, color: g.color, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 10 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${g.color}, ${g.color}aa)`, borderRadius: 6, transition: "width 1.5s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: tc.sub }}>
                      <span style={{ color: g.color, fontWeight: 900 }}>{g.unit === "$" ? `$${g.current.toFixed(2)}` : g.current.toLocaleString() + g.unit}</span>
                      <span style={{ color: tc.muted }}> / {g.unit === "$" ? `$${g.target}` : g.target.toLocaleString() + g.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 푸터 */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${tc.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 11, color: tc.muted }}>
            BlogAuto Pro · Admin Control Tower · TARRY (김종훈)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => window.location.href = "/superadmin"}
              style={{ padding: "8px 11px", borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", border: "none", cursor: "pointer", fontSize: 17, lineHeight: 1, boxShadow: "0 0 10px rgba(239,68,68,0.4)" }}>
              🏠
            </button>
            <button
              onClick={() => window.location.href = "/monetization"}
              style={{ padding: "8px 11px", borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", border: "none", cursor: "pointer", fontSize: 17, lineHeight: 1, boxShadow: "0 0 10px rgba(239,68,68,0.4)" }}>
              💰
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
