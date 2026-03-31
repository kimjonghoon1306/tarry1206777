/**
 * BlogAuto Pro - Deployment Page
 * 글 편집 + 이미지 삽입 + 즉시/예약 발행
 */

import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Send, Calendar, Clock, Image, Plus, X, ChevronDown,
  CheckCircle2, Globe, FileText, Zap, Save, Eye,
  Hash, MessageSquare, Upload, Trash2, AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// ── 타입 ──────────────────────────────────────────────
type ContentBlock =
  | { type: "text"; id: string; content: string }
  | { type: "image"; id: string; src: string; alt: string; position: "left" | "center" | "right" };

type Platform = { id: string; type: "naver" | "wordpress" | "custom"; name: string };

const CONTENT_KEY = "blogauto_content";
const DEPLOY_PLATFORMS_KEY = "blogauto_deploy_platforms";


function uid() { return Math.random().toString(36).slice(2); }

function renderPreview(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-3 mb-2 text-foreground leading-tight">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">{line.slice(4)}</h3>;
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="text-sm mt-1 mb-2 font-semibold" style={{ color: "var(--muted-foreground)" }}>{line.replace(/\*\*/g, "")}</p>;
    }
    if (line === "---") return <hr key={i} className="my-4" style={{ borderColor: "var(--border)" }} />;
    if (line === "") return <br key={i} />;
    return <p key={i} className="mb-2 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{line}</p>;
  });
}


