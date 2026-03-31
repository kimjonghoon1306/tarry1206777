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
  minChars: number
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

  const prompt = `다음 키워드로 애드센스/애드포스트 수익에 최적화된 블로그 글을 ${langLabel}로 작성해줘.

키워드: "${keyword}"
${titleInstruction}

조건:
- 반드시 ${minChars}자 이상 작성 (이 조건이 가장 중요!)
- 마크다운 형식 사용 (# 제목, ## 소제목, **강조**, - 목록)
- 구성: 제목 → 서론(흥미 유발) → 본문(소제목 5개 이상) → 결론 → 마무리 문장
- SEO 최적화: 키워드 자연스럽게 5회 이상 포함
- 독자에게 실제 도움이 되는 구체적인 정보
- 숫자, 통계, 팁, 예시 적극 활용`;

  // ── Gemini ──
  if (provider === "gemini") {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(parseError("Gemini", resp.status, err.error?.message || ""));
    }
    const data = await resp.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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

  const prompt = `"${keyword}" 키워드로 애드센스/애드포스트 수익에 최적화된 블로그 글 제목 10개를 생성해줘.
조건:
- 클릭률(CTR)이 높은 제목
- 숫자 포함 (TOP 10, 5가지, 2026 등)
- 궁금증 유발 또는 정보성 제목
- 한국어
- 반드시 JSON 배열로만 응답 (다른 텍스트 없이): ["제목1", "제목2", ...]`;

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

  // ── Gemini ──
  if (provider === "gemini") {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(parseError("Gemini", resp.status, err.error?.message || ""));
    }
    const data = await resp.json();
    content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
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

// ── Pollinations 이미지 - img 태그로 로드 후 URL 반환 (CORS 우회) ──
export async function fetchPollinationsImage(prompt: string, width: number, height: number, seed: number): Promise<string> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&cache=false`;
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => {
      reject(new Error("이미지 로딩 시간 초과 (40초). 다시 시도해주세요."));
    }, 40000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        // canvas로 base64 변환 시도
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || width;
        canvas.height = img.naturalHeight || height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        } else {
          // canvas 실패시 URL 그대로 반환
          resolve(url);
        }
      } catch {
        // CORS로 canvas 변환 실패해도 URL로 반환 (갤러리에는 보임)
        resolve(url);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Pollinations 이미지 로드 실패. 잠시 후 다시 시도해주세요."));
    };
    img.src = url;
  });
}
