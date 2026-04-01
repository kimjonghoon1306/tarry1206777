/**
 * api/tistory.js
 * 티스토리 OAuth + 글 발행 API
 * 
 * 흐름:
 * 1. action:"getAuthUrl"  → 티스토리 OAuth URL 반환
 * 2. action:"getToken"    → code로 access_token 발급
 * 3. action:"getBlogInfo" → 블로그 목록 조회
 * 4. action:"publish"     → 글 발행
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body;

  // ── 1. OAuth URL 생성 ──────────────────────────────
  if (action === "getAuthUrl") {
    const { clientId, redirectUri } = req.body;
    if (!clientId || !redirectUri) return res.status(400).json({ error: "clientId, redirectUri 필요" });
    const url = `https://www.tistory.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    return res.json({ ok: true, url });
  }

  // ── 2. code → access_token ────────────────────────
  if (action === "getToken") {
    const { clientId, clientSecret, redirectUri, code } = req.body;
    if (!clientId || !clientSecret || !code) return res.status(400).json({ error: "필수 파라미터 누락" });
    try {
      const resp = await fetch("https://www.tistory.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
          grant_type: "authorization_code",
        }),
      });
      const text = await resp.text();
      // 응답: "access_token=xxxxx"
      const match = text.match(/access_token=([^&]+)/);
      if (!match) return res.status(400).json({ error: "토큰 발급 실패: " + text });
      return res.json({ ok: true, access_token: match[1] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── 3. 블로그 정보 조회 ───────────────────────────
  if (action === "getBlogInfo") {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: "accessToken 필요" });
    try {
      const resp = await fetch(
        `https://www.tistory.com/apis/blog/info?access_token=${accessToken}&output=json`
      );
      const data = await resp.json();
      if (data.tistory?.status !== "200") return res.status(400).json({ error: "블로그 정보 조회 실패" });
      const blogs = data.tistory.item.blogs.map(b => ({
        name: b.name,
        url: b.url,
        title: b.title,
      }));
      return res.json({ ok: true, blogs });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── 4. 글 발행 ────────────────────────────────────
  if (action === "publish") {
    const { accessToken, blogName, title, content, tags, visibility = 3, scheduledAt } = req.body;
    if (!accessToken || !blogName || !title || !content) {
      return res.status(400).json({ error: "accessToken, blogName, title, content 필요" });
    }
    try {
      const params = new URLSearchParams({
        access_token: accessToken,
        output: "json",
        blogName,
        title,
        content,
        visibility: String(visibility), // 0:비공개 1:보호 3:공개
        category: "0",
      });
      if (tags) params.append("tag", tags);
      if (scheduledAt) {
        params.append("published", String(Math.floor(new Date(scheduledAt).getTime() / 1000)));
        params.append("publishType", "reserved");
      }

      const resp = await fetch("https://www.tistory.com/apis/post/write", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const data = await resp.json();
      if (data.tistory?.status !== "200") {
        return res.status(400).json({ error: "발행 실패: " + (data.tistory?.error_message || JSON.stringify(data)) });
      }
      return res.json({
        ok: true,
        postId: data.tistory.postId,
        url: data.tistory.url,
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: "알 수 없는 action" });
}
