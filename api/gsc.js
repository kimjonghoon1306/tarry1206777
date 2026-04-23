// BlogAuto Pro - Google Search Console API v1.0
// Service Account 방식으로 GSC 데이터 조회
export const config = { maxDuration: 30 };

// JWT 생성 (Service Account용)
async function makeJWT(clientEmail, privateKey) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const b64url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  // PEM 파싱
  const pem = privateKey
    .replace(/\\n/g, "\n")
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pem), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const b64sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${signingInput}.${b64sig}`;
}

// Access Token 발급
async function getAccessToken(clientEmail, privateKey) {
  const jwt = await makeJWT(clientEmail, privateKey);
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error(data.error_description || "토큰 발급 실패");
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }

  const { action, clientEmail, privateKey, siteUrl, startDate, endDate, rowLimit = 20 } = body || {};

  if (!clientEmail || !privateKey || !siteUrl) {
    return res.status(400).json({ ok: false, error: "clientEmail, privateKey, siteUrl 필요" });
  }

  try {
    const accessToken = await getAccessToken(clientEmail, privateKey);

    // ── 사이트 목록 조회 ──────────────────────────────
    if (action === "listSites") {
      const r = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await r.json();
      return res.json({ ok: true, sites: d.siteEntry || [] });
    }

    // ── 인기 키워드 조회 ──────────────────────────────
    if (action === "getKeywords") {
      const end = endDate || new Date().toISOString().slice(0, 10);
      const start = startDate || new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);

      const encoded = encodeURIComponent(siteUrl);
      const r = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: start,
            endDate: end,
            dimensions: ["query"],
            rowLimit,
            orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
          }),
        }
      );
      const d = await r.json();
      if (d.error) return res.json({ ok: false, error: d.error.message });

      const keywords = (d.rows || []).map(row => ({
        keyword: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: (row.ctr * 100).toFixed(1) + "%",
        position: row.position.toFixed(1),
      }));

      return res.json({ ok: true, keywords, period: `${start} ~ ${end}` });
    }

    // ── 페이지별 성과 조회 ────────────────────────────
    if (action === "getPages") {
      const end = endDate || new Date().toISOString().slice(0, 10);
      const start = startDate || new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);

      const encoded = encodeURIComponent(siteUrl);
      const r = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startDate: start,
            endDate: end,
            dimensions: ["page"],
            rowLimit,
            orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
          }),
        }
      );
      const d = await r.json();
      if (d.error) return res.json({ ok: false, error: d.error.message });

      const pages = (d.rows || []).map(row => ({
        page: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: (row.ctr * 100).toFixed(1) + "%",
        position: row.position.toFixed(1),
      }));

      return res.json({ ok: true, pages, period: `${start} ~ ${end}` });
    }

    return res.status(400).json({ ok: false, error: "알 수 없는 action" });

  } catch (e) {
    console.error("GSC API error:", e);
    return res.status(500).json({ ok: false, error: e.message || "서버 오류" });
  }
}
