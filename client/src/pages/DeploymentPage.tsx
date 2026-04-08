// BlogAuto Pro - DeploymentPage v3.1
/**
 * DeploymentPage.tsx — BlogAuto Pro
 * 완전 재작성 버전 (구조적 오류 없음)
 *
 * 구성:
 *   - renderPreview()          : 마크다운 → JSX 변환 (순수 함수)
 *   - ImagePairBlock           : 2열 이미지 쌍 컴포넌트
 *   - ImageBlock               : 단일 이미지 블록 컴포넌트
 *   - PublishPanel             : 발행 플랫폼 + 스케줄 패널
 *   - DeploymentPage (default) : 메인 페이지
 */

import { useState, useEffect, useRef } from "react";
import React from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Send, Calendar, Clock, Image, Plus, X,
  CheckCircle2, Globe, FileText, Zap, Eye,
  Hash, MessageSquare, Upload, Trash2, AlignLeft,
  Wand2, FolderOpen, Info, ChevronDown, ChevronUp,
  Copy, ExternalLink, Smartphone, ShoppingCart, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { userGet } from "@/lib/user-storage";

// ─────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────

type TextBlock = {
  type: "text";
  id: string;
  content: string;
};

type SingleImageBlock = {
  type: "image";
  id: string;
  src: string;
  alt: string;
  position: "left" | "center" | "right";
  source: "auto" | "manual";
};

type ImagePairBlockType = {
  type: "image-pair";
  id: string;
  images: { src: string; alt: string }[];
  source: "auto";
};

type ContentBlock = TextBlock | SingleImageBlock | ImagePairBlockType;

type Platform = {
  id: string;
  type: "naver" | "wordpress" | "custom";
  name: string;
};

// ─────────────────────────────────────────────────────────
// 상수 및 유틸
// ─────────────────────────────────────────────────────────

const CONTENT_KEY = "blogauto_content";
const DEPLOY_PLATFORMS_KEY = "blogauto_deploy_platforms";

function uid(): string {
  return Math.random().toString(36).slice(2);
}

function safeParseJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────
// renderPreview — 마크다운 → JSX (순수 함수, 컴포넌트 밖)
// ─────────────────────────────────────────────────────────

function renderPreview(text: string): JSX.Element[] {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# "))
      return <h1 key={i} className="text-xl font-bold mt-3 mb-2 text-foreground leading-tight">{line.slice(2)}</h1>;
    if (line.startsWith("## "))
      return <h2 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(3)}</h2>;
    if (line.startsWith("### "))
      return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">{line.slice(4)}</h3>;
    if (line.startsWith("**") && line.endsWith("**"))
      return (
        <p key={i} className="text-sm mt-1 mb-2 font-semibold" style={{ color: "var(--muted-foreground)" }}>
          {line.replace(/\*\*/g, "")}
        </p>
      );
    if (line === "---")
      return <hr key={i} className="my-4" style={{ borderColor: "var(--border)" }} />;
    if (line === "")
      return <br key={i} />;
    if (line.startsWith("[팁]"))
      return (
        <div key={i} className="flex items-start gap-2 rounded-xl px-4 py-3 my-2 text-sm"
          style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", color: "#065f46" }}>
          <span style={{ flexShrink: 0 }}>💡</span><span>{line.slice(4).trim()}</span>
        </div>
      );
    if (line.startsWith("[주의]"))
      return (
        <div key={i} className="flex items-start gap-2 rounded-xl px-4 py-3 my-2 text-sm"
          style={{ background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412" }}>
          <span style={{ flexShrink: 0 }}>⚠️</span><span>{line.slice(5).trim()}</span>
        </div>
      );
    if (line.startsWith("[중요]"))
      return (
        <div key={i} className="flex items-start gap-2 rounded-xl px-4 py-3 my-2 text-sm"
          style={{ background: "#eff6ff", border: "1px solid #93c5fd", color: "#1e40af" }}>
          <span style={{ flexShrink: 0 }}>📌</span><span>{line.slice(5).trim()}</span>
        </div>
      );
    return (
      <p key={i} className="mb-2 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        {line}
      </p>
    );
  });
}

// ─────────────────────────────────────────────────────────
// ImagePairBlock
// ─────────────────────────────────────────────────────────

interface ImagePairBlockProps {
  block: ImagePairBlockType;
  onRemove: () => void;
}

