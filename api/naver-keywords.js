import crypto from "crypto";
import { getAdminField } from "../shared/adminKeys.js";

export default async function handler(req, res) {
  // 캐시 완전 방지
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
  }

  // 🔒 네이버 검색광고 키는 서버가 KV admin 설정에서 직접 사용 (클라 전달 안 받음)
  const accessLicense = await getAdminField("naver_access_license");
  const secretKey = await getAdminField("naver_secret_key");
  const customerId = (await getAdminField("naver_customer_id")).toString();
  const keywords = body?.keywords || [];

  if (!accessLicense || !secretKey || !customerId || !keywords.length) {
    return res.status(400).json({ error: (!accessLicense || !secretKey || !customerId) ? "네이버 키가 설정되지 않았습니다. 관리자에게 문의하세요." : "키워드가 필요합니다." });
  }

  try {
    // 매 요청마다 새 timestamp
    const timestamp = Date.now().toString();
    const message = `${timestamp}.GET./keywordstool`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(message)
      .digest("base64");

    const hintKeywords = keywords.slice(0, 5).join(",");
    // 캐시 방지를 위해 _t 파라미터 추가
    const url = `https://api.naver.com/keywordstool?hintKeywords=${encodeURIComponent(hintKeywords)}&showDetail=1&_t=${timestamp}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": accessLicense,
        "X-Customer": customerId,
        "X-Signature": signature,
        "Cache-Control": "no-cache",
      },
    });

    const text = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: text });
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
