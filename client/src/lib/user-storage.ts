/**
 * user-storage.ts v3.0
 * ─────────────────────────────────────────────────────
 * [핵심 변경]
 * - userGet() 구형 공용 키 fallback 완전 제거
 *   → 관리자가 저장한 공용 키를 일반 회원이 절대 읽을 수 없음
 * - 회원 설정은 오직 u:{userId}:{key} 네임스페이스에만 존재
 * - 로그인 시 서버에서 해당 유저 설정만 가져와서 적용
 * ─────────────────────────────────────────────────────
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

// ── 저장 ─────────────────────────────────────────────
export function userSet(key: string, value: string): void {
  const uid = getCurrentUserId();
  // 오직 네임스페이스 키에만 저장 - 공용 키에는 절대 쓰지 않음
  localStorage.setItem(`u:${uid}:${key}`, value);
}

// ── 불러오기 ─────────────────────────────────────────
// 공용 키 fallback 완전 제거 - 오직 자기 네임스페이스만 읽음
export function userGet(key: string, fallback = ""): string {
  const uid = getCurrentUserId();
  const value = localStorage.getItem(`u:${uid}:${key}`);
  return value !== null ? value : fallback;
}

// ── 삭제 ─────────────────────────────────────────────
export function userDel(key: string): void {
  const uid = getCurrentUserId();
  localStorage.removeItem(`u:${uid}:${key}`);
}

// ── 서버에 설정 저장 ──────────────────────────────────
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

// ── 서버에서 설정 불러오기 ────────────────────────────
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

// ── 로그인 후: 서버 설정을 해당 유저 네임스페이스에 적용 ──
export async function applyServerSettings(): Promise<void> {
  const serverSettings = await loadSettingsFromServer();
  if (!serverSettings) return;
  const uid = getCurrentUserId();
  if (uid === "guest") return;
  for (const [key, value] of Object.entries(serverSettings)) {
    if (typeof value === "string") {
      // 오직 자기 네임스페이스에만 저장
      localStorage.setItem(`u:${uid}:${key}`, value);
    }
  }
}

// ── 로그아웃: 현재 유저 로컬 캐시 전체 삭제 ─────────────
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
}

// ── 설정 키 상수 ─────────────────────────────────────
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
