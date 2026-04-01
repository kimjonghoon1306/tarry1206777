/**
 * BlogAuto Pro - Content Generator Page
 * 글 작성, 인사말, 해시태그, 이미지 연동, 썸네일 선택, 미리보기
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  FileText, Zap, RefreshCw, Copy, Send, Globe,
  Clock, CheckCircle2, Edit3, Eye, Languages, Bot,
  Sparkles, Image, Hash, MessageSquare, Trash2, X, Upload, Clipboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getContentProvider, getAPIKey, CONTENT_AI_OPTIONS } from "@/lib/ai-config";
import { generateContent } from "@/lib/ai-client";
import { useLocation } from "wouter";

const CONTENT_KEY = "blogauto_content";
const GREETING_KEY = "blogauto_greeting";

function loadSaved() {
  try {
    const raw = localStorage.getItem(CONTENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function ContentGenerator() {
  const [, navigate] = useLocation();

  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const prefilledKeyword = params.get("keyword") || "";
  const prefilledTitle = params.get("title") || "";

  // 저장된 내용 불러오기 (페이지 이탈해도 유지)
  const saved = loadSaved();

  const [keyword, setKeyword] = useState(prefilledKeyword || saved?.keyword || "");
  const [title, setTitle] = useState(prefilledTitle || saved?.title || "");
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem("content_language") || "ko");
  const [minChars, setMinChars] = useState(saved?.minChars || "1500");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState(saved?.content || "");
  const [charCount, setCharCount] = useState(saved?.content?.length || 0);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "blog-preview">("edit");
  const [hashtags, setHashtags] = useState<string[]>(saved?.hashtags || []);
  const [greeting, setGreeting] = useState(() => localStorage.getItem(GREETING_KEY) || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(() => {
    try {
      const stored = localStorage.getItem("blogauto_thumbnail");
      if (stored === "__b64__") return sessionStorage.getItem("blogauto_thumbnail_b64") || "";
      return stored || "";
    } catch { return ""; }
  });
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [savedImages, setSavedImages] = useState<string[]>([]);
  const [showFloatingPreview, setShowFloatingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지를 base64로 변환
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 파일 선택으로 이미지 업로드
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하만 가능합니다");
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setThumbnailUrl(base64);
      // 저장된 이미지 목록에도 추가
      try {
        const existing = JSON.parse(localStorage.getItem("blogauto_generated_images") || "[]");
        const updated = [base64, ...existing].slice(0, 20);
        localStorage.setItem("blogauto_generated_images", JSON.stringify(updated));
        setSavedImages(updated);
      } catch {}
      toast.success("이미지가 썸네일로 설정되었습니다!");
    } catch {
      toast.error("이미지 로드에 실패했습니다");
    }
  }, []);

  // Ctrl+V 클립보드 붙여넣기 이벤트 리스너
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            toast.loading("클립보드 이미지 불러오는 중...", { id: "paste-img" });
            await handleFileUpload(file);
            toast.dismiss("paste-img");
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFileUpload]);

  const currentAI = CONTENT_AI_OPTIONS.find(o => o.value === getContentProvider());
  useEffect(() => {
    if (generatedContent || keyword) {
      try {
        localStorage.setItem(CONTENT_KEY, JSON.stringify({
          keyword, title, content: generatedContent, minChars, hashtags,
        }));
      } catch {}
    }
  }, [generatedContent, keyword, title, hashtags, thumbnailUrl]);

  // 썸네일 별도 저장 (base64 분리해서 quota 초과 방지)
  useEffect(() => {
    try {
      if (thumbnailUrl && !thumbnailUrl.startsWith("data:")) {
        localStorage.setItem("blogauto_thumbnail", thumbnailUrl);
      } else if (thumbnailUrl && thumbnailUrl.startsWith("data:")) {
        // base64는 sessionStorage에 (탭 유지동안만)
        sessionStorage.setItem("blogauto_thumbnail_b64", thumbnailUrl);
        localStorage.setItem("blogauto_thumbnail", "__b64__");
      } else {
        localStorage.removeItem("blogauto_thumbnail");
        sessionStorage.removeItem("blogauto_thumbnail_b64");
      }
    } catch {}
  }, [thumbnailUrl]);


  // 인사말 저장
  useEffect(() => {
    try { localStorage.setItem(GREETING_KEY, greeting); } catch {}
  }, [greeting]);

  // 언어 변경시 저장
  useEffect(() => {
    try { localStorage.setItem("content_language", selectedLang); } catch {}
  }, [selectedLang]);


  // 저장된 이미지 불러오기
  useEffect(() => {
    try {
      const imgs = JSON.parse(localStorage.getItem("blogauto_generated_images") || "[]");
      // 빈 src나 깨진 이미지 필터링
      setSavedImages(imgs.filter((src: string) => src && src.length > 10));
    } catch {}
  }, [showImagePicker]);

  const handleClear = () => {
    setGeneratedContent("");
    setCharCount(0);
    setHashtags([]);
    setThumbnailUrl("");
    setKeyword("");
    setTitle("");
    localStorage.removeItem(CONTENT_KEY);
    toast.success("초기화되었습니다");
  };

  const handleGenerate = async () => {
    const provider = getContentProvider();
    const apiKey = getAPIKey(provider);
    if (!apiKey) {
      toast.error(`설정 페이지에서 ${currentAI?.label} API 키를 먼저 입력해주세요`);
      return;
    }
    if (!keyword.trim()) { toast.error("키워드를 입력해주세요"); return; }

    setIsGenerating(true);
    setProgress(0);
    toast.loading(`${currentAI?.label}이 콘텐츠를 생성 중...`, { id: "generate" });

    const interval = setInterval(() => {
      setProgress(prev => prev >= 90 ? 90 : prev + Math.random() * 10);
    }, 600);

    try {
      const content = await generateContent(
        provider, apiKey, keyword,
        title.trim() || undefined,
        selectedLang,
        parseInt(minChars)
      );
      clearInterval(interval);

      // 해시태그 자동 생성
      const tags = generateHashtags(keyword, title, content);
      setHashtags(tags);
      setGeneratedContent(content);
      setCharCount(content.length);
      setProgress(100);
      setActiveTab("preview");
      toast.success(`생성 완료! 총 ${content.length.toLocaleString()}자`, { id: "generate" });
    } catch (e: any) {
      clearInterval(interval);
      toast.error(`생성 실패: ${e.message}`, { id: "generate" });
    } finally {
      setIsGenerating(false);
    }
  };

  // 해시태그 자동 생성 (키워드 기반)
  function generateHashtags(kw: string, ttl: string, content: string): string[] {
    const base = [kw, ttl].filter(Boolean).join(" ");
    const words = base.split(/[\s,]+/).filter(w => w.length >= 2).slice(0, 4);
    const extra = ["블로그", "정보", "추천", "꿀팁", "리뷰", "2026"];
    const all = [...new Set([...words, ...extra])];
    return all.slice(0, 7).map(w => `#${w}`);
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(buildFinalContent());
    toast.success("클립보드에 복사되었습니다");
  };

  // 최종 발행 내용 구성 (썸네일 + 인사말 + 본문 + 해시태그)
  function buildFinalContent() {
    const parts: string[] = [];
    if (greeting.trim()) parts.push(greeting.trim() + "\n\n---\n");
    parts.push(generatedContent);
    if (hashtags.length > 0) parts.push("\n\n" + hashtags.join(" "));
    return parts.join("\n");
  }

  // 블로그 미리보기 렌더링
  function renderPreview(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-2 mb-3 text-foreground">{line.slice(2)}</h1>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(3)}</h2>;
      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-3 mb-1 text-foreground">{line.slice(4)}</h3>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-xs mt-1 mb-2 font-semibold" style={{ color: "var(--muted-foreground)" }}>{line.replace(/\*\*/g, "")}</p>;
      if (line === "---") return <hr key={i} className="my-4" style={{ borderColor: "var(--border)" }} />;
      if (line === "") return <br key={i} />;
      return <p key={i} className="mb-2 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{line}</p>;
    });
  }

  return (
    <>
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>콘텐츠 생성</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>AI가 {minChars}자 이상의 SEO 최적화 글을 자동 작성합니다</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {generatedContent && (
              <>
                {/* 이미지 생성으로 이동 버튼 */}
                <Button size="sm" className="gap-1.5"
                  style={{ background: "oklch(0.75 0.12 300)", color: "white" }}
                  onClick={() => {
                    const autoPrompt = title
                      ? `${title}, ${keyword}, 블로그 썸네일, 고품질 사진`
                      : `${keyword}, 블로그 썸네일, 고품질 사진`;
                    navigate(`/images?prompt=${encodeURIComponent(autoPrompt)}&keyword=${encodeURIComponent(keyword)}`);
                  }}>
                  <Image className="w-4 h-4" /> 이미지 생성
                </Button>
                {/* 블로그 미리보기 */}
                <Button size="sm" variant="outline" className="gap-1.5"
                  onClick={() => setActiveTab("blog-preview")}>
                  <Eye className="w-4 h-4" /> 블로그 미리보기
                </Button>
                {/* 초기화 */}
                <Button size="sm" variant="outline" className="gap-1.5"
                  style={{ color: "oklch(0.65 0.22 25)", borderColor: "oklch(0.65 0.22 25/40%)" }}
                  onClick={handleClear}>
                  <Trash2 className="w-4 h-4" /> 초기화
                </Button>
                {/* 구독자 미리보기 - 헤더 버튼 (모바일 접근성) */}
                <Button size="sm" className="gap-1.5 sm:hidden"
                  style={{ background: "var(--color-emerald)", color: "white" }}
                  onClick={() => setShowFloatingPreview(true)}>
                  <Eye className="w-4 h-4" /> 미리보기
                </Button>
              </>
            )}
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
              style={{ background: "oklch(0.696 0.17 162.48 / 10%)", color: "var(--color-emerald)" }}>
              <Bot className="w-4 h-4" /> AI 엔진 활성
            </div>
          </div>
        </div>

        {/* 생성 설정 */}
        <div className="rounded-xl p-4 sm:p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>키워드 / 주제</label>
              <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="키워드를 입력하세요..." className="text-sm h-10" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>출력 언어</label>
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                  <SelectItem value="zh">🇨🇳 中文</SelectItem>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="pt">🇧🇷 Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>최소 글자수</label>
              <Select value={minChars} onValueChange={setMinChars}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1500">1,500자 이상</SelectItem>
                  <SelectItem value="2000">2,000자 이상</SelectItem>
                  <SelectItem value="3000">3,000자 이상</SelectItem>
                  <SelectItem value="5000">5,000자 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 글 제목 */}
          <div className="mt-3">
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
              글 제목 (선택 · 비우면 AI가 자동 생성)
            </label>
            <Input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="제목을 직접 입력하거나 키워드 수집에서 선택하세요..."
              className="text-sm h-10"
              style={{ borderColor: title ? "oklch(0.696 0.17 162.48/60%)" : undefined, background: title ? "oklch(0.696 0.17 162.48/5%)" : undefined }} />
            {title && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--color-emerald)" }}><CheckCircle2 className="w-3 h-3" /> 키워드 수집에서 선택된 제목</p>}
          </div>

          {/* 글쓴이 인사말 */}
          <div className="mt-3">
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
              <MessageSquare className="w-3 h-3 inline mr-1" />글쓴이 인사말 (썸네일 바로 아래, 본문 시작 전 표시)
            </label>
            <Textarea value={greeting} onChange={e => setGreeting(e.target.value)}
              placeholder="안녕하세요! 오늘도 유용한 정보를 가지고 왔어요 😊 아래 내용이 도움이 되길 바랍니다."
              className="text-sm min-h-16 resize-none" />
          </div>

          {/* 버튼 */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button className="gap-2"
              style={{ background: isGenerating ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
              onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? "생성 중..." : `${currentAI?.label || "AI"} 생성`}
            </Button>
            {generatedContent && (
              <>
                <Button variant="outline" className="gap-2" onClick={handleCopy}><Copy className="w-4 h-4" />복사</Button>
                <Button variant="outline" className="gap-2" onClick={() => toast.info("배포 페이지로 이동합니다")}><Send className="w-4 h-4" />배포하기</Button>
              </>
            )}
          </div>

          {/* 진행률 */}
          {isGenerating && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>생성 진행률</span>
                <span className="text-xs font-medium" style={{ color: "var(--color-emerald)" }}>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex gap-4 mt-2 text-xs flex-wrap" style={{ color: "var(--muted-foreground)" }}>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />키워드 분석</span>
                <span className="flex items-center gap-1">
                  {progress > 30 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <RefreshCw className="w-3 h-3 animate-spin" />}SEO 구조 설계
                </span>
                <span className="flex items-center gap-1">
                  {progress > 70 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}본문 작성
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 해시태그 */}
        {hashtags.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                <span className="text-sm font-semibold text-foreground">자동 해시태그 (네이버 블로그용)</span>
              </div>
              <Button size="sm" variant="ghost" className="text-xs gap-1"
                onClick={() => {
                  const newTag = prompt("해시태그 추가:");
                  if (newTag) setHashtags(prev => [...prev, `#${newTag.replace("#", "")}`].slice(0, 8));
                }}>
                + 추가
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, i) => (
                <div key={i} className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: "oklch(0.696 0.17 162.48/15%)", color: "var(--color-emerald)", border: "1px solid oklch(0.696 0.17 162.48/30%)" }}>
                  {tag}
                  <button onClick={() => setHashtags(prev => prev.filter((_, j) => j !== i))}><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 에디터 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex gap-1">
                {(["edit", "preview", "blog-preview"] as const).map(tab => (
                  <button key={tab}
                    className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all"
                    style={{
                      background: activeTab === tab ? "var(--primary)" : "transparent",
                      color: activeTab === tab ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    }}
                    onClick={() => setActiveTab(tab)}>
                    {tab === "edit" ? <span className="flex items-center gap-1"><Edit3 className="w-3 h-3" />편집</span>
                      : tab === "preview" ? <span className="flex items-center gap-1"><Eye className="w-3 h-3" />미리보기</span>
                      : <span className="flex items-center gap-1"><Globe className="w-3 h-3" />블로그 미리보기</span>}
                  </button>
                ))}
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  background: charCount >= parseInt(minChars) ? "oklch(0.696 0.17 162.48/15%)" : "oklch(0.769 0.188 70.08/15%)",
                  color: charCount >= parseInt(minChars) ? "var(--color-emerald)" : "var(--color-amber-brand)",
                }}>
                {charCount.toLocaleString()}자 / 목표 {parseInt(minChars).toLocaleString()}자
              </span>
            </div>

            {activeTab === "edit" ? (
              <Textarea value={generatedContent}
                onChange={e => { setGeneratedContent(e.target.value); setCharCount(e.target.value.length); }}
                className="min-h-96 border-0 rounded-none resize-none text-sm leading-relaxed focus-visible:ring-0"
                placeholder="키워드를 입력하고 생성 버튼을 눌러주세요..."
                style={{ background: "transparent" }} />
            ) : activeTab === "preview" ? (
              <div className="p-5 min-h-96 text-sm leading-relaxed overflow-auto">
                {renderPreview(generatedContent)}
              </div>
            ) : (
              /* 블로그 미리보기 - 실제 발행 모습 */
              <div className="p-4 min-h-96 overflow-auto" style={{ background: "var(--background)" }}>
                <div className="max-w-2xl mx-auto space-y-4">
                  <p className="text-xs text-center px-2 py-1 rounded" style={{ background: "oklch(0.769 0.188 70.08/10%)", color: "var(--color-amber-brand)" }}>
                    📱 실제 발행 미리보기 (썸네일 → 인사말 → 본문 → 해시태그 순서)
                  </p>

                  {/* 썸네일 */}
                  {thumbnailUrl ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img src={thumbnailUrl} alt="썸네일" className="w-full h-full object-cover"
                        onError={() => setThumbnailUrl("")} />
                      <button className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                        onClick={() => setThumbnailUrl("")}>
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="w-full rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-colors hover:bg-accent/10"
                      style={{ border: "2px dashed var(--border)", background: "var(--card)" }}
                      onClick={() => setShowImagePicker(true)}>
                      <Image className="w-8 h-8 opacity-30" style={{ color: "var(--muted-foreground)" }} />
                      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>썸네일 선택하기</p>
                      <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                        파일 업로드 · Ctrl+V 붙여넣기 · AI 생성
                      </p>
                    </button>
                  )}

                  {/* 인사말 */}
                  {greeting && (
                    <div className="rounded-xl p-4 text-sm leading-relaxed"
                      style={{ background: "oklch(0.696 0.17 162.48/8%)", border: "1px solid oklch(0.696 0.17 162.48/20%)", color: "var(--foreground)" }}>
                      {greeting}
                    </div>
                  )}

                  {/* 본문 */}
                  <div className="text-sm leading-relaxed">
                    {renderPreview(generatedContent)}
                  </div>

                  {/* 해시태그 */}
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                      {hashtags.map((tag, i) => (
                        <span key={i} className="text-xs font-medium" style={{ color: "var(--color-emerald)" }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 최근 콘텐츠 & 썸네일 선택 */}
          <div className="space-y-4">
            {/* 썸네일 선택 패널 */}
            <div className="rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" style={{ color: "oklch(0.75 0.12 300)" }} />
                  <h3 className="font-semibold text-foreground text-sm">썸네일 선택</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {/* 숨긴 파일 input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleFileUpload(file);
                      e.target.value = "";
                    }}
                  />
                  {/* 파일 첨부 버튼 */}
                  <Button size="sm" variant="outline" className="text-xs gap-1 px-2"
                    title="내 이미지 파일 업로드"
                    onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-3 h-3" /> 파일
                  </Button>
                  {/* Ctrl+V 안내 버튼 */}
                  <Button size="sm" variant="outline" className="text-xs gap-1 px-2"
                    title="Ctrl+V로 클립보드 이미지 붙여넣기"
                    onClick={() => toast.info("Ctrl+V (또는 Cmd+V)를 누르면 클립보드 이미지가 바로 썸네일로 설정됩니다!")}>
                    <Clipboard className="w-3 h-3" /> Ctrl+V
                  </Button>
                  <Button size="sm" className="text-xs gap-1.5"
                    style={{ background: "oklch(0.75 0.12 300)", color: "white" }}
                    onClick={() => {
                      const autoPrompt = title
                        ? `${title}, ${keyword}, 블로그 썸네일, 고품질`
                        : `${keyword}, 블로그 썸네일, 고품질`;
                      navigate(`/images?prompt=${encodeURIComponent(autoPrompt)}&keyword=${encodeURIComponent(keyword)}`);
                    }}>
                    <Sparkles className="w-3.5 h-3.5" /> AI생성
                  </Button>
                </div>
              </div>
              {savedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 p-3">
                  {savedImages.slice(0, 6).map((src, i) => (
                    <button key={i}
                      className="relative rounded-lg overflow-hidden transition-all"
                      style={{ aspectRatio: "1", border: `2px solid ${thumbnailUrl === src ? "var(--color-emerald)" : "transparent"}` }}
                      onClick={() => { setThumbnailUrl(src); toast.success("썸네일이 선택되었습니다!"); }}>
                      {src && <img src={src} alt="" className="w-full h-full object-cover"
                        onError={e => { const el = (e.target as HTMLImageElement).closest("button") as HTMLElement; if(el) el.style.display="none"; }} />}
                      {thumbnailUrl === src && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                    📁 파일 버튼으로 내 이미지 업로드<br />
                    ⌨️ Ctrl+V로 클립보드 이미지 붙여넣기<br />
                    ✨ AI생성으로 새 이미지 만들기
                  </p>
                </div>
              )}
            </div>

            {/* 저장 안내 */}
            {generatedContent && (
              <div className="rounded-xl p-3" style={{ background: "oklch(0.696 0.17 162.48/8%)", border: "1px solid oklch(0.696 0.17 162.48/20%)" }}>
                <p className="text-xs" style={{ color: "var(--color-emerald)" }}>
                  ✅ 작성한 글이 자동으로 저장됩니다.<br />다른 페이지를 다녀와도 내용이 유지돼요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>

      {/* ── 플로팅 미리보기 버튼 ── */}
      {generatedContent && (
        <button
          className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--color-emerald)", color: "white", boxShadow: "0 8px 32px oklch(0.696 0.17 162.48/40%)" }}
          onClick={() => setShowFloatingPreview(true)}>
          <Eye className="w-4 h-4" />
          구독자 미리보기
        </button>
      )}

      {/* ── 미리보기 풀스크린 모달 ── */}
      {showFloatingPreview && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-emerald)" }} />
              <span className="text-sm font-semibold text-foreground">구독자 시점 미리보기</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.696 0.17 162.48/10%)", color: "var(--color-emerald)" }}>실제 발행 모습</span>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/20"
              style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShowFloatingPreview(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-8">
              {thumbnailUrl && (
                <div className="rounded-xl overflow-hidden mb-6" style={{ aspectRatio: "16/9" }}>
                  <img src={thumbnailUrl} alt="썸네일" className="w-full h-full object-cover" />
                </div>
              )}
              {title && <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight">{title}</h1>}
              <div className="prose prose-sm max-w-none" style={{ color: "var(--foreground)" }}>
                {renderPreview(generatedContent)}
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                  {hashtags.map((tag, i) => (
                    <span key={i} className="text-sm px-3 py-1 rounded-full" style={{ background: "oklch(0.696 0.17 162.48/10%)", color: "var(--color-emerald)" }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
