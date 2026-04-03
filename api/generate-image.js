// BlogAuto Pro - generate-image v5.0
// Pollinations 프록시 지원 + OpenAI DALL-E 지원

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── Pollinations 이미지 프록시 ─────────────────────
  if (req.method === "GET" && req.query?.mode === "proxy") {
    const prompt = String(req.query.prompt || "").trim();
    const width = Math.max(256, Math.min(2048, parseInt(String(req.query.width || "1024"), 10) || 1024));
    const height = Math.max(256, Math.min(2048, parseInt(String(req.query.height || "1024"), 10) || 1024));
    const seed = parseInt(String(req.query.seed || `${Date.now()}`), 10) || Date.now();

    if (!prompt) return res.status(400).json({ error: "prompt 필요" });

    const upstream = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux&enhance=true&cache=false`;

    try {
      const resp = await fetch(upstream, {
        headers: {
          "User-Agent": "Mozilla/5.0 BlogAutoPro/1.0",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      if (!resp.ok) {
        // 바이너리 프록시가 막히면 브라우저가 직접 받아가도록 리다이렉트
        res.setHeader("Cache-Control", "no-store, max-age=0");
        return res.redirect(302, upstream);
      }

      const contentType = resp.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await resp.arrayBuffer();

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.status(200).send(Buffer.from(arrayBuffer));
    } catch (e) {
      // 네트워크 이슈면 직접 upstream으로 넘겨서 마지막으로 시도
      res.setHeader("Cache-Control", "no-store, max-age=0");
      return res.redirect(302, upstream);
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, prompt, size = "1024x1024", count = 1 } = req.body || {};
  const numImages = Math.min(parseInt(count) || 1, 4);

  if (!provider || !prompt) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const [w, h] = String(size || "1024x1024").split("x").map(Number);
  const width = w || 1024;
  const height = h || 1024;

  try {
    if (provider === "pollinations") {
      const images = [];
      for (let i = 0; i < numImages; i++) {
        const seed = Math.floor(Math.random() * 999999) + i * 1000;
        images.push(`/api/generate-image?mode=proxy&prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}&seed=${seed}&t=${Date.now() + i}`);
      }
      return res.json({ type: "url", images });
    }

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
        if (msg.includes("quota") || msg.includes("billing")) {
          throw new Error("OpenAI 크레딧 부족. platform.openai.com에서 충전해주세요.");
        }
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
// fix
