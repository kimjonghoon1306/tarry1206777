/**
 * user-storage.ts
 * 회원별 설정 저장/불러오기 유틸
 * - localStorage 키에 userId를 prefix로 붙여 회원별 완전 분리
 * - 로그인 상태에서만 저장, 로그아웃 시 다른 회원 설정 노출 없음
 * - 서버(Vercel KV) 동기화도 지원
 */

// 현재 로그인한 userId 가져오기
export function getCurrentUserId(): string {
  try {
    const user = JSON.parse(localStorage.getItem("ba_user") || "{}");
    return user?.id || "guest";
  } catch { return "guest"; }
}

export function getCurrentToken(): string {
  return localStorage.getItem("ba_token") || "";
}

// 회원별 키 생성
function userKey(key: string): string {
  return `u:${getCurrentUserId()}:${key}`;
}

// 저장
export function userSet(key: string, value: string): void {
  localStorage.setItem(userKey(key), value);
}

// 불러오기
export function userGet(key: string, fallback = ""): string {
  return localStorage.getItem(userKey(key)) || fallback;
}

// 삭제
export function userDel(key: string): void {
  localStorage.removeItem(userKey(key));
}

// 서버에 전체 설정 저장 (로그인 필요)
export async function saveSettingsToServer(settings: Record<string, string>): Promise<boolean> {
  const token = getCurrentToken();
  if (!token || token === "") return false;
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
  if (!token || token === "") return null;
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
    }
  }
}

// 로그아웃 시: 현재 유저의 로컬 캐시만 제거 (다른 유저 데이터 안 건드림)
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

// 설정 키 상수 (전체 앱에서 일관되게 사용)
export const SETTINGS_KEYS = {
  // AI 설정
  CONTENT_AI: "content_ai_provider",
  IMAGE_AI: "image_ai_provider",
  CONTENT_LANG: "content_language",
  // API 키
  GEMINI_KEY: "gemini_api_key",
  OPENAI_KEY: "openai_api_key",
  CLAUDE_KEY: "claude_api_key",
  GROQ_KEY: "groq_api_key",
  FLUX_KEY: "flux_api_key",
  // 네이버 검색광고
  NAVER_LICENSE: "naver_access_license",
  NAVER_SECRET: "naver_secret_key",
  NAVER_CUSTOMER: "naver_customer_id",
  // 네이버 블로그 배포
  NAVER_BLOG_ID: "naver_blog_id",
  NAVER_BLOG_TOKEN: "naver_blog_access_token",
  // WordPress
  WP_URL: "wp_url",
  WP_USER: "wp_username",
  WP_PASS: "wp_app_password",
  // 웹사이트(Webhook)
  WEBHOOK_URL: "webhook_url",
  WEBHOOK_KEY: "webhook_auth_key",
  // 인사말
  GREETING: "blogauto_greeting",
};
