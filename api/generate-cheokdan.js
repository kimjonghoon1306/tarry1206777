// BlogAuto Pro - generate-cheokdan v1.0
// 네이버 블로그 체험단 전용 글 생성 API

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, shopName, region, category, visitDate, companions,
    menus, tasteStar, atmosphereStar, serviceStar, highlight, weakness } = req.body;

  if (!shopName || !apiKey || !provider) {
    return res.status(400).json({ error: "필수 정보가 누락되었습니다." });
  }

  const menuText = (menus || []).filter(m => m.name).map(m =>
    m.price ? `${m.name} (${m.price}원)` : m.name
  ).join(", ");

  const starToText = (n) => ["★☆☆☆☆","★★☆☆☆","★★★☆☆","★★★★☆","★★★★★"][Math.min(Math.max((n||3)-1,0),4)];

  const prompt = `당신은 한국 네이버 블로그 체험단 전문 작가입니다. 아래 정보를 바탕으로 자연스럽고 감성적인 체험단 블로그 포스팅을 작성해주세요.

[가게 정보]
- 가게명: ${shopName}
- 지역: ${region || ""}
- 업종: ${category || ""}
- 방문일: ${visitDate || ""}
- 동반인: ${companions || ""}
- 주문 메뉴: ${menuText || ""}
- 맛 평점: ${starToText(tasteStar)} (${tasteStar || 3}/5)
- 분위기 평점: ${starToText(atmosphereStar)} (${atmosphereStar || 3}/5)
- 서비스 평점: ${starToText(serviceStar)} (${serviceStar || 3}/5)
- 특별했던 점: ${highlight || ""}
- 아쉬운 점: ${weakness || "없음"}

[작성 규칙]
1. 친근하고 따뜻한 1인칭 구어체 (예: ~였어요, ~더라고요, ~하더라고요, ~답니다)
2. 실제 방문자가 쓴 것처럼 자연스럽고 생생하게
3. 소제목은 반드시 ## 형식으로 4~5개 작성
4. 맛, 분위기, 서비스를 구체적으로 묘사
5. 가격 정보 자연스럽게 포함
6. 재방문 의사와 추천 여부로 마무리
7. FAQ, 참고자료, 관련글 절대 작성 금지
8. [이미지] 마커 절대 넣지 말 것
9. 총 글자수 1200~1800자
10. 마지막 줄에 해시태그 (예: #${shopName} #${region || ""}맛집 #${category || ""} #네이버블로그 #체험단)

지금 바로 블로그 포스팅을 작성해주세요:`;

  try {
    let content = "";

    // ── Gemini ────────────────────────────────────────────────
    if (provider === "gemini") {
      const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"];
      let ok = false;
      for (const model of models) {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 2048, temperature: 0.8 },
              }),
            }
          );
          if (!r.ok) continue;
          const d = await r.json();
          const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) { content = t; ok = true; break; }
        } catch {}
      }
      if (!ok) throw new Error("Gemini 호출 실패. API 키를 확인해주세요.");
    }

    // ── Claude ────────────────────────────────────────────────
    else if (provider === "claude") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!r.ok) throw new Error("Claude API 오류");
      const d = await r.json();
      content = d.content?.[0]?.text || "";
    }

    // ── OpenAI ────────────────────────────────────────────────
    else if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.8,
        }),
      });
      if (!r.ok) throw new Error("OpenAI API 오류");
      const d = await r.json();
      content = d.choices?.[0]?.message?.content || "";
    }

    // ── Groq ──────────────────────────────────────────────────
    else if (provider === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.8,
        }),
      });
      if (!r.ok) throw new Error("Groq API 오류");
      const d = await r.json();
      content = d.choices?.[0]?.message?.content || "";
    }

    else {
      throw new Error(`지원하지 않는 AI 제공자: ${provider}`);
    }

    if (!content) throw new Error("AI 응답이 비어있습니다.");
    return res.json({ content });

  } catch (e) {
    return res.status(500).json({ error: e.message || "글 생성 중 오류가 발생했습니다." });
  }
}
