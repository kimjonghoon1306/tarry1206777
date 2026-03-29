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
  if (!provider || !apiKey || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const prompt = `"${keyword}" 키워드로 애드센스/애드포스트 수익에 최적화된 블로그 글 제목 10개를 생성해줘.
조건:
- 클릭률(CTR)이 높은 제목
- 숫자 포함 (TOP 10, 5가지, 2026 등)
- 궁금증 유발 또는 정보성 제목
- 한국어
- JSON 배열로만 응답 (다른 텍스트 없이): ["제목1", "제목2", ...]`;

  try {
    let content = "";

    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
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
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
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
      const data = await resp.json();
      content = data.choices?.[0]?.message?.content || "[]";
    }

    const clean = content.replace(/```json|```/g, "").trim();
    const titles = JSON.parse(clean);
    return res.json({ titles });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
