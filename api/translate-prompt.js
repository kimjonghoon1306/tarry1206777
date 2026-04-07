// BlogAuto Pro - translate-prompt v4.0
// 모든 주제 대응 + variation으로 다양한 이미지 생성

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { provider, apiKey, topic, variation = 0 } = req.body || {};
  if (!topic) return res.status(400).json({ error: "topic required" });
  if (!provider || !apiKey) return res.status(400).json({ error: "provider, apiKey required" });

  // variation에 따라 다른 각도의 이미지 요청
  const angles = [
    "the main subject/product of the topic",
    "the environment or setting where this topic takes place",
    "tools, equipment, or items related to this topic",
    "a result, outcome, or benefit of this topic",
    "a close-up detail or specific element of this topic",
  ];
  const angle = angles[variation % angles.length];

  const aiPrompt = `You are an expert image prompt writer for Stable Diffusion.

Given a Korean blog topic, create ONE specific English image prompt.
Focus on: ${angle}

STRICT RULES:
- English ONLY
- NO people, NO faces, NO persons
- Describe specific objects, scenery, or items
- Be very specific to the exact topic
- Maximum 12 words
- Output the prompt ONLY, no explanation, no quotes

EXAMPLES by topic type:
유튜브 알고리즘 (angle: main subject) → youtube studio ring light camera tripod recording desk
유튜브 알고리즘 (angle: environment) → modern content creator workspace monitor keyboard setup dark
유튜브 알고리즘 (angle: tools) → video editing software timeline screen monitor headphones
넷플릭스 요금제 (angle: main) → streaming service card subscription television remote dark room
잠잘자는법 (angle: environment) → cozy bedroom white pillow duvet soft lighting peaceful
주식 투자 (angle: tools) → stock chart graph candlestick trading monitor financial
제주도 여행 (angle: environment) → jeju island ocean volcanic rock cliff scenic blue sky
다이어트 (angle: result) → healthy meal prep salad bowl vegetables fresh colorful

Topic: ${topic}
Angle: ${angle}`;

  try {
    let generatedPrompt = "";

    if (provider === "gemini") {
      const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
      for (const model of models) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
                generationConfig: { maxOutputTokens: 60, temperature: 0.8 },
              }),
            }
          );
          if (!resp.ok) { if (resp.status === 429 || resp.status === 503) continue; break; }
          const data = await resp.json();
          const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
          if (text && text.length > 5) { generatedPrompt = text; break; }
        } catch { continue; }
      }
    }

    if (provider === "claude") {
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 60, messages: [{ role: "user", content: aiPrompt }] }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.content?.[0]?.text || "").trim(); }
      } catch {}
    }

    if (provider === "openai") {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: aiPrompt }], max_tokens: 60, temperature: 0.8 }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.choices?.[0]?.message?.content || "").trim(); }
      } catch {}
    }

    if (provider === "groq") {
      try {
        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: aiPrompt }], max_tokens: 60, temperature: 0.8 }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.choices?.[0]?.message?.content || "").trim(); }
      } catch {}
    }

    if (generatedPrompt && generatedPrompt.length > 5) {
      return res.json({ ok: true, prompt: cleanPrompt(generatedPrompt) });
    }

    return res.json({ ok: true, prompt: smartFallback(topic, variation) });

  } catch (e) {
    return res.json({ ok: true, prompt: smartFallback(topic, variation) });
  }
}

function cleanPrompt(text) {
  return text
    .replace(/^["'`→\-]+\s*/g, "")
    .replace(/["'`]+$/g, "")
    .replace(/\n.*/s, "")
    .replace(/^(prompt:|output:|result:|answer:)/i, "")
    .trim()
    .slice(0, 200);
}

// variation별로 다양한 폴백 프롬프트
function smartFallback(topic, variation = 0) {
  const t = topic.toLowerCase();
  const NP = "no people, no face";
  const v = variation % 4;

  // 유튜브/영상
  if (/유튜브|유튜버|채널|구독|조회수|쇼츠|알고리즘/.test(t)) {
    const opts = [
      `youtube camera ring light tripod studio setup, ${NP}, 8K`,
      `video editing monitor screen timeline software, ${NP}, 8K`,
      `microphone podcast equipment desk recording, ${NP}, 8K`,
      `subscriber growth analytics chart graph digital, ${NP}, 8K`,
    ];
    return opts[v];
  }
  // 넷플릭스/OTT
  if (/넷플릭스|왓챠|티빙|웨이브|ott|구독서비스/.test(t)) {
    const opts = [
      `television screen streaming service remote, ${NP}, 8K`,
      `popcorn couch living room entertainment night, ${NP}, 8K`,
      `subscription card phone app icons screen, ${NP}, 8K`,
      `movie series thumbnail grid streaming interface, ${NP}, 8K`,
    ];
    return opts[v];
  }
  // 주식/코인
  if (/주식|코인|비트코인|투자|etf|펀드/.test(t)) {
    const opts = [
      `stock market chart candlestick graph monitor, ${NP}, 8K`,
      `bitcoin gold coin cryptocurrency digital glow, ${NP}, 8K`,
      `financial document calculator coins investment, ${NP}, 8K`,
      `trading desk multiple monitors analytics, ${NP}, 8K`,
    ];
    return opts[v];
  }
  // 건강/수면
  if (/수면|잠|불면증|숙면/.test(t)) {
    const opts = [
      `cozy bedroom white pillow duvet peaceful night, ${NP}, 8K`,
      `sleep mask lavender chamomile tea bedside, ${NP}, 8K`,
      `calm bedroom soft lighting moon window, ${NP}, 8K`,
      `alarm clock pillow white sheets morning light, ${NP}, 8K`,
    ];
    return opts[v];
  }
  // 맛집/음식
  if (/맛집|음식|요리|카페|식당|커피/.test(t)) {
    const opts = [
      `delicious food beautiful plating restaurant, ${NP}, 8K`,
      `cozy cafe interior coffee latte art warm, ${NP}, 8K`,
      `cooking ingredients fresh vegetables kitchen, ${NP}, 8K`,
      `restaurant menu food close up detail, ${NP}, 8K`,
    ];
    return opts[v];
  }
  // 여행
  if (/여행|관광|제주|부산|해외/.test(t)) {
    const opts = [
      `scenic travel destination landscape golden hour, ${NP}, 8K`,
      `hotel room interior elegant bed view, ${NP}, 8K`,
      `suitcase passport travel map planning, ${NP}, 8K`,
      `local food market souvenir shop street, ${NP}, 8K`,
    ];
    return opts[v];
  }
  // 다이어트/운동
  if (/다이어트|헬스|운동|피트니스/.test(t)) {
    const opts = [
      `healthy meal salad vegetables bowl colorful, ${NP}, 8K`,
      `gym dumbbells weights fitness equipment, ${NP}, 8K`,
      `measuring tape scale healthy lifestyle, ${NP}, 8K`,
      `water bottle workout towel mat training, ${NP}, 8K`,
    ];
    return opts[v];
  }

  // 범용 폴백
  return `${topic.split(' ')[0]} concept object minimal white background, ${NP}, professional photography, 8K`;
}
