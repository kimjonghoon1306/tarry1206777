export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, keyword, title, language = "ko", minChars = 1500, stylePrompt = "", adPlatform = "" } = req.body;
  if (!provider || !apiKey || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const langMap = {
    ko: "한국어", en: "English", ja: "日本語", zh: "中文",
    es: "Español", fr: "Français", de: "Deutsch", pt: "Português",
  };
  const langLabel = langMap[language] || "한국어";
  const targetChars = parseInt(minChars) || 1500;

  // max_tokens 글자수에 맞게 조정 (한국어 기준 1자 ≈ 1.5토큰)
  const maxTokens = Math.max(4000, Math.ceil(targetChars * 2));

  // 제목 지정 여부에 따라 프롬프트 다르게
  const titleInstruction = title
    ? `글 제목은 반드시 "${title}" 으로 시작해줘.`
    : `글 제목은 키워드 "${keyword}"를 포함한 클릭률 높은 제목으로 만들어줘.`;

  // 수익 플랫폼별 최적화 지침
  const adGuide = adPlatform === "adsense"
    ? "구글 애드센스 CPC 최적화: 클릭 유도 문구, 정보성 키워드 밀도 높게, 광고 친화적 단락 구성"
    : adPlatform === "adpost"
    ? "네이버 애드포스트 CPM 최적화: 체류 시간 늘리는 스토리 구성, 감성적 공감 유도, 이미지 설명 풍부하게"
    : "애드센스/애드포스트 통합 최적화";

  // 스타일 지침
  const styleGuide = stylePrompt
    ? `

[글쓰기 스타일]
${stylePrompt}`
    : "";

  const prompt = `당신은 ${langLabel} 블로그로 월 300만원 이상 수익을 내는 전문 블로거입니다.
아래 키워드로 독자가 처음부터 끝까지 읽고 싶은 글을 써주세요.

키워드: "${keyword}"
${titleInstruction}
수익 최적화: ${adGuide}

[필수 작성 원칙]
① 사람이 쓴 것처럼 자연스럽게
   - 1인칭 경험담: "저도 처음엔 몰랐는데요", "솔직히 말씀드리면", "직접 해봤더니"
   - 독자에게 말 걸기: "혹시 이런 경험 있으신가요?", "아마 많이 궁금하셨을 텐데"
   - 감탄/공감: "이게 진짜 신기했던 게", "저도 처음에 이거 보고 놀랐어요"
② 구체적인 정보 (막연한 표현 금지)
   - "좋다" → "3주 써보니 확실히 달라졌어요"
   - 실제 가격, 수치, 기간 포함
   - 단계별 방법 구체적으로
③ 읽고 싶은 구조
   - 짧은 문장과 긴 문장을 섞어 리듬감
   - 결론을 먼저 말하고 이유 설명
   - 중간중간 독자 참여 유도

[형식 규칙]
- 반드시 ${targetChars}자 이상 (가장 중요!)
- 마크다운 기호 절대 금지 (**, ##, --, __ 등)
- 순수 텍스트로만 작성
- 자연스러운 단락 구분
- SEO: 키워드 자연스럽게 7회 이상 포함
- 마지막 문단: 독자 행동 유도 (댓글, 공유, 북마크)
- 글자수 미달 시 실제 사례, 팁, Q&A 추가해서 반드시 채울 것${styleGuide}`;

  try {

    // ── Gemini ────────────────────────────────────────────
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
        const msg = (err.error?.message || "").toLowerCase();
        const status = resp.status;
        if (status === 429 || msg.includes("quota") || msg.includes("rate") || msg.includes("limit") || msg.includes("exhausted") || msg.includes("resource_exhausted")) {
          throw new Error("Gemini 무료 요청 한도 초과 (분당 또는 일일 한도). 1분 후 다시 시도하거나 Groq(무료)로 전환해보세요.");
        }
        if (msg.includes("api key") || msg.includes("api_key") || status === 400) throw new Error("Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.");
        if (status === 403) throw new Error("Gemini API 키 권한 없음. Google AI Studio에서 키를 확인해주세요.");
        throw new Error(`Gemini 오류 (${status}): ${err.error?.message || "알 수 없는 오류"}`);
      }
      const data = await resp.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!content) throw new Error("Gemini 응답이 비어있습니다. 잠시 후 다시 시도해주세요.");
      return res.json({ content });
    }

    // ── Claude ────────────────────────────────────────────
    if (provider === "claude") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("credit") || msg.includes("balance")) throw new Error("Claude 크레딧 부족. console.anthropic.com에서 충전해주세요.");
        if (msg.includes("api_key")) throw new Error("Claude API 키가 잘못되었습니다. 설정에서 확인해주세요.");
        throw new Error(`Claude 오류: ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({ content: data.content?.[0]?.text || "" });
    }

    // ── OpenAI ────────────────────────────────────────────
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
        const msg = err.error?.message || "";
        if (msg.includes("quota") || msg.includes("billing")) throw new Error("OpenAI 크레딧 부족. platform.openai.com에서 충전해주세요.");
        throw new Error(`OpenAI 오류: ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({ content: data.choices?.[0]?.message?.content || "" });
    }

    // ── Groq (완전 무료) ──────────────────────────────────
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
          max_tokens: Math.min(maxTokens, 8000), // Groq 최대 8000
          temperature: 0.7,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("rate_limit")) throw new Error("Groq 분당 요청 한도 초과. 잠시 후 다시 시도해주세요.");
        throw new Error(`Groq 오류: ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({ content: data.choices?.[0]?.message?.content || "" });
    }

    return res.status(400).json({ error: "지원하지 않는 AI입니다" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
