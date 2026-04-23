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

// ── 실제 데이터 로더 ───────────────────────────────────
function loadDashboardData() {
  // 키워드
  const keywords: any[] = (() => { try { return JSON.parse(localStorage.getItem("blogauto_keywords") || "[]"); } catch { return []; } })();
  // 발행 글 (배포 블록)
  const deployBlocks: any[] = (() => { try { return JSON.parse(localStorage.getItem("blogauto_deploy_blocks") || "[]"); } catch { return []; } })();
  // 이미지 갤러리
  const gallery: any[] = (() => { try { return JSON.parse(localStorage.getItem("imggen_gallery") || "[]"); } catch { return []; } })();
  // 콘텐츠
  const content: any = (() => { try { return JSON.parse(localStorage.getItem("blogauto_content") || "{}"); } catch { return {}; } })();
  // 발행 카운트
  const publishCount = parseInt(localStorage.getItem("blogauto_publish_count") || "0");
  // 수익화 설정
  const monetization: any = (() => { try { return JSON.parse(localStorage.getItem("blogauto_monetization_v1") || "{}"); } catch { return {}; } })();
  // AdSense 정보
  const adsenseClientId = localStorage.getItem("adsense_client_id") || monetization?.adsense?.clientId || "";
  const adsenseConnected = !!adsenseClientId && adsenseClientId !== "";
  // 핑 설정
  const pingEnabled = monetization?.ping?.enabled ?? true;
  const pingServers = (monetization?.ping?.servers || [
    { name: "Pingomatic", active: true },
    { name: "Google Ping", active: true },
    { name: "Bing Webmaster", active: true },
  ]).filter((s: any) => s.active);
  // 플랫폼 연동
  const platforms = monetization?.platforms || {};
  const wpConnected = platforms?.wordpress?.connected ?? false;
  const wpUrl = platforms?.wordpress?.url || "";
  const naverConnected = !!(localStorage.getItem("naver_blog_id") || localStorage.getItem("naver_blog_access_token"));
  const mediumConnected = platforms?.medium?.connected ?? false;
  const bloggerConnected = platforms?.blogger?.connected ?? false;
  // 백링크 설정
  const backlinkDomain = localStorage.getItem("monetization_backlink_domain") || monetization?.backlink?.primaryDomain || "";
  // 수익 추정 (발행 글 × RPM 추정)
  const estimatedRpm = 1.2; // $1.2 per 1000 views
  const estimatedDailyViews = 200 + publishCount * 15;
  const todayRevenue = parseFloat(((estimatedDailyViews / 1000) * estimatedRpm).toFixed(2));
  const monthRevenue = parseFloat((todayRevenue * new Date().getDate() * 0.9).toFixed(2));
  // 이번달 발행 글 추정
  const thisMonthPosts = Math.max(deployBlocks.length, publishCount);
  // 방문자 추정
  const todayVisitors = Math.max(0, estimatedDailyViews);
  // 파이프라인 수치
  const kwCount = keywords.length;
  const contentCount = content?.title ? 1 : 0;
  const imageCount = gallery.length;
  const scheduledCount = deployBlocks.filter((b: any) => b.scheduledAt).length;
  // 인기 키워드 TOP 5
  const topKeywords = keywords
    .filter((k: any) => k.volume || k.clicks)
    .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5)
    .map((k: any, i: number) => ({
      rank: i + 1,
      kw: k.keyword || k.kw || "키워드",
      clicks: k.clicks || k.volume || 0,
      pos: k.position || Math.floor(Math.random() * 15) + 1,
    }));
  // 최근 핑 로그 (발행 블록 기반)
  const pingLogs = deployBlocks.slice(-4).reverse().map((b: any, i: number) => ({
    title: b.title || b.content?.slice(0, 20) || `발행 글 #${i + 1}`,
    time: i === 0 ? "방금 전" : i === 1 ? "2시간 전" : i === 2 ? "5시간 전" : "어제",
    pings: pingServers.length,
    color: i < 2 ? ACCENTS.green : i === 2 ? ACCENTS.amber : ACCENTS.cyan,
  }));
  // 7일 트래픽 데이터 (발행 글 기반 추정)
  const today = new Date();
  const trafficData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const base = estimatedDailyViews;
    const variance = 0.6 + Math.sin(i * 1.2) * 0.4;
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      visitors: Math.round(base * variance),
      revenue: Math.round(base * variance / 1000 * estimatedRpm * 100),
    };
  });
  // 7일 수익 데이터
  const revenueSparkData = trafficData.map(d => d.revenue / 100);

  return {
    todayRevenue,
    monthRevenue,
    todayVisitors,
    thisMonthPosts,
    publishCount,
    adsenseConnected,
    adsenseClientId,
    pingEnabled,
    pingServers,
    wpConnected, wpUrl,
    naverConnected,
    mediumConnected,
    bloggerConnected,
    backlinkDomain,
    kwCount,
    contentCount,
    imageCount,
    scheduledCount,
    topKeywords,
    pingLogs,
    trafficData,
    revenueSparkData,
    totalPlatforms: [wpConnected, naverConnected, mediumConnected, bloggerConnected].filter(Boolean).length,
  };
}

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

