// BlogAuto Pro - NotionPage v1.0
// 회원 개인 데이터 허브 — 디지털 노션 스타일

import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  FileText, TrendingUp, DollarSign, Lightbulb,
  Plus, Trash2, Edit3, Check, X, BarChart3,
  Calendar, Tag, RefreshCw,
} from "lucide-react";

// ── API 헬퍼 ─────────────────────────────────────────────
async function notionAPI(action: string, data?: Record<string, unknown>) {
  const token = localStorage.getItem("ba_token") || "";
  try {
    const resp = await fetch("/api/notion", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, data }),
    });
    return await resp.json();
  } catch { return { ok: false }; }
}

// ── 타입 ─────────────────────────────────────────────────
interface KWItem   { id: string; keyword: string; category?: string; memo?: string; createdAt: string; }
interface PostItem { id: string; title: string; platform?: string; status?: string; keyword?: string; createdAt: string; }
interface RevItem  { id: string; month: string; adsense?: number; coupang?: number; other?: number; memo?: string; }
interface MemoItem { id: string; title: string; content?: string; tags?: string; color?: string; createdAt: string; updatedAt?: string; }

const MEMO_COLORS = [
  "#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6",
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  published: { label: "발행됨", color: "#10b981" },
  scheduled:  { label: "예약됨", color: "#f59e0b" },
  draft:      { label: "초안",   color: "#6b7280" },
};

