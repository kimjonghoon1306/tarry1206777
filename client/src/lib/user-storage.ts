/**
 * user-storage.ts
 * 회원별 설정 저장/불러오기 유틸
 * - localStorage 키에 userId prefix 붙여 회원별 완전 분리
 * - 기존 키(구형) fallback 지원 → 이미 저장된 API 키 그대로 읽힘
 */

export function getCurrentUserId(): string {
  try {
    const user = JSON.parse(localStorage.getItem("ba_user") || "{}");
    return user?.id || "guest";
  } catch { return "guest"; }
}

export function getCurrentToken(): string {
  return localStorage.getItem("ba_token") || "";
}

function userKey(key: string): string {
  return `u:${getCurrentUserId()}:${key}`;
}

// 저장
export function userSet(key: string, value: string): void {
  localStorage.setItem(userKey(key), value);
  // 구형 키도 같이 저장 (다른 컴포넌트 호환)
  localStorage.setItem(key, value);
}

// 불러오기 - 신형 키 우선, 없으면 구형 키 fallback
export function userGet(key: string, fallback = ""): string {
  return localStorage.getItem(userKey(key))
    || localStorage.getItem(key)  // 기존에 저장된 키 fallback
    || fallback;
}

// 삭제
export function userDel(key: string): void {
  localStorage.removeItem(userKey(key));
  localStorage.removeItem(key);
}

// 서버에 전체 설정 저장
export async function saveSettingsToServer(settings: Record<string, string>): Promise<boolean> {
  const token = getCurrentToken();
  if (!token) return false;
  try {
    const resp = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "saveSettings", settings }),
    });
    const d = await resp.json();
    return d.ok === true;
  } catch { return false; }
}

// 서버에서 설정 불러오기
export async function loadSettingsFromServer(): Promise<Record<string, string> | null> {
  const token = getCurrentToken();
  if (!token) return null;
  try {
    const resp = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "loadSettings" }),
    });
    const d = await resp.json();
    if (d.ok && d.settings) return d.settings;
    return null;
  } catch { return null; }
}

// 로그인 시: 서버 설정을 로컬에 적용
export async function applyServerSettings(): Promise<void> {
  const serverSettings = await loadSettingsFromServer();
  if (!serverSettings) return;
  const uid = getCurrentUserId();
  for (const [key, value] of Object.entries(serverSettings)) {
    if (typeof value === "string") {
      localStorage.setItem(`u:${uid}:${key}`, value);
      localStorage.setItem(key, value); // 구형 호환
    }
  }
}

// 로그아웃 시: 현재 유저 로컬 캐시 제거
export function clearUserLocalCache(): void {
  const uid = getCurrentUserId();
  const prefix = `u:${uid}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
}

// 설정 키 상수
export const SETTINGS_KEYS = {
  CONTENT_AI:       "content_ai_provider",
  IMAGE_AI:         "image_ai_provider",
  CONTENT_LANG:     "content_language",
  GEMINI_KEY:       "gemini_api_key",
  OPENAI_KEY:       "openai_api_key",
  CLAUDE_KEY:       "claude_api_key",
  GROQ_KEY:         "groq_api_key",
  FLUX_KEY:         "flux_api_key",
  NAVER_LICENSE:    "naver_access_license",
  NAVER_SECRET:     "naver_secret_key",
  NAVER_CUSTOMER:   "naver_customer_id",
  NAVER_BLOG_ID:    "naver_blog_id",
  NAVER_BLOG_TOKEN: "naver_blog_access_token",
  WP_URL:           "wp_url",
  WP_USER:          "wp_username",
  WP_PASS:          "wp_app_password",
  WEBHOOK_URL:      "webhook_url",
  WEBHOOK_KEY:      "webhook_auth_key",
  GREETING:         "blogauto_greeting",
};
