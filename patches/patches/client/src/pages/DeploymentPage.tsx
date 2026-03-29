/**
 * BlogAuto Pro - Deployment Page
 * Design: Modern Professional Dark SaaS
 * Scheduled and manual deployment to Naver Blog, Tistory, etc.
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Globe,
  Plus,
  RefreshCw,
  Zap,
  ExternalLink,
  Settings,
  Trash2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLATFORMS = [
  { id: "naver", name: "네이버 블로그", icon: "N", color: "#03C75A", connected: true, posts: 187 },
  { id: "tistory", name: "티스토리", icon: "T", color: "#FF6B35", connected: true, posts: 94 },
  { id: "wordpress", name: "WordPress", icon: "W", color: "#21759B", connected: false, posts: 0 },
  { id: "custom", name: "커스텀 사이트", icon: "C", color: "#6366F1", connected: false, posts: 0 },
];

const SCHEDULED_POSTS = [
  {
    id: 1,
    title: "봄 여행 완벽 코스 - 제주도 3박 4일 여행 계획 총정리",
    platform: "네이버",
    scheduledAt: "2026-03-28 18:00",
    status: "scheduled",
    category: "여행",
  },
  {
    id: 2,
    title: "2026년 직장인 재테크 트렌드 완벽 분석",
    platform: "티스토리",
    scheduledAt: "2026-03-29 09:00",
    status: "scheduled",
    category: "금융",
  },
  {
    id: 3,
    title: "건강한 다이어트 식단 - 일주일 식단표 무료 공개",
    platform: "네이버",
    scheduledAt: "2026-03-29 14:00",
    status: "scheduled",
    category: "건강",
  },
  {
    id: 4,
    title: "서울 강남 숨은 맛집 TOP 10",
    platform: "네이버",
    scheduledAt: "2026-03-28 10:00",
    status: "published",
    category: "음식",
  },
  {
    id: 5,
    title: "강아지 기초 훈련 방법 완벽 가이드",
    platform: "티스토리",
    scheduledAt: "2026-03-27 16:00",
    status: "failed",
    category: "반려동물",
  },
];

const STATUS_CONFIG = {
  scheduled: { label: "예약됨", color: "var(--color-amber-brand)", bg: "oklch(0.769 0.188 70.08 / 15%)" },
  published: { label: "발행됨", color: "var(--color-emerald)", bg: "oklch(0.696 0.17 162.48 / 15%)" },
  failed: { label: "실패", color: "oklch(0.65 0.22 25)", bg: "oklch(0.65 0.22 25 / 15%)" },
  publishing: { label: "발행 중", color: "oklch(0.6 0.15 220)", bg: "oklch(0.6 0.15 220 / 15%)" },
};

export default function DeploymentPage() {
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [scheduleInterval, setScheduleInterval] = useState("3");
  const [posts, setPosts] = useState(SCHEDULED_POSTS);

  const handleManualDeploy = (id: number) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "publishing" } : p));
    toast.loading("발행 중...", { id: `deploy-${id}` });
    setTimeout(() => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "published" } : p));
      toast.success("발행 완료!", { id: `deploy-${id}` });
    }, 2000);
  };

  const handleDelete = (id: number) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success("예약이 취소되었습니다");
  };

  const handleConnectPlatform = (platformId: string) => {
    toast.info(`${platformId} 연동 설정은 준비 중입니다`);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              배포 관리
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              예약 배포 및 수동 배포로 여러 플랫폼에 콘텐츠를 발행합니다
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            style={{ background: "var(--color-emerald)", color: "white" }}
            onClick={() => toast.info("새 배포 예약 기능은 준비 중입니다")}
          >
            <Plus className="w-4 h-4" />
            배포 예약 추가
          </Button>
        </div>

        {/* Platform Connections */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h3 className="font-semibold text-foreground mb-4">연동 플랫폼</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="rounded-xl p-4 feature-card"
                style={{
                  background: platform.connected ? `${platform.color}10` : "var(--background)",
                  border: `1px solid ${platform.connected ? `${platform.color}40` : "var(--border)"}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white"
                    style={{ background: platform.color }}
                  >
                    {platform.icon}
                  </div>
                  {platform.connected ? (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full badge-active"
                    >
                      연결됨
                    </span>
                  ) : (
                    <button
                      className="text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                      onClick={() => handleConnectPlatform(platform.id)}
                    >
                      연결
                    </button>
                  )}
                </div>
                <div className="font-medium text-sm text-foreground">{platform.name}</div>
                {platform.connected && (
                  <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                    발행 {platform.posts}개
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Auto Schedule Settings */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">자동 예약 설정</h3>
            <Switch checked={autoSchedule} onCheckedChange={setAutoSchedule} />
          </div>

          {autoSchedule && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                  발행 간격
                </label>
                <Select value={scheduleInterval} onValueChange={setScheduleInterval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1시간마다</SelectItem>
                    <SelectItem value="3">3시간마다</SelectItem>
                    <SelectItem value="6">6시간마다</SelectItem>
                    <SelectItem value="12">12시간마다</SelectItem>
                    <SelectItem value="24">하루 1회</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                  기본 플랫폼
                </label>
                <Select defaultValue="naver">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="naver">네이버 블로그</SelectItem>
                    <SelectItem value="tistory">티스토리</SelectItem>
                    <SelectItem value="both">모두</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                  발행 시간대
                </label>
                <Select defaultValue="peak">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peak">피크타임 (09:00-21:00)</SelectItem>
                    <SelectItem value="morning">오전 (06:00-12:00)</SelectItem>
                    <SelectItem value="afternoon">오후 (12:00-18:00)</SelectItem>
                    <SelectItem value="evening">저녁 (18:00-24:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {autoSchedule && (
            <div
              className="mt-4 rounded-lg p-3 flex items-center gap-3"
              style={{ background: "oklch(0.696 0.17 162.48 / 10%)", border: "1px solid oklch(0.696 0.17 162.48 / 20%)" }}
            >
              <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-emerald)" }} />
              <span className="text-sm" style={{ color: "var(--color-emerald)" }}>
                자동 예약 활성화됨 · 매 {scheduleInterval}시간마다 새 글이 자동 발행됩니다
              </span>
            </div>
          )}
        </div>

        {/* Scheduled Posts */}
        <div
          className="rounded-xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold text-foreground">배포 목록</h3>
            <div className="flex gap-2 text-xs">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <span
                  key={key}
                  className="px-2 py-1 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              ))}
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {posts.map((post) => {
              const statusCfg = STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG];
              return (
                <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-accent/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{post.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: statusCfg.bg, color: statusCfg.color }}
                      >
                        {statusCfg.label}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <Globe className="w-3 h-3" /> {post.platform}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                        <Clock className="w-3 h-3" /> {post.scheduledAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.status === "scheduled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => handleManualDeploy(post.id)}
                      >
                        <Play className="w-3 h-3" />
                        즉시 발행
                      </Button>
                    )}
                    {post.status === "failed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => handleManualDeploy(post.id)}
                      >
                        <RefreshCw className="w-3 h-3" />
                        재시도
                      </Button>
                    )}
                    {post.status === "publishing" && (
                      <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "oklch(0.6 0.15 220)" }} />
                    )}
                    {post.status !== "published" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                      </Button>
                    )}
                    {post.status === "published" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8"
                        onClick={() => toast.info("외부 링크 열기 준비 중")}
                      >
                        <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
