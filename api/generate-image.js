import type { VercelRequest, VercelResponse } from "@vercel/node";

type TopicScene = {
  category: string;
  anchor: string;
  scene: string;
  extra: string[];
};

const BASE_NEGATIVE = [
  "no people",
  "no person",
  "no human",
  "no portrait",
  "no face",
  "no hands",
  "no crowd",
  "no selfie",
  "no group photo",
  "no abstract concept",
  "no symbolic image",
  "no metaphor",
  "no generic lifestyle photo",
  "no stock mood photo",
  "no unrelated desk props",
  "no infographic",
  "no diagram",
  "no chart",
  "no graph",
  "no screenshot",
  "no UI",
  "no app screen",
  "no dashboard",
  "no text",
  "no letters",
  "no watermark",
  "no logo",
  "no poster",
  "no banner",
  "no cartoon",
  "no illustration",
  "no 3d render",
].join(", ");

function cleanText(value: string): string {
  return (value || "").replace(/\s+/g, " ").replace(/[“”"'`]/g, "").trim();
}


function extractTitleKeywords(topic: string): string[] {
  const raw = cleanText(topic)
    .split(/[\s,\/|:;·()\[\]{}!?]+/)
    .map(v => v.trim())
    .filter(Boolean);

  const stopwords = new Set([
    "추천","가이드","정리","방법","후기","리뷰","비교","뜻","의미","총정리","완벽정리","완전정복","꿀팁","팁","정보","소개","설명","알아보기","체크","주의사항","준비물","활용법","사용법","best","top","how","guide","review","tips","info","article"
  ]);

  const out: string[] = [];
  for (const token of raw) {
    const t = token.toLowerCase();
    if (stopwords.has(t)) continue;
    if (token.length < 2) continue;
    if (!out.includes(token)) out.push(token);
    if (out.length >= 5) break;
  }
  return out;
}

function classifyTopic(topic: string): TopicScene {
  const t = cleanText(topic).toLowerCase();
  const keywords = extractTitleKeywords(topic);
  const keywordHint = keywords.length ? `visible subject cues: ${keywords.join(", ")}` : "";

  if (/레시피|요리|음식|맛집|식단|도시락|반찬|디저트|브런치|커피|카페|치킨|피자|라면|파스타|샐러드|스테이크|빵|케이크/.test(t)) {
    return {
      category: "food",
      anchor: "finished dish from the article title must be clearly visible and fill the frame",
      scene: "single plated meal on a table or kitchen counter, only relevant ingredients or cookware if directly tied to the title",
      extra: [keywordHint, "food only", "single scene only", "dish is the hero subject", "no people", "no face"].filter(Boolean),
    };
  }

  if (/숙소|호텔|펜션|리조트|여행|관광|제주|서울|부산|강원|경주|전주|여수|속초|해외여행|국내여행|공항|비행기|랜드마크/.test(t)) {
    return {
      category: "travel",
      anchor: "the place, room, or destination from the article title must be clearly visible",
      scene: "real accommodation interior, landmark, landscape, transport, or travel environment directly matching the title",
      extra: [keywordHint, "literal place depiction", "single scene only"].filter(Boolean),
    };
  }

  if (/부동산|전세|월세|청약|분양|아파트|원룸|오피스텔|빌라|임대|주택|집|방|인테리어|리모델링|이사/.test(t)) {
    return {
      category: "real_estate",
      anchor: "the property, room, contract, or housing object from the article title must be clearly visible",
      scene: "room interior, apartment exterior, keys with contract paper, renovation materials, or moving boxes directly matching the title",
      extra: [keywordHint, "real property context only", "single scene only", "no people"].filter(Boolean),
    };
  }

  if (/대출|금융|재테크|주식|코인|경제|세금|보험|연금|신용점수|카드|지원금|정부지원|연말정산|돈|절약|저축|예산/.test(t)) {
    return {
      category: "finance",
      anchor: "the financial object or document from the article title must be clearly visible",
      scene: "calculator, bill, contract paper, coins, card, budget notebook, savings jar, or market monitor setup directly tied to the title",
      extra: [keywordHint, "object-focused finance scene", "single scene only", "no portrait"].filter(Boolean),
    };
  }

  if (/건강|운동|다이어트|헬스|요가|필라테스|영양제|스킨케어|피부|탈모|건강식|병원|약|수면|뷰티|메이크업|화장품/.test(t)) {
    return {
      category: "health_beauty",
      anchor: "the health, skincare, or wellness subject from the article title must be clearly visible",
      scene: "healthy meal, supplement bottle, dumbbell, yoga mat, skincare bottle, medicine pack, or wellness setup matching the title",
      extra: [keywordHint, "object-focused wellness scene", "single scene only", "no portrait"].filter(Boolean),
    };
  }

  if (/ai|챗gpt|인공지능|앱|스마트폰|노트북|컴퓨터|유튜브|블로그|코딩|프로그래밍|개발|it|소셜미디어|게임|웹사이트|자동화|툴|소프트웨어/.test(t)) {
    return {
      category: "tech",
      anchor: "the device, workspace, or software-related subject from the article title must be clearly visible",
      scene: "laptop, phone, monitor, keyboard, creator desk, code screen, AI workspace, or digital tool setup directly matching the title",
      extra: [keywordHint, "device-focused setup", "single scene only", "no people"].filter(Boolean),
    };
  }

  if (/강아지|고양이|반려동물|펫|햄스터/.test(t)) {
    return {
      category: "pet",
      anchor: "the pet from the article title must be clearly visible",
      scene: "single pet subject in a realistic home, care, play, or feeding environment that matches the title",
      extra: [keywordHint, "single scene only"].filter(Boolean),
    };
  }

  if (/패션|쇼핑|명품|코디|옷|가방|신발|액세서리|의류/.test(t)) {
    return {
      category: "fashion",
      anchor: "the product or outfit from the article title must be clearly visible",
      scene: "clothing rack, folded clothes, shoes, handbag, accessory, or beauty product display matching the title",
      extra: [keywordHint, "product-focused scene", "single scene only", "no model portrait"].filter(Boolean),
    };
  }

  if (/육아|아기|아이|임신|출산|유아|초등|교육|장난감/.test(t)) {
    return {
      category: "parenting",
      anchor: "the parenting or child-related subject from the article title must be clearly visible",
      scene: "baby items, stroller, crib, bottle, toys, school supplies, or parenting objects directly matching the title",
      extra: [keywordHint, "object-focused family scene", "single scene only", "no close-up face"].filter(Boolean),
    };
  }

  if (/공부|영어|자격증|취업|면접|자소서|대학생|취준생|독서|시험|학습/.test(t)) {
    return {
      category: "study_job",
      anchor: "the study or work-related subject from the article title must be clearly visible",
      scene: "books, notebook, exam sheets, resume paper, stationery, desk setup, or office objects matching the title",
      extra: [keywordHint, "object-focused scene", "single scene only", "no portrait"].filter(Boolean),
    };
  }

  if (/자동차|중고차|전기차|오토바이|차량/.test(t)) {
    return {
      category: "vehicle",
      anchor: "the vehicle from the article title must be clearly visible",
      scene: "single car or motorcycle exterior, charging setup, dealership row, or road scene matching the title",
      extra: [keywordHint, "vehicle subject only", "single scene only", "no driver portrait"].filter(Boolean),
    };
  }

  if (/캠핑|아웃도어|글램핑|텐트|등산|트레킹|백패킹|캠핑용품|낚시/.test(t)) {
    return {
      category: "outdoor",
      anchor: "the outdoor gear or environment from the article title must be clearly visible",
      scene: "tent, camp table, lantern, mountain trail, backpack, hiking gear, or outdoor equipment scene matching the title",
      extra: [keywordHint, "outdoor gear centered", "single scene only", "no people"].filter(Boolean),
    };
  }

  if (/창업|사업|마케팅|비즈니스|sns마케팅|스타트업|브랜딩|매출|홍보/.test(t)) {
    return {
      category: "business",
      anchor: "the business subject from the article title must be clearly visible",
      scene: "documents, packaging, laptop, sales board, memo board, shipping boxes, or office objects relevant to the title",
      extra: [keywordHint, "object-focused business scene", "single scene only", "no team portrait"].filter(Boolean),
    };
  }

  if (/정부|서류|신청|민원|법률|소송|계약|증명서|세무|행정/.test(t)) {
    return {
      category: "document",
      anchor: "the document or official object from the article title must be clearly visible",
      scene: "official paper, form, certificate, stamp, folder, pen, or desk setup directly matching the title",
      extra: [keywordHint, "document-focused scene", "single scene only", "no portrait"].filter(Boolean),
    };
  }

  if (/청소|정리|수납|살림|주방|욕실|세탁/.test(t)) {
    return {
      category: "home_life",
      anchor: "the household object or space from the article title must be clearly visible",
      scene: "clean room corner, storage box, kitchen tools, bathroom shelf, or cleaning supplies matching the title",
      extra: [keywordHint, "home object focused", "single scene only", "no people"].filter(Boolean),
    };
  }

  if (/음악|영화|드라마|책|독서|취미|악기|게임/.test(t)) {
    return {
      category: "culture",
      anchor: "the hobby or entertainment subject from the article title must be clearly visible",
      scene: "book stack, instrument, headphones, controller, remote, ticket, or hobby object setup matching the title",
      extra: [keywordHint, "object-focused culture scene", "single scene only", "no portrait"].filter(Boolean),
    };
  }

  return {
    category: "generic",
    anchor: "the core subject from the article title must be clearly visible and obvious at first glance",
    scene: `single realistic object-centered or place-centered scene directly illustrating the article title with only relevant props${keywords.length ? ` related to ${keywords.join(", ")}` : ""}`,
    extra: [keywordHint, "single scene only", "no generic stock mood photo"].filter(Boolean),
  };
}

function buildSceneLockedPrompt(topicOrPrompt: string): string {
  const topic = cleanText(topicOrPrompt);
  const scene = classifyTopic(topic);

  return [
    `article topic: ${topic}`,
    `literal visual depiction of ${topic}`,
    `article hero image about ${topic}`,
    scene.anchor,
    scene.scene,
    ...scene.extra,
    "clear topic-centered article scene",
    "topic matched subject",
    "subject from title must be obvious at first glance",
    "natural real-world scene",
    "professional photography",
    "adsense-safe article image",
    "editorial blog hero image",
    "8K ultra realistic",
    BASE_NEGATIVE,
  ].join(", ");
}

function inferTopicFromPrompt(prompt: string): string {
  const cleaned = cleanText(prompt);
  const markers = [
    /article topic:\s*([^,]+)/i,
    /article hero image about\s*([^,]+)/i,
    /literal visual depiction of\s*([^,]+)/i,
  ];
  for (const regex of markers) {
    const m = cleaned.match(regex);
    if (m?.[1]) return cleanText(m[1]);
  }
  return cleaned.split(",")[0] || cleaned;
}

function normalizePrompt(prompt: string): string {
  const topic = inferTopicFromPrompt(prompt);
  const normalized = buildSceneLockedPrompt(topic);

  if (/레시피|요리|음식|맛집|식단|도시락|반찬|디저트|브런치|커피|카페|치킨|피자|라면|파스타|샐러드|스테이크|빵|케이크/i.test(topic)) {
    return [
      normalized,
      "overhead or 45-degree food photography",
      "finished dish only",
      "no people, no face, no hands",
      "food should fill the frame",
      "single plated dish only",
    ].join(", ");
  }

  return normalized;
}

function sizeToRatio(size: string): string {
  const [w, h] = (size || "1024x1024").split("x").map(Number);
  if (!w || !h) return "1:1";
  const ratio = w / h;
  if (ratio > 1.5) return "16:9";
  if (ratio > 1.2) return "4:3";
  if (ratio < 0.8) return "3:4";
  return "1:1";
}

async function callOpenAI(apiKey: string, prompt: string, size: string, count: number): Promise<string[]> {
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: size === "1920x1080" ? "1536x1024" : size === "1280x720" ? "1536x1024" : "1024x1024",
      n: Math.max(1, Math.min(count, 4)),
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error?.message || "OpenAI image generation failed");
  return Array.isArray(data?.data) ? data.data.map((x: any) => x?.b64_json ? `data:image/png;base64,${x.b64_json}` : x?.url).filter(Boolean) : [];
}

async function callReplicateStart(apiKey: string, prompt: string, size: string): Promise<any> {
  const ratio = sizeToRatio(size);

  const resp = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKey}`,
    },
    body: JSON.stringify({
      version: "black-forest-labs/flux-schnell",
      input: {
        prompt,
        go_fast: true,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: ratio,
        output_format: "jpg",
        output_quality: 90,
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.detail || data?.error || "Replicate start failed");
  return data;
}

async function callReplicatePoll(apiKey: string, predictionId: string): Promise<any> {
  const resp = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.detail || data?.error || "Replicate poll failed");
  return data;
}

async function callGemini(apiKey: string, prompt: string): Promise<string[]> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error?.message || "Gemini image generation failed");

  const images: string[] = [];
  for (const candidate of data?.candidates || []) {
    for (const part of candidate?.content?.parts || []) {
      const inline = part?.inlineData;
      if (inline?.mimeType?.startsWith("image/") && inline?.data) {
        images.push(`data:${inline.mimeType};base64,${inline.data}`);
      }
    }
  }
  return images;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { provider, apiKey, prompt, size = "1024x1024", count = 1, action, predictionId } = req.body || {};

    if (!provider) return res.status(400).json({ error: "provider is required" });
    if (!apiKey && provider !== "pollinations") return res.status(400).json({ error: "apiKey is required" });
    if (!prompt && action !== "poll") return res.status(400).json({ error: "prompt is required" });

    if (provider === "pollinations") {
      return res.status(400).json({
        error: "Pollinations blocked for AdSense mode. Use Replicate, OpenAI, or Gemini for stronger topic matching.",
      });
    }

    const normalizedPrompt = prompt ? normalizePrompt(prompt) : "";

    if (provider === "openai") {
      const images = await callOpenAI(apiKey, normalizedPrompt, size, count);
      return res.status(200).json({ images, promptUsed: normalizedPrompt });
    }

    if (provider === "gemini") {
      const images = await callGemini(apiKey, normalizedPrompt);
      return res.status(200).json({ images: images.slice(0, Math.max(1, count)), promptUsed: normalizedPrompt });
    }

    if (provider === "replicate") {
      if (action === "poll") {
        if (!predictionId) return res.status(400).json({ error: "predictionId is required for poll" });
        const data = await callReplicatePoll(apiKey, predictionId);
        const output = Array.isArray(data?.output) ? data.output : data?.output ? [data.output] : [];
        return res.status(200).json({
          status: data?.status,
          images: output.filter(Boolean),
          error: data?.error || null,
        });
      }

      const started = await callReplicateStart(apiKey, normalizedPrompt, size);
      const output = Array.isArray(started?.output) ? started.output : started?.output ? [started.output] : [];
      if (started?.status === "succeeded" && output.length > 0) {
        return res.status(200).json({ done: true, images: output, promptUsed: normalizedPrompt });
      }

      return res.status(200).json({
        done: false,
        predictionId: started?.id,
        status: started?.status,
        promptUsed: normalizedPrompt,
      });
    }

    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || "Unknown error",
    });
  }
}
