import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accessLicense, secretKey, customerId, keywords } = req.body;

  if (!accessLicense || !secretKey || !customerId || !keywords?.length) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  try {
    const timestamp = Date.now().toString();
    const method = "GET";
    const uri = "/keywordstool";
    const hmac = crypto.createHmac("sha256", secretKey);
    hmac.update(`${timestamp}\n${method}\n${uri}`);
    const signature = hmac.digest("base64");

    const hintKeywords = keywords.slice(0, 5).join(",");
    const url = `https://api.naver.com/keywordstool?hintKeywords=${encodeURIComponent(hintKeywords)}&showDetail=1`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": accessLicense,
        "X-Customer": customerId,
        "X-Signature": signature,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
