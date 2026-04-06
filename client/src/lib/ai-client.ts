// BlogAuto Pro - ai-client v3.1
/**
 * ai-client.ts
 * 클라이언트(브라우저)에서 직접 AI API 호출
 * Vercel 서버 경유 없음 → Gemini 등 서버IP 차단 문제 완전 해결
 */

// ── 한자/외국문자/마크다운 기호 강제 제거 ──────────────────────────────
function removeNonKorean(text: string): string {
  // ✅ 섹션 마커 먼저 추출해서 보존
  const markers = ["[FAQ시작]","[FAQ끝]","[참고자료시작]","[참고자료끝]","[관련글시작]","[관련글끝]"];
  const placeholder: Record<string, string> = {};
  markers.forEach((m, i) => {
    const key = `__MARKER${i}__`;
    placeholder[key] = m;
    text = text.split(m).join(key);
  });

  text = text
    .replace(/[一-鿿㐀-䶿]/g, "")
    .replace(/[\u3040-\u30FF]/g, "")
    .replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s.,!?;:()\-\'\"\.\[\]%@#&+=/\\~`|<>{}^_$\n]/g, "")
    .replace(/\*{2,}/g, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/_{2,}/g, "")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 마커 복원
  Object.entries(placeholder).forEach(([key, val]) => {
    text = text.split(key).join(val);
  });
  return text;
}
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


