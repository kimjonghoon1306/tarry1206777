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

    // ── 핑 전송 (색인 속도 향상) ──────────────────────
    const postUrl = data.url || data.link || `https://tarryguide.com`;
    sendPings(title, postUrl); // 비동기 — 발행 응답 블로킹 안 함

    return res.json({ success: true });

  } catch (e) {
    return res.status(500).json({
      error: "server error",
      message: e.message
    });
  }
}

// ── 핑 서버 목록 ─────────────────────────────────────────
const PING_SERVERS = [
  // RPC XML 핑 서버
  { name: "Pingomatic",     url: "http://rpc.pingomatic.com/",           type: "rpc" },
  { name: "WordPress",      url: "http://rpc.wordpress.com/",            type: "rpc" },
  { name: "Blogrolling",    url: "http://rpc.blogrolling.com/pinger/",   type: "rpc" },
  // GET 핑 서버
  { name: "Google",         url: "https://www.google.com/ping?sitemap=", type: "get" },
  { name: "Bing",           url: "https://www.bing.com/indexnow?url=",   type: "get" },
];

async function sendPings(title, postUrl) {
  const encoded = encodeURIComponent(postUrl);

  const jobs = PING_SERVERS.map(async (server) => {
    try {
      if (server.type === "rpc") {
        // XML-RPC weblogUpdates.ping
        const xml = `<?xml version="1.0"?><methodCall><methodName>weblogUpdates.ping</methodName><params><param><value>${title}</value></param><param><value>${postUrl}</value></param></params></methodCall>`;
        await fetch(server.url, {
          method: "POST",
          headers: { "Content-Type": "text/xml" },
          body: xml,
          signal: AbortSignal.timeout(5000),
        });
      } else {
        // GET 방식
        await fetch(`${server.url}${encoded}`, {
          signal: AbortSignal.timeout(5000),
        });
      }
      console.log(`[PING] ✓ ${server.name}`);
    } catch (e) {
      console.log(`[PING] ✗ ${server.name}: ${e.message}`);
    }
  });

  await Promise.allSettled(jobs);
}

function extractFirstImage(html) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : "";
}
