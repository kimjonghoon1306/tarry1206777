// BlogAuto Pro - generate-image v5.1
// ✅ Vercel 타임아웃 60초로 확장
export const config = { maxDuration: 60 };

// ✅ Gemini Imagen 3 지원
// ✅ OpenAI DALL-E 3 지원
// ✅ Replicate Flux Schnell 지원
// ✅ POST 방식으로 통일
// ✅ imgbb 자동 업로드 (영구 URL)

// imgbb에 이미지 업로드 → 영구 URL 반환
async function uploadToImgbb(imgbbKey, imageData) {
  if (!imgbbKey) return imageData; // 키 없으면 원본 반환
  try {
    // base64 또는 URL 모두 처리
    const isBase64 = imageData.startsWith("data:");
    const base64Data = isBase64 ? imageData.split(",")[1] : null;
    const formData = new URLSearchParams();
    formData.append("key", imgbbKey);
    if (base64Data) {
      formData.append("image", base64Data);
    } else {
      formData.append("image", imageData); // URL
    }
    const resp = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });
    const data = await resp.json();
    if (data.success && data.data?.url) {
      return data.data.url; // 영구 URL
    }
    return imageData; // 실패 시 원본 반환
  } catch {
    return imageData; // 오류 시 원본 반환
  }
}

// size → Gemini aspectRatio 변환
function toAspectRatio(size) {
  if (!size) return "1:1";
  const [w, h] = size.split("x").map(Number);
  if (!w || !h) return "1:1";
  const ratio = w / h;
  if (ratio >= 1.7) return "16:9";  // 가로형
  if (ratio <= 0.6) return "9:16";  // 세로형
  if (ratio >= 1.2) return "4:3";   // 약간 가로
  if (ratio <= 0.85) return "3:4";  // 약간 세로
  return "1:1";                      // 정사각형
}

