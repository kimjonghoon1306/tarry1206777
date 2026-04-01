/**
 * api/coupang.js
 * 쿠팡파트너스 상품 검색 + 링크 자동 생성
 *
 * 쿠팡파트너스 API:
 * - 상품 검색: GET /v2/providers/affiliate_open_api/apis/openapi/products/search
 * - 서명: HMAC-SHA256
 */

import crypto from "crypto";

function generateHmacSignature(method, url, secretKey, accessKey) {
  const datetime = Date.now();
  const message = datetime + method + url;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");
  return { signature, datetime, authorization: `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}` };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, accessKey, secretKey, keyword, limit = 3 } = req.body;

  if (!accessKey || !secretKey) {
    return res.status(400).json({ error: "쿠팡파트너스 Access Key, Secret Key가 없습니다" });
  }

  // ── 상품 검색 ──────────────────────────────────────
  if (action === "search") {
    if (!keyword) return res.status(400).json({ error: "keyword 필요" });

    const path = `/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
    const { authorization } = generateHmacSignature("GET", path, secretKey, accessKey);

    try {
      const resp = await fetch(`https://api-gateway.coupang.com${path}`, {
        method: "GET",
        headers: {
          "Authorization": authorization,
          "Content-Type": "application/json;charset=UTF-8",
        },
      });

      if (!resp.ok) {
        const err = await resp.text();
        return res.status(400).json({ error: `쿠팡 API 오류 (${resp.status}): ${err}` });
      }

      const data = await resp.json();
      const products = (data.data?.productData || []).slice(0, limit).map(p => ({
        productId: p.productId,
        productName: p.productName,
        productPrice: p.productPrice,
        productImage: p.productImage,
        affiliateUrl: p.affiliateUrl || p.productUrl,
        shopName: p.shopName || "쿠팡",
        rating: p.rating || 0,
      }));

      return res.json({ ok: true, products });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: "알 수 없는 action" });
}
