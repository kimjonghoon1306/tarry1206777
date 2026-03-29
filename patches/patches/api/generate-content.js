export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, keyword, language = "ko" } = req.body;
  if (!provider || !apiKey || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const langMap = { ko: "한국어", en: "English", ja: "日本語", zh: "中文" };
  const langLabel = langMap[language] || "한국어";

  const prompt = `다음 키워드로 SEO에 최적화된 블로그 글을 ${langLabel}로 2000자 이상 작성해줘.
키워드: "${keyword}"
조건:
- 마크다운 형식 (##, ###, **강조** 사용)
- 제목, 소제목, 본문, 결론 구조
- 독자에게 실제 도움이 되는 내용
- 자연스러운 키워드 포함`;

  try {
    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      return res.json({ content: data.candidates?.[0]?.content?.parts?.[0]?.text || "" });
    }

    if (provider === "claude") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      return res.json({ content: data.content?.[0]?.text || "" });
    }

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
          max_tokens: 4000,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      return res.json({ content: data.choices?.[0]?.message?.content || "" });
    }

    return res.status(400).json({ error: "지원하지 않는 provider" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
