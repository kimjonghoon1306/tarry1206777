export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: "Invalid JSON" }); }
  }

  const { provider, apiKey, keyword } = body;
  if (!provider || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }
  if (!apiKey) {
    return res.status(400).json({ error: "API 키가 없습니다. 설정 페이지에서 API 키를 입력해주세요." });
  }

  const prompt = `"${keyword}" 키워드로 애드센스/애드포스트 수익에 최적화된 블로그 글 제목 10개를 생성해줘.
조건:
- 클릭률(CTR)이 높은 제목
- 숫자 포함 (TOP 10, 5가지, 2026 등)
- 궁금증 유발 또는 정보성 제목
- 한국어
- 반드시 JSON 배열로만 응답 (다른 텍스트 없이): ["제목1", "제목2", ...]`;

  // JSON 배열 안전 추출 - 어떤 형태로 와도 처리
  function extractTitles(text) {
    try {
      const clean = text.replace(/```json|```/gi, "").trim();
      // JSON 배열 패턴 추출
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed.filter(t => typeof t === "string");
      }
      // 전체 파싱 시도
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) return parsed.filter(t => typeof t === "string");
    } catch {}
    return [];
  }

  try {
    let content = "";

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
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    } else if (provider === "claude") {
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
        const msg = err.error?.message || "";
        if (msg.includes("credit") || msg.includes("balance")) throw new Error("Claude 크레딧 부족. console.anthropic.com에서 충전해주세요.");
        if (msg.includes("api_key") || msg.includes("authentication")) throw new Error("Claude API 키가 잘못되었습니다. 설정에서 확인해주세요.");
        throw new Error(`Claude 오류: ${resp.status}`);
      }
      const data = await resp.json();
      content = data.content?.[0]?.text || "[]";

    } else if (provider === "openai") {
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
        const msg = err.error?.message || "";
        if (msg.includes("quota") || msg.includes("billing")) throw new Error("OpenAI 크레딧 부족. platform.openai.com에서 충전해주세요.");
        if (msg.includes("api_key") || msg.includes("Incorrect")) throw new Error("OpenAI API 키가 잘못되었습니다. 설정에서 확인해주세요.");
        throw new Error(`OpenAI 오류: ${resp.status}`);
      }
      const data = await resp.json();
      content = data.choices?.[0]?.message?.content || "[]";

    } else if (provider === "groq") {
      // Groq - 완전 무료 (Llama 3.3 70B, 하루 14,400회)
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
        throw new Error(`Groq 오류: ${err.error?.message || resp.status}`);
      }
      const data = await resp.json();
      content = data.choices?.[0]?.message?.content || "[]";

    } else {
      throw new Error(`지원하지 않는 AI: ${provider}`);
    }

    const titles = extractTitles(content);
    if (titles.length === 0) {
      return res.status(500).json({ error: "제목 추출 실패. API 키와 선택된 AI를 확인해주세요." });
    }
    return res.json({ titles });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
