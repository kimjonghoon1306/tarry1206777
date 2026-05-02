import fs from "fs-extra";
import path from "path";
import { chromium, BrowserContext } from "playwright";

const SESSIONS_DIR = path.join(__dirname, "../sessions");

export interface Session {
  userId: string;
  platform: "naver" | "tistory";
  username: string;       // 로그인 아이디 (네이버 ID)
  blogName?: string;      // 실제 블로그 ID (다를 수 있음)
  cookies: any[];
  savedAt: string;
}

const sessionPath = (userId: string) => path.join(SESSIONS_DIR, `${userId}.json`);

/* ──────────────────────────────────────────────────────────────────
 * 봇 탐지 우회용 init script
 * stealth 플러그인 의존성 없이 핵심만 직접 처리
 * 수천명 배포 시 외부 패키지 의존성 줄이는게 안정성에 유리
 * ────────────────────────────────────────────────────────────────── */
const ANTI_DETECTION_SCRIPT = `
  // navigator.webdriver 제거
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

  // chrome 객체 위장
  if (!window.chrome) {
    window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {} };
  }

  // plugins 길이 위장 (헤드리스는 0인 경우가 많음)
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5].map(() => ({ name: 'Chrome PDF Plugin' }))
  });

  // languages 한국어 우선
  Object.defineProperty(navigator, 'languages', {
    get: () => ['ko-KR', 'ko', 'en-US', 'en']
  });

  // permissions API 정상화
  const originalQuery = window.navigator.permissions?.query;
  if (originalQuery) {
    window.navigator.permissions.query = (params) =>
      params.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(params);
  }
`;

const COMMON_LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-blink-features=AutomationControlled",
  "--disable-features=IsolateOrigins,site-per-process",
  "--disable-site-isolation-trials",
  "--disable-web-security",
  "--no-first-run",
  "--no-default-browser-check",
];

const COMMON_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function applyAntiDetection(context: BrowserContext) {
  await context.addInitScript(ANTI_DETECTION_SCRIPT);
}

/* ──────────────────────────────────────────────────────────────────
 * 네이버 로그인 + blogId 추출
 * 핵심: 첫 로그인은 headless: false로 사용자에게 보임 (캡차/2FA 우회)
 * blogId 추출은 GoBlogWrite.naver 리다이렉트 방식 (100% 안정)
 * ────────────────────────────────────────────────────────────────── */
