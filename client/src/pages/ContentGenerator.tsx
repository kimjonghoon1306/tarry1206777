/**
 * BlogAuto Pro - Content Generator Page
 * Design: Modern Professional Dark SaaS
 * AI content generation with 1500+ chars, multilingual support
 */

import { useState } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  FileText,
  Zap,
  RefreshCw,
  Copy,
  Send,
  Globe,
  ChevronDown,
  Clock,
  CheckCircle2,
  Edit3,
  Eye,
  Languages,
  Bot,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const SAMPLE_CONTENT = `# 2026년 서울 강남 숨은 맛집 TOP 10 - 현지인이 추천하는 완벽 가이드

서울 강남구는 대한민국에서 가장 트렌디한 음식 문화의 중심지입니다. 매년 수많은 새로운 레스토랑이 문을 열고, 미식가들의 발길이 끊이지 않는 이 지역에서 진정한 숨은 맛집을 찾는 것은 쉽지 않습니다. 이번 가이드에서는 현지인들만 아는 강남의 숨은 맛집 10곳을 엄선하여 소개합니다.

## 1. 청담동 한우 전문점 '소담'

청담동 골목 깊숙이 자리한 소담은 30년 전통의 한우 전문점입니다. 1++ 등급의 한우만을 사용하며, 특히 갈비살과 채끝살의 마블링이 뛰어납니다. 예약은 필수이며, 점심 특선 메뉴는 합리적인 가격으로 최고급 한우를 맛볼 수 있는 기회를 제공합니다.

**위치**: 청담동 123-45 | **가격대**: 1인 5만원~15만원 | **추천 메뉴**: 갈비살, 채끝살

## 2. 압구정 이탈리안 레스토랑 '라 피아짜'

압구정 로데오 거리 인근에 위치한 라 피아짜는 이탈리아 현지 셰프가 직접 운영하는 정통 이탈리안 레스토랑입니다. 매일 아침 공수되는 신선한 재료로 만든 파스타와 피자는 이 지역 최고 수준을 자랑합니다.

**위치**: 압구정동 456-78 | **가격대**: 1인 3만원~8만원 | **추천 메뉴**: 트러플 파스타, 마르게리타 피자

## 3. 삼성동 일식 오마카세 '하나'

삼성동 코엑스 인근에 위치한 하나는 예약 대기가 3개월 이상인 인기 오마카세 레스토랑입니다. 제철 재료를 활용한 코스 요리는 매달 메뉴가 바뀌며, 셰프의 섬세한 손길이 담긴 각각의 요리는 예술 작품과 같습니다.

이처럼 강남에는 다양한 매력을 가진 숨은 맛집들이 즐비합니다. 이 가이드가 여러분의 강남 미식 여행에 도움이 되길 바랍니다.`;

const RECENT_CONTENTS = [
  { title: "봄 여행 완벽 코스 - 제주도 3박 4일", chars: 2340, status: "완료", lang: "한국어", date: "10분 전" },
  { title: "직장인 재테크 필수 가이드 2026", chars: 1890, status: "완료", lang: "한국어", date: "1시간 전" },
  { title: "홈트레이닝 초보자 루틴 완벽 정리", chars: 1650, status: "완료", lang: "한국어", date: "2시간 전" },
  { title: "강아지 기초 훈련 방법 A to Z", chars: 1780, status: "완료", lang: "한국어", date: "어제" },
];

