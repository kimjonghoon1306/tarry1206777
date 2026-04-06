// BlogAuto Pro - translate-prompt v1.0
// 한국어 블로그 주제 → 영문 이미지 생성 프롬프트 전용 API
// 어떤 주제든 주제에 맞는 시각적 장면으로 변환

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, topic } = req.body;
  if (!provider || !apiKey || !topic) {
    return res.status(400).json({ error: "필수 파라미터 누락 (provider, apiKey, topic)" });
  }

  // 전용 번역 프롬프트 - 어떤 주제든 시각적 장면으로
  const systemPrompt = `You are an expert image prompt engineer for AI image generators (Stable Diffusion, Flux, DALL-E).
Your task: Convert ANY Korean blog topic into a vivid, specific English image generation prompt.

Rules:
1. CAREFULLY analyze the Korean topic's EXACT meaning and subject matter
2. Describe a CONCRETE visual scene that DIRECTLY represents the topic
3. If topic is about food → show that specific food
4. If topic is about people/jobs → show relevant people in context
5. If topic is about places → show that location
6. If topic is about health/fitness → show relevant activities
7. If topic is about money/finance → show financial context
8. Include: main subject, environment/setting, mood/atmosphere, lighting
9. Make it photorealistic and blog-thumbnail-worthy
10. MAXIMUM 35 words
11. Output ONLY the English prompt - nothing else, no quotes, no explanation
12. NEVER output Korean characters
13. NEVER use generic images that don't match the topic

Examples:
- "사회초년생 절약법" → "young Korean office worker counting coins at desk, piggy bank, budget notebook, warm home lighting, hopeful atmosphere"
- "강남 맛집 추천" → "upscale Korean restaurant in Gangnam, beautifully plated Korean dishes, warm ambient lighting, elegant interior"
- "경력단절여성 취업" → "Korean woman in professional attire preparing resume, laptop, job interview setting, determined expression, bright office"
- "배달음식 꿀팁" → "Korean delivery food spread on table, smartphone with delivery app, chopsticks, cozy home setting, evening atmosphere"
- "겨울 여행지" → "scenic Korean winter landscape, snow-covered mountains, traditional village, golden hour, travel photography style"
- "주식 투자 초보" → "stock market charts on monitor, Korean investor taking notes, financial books, modern home office, focused atmosphere"
- "강아지 훈련" → "Korean person training adorable dog outdoors, treat reward, sunny park, bonding moment, warm afternoon light"
- "다이어트 식단" → "healthy Korean meal prep bowls, fresh vegetables, lean protein, clean kitchen counter, bright natural lighting"`;

  const userMsg = `Korean blog topic: "${topic}"\n\nConvert to English image prompt:`;

  try {
    // Gemini - 폴백 체인
    if (provider === "gemini") {
      const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b"];
      for (const model of MODELS) {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: [{ text: userMsg }] }],
              generationConfig: { maxOutputTokens: 100, temperature: 0.7 },
            }),
          }
        );
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          const httpStatus = resp.status;
          const msg2 = (err.error?.message || "").toLowerCase();
          if (httpStatus === 429 || httpStatus === 503 || msg2.includes("quota") || msg2.includes("exhausted") || msg2.includes("rate") || msg2.includes("limit") || msg2.includes("overloaded") || msg2.includes("capacity")) continue;
          throw new Error(`Gemini 오류 (${httpStatus}): ${err.error?.message || ""}`);
        }
        const data = await resp.json();
        const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim()
          .replace(/[가-힣]/g, "").replace(/^["']|["']$/g, "").trim();
        if (text && text.length > 5) return res.json({ ok: true, prompt: text });
      }
      throw new Error("Gemini 모든 모델 한도 초과");
    }

    // Groq
    if (provider === "groq") {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMsg },
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(`Groq 오류: ${e.error?.message || resp.status}`); }
      const data = await resp.json();
      const text = (data.choices?.[0]?.message?.content || "").trim()
        .replace(/[가-힣]/g, "").replace(/^["']|["']$/g, "").trim();
      if (text && text.length > 5) return res.json({ ok: true, prompt: text });
      throw new Error("빈 응답");
    }

    // Claude
    if (provider === "claude") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 100,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(`Claude 오류: ${e.error?.message || resp.status}`); }
      const data = await resp.json();
      const text = (data.content?.[0]?.text || "").trim()
        .replace(/[가-힣]/g, "").replace(/^["']|["']$/g, "").trim();
      if (text && text.length > 5) return res.json({ ok: true, prompt: text });
      throw new Error("빈 응답");
    }

    // OpenAI
    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(`OpenAI 오류: ${e.error?.message || resp.status}`); }
      const data = await resp.json();
      const text = (data.choices?.[0]?.message?.content || "").trim()
        .replace(/[가-힣]/g, "").replace(/^["']|["']$/g, "").trim();
      if (text && text.length > 5) return res.json({ ok: true, prompt: text });
      throw new Error("빈 응답");
    }

    return res.status(400).json({ error: "지원하지 않는 provider" });

  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
//fix
