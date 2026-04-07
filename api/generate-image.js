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
                contents: [{ parts: [{ text: prompt }] }],
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
            prompt,
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
            prompt,
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
