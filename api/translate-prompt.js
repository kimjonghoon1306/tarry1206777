// BlogAuto Pro - translate-prompt v3.0
// 모든 주제에 대응: AI 생성 → 스마트 폴백

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { provider, apiKey, topic } = req.body || {};
  if (!topic) return res.status(400).json({ error: "topic required" });
  if (!provider || !apiKey) return res.status(400).json({ error: "provider, apiKey required" });

  const aiPrompt = `You are an expert image prompt writer for Stable Diffusion.
Given ANY Korean blog topic, output ONE English image prompt describing objects/scenery.
RULES: English only, NO people NO faces, specific objects, max 15 words, output prompt only no quotes.
EXAMPLES:
유튜브 알고리즘 → youtube studio camera ring light tripod microphone desk equipment
넷플릭스 요금제 → streaming television remote subscription card screen
잠잘자는법 → cozy bedroom pillow white sheets sleep mask peaceful night
주식 투자 → stock market chart graph trading monitor financial growth
제주도 여행 → jeju island volcanic rock beach ocean cliff scenic
강아지 훈련 → dog training treats clicker leash collar pet equipment
빵 만들기 → artisan bread baking flour dough oven wooden board
Now write for: ${topic}`;

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
                generationConfig: { maxOutputTokens: 80, temperature: 0.6 },
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
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 80, messages: [{ role: "user", content: aiPrompt }] }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.content?.[0]?.text || "").trim(); }
      } catch {}
    }

    if (provider === "openai") {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: aiPrompt }], max_tokens: 80, temperature: 0.6 }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.choices?.[0]?.message?.content || "").trim(); }
      } catch {}
    }

    if (provider === "groq") {
      try {
        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: aiPrompt }], max_tokens: 80, temperature: 0.6 }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.choices?.[0]?.message?.content || "").trim(); }
      } catch {}
    }

    if (generatedPrompt && generatedPrompt.length > 5) {
      return res.json({ ok: true, prompt: cleanPrompt(generatedPrompt) });
    }

    return res.json({ ok: true, prompt: smartFallback(topic) });

  } catch (e) {
    return res.json({ ok: true, prompt: smartFallback(topic) });
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

function smartFallback(topic) {
  const t = topic.toLowerCase();
  const NP = "no people, no face, object focused";
  if (/유튜브|유튜버|채널|구독|조회수|쇼츠|알고리즘/.test(t)) return `youtube studio camera ring light tripod microphone desk, ${NP}, 8K`;
  if (/넷플릭스|왓챠|티빙|웨이브|ott/.test(t)) return `streaming television remote subscription screen couch, ${NP}, 8K`;
  if (/블로그|포스팅|seo|네이버|티스토리/.test(t)) return `laptop keyboard writing desk coffee notebook blog, ${NP}, 8K`;
  if (/ai|인공지능|챗gpt|머신러닝/.test(t)) return `artificial intelligence circuit board chip technology, ${NP}, 8K`;
  if (/코딩|프로그래밍|개발|파이썬/.test(t)) return `code screen laptop dark terminal programming keyboard, ${NP}, 8K`;
  if (/주식|코인|비트코인|투자|etf/.test(t)) return `stock market chart graph trading monitor financial, ${NP}, 8K`;
  if (/재테크|절약|저축|가계부|통장/.test(t)) return `coins piggy bank savings jar budget document, ${NP}, 8K`;
  if (/부동산|아파트|전세|월세|청약/.test(t)) return `apartment building real estate document keys, ${NP}, 8K`;
  if (/맛집|음식|요리|카페|식당/.test(t)) return `delicious food beautiful plating restaurant table, ${NP}, 8K`;
  if (/여행|관광|해외|제주|부산/.test(t)) return `travel scenic landscape landmark golden hour, ${NP}, 8K`;
  if (/다이어트|헬스|운동|피트니스/.test(t)) return `healthy food salad gym equipment weights, ${NP}, 8K`;
  if (/건강|병원|약|수면|탈모/.test(t)) return `health vitamins supplements capsules natural, ${NP}, 8K`;
  if (/스킨케어|뷰티|화장품|메이크업/.test(t)) return `skincare beauty products bottles cream elegant, ${NP}, 8K`;
  if (/패션|옷|코디|쇼핑/.test(t)) return `fashion clothing outfit display rack modern, ${NP}, 8K`;
  if (/공부|시험|수능|자격증/.test(t)) return `study books notebook desk lamp stationery, ${NP}, 8K`;
  if (/취업|이직|면접|직장/.test(t)) return `resume briefcase office laptop professional, ${NP}, 8K`;
  if (/육아|아기|임신|출산/.test(t)) return `baby toys nursery crib stroller soft pastel, ${NP}, 8K`;
  if (/자동차|전기차|중고차/.test(t)) return `car automobile road exterior modern sleek, ${NP}, 8K`;
  if (/강아지|고양이|반려동물/.test(t)) return `cute pet dog cat indoor toy cozy home`;
  if (/인테리어|홈|거실|청소/.test(t)) return `modern interior design minimalist furniture, ${NP}, 8K`;
  if (/결혼|웨딩|신혼/.test(t)) return `wedding flowers rings decoration elegant venue, ${NP}, 8K`;
  if (/정부지원|지원금|복지/.test(t)) return `government document form pen official desk, ${NP}, 8K`;
  if (/it|테크|스마트폰|노트북/.test(t)) return `technology device smartphone laptop modern, ${NP}, 8K`;
  if (/창업|스타트업|마케팅/.test(t)) return `startup business office strategy board growth, ${NP}, 8K`;
  const mainWord = topic.replace(/[^가-힣a-zA-Z0-9\s]/g, " ").trim().split(/\s+/)[0] || "lifestyle";
  return `${mainWord} concept object flat lay minimal white background, ${NP}, professional photography, 8K`;
}