// ── 이미지 삽입 블록 ──────────────────────────────────
function ImageBlock({ block, onRemove, onChange }: {
  block: Extract<ContentBlock, { type: "image" }>;
  onRemove: () => void;
  onChange: (updates: Partial<typeof block>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative rounded-xl overflow-hidden group" style={{ border: "2px solid oklch(0.75 0.12 300/50%)", background: "oklch(0.75 0.12 300/5%)" }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "oklch(0.75 0.12 300/30%)" }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.75 0.12 300)" }}>
          <Image className="w-3.5 h-3.5" /> 이미지 블록
        </div>
        <div className="flex items-center gap-2">
          <select className="text-xs rounded px-2 py-0.5" style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            value={block.position} onChange={e => onChange({ position: e.target.value as "left" | "center" | "right" })}>
            <option value="left">왼쪽</option>
            <option value="center">가운데</option>
            <option value="right">오른쪽</option>
          </select>
          <button onClick={onRemove} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20" style={{ color: "var(--muted-foreground)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {block.src ? (
        <div className={`p-3 flex ${block.position === "center" ? "justify-center" : block.position === "right" ? "justify-end" : "justify-start"}`}>
          <div className="relative group/img">
            <img src={block.src} alt={block.alt} className="max-h-48 rounded-lg object-cover" />
            <button onClick={() => onChange({ src: "" })}
              className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.7)" }}>
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <button className="w-full p-6 flex flex-col items-center gap-2 hover:bg-accent/10 transition-colors"
          onClick={() => fileRef.current?.click()}>
          <Upload className="w-6 h-6 opacity-40" style={{ color: "var(--muted-foreground)" }} />
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>클릭하여 이미지 업로드</span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>JPG, PNG, GIF 지원</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => onChange({ src: ev.target?.result as string, alt: file.name });
          reader.readAsDataURL(file);
        }} />
      <div className="px-3 pb-2">
        <Input placeholder="이미지 설명 (alt 텍스트)" value={block.alt} onChange={e => onChange({ alt: e.target.value })}
          className="text-xs h-7" style={{ fontSize: "11px" }} />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export default function DeploymentPage() {
  // 저장된 글 불러오기
  const saved = (() => { try { return JSON.parse(localStorage.getItem(CONTENT_KEY) || "{}"); } catch { return {}; } })();

  const [title, setTitle] = useState(saved?.title || "");
  const [greeting, setGreeting] = useState(() => localStorage.getItem("blogauto_greeting") || "");
  const [hashtags, setHashtags] = useState<string[]>(saved?.hashtags || []);
  const [newTag, setNewTag] = useState("");
  const [thumbnail, setThumbnail] = useState(saved?.thumbnail || "");
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    // 저장된 글을 텍스트 블록으로 변환
    const content = saved?.content || "";
    if (!content) return [{ type: "text", id: uid(), content: "" }];
    const paragraphs = content.split("\n\n").filter(Boolean);
    return paragraphs.map(p => ({ type: "text" as const, id: uid(), content: p }));
  });

  // 플랫폼 설정 불러오기
  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    const stored = localStorage.getItem(DEPLOY_PLATFORMS_KEY);
    if (stored) return JSON.parse(stored);
    const defaults: Platform[] = [];
    if (localStorage.getItem("naver_blog_id")) defaults.push({ id: uid(), type: "naver", name: "네이버 블로그" });
    if (localStorage.getItem("wp_url")) defaults.push({ id: uid(), type: "wordpress", name: "WordPress" });
    if (localStorage.getItem("webhook_url")) defaults.push({ id: uid(), type: "custom", name: "커스텀 사이트" });
    return defaults;
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishMode, setPublishMode] = useState<"instant" | "scheduled">("instant");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const thumbnailRef = useRef<HTMLInputElement>(null);

  // 블록 조작 함수들
  const addTextBlock = (afterId?: string) => {
    const newBlock: ContentBlock = { type: "text", id: uid(), content: "" };
    if (!afterId) { setBlocks(prev => [...prev, newBlock]); return; }
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newBlock);
      return next;
    });
  };

  const addImageBlock = (afterId?: string) => {
    const newBlock: ContentBlock = { type: "image", id: uid(), src: "", alt: "", position: "center" };
    if (!afterId) { setBlocks(prev => [...prev, newBlock]); return; }
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newBlock);
      return next;
    });
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } as ContentBlock : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  // 최종 내용 구성
  const buildFinalContent = () => {
    const parts: string[] = [];
    if (greeting.trim()) parts.push(`[인사말]\n${greeting}\n`);
    blocks.forEach(b => {
      if (b.type === "text") parts.push(b.content);
      else parts.push(`[이미지: ${b.alt || "이미지"} - 정렬: ${b.position}]`);
    });
    if (hashtags.length > 0) parts.push("\n" + hashtags.join(" "));
    return parts.join("\n\n");
  };

  // 발행 처리
  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) { toast.error("발행할 플랫폼을 선택해주세요"); return; }
    if (!title.trim()) { toast.error("제목을 입력해주세요"); return; }
    if (publishMode === "scheduled" && !scheduleDate) { toast.error("예약 날짜를 선택해주세요"); return; }

    setIsPublishing(true);
    const mode = publishMode === "instant" ? "즉시 발행" : `${scheduleDate} ${scheduleTime} 예약`;
    toast.loading(`${mode} 중...`, { id: "publish" });

    try {
      for (const platformId of selectedPlatforms) {
        const platform = platforms.find(p => p.id === platformId);
        if (!platform) continue;

        if (platform.type === "naver") {
          await publishToNaver();
        } else if (platform.type === "wordpress") {
          await publishToWordPress(publishMode === "scheduled" ? `${scheduleDate}T${scheduleTime}:00` : null);
        } else {
          await publishToWebhook();
        }
      }
      toast.success(publishMode === "instant" ? "발행 완료! 🎉" : `${scheduleDate} ${scheduleTime}에 예약되었습니다 📅`, { id: "publish" });
    } catch (e: any) {
      toast.error(`발행 실패: ${e.message}`, { id: "publish" });
    } finally {
      setIsPublishing(false);
    }
  };

  const publishToNaver = async () => {
    const blogId = localStorage.getItem("naver_blog_id");
    const token = localStorage.getItem("naver_blog_access_token");
    if (!blogId || !token) throw new Error("네이버 블로그 설정이 없습니다. 설정 페이지를 확인해주세요.");
    // Naver 블로그 API 호출 (실제 연동 시 서버측 처리 필요)
    toast.info("네이버 블로그 발행은 Naver OAuth 연동 후 사용 가능합니다.");
  };

  const publishToWordPress = async (scheduledAt: string | null) => {
    const wpUrl = localStorage.getItem("wp_url");
    const wpUser = localStorage.getItem("wp_username");
    const wpPass = localStorage.getItem("wp_app_password");
    if (!wpUrl || !wpUser || !wpPass) throw new Error("WordPress 설정이 없습니다. 설정 페이지를 확인해주세요.");

    const content = buildFinalContent();
    const postData: any = {
      title, content,
      status: scheduledAt ? "future" : "publish",
      tags: hashtags.map(t => t.replace("#", "")),
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
    if (!resp.ok) { const e = await resp.json(); throw new Error(e.message || "WordPress 발행 실패"); }
  };

  const publishToWebhook = async () => {
    const url = localStorage.getItem("webhook_url");
    const key = localStorage.getItem("webhook_auth_key");
    if (!url) throw new Error("Webhook URL이 없습니다. 설정 페이지를 확인해주세요.");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (key) headers["Authorization"] = key;
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ title, content: buildFinalContent(), hashtags, scheduledAt: publishMode === "scheduled" ? `${scheduleDate}T${scheduleTime}:00` : null }),
    });
    if (!resp.ok) throw new Error("Webhook 전송 실패");
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>배포 관리</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>글 편집 · 이미지 삽입 · 발행 설정</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreviewMode(v => !v)}>
              <Eye className="w-4 h-4" />{previewMode ? "편집 모드" : "미리보기"}
            </Button>
            <Button size="sm" className="gap-1.5"
              style={{ background: "var(--color-emerald)", color: "white" }}
              disabled={isPublishing || selectedPlatforms.length === 0}
              onClick={handlePublish}>
              <Send className="w-4 h-4" />
              {isPublishing ? "발행 중..." : publishMode === "instant" ? "즉시 발행" : "예약 발행"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 왼쪽: 에디터 / 미리보기 */}
          <div className="lg:col-span-2 space-y-4">
            {previewMode ? (
              <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <div className="text-sm font-semibold text-foreground">구독자 미리보기</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>실제 발행 전 보이는 흐름을 확인할 수 있어요</div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreviewMode(false)}>
                    <AlignLeft className="w-4 h-4" /> 편집으로 돌아가기
                  </Button>
                </div>

                <div className="p-4 sm:p-6">
                  {thumbnail && (
                    <div className="relative rounded-xl overflow-hidden mb-5" style={{ aspectRatio: "16/9" }}>
                      <img src={thumbnail} alt="썸네일" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 leading-tight">
                      {title}
                    </h1>
                  )}

                  {greeting && (
                    <div
                      className="rounded-xl p-4 mb-5 text-sm leading-relaxed"
                      style={{ background: "oklch(0.696 0.17 162.48/8%)", border: "1px solid oklch(0.696 0.17 162.48/20%)", color: "var(--foreground)" }}
                    >
                      {greeting}
                    </div>
                  )}

                  <div className="space-y-4">
                    {blocks.map((block) => (
                      <div key={block.id}>
                        {block.type === "text" ? (
                          <div>{renderPreview(block.content)}</div>
                        ) : (
                          <div className={`flex ${block.position === "center" ? "justify-center" : block.position === "right" ? "justify-end" : "justify-start"}`}>
                            {block.src ? (
                              <img src={block.src} alt={block.alt} className="max-w-full rounded-xl object-cover" style={{ maxHeight: 360 }} />
                            ) : (
                              <div className="px-4 py-8 rounded-xl text-sm" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                                이미지 없음
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {hashtags.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {hashtags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full px-3 py-1 text-xs font-medium"
                          style={{ background: "oklch(0.696 0.17 162.48/12%)", color: "var(--color-emerald)", border: "1px solid oklch(0.696 0.17 162.48/25%)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
            <>
            {/* 제목 */}
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>글 제목</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요..."
                className="text-base font-semibold h-11" />
            </div>

            {/* 썸네일 */}
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                  <Image className="w-3.5 h-3.5 inline mr-1" />썸네일
                </label>
                {thumbnail && (
                  <button onClick={() => setThumbnail("")} className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {thumbnail ? (
                <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={thumbnail} alt="썸네일" className="w-full h-full object-cover" />
                </div>
              ) : (
                <button className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-6 transition-colors hover:bg-accent/10"
                  style={{ border: "2px dashed var(--border)", background: "var(--background)" }}
                  onClick={() => thumbnailRef.current?.click()}>
                  <Upload className="w-6 h-6 opacity-30" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>썸네일 이미지 업로드</p>
                </button>
              )}
              <input ref={thumbnailRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => setThumbnail(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }} />
            </div>

            {/* 인사말 */}
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                <MessageSquare className="w-3.5 h-3.5 inline mr-1" />글쓴이 인사말 (썸네일 바로 아래)
              </label>
              <Textarea value={greeting} onChange={e => setGreeting(e.target.value)}
                placeholder="안녕하세요! 오늘도 유용한 정보를 가지고 왔어요 😊"
                className="text-sm min-h-16 resize-none" />
            </div>

            {/* 본문 블록 에디터 */}
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                  <span className="text-sm font-semibold text-foreground">본문 편집</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                    블록 {blocks.length}개
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => addTextBlock()}>
                    <AlignLeft className="w-3.5 h-3.5" /> 텍스트
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => addImageBlock()}>
                    <Image className="w-3.5 h-3.5" /> 이미지
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="group/block">
                    {block.type === "text" ? (
                      <div className="relative">
                        <Textarea
                          value={block.content}
                          onChange={e => updateBlock(block.id, { content: e.target.value })}
                          placeholder="내용을 입력하세요... (마크다운 지원: # 제목, ## 소제목, **굵게**)"
                          className="text-sm leading-relaxed resize-none min-h-24"
                          style={{ background: "var(--background)" }}
                          onInput={e => {
                            const el = e.target as HTMLTextAreaElement;
                            el.style.height = "auto";
                            el.style.height = el.scrollHeight + "px";
                          }}
                        />
                        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
                          <button onClick={() => addImageBlock(block.id)}
                            className="w-6 h-6 flex items-center justify-center rounded text-xs"
                            style={{ background: "oklch(0.75 0.12 300/20%)", color: "oklch(0.75 0.12 300)" }}
                            title="아래에 이미지 추가">
                            <Image className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => addTextBlock(block.id)}
                            className="w-6 h-6 flex items-center justify-center rounded text-xs"
                            style={{ background: "oklch(0.696 0.17 162.48/20%)", color: "var(--color-emerald)" }}
                            title="아래에 텍스트 추가">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          {blocks.length > 1 && (
                            <button onClick={() => removeBlock(block.id)}
                              className="w-6 h-6 flex items-center justify-center rounded"
                              style={{ background: "oklch(0.65 0.22 25/20%)", color: "oklch(0.65 0.22 25)" }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <ImageBlock
                        block={block as Extract<ContentBlock, { type: "image" }>}
                        onRemove={() => removeBlock(block.id)}
                        onChange={updates => updateBlock(block.id, updates)}
                      />
                    )}
                    {/* 블록 사이 구분선 */}
                    {idx < blocks.length - 1 && (
                      <div className="flex items-center justify-center my-1">
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                        <span className="mx-2 text-xs opacity-30" style={{ color: "var(--muted-foreground)" }}>블록 {idx + 2}</span>
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 해시태그 */}
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                <span className="text-sm font-semibold text-foreground">해시태그</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>네이버 블로그 최적화 (5~8개 권장)</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {hashtags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
                    {tag}
                    <button onClick={() => setHashtags(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newTag} onChange={e => setNewTag(e.target.value)}
                  placeholder="#해시태그 입력 후 Enter"
                  className="text-sm h-9"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newTag.trim()) {
                      if (hashtags.length >= 8) { toast.error("최대 8개까지 추가 가능해요"); return; }
                      setHashtags(prev => [...prev, `#${newTag.replace("#", "").trim()}`]);
                      setNewTag("");
                    }
                  }} />
                <Button size="sm" variant="outline" className="h-9 shrink-0"
                  onClick={() => {
                    if (!newTag.trim()) return;
                    if (hashtags.length >= 8) { toast.error("최대 8개까지 추가 가능해요"); return; }
                    setHashtags(prev => [...prev, `#${newTag.replace("#", "").trim()}`]);
                    setNewTag("");
                  }}>추가</Button>
              </div>
            </div>
          </div>

            </>
            )}
          </div>

          {/* 오른쪽: 발행 설정 */}
          <div className="space-y-4">
            {/* 발행 플랫폼 선택 */}
            <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                  <span className="text-sm font-semibold text-foreground">발행 플랫폼</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {platforms.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>설정 페이지에서 플랫폼을 먼저 등록해주세요</p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs gap-1" onClick={() => window.location.href = "/settings"}>
                      설정 이동
                    </Button>
                  </div>
                ) : (
                  platforms.map(platform => (
                    <button key={platform.id}
                      className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                      style={{
                        background: selectedPlatforms.includes(platform.id) ? "oklch(0.696 0.17 162.48/10%)" : "var(--background)",
                        border: `1px solid ${selectedPlatforms.includes(platform.id) ? "oklch(0.696 0.17 162.48/50%)" : "var(--border)"}`,
                      }}
                      onClick={() => setSelectedPlatforms(prev =>
                        prev.includes(platform.id) ? prev.filter(id => id !== platform.id) : [...prev, platform.id]
                      )}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                          style={{ background: platform.type === "naver" ? "#03C75A" : platform.type === "wordpress" ? "#21759B" : "oklch(0.6 0.15 220)" }}>
                          {platform.type === "naver" ? "N" : platform.type === "wordpress" ? "W" : "C"}
                        </div>
                        <span className="text-sm text-foreground">{platform.name}</span>
                      </div>
                      {selectedPlatforms.includes(platform.id) && (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 발행 모드 */}
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
                  onClick={() => setPublishMode("instant")}>
                  <Zap className="w-5 h-5 mx-auto mb-1" style={{ color: publishMode === "instant" ? "var(--color-emerald)" : "var(--muted-foreground)" }} />
                  <div className="text-sm font-semibold text-foreground">즉시 발행</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>지금 바로 발행</div>
                </button>
                <button
                  className="rounded-xl p-3 text-center transition-all"
                  style={{
                    background: publishMode === "scheduled" ? "oklch(0.769 0.188 70.08/15%)" : "var(--background)",
                    border: `2px solid ${publishMode === "scheduled" ? "oklch(0.769 0.188 70.08/60%)" : "var(--border)"}`,
                  }}
                  onClick={() => setPublishMode("scheduled")}>
                  <Calendar className="w-5 h-5 mx-auto mb-1" style={{ color: publishMode === "scheduled" ? "var(--color-amber-brand)" : "var(--muted-foreground)" }} />
                  <div className="text-sm font-semibold text-foreground">예약 발행</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>시간 지정</div>
                </button>
              </div>

              {publishMode === "scheduled" && (
                <div className="space-y-3 p-3 rounded-xl" style={{ background: "oklch(0.769 0.188 70.08/8%)", border: "1px solid oklch(0.769 0.188 70.08/20%)" }}>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted-foreground)" }}>발행 날짜</label>
                    <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)} className="text-sm h-9" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--muted-foreground)" }}>발행 시간</label>
                    <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="text-sm h-9" />
                  </div>
                  {scheduleDate && (
                    <div className="text-xs text-center font-medium py-1 rounded" style={{ background: "oklch(0.769 0.188 70.08/15%)", color: "var(--color-amber-brand)" }}>
                      📅 {scheduleDate} {scheduleTime} 발행 예정
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 발행 버튼 */}
            <Button
              className="w-full h-12 text-base font-semibold gap-2"
              style={{
                background: selectedPlatforms.length === 0 ? "var(--muted)" : publishMode === "instant" ? "var(--color-emerald)" : "var(--color-amber-brand)",
                color: "white"
              }}
              disabled={isPublishing || selectedPlatforms.length === 0}
              onClick={handlePublish}>
              {isPublishing ? (
                <><Send className="w-4 h-4 animate-pulse" />발행 중...</>
              ) : publishMode === "instant" ? (
                <><Zap className="w-4 h-4" />즉시 발행하기</>
              ) : (
                <><Calendar className="w-4 h-4" />예약 발행 등록</>
              )}
            </Button>

            {selectedPlatforms.length === 0 && (
              <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                위에서 플랫폼을 선택해주세요
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