import { getContentProvider, getAPIKey, CONTENT_AI_OPTIONS } from "@/lib/ai-config";
import { useLocation } from "wouter";
export default function ContentGenerator() {
  const [, navigate] = useLocation();
  // window.location.search 사용 - wouter useLocation이 쿼리스트링 안 줄 때 대비
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const prefilledKeyword = params.get("keyword") || "";
  const prefilledTitle = params.get("title") || "";

  const [keyword, setKeyword] = useState(prefilledKeyword || "");
  const [title, setTitle] = useState(prefilledTitle || "");
  const [selectedLang, setSelectedLang] = useState(
    () => localStorage.getItem("content_language") || "ko"
  );
  const [minChars, setMinChars] = useState("1500");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState(prefilledTitle ? "" : SAMPLE_CONTENT);
  const [charCount, setCharCount] = useState(prefilledTitle ? 0 : SAMPLE_CONTENT.length);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">(prefilledTitle ? "edit" : "preview");
  const [isDeploying, setIsDeploying] = useState(false);

  const currentAI = CONTENT_AI_OPTIONS.find(o => o.value === getContentProvider());

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
      setProgress(prev => prev >= 85 ? 85 : prev + Math.random() * 12);
    }, 400);

    try {
      const resp = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider, apiKey,
          keyword,
          title: title.trim() || undefined,
          language: selectedLang,
          minChars: parseInt(minChars),
        }),
      });

      clearInterval(interval);

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "API 오류");
      }

      const data = await resp.json();
      const content = data.content || "";
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

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("클립보드에 복사되었습니다");
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              콘텐츠 생성
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              AI가 1,500자 이상의 SEO 최적화 글을 자동 작성합니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
              style={{ background: "oklch(0.696 0.17 162.48 / 10%)", color: "var(--color-emerald)" }}
            >
              <Bot className="w-4 h-4" />
              AI 엔진 활성
            </div>
          </div>
        </div>

        {/* Generation Controls */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                키워드 / 주제
              </label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="키워드를 입력하세요..."
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                출력 언어
              </label>
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
                최소 글자수
              </label>
              <Select value={minChars} onValueChange={setMinChars}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1500">1,500자 이상</SelectItem>
                  <SelectItem value="2000">2,000자 이상</SelectItem>
                  <SelectItem value="3000">3,000자 이상</SelectItem>
                  <SelectItem value="5000">5,000자 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 제목 입력 (키워드 연구에서 넘어왔을 때 자동 입력) */}
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--muted-foreground)" }}>
              글 제목 (선택 · 비우면 AI가 자동 생성)
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 직접 입력하거나 키워드 수집에서 선택하세요..."
              className="text-sm"
              style={{
                borderColor: title ? "oklch(0.696 0.17 162.48 / 60%)" : undefined,
                background: title ? "oklch(0.696 0.17 162.48 / 5%)" : undefined,
              }}
            />
            {title && (
              <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--color-emerald)" }}>
                <CheckCircle2 className="w-3 h-3" /> 키워드 수집에서 선택된 제목
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              className="gap-2"
              style={{ background: isGenerating ? "var(--muted)" : "var(--color-emerald)", color: "white" }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? "생성 중..." : `${currentAI?.label || "AI"} 생성`}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              복사
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => toast.info("배포 페이지로 이동합니다")}
            >
              <Send className="w-4 h-4" />
              배포하기
            </Button>
            {/* 이미지 생성 연결 버튼 */}
            {generatedContent && (
              <Button
                className="gap-2"
                style={{ background: "oklch(0.75 0.12 300)", color: "white" }}
                onClick={() => {
                  const autoPrompt = title
                    ? `${title}, ${keyword}, 블로그 대표 이미지, 고품질 사진`
                    : `${keyword}, 블로그 대표 이미지, 고품질 사진`;
                  navigate(`/images?prompt=${encodeURIComponent(autoPrompt)}&keyword=${encodeURIComponent(keyword)}`);
                }}
              >
                <Sparkles className="w-4 h-4" />
                이미지 생성
              </Button>
            )}
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>생성 진행률</span>
                <span className="text-xs font-medium" style={{ color: "var(--color-emerald)" }}>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex gap-4 mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 키워드 분석
                </span>
                <span className="flex items-center gap-1">
                  {progress > 30 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <RefreshCw className="w-3 h-3 animate-spin" />}
                  SEO 구조 설계
                </span>
                <span className="flex items-center gap-1">
                  {progress > 70 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3" />}
                  본문 작성
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div
            className="lg:col-span-2 rounded-xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* Editor tabs */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex gap-1">
                {(["edit", "preview"] as const).map(tab => (
                  <button
                    key={tab}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: activeTab === tab ? "var(--primary)" : "transparent",
                      color: activeTab === tab ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "edit" ? (
                      <span className="flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5" /> 편집</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> 미리보기</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    background: charCount >= 1500 ? "oklch(0.696 0.17 162.48 / 15%)" : "oklch(0.769 0.188 70.08 / 15%)",
                    color: charCount >= 1500 ? "var(--color-emerald)" : "var(--color-amber-brand)",
                  }}
                >
                  {charCount.toLocaleString()}자
                </span>
                {charCount >= 1500 && (
                  <CheckCircle2 className="w-4 h-4" style={{ color: "var(--color-emerald)" }} />
                )}
              </div>
            </div>

            {/* Content area */}
            {activeTab === "edit" ? (
              <Textarea
                value={generatedContent}
                onChange={(e) => {
                  setGeneratedContent(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                className="min-h-96 border-0 rounded-none resize-none text-sm leading-relaxed focus-visible:ring-0"
                style={{ background: "transparent" }}
              />
            ) : (
              <div
                className="p-5 min-h-96 text-sm leading-relaxed overflow-auto prose prose-invert max-w-none"
                style={{ color: "var(--foreground)" }}
              >
                {generatedContent.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-0 mb-3 text-foreground">{line.slice(2)}</h1>;
                  if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-4 mb-2 text-foreground">{line.slice(3)}</h2>;
                  if (line.startsWith("**")) return <p key={i} className="text-xs mt-1 mb-2" style={{ color: "var(--muted-foreground)" }}>{line.replace(/\*\*/g, "")}</p>;
                  if (line === "") return <br key={i} />;
                  return <p key={i} className="mb-2" style={{ color: "var(--foreground)" }}>{line}</p>;
                })}
              </div>
            )}
          </div>

          {/* Recent contents */}
          <div
            className="rounded-xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-foreground">최근 생성 콘텐츠</h3>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {RECENT_CONTENTS.map((content) => (
                <div
                  key={content.title}
                  className="p-4 hover:bg-accent/20 transition-colors cursor-pointer"
                  onClick={() => toast.info("콘텐츠 불러오기 준비 중")}
                >
                  <div className="text-sm font-medium text-foreground mb-1 line-clamp-2">{content.title}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded badge-active"
                    >
                      {content.chars.toLocaleString()}자
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{content.lang}</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{content.date}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Languages className="w-4 h-4" />
                번역 생성
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
