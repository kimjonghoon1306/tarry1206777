export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, prompt, size = "1024x1024", count = 1 } = req.body;
  const numImages = Math.min(parseInt(count) || 1, 4);

  if (!provider || !prompt) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }
  if (provider !== "pollinations" && !apiKey) {
    return res.status(400).json({ error: "API 키가 없습니다. 설정 페이지에서 입력해주세요." });
  }

  const [w, h] = (size || "1024x1024").split("x").map(Number);
  const width = w || 1024;
  const height = h || 1024;

  try {

    // ── Pollinations.ai - URL 반환 방식 (Vercel 타임아웃 우회, 완전 무료) ──
    if (provider === "pollinations") {
      const images = [];
      for (let i = 0; i < numImages; i++) {
        const seed = Math.floor(Math.random() * 999999) + i * 1000;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&enhance=true`;
        images.push(url);
      }
      return res.json({ type: "url", images });
    }

    // ── Gemini Flash 이미지 생성 (무료 API 키로 동작) ─────────────────
    if (provider === "gemini") {
      const images = [];
      for (let i = 0; i < numImages; i++) {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
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
          const msg = (err.error?.message || "").toLowerCase();
          const status = resp.status;
          if (status === 429 || msg.includes("quota") || msg.includes("rate") || msg.includes("limit") || msg.includes("exhausted") || msg.includes("resource_exhausted")) {
            throw new Error("Gemini 이미지 한도 초과 (하루 500개). 내일 초기화되거나 Pollinations(무료)로 전환해보세요.");
          }
          if (msg.includes("api key") || msg.includes("api_key") || status === 400) throw new Error("Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.");
          if (status === 403) throw new Error("Gemini API 키 권한 없음. Google AI Studio에서 키를 확인해주세요.");
          throw new Error(`Gemini 오류 (${status}): ${err.error?.message || "알 수 없는 오류"}`);
        }
        const data = await resp.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            break;
          }
        }
      }
      if (images.length === 0) throw new Error("Gemini에서 이미지를 반환하지 않았습니다. 프롬프트를 수정하거나 다시 시도해주세요.");
      return res.json({ type: "base64", images });
    }

    // ── OpenAI DALL-E ─────────────────────────────────────────────────
    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: `${width}x${height}` }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("quota") || msg.includes("billing")) throw new Error("OpenAI 크레딧 부족. platform.openai.com에서 충전해주세요.");
        throw new Error(`OpenAI 오류: ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({ type: "url", images: data.data.map(d => d.url) });
    }

    // ── fal.ai Flux Schnell ───────────────────────────────────────────
    if (provider === "flux") {
      const resp = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Key ${apiKey}` },
        body: JSON.stringify({ prompt, image_size: "square_hd", num_images: numImages }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        if (text.includes("balance") || text.includes("Exhausted")) throw new Error("fal.ai 잔액 부족. Pollinations(무료)로 전환하거나 fal.ai/dashboard/billing에서 충전해주세요.");
        if (text.includes("locked")) throw new Error("fal.ai 계정이 잠겼습니다. fal.ai/dashboard/billing에서 확인해주세요.");
        throw new Error(`fal.ai 오류: ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({ type: "url", images: (data.images || []).map(i => i.url) });
    }

    return res.status(400).json({ error: "지원하지 않는 이미지 AI입니다" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
