import { useState, useEffect, useRef, useCallback } from "react";

// ── 테마 ──────────────────────────────────────────────
const THEME = {
  dark: {
    bg: "#060b14", bg2: "#0d1525", bg3: "#111c30",
    card: "rgba(13,21,37,0.95)", border: "rgba(255,255,255,0.07)",
    text: "#e8f0ff", muted: "#5a6a88", sub: "#8899bb",
  },
  light: {
    bg: "#f0f4ff", bg2: "#e4ecfa", bg3: "#dae5f8",
    card: "rgba(255,255,255,0.97)", border: "rgba(0,0,0,0.08)",
    text: "#0d1525", muted: "#8899bb", sub: "#5a6a88",
  },
};

const ACCENTS = {
  amber: "#f59e0b", cyan: "#06b6d4", green: "#10b981",
  pink: "#ec4899", purple: "#a855f7", blue: "#3b82f6",
  orange: "#f97316", rose: "#f43f5e",
};

// ── 훅 ────────────────────────────────────────────────
function useTheme() {
  const [dark, setDark] = useState(true);
  return [dark, () => setDark((d) => !d), dark ? THEME.dark : THEME.light] as const;
}
function useIsMobile() {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}

// ── 베지어 곡선 헬퍼 ─────────────────────────────────
function drawSmoothLine(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.quadraticCurveTo(
    pts[pts.length - 2].x, pts[pts.length - 2].y,
    pts[pts.length - 1].x, pts[pts.length - 1].y
  );
  ctx.stroke();
}

// ── 공통 컴포넌트 ─────────────────────────────────────
function GlowBadge({ color, children }: any) {
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

function AnimatedNumber({ target, prefix = "", suffix = "", decimals = 0, color }: any) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = 60; let i = 0;
    const timer = setInterval(() => {
      i++;
      setVal(+(target * (i / steps)).toFixed(decimals));
      if (i >= steps) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [target, decimals]);
  return (
    <span style={{ color: color || "inherit" }}>
      {prefix}{decimals > 0 ? val.toFixed(decimals) : val.toLocaleString()}{suffix}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color, prefix = "", suffix = "", decimals = 0, tc }: any) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `linear-gradient(135deg, ${color}12, ${color}06)` : "rgba(255,255,255,0.03)",
        border: `1px solid ${hov ? color + "40" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, padding: "18px 20px", transition: "all 0.3s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 12px 40px ${color}20` : "none",
        position: "relative", overflow: "hidden", cursor: "default",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: hov ? 1 : 0.4, transition: "opacity 0.3s" }} />
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'DM Mono', monospace", lineHeight: 1, marginBottom: 4 }}>
        <AnimatedNumber target={typeof value === "number" ? value : 0} prefix={prefix} suffix={suffix} decimals={decimals} color={color} />
      </div>
      <div style={{ fontSize: 11, color: tc.muted, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

// ── SparkLine (베지어 + 리사이즈 대응) ──────────────
function SparkLine({ data, color, height = 50 }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.offsetWidth) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.offsetWidth, H = height;
    canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2);
    const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
    const pts = data.map((v: number, i: number) => ({
      x: (i / (data.length - 1)) * W,
      y: H - ((v - min) / range) * (H - 6) - 3,
    }));
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color + "44"); grad.addColorStop(1, color + "00");
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H);
    for (let i = 1; i < pts.length - 1; i++) {
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    }
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(pts[pts.length - 1].x, H);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill(); ctx.restore();
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    drawSmoothLine(ctx, pts);
  }, [data, color, height]);
  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);
  return <canvas ref={canvasRef} style={{ width: "100%", height }} />;
}

