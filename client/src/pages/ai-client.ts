/**
 * ai-client.ts
 * 클라이언트(브라우저)에서 직접 AI API 호출
 * Vercel 서버 경유 없음 → Gemini 등 서버IP 차단 문제 완전 해결
 */

// ── 공통 에러 파싱 ────────────────────────────────────
function parseError(provider: string, status: number, msg: string): string {
  const m = msg.toLowerCase();
  if (status === 429 || m.includes("quota") || m.includes("rate") || m.includes("limit") || m.includes("exhausted") || m.includes("resource_exhausted")) {
    return `${provider} 요청 한도 초과. 잠시 후 다시 시도해주세요.`;
  }
  if (status === 401 || m.includes("api key") || m.includes("api_key") || m.includes("authentication") || m.includes("invalid key") || m.includes("incorrect")) {
    return `${provider} API 키가 잘못되었습니다. 설정에서 확인해주세요.`;
  }
  if (status === 403 || m.includes("permission") || m.includes("forbidden")) {
    return `${provider} API 키 권한이 없습니다. 키를 확인해주세요.`;
  }
  if (m.includes("credit") || m.includes("balance") || m.includes("billing")) {
    return `${provider} 크레딧이 부족합니다. 충전 후 이용해주세요.`;
  }
  return `${provider} 오류 (${status}): ${msg || "알 수 없는 오류"}`;
}

// ── 글 생성 ───────────────────────────────────────────
export async function generateContent(
  provider: string,
  apiKey: string,
  keyword: string,
  title: string | undefined,
  language: string,
  minChars: number,
  stylePrompt: string = ""
): Promise<string> {

  const langMap: Record<string, string> = {
    ko: "한국어", en: "English", ja: "日本語", zh: "中文",
    es: "Español", fr: "Français", de: "Deutsch", pt: "Português",
  };
  const langLabel = langMap[language] || "한국어";
  const maxTokens = Math.max(4000, Math.ceil(minChars * 2));
  const titleInstruction = title
    ? `글 제목은 반드시 "${title}" 으로 시작해줘.`
    : `글 제목은 키워드 "${keyword}"를 포함한 클릭률 높은 제목으로 만들어줘.`;

  // 스타일 지침
  const styleInstruction = stylePrompt
    ? `\n\n[글쓰기 스타일 지침]\n${stylePrompt}`
    : "";

  // ── 사람처럼 쓰는 고품질 프롬프트 ──
  const prompt = `당신은 ${langLabel} 블로그에서 월 100만원 이상 애드센스 수익을 내는 전문 블로거입니다.
아래 키워드로 독자가 끝까지 읽고 싶은 블로그 글을 써주세요.

키워드: "${keyword}"
${titleInstruction}

[핵심 작성 원칙]
1. 사람이 직접 경험한 것처럼 1인칭 시점으로 써줘
   - "저도 처음에는 몰랐는데요...", "솔직히 말하면..."
   - "지난달에 직접 해봤더니", "주변 지인한테 물어봤더니" 같은 표현 사용
2. 독자에게 말 걸기
   - "혹시 이런 경험 있으세요?", "아마 많이들 궁금하실 텐데요"
   - "이거 진짜 중요해서 다시 강조할게요"
3. 자연스러운 문체 (AI 티 안 나게)
   - 짧은 문장과 긴 문장을 섞어서 리듬감 있게
   - 구어체 표현 적극 활용
   - 소제목 없이 자연스럽게 흘러가는 글
4. 구체적인 정보
   - 실제 사용 가능한 팁, 방법, 가격, 수치 포함
   - 막연한 표현 금지 ("좋습니다" → "3주 써보니 확실히 달랐어요")

[형식]
- 반드시 ${minChars}자 이상 (가장 중요)
- 마크다운 기호 절대 사용 금지 (**, ##, -- 등)
- 일반 텍스트로만 작성
- 단락 사이 자연스러운 줄바꿈
- SEO: 키워드를 자연스럽게 5회 이상 포함
- 마지막에 독자 행동 유도 문구 포함${styleInstruction}`;

  // ── Gemini → Vercel 서버 경유 (CORS 문제로 브라우저 직접 호출 불가) ──
  if (provider === "gemini") {
    const resp = await fetch("/api/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, keyword, title, language, minChars }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Gemini 서버 오류 (${resp.status})`);
    }
    const data = await resp.json();
    const content = data.content || "";
    if (!content) throw new Error("Gemini 응답이 비어있습니다. 다시 시도해주세요.");
    return content;
  }

  // ── Claude ──
  if (provider === "claude") {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(parseError("Claude", resp.status, err.error?.message || ""));
    }
    const data = await resp.json();
    const content = data.content?.[0]?.text || "";
    if (!content) throw new Error("Claude 응답이 비어있습니다. 다시 시도해주세요.");
    return content;
  }

  // ── OpenAI ──
  if (provider === "openai") {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(parseError("OpenAI", resp.status, err.error?.message || ""));
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) throw new Error("OpenAI 응답이 비어있습니다. 다시 시도해주세요.");
    return content;
  }

  // ── Groq ──
  if (provider === "groq") {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: Math.min(maxTokens, 8000),
        temperature: 0.7,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(parseError("Groq", resp.status, err.error?.message || ""));
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) throw new Error("Groq 응답이 비어있습니다. 다시 시도해주세요.");
    return content;
  }

  throw new Error(`지원하지 않는 AI: ${provider}`);
}

