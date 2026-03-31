export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, keyword, title, language = "ko", minChars = 1500 } = req.body;
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

  const prompt = `다음 키워드로 애드센스/애드포스트 수익에 최적화된 블로그 글을 ${langLabel}로 작성해줘.

키워드: "${keyword}"
${titleInstruction}

조건:
- 반드시 ${targetChars}자 이상 작성 (이 조건이 가장 중요!)
- 마크다운 형식 사용 (# 제목, ## 소제목, **강조**, - 목록)
- 구성: 제목 → 서론(흥미 유발) → 본문(소제목 5개 이상) → 결론 → 마무리 문장
- SEO 최적화: 키워드 자연스럽게 5회 이상 포함
- 독자에게 실제 도움이 되는 구체적인 정보
- 숫자, 통계, 팁, 예시 적극 활용
- 글이 짧아지면 내용을 더 추가해서 반드시 ${targetChars}자를 채워줘`;

  try {

    // ── Gemini ────────────────────────────────────────────
    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
        const msg = err.error?.message || "";
        if (msg.includes("quota") || msg.includes("rate")) throw new Error("Gemini 무료 할당량 초과. Groq(무료)로 전환하거나 내일 다시 시도하세요.");
        if (msg.includes("API key")) throw new Error("Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.");
        throw new Error(`Gemini 오류: ${resp.status}`);
      }
      const data = await resp.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