// ── MonthlyChart (베지어 + 툴팁 + 터치 + 리사이즈) ──
function MonthlyChart({ tc, isMobile }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const H = isMobile ? 105 : 140;
  const data = [420, 680, 1100, 890, 1450, 2100, 1800];
  const labels = ["4/5", "4/6", "4/7", "4/8", "4/9", "4/10", "4/11"];
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; val: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.offsetWidth) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.offsetWidth;
    canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2);
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...data);
    const padL = 36, padR = 14, padT = 8, padB = 26;
    const getX = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
    const getY = (v: number) => padT + (1 - v / max) * (H - padT - padB);
    const pts = data.map((v, i) => ({ x: getX(i), y: getY(v) }));
    const pts2 = [210, 340, 580, 440, 720, 1050, 900].map((v, i) => ({ x: getX(i), y: getY(v) }));
    // 그리드
    [0, 1000, 2000].forEach((v) => {
      const y = getY(v);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y);
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.font = "bold 8px monospace"; ctx.textAlign = "right";
      ctx.fillText(v >= 1000 ? (v / 1000) + "K" : String(v), padL - 3, y + 3);
    });
    // 채우기 cyan
    const g1 = ctx.createLinearGradient(0, 0, 0, H);
    g1.addColorStop(0, ACCENTS.cyan + "40"); g1.addColorStop(1, ACCENTS.cyan + "00");
    ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0].x, H - padB);
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(pts[pts.length - 1].x, H - padB); ctx.closePath();
    ctx.fillStyle = g1; ctx.fill(); ctx.restore();
    // 선 cyan
    ctx.strokeStyle = ACCENTS.cyan; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    drawSmoothLine(ctx, pts);
    // 채우기 purple
    const g2 = ctx.createLinearGradient(0, 0, 0, H);
    g2.addColorStop(0, ACCENTS.purple + "30"); g2.addColorStop(1, ACCENTS.purple + "00");
    ctx.save(); ctx.beginPath(); ctx.moveTo(pts2[0].x, H - padB);
    for (let i = 1; i < pts2.length - 1; i++) ctx.quadraticCurveTo(pts2[i].x, pts2[i].y, (pts2[i].x + pts2[i + 1].x) / 2, (pts2[i].y + pts2[i + 1].y) / 2);
    ctx.quadraticCurveTo(pts2[pts2.length - 2].x, pts2[pts2.length - 2].y, pts2[pts2.length - 1].x, pts2[pts2.length - 1].y);
    ctx.lineTo(pts2[pts2.length - 1].x, H - padB); ctx.closePath();
    ctx.fillStyle = g2; ctx.fill(); ctx.restore();
    // 선 purple 점선
    ctx.strokeStyle = ACCENTS.purple; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    drawSmoothLine(ctx, pts2); ctx.setLineDash([]);
    // X축 라벨
    ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
    labels.forEach((l, i) => ctx.fillText(l, getX(i), H - 5));
    // 데이터 포인트
    pts.forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ACCENTS.cyan; ctx.fill();
      ctx.strokeStyle = "rgba(6,11,20,0.9)"; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }, [H]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const handleInteract = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const W = rect.width;
    const padL = 36, padR = 14, padT = 8, padB = 26;
    const ptXs = data.map((_, i) => padL + (i / (data.length - 1)) * (W - padL - padR));
    let nearest = 0, minDist = Infinity;
    ptXs.forEach((px, i) => { const d = Math.abs(mouseX - px); if (d < minDist) { minDist = d; nearest = i; } });
    if (minDist < 44) {
      const max = Math.max(...data);
      const ry = rect.height / H;
      const y = (padT + (1 - data[nearest] / max) * (H - padT - padB)) * ry;
      setTooltip({ x: ptXs[nearest], y, label: labels[nearest], val: data[nearest] });
    } else setTooltip(null);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
        {[["방문자", ACCENTS.cyan, false], ["수익 비례", ACCENTS.purple, true]].map(([l, c, dashed]: any, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: tc.muted }}>
            <svg width={20} height={4}><line x1={0} y1={2} x2={20} y2={2} stroke={c} strokeWidth={2} strokeDasharray={dashed ? "4 3" : undefined} /></svg>
            {l}
          </div>
        ))}
      </div>
      <div style={{ position: "relative" }}
        onMouseMove={(e) => handleInteract(e.clientX)}
        onMouseLeave={() => setTooltip(null)}
        onTouchMove={(e) => { e.preventDefault(); handleInteract(e.touches[0].clientX); }}
        onTouchEnd={() => setTimeout(() => setTooltip(null), 1800)}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: H, display: "block" }} />
        {tooltip && (
          <div style={{
            position: "absolute", left: tooltip.x, top: Math.max(2, tooltip.y - 44),
            transform: "translateX(-50%)",
            background: "rgba(5,10,20,0.97)", border: `1px solid ${ACCENTS.cyan}50`,
            borderRadius: 8, padding: "5px 10px", pointerEvents: "none",
            fontSize: 11, fontFamily: "'DM Mono', monospace", color: ACCENTS.cyan,
            whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.6)", zIndex: 10,
          }}>
            <div style={{ fontSize: 9, color: "#5a6a88", marginBottom: 2 }}>{tooltip.label}</div>
            <div>{tooltip.val.toLocaleString()} <span style={{ fontSize: 9, color: "#5a6a88" }}>명</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── RevenueCard (라이브 틱) ──────────────────────────
function RevenueCard({ tc }: any) {
  const [live, setLive] = useState(15.90);
  const daily = [1.2, 0.8, 2.1, 1.8, 3.2, 2.7, 4.1];
  useEffect(() => {
    const t = setInterval(() => setLive((v) => +(v + (Math.random() * 0.004 - 0.001)).toFixed(2)), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted, textTransform: "uppercase", letterSpacing: 1 }}>7일 수익 트렌드</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: ACCENTS.amber, fontFamily: "'DM Mono', monospace", marginTop: 4, transition: "color 0.3s" }}>
            ${live.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: tc.sub, marginTop: 2 }}>이번주 누적 · <span style={{ color: ACCENTS.green }}>↑ 23.4%</span></div>
        </div>
        <GlowBadge color={ACCENTS.green}>● LIVE</GlowBadge>
      </div>
      <SparkLine data={daily} color={ACCENTS.amber} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
        {[["👁", "노출", "12.4K"], ["🖱", "클릭", "284"], ["📈", "CTR", "2.3%"], ["💵", "RPM", "$1.28"]].map(([ic, lb, v], i) => (
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

// ── GoalBar (0→target 애니메이션 프로그레스) ─────────
function GoalBar({ label, current, target, unit, color, tc }: any) {
  const finalPct = Math.min(100, Math.round((current / target) * 100));
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPct(finalPct), 150);
    return () => clearTimeout(t);
  }, [finalPct]);
  return (
    <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted }}>{label}</div>
        <span style={{ fontSize: 13, fontWeight: 900, color, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 6, transition: "width 1.5s cubic-bezier(0.34, 1.1, 0.64, 1)",
          boxShadow: pct > 80 ? `0 0 8px ${color}80` : "none",
        }} />
      </div>
      <div style={{ fontSize: 11, color: tc.sub }}>
        <span style={{ color, fontWeight: 900 }}>{unit === "$" ? `$${current.toFixed(2)}` : current.toLocaleString() + unit}</span>
        <span style={{ color: tc.muted }}> / {unit === "$" ? `$${target}` : target.toLocaleString() + unit}</span>
      </div>
    </div>
  );
}

