/**
 * user-storage.ts v2.0
 * [수정 내용]
 * 1. getCurrentUserId() - ba_token 2차 검증으로 guest 고정 버그 완전 해결
 * 2. 관리자(admin) 설정 <-> 일반 회원 설정 완전 분리
 * 3. userGet() fallback에서 타인 키 오염 제거
 */

export function getCurrentUserId(): string {
  try {
    const token = localStorage.getItem("ba_token");
    if (!token || token.trim() === "") return "guest";
    const raw = localStorage.getItem("ba_user");
    if (!raw) return "guest";
    const user = JSON.parse(raw);
    if (user && typeof user.id === "string" && user.id.trim() !== "") {
      return user.id.trim();
    }
    return "guest";
  } catch {
    return "guest";
  }
}

export function getCurrentUserRole(): string {
  try {
    const raw = localStorage.getItem("ba_user");
    if (!raw) return "guest";
    const user = JSON.parse(raw);
    return user?.role || "user";
  } catch {
    return "user";
  }
}

export function getCurrentToken(): string {
  return localStorage.getItem("ba_token") || "";
}

export function isLoggedIn(): boolean {
  return getCurrentUserId() !== "guest";
}

export function isAdminUser(): boolean {
  return getCurrentUserId() === "admin" || getCurrentUserRole() === "admin";
}

function userKey(key: string): string {
  const uid = getCurrentUserId();
  return `u:${uid}:${key}`;
}

export function userSet(key: string, value: string): void {
  const uid = getCurrentUserId();
  localStorage.setItem(`u:${uid}:${key}`, value);
  // 관리자(admin)와 비로그인(guest)은 공용 키에 절대 쓰지 않음
  if (uid !== "guest" && uid !== "admin") {
    localStorage.setItem(key, value);
  }
}

export function userGet(key: string, fallback = ""): string {
  const uid = getCurrentUserId();
  const namespaced = localStorage.getItem(`u:${uid}:${key}`);
  if (namespaced !== null) return namespaced;
  // 로그인한 일반 회원만 구형 공용 키 fallback 허용
  if (uid !== "guest" && uid !== "admin") {
    const legacy = localStorage.getItem(key);
    if (legacy !== null) {
      localStorage.setItem(`u:${uid}:${key}`, legacy);
      return legacy;
    }
  }
  return fallback;
}

export function userDel(key: string): void {
  const uid = getCurrentUserId();
  localStorage.removeItem(`u:${uid}:${key}`);
  if (uid !== "guest" && uid !== "admin") {
    localStorage.removeItem(key);
  }
}

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

export async function applyServerSettings(): Promise<void> {
  const serverSettings = await loadSettingsFromServer();
  if (!serverSettings) return;
  const uid = getCurrentUserId();
  if (uid === "guest") return;
  for (const [key, value] of Object.entries(serverSettings)) {
    if (typeof value === "string") {
      localStorage.setItem(`u:${uid}:${key}`, value);
      if (uid !== "admin") {
        localStorage.setItem(key, value);
      }
    }
  }
}

export function clearUserLocalCache(): void {
  const uid = getCurrentUserId();
  if (uid === "guest") return;
  const prefix = `u:${uid}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  // 일반 회원 로그아웃 시 공용 키도 정리 (다음 사용자 오염 방지)
  if (uid !== "admin") {
    Object.values(SETTINGS_KEYS).forEach(k => {
      localStorage.removeItem(k);
    });
  }
}

export const SETTINGS_KEYS = {
  CONTENT_AI:       "content_ai_provider",
  IMAGE_AI:         "image_ai_provider",
  CONTENT_LANG:     "content_language",
  GEMINI_KEY:       "gemini_api_key",
  OPENAI_KEY:       "openai_api_key",
  CLAUDE_KEY:       "claude_api_key",
  GROQ_KEY:         "groq_api_key",
  FLUX_KEY:         "flux_api_key",
  HUGGING_KEY:      "huggingface_api_key",
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