// ✅ 주제별 Flux 최적화 프롬프트 자동 변환
function optimizePrompt(prompt) {
  const p = prompt.toLowerCase();

  // 스타일 기본값
  const base = "photorealistic, ultra detailed, 8K resolution, professional photography";

  // 음식/맛집
  if (p.match(/맛집|음식|요리|식당|레스토랑|먹|카페|디저트|food|restaurant|cafe|cooking|recipe/)) {
    return `${prompt}, delicious food photography, warm restaurant ambiance, soft lighting, shallow depth of field, appetizing, food styling, ${base}`;
  }
  // 여행/관광
  if (p.match(/여행|관광|명소|여행지|해외|국내|travel|tourism|destination|city|landscape/)) {
    return `${prompt}, beautiful travel photography, golden hour lighting, stunning scenery, wide angle, vibrant colors, ${base}`;
  }
  // 건강/운동/다이어트
  if (p.match(/건강|운동|다이어트|헬스|피트니스|health|fitness|workout|diet|exercise/)) {
    return `${prompt}, healthy lifestyle photography, bright clean background, energetic atmosphere, ${base}`;
  }
  // 재테크/금융/투자
  if (p.match(/재테크|투자|주식|부동산|금융|돈|수익|finance|investment|money|stock|real estate/)) {
    return `${prompt}, professional business photography, modern office, financial charts, clean minimal design, corporate style, ${base}`;
  }
  // IT/기술/AI
  if (p.match(/IT|기술|ai|인공지능|코딩|개발|앱|소프트웨어|tech|software|app|digital|computer/i)) {
    return `${prompt}, modern technology concept, futuristic digital background, blue neon lights, high tech atmosphere, ${base}`;
  }
  // 뷰티/패션
  if (p.match(/뷰티|화장|패션|스타일|옷|beauty|fashion|makeup|style|cosmetic/)) {
    return `${prompt}, beauty and fashion photography, studio lighting, elegant composition, high fashion aesthetic, ${base}`;
  }
  // 육아/아이/가족
  if (p.match(/육아|아이|어린이|가족|엄마|아빠|parenting|child|family|baby|kids/)) {
    return `${prompt}, warm family photography, soft natural lighting, joyful atmosphere, cozy home setting, ${base}`;
  }
  // 부동산/인테리어
  if (p.match(/부동산|인테리어|집|아파트|인테리어|real estate|interior|home|house|apartment/)) {
    return `${prompt}, luxury interior photography, modern home design, bright spacious room, architectural photography, ${base}`;
  }
  // 자동차
  if (p.match(/자동차|차|드라이브|car|vehicle|auto|driving/)) {
    return `${prompt}, professional automotive photography, dramatic lighting, sleek design, motion blur background, ${base}`;
  }
  // 교육/학습
  if (p.match(/교육|공부|학습|시험|학교|education|study|learning|school|exam/)) {
    return `${prompt}, education concept photography, bright study environment, books and stationery, motivating atmosphere, ${base}`;
  }
  // 반려동물
  if (p.match(/반려동물|강아지|고양이|펫|pet|dog|cat|animal/)) {
    return `${prompt}, adorable pet photography, soft bokeh background, natural lighting, cute and heartwarming, ${base}`;
  }
  // 자연/환경
  if (p.match(/자연|환경|숲|바다|산|꽃|nature|forest|ocean|mountain|flower|environment/)) {
    return `${prompt}, stunning nature photography, golden hour, dramatic sky, lush scenery, National Geographic style, ${base}`;
  }

  // 기본 (기타 모든 주제)
  return `${prompt}, high quality blog thumbnail, clean composition, professional stock photo style, bright and engaging, ${base}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 지원합니다" });

  const { provider, apiKey, prompt, size = "1024x1024", count = 1, imgbbKey = "", action = "start", predictionId } = req.body || {};

  if (!provider || !apiKey) {
    return res.status(400).json({ error: "provider, apiKey 필수입니다" });
  }

  // poll 요청은 prompt 없이 predictionId만으로 처리 (맨 위에서 바로 처리)
  if (provider === "replicate" && action === "poll") {
    if (!predictionId) return res.status(400).json({ error: "predictionId 필요" });
    try {
      const r = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { Authorization: `Token ${apiKey}` },
      });
      const d = await r.json();
      const images = d.status === "succeeded"
        ? (Array.isArray(d.output) ? d.output : [d.output].filter(Boolean))
        : [];
      const uploaded = (d.status === "succeeded" && imgbbKey)
        ? await Promise.all(images.map(img => uploadToImgbb(imgbbKey, img)))
        : images;
      return res.json({
        ok: true,
        status: d.status,
        images: uploaded,
        error: d.status === "failed" ? (d.error || "생성 실패") : null,
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (!prompt) {
    return res.status(400).json({ error: "prompt 필수입니다" });
  }

  // ✅ 주제별 자동 프롬프트 최적화
  const optimizedPrompt = optimizePrompt(prompt);

  const numImages = Math.min(parseInt(count) || 1, 10);

  // ── Gemini (gemini-2.0-flash-exp 이미지 생성 시도) ──
  if (provider === "gemini") {
    const MODELS = [
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash-preview-image-generation",
    ];
    const images = [];

    try {
      for (let i = 0; i < numImages; i++) {
        let generated = false;
        for (const model of MODELS) {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: optimizedPrompt }] }],
                generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
              }),
            }
          );

          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            const msg = (err?.error?.message || "").toLowerCase();
            if (resp.status === 403 || msg.includes("api key")) {
              throw new Error("Gemini API 키가 잘못되었습니다.");
            }
            if (resp.status === 429) throw new Error("Gemini 한도 초과. 잠시 후 다시 시도해주세요.");
            continue;
          }

          const data = await resp.json();
          const parts = data?.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              images.push(`data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`);
              generated = true;
              break;
            }
          }
          if (generated) break;
        }
      }

      if (images.length === 0) {
        throw new Error("Gemini 이미지 생성 실패. AI Studio 키는 이미지 생성이 제한될 수 있습니다. Replicate를 사용해보세요.");
      }
      const geminiUploaded = imgbbKey ? await Promise.all(images.map(img => uploadToImgbb(imgbbKey, img))) : images;
      return res.json({ ok: true, images: geminiUploaded, provider: "gemini" });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

    // ── OpenAI DALL-E 3 ─────────────────────────────────
  // DALL-E 3는 1회 1장만 생성 가능 → 병렬로 여러 번 호출
  if (provider === "openai") {
    // DALL-E 3 지원 사이즈 매핑
    function toDallESize(s) {
      const [w, h] = (s || "1024x1024").split("x").map(Number);
      if (!w || !h) return "1024x1024";
      const ratio = w / h;
      if (ratio > 1.4) return "1792x1024";  // 가로
      if (ratio < 0.7) return "1024x1792";  // 세로
      return "1024x1024";                    // 정사각형
    }
    const dallESize = toDallESize(size);

    try {
      const requests = Array.from({ length: numImages }, () =>
        fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: optimizedPrompt,
            n: 1,
            size: dallESize,
            quality: "standard",
            response_format: "url",
          }),
        })
      );

      const responses = await Promise.all(requests);
      const images = [];

      for (const resp of responses) {
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          const msg = err?.error?.message || "";
          if (resp.status === 401) throw new Error("OpenAI API 키가 잘못되었습니다.");
          if (msg.includes("billing") || msg.includes("quota")) throw new Error("OpenAI 크레딧이 부족합니다. platform.openai.com에서 충전해주세요.");
          throw new Error(`OpenAI 오류 (${resp.status}): ${msg}`);
        }
        const data = await resp.json();
        const url = data.data?.[0]?.url;
        if (url) images.push(url);
      }

      if (images.length === 0) throw new Error("이미지가 생성되지 않았습니다.");
      const openaiUploaded = imgbbKey ? await Promise.all(images.map(img => uploadToImgbb(imgbbKey, img))) : images;
      return res.json({ ok: true, images: openaiUploaded, provider: "openai" });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Replicate (Flux Schnell) ──────────────────────────
  // ✅ 브라우저 직접 폴링 방식 — Vercel 타임아웃 완전 해결
  if (provider === "replicate") {
    const [w, h] = (size || "1024x1024").split("x").map(Number);
    const width = w || 1024;
    const height = h || 1024;
    // ── 시작: 예측 요청 후 ID 반환 ──
    try {
      const resp = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({
          input: {
            prompt: optimizedPrompt,
            width,
            height,
            num_outputs: Math.min(numImages, 4),
            num_inference_steps: 4,
            output_format: "webp",
            output_quality: 90,
          },
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err?.detail || err?.error || "";
        if (resp.status === 401) throw new Error("Replicate API 토큰이 잘못되었습니다.");
        if (resp.status === 402) throw new Error("Replicate 크레딧이 부족합니다. replicate.com에서 충전해주세요.");
        throw new Error(`Replicate 오류 (${resp.status}): ${msg}`);
      }

      const data = await resp.json();

      // 즉시 완료된 경우
      if (data.status === "succeeded") {
        const images = Array.isArray(data.output) ? data.output : [data.output].filter(Boolean);
        const uploaded = imgbbKey ? await Promise.all(images.map(img => uploadToImgbb(imgbbKey, img))) : images;
        return res.json({ ok: true, images: uploaded, provider: "replicate", done: true });
      }

      // 처리 중 → ID 반환, 브라우저가 폴링
      if (data.id) {
        return res.json({ ok: true, predictionId: data.id, done: false, provider: "replicate" });
      }

      throw new Error("Replicate 예측 시작 실패");
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

    return res.status(400).json({ error: "지원하지 않는 provider입니다 (gemini / openai / replicate)" });
}
