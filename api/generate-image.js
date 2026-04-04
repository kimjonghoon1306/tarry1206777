export default async function handler(req, res) {
  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).send("Prompt is required");
  }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Image fetch failed");
    }

    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "no-cache");

    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send("Image generation failed");
  }
}