// ── 모바일 목표 바 (캔버스 그래프) ──────────────────
function MobileGoalBar({ label, current, target, unit, color, tc }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalPct = Math.min(100, Math.round((current / target) * 100));
  const [pct, setPct] = useState(0);
  useEffect(() => { const t = setTimeout(() => setPct(finalPct), 150); return () => clearTimeout(t); }, [finalPct]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.offsetWidth) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.offsetWidth, H = 8;
    canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath(); (ctx as any).roundRect(0, 0, W, H, 4); ctx.fill();
    if (pct > 0) {
      const grad = ctx.createLinearGradient(0, 0, W * (pct / 100), 0);
      grad.addColorStop(0, color + "cc"); grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath(); (ctx as any).roundRect(0, 0, W * (pct / 100), H, 4); ctx.fill();
      if (pct > 75) { ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.beginPath(); (ctx as any).roundRect(0, 0, W * (pct / 100), H, 4); ctx.fill(); ctx.shadowBlur = 0; }
    }
  }, [pct, color]);
  return (
    <div style={{ padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted }}>{label}</div>
        <span style={{ fontSize: 12, fontWeight: 900, color, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", height: 8, display: "block", marginBottom: 8 }} />
      <div style={{ fontSize: 10, color: tc.muted }}>
        <span style={{ color, fontWeight: 700 }}>{unit === "$" ? `$${current.toFixed(0)}` : current.toLocaleString() + unit}</span>
        {" / "}{unit === "$" ? `$${target}` : target.toLocaleString() + unit}
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────
function Card({ color = ACCENTS.cyan, title, badge, children, tc }: any) {
  return (
    <div style={{
      background: tc.card, border: `1px solid ${color}25`,
      borderRadius: 20, padding: "22px",
      backdropFilter: "blur(20px)", position: "relative", overflow: "hidden",
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

function KeywordRow({ rank, kw, clicks, pos }: any) {
  const colors = [ACCENTS.amber, ACCENTS.cyan, ACCENTS.green, ACCENTS.purple, ACCENTS.pink];
  const c = colors[(rank - 1) % colors.length];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: c + "22", border: `1px solid ${c}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: c, flexShrink: 0 }}>{rank}</span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw}</span>
      <span style={{ fontSize: 11, color: ACCENTS.green, fontWeight: 900, fontFamily: "'DM Mono', monospace" }}>↑{clicks.toLocaleString()}</span>
      <span style={{ background: c + "18", border: `1px solid ${c}40`, color: c, fontSize: 9, fontWeight: 900, padding: "2px 7px", borderRadius: 6, fontFamily: "'DM Mono', monospace" }}>#{pos}</span>
    </div>
  );
}

function PlatformStatus({ tc }: any) {
  const platforms = [
    { name: "WordPress", icon: "🔵", status: true, posts: 38, color: ACCENTS.blue },
    { name: "Naver Blog", icon: "🟢", status: true, posts: 24, color: ACCENTS.green },
    { name: "Medium", icon: "⚫", status: false, posts: 0, color: tc.muted },
    { name: "Blogger", icon: "🟠", status: false, posts: 0, color: ACCENTS.orange },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {platforms.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${p.status ? p.color + "30" : "rgba(255,255,255,0.05)"}`, borderRadius: 12 }}>
          <span style={{ fontSize: 16 }}>{p.icon}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: tc.text }}>{p.name}</span>
          {p.status
            ? <><span style={{ fontSize: 11, color: p.color, fontWeight: 900 }}>{p.posts}개</span><GlowBadge color={p.color}>연동됨</GlowBadge></>
            : <GlowBadge color={tc.muted}>미연동</GlowBadge>}
        </div>
      ))}
    </div>
  );
}