function normalizeTitles(titles: string[], keyword: string): string[] {
  const uniq = Array.from(new Set(
    titles
      .map(t => removeNonKorean(String(t || "")).replace(/^["'\s]+|["'\s]+$/g, "").trim())
      .filter(Boolean)
  ));
  const filled = [...uniq];
  const templates = [
    `2026년 ${keyword} BEST 7가지 정리`,
    `${keyword} 처음이라면 이것부터`,
    `${keyword} 솔직 후기와 핵심 정리`,
    `${keyword} 제대로 고르는 방법`,
    `${keyword} 잘 모르면 손해인 팁`,
    `${keyword} 진짜 효과 있을까`,
    `${keyword} 추천 이유 총정리`,
    `${keyword} 비교 포인트 한눈에`,
    `${keyword} 초보자 가이드`,
    `${keyword} 실전 활용법 정리`,
  ];
  for (const t of templates) {
    if (filled.length >= 10) break;
    if (!filled.includes(t)) filled.push(t);
  }
  return filled.slice(0, 10);
}

function ensureMinChars(text: string, minChars: number, keyword: string, title?: string): string {
  let out = removeNonKorean(text || "");
  if (out.length >= minChars) return out;
  const filler = `이어서 실제로 느낀 점을 조금 더 적어보면, ${keyword}는 상황에 따라 체감 차이가 꽤 큰 편입니다. 처음에는 작은 차이처럼 보여도 계속 비교해보면 선택 기준이 분명해집니다. 가격, 사용 편의성, 유지 비용, 만족도까지 같이 보면 판단이 훨씬 쉬워집니다. 특히 초보자라면 너무 복잡하게 접근하기보다 기본부터 차근차근 확인하는 게 좋습니다. 이런 식으로 하나씩 점검하면 실패 확률을 줄일 수 있고, 나한테 맞는 방향을 찾기도 훨씬 수월합니다.`;
  while (out.length < minChars) {
    out += `\n\n${filler}`;
  }
  if (title && !out.startsWith(title)) {
    out = `${title}\n\n${out}`;
  }
  return removeNonKorean(out);
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
  // 카테고리 자동 감지
  const kw = (keyword + " " + (title || "")).toLowerCase();
  let categoryGuide = "";
  if (/맛집|음식|카페|식당|요리|레스토랑|빵|디저트|커피|치킨|피자|라면/.test(kw)) {
    categoryGuide = `[맛집/음식]\n- 직접 방문한 것처럼: 분위기, 서비스, 웨이팅\n- 메뉴 맛 생생하게: 식감, 향, 간의 세기, 첫 한 입 느낌\n- 가격, 주차, 영업시간, 재방문 의향\n- 단점도 솔직하게`;
  } else if (/it|앱|ai|테크|스마트폰|노트북|컴퓨터|챗gpt/.test(kw)) {
    categoryGuide = `[IT/테크]\n- 전문 용어 쉬운 말로 풀이\n- 실제 사용 시나리오와 단계별 설명\n- 장단점 비교, 비슷한 제품과 비교\n- 초보자도 따라할 수 있게`;
  } else if (/리뷰|후기|사용기|체험|써봤|먹어봤|구매/.test(kw)) {
    categoryGuide = `[리뷰/후기]\n- 사용 전 기대 → 실제 경험 구조\n- 장점 3개 이상, 단점 2개 이상 균형있게\n- 구체적 수치로 효과 표현\n- "이런 분 사세요/사지 마세요" 명확하게`;
  } else if (/여행|관광|호텔|숙소|제주|부산|해외/.test(kw)) {
    categoryGuide = `[여행]\n- 교통편, 비용, 소요시간\n- 꼭 가야 할 명소 TOP5\n- 현지 맛집, 숨은 명소\n- 예산 총정리, 시즌별 추천`;
  } else if (/건강|다이어트|운동|헬스|피부|탈모/.test(kw)) {
    categoryGuide = `[건강/의료]\n- 전문 용어 쉽게 풀이\n- 집에서 가능 vs 병원 가야 하는 경우 구분\n- 잘못된 상식 바로잡기\n- 연령/성별 다른 접근법`;
  } else if (/대학생|취준|취업|알바|공부|수능/.test(kw)) {
    categoryGuide = `[학생/취준]\n- 또래 친구에게 말하듯\n- 실제 경험 기반, 돈 아끼는 팁\n- 선배가 알려주는 느낌\n- 현실적 조언, 멘탈 관리 포함`;
  } else if (/육아|아이|아기|엄마|임신|유아/.test(kw)) {
    categoryGuide = `[육아/맘]\n- 같은 부모 입장에서 공감\n- 월령/나이별 구체적 정보\n- 안전성 최우선\n- 지치는 부모 위한 공감과 위로`;
  } else if (/재테크|투자|주식|부동산|절약|돈|금융/.test(kw)) {
    categoryGuide = `[재테크/금융]\n- 초보자도 이해하는 쉬운 설명\n- 실제 숫자 예시 포함\n- 리스크와 수익률 균형있게\n- 연령대별 다른 전략`;
  } else {
    categoryGuide = `[정보/일상]\n- 독자가 몰랐던 새로운 정보\n- 일상에서 바로 써먹는 실용 팁\n- 연령/상황별 활용법`;
  }

  const prompt = `당신은 대한민국 최고의 블로그 작가입니다. 친구한테 카톡 보내듯, 엄마가 딸한테 알려주듯, 기자가 르포 기사 쓰듯 — 가장 자연스럽고 생생한 글을 씁니다.

키워드: "${keyword}"
${titleInstruction}
언어: ${langLabel}
목표 글자수: ${minChars}자 이상

${categoryGuide}

[공통 원칙]
- AI 티 절대 금지: "저도 처음엔 몰랐는데요", "솔직히 말하면", "이거 써보니까"
- 독자에게 말 걸기: "혹시 이런 거 고민해보셨나요?", "아마 많이들 궁금하셨을 텐데"
- 막연한 표현 금지 → 구체적 수치, 가격, 기간, 날짜로
- 문장 끝 다양하게: "~해요", "~거든요", "~더라고요", "~잖아요"
- 반드시 ${minChars}자 이상
- ⚠️ 별표(*) 절대 사용 금지 — **강조**, *이탤릭* 전부 금지
- ⚠️ 샵(#) 절대 사용 금지 — ## 제목, ### 소제목 전부 금지
- ⚠️ 대시(-) 목록 절대 금지 — - 항목 전부 금지
- ⚠️ 언더바(_) 절대 사용 금지
- 순수 텍스트, 자연스러운 단락 구분
- SEO: 키워드 자연스럽게 7회 이상
- 절대 한자, 중국어, 일본어, 베트남어 등 외국 문자 금지
- 오직 한글, 영어, 숫자만 사용${styleInstruction}

[필수 섹션 - 본문 끝에 반드시 추가]
본문을 다 쓴 후, 아래 형식으로 3개 섹션을 반드시 추가해줘.

[FAQ시작]
Q1: (독자가 가장 많이 궁금해하는 질문 1)
A1: (구체적이고 실용적인 답변)
Q2: (질문 2)
A2: (답변)
Q3: (질문 3)
A3: (답변)
Q4: (질문 4)
A4: (답변)
[FAQ끝]

[참고자료시작]
LINK1: (관련 공식기관 또는 신뢰할 수 있는 사이트 이름)|(간단한 설명 한 줄)|(https://실제URL)
LINK2: (사이트 이름)|(설명)|(https://실제URL)
LINK3: (사이트 이름)|(설명)|(https://실제URL)
[참고자료끝]

[관련글시작]
POST1: (연관 주제 블로그 제목 1)|(이 글을 읽으면 좋은 이유 한 줄)
POST2: (연관 주제 블로그 제목 2)|(이유)
POST3: (연관 주제 블로그 제목 3)|(이유)
[관련글끝]`

  // ── Gemini → 브라우저 직접 호출 (Vercel 서버 IP 차단 우회) ──
  if (provider === "gemini") {
    const GEMINI_MODELS = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ];
    const maxTok = Math.min(8192, Math.max(4000, Math.ceil(minChars * 2)));
    let lastErr = "";
    for (const model of GEMINI_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: maxTok },
            }),
          }
        );
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          const msg = (err.error?.message || "").toLowerCase();
          const status = resp.status;
          if (status === 401 || status === 403 || msg.includes("api key") || msg.includes("api_key")) {
            throw new Error("Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.");
          }
          lastErr = `${model} 오류(${status})`;
          continue;
        }
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!text) { lastErr = `${model} 빈 응답`; continue; }
        return ensureMinChars(text, minChars, keyword, title);
      } catch (e: any) {
        if (e.message?.includes("API 키")) throw e;
        lastErr = e.message;
        continue;
      }
    }
    throw new Error(`Gemini 글 생성 실패: ${lastErr}`);
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
    return removeNonKorean(content);
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
    return removeNonKorean(content);
  }

  // ── Groq → Vercel 서버 경유 (브라우저 CORS 불안정 문제 해결) ──
  if (provider === "groq") {
    const adPlatform = localStorage.getItem("selected_ad_platform") || "";
    const resp = await fetch("/api/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, keyword, title, language, minChars, stylePrompt, adPlatform }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Groq 서버 오류 (${resp.status})`);
    }
    const data = await resp.json();
    const content = data.content || "";
    if (!content) throw new Error("Groq 응답이 비어있습니다. API 키를 확인해주세요.");
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

  const prompt = `당신은 대한민국 최고의 SEO 전문가이자 블로그 제목 전문가입니다.
"${keyword}" 키워드로 경쟁 낮고 클릭률 높은 제목 10개를 만들어주세요.

[핵심 목표]
1. 경쟁 낮은 롱테일 키워드 활용
2. 클릭률(CTR) 극대화
3. 검색 의도 정확히 반영

[10가지 패턴 다양하게]
1. "2026년 ${keyword} BEST 7가지 완벽 정리"
2. "직접 써봤더니 달라진 ${keyword} 솔직 후기"
3. "${keyword} 때문에 고민이라면 이것만 보세요"
4. "${keyword} vs 다른 것, 뭐가 진짜 나을까?"
5. "아무도 알려주지 않는 ${keyword}의 숨겨진 진실"
6. "${keyword} 처음이라면? 이것부터 시작하세요"
7. "전문가가 추천하는 ${keyword} 제대로 활용법"
8. "${keyword} 잘 모르면 손해, 핵심 5가지"
9. "저도 처음엔 몰랐던 ${keyword}, 이제는 자신 있어요"
10. "${keyword} 진짜 효과 있을까? 3개월 직접 해봤습니다"

[규칙]
- 30자 이내
- 한글, 영어, 숫자만 (한자/중국어/일본어 절대 금지)
- 반드시 JSON 배열로만 응답: ["제목1", "제목2", ...]
- 절대 한자, 중국어, 일본어, 베트남어 등 외국 문자 사용 금지
- 오직 한글, 영어, 숫자만 사용`;

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
  // ── Gemini → 브라우저 직접 호출 (Vercel 서버 IP 차단 우회) ──
  if (provider === "gemini") {
    const GEMINI_MODELS = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ];
    let lastErr = "";
    for (const model of GEMINI_MODELS) {
      try {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 1000 },
            }),
          }
        );
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          const msg = (err.error?.message || "").toLowerCase();
          const status = resp.status;
          if (status === 401 || status === 403 || msg.includes("api key") || msg.includes("api_key")) {
            throw new Error("Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.");
          }
          lastErr = `${model} 오류(${status})`;
          continue;
        }
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!text) { lastErr = `${model} 빈 응답`; continue; }
        const titles = extractTitles(text);
        if (titles.length > 0) return normalizeTitles(titles, keyword);
        lastErr = `${model} 파싱 실패`;
        continue;
      } catch (e: any) {
        if (e.message?.includes("API 키")) throw e;
        lastErr = e.message;
        continue;
      }
    }
    throw new Error(`Gemini 제목 생성 실패: ${lastErr}`);
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

  // ── Groq → Vercel 서버 경유 ──
  else if (provider === "groq") {
    const resp = await fetch("/api/generate-titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, keyword }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Groq 서버 오류 (${resp.status})`);
    }
    const data = await resp.json();
    const titles = data.titles || [];
    if (titles.length === 0) throw new Error("Groq 제목 생성 실패. API 키를 확인해주세요.");
    return titles;
  }

  else {
    throw new Error(`지원하지 않는 AI: ${provider}`);
  }

  const titles = extractTitles(content);
  if (titles.length === 0) throw new Error("제목 생성 실패. API 키와 선택된 AI를 확인해주세요.");
  return normalizeTitles(titles, keyword);
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
//fix
