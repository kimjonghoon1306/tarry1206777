/**
 * BlogAuto Pro - Dashboard Page
 * Design: Modern Professional Dark SaaS
 * Main metrics overview, recent activity, quick actions
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  TrendingUp,
  FileText,
  Image,
  Send,
  Eye,
  MousePointerClick,
  DollarSign,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
  BarChart3,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const TRAFFIC_DATA = [
  { date: "3/22", views: 1200, clicks: 340, revenue: 12400 },
  { date: "3/23", views: 1850, clicks: 520, revenue: 18900 },
  { date: "3/24", views: 1400, clicks: 390, revenue: 15200 },
  { date: "3/25", views: 2100, clicks: 680, revenue: 24600 },
  { date: "3/26", views: 1750, clicks: 490, revenue: 19800 },
  { date: "3/27", views: 2400, clicks: 720, revenue: 28100 },
  { date: "3/28", views: 2850, clicks: 890, revenue: 34500 },
];

const KEYWORD_DATA = [
  { keyword: "맛집 추천", volume: 8900, clicks: 234 },
  { keyword: "여행 코스", volume: 7200, clicks: 198 },
  { keyword: "재테크 방법", volume: 6500, clicks: 187 },
  { keyword: "다이어트 식단", volume: 5800, clicks: 156 },
  { keyword: "인테리어 소품", volume: 4900, clicks: 134 },
];

const RECENT_POSTS = [
  {
    title: "2026년 최고의 맛집 TOP 10 - 서울 강남 숨은 맛집 완벽 가이드",
    status: "published",
    views: 1240,
    clicks: 89,
    date: "2시간 전",
    platform: "네이버",
  },
  {
    title: "봄 여행 완벽 코스 - 제주도 3박 4일 여행 계획 총정리",
    status: "scheduled",
    views: 0,
    clicks: 0,
    date: "오늘 18:00",
    platform: "티스토리",
  },
  {
    title: "2026 재테크 트렌드 - 직장인이 꼭 알아야 할 투자 방법",
    status: "generating",
    views: 0,
    clicks: 0,
    date: "생성 중...",
    platform: "네이버",
  },
  {
    title: "건강한 다이어트 식단 - 일주일 식단표 무료 공개",
    status: "published",
    views: 892,
    clicks: 67,
    date: "어제",
    platform: "네이버",
  },
];

const STATUS_CONFIG = {
  published: { label: "발행됨", color: "var(--color-emerald)", bg: "oklch(0.696 0.17 162.48 / 15%)" },
  scheduled: { label: "예약됨", color: "var(--color-amber-brand)", bg: "oklch(0.769 0.188 70.08 / 15%)" },
  generating: { label: "생성 중", color: "oklch(0.6 0.15 220)", bg: "oklch(0.6 0.15 220 / 15%)" },
  error: { label: "오류", color: "oklch(0.65 0.22 25)", bg: "oklch(0.65 0.22 25 / 15%)" },
};

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAutomation = () => {
    setIsRunning(true);
    toast.loading("자동화 파이프라인 실행 중...", { id: "automation" });
    setTimeout(() => {
      setIsRunning(false);
      toast.success("자동화 완료! 3개의 새 글이 생성되었습니다", { id: "automation" });
    }, 3000);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              대시보드
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              오늘 2026년 3월 28일 · 자동화 시스템 정상 운영 중
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => toast.info("데이터를 새로고침합니다")}
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </Button>
            <Button
              size="sm"
              className="gap-2"
              style={{ background: isRunning ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
              onClick={handleRunAutomation}
              disabled={isRunning}
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? "실행 중..." : "자동화 실행"}
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "오늘 방문자",
              value: "2,847",
              change: "+18.2%",
              up: true,
              icon: Eye,
              color: "var(--color-emerald)",
            },
            {
              label: "광고 클릭",
              value: "892",
              change: "+24.1%",
              up: true,
              icon: MousePointerClick,
              color: "var(--color-amber-brand)",
            },
            {
              label: "오늘 수익",
              value: "₩34,500",
              change: "+12.8%",
              up: true,
              icon: DollarSign,
              color: "oklch(0.6 0.15 220)",
            },
            {
              label: "발행된 글",
              value: "247",
              change: "+3",
              up: true,
              icon: FileText,
              color: "oklch(0.75 0.12 300)",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl p-4 feature-card"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {metric.label}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${metric.color}20` }}
                >
                  <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                </div>
              </div>
              <div
                className="text-2xl font-black text-foreground mb-1"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {metric.value}
              </div>
              <div
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: metric.up ? "var(--color-emerald)" : "oklch(0.65 0.22 25)" }}
              >
                {metric.up ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {metric.change} 어제 대비
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Traffic Chart */}
          <div
            className="lg:col-span-2 rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">트래픽 & 수익 추이</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>최근 7일</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5" style={{ color: "var(--color-emerald)" }}>
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  방문자
                </span>
                <span className="flex items-center gap-1.5" style={{ color: "var(--color-amber-brand)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-amber-brand)" }} />
                  클릭
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.696 0.17 162.48)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.696 0.17 162.48)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
                <XAxis dataKey="date" tick={{ fill: "oklch(0.62 0.015 286.067)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.62 0.015 286.067)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="oklch(0.696 0.17 162.48)" fill="url(#viewsGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="clicks" stroke="oklch(0.769 0.188 70.08)" fill="url(#clicksGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Keywords */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">인기 키워드</h3>
              <button
                className="text-xs font-medium hover:opacity-80"
                style={{ color: "var(--color-emerald)" }}
                onClick={() => navigate("/keywords")}
              >
                전체보기
              </button>
            </div>
            <div className="space-y-3">
              {KEYWORD_DATA.map((kw, idx) => (
                <div key={kw.keyword}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center"
                        style={{
                          background: idx === 0 ? "var(--color-amber-brand)" : "var(--muted)",
                          color: idx === 0 ? "white" : "var(--muted-foreground)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm text-foreground">{kw.keyword}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {kw.volume.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={(kw.volume / 8900) * 100}
                    className="h-1.5"
                    style={{ background: "var(--muted)" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Automation Pipeline Status */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">자동화 파이프라인 현황</h3>
            <span className="text-xs badge-active px-2.5 py-1 rounded-full">실시간</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "키워드 수집", count: 142, status: "완료", icon: TrendingUp, color: "var(--color-emerald)" },
              { step: "콘텐츠 생성", count: 38, status: "진행 중", icon: Bot, color: "var(--color-amber-brand)" },
              { step: "이미지 생성", count: 24, status: "대기 중", icon: Image, color: "oklch(0.6 0.15 220)" },
              { step: "배포 예약", count: 12, status: "예약됨", icon: Send, color: "oklch(0.75 0.12 300)" },
            ].map((step) => (
              <div
                key={step.step}
                className="rounded-lg p-4 text-center"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: `${step.color}20` }}
                >
                  <step.icon className="w-5 h-5" style={{ color: step.color }} />
                </div>
                <div
                  className="text-xl font-black text-foreground mb-0.5"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {step.count}
                </div>
                <div className="text-xs text-foreground mb-1">{step.step}</div>
                <div
                  className="text-xs px-2 py-0.5 rounded-full inline-block"
                  style={{ background: `${step.color}20`, color: step.color }}
                >
                  {step.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Posts */}
        <div
          className="rounded-xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold text-foreground">최근 발행 글</h3>
            <button
              className="text-xs font-medium hover:opacity-80"
              style={{ color: "var(--color-emerald)" }}
              onClick={() => navigate("/content")}
            >
              전체보기
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {RECENT_POSTS.map((post) => {
              const statusCfg = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG];
              return (
                <div
                  key={post.title}
                  className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => toast.info("글 상세 보기는 준비 중입니다")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{post.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}
                      >
                        {statusCfg.label}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {post.platform}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {post.date}
                      </span>
                    </div>
                  </div>
                  {post.status === "published" && (
                    <div className="flex gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {post.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5" /> {post.clicks}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