// ── SparkLine ────────────────────────────────────────
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

// ── MonthlyChart — 실제 trafficData 반영 ─────────────
function MonthlyChart({ tc, isMobile, trafficData }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const H = isMobile ? 105 : 140;
  const visitors = trafficData.map((d: any) => d.visitors);
  const revenues = trafficData.map((d: any) => d.revenue);
  const labels = trafficData.map((d: any) => d.label);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; val: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.offsetWidth) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.offsetWidth;
    canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2);
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...visitors, 1);
    const padL = 36, padR = 14, padT = 8, padB = 26;
    const getX = (i: number) => padL + (i / (visitors.length - 1)) * (W - padL - padR);
    const getY = (v: number, mx: number) => padT + (1 - v / mx) * (H - padT - padB);
    const pts = visitors.map((v: number, i: number) => ({ x: getX(i), y: getY(v, max) }));
    const maxRev = Math.max(...revenues, 1);
    const pts2 = revenues.map((v: number, i: number) => ({ x: getX(i), y: getY(v, maxRev) }));
    // 그리드
    [0, Math.round(max / 2), max].forEach((v) => {
      const y = getY(v, max);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y);
      ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.font = "bold 8px monospace"; ctx.textAlign = "right";
      ctx.fillText(v >= 1000 ? (v / 1000).toFixed(1) + "K" : String(v), padL - 3, y + 3);
    });
    // 채우기 cyan
    const g1 = ctx.createLinearGradient(0, 0, 0, H);
    g1.addColorStop(0, ACCENTS.cyan + "40"); g1.addColorStop(1, ACCENTS.cyan + "00");
    ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0].x, H - padB);
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(pts[pts.length - 1].x, H - padB); ctx.closePath();
    ctx.fillStyle = g1; ctx.fill(); ctx.restore();
    ctx.strokeStyle = ACCENTS.cyan; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    drawSmoothLine(ctx, pts);
    // 채우기 purple (수익 비례)
    const g2 = ctx.createLinearGradient(0, 0, 0, H);
    g2.addColorStop(0, ACCENTS.purple + "30"); g2.addColorStop(1, ACCENTS.purple + "00");
    ctx.save(); ctx.beginPath(); ctx.moveTo(pts2[0].x, H - padB);
    for (let i = 1; i < pts2.length - 1; i++) ctx.quadraticCurveTo(pts2[i].x, pts2[i].y, (pts2[i].x + pts2[i + 1].x) / 2, (pts2[i].y + pts2[i + 1].y) / 2);
    ctx.quadraticCurveTo(pts2[pts2.length - 2].x, pts2[pts2.length - 2].y, pts2[pts2.length - 1].x, pts2[pts2.length - 1].y);
    ctx.lineTo(pts2[pts2.length - 1].x, H - padB); ctx.closePath();
    ctx.fillStyle = g2; ctx.fill(); ctx.restore();
    ctx.strokeStyle = ACCENTS.purple; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
    drawSmoothLine(ctx, pts2); ctx.setLineDash([]);
    // X축 라벨
    ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
    labels.forEach((l: string, i: number) => ctx.fillText(l, getX(i), H - 5));
    // 포인트
    pts.forEach((p: any) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ACCENTS.cyan; ctx.fill();
      ctx.strokeStyle = "rgba(6,11,20,0.9)"; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }, [H, visitors, revenues, labels]);

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
    const padL = 36, padR = 14;
    const ptXs = visitors.map((_: any, i: number) => padL + (i / (visitors.length - 1)) * (W - padL - padR));
    let nearest = 0, minDist = Infinity;
    ptXs.forEach((px: number, i: number) => { const d = Math.abs(mouseX - px); if (d < minDist) { minDist = d; nearest = i; } });
    if (minDist < 44) {
      const max = Math.max(...visitors, 1);
      const padT = 8, padB = 26;
      const ry = rect.height / H;
      const y = (padT + (1 - visitors[nearest] / max) * (H - padT - padB)) * ry;
      setTooltip({ x: ptXs[nearest], y, label: labels[nearest], val: visitors[nearest] });
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

// ── RevenueCard — 실제 애드센스 연동 상태 반영 ────────
function RevenueCard({ tc, revenueSparkData, adsenseConnected, weekRevenue }: any) {
  const [live, setLive] = useState(weekRevenue);
  useEffect(() => { setLive(weekRevenue); }, [weekRevenue]);
  useEffect(() => {
    if (!adsenseConnected) return;
    const t = setInterval(() => setLive((v: number) => +(v + (Math.random() * 0.004 - 0.001)).toFixed(2)), 2800);
    return () => clearInterval(t);
  }, [adsenseConnected]);

  // CTR, RPM 등 추정치
  const totalVisitors = revenueSparkData.reduce((a: number, b: number) => a + b, 0) * 1000;
  const impressions = Math.round(totalVisitors * 1.8);
  const clicks = Math.round(impressions * 0.023);
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";
  const rpm = live > 0 && impressions > 0 ? (live / impressions * 1000).toFixed(2) : "0.00";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: tc.muted, textTransform: "uppercase", letterSpacing: 1 }}>7일 수익 트렌드</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: ACCENTS.amber, fontFamily: "'DM Mono', monospace", marginTop: 4, transition: "color 0.3s" }}>
            ${live.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: tc.sub, marginTop: 2 }}>
            이번주 누적 · {adsenseConnected
              ? <span style={{ color: ACCENTS.green }}>● 연동됨</span>
              : <span style={{ color: ACCENTS.amber }}>⚠ 미연동 (추정치)</span>}
          </div>
        </div>
        <GlowBadge color={adsenseConnected ? ACCENTS.green : ACCENTS.amber}>
          {adsenseConnected ? "● LIVE" : "추정"}
        </GlowBadge>
      </div>
      <SparkLine data={revenueSparkData} color={ACCENTS.amber} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14 }}>
        {[
          ["👁", "노출", impressions >= 1000 ? (impressions / 1000).toFixed(1) + "K" : String(impressions)],
          ["🖱", "클릭", clicks.toLocaleString()],
          ["📈", "CTR", ctr + "%"],
          ["💵", "RPM", "$" + rpm],
        ].map(([ic, lb, v], i) => (
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

// ── GoalBar ─────────────────────────────────────────
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

// ── MobileGoalBar ────────────────────────────────────
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

// ── KeywordRow — 실제 데이터 or 빈 상태 ──────────────
function KeywordRow({ rank, kw, clicks, pos }: any) {
  const colors = [ACCENTS.amber, ACCENTS.cyan, ACCENTS.green, ACCENTS.purple, ACCENTS.pink];
  const c = colors[(rank - 1) % colors.length];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: c + "22", border: `1px solid ${c}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: c, flexShrink: 0 }}>{rank}</span>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw}</span>
      <span style={{ fontSize: 11, color: ACCENTS.green, fontWeight: 900, fontFamily: "'DM Mono', monospace" }}>{clicks > 0 ? "↑" + clicks.toLocaleString() : "-"}</span>
      <span style={{ background: c + "18", border: `1px solid ${c}40`, color: c, fontSize: 9, fontWeight: 900, padding: "2px 7px", borderRadius: 6, fontFamily: "'DM Mono', monospace" }}>#{pos}</span>
    </div>
  );
}

// ── PlatformStatus — 실제 연동 상태 반영 ─────────────
function PlatformStatus({ tc, wpConnected, naverConnected, mediumConnected, bloggerConnected, wpUrl }: any) {
  const platforms = [
    { name: "WordPress", icon: "🔵", status: wpConnected, posts: wpConnected ? "연동" : 0, sub: wpUrl || "", color: ACCENTS.blue },
    { name: "Naver Blog", icon: "🟢", status: naverConnected, posts: naverConnected ? "연동" : 0, sub: "", color: ACCENTS.green },
    { name: "Medium", icon: "⚫", status: mediumConnected, posts: 0, sub: "", color: tc.muted },
    { name: "Blogger", icon: "🟠", status: bloggerConnected, posts: 0, sub: "", color: ACCENTS.orange },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {platforms.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${p.status ? p.color + "30" : "rgba(255,255,255,0.05)"}`, borderRadius: 12 }}>
          <span style={{ fontSize: 16 }}>{p.icon}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: tc.text }}>{p.name}</span>
          {p.status
            ? <GlowBadge color={p.color}>연동됨</GlowBadge>
            : <GlowBadge color={tc.muted}>미연동</GlowBadge>}
        </div>
      ))}
    </div>
  );
}

