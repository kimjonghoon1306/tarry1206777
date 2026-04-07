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

function classifyTopic(topic: string): TopicScene {
  const t = cleanText(topic).toLowerCase();

  if (/레시피|요리|음식|맛집|식단|도시락|반찬|디저트|브런치|커피|카페|치킨|피자|라면|파스타|샐러드|스테이크|빵|케이크/.test(t)) {
    return {
      category: "food",
      anchor: "finished dish from the article title must be clearly visible",
      scene: "single plated food dish on a table or kitchen counter, edible realistic meal result, only relevant ingredients or cookware if directly related",
      extra: ["food only", "single scene only", "dish is the hero subject"],
    };
  }

  if (/숙소|호텔|펜션|리조트|여행|관광|제주|서울|부산|강원|경주|전주|여수|속초|해외여행|국내여행/.test(t)) {
    return {
      category: "travel",
      anchor: "the place or accommodation from the article title must be clearly visible",
      scene: "real hotel room, travel destination, landmark, landscape, or accommodation interior matching the title",
      extra: ["literal place depiction", "single scene only"],
    };
  }

  if (/부동산|전세|월세|청약|분양|아파트|원룸|오피스텔|빌라|임대|주택|집|방|인테리어|리모델링|이사/.test(t)) {
    return {
      category: "real_estate",
      anchor: "room, house, property exterior, or contract-related object from the article title must be clearly visible",
      scene: "real estate contract paper with keys, room interior, apartment exterior, or moving boxes directly related to the title",
      extra: ["single scene only", "real property context only"],
    };
  }

  if (/대출|금융|재테크|주식|코인|경제|세금|보험|연금|신용점수|카드|지원금|정부지원|연말정산|돈|절약/.test(t)) {
    return {
      category: "finance",
      anchor: "financial object from the article title must be clearly visible",
      scene: "calculator, financial document, savings jar, coins, card, bank note, or market monitor object-focused setup",
      extra: ["single scene only", "object-focused finance scene"],
    };
  }

  if (/다이어트|건강|운동|헬스|요가|필라테스|영양제|스킨케어|피부|탈모|건강식|병원|약|수면/.test(t)) {
    return {
      category: "health",
      anchor: "health-related object or result from the article title must be clearly visible",
      scene: "healthy meal, supplement bottles, dumbbells, yoga mat, skincare items, or wellness setup matching the title",
      extra: ["single scene only", "object-focused wellness scene"],
    };
  }

  if (/ai|챗gpt|인공지능|앱|스마트폰|노트북|컴퓨터|유튜브|블로그|코딩|프로그래밍|개발|it|소셜미디어|게임/.test(t)) {
    return {
      category: "tech",
      anchor: "device or screen-related subject from the article title must be clearly visible",
      scene: "laptop, smartphone, keyboard, creator desk, code screen, or AI workspace with no person visible",
      extra: ["single scene only", "device-focused setup"],
    };
  }

  if (/강아지|고양이|반려동물|펫|햄스터/.test(t)) {
    return {
      category: "pet",
      anchor: "the pet from the article title must be clearly visible",
      scene: "single pet subject in a realistic home or care environment",
      extra: ["single scene only"],
    };
  }

  if (/패션|쇼핑|명품|코디|옷|가방|신발|뷰티|메이크업|화장품/.test(t)) {
    return {
      category: "fashion_beauty",
      anchor: "the item from the article title must be clearly visible",
      scene: "clothing rack, beauty product setup, outfit display, handbag, shoes, or shopping item scene matching the title",
      extra: ["product-focused scene", "single scene only"],
    };
  }

  if (/공부|영어|자격증|취업|면접|자소서|대학생|취준생|독서/.test(t)) {
    return {
      category: "study_job",
      anchor: "study or job-related object from the article title must be clearly visible",
      scene: "books, notebook, exam material, resume paper, stationery, or study desk object setup",
      extra: ["single scene only"],
    };
  }

  if (/자동차|중고차|전기차|오토바이|차량/.test(t)) {
    return {
      category: "car",
      anchor: "the vehicle from the article title must be clearly visible",
      scene: "single vehicle exterior, charging station scene, dealership row, or road scene matching the title",
      extra: ["single scene only"],
    };
  }

  if (/캠핑|아웃도어|글램핑|텐트|등산|트레킹|백패킹|캠핑용품/.test(t)) {
    return {
      category: "outdoor",
      anchor: "outdoor gear or location from the article title must be clearly visible",
      scene: "tent, camping gear, mountain trail, camp table, or outdoor equipment in a realistic environment",
      extra: ["single scene only"],
    };
  }

  if (/창업|사업|마케팅|비즈니스|sns마케팅|스타트업/.test(t)) {
    return {
      category: "business",
      anchor: "business object from the article title must be clearly visible",
      scene: "documents, laptop, packaging, sales board, strategy notes, or workspace setup relevant to the title",
      extra: ["single scene only"],
    };
  }

  return {
    category: "generic",
    anchor: "the core subject from the article title must be clearly visible and obvious",
    scene: "single realistic scene directly illustrating the article title with only relevant props",
    extra: ["single scene only"],
  };
}

function buildSceneLockedPrompt(topicOrPrompt: string): string {
  const topic = cleanText(topicOrPrompt);
  const scene = classifyTopic(topic);

  return [
    `article topic: ${topic}`,
    `literal visual depiction of ${topic}`,
    scene.anchor,
    scene.scene,
    ...scene.extra,
    "clear topic-centered article scene",
    "topic matched subject",
    "natural real-world scene",
    "professional photography",
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
      model: "black-forest-labs/flux-schnell",
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
