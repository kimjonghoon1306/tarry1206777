import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: "Invalid JSON" }); }
  }

  const accessLicense = (body?.accessLicense || "").trim();
  const secretKey = (body?.secretKey || "").trim();
  const customerId = (body?.customerId || "").toString().trim();
  const keywords = body?.keywords || [];

  if (!accessLicense || !secretKey || !customerId || !keywords.length) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  try {
    const timestamp = Date.now().toString();
    // 구분자는 "." (점) - "\n" 아님!
    const message = `${timestamp}.GET./keywordstool`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(message)
      .digest("base64");

    const hintKeywords = keywords.slice(0, 5).join(",");
    const url = `https://api.naver.com/keywordstool?hintKeywords=${encodeURIComponent(hintKeywords)}&showDetail=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": accessLicense,
        "X-Customer": customerId,
        "X-Signature": signature,
        "Content-Type": "application/json; charset=UTF-8",
      },
    });

    const text = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: text });
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