async function saveNaverSession(
  userId: string,
  username: string,
  password: string
): Promise<{ cookies: number; blogId: string }> {
  await fs.ensureDir(SESSIONS_DIR);

  const browser = await chromium.launch({
    headless: false,                    // 첫 로그인은 사용자에게 보임
    args: COMMON_LAUNCH_ARGS,
    slowMo: 50,                         // 사람처럼 보이게
  });

  const context = await browser.newContext({
    userAgent: COMMON_UA,
    viewport: { width: 1280, height: 800 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  });
  await applyAntiDetection(context);
  const page = await context.newPage();

  try {
    // 1. 네이버 로그인 페이지
    console.log("[session] 네이버 로그인 페이지 진입...");
    await page.goto("https://nid.naver.com/nidlogin.login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(800);

    // 2. ID/PW 자동 입력 (clipboard 방식 - 봇 탐지 우회)
    //    .fill() 이나 .type() 보다 evaluate + clipboard 가 탐지율 낮음
    console.log("[session] ID/PW 자동 입력...");
    await page.evaluate((id) => {
      const el = document.querySelector("#id") as HTMLInputElement;
      if (el) {
        el.focus();
        el.value = id;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, username);
    await page.waitForTimeout(400);

    await page.evaluate((pw) => {
      const el = document.querySelector("#pw") as HTMLInputElement;
      if (el) {
        el.focus();
        el.value = pw;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, password);
    await page.waitForTimeout(400);

    // 3. 로그인 버튼 클릭
    await page.click(".btn_login").catch(async () => {
      await page.click("button[type='submit']");
    });

    // 4. 로그인 성공 또는 캡차/2FA 대기 (최대 90초 - 사용자가 직접 풀 수 있게)
    console.log("[session] 로그인 처리 중... (캡차/2FA 있으면 직접 풀어주세요)");
    try {
      await page.waitForFunction(
        () => !location.href.includes("nid.naver.com/nidlogin"),
        { timeout: 90000 }
      );
    } catch {
      throw new Error("로그인 시간 초과 (90초). 캡차/2FA 처리 안됨");
    }

    // 5. 정말 로그인 됐는지 확인
    await page.waitForTimeout(2000);
    if (page.url().includes("nidlogin") || page.url().includes("login")) {
      throw new Error("로그인 실패. ID/PW 확인 필요");
    }
    console.log("[session] ✅ 로그인 성공");

    // 6. blogId 추출 - GoBlogWrite.naver 방식 (가장 안정적)
    //    네이버가 로그인된 사용자의 진짜 blogId로 자동 리다이렉트해줌
    //    ID와 blogId가 달라도 100% 작동
    console.log("[session] blogId 추출 중...");
    let blogId: string | null = null;

    try {
      await page.goto("https://blog.naver.com/GoBlogWrite.naver", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForTimeout(3000);

      // 리다이렉트된 최종 URL에서 blogId 추출
      // 보통 PostWriteForm.naver?blogId=xxx 형태로 도착
      const finalUrl = page.url();
      console.log("[session] 리다이렉트 도착 URL:", finalUrl);

      const m = finalUrl.match(/[?&]blogId=([a-zA-Z0-9_-]+)/);
      if (m && m[1]) {
        blogId = m[1];
      }
    } catch (e: any) {
      console.warn("[session] GoBlogWrite 진입 실패:", e.message);
    }

    // 폴백: section.blog.naver.com에서 추출
    if (!blogId) {
      console.log("[session] 폴백 1: section.blog.naver.com 시도");
      try {
        await page.goto("https://section.blog.naver.com/BlogHome.naver", {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
        await page.waitForTimeout(2000);
        blogId = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll("a[href*='blog.naver.com/']")) as HTMLAnchorElement[];
          for (const a of links) {
            const m = a.href.match(/blog\.naver\.com\/([a-zA-Z0-9_-]+)(?:\?|\/|$)/);
            if (m && m[1] && !["PostList", "BlogHome", "GoBlogWrite", "PostWriteForm", "MyBlog"].includes(m[1])) {
              return m[1];
            }
          }
          return null;
        });
      } catch {}
    }

    // 폴백 2: 모바일 블로그 (가장 단순한 구조)
    if (!blogId) {
      console.log("[session] 폴백 2: m.blog.naver.com 시도");
      try {
        await page.goto("https://m.blog.naver.com", {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });
        await page.waitForTimeout(2000);
        const url = page.url();
        const m = url.match(/blog\.naver\.com\/([a-zA-Z0-9_-]+)/);
        if (m && m[1] && !["PostList", "BlogHome"].includes(m[1])) {
          blogId = m[1];
        }
      } catch {}
    }

    if (!blogId) {
      throw new Error("blogId 자동 추출 실패. 블로그 미개설 계정일 수 있음");
    }
    console.log(`[session] ✅ blogId 확정: ${blogId}`);

    // 7. 쿠키 저장
    const cookies = await context.cookies();
    const session: Session = {
      userId,
      platform: "naver",
      username,
      blogName: blogId,
      cookies,
      savedAt: new Date().toISOString(),
    };
    await fs.writeJson(sessionPath(userId), session, { spaces: 2 });
    await browser.close();

    console.log(`[session] ✅ 네이버 세션 저장 완료: ${username} → blogId=${blogId} (쿠키 ${cookies.length}개)`);
    return { cookies: cookies.length, blogId };
  } catch (e) {
    await browser.close().catch(() => {});
    throw e;
  }
}

/* ──────────────────────────────────────────────────────────────────
 * 티스토리 로그인 (카카오 OAuth 경유)
 * ────────────────────────────────────────────────────────────────── */
async function saveTistorySession(
  userId: string,
  username: string,
  password: string,
  blogName?: string
): Promise<{ cookies: number }> {
  await fs.ensureDir(SESSIONS_DIR);

  const browser = await chromium.launch({
    headless: false,
    args: COMMON_LAUNCH_ARGS,
    slowMo: 50,
  });
  const context = await browser.newContext({
    userAgent: COMMON_UA,
    viewport: { width: 1280, height: 800 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  });
  await applyAntiDetection(context);
  const page = await context.newPage();

  try {
    await page.goto("https://www.tistory.com/auth/login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1500);

    // 카카오 로그인 버튼
    await page.click(".btn_login.link_kakao_id, a:has-text('카카오')").catch(() => {});
    await page.waitForTimeout(2500);

    // 카카오 ID/PW 입력
    await page.fill("#loginId--1", username).catch(async () => {
      await page.fill("input[name='loginId']", username);
    });
    await page.waitForTimeout(400);
    await page.fill("#password--2", password).catch(async () => {
      await page.fill("input[name='password']", password);
    });
    await page.waitForTimeout(400);

    await page.click(".btn_confirm.btn_login, button.submit").catch(() => {});

    // 추가 인증 대기 (90초)
    console.log("[session] 티스토리 로그인 처리 중... (추가 인증 있으면 직접 풀어주세요)");
    try {
      await page.waitForURL("**tistory.com/**", { timeout: 90000 });
    } catch {
      throw new Error("티스토리 로그인 시간 초과");
    }

    await page.waitForTimeout(2000);
    if (page.url().includes("login") || page.url().includes("accounts.kakao.com")) {
      throw new Error("티스토리 로그인 실패");
    }

    const cookies = await context.cookies();
    const session: Session = {
      userId,
      platform: "tistory",
      username,
      blogName,
      cookies,
      savedAt: new Date().toISOString(),
    };
    await fs.writeJson(sessionPath(userId), session, { spaces: 2 });
    await browser.close();

    console.log(`[session] ✅ 티스토리 세션 저장 완료: ${username} (쿠키 ${cookies.length}개)`);
    return { cookies: cookies.length };
  } catch (e) {
    await browser.close().catch(() => {});
    throw e;
  }
}

/* ──────────────────────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────────────────────── */
export async function saveSession(
  userId: string,
  platform: "naver" | "tistory",
  username: string,
  password: string,
  blogName?: string
): Promise<{ cookies: number; blogId?: string }> {
  if (platform === "naver") {
    return saveNaverSession(userId, username, password);
  } else {
    return saveTistorySession(userId, username, password, blogName);
  }
}

export async function getSession(userId: string): Promise<Session | null> {
  try {
    if (!await fs.pathExists(sessionPath(userId))) return null;
    return await fs.readJson(sessionPath(userId));
  } catch {
    return null;
  }
}

export async function updateCookies(userId: string, cookies: any[]) {
  const s = await getSession(userId);
  if (!s) return;
  s.cookies = cookies;
  s.savedAt = new Date().toISOString();
  await fs.writeJson(sessionPath(userId), s, { spaces: 2 });
}

export async function deleteSession(userId: string) {
  await fs.remove(sessionPath(userId));
}

/* 헤드리스 발행 시 사용할 컨텍스트 빌더 (export) */
export async function buildHeadlessContext(session: Session) {
  const browser = await chromium.launch({
    headless: true,
    args: COMMON_LAUNCH_ARGS,
  });
  const context = await browser.newContext({
    userAgent: COMMON_UA,
    viewport: { width: 1280, height: 800 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  });
  await applyAntiDetection(context);
  await context.addCookies(session.cookies);
  return { browser, context };
}