function PingStatus({ tc }: any) {
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

function ThemeBtn({ dark, toggle }: any) {
  return (
    <button onClick={toggle} style={{
      padding: "9px 14px", borderRadius: 12,
      background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.12)",
      color: "#e8f0ff", fontWeight: 800, fontSize: 12,
      cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", flexShrink: 0,
    }}>{dark ? "☀️" : "🌙"}</button>
  );
}

function NavIconBtn({ emoji, title: ttl, href, color }: any) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={() => window.location.href = href} title={ttl}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "8px 13px", borderRadius: 10,
        background: hov ? `${color}22` : `${color}10`,
        border: `1.5px solid ${hov ? color + "70" : color + "30"}`,
        color, cursor: "pointer", fontSize: 16, lineHeight: 1,
        transition: "all 0.2s", boxShadow: hov ? `0 0 14px ${color}40` : "none", flexShrink: 0,
      }}>{emoji}</button>
  );
}

// ── 메인 ─────────────────────────────────────────────
export default function AdminRevenueDashboard() {
  const [isDark, toggleTheme, tc] = useTheme();
  const isMobile = useIsMobile();

  const goals = [
    { label: "수익 목표", current: 31.84, target: 100, unit: "$", color: ACCENTS.amber },
    { label: "발행 글", current: 142, target: 300, unit: "개", color: ACCENTS.purple },
    { label: "방문자", current: 14200, target: 50000, unit: "명", color: ACCENTS.cyan },
    { label: "키워드", current: 28, target: 50, unit: "개", color: ACCENTS.green },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark
        ? `radial-gradient(ellipse 80% 60% at 20% 10%, ${ACCENTS.cyan}0a, transparent), radial-gradient(ellipse 60% 50% at 80% 80%, ${ACCENTS.purple}08, transparent), ${tc.bg}`
        : `radial-gradient(ellipse 80% 60% at 20% 10%, ${ACCENTS.blue}08, transparent), radial-gradient(ellipse 60% 50% at 80% 80%, ${ACCENTS.purple}06, transparent), ${tc.bg}`,
      color: tc.text,
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
      transition: "background 0.4s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .anim-card { animation: slideUp 0.45s ease both; }
        @media (max-width: 768px) {
          .stat-grid  { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .main-grid  { grid-template-columns: 1fr !important; }
          .pip-grid   { grid-template-columns: repeat(2,1fr) !important; }
          .bot-grid   { grid-template-columns: 1fr !important; }
          .goal-grid  { grid-template-columns: repeat(2,1fr) !important; gap: 10px !important; }
          .main-pad   { padding: 14px !important; }
          .hdr-inner  { padding: 10px 14px !important; }
        }
        @media (max-width: 400px) {
          .stat-grid { grid-template-columns: 1fr !important; }
          .goal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* HEADER */}
      <div className="hdr-inner" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: isDark ? "rgba(6,11,20,0.92)" : "rgba(240,244,255,0.92)",
        backdropFilter: "blur(24px)", borderBottom: `1px solid ${tc.border}`,
        padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENTS.cyan}, ${ACCENTS.purple})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, boxShadow: `0 0 18px ${ACCENTS.cyan}40`,
          }}>⚡</div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: tc.text, letterSpacing: -0.3 }}>BlogAuto Pro</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: tc.muted, textTransform: "uppercase", letterSpacing: 1 }}>관리자 수익 컨트롤 타워</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: ACCENTS.green + "15", border: `1px solid ${ACCENTS.green}40`, borderRadius: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENTS.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: ACCENTS.green, fontFamily: "'DM Mono', monospace" }}>LIVE</span>
          </div>
          <ThemeBtn dark={isDark} toggle={toggleTheme} />
          <NavIconBtn emoji="🏠" title="슈퍼어드민" href="/superadmin" color="#ff6b6b" />
          <NavIconBtn emoji="💰" title="수익화" href="/monetization" color={ACCENTS.pink} />
        </div>
      </div>

      {/* MAIN */}
      <div className="main-pad" style={{ padding: "28px", maxWidth: 1400, margin: "0 auto" }}>

        {/* 히어로 */}
        <div style={{ marginBottom: 22, paddingTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: tc.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            TARRY · ADMIN ONLY DASHBOARD
          </div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: tc.text, letterSpacing: -0.5, lineHeight: 1.2 }}>
            실시간 수익 컨트롤 타워
            <span style={{ display: "inline-block", marginLeft: 10 }}><GlowBadge color={ACCENTS.cyan}>LIVE</GlowBadge></span>
          </div>
          <div style={{ fontSize: 12, color: tc.muted, marginTop: 6 }}>
            오늘 {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })} · tarryblog.org 기준
          </div>
        </div>

        {/* 스탯 카드 */}
        <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { icon: "💰", label: "오늘 수익", value: 4.27, prefix: "$", decimals: 2, color: ACCENTS.amber, sub: "어제 대비 ↑ 23%" },
            { icon: "👥", label: "오늘 방문자", value: 2140, color: ACCENTS.cyan, sub: "전주 동일요일 ↑ 18%" },
            { icon: "📝", label: "발행 글 수", value: 38, suffix: "개", color: ACCENTS.purple, sub: "이번달 누적 142개" },
            { icon: "🎯", label: "이번달 수익", value: 31.84, prefix: "$", decimals: 2, color: ACCENTS.green, sub: "목표 $100 · 31% 달성" },
          ].map((s, i) => (
            <div key={i} className="anim-card" style={{ animationDelay: `${i * 65}ms` }}>
              <StatCard {...s} tc={tc} />
            </div>
          ))}
        </div>

        {/* 트래픽 + 수익 */}
        <div className="main-grid anim-card" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14, animationDelay: "260ms" }}>
          <Card color={ACCENTS.cyan} title="📊 트래픽 & 수익 추이 (7일)" badge="LIVE" tc={tc}>
            <MonthlyChart tc={tc} isMobile={isMobile} />
          </Card>
          <Card color={ACCENTS.amber} title="💵 애드센스 상세" badge="연동됨" tc={tc}>
            <RevenueCard tc={tc} />
          </Card>
        </div>

        {/* 파이프라인 */}
        <div className="anim-card" style={{ marginBottom: 14, animationDelay: "330ms" }}>
          <Card color={ACCENTS.green} title="⚡ 자동화 파이프라인 현황" badge="진행중" tc={tc}>
            <div className="pip-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "키워드 수집", icon: "🔍", val: 142, status: "완료", color: ACCENTS.cyan },
                { label: "콘텐츠 생성", icon: "✍️", val: 38, status: "진행 중", color: ACCENTS.purple },
                { label: "이미지 생성", icon: "🖼️", val: 24, status: "대기 중", color: ACCENTS.pink },
                { label: "배포 예약", icon: "🚀", val: 12, status: "예약됨", color: ACCENTS.green },
              ].map((s, i, arr) => (
                <div key={i} style={{ background: `linear-gradient(135deg, ${s.color}12, ${s.color}06)`, border: `1px solid ${s.color}30`, borderRadius: 14, padding: "16px", textAlign: "center", position: "relative" }}>
                  {i < arr.length - 1 && !isMobile && (
                    <div style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", color: s.color, fontSize: 11, zIndex: 2, opacity: 0.5 }}>→</div>
                  )}
                  <div style={{ fontSize: isMobile ? 20 : 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: s.color, fontFamily: "'DM Mono', monospace" }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: tc.muted, marginTop: 4, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ marginTop: 6 }}><GlowBadge color={s.color}>{s.status}</GlowBadge></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 하단 3열 */}
        <div className="bot-grid anim-card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, animationDelay: "400ms" }}>
          <Card color={ACCENTS.purple} title="🏆 인기 키워드 TOP 5" badge="GSC" tc={tc}>
            {[
              { rank: 1, kw: "맛집 추천", clicks: 8500, pos: 3 },
              { rank: 2, kw: "여행 코스", clicks: 7200, pos: 5 },
              { rank: 3, kw: "재테크 방법", clicks: 6500, pos: 8 },
              { rank: 4, kw: "다이어트 식단", clicks: 5800, pos: 11 },
              { rank: 5, kw: "인테리어 소품", clicks: 4900, pos: 14 },
            ].map((kw, i) => <KeywordRow key={i} {...kw} />)}
          </Card>

          <Card color={ACCENTS.blue} title="🌐 플랫폼 연동 현황" tc={tc}>
            <PlatformStatus tc={tc} />
            <div style={{ marginTop: 14, padding: "12px", background: ACCENTS.blue + "0d", border: `1px solid ${ACCENTS.blue}25`, borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
              {[["62", "총 발행", ACCENTS.blue], ["2", "연동 플랫폼", ACCENTS.green], ["3", "핑 서버", ACCENTS.amber]].map(([v, l, c], i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c as string, fontFamily: "'DM Mono', monospace" }}>{v}</div>
                  <div style={{ fontSize: 9, color: tc.muted, fontWeight: 700 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card color={ACCENTS.pink} title="📡 핑 발송 로그" badge="자동" tc={tc}>
            <PingStatus tc={tc} />
            <div style={{ marginTop: 12, padding: "10px 12px", background: ACCENTS.green + "0d", border: `1px solid ${ACCENTS.green}25`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: tc.muted, lineHeight: 1.7 }}>
                💡 발행 즉시 <strong style={{ color: ACCENTS.green }}>3개</strong> 검색엔진 자동 핑 → 색인 속도 향상
              </div>
            </div>
          </Card>
        </div>

        {/* 목표 달성률 */}
        <div className="anim-card" style={{ marginTop: 14, animationDelay: "470ms" }}>
          <Card color={ACCENTS.rose} title="🎯 이번달 목표 달성률" tc={tc}>
            <div className="goal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              {goals.map((g, i) =>
                isMobile
                  ? <MobileGoalBar key={i} {...g} tc={tc} />
                  : <GoalBar key={i} {...g} tc={tc} />
              )}
            </div>
          </Card>
        </div>

        {/* 푸터 */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${tc.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 11, color: tc.muted }}>BlogAuto Pro · Admin Control Tower · TARRY (김종훈)</div>
          <GlowBadge color={ACCENTS.cyan}>v5.1</GlowBadge>
        </div>
      </div>
    </div>
  );
}
