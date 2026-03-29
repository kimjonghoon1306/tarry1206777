export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, prompt, size = "1024x1024" } = req.body;
  if (!provider || !apiKey || !prompt) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  try {
    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: "1:1" },
          }),
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      const images = (data.predictions || []).map(
        (p) => `data:image/png;base64,${p.bytesBase64Encoded}`
      );
      return res.json({ type: "base64", images });
    }

    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024" }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      return res.json({ type: "url", images: data.data.map((d) => d.url) });
    }

    if (provider === "flux") {
      // fal.ai Flux Schnell (무료 티어)
      const resp = await fetch("https://fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify({ prompt, image_size: "square_hd", num_images: 1 }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      return res.json({ type: "url", images: (data.images || []).map((i) => i.url) });
    }

    return res.status(400).json({ error: "지원하지 않는 provider" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