function ImagePairBlock({ block, onRemove }: ImagePairBlockProps) {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        border: "2px solid oklch(0.696 0.17 162.48/50%)",
        background: "oklch(0.696 0.17 162.48/5%)",
      }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "oklch(0.696 0.17 162.48/30%)" }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-emerald)" }}>
          <Wand2 className="w-3.5 h-3.5" />
          2열 자동 배치 이미지
        </div>
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20"
          style={{ color: "var(--muted-foreground)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 이미지 2열 */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {block.images.map((img, i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ aspectRatio: "1" }}>
            {img.src ? (
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontSize: 12 }}
              >
                이미지 {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ImageBlock
// ─────────────────────────────────────────────────────────

interface ImageBlockProps {
  block: SingleImageBlock;
  onRemove: () => void;
  onChange: (updates: Partial<SingleImageBlock>) => void;
}

function ImageBlock({ block, onRemove, onChange }: ImageBlockProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isAuto = block.source === "auto";

  const borderColor = isAuto ? "oklch(0.696 0.17 162.48/50%)" : "oklch(0.75 0.12 300/50%)";
  const bgColor = isAuto ? "oklch(0.696 0.17 162.48/5%)" : "oklch(0.75 0.12 300/5%)";
  const headerBorderColor = isAuto ? "oklch(0.696 0.17 162.48/30%)" : "oklch(0.75 0.12 300/30%)";
  const labelColor = isAuto ? "var(--color-emerald)" : "oklch(0.75 0.12 300)";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange({ src: ev.target?.result as string, alt: file.name });
    };
    reader.readAsDataURL(file);
  }

  const alignClass =
    block.position === "center"
      ? "justify-center"
      : block.position === "right"
      ? "justify-end"
      : "justify-start";

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ border: `2px solid ${borderColor}`, background: bgColor }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: headerBorderColor }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: labelColor }}>
          {isAuto ? <Wand2 className="w-3.5 h-3.5" /> : <FolderOpen className="w-3.5 h-3.5" />}
          <span className="truncate">{isAuto ? "AI 생성 이미지" : "내 이미지"}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="text-xs rounded px-1.5 py-0.5"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            value={block.position}
            onChange={(e) => onChange({ position: e.target.value as "left" | "center" | "right" })}
          >
            <option value="left">왼쪽</option>
            <option value="center">가운데</option>
            <option value="right">오른쪽</option>
          </select>
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 이미지 미리보기 or 업로드 */}
      {block.src ? (
        <div className={`p-3 flex ${alignClass}`}>
          <div className="relative">
            <img
              src={block.src}
              alt={block.alt}
              className={`rounded-lg object-cover ${isAuto ? "w-full max-h-80" : "max-h-40"}`}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {!isAuto && (
              <button
                onClick={() => onChange({ src: "" })}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.7)" }}
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>
      ) : (
        !isAuto && (
          <button
            className="w-full p-5 flex flex-col items-center gap-2 hover:bg-accent/10 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-6 h-6 opacity-40" style={{ color: "var(--muted-foreground)" }} />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              이미지 업로드
            </span>
          </button>
        )
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Alt 텍스트 */}
      <div className="px-3 pb-2">
        <Input
          placeholder="이미지 설명 (alt)"
          value={block.alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          className="text-xs h-7"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PublishPanel
// ─────────────────────────────────────────────────────────

interface PublishPanelProps {
  platforms: Platform[];
  selectedPlatforms: string[];
  setSelectedPlatforms: React.Dispatch<React.SetStateAction<string[]>>;
  publishMode: "instant" | "scheduled";
  setPublishMode: React.Dispatch<React.SetStateAction<"instant" | "scheduled">>;
  scheduleDate: string;
  setScheduleDate: React.Dispatch<React.SetStateAction<string>>;
  scheduleTime: string;
  setScheduleTime: React.Dispatch<React.SetStateAction<string>>;
  isPublishing: boolean;
  onPublish: () => void;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
}

function PublishPanel({
  platforms,
  selectedPlatforms,
  setSelectedPlatforms,
  publishMode,
  setPublishMode,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  isPublishing,
  onPublish,
  selectedCategory,
  setSelectedCategory,
}: PublishPanelProps) {
  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  const platformBg = (type: string) => {
    if (type === "naver") return "#03C75A";
    if (type === "wordpress") return "#21759B";
    if (type === "tistory") return "#FF6300";
    return "oklch(0.65 0.28 350)";
  };

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    try {
      // 1. 관리자 Webhook 섹션 카테고리
      const adminCats =
        localStorage.getItem("admin_webhook_categories") ||
        localStorage.getItem("u:admin:webhook_categories") ||
        userGet("webhook_categories") || "";
      if (adminCats.trim()) {
        setCategories(adminCats.split(",").map(c => c.trim()).filter(Boolean));
        return;
      }
      // 2. 관리자 카테고리 탭 (blogauto_categories - JSON 배열)
      const catTab = localStorage.getItem("blogauto_categories");
      if (catTab) {
        const parsed = JSON.parse(catTab);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed);
          return;
        }
      }
      // 3. 일반 유저 - platform_custom_list
      const customList = JSON.parse(localStorage.getItem("platform_custom_list") || "[]");
      if (customList.length > 0 && customList[0].categories) {
        setCategories(JSON.parse(customList[0].categories || "[]"));
      }
    } catch {}
  }, []);

  const platformLabel = (type: string) => {
    if (type === "naver") return "N";
    if (type === "wordpress") return "WP";
    if (type === "tistory") return "T";
    return "C";
  };

  const publishBg =
    selectedPlatforms.length === 0
      ? "var(--muted)"
      : publishMode === "instant"
      ? "var(--color-emerald)"
      : "var(--color-amber-brand)";

  return (
    <>
      {/* 플랫폼 선택 */}
      <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Globe className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
          <span className="text-sm font-semibold text-foreground">발행 플랫폼</span>
        </div>
        <div className="p-4 space-y-2">
          {platforms.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                설정에서 플랫폼을 등록해주세요
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-xs"
                onClick={() => (window.location.href = "/settings")}
              >
                설정 이동
              </Button>
            </div>
          ) : (
            platforms.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{
                    background: isSelected ? "oklch(0.696 0.17 162.48/10%)" : "var(--background)",
                    border: `1px solid ${isSelected ? "oklch(0.696 0.17 162.48/50%)" : "var(--border)"}`,
                  }}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                      style={{ background: platformBg(platform.type) }}
                    >
                      {platformLabel(platform.type)}
                    </div>
                    <div>
                      <span className="text-sm text-foreground">{platform.name}</span>
                      {platform.type === "naver" && (
                        <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded"
                          style={{ background: "oklch(0.769 0.188 70.08/15%)", color: "var(--color-amber-brand)" }}>
                          복사 방식
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4" style={{ color: "#06b6d4" }} />
          <span className="text-sm font-semibold text-foreground">카테고리 선택</span>
        </div>
        <select
          className="w-full h-10 rounded-lg px-3 text-sm"
          style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">선택 안 함 (미분류)</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 발행 방식 */}
      <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" style={{ color: "var(--color-amber-brand)" }} />
          <span className="text-sm font-semibold text-foreground">발행 방식</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            className="rounded-xl p-3 text-center transition-all"
            style={{
              background: publishMode === "instant" ? "oklch(0.696 0.17 162.48/15%)" : "var(--background)",
              border: `2px solid ${publishMode === "instant" ? "oklch(0.696 0.17 162.48/60%)" : "var(--border)"}`,
            }}
            onClick={() => setPublishMode("instant")}
          >
            <Zap
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: publishMode === "instant" ? "var(--color-emerald)" : "var(--muted-foreground)" }}
            />
            <div className="text-sm font-semibold text-foreground">즉시</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              지금 바로
            </div>
          </button>
          <button
            className="rounded-xl p-3 text-center transition-all"
            style={{
              background: publishMode === "scheduled" ? "oklch(0.769 0.188 70.08/15%)" : "var(--background)",
              border: `2px solid ${publishMode === "scheduled" ? "oklch(0.769 0.188 70.08/60%)" : "var(--border)"}`,
            }}
            onClick={() => setPublishMode("scheduled")}
          >
            <Calendar
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: publishMode === "scheduled" ? "var(--color-amber-brand)" : "var(--muted-foreground)" }}
            />
            <div className="text-sm font-semibold text-foreground">예약</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              시간 지정
            </div>
          </button>
        </div>

        {publishMode === "scheduled" && (
          <div
            className="space-y-3 p-3 rounded-xl"
            style={{
              background: "oklch(0.769 0.188 70.08/8%)",
              border: "1px solid oklch(0.769 0.188 70.08/20%)",
            }}
          >
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted-foreground)" }}>
                날짜
              </label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="text-sm h-9"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted-foreground)" }}>
                시간
              </label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="text-sm h-9"
              />
            </div>
            {scheduleDate && (
              <div
                className="text-xs text-center font-medium py-1 rounded"
                style={{
                  background: "oklch(0.769 0.188 70.08/15%)",
                  color: "var(--color-amber-brand)",
                }}
              >
                📅 {scheduleDate} {scheduleTime} 발행 예정
              </div>
            )}
          </div>
        )}
      </div>

      {/* 발행 버튼 */}
      <Button
        className="w-full h-12 text-base font-semibold gap-2"
        style={{ background: publishBg, color: "white" }}
        disabled={isPublishing || selectedPlatforms.length === 0}
        onClick={onPublish}
      >
        {isPublishing ? (
          <>
            <Send className="w-4 h-4 animate-pulse" />발행 중...
          </>
        ) : publishMode === "instant" ? (
          <>
            <Zap className="w-4 h-4" />즉시 발행하기
          </>
        ) : (
          <>
            <Calendar className="w-4 h-4" />예약 발행 등록
          </>
        )}
      </Button>

      {selectedPlatforms.length === 0 && (
        <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
          플랫폼을 선택해주세요
        </p>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// DeploymentPage — 메인
// ─────────────────────────────────────────────────────────

export default function DeploymentPage() {
  // ── 저장된 콘텐츠 불러오기 ──
  const saved = safeParseJSON<Record<string, any>>(CONTENT_KEY, {});

  // ── 상태 ──
  const [title, setTitle] = useState<string>(saved?.title || "");
  const [greeting, setGreeting] = useState<string>(
    () => localStorage.getItem("blogauto_greeting") || ""
  );
  const [hashtags, setHashtags] = useState<string[]>(saved?.hashtags || []);
  const [newTag, setNewTag] = useState("");
  const [thumbnail, setThumbnail] = useState<string>(() => {
    return saved?.thumbnail || localStorage.getItem("blogauto_thumbnail") || "";
  });
  // thumbnail 변경 시 localStorage 동기화
  useEffect(() => {
    if (thumbnail) localStorage.setItem("blogauto_thumbnail", thumbnail);
    else localStorage.removeItem("blogauto_thumbnail");
  }, [thumbnail]);
  const [imageMode, setImageMode] = useState<"auto" | "manual">("auto");
  const [autoInserted, setAutoInserted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishPanel, setShowPublishPanel] = useState(false);

  const [deployImages, setDeployImages] = useState<{ id: number; src: string; alt?: string }[]>(
    () => safeParseJSON("blogauto_deploy_images", [])
  );

  // ✅ 썸네일 자동 지정: 이미지가 있고 썸네일이 없으면 첫번째 이미지로 자동 설정
  useEffect(() => {
    if (!thumbnail && deployImages.length > 0 && deployImages[0].src) {
      setThumbnail(deployImages[0].src);
    }
  }, [deployImages]);

  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    // 저장된 블록 상태 우선 복원
    const savedBlocks = safeParseJSON<ContentBlock[] | null>("blogauto_deploy_blocks", null);
    if (Array.isArray(savedBlocks) && savedBlocks.length > 0) {
      // 텍스트 블록이 실제 내용 있는지 확인
      const hasContent = savedBlocks.some(b => b.type === "text" && (b as TextBlock).content.trim().length > 0);
      if (hasContent) return savedBlocks;
    }
    // localStorage에서 콘텐츠 새로 파싱
    const freshSaved = safeParseJSON<Record<string, any>>(CONTENT_KEY, {});
    const content: string = freshSaved?.content || "";
    if (!content) return [{ type: "text", id: uid(), content: "" }];
    return content
      .split("\n\n")
      .filter(Boolean)
      .map((p) => ({ type: "text" as const, id: uid(), content: p }));
  });

  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    const stored = localStorage.getItem(DEPLOY_PLATFORMS_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    const defaults: Platform[] = [];
    if (userGet("naver_blog_id"))
      defaults.push({ id: uid(), type: "naver", name: "네이버 블로그" });
    if (userGet("wp_url"))
      defaults.push({ id: uid(), type: "wordpress", name: "WordPress" });
    if (userGet("webhook_url") ||
       (JSON.parse(localStorage.getItem("platform_custom_list") || "[]").length > 0))
      defaults.push({ id: uid(), type: "custom", name: "커스텀 사이트" });
    if (userGet("tistory_access_token"))
      defaults.push({ id: uid(), type: "tistory" as any, name: "티스토리" });
    return defaults;
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishMode, setPublishMode] = useState<"instant" | "scheduled">("instant");
  const [scheduleDate, setScheduleDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [isPublishing, setIsPublishing] = useState(false);

  const thumbnailRef = useRef<HTMLInputElement>(null);
  const manualFileRef = useRef<HTMLInputElement>(null);
  const imageModeRef = useRef(imageMode);
  imageModeRef.current = imageMode;

  // ── 블록 자동 저장 ──
  useEffect(() => {
    try {
      const toSave = blocks.map((b) => {
        if (b.type === "image-pair") {
          return { ...b, images: b.images.filter((img) => !img.src.startsWith("data:")) };
        }
        if (b.type === "image" && b.src.startsWith("data:")) return { ...b, src: "" };
        return b;
      });
      localStorage.setItem("blogauto_deploy_blocks", JSON.stringify(toSave));
    } catch {}
  }, [blocks]);

  // ── Ctrl+V 클립보드 이미지 ──
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) break;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const src = ev.target?.result as string;
            if (!src) return;
            if (imageModeRef.current === "manual") {
              setBlocks((prev) => [
                ...prev,
                { type: "image", id: uid(), src, alt: "붙여넣은 이미지", position: "center", source: "manual" },
              ]);
              toast.success("✅ 클립보드 이미지가 본문에 추가되었습니다!");
            } else {
              setThumbnail(src);
              toast.success("✅ 클립보드 이미지가 썸네일로 설정되었습니다!");
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // ── autoInsert URL 파라미터 처리 ──
  // blocks가 로드된 후 실행되도록 blocks 의존성 추가
  const [pendingAutoInsert, setPendingAutoInsert] = useState<{ id: number; src: string; alt?: string }[] | null>(() => {
    const autoInsertParam = new URLSearchParams(window.location.search).get("autoInsert");
    if (autoInsertParam === "true") {
      const stored = safeParseJSON<{ id: number; src: string; alt?: string }[]>("blogauto_deploy_images", []);
      if (stored.length > 0) return stored;
    }
    return null;
  });

  useEffect(() => {
    if (!pendingAutoInsert) return;
    // 텍스트 블록이 로드됐을 때만 실행
    const textBlocks = blocks.filter(b => b.type === "text" && (b as TextBlock).content.trim().length > 0);
    if (textBlocks.length > 0) {
      triggerAutoInsert(pendingAutoInsert);
      setPendingAutoInsert(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, pendingAutoInsert]);

  // ── 블록 조작 함수들 ──

  function updateBlock(id: string, updates: Partial<ContentBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...updates } as ContentBlock) : b)));
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }

  function addTextBlock(afterId?: string) {
    const newBlock: TextBlock = { type: "text", id: uid(), content: "" };
    if (!afterId) {
      setBlocks((prev) => [...prev, newBlock]);
      return;
    }
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newBlock);
      return next;
    });
  }

  function addManualImageBlock(afterId?: string) {
    const newBlock: SingleImageBlock = {
      type: "image",
      id: uid(),
      src: "",
      alt: "",
      position: "center",
      source: "manual",
    };
    if (!afterId) {
      setBlocks((prev) => [...prev, newBlock]);
      return;
    }
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newBlock);
      return next;
    });
  }

  // ── 자동 이미지 삽입 (첫 이미지 맨 앞 + 3단락마다 1장) ──
  function triggerAutoInsert(images: { id: number; src: string; alt?: string }[]) {
    // 기존 자동 이미지 제거, 텍스트+수동이미지만 남김
    const textOnly = blocks.filter(
      (b) => b.type === "text" || (b.type === "image" && (b as SingleImageBlock).source === "manual")
    );
    const textBlocks = textOnly.filter((b) => b.type === "text");
    if (textBlocks.length === 0) {
      toast.error("본문 텍스트가 없습니다");
      return;
    }

    // FAQ/참고자료 마커가 있는 블록 이후는 이미지 삽입 금지
    function hasSectionMarker(b: ContentBlock): boolean {
      if (b.type !== "text") return false;
      const c = (b as TextBlock).content;
      return c.includes("[FAQ시작]") || c.includes("[참고자료시작]") || c.includes("[관련글시작]");
    }

    const markerIdx = textOnly.findIndex(hasSectionMarker);
    const safeBlocks = markerIdx === -1 ? textOnly : textOnly.slice(0, markerIdx);
    const sectionBlocks = markerIdx === -1 ? [] : textOnly.slice(markerIdx);
    const safeTextCount = safeBlocks.filter((b) => b.type === "text").length;

    const imgs = images.filter((img) => img?.src && img.src.trim() !== "");

    if (imgs.length === 0) {
      toast.error("이미지가 없습니다");
      return;
    }

    const result: ContentBlock[] = [];
    let insertedCount = 0;
    let textCount = 0;

    // ✅ 첫 이미지를 맨 앞에 삽입
    result.push({
      type: "image",
      id: uid(),
      src: imgs[0].src,
      alt: imgs[0].alt || "이미지 1",
      position: "center",
      source: "auto",
    } as ContentBlock);
    insertedCount++;

    // ✅ 남은 이미지를 본문 길이에 맞춰 최대한 고르게 분산 배치
    const remainingImages = imgs.slice(1);
    const insertMap = new Map<number, typeof remainingImages>();

    if (safeTextCount > 0 && remainingImages.length > 0) {
      remainingImages.forEach((img, index) => {
        const targetTextIndex = Math.min(
          safeTextCount,
          Math.max(1, Math.ceil(((index + 1) * safeTextCount) / remainingImages.length))
        );
        const bucket = insertMap.get(targetTextIndex) || [];
        bucket.push(img);
        insertMap.set(targetTextIndex, bucket);
      });
    }

    for (let i = 0; i < safeBlocks.length; i++) {
      result.push(safeBlocks[i]);

      if (safeBlocks[i].type === "text") {
        textCount++;
        const toInsert = insertMap.get(textCount) || [];
        toInsert.forEach((img, idx) => {
          result.push({
            type: "image",
            id: uid(),
            src: img.src,
            alt: img.alt || `이미지 ${insertedCount + idx + 1}`,
            position: "center",
            source: "auto",
          } as ContentBlock);
        });
        insertedCount += toInsert.length;
      }
    }

    // ✅ 텍스트보다 이미지가 훨씬 많아서 못 들어간 경우 맨 끝(FAQ 전)에 추가
    if (insertedCount < imgs.length) {
      imgs.slice(insertedCount).forEach((img, idx) => {
        result.push({
          type: "image",
          id: uid(),
          src: img.src,
          alt: img.alt || `이미지 ${insertedCount + idx + 1}`,
          position: "center",
          source: "auto",
        } as ContentBlock);
      });
      insertedCount = imgs.length;
    }

    // ✅ FAQ/참고자료 섹션은 이미지 없이 맨 끝에 추가
    for (const b of sectionBlocks) {
      result.push(b);
    }

    setBlocks(result);
    setAutoInserted(true);
    toast.success(`이미지 ${insertedCount}장 모두 배치 완료!`);
  }

  function handleAutoInsert() {
    if (deployImages.length === 0) {
      toast.error("이미지 생성 페이지에서 이미지를 먼저 만들어오세요");
      return;
    }
    triggerAutoInsert(deployImages);
  }

  function handleRemoveAutoImages() {
    setBlocks((prev) =>
      prev.filter((b) => b.type === "text" || (b.type === "image" && b.source === "manual"))
    );
    setAutoInserted(false);
    toast.success("자동 삽입 이미지 제거됨");
  }

  // ── 콘텐츠 빌드 ──
  function buildHtmlContent(): string {
    const tocEntries: { id: string; title: string }[] = [];
    let autoSectionIndex = 0;

    function escapeHtml(text: string): string {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function inlineFormat(text: string): string {
      return escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
    }

    function stripInlineMarkdown(text: string): string {
      return text
        .replace(/^#{1,3}\s+/, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .trim();
    }

    function shortenTitle(text: string, max = 26): string {
      const cleaned = stripInlineMarkdown(text).replace(/\s+/g, " ").trim();
      if (!cleaned) return `핵심 내용 ${tocEntries.length + 1}`;
      return cleaned.length > max ? `${cleaned.slice(0, max).trim()}…` : cleaned;
    }

    function makeSectionHeading(title: string, id?: string): string {
      const sectionId = id || `section-${tocEntries.length}`;
      const cleanTitle = shortenTitle(title, 60);
      tocEntries.push({ id: sectionId, title: cleanTitle });
      return `<h2 id="${sectionId}" style="font-size:22px;font-weight:800;margin:36px 0 14px;color:#111111;border-bottom:2px solid #e8e8ed;padding-bottom:10px;letter-spacing:-.02em;display:flex;align-items:center;gap:10px"><span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#2563eb;color:white;font-size:13px;font-weight:800;flex-shrink:0">${tocEntries.length}</span>${inlineFormat(cleanTitle)}</h2>`;
    }

    function buildCallout(type: "tip" | "warning" | "important", body: string): string {
      const styles = {
        tip: {
          bg: "#eff6ff",
          border: "#2563eb",
          color: "#1e3a8a",
          icon: "💡",
        },
        warning: {
          bg: "#fffbeb",
          border: "#f59e0b",
          color: "#78350f",
          icon: "⚠️",
        },
        important: {
          bg: "#f0fdf4",
          border: "#16a34a",
          color: "#14532d",
          icon: "✅",
        },
      } as const;
      const s = styles[type];
      return `<div style="background:${s.bg};border-left:4px solid ${s.border};border-radius:0 10px 10px 0;padding:14px 18px;margin:18px 0;font-size:15px;color:${s.color};line-height:1.8">${s.icon} ${body}</div>`;
    }

    function classifyCallout(line: string): "tip" | "warning" | "important" | null {
      const trimmed = line.trim();
      if (!trimmed) return null;

      if (/^\[팁\]/.test(trimmed)) return "tip";
      if (/^\[(주의|경고)\]/.test(trimmed)) return "warning";
      if (/^\[(중요|필수)\]/.test(trimmed)) return "important";

      if (/^(tip|팁|포인트|핵심|check|체크|꿀팁|추천)[:\s!]/i.test(trimmed)) return "tip";
      if (/^(주의|경고|warning|caution|조심|실수)[:\s!]/i.test(trimmed)) return "warning";
      if (/^(중요|필수|반드시|꼭|key|핵심 정리|요약|정리)[:\s!]/i.test(trimmed)) return "important";

      if (/반드시|꼭 확인|주의해야|절대|가장 중요|핵심은|정리하면|요약하면|놓치면 안/.test(trimmed)) return "important";
      if (/주의|조심|실수|틀리기|헷갈리|오해|잘못|피해야|주의사항/.test(trimmed)) return "warning";
      if (/팁|꿀팁|비법|비결|노하우|포인트|추천|도움이 됩니다|유용합니다/.test(trimmed)) return "tip";

      return null;
    }

    function mdLineToHtml(line: string, paragraphIndexRef: { value: number }, explicitHeadingFoundRef: { value: boolean }): string {
      const trimmed = line.trim();
      if (!trimmed) return "";

      if (/^##\s+/.test(trimmed)) {
        explicitHeadingFoundRef.value = true;
        return makeSectionHeading(trimmed.replace(/^##\s+/, ""));
      }

      if (/^###\s+/.test(trimmed)) {
        return `<h3 style="font-size:18px;font-weight:700;margin:24px 0 10px;color:#1a1a1a;border-left:4px solid #2563eb;padding-left:10px">${inlineFormat(trimmed.replace(/^###\s+/, ""))}</h3>`;
      }

      if (/^---+$/.test(trimmed)) {
        return `<hr style="border:none;border-top:2px solid #eee;margin:24px 0">`;
      }

      const calloutType = classifyCallout(trimmed);
      if (calloutType) {
        const body = inlineFormat(
          trimmed
            .replace(/^\[(팁|주의|경고|중요|필수)\]\s*/i, "")
            .replace(/^(tip|팁|포인트|핵심|check|체크|꿀팁|추천|주의|경고|warning|caution|조심|실수|중요|필수|반드시|꼭|key|핵심 정리|요약|정리)[:\s!]+/i, "")
        );
        return buildCallout(calloutType, body || inlineFormat(trimmed));
      }

      const isBulletListLine = /^[-*•]\s+/.test(trimmed);
      const isNumberedListLine = /^\d+[.)]\s+/.test(trimmed);
      const isListLine = isBulletListLine || isNumberedListLine;
      const cleanedText = stripInlineMarkdown(trimmed);
      const isTitleLike = !/[.!?。！？]$/.test(cleanedText) && cleanedText.length >= 8 && cleanedText.length <= 42;

      if (isNumberedListLine) {
        const numberedBody = inlineFormat(trimmed.replace(/^(\d+[.)])\s+/, `<strong>$1</strong> `));
        return buildCallout("important", numberedBody);
      }

      let autoHeadingHtml = "";
      if (!explicitHeadingFoundRef.value && paragraphIndexRef.value > 0 && paragraphIndexRef.value % 3 === 0 && !isListLine) {
        autoSectionIndex += 1;
        autoHeadingHtml = makeSectionHeading(shortenTitle(cleanedText || `핵심 내용 ${autoSectionIndex}`, 24), `section-auto-${autoSectionIndex}`);
      } else if (!explicitHeadingFoundRef.value && paragraphIndexRef.value === 0 && isTitleLike) {
        autoSectionIndex += 1;
        autoHeadingHtml = makeSectionHeading(shortenTitle(cleanedText, 24), `section-auto-${autoSectionIndex}`);
      }

      paragraphIndexRef.value += 1;
      const text = inlineFormat(trimmed);
      const paragraphHtml = isBulletListLine
        ? `<p style="line-height:1.9;margin:0 0 12px;color:#333333;font-size:16px;padding-left:4px">${text}</p>`
        : `<p style="line-height:1.9;margin:0 0 16px;color:#333333;font-size:16px">${text}</p>`;

      return autoHeadingHtml + paragraphHtml;
    }

    function groupLines(lines: string[]): string {
      const result: string[] = [];
      let tableBuffer: string[] = [];
      const paragraphIndexRef = { value: 0 };
      const explicitHeadingFoundRef = { value: false };

      function flushTable() {
        if (tableBuffer.length < 2) {
          tableBuffer.forEach((l) => result.push(mdLineToHtml(l, paragraphIndexRef, explicitHeadingFoundRef)));
          tableBuffer = [];
          return;
        }
        const rows = tableBuffer.filter((l) => !/^\|[-\s|]+\|$/.test(l.trim()));
        const tableHtml = `<div style="overflow-x:auto;margin:20px 0"><table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">${rows
          .map((row, ri) => {
            const cells = row.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
            const tag = ri === 0 ? "th" : "td";
            const rowBg = ri === 0 ? "background:#2563eb;color:white;" : ri % 2 === 0 ? "background:#f8fafc;" : "background:white;";
            return `<tr>${cells.map((c) => `<${tag} style="padding:12px 16px;border:1px solid #e2e8f0;text-align:left;${rowBg}font-weight:${ri === 0 ? "700" : "400"}">${inlineFormat(c)}</${tag}>`).join("")}</tr>`;
          })
          .join("\n")}</table></div>`;
        result.push(tableHtml);
        tableBuffer = [];
      }

      for (const line of lines) {
        if (/^\|.+\|/.test(line.trim())) {
          tableBuffer.push(line);
        } else {
          if (tableBuffer.length > 0) flushTable();
          const html = mdLineToHtml(line, paragraphIndexRef, explicitHeadingFoundRef);
          if (html) result.push(html);
        }
      }
      if (tableBuffer.length > 0) flushTable();
      return result.filter(Boolean).join("\n");
    }

    function extractSection(text: string, startTag: string, endTag: string): string {
      const s = text.indexOf(startTag);
      const e = text.indexOf(endTag);
      if (s === -1 || e === -1) return "";
      return text.slice(s + startTag.length, e).trim();
    }

    const allRawText = blocks
      .filter((b: any) => b.type === "text")
      .map((b: any) => (b as TextBlock).content)
      .join("\n\n");

    const faqRaw = extractSection(allRawText, "[FAQ시작]", "[FAQ끝]");
    const refRaw = extractSection(allRawText, "[참고자료시작]", "[참고자료끝]");
    const postRaw = extractSection(allRawText, "[관련글시작]", "[관련글끝]");

    const parts: string[] = [];

    // FAQ/참고자료/관련글 마커 블록 인덱스 사전 스캔 — 이미지가 마커보다 앞에 있어도 차단
    const sectionMarkerIdx = (blocks as any[]).findIndex(
      (b: any) =>
        b.type === "text" &&
        (b.content.includes("[FAQ시작]") ||
          b.content.includes("[참고자료시작]") ||
          b.content.includes("[관련글시작]"))
    );

    blocks.forEach((b: any, blockIdx: number) => {
      const afterSection = sectionMarkerIdx !== -1 && blockIdx >= sectionMarkerIdx;
      if (b.type === "text") {
        const cleaned = b.content
          .replace(/\[FAQ시작\][\s\S]*?\[FAQ끝\]/g, "")
          .replace(/\[참고자료시작\][\s\S]*?\[참고자료끝\]/g, "")
          .replace(/\[관련글시작\][\s\S]*?\[관련글끝\]/g, "")
          .trim();
        if (cleaned) {
          parts.push(groupLines(cleaned.split("\n")));
        }
      } else if (b.type === "image-pair") {
        if (afterSection) return; // 섹션 이후 이미지 절대 금지
        const validImgs = b.images.filter((img: any) => img.src && img.src.trim() !== "");
        if (validImgs.length > 0) {
          const imgHtml = validImgs
            .map(
              (img: any) =>
                `<figure style="display:inline-block;width:${validImgs.length > 1 ? "48%" : "100%"};margin:4px 1%;vertical-align:top">` +
                `<img src="${img.src}" alt="${escapeHtml(img.alt || "")}" style="width:100%;border-radius:12px;display:block">` +
                (img.alt
                  ? `<figcaption style="font-size:12px;color:#888;text-align:center;margin-top:4px">${inlineFormat(img.alt)}</figcaption>`
                  : "") +
                `</figure>`
            )
            .join("");
          parts.push(`<div style="margin:16px 0;line-height:0">${imgHtml}</div>`);
        }
      } else if (b.type === "image") {
        if (afterSection) return; // 섹션 이후 이미지 절대 금지
        const imgSrc = b.src || b.url || "";
        if (imgSrc) {
          parts.push(
            `<figure style="margin:20px 0;text-align:center">` +
              `<img src="${imgSrc}" alt="${escapeHtml(b.alt || "")}" style="width:100%;border-radius:12px;display:block">` +
              (b.alt
                ? `<figcaption style="font-size:12px;color:#888;text-align:center;margin-top:6px">${inlineFormat(b.alt)}</figcaption>`
                : "") +
              `</figure>`
          );
        }
      }
    });

    if (hashtags.length > 0) {
      parts.push(`<p style="margin-top:24px;color:#888;font-size:14px">${hashtags.map((tag) => inlineFormat(tag)).join(" ")}</p>`);
    }

    const bodyHtml = parts.join("\n");

    let faqHtml = "";
    if (faqRaw) {
      const qaPairs: { q: string; a: string }[] = [];
      const lines = faqRaw.split("\n").map((l: string) => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const qMatch = lines[i].match(/^Q\d+:\s*(.+)/);
        if (qMatch && lines[i + 1]) {
          const aNext = lines[i + 1].match(/^A\d+:\s*(.+)/);
          if (aNext) {
            qaPairs.push({ q: qMatch[1], a: aNext[1] });
            i++;
          }
        }
      }
      if (qaPairs.length > 0) {
        faqHtml = `<div id="faq-section" style="margin:48px 0 32px;padding:28px;background:#f8f9ff;border-radius:16px;border:1px solid #e0e4ff"><h2 style="font-size:20px;font-weight:800;color:#333;margin:0 0 20px;display:flex;align-items:center;gap:8px"><span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:#6366f1;border-radius:8px;color:white;font-size:16px;flex-shrink:0">Q</span>자주 묻는 질문</h2>${qaPairs
          .map(
            ({ q, a }: { q: string; a: string }) =>
              `<div style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:1px solid #e0e4ff"><div style="background:#6366f1;color:white;padding:14px 18px;font-weight:700;font-size:15px">Q. ${inlineFormat(q)}</div><div style="background:white;padding:14px 18px;color:#444;font-size:14px;line-height:1.8">A. ${inlineFormat(a)}</div></div>`
          )
          .join("")}</div>`;
      }
    }

    let refHtml = "";
    if (refRaw) {
      const links: { name: string; desc: string; url: string }[] = [];
      refRaw.split("\n").forEach((line: string) => {
        const m = line.match(/^LINK\d+:\s*(.+?)\|(.+?)\|(.+)/);
        if (m) links.push({ name: m[1].trim(), desc: m[2].trim(), url: m[3].trim() });
      });
      if (links.length > 0) {
        refHtml = `<div id="ref-section" style="margin:48px 0 32px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:20px"><div style="width:4px;height:24px;background:linear-gradient(180deg,#2563eb,#1d4ed8);border-radius:2px;flex-shrink:0"></div><h2 style="font-size:18px;font-weight:800;color:#1a1a1a;margin:0">참고자료 &amp; 링크</h2></div><div style="display:grid;gap:10px">${links
          .map(
            ({ name, desc, url }: { name: string; desc: string; url: string }) =>
              `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:#ffffff;border-radius:14px;border:1px solid #e8e8eb;text-decoration:none;box-shadow:0 1px 4px rgba(0,0,0,0.06)"><div style="flex:1;min-width:0"><div style="font-weight:700;color:#2563eb;font-size:15px;margin-bottom:4px">🔗 ${inlineFormat(name)}</div><div style="color:#86868b;font-size:13px;line-height:1.5">${inlineFormat(desc)}</div></div><div style="flex-shrink:0;margin-left:12px;width:32px;height:32px;border-radius:50%;background:#eff3ff;display:flex;align-items:center;justify-content:center;font-size:14px;color:#2563eb">→</div></a>`
          )
          .join("")}</div></div>`;
      }
    }

    let postHtml = "";
    if (postRaw) {
      const posts: { title: string; desc: string; url: string }[] = [];
      postRaw.split("\n").forEach((line: string) => {
        const l = line.trim();
        if (!l) return;
        // POST1: 제목|설명|URL
        const m3 = l.match(/^POST\d+:\s*(.+?)\|(.+?)\|(https?:\/\/.+)/);
        if (m3) { posts.push({ title: m3[1].trim(), desc: m3[2].trim(), url: m3[3].trim() }); return; }
        // POST1: 제목|설명 (하위 호환)
        const m2 = l.match(/^POST\d+:\s*(.+?)\|(.+)/);
        if (m2) posts.push({ title: m2[1].trim(), desc: m2[2].trim(), url: "" });
      });
      if (posts.length > 0) {
        postHtml = `<div style="margin:40px 0"><h2 style="font-size:20px;font-weight:800;color:#333;margin:0 0 16px">관련 글</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">${posts
          .map(({ title, desc, url }: { title: string; desc: string; url: string }) => {
            const inner = `<div style="font-weight:700;color:#1e293b;font-size:14px;margin-bottom:8px;line-height:1.5">${inlineFormat(title)}</div><div style="color:#64748b;font-size:12px;line-height:1.6">${inlineFormat(desc)}</div>`;
            if (url) return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:block;padding:18px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.06);text-decoration:none">${inner}</a>`;
            return `<div style="padding:18px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,0.06)">${inner}</div>`;
          })
          .join("")}</div></div>`;
      }
    }

    let tocHtml = "";
    if (tocEntries.length >= 1) {
      const tocItems = tocEntries.map(
        (entry, i) =>
          `<li style="margin:8px 0;display:flex;align-items:center;gap:8px"><span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#2563eb;color:white;font-size:11px;font-weight:800;flex-shrink:0">${i + 1}</span><a href="#${entry.id}" style="color:#2563eb;text-decoration:none;font-size:14px;font-weight:500">${inlineFormat(entry.title)}</a></li>`
      );
      if (faqRaw) tocItems.push(`<li style="margin:6px 0"><a href="#faq-section" style="color:#2563eb;text-decoration:none;font-size:14px;font-weight:500">자주 묻는 질문</a></li>`);
      if (refRaw) tocItems.push(`<li style="margin:6px 0"><a href="#ref-section" style="color:#2563eb;text-decoration:none;font-size:14px;font-weight:500">참고자료 &amp; 링크</a></li>`);
      tocHtml = `<div style="background:#f0f4ff;border:1px solid #c7d7fe;border-radius:14px;padding:20px 24px;margin:0 0 32px"><div style="font-weight:800;font-size:15px;color:#2563eb;margin-bottom:12px">📋 목차</div><ol style="margin:0;padding:0;list-style:none">${tocItems.join("\n")}</ol></div>`;
    }

    const tailHtml = faqHtml + refHtml + postHtml;

    // 목차를 썸네일(본문 첫 이미지) 아래로 이동
    // 첫 블록이 이미지면: 첫 이미지 -> 목차 -> 나머지 본문 순서
    if (tocHtml) {
      const firstBlock = blocks[0];
      const firstIsImage = firstBlock && (firstBlock.type === "image" || firstBlock.type === "image-pair");
      if (firstIsImage && parts.length > 0) {
        const [firstPart, ...restParts] = parts;
        return firstPart + tocHtml + restParts.join("\n") + tailHtml;
      }
    }

    return tocHtml + bodyHtml + tailHtml;
  }

  function buildFinalContent(): string {
    const parts: string[] = [];
    if (greeting.trim()) parts.push(`[인사말]\n${greeting}\n`);
    blocks.forEach((b) => {
      if (b.type === "text") parts.push(b.content);
      else if (b.type === "image-pair")
        parts.push(b.images.map((img) => `[이미지: ${img.alt}]`).join("  "));
      else parts.push(`[이미지: ${b.alt || "이미지"} - 정렬: ${b.position}]`);
    });
    if (hashtags.length > 0) parts.push("\n" + hashtags.join(" "));
    return parts.join("\n\n");
  }

  // ── WordPress 발행 ──
  async function publishToWordPress(scheduledAt: string | null) {
    const wpUrl = userGet("wp_url");
    const wpUser = userGet("wp_username");
    const wpPass = userGet("wp_app_password");
    if (!wpUrl || !wpUser || !wpPass) throw new Error("WordPress 설정이 없습니다.");
    const postData: Record<string, unknown> = {
      title,
      content: buildHtmlContent(),
      status: scheduledAt ? "future" : "publish",
      tags: hashtags.map((t) => t.replace("#", "")),
    };
    if (scheduledAt) postData.date = scheduledAt;
    const resp = await fetch(`${wpUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${wpUser}:${wpPass}`)}`,
      },
      body: JSON.stringify(postData),
    });
    if (!resp.ok) {
      const e = await resp.json();
      throw new Error(e.message || "WordPress 발행 실패");
    }
  }

  // ── 쿠팡파트너스 링크 자동 삽입 ──────────────────
  const [coupangLinks, setCoupangLinks] = React.useState<{name:string;url:string;price:string}[]>([]);
  const [coupangLoading, setCoupangLoading] = React.useState(false);

  const fetchCoupangLinks = async () => {
    const accessKey = userGet("coupang_access_key");
    const secretKey = userGet("coupang_secret_key");
    if (!accessKey || !secretKey) {
      toast.error("설정에서 쿠팡파트너스 API 키를 먼저 입력해주세요");
      return;
    }
    if (!keyword && !title) { toast.error("키워드나 제목이 없습니다"); return; }
    setCoupangLoading(true);
    try {
      const searchKeyword = keyword || title;
      const resp = await fetch("/api/coupang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", accessKey, secretKey, keyword: searchKeyword, limit: 3 }),
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error);
      setCoupangLinks(data.products.map((p: any) => ({
        name: p.productName.slice(0, 40),
        url: p.affiliateUrl,
        price: p.productPrice ? `₩${Number(p.productPrice).toLocaleString()}` : "",
      })));
      toast.success(`✅ 쿠팡 상품 ${data.products.length}개 불러왔어요!`);
    } catch (e: any) {
      toast.error("쿠팡 검색 실패: " + e.message);
    } finally { setCoupangLoading(false); }
  };

  const insertCoupangLinks = () => {
    if (coupangLinks.length === 0) { toast.error("먼저 상품을 검색해주세요"); return; }
    const lines = coupangLinks.map(p => {
      const price = p.price ? " - " + p.price : "";
      return "[상품] " + p.name + price + " : " + p.url;
    });
    const coupangText = [
      "",
      "---",
      "[추천 상품]",
      ...lines,
      "(이 글에는 파트너스 링크가 포함되어 있습니다)",
      "---",
      "",
    ].join("\n");
    setBlocks(prev => [...prev, { type: "text" as const, id: uid(), content: coupangText }]);
    toast.success("쿠팡 링크가 본문 끝에 추가됐어요!");
    setCoupangLinks([]);
  };

  // ── 티스토리 발행 ──────────────────────────────────
  async function publishToTistory(scheduledAt: string | null) {
    const accessToken = userGet("tistory_access_token");
    const blogName = userGet("tistory_blog_name");
    if (!accessToken || !blogName) throw new Error("설정에서 티스토리 Access Token과 블로그를 먼저 등록해주세요");

    const htmlContent = blocks.map(b => {
      if (b.type === "text") {
        return b.content
          .replace(/^### (.+)/gm, "<h3>$1</h3>")
          .replace(/^## (.+)/gm, "<h2>$1</h2>")
          .replace(/^# (.+)/gm, "<h1>$1</h1>")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br>");
      } else if (b.type === "image-pair") {
        return `<div style="display:flex;gap:8px">${b.images.map(img => `<img src="${img.src}" style="width:50%;border-radius:8px">`).join("")}</div>`;
      } else if (b.type === "image" && b.src) {
        return `<p style="text-align:center"><img src="${b.src}" style="max-width:100%;border-radius:8px"></p>`;
      }
      return "";
    }).join("<br><br>");

    const resp = await fetch("/api/tistory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "publish",
        accessToken,
        blogName,
        title,
        content: htmlContent,
        tags: hashtags.map(t => t.replace("#", "")).join(","),
        scheduledAt,
      }),
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error);
    toast.success(`✅ 티스토리 발행 완료! ${data.url}`);
  }

  // ── 네이버 블로그용 복사 (제목 + 본문 + 해시태그) ──
  function copyForNaver() {
    const lines: string[] = [];
    // 제목
    if (title.trim()) lines.push(title.trim() + "\n");
    // 인사말
    if (greeting.trim()) lines.push(greeting.trim() + "\n");
    // 본문 (마크다운 제거 → 네이버 친화적 텍스트)
    blocks.forEach(b => {
      if (b.type === "text") {
        const clean = b.content
          .replace(/^#{1,3}\s+/gm, "")   // ## 제목 기호 제거
          .replace(/\*\*(.*?)\*\*/g, "$1") // **강조** 제거
          .replace(/\*(.*?)\*/g, "$1");    // *이탤릭* 제거
        lines.push(clean);
      } else if (b.type === "image-pair") {
        lines.push("[이미지]\n[이미지]");
      } else if (b.type === "image" && b.src) {
        lines.push("[이미지]");
      }
    });
    // 해시태그
    if (hashtags.length > 0) lines.push("\n" + hashtags.join(" "));

    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      toast.success("✅ 네이버 블로그용으로 복사됐어요! 네이버 블로그 에디터에 붙여넣으세요 📋", { duration: 4000 });
    });
  }

  // ── Webhook 발행 ──
  async function publishToWebhook() {
    // 1. platform_custom_list 우선 (신규 방식)
    let url = "";
    let key = "";
    let authHeader = "Authorization";

    try {
      const customList = JSON.parse(localStorage.getItem("platform_custom_list") || "[]");
      if (customList.length > 0) {
        url = customList[0]["webhook_url"] || "";
        key = customList[0]["webhook_auth_key"] || "";
        authHeader = customList[0]["webhook_auth_header"] || "Authorization";
      }
    } catch {}

    // 2. 기존 방식 fallback
    if (!url) url = userGet("webhook_url") || "";
    if (!key) key = userGet("webhook_auth_key") || "";
    if (authHeader === "Authorization") authHeader = userGet("webhook_auth_header") || "Authorization";

    if (!url) throw new Error("Webhook URL이 없습니다. 설정에서 커스텀 웹사이트를 등록해주세요.");
    // CORS 우회: Vercel 서버를 프록시로 사용
    const thumbnailUrl = thumbnail || localStorage.getItem("blogauto_thumbnail") || "";
    const tagStr = hashtags.map((t: string) => t.replace("#", "")).join(", ");
    const slugBase = title.toLowerCase().replace(/[^a-z0-9가-힣]/g, "-").replace(/-+/g, "-").slice(0, 80);
    const payload = {
      title,
      content: buildHtmlContent(),
      thumbnail: thumbnailUrl,
      tags: tagStr,
      slug: slugBase,
      excerpt: buildFinalContent().slice(0, 160),
      category: selectedCategory || "",
      status: publishMode === "scheduled" ? "scheduled" : "published",
      publish_at: publishMode === "scheduled" ? `${scheduleDate}T${scheduleTime}:00` : null,
      scheduledAt: publishMode === "scheduled" ? `${scheduleDate}T${scheduleTime}:00` : null,
    };

    // 1차 시도: Vercel API 프록시 경유
    try {
      const proxyResp = await fetch("/api/webhook-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, key, authHeader, payload }),
      });
      if (proxyResp.ok) return;
      // 프록시 없으면 직접 시도
    } catch {}

    // 2차 시도: 직접 호출 (CORS 허용된 경우)
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (key && authHeader !== "none") {
      if (authHeader === "Authorization") {
        headers["Authorization"] = key.startsWith("Bearer ") ? key : key;
      } else {
        headers[authHeader] = key;
      }
    }
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`Webhook 전송 실패 (${resp.status}): ${url} 서버가 POST 요청을 허용하는지 확인해주세요`);
  }

  // ── 초기화 ──
  function handleReset(type: "all" | "content" | "image") {
    if (type === "all") {
      setTitle("");
      setHashtags([]);
      setBlocks([{ type: "text", id: uid(), content: "" }]);
      setThumbnail("");
      localStorage.removeItem("blogauto_deploy_blocks");
      localStorage.removeItem(CONTENT_KEY);
      localStorage.removeItem("blogauto_thumbnail");
      localStorage.removeItem("blogauto_deploy_images");
      try { const raw = localStorage.getItem(CONTENT_KEY); if (raw) { const c = JSON.parse(raw); delete c.thumbnail; localStorage.setItem(CONTENT_KEY, JSON.stringify(c)); } } catch {}
    } else if (type === "content") {
      setTitle("");
      setHashtags([]);
      setBlocks((prev) => {
        const imgBlocks = prev.filter((b) => b.type === "image" || b.type === "image-pair");
        return imgBlocks.length > 0 ? [...imgBlocks, { type: "text", id: uid(), content: "" }] : [{ type: "text", id: uid(), content: "" }];
      });
      localStorage.removeItem(CONTENT_KEY);
    } else if (type === "image") {
      setThumbnail("");
      setBlocks((prev) => prev.filter((b) => b.type === "text"));
      localStorage.removeItem("blogauto_thumbnail");
      localStorage.removeItem("blogauto_deploy_images");
      try { const raw = localStorage.getItem(CONTENT_KEY); if (raw) { const c = JSON.parse(raw); delete c.thumbnail; localStorage.setItem(CONTENT_KEY, JSON.stringify(c)); } } catch {}
    }
  }

  // ── 발행 핸들러 ──
  async function handlePublish() {
    if (selectedPlatforms.length === 0) { toast.error("발행할 플랫폼을 선택해주세요"); return; }
    if (!title.trim()) { toast.error("제목을 입력해주세요"); return; }
    if (publishMode === "scheduled" && !scheduleDate) { toast.error("예약 날짜를 선택해주세요"); return; }

    setIsPublishing(true);
    toast.loading("발행 중...", { id: "publish" });
    try {
      for (const platformId of selectedPlatforms) {
        const platform = platforms.find((p) => p.id === platformId);
        if (!platform) continue;
        if (platform.type === "naver") {
          // 네이버는 자동발행 불가 → 복사 방식으로 안내
          copyForNaver();
          toast.success("📋 네이버 블로그용 글이 복사됐어요! 네이버 블로그에서 붙여넣기하세요.", { duration: 5000 });
        } else if (platform.type === "tistory") {
          await publishToTistory(
            publishMode === "scheduled" ? `${scheduleDate}T${scheduleTime}:00` : null
          );
        } else if (platform.type === "wordpress") {
          await publishToWordPress(
            publishMode === "scheduled" ? `${scheduleDate}T${scheduleTime}:00` : null
          );
        } else {
          await publishToWebhook();
        }
      }
      // 서버에 발행 글 저장 (대시보드 실시간 연동)
      const token = localStorage.getItem("ba_token");
      if (token) {
        const postData = {
          id: Date.now().toString(),
          title,
          keyword: localStorage.getItem("blogauto_content") ? JSON.parse(localStorage.getItem("blogauto_content") || "{}").keyword || "" : "",
          platform: selectedPlatforms.map(id => platforms.find(p => p.id === id)?.name || "").filter(Boolean).join(", "),
          status: publishMode === "instant" ? "published" : "scheduled",
          views: 0,
          clicks: 0,
          hashtags,
          createdAt: new Date().toISOString(),
        };
        fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "savePost", post: postData }),
        }).catch(() => {});

        // 발행 카운트 증가
        const cnt = parseInt(localStorage.getItem("blogauto_publish_count") || "0");
        localStorage.setItem("blogauto_publish_count", String(cnt + 1));
      }

      toast.success(
        publishMode === "instant"
          ? "발행 완료! 대시보드에서 실시간 확인하세요"
          : `${scheduleDate} ${scheduleTime}에 예약됨`,
        { id: "publish" }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      toast.error(`발행 실패: ${msg}`, { id: "publish" });
    } finally {
      setIsPublishing(false);
    }
  }

  // ── 파생 값 ──
  const autoCount = blocks.filter((b) => b.type === "image" && b.source === "auto").length;
  const manualCount = blocks.filter((b) => b.type === "image" && b.source === "manual").length;

  const publishBtnBg =
    selectedPlatforms.length === 0
      ? "var(--muted)"
      : publishMode === "instant"
      ? "var(--color-emerald)"
      : "var(--color-amber-brand)";

  // ── 썸네일 파일 처리 ──
  function handleThumbnailFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnail(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── 수동 이미지 파일 처리 ──
  function handleManualFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setBlocks((prev) => [
        ...prev,
        { type: "image", id: uid(), src, alt: file.name, position: "center", source: "manual" },
      ]);
      toast.success("✅ 이미지 추가됨!");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ─────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────

  return (
    <>
      <Layout>
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 pb-44 sm:pb-6">

          {/* 헤더 */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h1
                className="text-lg sm:text-2xl font-bold text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                배포 관리
              </h1>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                이미지 삽입 · 글 편집 · 발행
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* 쿠팡파트너스 링크 버튼 */}
              {userGet("coupang_access_key") && (
                <Button size="sm" className="gap-1.5 h-9"
                  style={{ background: "#C00F0C", color: "white" }}
                  onClick={fetchCoupangLinks}
                  disabled={coupangLoading}>
                  {coupangLoading
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <ShoppingCart className="w-4 h-4" />}
                  <span className="hidden sm:inline">쿠팡 링크</span>
                  <span className="sm:hidden">쿠팡</span>
                </Button>
              )}
              {/* 초기화 버튼 그룹 */}
              <div className="flex items-center gap-1">
                <button
                  className="flex items-center gap-1 px-2.5 h-9 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                  onClick={() => { if (confirm("이미지를 초기화할까요?")) handleReset("image"); }}>
                  <Image className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">이미지초기화</span>
                </button>
                <button
                  className="flex items-center gap-1 px-2.5 h-9 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#d97706", border: "1px solid rgba(245,158,11,0.3)" }}
                  onClick={() => { if (confirm("글을 초기화할까요?")) handleReset("content"); }}>
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">글초기화</span>
                </button>
              </div>
              {/* 네이버 블로그 복사 버튼 */}
              <Button size="sm" className="gap-1.5 h-9"
                style={{ background: "#03C75A", color: "white" }}
                onClick={copyForNaver}>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">네이버 복사</span>
                <span className="sm:hidden">N복사</span>
              </Button>
              <Button size="sm" className="gap-1.5" style={{ background: "oklch(0.62 0.22 300)", color: "white" }} onClick={() => setShowPreview(true)}>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">구독자 미리보기</span>
                <span className="sm:hidden">미리보기</span>
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                style={{ background: "var(--color-emerald)", color: "white" }}
                disabled={isPublishing || selectedPlatforms.length === 0}
                onClick={handlePublish}
              >
                <Send className="w-4 h-4" />
                {isPublishing ? "발행 중..." : publishMode === "instant" ? "즉시 발행" : "예약 발행"}
              </Button>
            </div>
          </div>

          {/* 모바일: 발행 설정 접기/펼치기 */}
          <div className="lg:hidden">
            <button
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={() => setShowPublishPanel((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                <span className="text-sm font-semibold text-foreground">발행 설정</span>
                {selectedPlatforms.length > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "oklch(0.696 0.17 162.48/15%)",
                      color: "var(--color-emerald)",
                    }}
                  >
                    {selectedPlatforms.length}개 선택됨
                  </span>
                )}
              </div>
              {showPublishPanel ? (
                <ChevronUp className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              )}
            </button>

            {showPublishPanel && (
              <div
                className="mt-2 rounded-xl p-4 space-y-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <PublishPanel
                  platforms={platforms}
                  selectedPlatforms={selectedPlatforms}
                  setSelectedPlatforms={setSelectedPlatforms}
                  publishMode={publishMode}
                  setPublishMode={setPublishMode}
                  scheduleDate={scheduleDate}
                  setScheduleDate={setScheduleDate}
                  scheduleTime={scheduleTime}
                  setScheduleTime={setScheduleTime}
                  isPublishing={isPublishing}
                  onPublish={handlePublish}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                />
              </div>
            )}
          </div>

          {/* 메인 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

            {/* 왼쪽: 에디터 */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">

              {/* 제목 */}
              <div
                className="rounded-xl p-3 sm:p-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <label
                  className="text-xs font-semibold uppercase tracking-wider mb-2 block"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  글 제목
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요..."
                  className="text-sm sm:text-base font-semibold h-10 sm:h-11"
                />
              </div>

              {/* 썸네일 */}
              <div
                className="rounded-xl p-3 sm:p-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <Image className="w-3.5 h-3.5" />썸네일
                  </label>
                  {thumbnail && (
                    <button onClick={() => setThumbnail("")} style={{ color: "var(--muted-foreground)" }}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {thumbnail ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img
                      src={thumbnail}
                      alt="썸네일"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setThumbnail("");
                        toast.error("썸네일을 불러올 수 없습니다");
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deployImages.length > 0 && (
                      <div>
                        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                          생성된 이미지에서 선택:
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {deployImages.slice(0, 6).map((img, i) => (
                            <button
                              key={i}
                              className="shrink-0 rounded-lg overflow-hidden"
                              style={{ width: 56, height: 56, border: "1px solid var(--border)" }}
                              onClick={() => {
                                setThumbnail(img.src);
                                toast.success("썸네일 설정!");
                              }}
                            >
                              <img
                                src={img.src}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-4 transition-colors hover:bg-accent/10"
                      style={{ border: "2px dashed var(--border)", background: "var(--background)" }}
                      onClick={() => thumbnailRef.current?.click()}
                    >
                      <Upload className="w-5 h-5 opacity-30" style={{ color: "var(--muted-foreground)" }} />
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>이미지 업로드</p>
                    </button>
                  </div>
                )}

                <input
                  ref={thumbnailRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailFile}
                />
              </div>

              {/* 인사말 */}
              <div
                className="rounded-xl p-3 sm:p-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <label
                  className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />글쓴이 인사말
                </label>
                <Textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="안녕하세요! 오늘도 유용한 정보를 가지고 왔어요 😊"
                  className="text-sm min-h-14 resize-none"
                />
              </div>

              {/* 쿠팡 상품 미리보기 */}
              {coupangLinks.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "oklch(0.65 0.22 25/8%)", border: "2px solid #C00F0C40" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" style={{ color: "#C00F0C" }} />
                      <span className="text-sm font-semibold text-foreground">쿠팡 추천 상품 ({coupangLinks.length}개)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="text-xs gap-1.5 h-8"
                        style={{ background: "#C00F0C", color: "white" }}
                        onClick={insertCoupangLinks}>
                        <Plus className="w-3 h-3" /> 본문에 삽입
                      </Button>
                      <button className="w-7 h-7 flex items-center justify-center rounded"
                        style={{ color: "var(--muted-foreground)" }}
                        onClick={() => setCoupangLinks([])}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {coupangLinks.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg"
                        style={{ background: "var(--background)" }}>
                        <ShoppingCart className="w-3 h-3 shrink-0" style={{ color: "#C00F0C" }} />
                        <span className="flex-1 truncate text-foreground">{p.name}</span>
                        {p.price && <span style={{ color: "#C00F0C", fontWeight: 600 }}>{p.price}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 이미지 삽입 모드 */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="px-3 sm:px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Image className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                    <span className="text-sm font-semibold text-foreground">이미지 삽입</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* 자동 모드 */}
                    <button
                      className="rounded-xl p-2.5 sm:p-3 text-left transition-all"
                      style={{
                        background: imageMode === "auto" ? "oklch(0.696 0.17 162.48/15%)" : "var(--background)",
                        border: `2px solid ${imageMode === "auto" ? "oklch(0.696 0.17 162.48/60%)" : "var(--border)"}`,
                      }}
                      onClick={() => setImageMode("auto")}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wand2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-emerald)" }} />
                        <span className="text-xs sm:text-sm font-semibold text-foreground">자동</span>
                      </div>
                      <p className="text-xs hidden sm:block" style={{ color: "var(--muted-foreground)" }}>
                        AI 이미지 자동 배치
                      </p>
                      {autoCount > 0 && (
                        <span
                          className="text-xs mt-1 inline-block px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "oklch(0.696 0.17 162.48/15%)",
                            color: "var(--color-emerald)",
                          }}
                        >
                          {autoCount}개
                        </span>
                      )}
                    </button>

                    {/* 수동 모드 */}
                    <button
                      className="rounded-xl p-2.5 sm:p-3 text-left transition-all"
                      style={{
                        background: imageMode === "manual" ? "oklch(0.75 0.12 300/15%)" : "var(--background)",
                        border: `2px solid ${imageMode === "manual" ? "oklch(0.75 0.12 300/60%)" : "var(--border)"}`,
                      }}
                      onClick={() => setImageMode("manual")}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.75 0.12 300)" }} />
                        <span className="text-xs sm:text-sm font-semibold text-foreground">수동</span>
                      </div>
                      <p className="text-xs hidden sm:block" style={{ color: "var(--muted-foreground)" }}>
                        원하는 위치에 삽입
                      </p>
                      {manualCount > 0 && (
                        <span
                          className="text-xs mt-1 inline-block px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "oklch(0.75 0.12 300/15%)",
                            color: "oklch(0.75 0.12 300)",
                          }}
                        >
                          {manualCount}개
                        </span>
                      )}
                    </button>
                  </div>

                  {/* 자동 모드 액션 */}
                  {imageMode === "auto" && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <div
                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg flex-1"
                        style={{
                          background: "oklch(0.696 0.17 162.48/8%)",
                          color: "var(--muted-foreground)",
                          border: "1px solid oklch(0.696 0.17 162.48/20%)",
                        }}
                      >
                        <Info className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-emerald)" }} />
                        {deployImages.length > 0 ? `${deployImages.length}개 준비됨` : "이미지 생성 먼저"}
                      </div>
                      {autoInserted ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs shrink-0 border-red-400/50 text-red-400"
                          onClick={handleRemoveAutoImages}
                        >
                          <X className="w-3.5 h-3.5" /> 제거
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs shrink-0"
                          style={{ background: "var(--color-emerald)", color: "white" }}
                          onClick={handleAutoInsert}
                          disabled={deployImages.length === 0}
                        >
                          <Wand2 className="w-3.5 h-3.5" /> 자동 삽입
                        </Button>
                      )}
                    </div>
                  )}

                  {/* 수동 모드 액션 */}
                  {imageMode === "manual" && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
                        style={{
                          background: "oklch(0.75 0.12 300/12%)",
                          border: "1px solid oklch(0.75 0.12 300/30%)",
                          color: "oklch(0.75 0.12 300)",
                        }}
                        onClick={() => manualFileRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5" /> 파일 첨부
                      </button>
                      <div
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
                        style={{
                          background: "oklch(0.696 0.17 162.48/10%)",
                          border: "1px solid oklch(0.696 0.17 162.48/25%)",
                          color: "var(--color-emerald)",
                        }}
                      >
                        ⌨️ Ctrl+V
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={manualFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleManualFile}
                />

                {/* 본문 블록 에디터 헤더 */}
                <div
                  className="flex items-center justify-between px-3 sm:px-4 py-3 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                    <span className="text-sm font-semibold text-foreground">본문 편집</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                    >
                      {blocks.length}블록
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-7 px-2"
                      onClick={() => addTextBlock()}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">텍스트</span>
                    </Button>
                    {imageMode === "manual" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7 px-2"
                        style={{ borderColor: "oklch(0.75 0.12 300/50%)", color: "oklch(0.75 0.12 300)" }}
                        onClick={() => addManualImageBlock()}
                      >
                        <Image className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">이미지</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* 블록 목록 */}
                <div className="p-3 sm:p-4 space-y-3">
                  {blocks.map((block, idx) => (
                    <div key={block.id}>
                      {block.type === "text" ? (
                        <div className="relative group/block">
                          <Textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder="내용 입력..."
                            className="text-sm leading-relaxed resize-none min-h-20"
                            style={{ background: "var(--background)" }}
                            onInput={(e) => {
                              const el = e.target as HTMLTextAreaElement;
                              el.style.height = "auto";
                              el.style.height = el.scrollHeight + "px";
                            }}
                          />
                          <div className="flex items-center gap-1 mt-1 sm:mt-0 sm:absolute sm:right-2 sm:top-2 sm:opacity-0 sm:group-hover/block:opacity-100 transition-opacity">
                            {imageMode === "manual" && (
                              <button
                                onClick={() => addManualImageBlock(block.id)}
                                className="w-7 h-7 flex items-center justify-center rounded text-xs"
                                style={{
                                  background: "oklch(0.75 0.12 300/20%)",
                                  color: "oklch(0.75 0.12 300)",
                                }}
                                title="아래에 이미지 삽입"
                              >
                                <Image className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => addTextBlock(block.id)}
                              className="w-7 h-7 flex items-center justify-center rounded text-xs"
                              style={{
                                background: "oklch(0.696 0.17 162.48/20%)",
                                color: "var(--color-emerald)",
                              }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {blocks.length > 1 && (
                              <button
                                onClick={() => removeBlock(block.id)}
                                className="w-7 h-7 flex items-center justify-center rounded"
                                style={{
                                  background: "oklch(0.65 0.22 25/20%)",
                                  color: "oklch(0.65 0.22 25)",
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : block.type === "image-pair" ? (
                        <ImagePairBlock
                          block={block as ImagePairBlockType}
                          onRemove={() => removeBlock(block.id)}
                        />
                      ) : (
                        <ImageBlock
                          block={block as SingleImageBlock}
                          onRemove={() => removeBlock(block.id)}
                          onChange={(updates) => updateBlock(block.id, updates)}
                        />
                      )}

                      {idx < blocks.length - 1 && (
                        <div className="flex items-center justify-center my-1">
                          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                          <span
                            className="mx-2 text-xs opacity-30"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {idx + 2}
                          </span>
                          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 해시태그 */}
              <div
                className="rounded-xl p-3 sm:p-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                  <span className="text-sm font-semibold text-foreground">해시태그</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>5~8개 권장</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {hashtags.map((tag, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: "oklch(0.696 0.17 162.48/15%)",
                        color: "var(--color-emerald)",
                        border: "1px solid oklch(0.696 0.17 162.48/30%)",
                      }}
                    >
                      {tag}
                      <button onClick={() => setHashtags((prev) => prev.filter((_, j) => j !== i))}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="#해시태그 입력"
                    className="text-sm h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTag.trim()) {
                        if (hashtags.length >= 8) { toast.error("최대 8개"); return; }
                        setHashtags((prev) => [...prev, `#${newTag.replace("#", "").trim()}`]);
                        setNewTag("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 shrink-0"
                    onClick={() => {
                      if (!newTag.trim() || hashtags.length >= 8) return;
                      setHashtags((prev) => [...prev, `#${newTag.replace("#", "").trim()}`]);
                      setNewTag("");
                    }}
                  >
                    추가
                  </Button>
                </div>
              </div>
            </div>

            {/* 오른쪽: 발행 설정 (데스크탑) */}
            <div className="hidden lg:block space-y-4">
              <PublishPanel
                platforms={platforms}
                selectedPlatforms={selectedPlatforms}
                setSelectedPlatforms={setSelectedPlatforms}
                publishMode={publishMode}
                setPublishMode={setPublishMode}
                scheduleDate={scheduleDate}
                setScheduleDate={setScheduleDate}
                scheduleTime={scheduleTime}
                setScheduleTime={setScheduleTime}
                isPublishing={isPublishing}
                onPublish={handlePublish}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </div>
          </div>
        </div>
      </Layout>

      {/* 모바일 하단 고정 버튼 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* 네이버 복사 버튼 - 가장 크게 강조 */}
        <div className="px-3 pt-2">
          <button
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform"
            style={{ background: "#03C75A", color: "white" }}
            onClick={copyForNaver}
          >
            <Copy className="w-4 h-4" />
            네이버 블로그 복사하기 📋
          </button>
        </div>
        <div className="flex gap-2 px-3 py-2">
          <Button className="flex-1 gap-1.5 h-10" style={{ background: "oklch(0.62 0.22 300)", color: "white" }} onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4" /> 미리보기
          </Button>
          <Button
            className="flex-1 gap-1.5 h-10 font-semibold"
            style={{ background: publishBtnBg, color: "white" }}
            disabled={isPublishing || selectedPlatforms.length === 0}
            onClick={handlePublish}
          >
            {isPublishing ? (
              <><Send className="w-4 h-4 animate-pulse" />발행 중...</>
            ) : publishMode === "instant" ? (
              <><Zap className="w-4 h-4" />즉시 발행</>
            ) : (
              <><Calendar className="w-4 h-4" />예약</>
            )}
          </Button>
        </div>
        {selectedPlatforms.length === 0 && (
          <p className="text-xs text-center pb-1" style={{ color: "var(--muted-foreground)" }}>
            워드프레스/커스텀 발행은 설정에서 플랫폼 등록 필요
          </p>
        )}
      </div>

      {/* 구독자 미리보기 풀스크린 모달 */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }}>
          {/* 모달 헤더 */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: "var(--border)", background: "var(--card)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-emerald)" }} />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">구독자 시점 미리보기</span>
                <button className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                  style={{ background: "#03C75A", color: "white" }}
                  onClick={copyForNaver}>
                  <Copy className="w-3 h-3" /> 네이버 복사
                </button>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full hidden sm:inline"
                style={{
                  background: "oklch(0.696 0.17 162.48/10%)",
                  color: "var(--color-emerald)",
                }}
              >
                실제 발행 모습
              </span>
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/20"
              style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShowPreview(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 미리보기 본문 */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">

              {thumbnail && (
                <div className="rounded-xl overflow-hidden mb-5" style={{ aspectRatio: "16/9" }}>
                  <img src={thumbnail} alt="썸네일" className="w-full h-full object-cover" />
                </div>
              )}

              {title && (
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4 leading-tight">
                  {title}
                </h1>
              )}

              {/* 제목 아래 목차 표시 */}
              {(() => {
                const allText = blocks.filter(b => b.type === "text").map(b => (b as TextBlock).content).join("\n");
                const h2s = [...allText.matchAll(/^## (.+)$/gm)].map(m => m[1].trim());
                if (h2s.length < 1) return null;
                return (
                  <div className="rounded-xl p-5 mb-5" style={{ background: "#f0f4ff", border: "1px solid #c7d7fe" }}>
                    <div className="font-bold text-sm mb-3" style={{ color: "#2563eb" }}>📋 목차</div>
                    <ol className="space-y-1.5" style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {h2s.map((t, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 22, height: 22, borderRadius: "50%",
                            background: "#2563eb", color: "white",
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}>{i + 1}</span>
                          <span style={{ color: "#2563eb", fontSize: 14, fontWeight: 500 }}>{t}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })()}

              {greeting && (
                <div
                  className="rounded-xl p-4 mb-5 text-sm leading-relaxed"
                  style={{
                    background: "oklch(0.696 0.17 162.48/8%)",
                    border: "1px solid oklch(0.696 0.17 162.48/20%)",
                    color: "var(--foreground)",
                  }}
                >
                  {greeting}
                </div>
              )}

              <div className="space-y-4">
                {blocks.map((block) => {
                  if (block.type === "text") {
                    return (
                      <div key={block.id} className="text-sm leading-relaxed">
                        {renderPreview(block.content)}
                      </div>
                    );
                  }
                  if (block.type === "image-pair") {
                    return (
                      <div key={block.id} className="grid grid-cols-2 gap-2">
                        {block.images.map((img, i) => (
                          <img
                            key={i}
                            src={img.src}
                            alt={img.alt}
                            className="w-full rounded-xl object-cover"
                            style={{ aspectRatio: "1" }}
                          />
                        ))}
                      </div>
                    );
                  }
                  return block.src ? (
                    <div key={block.id}>
                      <img
                        src={block.src}
                        alt={block.alt}
                        className="w-full rounded-xl object-cover"
                      />
                    </div>
                  ) : null;
                })}
              </div>

              {hashtags.length > 0 && (
                <div
                  className="flex flex-wrap gap-2 mt-6 pt-5"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-sm px-3 py-1 rounded-full"
                      style={{
                        background: "oklch(0.696 0.17 162.48/10%)",
                        color: "var(--color-emerald)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {!title && !thumbnail && blocks.every((b) => b.type === "text" && !b.content) && (
                <div className="text-center py-12">
                  <Eye
                    className="w-10 h-10 opacity-20 mx-auto mb-3"
                    style={{ color: "var(--muted-foreground)" }}
                  />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    아직 작성된 내용이 없어요.
                    <br />
                    제목과 본문을 입력하면 여기에 표시됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
//fix

