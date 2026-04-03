/**
 * user-storage.ts v5.0
 * ─────────────────────────────────────────────────────
 * ✅ userGet() → 유저 키 없으면 admin 키 자동 폴백
 *    → 관리자가 설정한 키를 유저가 지워도 자동 적용
 * ✅ SETTINGS_KEYS 확장 (티스토리/쿠팡/데이터랩 추가)
 * ✅ 앱 시작 시 admin 설정 캐시 로드
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
  localStorage.setItem(`u:${uid}:${key}`, value);
  // 구버전 코드와의 호환용 레거시 키도 함께 저장
  localStorage.setItem(key, value);
}

// ── 불러오기 ─────────────────────────────────────────
// 자기 네임스페이스 우선, 없으면 admin 키 자동 폴백
export function userGet(key: string, fallback = ""): string {
  const uid = getCurrentUserId();
  const value = localStorage.getItem(`u:${uid}:${key}`);
  if (value !== null && value.trim() !== "") return value;
  // admin 네임스페이스 폴백 (관리자가 설정한 키 자동 적용)
  if (uid !== "admin") {
    const adminValue = localStorage.getItem(`u:admin:${key}`);
    if (adminValue !== null && adminValue.trim() !== "") return adminValue;
  }
  // 구버전 로컬스토리지 키 폴백
  const legacyValue = localStorage.getItem(key);
  if (legacyValue !== null && legacyValue.trim() !== "") return legacyValue;
  return fallback;
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

// ── admin 설정을 로컬에 캐시 (비로그인 유저도 관리자 키 사용 가능) ──
// ✅ 앱 시작 시 또는 로그인 후 호출
export async function syncAdminSettingsToLocal(): Promise<void> {
  try {
    // admin 토큰 없이 admin 설정을 공개 API로 가져오기
    const resp = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "loadAdminPublicSettings" }),
    });
    const d = await resp.json();
    if (d.ok && d.settings) {
      // admin 네임스페이스에 캐시
      Object.entries(d.settings).forEach(([k, v]) => {
        if (typeof v === "string" && v.trim()) {
          localStorage.setItem(`u:admin:${k}`, v);
        }
      });
    }
  } catch {}
}

// ── 로그인 후: 서버 설정을 해당 유저 네임스페이스에 적용 ──
export async function applyServerSettings(): Promise<void> {
  const serverSettings = await loadSettingsFromServer();
  if (!serverSettings) return;
  const uid = getCurrentUserId();
  if (uid === "guest") return;
  for (const [key, value] of Object.entries(serverSettings)) {
    if (typeof value === "string") {
      localStorage.setItem(`u:${uid}:${key}`, value);
    }
  }
  // admin 설정도 같이 동기화
  await syncAdminSettingsToLocal();
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

// ── 설정 키 상수 (전체 확장) ──────────────────────────
export const SETTINGS_KEYS = {
  // AI
  CONTENT_AI:         "content_ai_provider",
  IMAGE_AI:           "image_ai_provider",
  CONTENT_LANG:       "content_language",
  GEMINI_KEY:         "gemini_api_key",
  OPENAI_KEY:         "openai_api_key",
  CLAUDE_KEY:         "claude_api_key",
  GROQ_KEY:           "groq_api_key",
  FLUX_KEY:           "flux_api_key",
  HUGGING_KEY:        "huggingface_api_key",
  // 네이버 검색광고
  NAVER_LICENSE:      "naver_access_license",
  NAVER_SECRET:       "naver_secret_key",
  NAVER_CUSTOMER:     "naver_customer_id",
  // 네이버 블로그
  NAVER_BLOG_ID:      "naver_blog_id",
  NAVER_BLOG_TOKEN:   "naver_blog_access_token",
  // 네이버 데이터랩
  DATALAB_ID:         "naver_datalab_client_id",
  DATALAB_SECRET:     "naver_datalab_client_secret",
  // 티스토리
  TISTORY_CLIENT_ID:  "tistory_client_id",
  TISTORY_SECRET:     "tistory_client_secret",
  TISTORY_TOKEN:      "tistory_access_token",
  TISTORY_BLOG:       "tistory_blog_name",
  // 쿠팡파트너스
  COUPANG_ACCESS:     "coupang_access_key",
  COUPANG_SECRET:     "coupang_secret_key",
  COUPANG_SUB_ID:     "coupang_sub_id",
  // 워드프레스
  WP_URL:             "wp_url",
  WP_USER:            "wp_username",
  WP_PASS:            "wp_app_password",
  // Webhook
  WEBHOOK_URL:        "webhook_url",
  WEBHOOK_KEY:        "webhook_auth_key",
  WEBHOOK_HEADER:     "webhook_auth_header",
  // 기타
  GREETING:           "blogauto_greeting",
  AD_PLATFORM:        "selected_ad_platform",
};
