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
  // pollinations는 API 키 불필요
  if (provider !== "pollinations" && !apiKey) {
    return res.status(400).json({ error: "API 키가 없습니다. 설정 페이지에서 입력해주세요." });
  }

  // 사이즈 파싱
  const [w, h] = (size || "1024x1024").split("x").map(Number);
  const width = w || 1024;
  const height = h || 1024;

  try {

    // ── Pollinations.ai (완전 무료, API 키 없음) ──────────────
    if (provider === "pollinations") {
      // Vercel 타임아웃(10초) 때문에 1개씩만 생성
      const seed = Math.floor(Math.random() * 999999);
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&enhance=true`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      try {
        const imgResp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!imgResp.ok) throw new Error(`Pollinations 오류 (${imgResp.status}). 잠시 후 다시 시도해주세요.`);
        const buffer = await imgResp.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        // numImages만큼 같은 이미지 + 약간 다른 시드로 추가
        const images = [base64].map(b => `data:image/jpeg;base64,${b}`);
        return res.json({ type: "base64", images });
      } catch (e) {
        clearTimeout(timeout);
        if (e.name === "AbortError") throw new Error("이미지 생성 시간 초과 (25초). 다시 시도해주세요.");
        throw e;
      }
    }

    // ── Gemini Imagen ─────────────────────────────────────────
    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: numImages, aspectRatio: width === height ? "1:1" : "16:9" },
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("quota") || msg.includes("billing")) throw new Error("Gemini 크레딧 부족. Google AI Studio에서 결제 설정을 확인해주세요.");
        throw new Error(`Gemini 오류: ${resp.status}`);
      }
      const data = await resp.json();
      const images = (data.predictions || []).map(p => `data:image/png;base64,${p.bytesBase64Encoded}`);
      return res.json({ type: "base64", images });
    }

    // ── OpenAI DALL-E ─────────────────────────────────────────
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

    // ── fal.ai Flux Schnell ───────────────────────────────────
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
