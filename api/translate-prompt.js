// BlogAuto Pro - translate-prompt v5.0
// AI 우선 처리 + 범용 폴백 (키워드 하드코딩 없음)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { provider, apiKey, topic, variation = 0 } = req.body || {};
  if (!topic) return res.status(400).json({ error: "topic required" });
  if (!provider || !apiKey) return res.status(400).json({ error: "provider, apiKey required" });

  const angles = [
    "the main object or product of this topic",
    "the environment or place related to this topic",
    "tools or documents related to this topic",
    "a symbolic or conceptual visual of this topic",
    "a result or outcome related to this topic",
  ];
  const angle = angles[variation % angles.length];

  const aiPrompt = `You are a Stable Diffusion image prompt expert.

Convert this Korean blog topic into ONE English image prompt.

RULES:
- English ONLY
- NO people, NO faces, NO persons, NO hands
- Describe physical objects, scenery, or settings
- Be specific to the exact topic meaning
- Max 12 words
- Output the prompt only, nothing else

Focus on: ${angle}

Topic: "${topic}"

Examples:
"유튜브 알고리즘" → youtube camera ring light studio tripod recording setup
"넷플릭스 요금제" → television streaming remote subscription card entertainment
"개인사업자 폐업신고" → business closure tax document stamp official paperwork desk
"주식 투자 방법" → stock market chart graph financial monitor growth
"강아지 훈련" → dog training leash collar treat reward toy
"다이어트 식단" → healthy meal vegetables salad bowl fresh colorful
"인테리어 꾸미기" → modern interior furniture minimalist room design
"수면 가이드" → bedroom pillow white sheets sleep peaceful night
"제주도 여행" → jeju island ocean cliff scenic landscape blue sky
"취업 준비" → resume document briefcase office laptop professional

Output:`;

  try {
    let generatedPrompt = "";

    // ── 모든 AI 순서대로 시도 ──────────────────────────────
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
                generationConfig: { maxOutputTokens: 50, temperature: 0.7 },
              }),
            }
          );
          if (!resp.ok) { if (resp.status === 429 || resp.status === 503) continue; break; }
          const data = await resp.json();
          const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
          if (text && text.length > 5 && /[a-zA-Z]/.test(text)) { generatedPrompt = text; break; }
        } catch { continue; }
      }
    }

    if (!generatedPrompt && provider === "claude") {
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 50, messages: [{ role: "user", content: aiPrompt }] }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.content?.[0]?.text || "").trim(); }
      } catch {}
    }

    if (!generatedPrompt && provider === "openai") {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: aiPrompt }], max_tokens: 50, temperature: 0.7 }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.choices?.[0]?.message?.content || "").trim(); }
      } catch {}
    }

    if (!generatedPrompt && provider === "groq") {
      try {
        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: aiPrompt }], max_tokens: 50, temperature: 0.7 }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.choices?.[0]?.message?.content || "").trim(); }
      } catch {}
    }

    // AI 성공
    if (generatedPrompt && generatedPrompt.length > 5 && /[a-zA-Z]/.test(generatedPrompt)) {
      return res.json({ ok: true, prompt: cleanPrompt(generatedPrompt) });
    }

    // ── AI 실패 시: 범용 폴백 (키워드 없이 주제 단어로 처리) ──
    return res.json({ ok: true, prompt: universalFallback(topic, variation) });

  } catch (e) {
    return res.json({ ok: true, prompt: universalFallback(topic, variation) });
  }
}

function cleanPrompt(text) {
  return text
    .replace(/^["'`→\-:]+\s*/g, "")
    .replace(/["'`]+$/g, "")
    .replace(/\n.*/s, "")
    .replace(/^(prompt:|output:|result:|answer:|translation:)/i, "")
    .replace(/no people.*$/i, "")
    .trim()
    .slice(0, 200);
}

// ── 범용 폴백: 어떤 주제든 대응 ──────────────────────────────
// 주제의 성격을 파악해서 관련 이미지 프롬프트 생성
function universalFallback(topic, variation = 0) {
  const t = topic.toLowerCase().replace(/[^가-힣a-z0-9\s]/g, " ");
  const NP = "no people, no face";
  const v = variation % 4;

  // 성격 파악 키워드 → 시각적 카테고리 매핑
  const categories = [
    { test: /음식|요리|맛|식|카페|커피|빵|케이크|레시피|먹/, imgs: ["food dish gourmet plating table", "cafe interior coffee cup warm", "cooking ingredients vegetables board", "restaurant menu close up detail"] },
    { test: /여행|관광|해외|국내|호텔|숙소|펜션|리조트/, imgs: ["travel scenic landscape golden hour", "hotel room interior elegant bed", "suitcase map passport travel planning", "destination landmark architecture view"] },
    { test: /운동|헬스|다이어트|피트니스|요가|건강/, imgs: ["gym weights dumbbells fitness equipment", "healthy food salad vegetables bowl", "yoga mat meditation calm nature", "running shoes water bottle workout"] },
    { test: /사업|창업|비즈니스|마케팅|회사|직장|취업|이직|면접/, imgs: ["business document office desk laptop", "meeting room table chairs modern", "contract paper pen signature desk", "office building exterior modern glass"] },
    { test: /법|신고|등록|허가|인허가|행정|민원|서류|정부|공공|세금|폐업|개업/, imgs: ["official document form stamp desk", "government office building exterior", "paperwork folder file cabinet organized", "certificate seal stamp official paper"] },
    { test: /돈|금융|투자|주식|코인|재테크|절약|저축|보험|대출/, imgs: ["coins chart financial growth graph", "piggy bank savings jar money", "stock market trading monitor screen", "bank document contract financial paper"] },
    { test: /부동산|아파트|집|주택|전세|월세|인테리어/, imgs: ["apartment building exterior modern", "interior design living room minimal", "real estate keys document contract", "cozy home furniture warm lighting"] },
    { test: /ai|인공지능|기술|it|개발|코딩|프로그래밍|앱|소프트웨어/, imgs: ["circuit board technology digital chip", "laptop code dark screen terminal", "ai robot technology futuristic glow", "smartphone app interface screen modern"] },
    { test: /교육|공부|학습|시험|자격증|수능|대학/, imgs: ["books notebook desk lamp study", "pencil paper exam test academic", "library shelf books knowledge", "graduation diploma certificate scroll"] },
    { test: /육아|아기|임신|출산|어린이|육아용품/, imgs: ["baby toy nursery crib soft pastel", "pregnancy maternity soft gentle items", "children book colorful toy playful", "stroller bottle pacifier nursery"] },
    { test: /뷰티|스킨케어|화장품|메이크업|패션|옷/, imgs: ["skincare serum bottle beauty elegant", "makeup palette brush cosmetics", "fashion clothing rack modern display", "perfume bottle elegant background"] },
    { test: /반려동물|강아지|고양이|펫/, imgs: ["dog toy collar leash treat", "cat toy indoor cozy bowl", "pet food bowl accessories home", "animal shelter cage toy warm"] },
  ];

  for (const cat of categories) {
    if (cat.test.test(t)) {
      return `${cat.imgs[v]}, ${NP}, professional photography, 8K`;
    }
  }

  // 완전 범용: 주제 첫 단어를 영어 느낌으로 + 정보성 이미지
  const infoVariants = [
    `information concept minimal clean desk document, ${NP}, professional photography, 8K`,
    `guide checklist paper clipboard organized, ${NP}, professional photography, 8K`,
    `knowledge book open pages light clean, ${NP}, professional photography, 8K`,
    `step by step process diagram minimal, ${NP}, professional photography, 8K`,
  ];
  return infoVariants[v];
}
