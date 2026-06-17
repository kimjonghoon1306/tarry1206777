// BlogAuto Pro — 서버 측 admin API 키 주입 헬퍼
// 보안: 클라이언트에 키를 절대 내려주지 않고, 서버 엔드포인트가 KV의 admin 설정에서
// 직접 키를 읽어 쓴다. (이전엔 loadAdminPublicSettings가 키를 공개로 내려줘 누구나 탈취 가능했음)

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// 클라이언트에 내려줘도 되는 비민감 설정 (키/시크릿 제외)
export const PUBLIC_SETTING_FIELDS = [
  "content_ai_provider",
  "image_ai_provider",
  "selected_ad_platform",
  "platform_categories",
  "gsc_site_url",
];

// provider(또는 용도) → admin 설정의 키 필드명
const PROVIDER_KEY_FIELD = {
  gemini: "gemini_api_key",
  groq: "groq_api_key",
  openai: "openai_api_key",
  replicate: "replicate_api_token",
  imgbb: "imgbb_api_key",
};

async function kvGet(key) {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const d = await r.json();
    const raw = d.result;
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== "string") return raw;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "string"
        ? (() => { try { return JSON.parse(parsed); } catch { return parsed; } })()
        : parsed;
    } catch { return raw; }
  } catch { return null; }
}

// admin 계정의 settings 객체 ({} 폴백)
export async function getAdminSettings() {
  const u = await kvGet("user:admin");
  return (u && u.settings) || {};
}

// provider별 admin 키. 없으면 빈 문자열.
export async function getAdminKey(provider, settings) {
  const s = settings || (await getAdminSettings());
  const field = PROVIDER_KEY_FIELD[provider];
  return (field && s[field]) ? String(s[field]).trim() : "";
}

// 임의 필드 직접 조회 (네이버/쿠팡 등 다중 시크릿용)
export async function getAdminField(field, settings) {
  const s = settings || (await getAdminSettings());
  return s[field] ? String(s[field]).trim() : "";
}