// ── CSS ──────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');

  @keyframes ntn-fade {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ntn-pop {
    0%   { transform: scale(0.95); opacity:0; }
    100% { transform: scale(1);    opacity:1; }
  }
  @keyframes bar-grow {
    from { width: 0%; }
    to   { width: var(--bar-w); }
  }
  @keyframes count-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ntn-page { font-family: 'Noto Sans KR', sans-serif; }

  .ntn-tab {
    padding: 8px 18px; border-radius: 8px; font-size: 0.85rem;
    font-weight: 700; cursor: pointer; border: none;
    transition: all 0.18s ease; white-space: nowrap;
  }
  .ntn-tab:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .ntn-tab:active { transform: translateY(0); }

  .ntn-card {
    border-radius: 14px; overflow: hidden;
    animation: ntn-fade 0.4s ease both;
    transition: box-shadow 0.18s ease, transform 0.18s ease;
  }
  .ntn-card:hover { transform: translateY(-2px); }

  .ntn-row {
    transition: background 0.12s ease;
    border-radius: 8px;
    animation: ntn-fade 0.3s ease both;
  }
  .ntn-row:hover { background: rgba(255,255,255,0.05) !important; }

  .ntn-btn {
    border: none; cursor: pointer; border-radius: 8px;
    font-weight: 600; font-size: 0.82rem;
    transition: all 0.15s ease;
    display: flex; align-items: center; gap: 5px;
  }
  .ntn-btn:hover { filter: brightness(1.1); transform: scale(1.03); }
  .ntn-btn:active { transform: scale(0.97); }

  .ntn-input {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; color: inherit;
    font-size: 0.88rem; padding: 8px 12px;
    outline: none; width: 100%;
    transition: border-color 0.15s;
    font-family: 'Noto Sans KR', sans-serif;
  }
  .ntn-input:focus { border-color: #6366f1; }
  .ntn-input::placeholder { color: rgba(255,255,255,0.3); }

  .ntn-textarea {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; color: inherit;
    font-size: 0.85rem; padding: 10px 12px;
    outline: none; width: 100%; resize: vertical;
    min-height: 80px;
    transition: border-color 0.15s;
    font-family: 'Noto Sans KR', sans-serif;
  }
  .ntn-textarea:focus { border-color: #6366f1; }
  .ntn-textarea::placeholder { color: rgba(255,255,255,0.3); }

  .ntn-bar { animation: bar-grow 0.8s cubic-bezier(0.16,1,0.3,1) both; }
  .ntn-stat-num { animation: count-up 0.5s ease both; }

  .ntn-memo-card {
    border-radius: 12px; padding: 16px;
    cursor: pointer;
    animation: ntn-pop 0.25s ease both;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .ntn-memo-card:hover { transform: translateY(-3px) scale(1.01); }

  .ntn-dot {
    width: 8px; height: 8px; border-radius: 50%;
    display: inline-block; flex-shrink: 0;
  }
`;

// ── 간단 도넛 차트 ────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", padding: "20px 0" }}>
      데이터 없음
    </div>
  );
  let offset = 0;
  const r = 40; const cx = 50; const cy = 50;
  const circumference = 2 * Math.PI * r;
  const segments = data.filter(d => d.value > 0).map(d => {
    const pct = d.value / total;
    const dash = pct * circumference;
    const seg = { ...d, dash, offset, pct };
    offset += dash;
    return seg;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={90} height={90} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} />
        {segments.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={14}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.8s ease" }}
          />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize={11} fontWeight={800}>
          {total.toLocaleString()}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.78rem" }}>
            <span className="ntn-dot" style={{ background: s.color }} />
            <span style={{ color: "rgba(255,255,255,0.7)" }}>{s.label}</span>
            <span style={{ color: "#fff", fontWeight: 700, marginLeft: "auto" }}>
              {Math.round(s.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 바 차트 ───────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", width: 60, flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
            <div
              className="ntn-bar"
              style={{
                height: "100%", borderRadius: 4,
                background: d.color,
                ["--bar-w" as string]: `${(d.value / max) * 100}%`,
                width: `${(d.value / max) * 100}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          </div>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff", width: 48, textAlign: "right", flexShrink: 0 }}>
            {d.value > 0 ? `₩${d.value.toLocaleString()}` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────
export default function NotionPage() {
  const [tab, setTab] = useState<"overview" | "keywords" | "posts" | "revenue" | "memos">("overview");
  const [loading, setLoading] = useState(false);

  const [keywords, setKeywords] = useState<KWItem[]>([]);
  const [posts, setPosts]       = useState<PostItem[]>([]);
  const [revenue, setRevenue]   = useState<RevItem[]>([]);
  const [memos, setMemos]       = useState<MemoItem[]>([]);

  // 메모 편집
  const [editMemo, setEditMemo] = useState<MemoItem | null>(null);
  const [newMemo, setNewMemo]   = useState({ title: "", content: "", tags: "", color: MEMO_COLORS[0] });
  const [showMemoForm, setShowMemoForm] = useState(false);

  // 수익 입력
  const [revForm, setRevForm] = useState({ month: new Date().toISOString().slice(0,7), adsense: "", coupang: "", other: "", memo: "" });
  const [showRevForm, setShowRevForm] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [kw, po, rv, mm] = await Promise.all([
      notionAPI("getKeywords"),
      notionAPI("getPosts"),
      notionAPI("getRevenue"),
      notionAPI("getMemos"),
    ]);
    if (kw.ok) setKeywords(kw.list || []);
    if (po.ok) setPosts(po.list || []);
    if (rv.ok) setRevenue(rv.list || []);
    if (mm.ok) setMemos(mm.list || []);
    setLoading(false);
  }

  // ── 메모 저장 ─────────────────────────────────────────
  async function saveMemo() {
    if (!newMemo.title.trim()) { toast.error("제목을 입력해주세요"); return; }
    const r = await notionAPI("saveMemo", { ...newMemo });
    if (r.ok) {
      setMemos(prev => [r.item, ...prev]);
      setNewMemo({ title: "", content: "", tags: "", color: MEMO_COLORS[0] });
      setShowMemoForm(false);
      toast.success("메모 저장됨");
    }
  }

  async function updateMemo() {
    if (!editMemo) return;
    const r = await notionAPI("updateMemo", editMemo as unknown as Record<string, unknown>);
    if (r.ok) {
      setMemos(prev => prev.map(m => m.id === editMemo.id ? { ...m, ...editMemo } : m));
      setEditMemo(null);
      toast.success("수정됨");
    }
  }

  async function deleteMemo(id: string) {
    const r = await notionAPI("deleteMemo", { id });
    if (r.ok) { setMemos(prev => prev.filter(m => m.id !== id)); toast.success("삭제됨"); }
  }

  // ── 수익 저장 ─────────────────────────────────────────
  async function saveRevenue() {
    if (!revForm.month) { toast.error("월을 선택해주세요"); return; }
    const r = await notionAPI("saveRevenue", {
      month: revForm.month,
      adsense: parseFloat(revForm.adsense) || 0,
      coupang: parseFloat(revForm.coupang) || 0,
      other:   parseFloat(revForm.other)   || 0,
      memo: revForm.memo,
    });
    if (r.ok) {
      const updated = await notionAPI("getRevenue");
      if (updated.ok) setRevenue(updated.list || []);
      setShowRevForm(false);
      setRevForm({ month: new Date().toISOString().slice(0,7), adsense: "", coupang: "", other: "", memo: "" });
      toast.success("수익 저장됨");
    }
  }

  async function deleteRevenue(id: string) {
    const r = await notionAPI("deleteRevenue", { id });
    if (r.ok) { setRevenue(prev => prev.filter(rv => rv.id !== id)); toast.success("삭제됨"); }
  }

  async function deleteKeyword(id: string) {
    const r = await notionAPI("deleteKeyword", { id });
    if (r.ok) { setKeywords(prev => prev.filter(k => k.id !== id)); toast.success("삭제됨"); }
  }

  async function deletePost(id: string) {
    const r = await notionAPI("deletePost", { id });
    if (r.ok) { setPosts(prev => prev.filter(p => p.id !== id)); toast.success("삭제됨"); }
  }

  // ── 개요 데이터 ───────────────────────────────────────
  const totalRevenue = revenue.reduce((s, r) => s + (r.adsense||0) + (r.coupang||0) + (r.other||0), 0);
  const latestMonth  = revenue[0];
  const latestRev    = latestMonth ? (latestMonth.adsense||0) + (latestMonth.coupang||0) + (latestMonth.other||0) : 0;

  const publishedCount = posts.filter(p => p.status === "published").length;
  const scheduledCount = posts.filter(p => p.status === "scheduled").length;

  const revChartData = revenue.slice(0, 6).reverse().map(r => ({
    label: r.month.slice(5),
    value: (r.adsense||0) + (r.coupang||0) + (r.other||0),
    color: "#6366f1",
  }));

  const platformCounts: Record<string, number> = {};
  posts.forEach(p => { if (p.platform) platformCounts[p.platform] = (platformCounts[p.platform]||0) + 1; });
  const platformData = Object.entries(platformCounts).slice(0,4).map(([label, value], i) => ({
    label, value, color: ["#6366f1","#ec4899","#f59e0b","#10b981"][i] || "#6b7280",
  }));

  // ── 탭 색상 ───────────────────────────────────────────
  const tabStyle = (t: typeof tab) => ({
    background: tab === t ? "#6366f1" : "rgba(255,255,255,0.07)",
    color: tab === t ? "#fff" : "rgba(255,255,255,0.6)",
  });

  const BG = "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)";
  const CARD_BG = "rgba(255,255,255,0.05)";
  const BORDER  = "1px solid rgba(255,255,255,0.08)";

  return (
    <Layout>
      <style>{css}</style>
      <div className="ntn-page" style={{ background: BG, minHeight: "100vh", padding: "28px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          {/* ── 헤더 ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, animation: "ntn-fade 0.4s ease" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.1rem", boxShadow: "0 4px 14px rgba(99,102,241,0.5)",
                }}>📓</div>
                <div>
                  <h1 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                    My Workspace
                  </h1>
                  <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                    키워드 · 발행현황 · 수익 · 메모
                  </p>
                </div>
              </div>
            </div>
            <button className="ntn-btn" onClick={fetchAll} disabled={loading}
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", padding: "8px 14px" }}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              {loading ? "로딩중..." : "새로고침"}
            </button>
          </div>

          {/* ── 탭 ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", animation: "ntn-fade 0.4s ease 0.05s both" }}>
            {([
              ["overview",  "📊 개요"],
              ["keywords",  "🔍 키워드"],
              ["posts",     "📝 발행현황"],
              ["revenue",   "💰 수익"],
              ["memos",     "💡 메모"],
            ] as [typeof tab, string][]).map(([t, label]) => (
              <button key={t} className="ntn-tab" onClick={() => setTab(t)} style={tabStyle(t)}>
                {label}
                {t === "keywords" && keywords.length > 0 && (
                  <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "1px 6px", fontSize: "0.72rem", marginLeft: 4 }}>
                    {keywords.length}
                  </span>
                )}
                {t === "posts" && posts.length > 0 && (
                  <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "1px 6px", fontSize: "0.72rem", marginLeft: 4 }}>
                    {posts.length}
                  </span>
                )}
                {t === "memos" && memos.length > 0 && (
                  <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "1px 6px", fontSize: "0.72rem", marginLeft: 4 }}>
                    {memos.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════
              개요 탭
          ══════════════════════════════════════════════ */}
          {tab === "overview" && (
            <div style={{ animation: "ntn-fade 0.35s ease" }}>
              {/* 스탯 카드 4개 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
                {[
                  { icon: "🔍", label: "수집 키워드", value: keywords.length, color: "#6366f1", sub: "총 키워드 수" },
                  { icon: "📝", label: "발행된 글",   value: publishedCount,   color: "#10b981", sub: `예약 ${scheduledCount}건` },
                  { icon: "💰", label: "이번달 수익", value: `₩${latestRev.toLocaleString()}`, color: "#f59e0b", sub: latestMonth?.month || "—" },
                  { icon: "💡", label: "메모",        value: memos.length,     color: "#ec4899", sub: "아이디어 노트" },
                ].map((s, i) => (
                  <div key={i} className="ntn-card" style={{ background: CARD_BG, border: BORDER, padding: "18px 20px", animationDelay: `${i * 0.07}s` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                    </div>
                    <div className="ntn-stat-num" style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{s.label}</div>
                    <div style={{ fontSize: "0.72rem", color: s.color, marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* 차트 영역 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* 수익 바 차트 */}
                <div className="ntn-card" style={{ background: CARD_BG, border: BORDER, padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={15} color="#6366f1" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>월별 수익 추이</span>
                  </div>
                  {revChartData.length > 0
                    ? <BarChart data={revChartData} />
                    : <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", textAlign: "center", padding: "20px 0" }}>수익 데이터 없음</div>
                  }
                </div>

                {/* 플랫폼 도넛 */}
                <div className="ntn-card" style={{ background: CARD_BG, border: BORDER, padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <TrendingUp size={15} color="#10b981" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>플랫폼별 발행</span>
                  </div>
                  <DonutChart data={platformData.length > 0 ? platformData : [
                    { label: "데이터없음", value: 1, color: "rgba(255,255,255,0.1)" }
                  ]} />
                </div>

                {/* 최근 발행 */}
                <div className="ntn-card" style={{ background: CARD_BG, border: BORDER, padding: "20px", gridColumn: "1/-1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <FileText size={15} color="#ec4899" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>최근 발행글</span>
                  </div>
                  {posts.slice(0, 5).length > 0 ? posts.slice(0, 5).map((p, i) => (
                    <div key={p.id} className="ntn-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", animationDelay: `${i*0.05}s` }}>
                      <span className="ntn-dot" style={{ background: STATUS_MAP[p.status||""]?.color || "#6b7280" }} />
                      <span style={{ flex: 1, fontSize: "0.85rem", color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{p.platform}</span>
                      <span style={{ fontSize: "0.72rem", color: STATUS_MAP[p.status||""]?.color || "#6b7280", flexShrink: 0 }}>{STATUS_MAP[p.status||""]?.label || p.status}</span>
                    </div>
                  )) : (
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", textAlign: "center", padding: "16px 0" }}>발행된 글 없음</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              키워드 탭
          ══════════════════════════════════════════════ */}
          {tab === "keywords" && (
            <div style={{ animation: "ntn-fade 0.35s ease" }}>
              <div className="ntn-card" style={{ background: CARD_BG, border: BORDER }}>
                <div style={{ padding: "16px 20px", borderBottom: BORDER, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1rem" }}>🔍</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>수집된 키워드</span>
                    <span style={{ background: "#6366f1", color: "#fff", borderRadius: 10, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700 }}>{keywords.length}</span>
                  </div>
                </div>
                <div style={{ padding: "8px 12px" }}>
                  {keywords.length === 0
                    ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", textAlign: "center", padding: "32px 0" }}>
                        키워드 수집 페이지에서 키워드를 저장하면 여기에 기록됩니다
                      </div>
                    : keywords.map((k, i) => (
                      <div key={k.id} className="ntn-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", animationDelay: `${i*0.03}s` }}>
                        <Tag size={13} color="#6366f1" style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: "0.88rem", color: "#fff", fontWeight: 600 }}>{k.keyword}</span>
                        {k.category && (
                          <span style={{ fontSize: "0.72rem", background: "rgba(99,102,241,0.2)", color: "#818cf8", borderRadius: 6, padding: "2px 8px" }}>{k.category}</span>
                        )}
                        {k.memo && (
                          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.memo}</span>
                        )}
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                          {new Date(k.createdAt).toLocaleDateString("ko")}
                        </span>
                        <button className="ntn-btn" onClick={() => deleteKeyword(k.id)}
                          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "4px 8px" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              발행현황 탭
          ══════════════════════════════════════════════ */}
          {tab === "posts" && (
            <div style={{ animation: "ntn-fade 0.35s ease" }}>
              <div className="ntn-card" style={{ background: CARD_BG, border: BORDER }}>
                <div style={{ padding: "16px 20px", borderBottom: BORDER, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1rem" }}>📝</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>발행 이력</span>
                  <span style={{ background: "#10b981", color: "#fff", borderRadius: 10, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700 }}>{posts.length}</span>
                </div>
                <div style={{ padding: "8px 12px" }}>
                  {posts.length === 0
                    ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", textAlign: "center", padding: "32px 0" }}>
                        배포 관리에서 발행하면 자동으로 기록됩니다
                      </div>
                    : posts.map((p, i) => (
                      <div key={p.id} className="ntn-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", animationDelay: `${i*0.03}s` }}>
                        <span className="ntn-dot" style={{ background: STATUS_MAP[p.status||""]?.color || "#6b7280", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                          {p.keyword && <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>키워드: {p.keyword}</div>}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{p.platform}</span>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 700, flexShrink: 0,
                          color: STATUS_MAP[p.status||""]?.color || "#6b7280",
                          background: `${STATUS_MAP[p.status||""]?.color || "#6b7280"}22`,
                          borderRadius: 6, padding: "2px 8px",
                        }}>{STATUS_MAP[p.status||""]?.label || p.status}</span>
                        <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                          {new Date(p.createdAt).toLocaleDateString("ko")}
                        </span>
                        <button className="ntn-btn" onClick={() => deletePost(p.id)}
                          style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "4px 8px" }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              수익 탭
          ══════════════════════════════════════════════ */}
          {tab === "revenue" && (
            <div style={{ animation: "ntn-fade 0.35s ease" }}>
              {/* 총 수익 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "총 수익 합계", value: `₩${totalRevenue.toLocaleString()}`, color: "#f59e0b", icon: "💰" },
                  { label: "이번달 수익",  value: `₩${latestRev.toLocaleString()}`,   color: "#10b981", icon: "📅" },
                  { label: "기록된 월수",  value: `${revenue.length}개월`,             color: "#6366f1", icon: "📊" },
                ].map((s, i) => (
                  <div key={i} className="ntn-card" style={{ background: CARD_BG, border: BORDER, padding: "16px 18px" }}>
                    <span style={{ fontSize: "1.2rem" }}>{s.icon}</span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 900, color: s.color, marginTop: 8, letterSpacing: "-0.03em" }}>{s.value}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* 수익 입력 폼 */}
              <div className="ntn-card" style={{ background: CARD_BG, border: BORDER, marginBottom: 14 }}>
                <div style={{ padding: "14px 20px", borderBottom: BORDER, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <DollarSign size={15} color="#f59e0b" />
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>수익 기록</span>
                  </div>
                  <button className="ntn-btn" onClick={() => setShowRevForm(!showRevForm)}
                    style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b", padding: "6px 12px" }}>
                    <Plus size={14} /> 추가
                  </button>
                </div>
                {showRevForm && (
                  <div style={{ padding: "16px 20px", borderBottom: BORDER, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>월</label>
                      <input type="month" className="ntn-input" value={revForm.month}
                        onChange={e => setRevForm(f => ({ ...f, month: e.target.value }))} />
                    </div>
                    {[
                      { key: "adsense", label: "애드센스 (₩)" },
                      { key: "coupang", label: "쿠팡파트너스 (₩)" },
                      { key: "other",   label: "기타 수익 (₩)" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>{f.label}</label>
                        <input type="number" className="ntn-input" placeholder="0"
                          value={(revForm as Record<string,string>)[f.key]}
                          onChange={e => setRevForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                      </div>
                    ))}
                    <div style={{ gridColumn: "1/-1" }}>
                      <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>메모</label>
                      <input className="ntn-input" placeholder="메모 (선택)" value={revForm.memo}
                        onChange={e => setRevForm(f => ({ ...f, memo: e.target.value }))} />
                    </div>
                    <div style={{ gridColumn: "1/-1", display: "flex", gap: 8 }}>
                      <button className="ntn-btn" onClick={saveRevenue}
                        style={{ background: "#f59e0b", color: "#000", padding: "8px 16px" }}>
                        <Check size={14} /> 저장
                      </button>
                      <button className="ntn-btn" onClick={() => setShowRevForm(false)}
                        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", padding: "8px 16px" }}>
                        <X size={14} /> 취소
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ padding: "8px 12px" }}>
                  {revenue.length === 0
                    ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", textAlign: "center", padding: "24px 0" }}>
                        수익을 추가해서 월별로 기록해보세요
                      </div>
                    : revenue.map((r, i) => {
                      const total = (r.adsense||0)+(r.coupang||0)+(r.other||0);
                      return (
                        <div key={r.id} className="ntn-row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", animationDelay: `${i*0.04}s` }}>
                          <Calendar size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem", flexShrink: 0 }}>{r.month}</span>
                          <div style={{ flex: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {r.adsense ? <span style={{ fontSize: "0.72rem", color: "#fbbf24" }}>애드센스 ₩{r.adsense.toLocaleString()}</span> : null}
                            {r.coupang ? <span style={{ fontSize: "0.72rem", color: "#34d399" }}>쿠팡 ₩{r.coupang.toLocaleString()}</span> : null}
                            {r.other   ? <span style={{ fontSize: "0.72rem", color: "#a78bfa" }}>기타 ₩{r.other.toLocaleString()}</span> : null}
                          </div>
                          <span style={{ fontWeight: 900, color: "#f59e0b", fontSize: "0.9rem", flexShrink: 0 }}>
                            ₩{total.toLocaleString()}
                          </span>
                          {r.memo && <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>{r.memo}</span>}
                          <button className="ntn-btn" onClick={() => deleteRevenue(r.id)}
                            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "4px 8px" }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })
                  }
                </div>
              </div>

              {/* 수익 바 차트 */}
              {revChartData.length > 0 && (
                <div className="ntn-card" style={{ background: CARD_BG, border: BORDER, padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={15} color="#f59e0b" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>최근 6개월 수익</span>
                  </div>
                  <BarChart data={revChartData} />
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              메모 탭
          ══════════════════════════════════════════════ */}
          {tab === "memos" && (
            <div style={{ animation: "ntn-fade 0.35s ease" }}>
              {/* 새 메모 버튼 */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button className="ntn-btn" onClick={() => setShowMemoForm(!showMemoForm)}
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", padding: "9px 18px", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
                  <Plus size={15} /> 새 메모
                </button>
              </div>

              {/* 메모 작성 폼 */}
              {showMemoForm && (
                <div className="ntn-card" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", padding: "18px 20px", marginBottom: 16 }}>
                  <input className="ntn-input" placeholder="메모 제목" value={newMemo.title}
                    onChange={e => setNewMemo(m => ({ ...m, title: e.target.value }))}
                    style={{ marginBottom: 10, fontSize: "0.95rem", fontWeight: 700 }} />
                  <textarea className="ntn-textarea" placeholder="내용 (선택)" value={newMemo.content}
                    onChange={e => setNewMemo(m => ({ ...m, content: e.target.value }))}
                    style={{ marginBottom: 10 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <input className="ntn-input" placeholder="태그 (쉼표로 구분)" value={newMemo.tags}
                      onChange={e => setNewMemo(m => ({ ...m, tags: e.target.value }))}
                      style={{ flex: 1 }} />
                    <div style={{ display: "flex", gap: 6 }}>
                      {MEMO_COLORS.map(c => (
                        <button key={c} onClick={() => setNewMemo(m => ({ ...m, color: c }))}
                          style={{
                            width: 22, height: 22, borderRadius: "50%", background: c, border: "none", cursor: "pointer",
                            outline: newMemo.color === c ? `3px solid white` : "none",
                            outlineOffset: 2,
                          }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="ntn-btn" onClick={saveMemo}
                      style={{ background: "#6366f1", color: "#fff", padding: "8px 18px" }}>
                      <Check size={14} /> 저장
                    </button>
                    <button className="ntn-btn" onClick={() => setShowMemoForm(false)}
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", padding: "8px 14px" }}>
                      <X size={14} /> 취소
                    </button>
                  </div>
                </div>
              )}

              {/* 메모 그리드 */}
              {memos.length === 0
                ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", textAlign: "center", padding: "48px 0" }}>
                    <Lightbulb size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
                    <div>아이디어를 메모해보세요</div>
                  </div>
                : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
                    {memos.map((m, i) => (
                      editMemo?.id === m.id ? (
                        <div key={m.id} className="ntn-card" style={{ background: `${m.color}22`, border: `1px solid ${m.color}55`, padding: "16px" }}>
                          <input className="ntn-input" value={editMemo.title}
                            onChange={e => setEditMemo(em => em ? { ...em, title: e.target.value } : em)}
                            style={{ marginBottom: 8, fontWeight: 700 }} />
                          <textarea className="ntn-textarea" value={editMemo.content || ""}
                            onChange={e => setEditMemo(em => em ? { ...em, content: e.target.value } : em)}
                            style={{ marginBottom: 8 }} />
                          <input className="ntn-input" value={editMemo.tags || ""} placeholder="태그"
                            onChange={e => setEditMemo(em => em ? { ...em, tags: e.target.value } : em)}
                            style={{ marginBottom: 10 }} />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="ntn-btn" onClick={updateMemo}
                              style={{ background: m.color, color: "#fff", padding: "6px 12px" }}>
                              <Check size={12} /> 저장
                            </button>
                            <button className="ntn-btn" onClick={() => setEditMemo(null)}
                              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", padding: "6px 10px" }}>
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={m.id} className="ntn-memo-card"
                          style={{
                            background: `${m.color || "#6366f1"}18`,
                            border: `1px solid ${m.color || "#6366f1"}44`,
                            animationDelay: `${i * 0.05}s`,
                          }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color || "#6366f1", marginTop: 3, flexShrink: 0, boxShadow: `0 0 8px ${m.color || "#6366f1"}` }} />
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="ntn-btn" onClick={() => setEditMemo(m)}
                                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "4px 7px" }}>
                                <Edit3 size={11} />
                              </button>
                              <button className="ntn-btn" onClick={() => deleteMemo(m.id)}
                                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "4px 7px" }}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                          <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.4 }}>{m.title}</div>
                          {m.content && (
                            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 8, whiteSpace: "pre-wrap" }}>
                              {m.content.slice(0, 120)}{m.content.length > 120 ? "..." : ""}
                            </div>
                          )}
                          {m.tags && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                              {m.tags.split(",").map(t => t.trim()).filter(Boolean).map((tag, ti) => (
                                <span key={ti} style={{
                                  fontSize: "0.7rem", padding: "2px 7px", borderRadius: 10,
                                  background: `${m.color || "#6366f1"}33`, color: m.color || "#a5b4fc",
                                }}>{tag}</span>
                              ))}
                            </div>
                          )}
                          <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
                            {new Date(m.updatedAt || m.createdAt).toLocaleDateString("ko")}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )
              }
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
