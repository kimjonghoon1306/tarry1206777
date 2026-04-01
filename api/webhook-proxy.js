/**
 * api/webhook-proxy.js
 * 브라우저 CORS 우회용 Webhook 프록시
 * BlogAuto Pro → 이 서버 → 타겟 사이트
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { url, key, payload } = req.body;
  if (!url) return res.status(400).json({ error: "url 필요" });

  try {
    const headers = { "Content-Type": "application/json" };
    if (key) headers["Authorization"] = key;

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: `타겟 서버 오류 (${resp.status})`,
        detail: data,
      });
    }

    return res.json({ ok: true, status: resp.status, data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
