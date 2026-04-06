export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  try {
    const { title, content, thumbnail, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title, content required" });
    }

    const htmlContent = String(content).trim();

    const finalThumbnail =
      thumbnail || extractFirstImage(htmlContent);

    const response = await fetch("https://tarryguide.com/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.API_KEY
      },
      body: JSON.stringify({
        title: title,
        content: htmlContent,
        thumbnail: finalThumbnail,
        category: category || "일반",
        status: "published"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "send fail",
        detail: data
      });
    }

    return res.json({ success: true });

  } catch (e) {
    return res.status(500).json({
      error: "server error",
      message: e.message
    });
  }
}

function extractFirstImage(html) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : "";
}
