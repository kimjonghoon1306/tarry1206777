// BlogAuto Pro - generate-titles v1.0
// Gemini CORS 우회용 제목 생성 API
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, keyword } = req.body;
  if (!provider || !apiKey || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락 (provider, apiKey, keyword)" });
  }

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
- 반드시 JSON 배열로만 응답 (다른 텍스트 없이): ["제목1", "제목2", ...]`;

  function extractTitles(text) {
    try {
      const clean = text.replace(/```json|```/gi, "").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed.filter(t => typeof t === "string");
      }
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) return parsed.filter(t => typeof t === "string");
    } catch {}
    return [];
  }

  try {
    // ── Gemini ──────────────────────────────────────────────
    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        if (status === 429 || msg.includes("quota") || msg.includes("rate") || msg.includes("exhausted")) {
          throw new Error("Gemini 요청 한도 초과. 잠시 후 다시 시도하거나 Groq으로 전환해보세요.");
        }
        if (msg.includes("api key") || status === 400) throw new Error("Gemini API 키가 잘못되었습니다.");
        if (status === 403) throw new Error("Gemini API 키 권한 없음.");
        throw new Error(`Gemini 오류 (${status}): ${err.error?.message || "알 수 없는 오류"}`);
      }
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const titles = extractTitles(text);
      if (titles.length === 0) throw new Error("Gemini 제목 생성 실패. 다시 시도해주세요.");
      return res.json({ titles });
    }

    // ── OpenAI ──────────────────────────────────────────────
    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`OpenAI 오류 (${resp.status}): ${err.error?.message || ""}`);
      }
      const data = await resp.json();
      const titles = extractTitles(data.choices?.[0]?.message?.content || "[]");
      if (titles.length === 0) throw new Error("OpenAI 제목 생성 실패.");
      return res.json({ titles });
    }

    // ── Groq ────────────────────────────────────────────────
    if (provider === "groq") {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.8,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`Groq 오류 (${resp.status}): ${err.error?.message || ""}`);
      }
      const data = await resp.json();
      const titles = extractTitles(data.choices?.[0]?.message?.content || "[]");
      if (titles.length === 0) throw new Error("Groq 제목 생성 실패.");
      return res.json({ titles });
    }

    // ── Claude ──────────────────────────────────────────────
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
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`Claude 오류 (${resp.status}): ${err.error?.message || ""}`);
      }
      const data = await resp.json();
      const titles = extractTitles(data.content?.[0]?.text || "[]");
      if (titles.length === 0) throw new Error("Claude 제목 생성 실패.");
      return res.json({ titles });
    }

    return res.status(400).json({ error: "지원하지 않는 AI입니다" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
