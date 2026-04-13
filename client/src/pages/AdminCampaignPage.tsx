/**
 * BlogAuto Pro - 캠페인 관리자 페이지
 * 관리자 전용 — 스크래핑 상태 확인, 수동 수집, 캠페인 편집
 */

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { isAdminUser, getCurrentToken } from "@/lib/user-storage";
import { useLocation } from "wouter";

interface SiteStatus {
  name: string;
  ok: boolean;
  count: number;
  error: string | null;
  scrapedAt: string;
}

export default function AdminCampaignPage() {
  const [, navigate] = useLocation();
  const [status, setStatus]       = useState<SiteStatus[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [total, setTotal]         = useState(0);
  const [scraping, setScraping]   = useState(false);
  const [loading, setLoading]     = useState(true);

  // 관리자 아니면 대시보드로
  useEffect(() => {
    if (!isAdminUser()) {
      toast.error("관리자만 접근 가능합니다");
      navigate("/dashboard");
      return;
    }
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    const token = getCurrentToken();
    try {
      const res = await fetch("/api/scrape-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "status" }),
      });
      const d = await res.json();
      if (d.ok) {
        setStatus(d.status || []);
        setUpdatedAt(d.updatedAt);
        setTotal(d.total || 0);
      }
    } catch (e: any) {
      toast.error("상태 조회 실패: " + e.message);
    }
    setLoading(false);
  }

  async function handleScrapeAll() {
    setScraping(true);
    toast.loading("전체 사이트 스크래핑 중... (최대 30초)", { id: "admin-scrape" });
    const token = getCurrentToken();
    try {
      const res = await fetch("/api/scrape-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "scrape" }),
      });
      const d = await res.json();
      if (d.ok) {
        toast.success(`완료! 총 ${d.total}개 수집됨`, { id: "admin-scrape" });
        await fetchStatus();
      } else {
        toast.error("실패: " + (d.error || "오류"), { id: "admin-scrape" });
      }
    } catch (e: any) {
      toast.error("오류: " + e.message, { id: "admin-scrape" });
    }
    setScraping(false);
  }

  const fmtDate = (ts: string | null) => {
    if (!ts) return "없음";
    try { return new Date(ts).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return ts; }
  };

  return (
    <Layout>
      <div style={{ padding: "28px 28px 48px", maxWidth: "900px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--foreground)" }}>
              🛡️ 캠페인 관리자 페이지
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "6px 0 0" }}>
              관리자 전용 · 스크래핑 상태 모니터링 및 수동 수집
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={fetchStatus} disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 14px", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
              <RefreshCw style={{ width: 13, height: 13 }} /> 상태 갱신
            </button>
            <button onClick={handleScrapeAll} disabled={scraping}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 16px", borderRadius: "8px", cursor: scraping ? "not-allowed" : "pointer", background: "rgba(236,72,153,0.15)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.4)", opacity: scraping ? 0.6 : 1 }}>
              <RefreshCw style={{ width: 13, height: 13, animation: scraping ? "spin 1s linear infinite" : "none" }} />
              {scraping ? "스크래핑 중..." : "전체 실시간 수집"}
            </button>
          </div>
        </div>

        {/* 요약 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "총 캠페인 수", val: total, color: "var(--color-emerald)" },
            { label: "마지막 수집", val: fmtDate(updatedAt), color: "var(--foreground)", small: true },
            { label: "수집 사이트", val: `${status.filter(s => s.ok).length} / ${status.length}`, color: status.some(s => !s.ok) ? "#f97316" : "var(--color-emerald)" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--muted)", border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "10px", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>{s.label}</div>
              <div style={{ fontSize: s.small ? "14px" : "24px", fontWeight: 700, color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* 사이트별 상태 */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>
            사이트별 수집 상태
          </div>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "14px" }}>불러오는 중...</div>
          ) : status.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--muted-foreground)", fontSize: "14px" }}>
              <AlertTriangle style={{ width: 24, height: 24, margin: "0 auto 8px", display: "block" }} />
              아직 수집된 데이터가 없습니다. 위의 "전체 실시간 수집" 버튼을 눌러 시작하세요.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {status.map(s => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--muted)", border: `1px solid ${s.ok ? "var(--border)" : "rgba(239,68,68,0.3)"}`, borderRadius: "10px", padding: "14px 16px" }}>
                  {s.ok
                    ? <CheckCircle style={{ width: 18, height: 18, color: "var(--color-emerald)", flexShrink: 0 }} />
                    : <XCircle    style={{ width: 18, height: 18, color: "#ef4444",              flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{s.name}</div>
                    {s.error && <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "2px" }}>오류: {s.error}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: s.ok ? "var(--color-emerald)" : "var(--muted-foreground)" }}>
                      {s.ok ? `${s.count}개` : "실패"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: "3px", justifyContent: "flex-end", marginTop: "2px" }}>
                      <Clock style={{ width: 9, height: 9 }} />
                      {fmtDate(s.scrapedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 안내 */}
        <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#818cf8", marginBottom: "8px" }}>📋 운영 가이드</div>
          <div style={{ fontSize: "12px", color: "var(--muted-foreground)", lineHeight: 1.7 }}>
            · 자동 갱신: 사용자가 캠페인 페이지 접속 시 Redis 캐시에서 로드 (45분마다 자동 재요청)<br/>
            · 수동 수집: 이 페이지 또는 캠페인 허브 상단의 "실시간 수집(관리자)" 버튼 클릭<br/>
            · 스크래핑 실패 시: 이전 캐시 데이터 유지 → 사용자에게는 마지막 수집 데이터가 표시됨<br/>
            · 사이트 구조가 변경되면 스크래퍼 업데이트 필요 (개발자 문의)
          </div>
        </div>

        {/* 체험단 사이트 바로가기 */}
        <div style={{ marginTop: "24px" }}>
          <div style={{ fontSize: "11px", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>수집 대상 사이트 바로가기</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { name: "강남맛집체험단", url: "https://강남맛집.net" },
              { name: "디너의여왕",     url: "https://dinnerqueen.net" },
              { name: "파블로",         url: "https://pavlovu.com" },
              { name: "모두의체험단",   url: "https://www.modan.kr" },
              { name: "태그바이",       url: "https://www.tagby.io/recruit" },
            ].map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", padding: "7px 13px", borderRadius: "8px", background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", textDecoration: "none" }}>
                {s.name} <ExternalLink style={{ width: 10, height: 10 }} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