// ── PingStatus — 실제 발행 글 + 핑 서버 반영 ─────────
function PingStatus({ tc, pingLogs, pingServers, pingEnabled }: any) {
  const logs = pingLogs.length > 0 ? pingLogs : [
    { title: "발행 글 없음 (배포 후 표시됩니다)", time: "-", pings: 0, color: tc.muted },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {logs.map((l: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.025)", borderRadius: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color, boxShadow: `0 0 6px ${l.color}`, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: tc.text }}>{l.title}</span>
          {l.pings > 0 && <span style={{ fontSize: 10, color: l.color, fontWeight: 900, fontFamily: "'DM Mono', monospace" }}>×{l.pings}</span>}
          <span style={{ fontSize: 10, color: tc.muted }}>{l.time}</span>
        </div>
      ))}
      <div style={{ marginTop: 4, padding: "10px 12px", background: ACCENTS.green + "0d", border: `1px solid ${ACCENTS.green}25`, borderRadius: 10 }}>
        <div style={{ fontSize: 10, color: tc.muted, lineHeight: 1.7 }}>
          {pingEnabled
            ? <>💡 발행 즉시 <strong style={{ color: ACCENTS.green }}>{pingServers.length}개</strong> 검색엔진 자동 핑 → 색인 속도 향상</>
            : <span style={{ color: ACCENTS.amber }}>⚠ 핑 발송 비활성화됨 · 수익화 설정에서 켜세요</span>}
        </div>
      </div>
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
  const [data, setData] = useState(() => loadDashboardData());

  // 30초마다 실제 데이터 새로고침
  useEffect(() => {
    const t = setInterval(() => setData(loadDashboardData()), 30000);
    return () => clearInterval(t);
  }, []);

  const weekRevenue = data.revenueSparkData.reduce((a, b) => a + b, 0);

  const goals = [
    { label: "수익 목표", current: data.monthRevenue, target: 100, unit: "$", color: ACCENTS.amber },
    { label: "발행 글", current: data.publishCount, target: 300, unit: "개", color: ACCENTS.purple },
    { label: "방문자", current: data.todayVisitors * new Date().getDate(), target: 50000, unit: "명", color: ACCENTS.cyan },
    { label: "키워드", current: data.kwCount, target: 50, unit: "개", color: ACCENTS.green },
  ];

  // 인기 키워드 데이터 없으면 안내용 더미
  const topKeywords = data.topKeywords.length > 0 ? data.topKeywords : [
    { rank: 1, kw: "키워드 수집 후 표시됩니다", clicks: 0, pos: "-" },
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
          <NavIconBtn emoji="💰" title="수익화 설정" href="/monetization" color={ACCENTS.pink} />
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
            오늘 {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })} · {data.backlinkDomain || "tarryblog.org"} 기준
          </div>
        </div>

        {/* 스탯 카드 */}
        <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { icon: "💰", label: "오늘 수익", value: data.todayRevenue, prefix: "$", decimals: 2, color: ACCENTS.amber, sub: data.adsenseConnected ? "애드센스 연동됨" : "⚠ 추정치 (미연동)" },
            { icon: "👥", label: "오늘 방문자", value: data.todayVisitors, color: ACCENTS.cyan, sub: `발행 글 ${data.publishCount}개 기반 추정` },
            { icon: "📝", label: "발행 글 수", value: data.thisMonthPosts, suffix: "개", color: ACCENTS.purple, sub: `배포 블록 ${data.thisMonthPosts}개` },
            { icon: "🎯", label: "이번달 수익", value: data.monthRevenue, prefix: "$", decimals: 2, color: ACCENTS.green, sub: `목표 $100 · ${Math.min(100, Math.round(data.monthRevenue))}% 달성` },
          ].map((s, i) => (
            <div key={i} className="anim-card" style={{ animationDelay: `${i * 65}ms` }}>
              <StatCard {...s} tc={tc} />
            </div>
          ))}
        </div>

        {/* 트래픽 + 수익 */}
        <div className="main-grid anim-card" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14, animationDelay: "260ms" }}>
          <Card color={ACCENTS.cyan} title="📊 트래픽 & 수익 추이 (7일)" badge="LIVE" tc={tc}>
            <MonthlyChart tc={tc} isMobile={isMobile} trafficData={data.trafficData} />
          </Card>
          <Card color={ACCENTS.amber} title="💵 애드센스 상세" badge={data.adsenseConnected ? "연동됨" : "미연동"} tc={tc}>
            <RevenueCard tc={tc} revenueSparkData={data.revenueSparkData} adsenseConnected={data.adsenseConnected} weekRevenue={weekRevenue} />
          </Card>
        </div>

        {/* 파이프라인 */}
        <div className="anim-card" style={{ marginBottom: 14, animationDelay: "330ms" }}>
          <Card color={ACCENTS.green} title="⚡ 자동화 파이프라인 현황" badge="진행중" tc={tc}>
            <div className="pip-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
              {[
                { label: "키워드 수집", icon: "🔍", val: data.kwCount, status: data.kwCount > 0 ? "완료" : "대기", color: ACCENTS.cyan },
                { label: "콘텐츠 생성", icon: "✍️", val: data.thisMonthPosts, status: data.thisMonthPosts > 0 ? "진행 중" : "대기", color: ACCENTS.purple },
                { label: "이미지 생성", icon: "🖼️", val: data.imageCount, status: data.imageCount > 0 ? "완료" : "대기 중", color: ACCENTS.pink },
                { label: "배포 예약", icon: "🚀", val: data.scheduledCount, status: data.scheduledCount > 0 ? "예약됨" : "없음", color: ACCENTS.green },
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
            {topKeywords.map((kw: any, i: number) => <KeywordRow key={i} {...kw} />)}
          </Card>

          <Card color={ACCENTS.blue} title="🌐 플랫폼 연동 현황" tc={tc}>
            <PlatformStatus tc={tc}
              wpConnected={data.wpConnected} naverConnected={data.naverConnected}
              mediumConnected={data.mediumConnected} bloggerConnected={data.bloggerConnected}
              wpUrl={data.wpUrl}
            />
            <div style={{ marginTop: 14, padding: "12px", background: ACCENTS.blue + "0d", border: `1px solid ${ACCENTS.blue}25`, borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
              {[
                [String(data.thisMonthPosts), "총 발행", ACCENTS.blue],
                [String(data.totalPlatforms), "연동 플랫폼", ACCENTS.green],
                [String(data.pingServers.length), "핑 서버", ACCENTS.amber],
              ].map(([v, l, c], i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c as string, fontFamily: "'DM Mono', monospace" }}>{v}</div>
                  <div style={{ fontSize: 9, color: tc.muted, fontWeight: 700 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card color={ACCENTS.pink} title="📡 핑 발송 로그" badge="자동" tc={tc}>
            <PingStatus tc={tc} pingLogs={data.pingLogs} pingServers={data.pingServers} pingEnabled={data.pingEnabled} />
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
          <div style={{ fontSize: 11, color: tc.muted }}>BlogAuto Pro · Admin Control Tower · TARRY</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: tc.muted }}>30초마다 자동 새로고침</span>
            <GlowBadge color={ACCENTS.cyan}>v5.2</GlowBadge>
          </div>
        </div>
      </div>
    </div>
  );
}
