// BlogAuto Pro - generate-image v4.0
// Pollinations(무료 기본) + OpenAI DALL-E(유료)만 지원
// Gemini 이미지 / Flux 제거 (안정적인 무료 모델 없음)

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

  const [w, h] = (size || "1024x1024").split("x").map(Number);
  const width = w || 1024;
  const height = h || 1024;

  try {

    // ── Pollinations.ai - URL 반환 방식 (완전 무료, API 키 불필요) ──
    if (provider === "pollinations") {
      const images = [];
      for (let i = 0; i < numImages; i++) {
        const seed = Math.floor(Math.random() * 999999) + i * 1000;
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&enhance=true`;
        images.push(url);
      }
      return res.json({ type: "url", images });
    }

    // ── OpenAI DALL-E 3 ──────────────────────────────────────────
    if (provider === "openai") {
      if (!apiKey) return res.status(400).json({ error: "OpenAI API 키가 없습니다. 설정 페이지에서 입력해주세요." });
      const resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: `${width}x${height}` }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("quota") || msg.includes("billing")) throw new Error("OpenAI 크레딧 부족. platform.openai.com에서 충전해주세요.");
        throw new Error(`OpenAI 오류 (${resp.status}): ${msg || "알 수 없는 오류"}`);
      }
      const data = await resp.json();
      return res.json({ type: "url", images: data.data.map(d => d.url) });
    }

    return res.status(400).json({ error: "지원하지 않는 이미지 AI입니다. Pollinations(무료) 또는 OpenAI를 선택해주세요." });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