// ── 제목 생성 ─────────────────────────────────────────
export async function generateTitles(
  provider: string,
  apiKey: string,
  keyword: string
): Promise<string[]> {

  const prompt = `"${keyword}" 키워드로 독자가 클릭하지 않을 수 없는 블로그 제목 10개를 만들어줘.

조건:
- 클릭률(CTR) 극대화: 궁금증, 이득, 감정 자극
- 다양한 패턴 믹스:
  * 숫자형: "월 100만원 버는 방법 5가지"
  * 경험형: "직접 써봤더니 달랐던 ${keyword} 후기"
  * 충격형: "아무도 알려주지 않는 ${keyword} 진실"
  * 비교형: "${keyword} 잘못 알고 있었던 것들"
  * 질문형: "${keyword} 해도 될까요? 직접 알아봤습니다"
- 2026년 최신 느낌 포함
- 한국어로 작성
- 반드시 JSON 배열로만 응답: ["제목1", "제목2", ...]`;

  function extractTitles(text: string): string[] {
    try {
      const clean = text.replace(/```json|```/gi, "").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === "string");
      }
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === "string");
    } catch {}
    return [];
  }

  let content = "";

  // ── Gemini → Vercel 서버 경유 (CORS 문제) ──
  if (provider === "gemini") {
    const resp = await fetch("/api/generate-titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, keyword }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Gemini 서버 오류 (${resp.status})`);
    }
    const data = await resp.json();
    const titles = data.titles || [];
    if (titles.length === 0) throw new Error("Gemini 제목 생성 실패.");
    return titles;
  }

  // ── Claude ──
  else if (provider === "claude") {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(parseError("Claude", resp.status, err.error?.message || ""));
    }
    const data = await resp.json();
    content = data.content?.[0]?.text || "[]";
  }

  // ── OpenAI ──
  else if (provider === "openai") {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(parseError("OpenAI", resp.status, err.error?.message || ""));
    }
    const data = await resp.json();
    content = data.choices?.[0]?.message?.content || "[]";
  }

  // ── Groq ──
  else if (provider === "groq") {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(parseError("Groq", resp.status, err.error?.message || ""));
    }
    const data = await resp.json();
    content = data.choices?.[0]?.message?.content || "[]";
  }

  else {
    throw new Error(`지원하지 않는 AI: ${provider}`);
  }

  const titles = extractTitles(content);
  if (titles.length === 0) throw new Error("제목 생성 실패. API 키와 선택된 AI를 확인해주세요.");
  return titles;
}

// ── Pollinations 이미지 ──────────────────────────────
// URL 생성 후 실제 로딩될 때까지 기다림 (타임아웃: 60초)
// crossOrigin 없이 일반 img 태그처럼 로드 → CORS 우회
// ── 이미지 품질 극대화 프롬프트 생성 ──────────────
export function enhanceImagePrompt(basePrompt: string): string {
  const qualityTags = [
    "ultra realistic photography",
    "professional DSLR camera",
    "8K resolution",
    "perfect composition",
    "cinematic lighting",
    "sharp focus",
    "magazine quality",
    "award winning photo",
    "--no blur, --no watermark, --no text",
  ].join(", ");
  return `${basePrompt}, ${qualityTags}`;
}

export async function fetchPollinationsImage(
  prompt: string,
  width: number,
  height: number,
  seed: number
): Promise<string> {
  const ts = Date.now();
  // 품질 극대화 프롬프트 적용
  const enhancedPrompt = enhanceImagePrompt(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&enhance=true&cache=false&t=${ts}`;

  // img 태그를 DOM 외부에서 생성해 실제 로드 확인
  return new Promise((resolve, reject) => {
    const img = new Image();
    // crossOrigin 설정 안 함 → 브라우저 일반 이미지 로딩 방식 사용 (CORS 우회)
    
    const timeout = setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      // 타임아웃시에도 URL 반환 (이미지가 늦게 뜰 수 있음)
      resolve(url);
    }, 60000); // 60초 대기

    img.onload = () => {
      clearTimeout(timeout);
      resolve(url);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      // 에러 시 재시도용 다른 seed로 URL 반환
      const retryUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed + 1}&model=flux&cache=false&t=${ts + 1}`;
      resolve(retryUrl);
    };

    img.src = url;
  });
}
