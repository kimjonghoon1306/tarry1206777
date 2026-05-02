import fs from "fs-extra";
import path from "path";
const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth")();
chromium.use(stealth);

const SESSIONS_DIR = path.join(__dirname, "../sessions");
const PROFILES_DIR = path.join(__dirname, "../profiles");

export interface Session {
  userId: string;
  platform: "naver" | "tistory";
  username: string;
  blogName?: string;
  cookies: any[];
  savedAt: string;
}

const sessionPath = (userId: string) => path.join(SESSIONS_DIR, `${userId}.json`);
export const profilePath = (userId: string) => path.join(PROFILES_DIR, userId);

export async function saveSession(
  userId: string,
  platform: "naver" | "tistory",
  username: string,
  password: string,
  blogName?: string
): Promise<{ cookies: number }> {
  await fs.ensureDir(SESSIONS_DIR);
  await fs.ensureDir(profilePath(userId));

  // 영구 컨텍스트 - 사용자별 크롬 프로필 사용
  const context = await chromium.launchPersistentContext(profilePath(userId), {
    headless: false,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "ko-KR",
  });
  const page = context.pages()[0] || await context.newPage();

  try {
    if (platform === "naver") {
      await page.goto("https://nid.naver.com/nidlogin.login", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      
      // 이미 로그인되어 있으면 스킵
      if (!page.url().includes("nidlogin")) {
        console.log("[session] 이미 로그인 상태");
      } else {
        await page.evaluate((id: string) => {
          const el = document.querySelector("#id") as HTMLInputElement;
          if (el) { el.value = id; el.dispatchEvent(new Event("input", { bubbles: true })); }
        }, username);
        await page.waitForTimeout(400);
        await page.evaluate((pw: string) => {
          const el = document.querySelector("#pw") as HTMLInputElement;
          if (el) { el.value = pw; el.dispatchEvent(new Event("input", { bubbles: true })); }
        }, password);
        await page.waitForTimeout(400);
        await page.click(".btn_login");
        await page.waitForTimeout(3000);

        if (page.url().includes("nid.naver.com")) {
          console.log("[session] 추가 인증 대기 중 (최대 60초)...");
          await page.waitForURL("**/naver.com**", { timeout: 60000 }).catch(() => {});
        }
      }

      await page.goto("https://www.naver.com", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);

      console.log("[session] 블로그 아이디 추출 중...");
      try {
        await page.goto("https://blog.naver.com", { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(3000);

        let blogId: string | null = await page.evaluate(() => {
          const selectors = ["a.link_mynblog", "a[href*='PostList.naver']", "a[href*='blog.naver.com/']", ".gnb_my a"];
          for (const sel of selectors) {
            const el = document.querySelector(sel) as HTMLAnchorElement;
            if (el && el.href) {
              const m = el.href.match(/blog\.naver\.com\/([a-zA-Z0-9_-]+)(?:\?|$|\/)/);
              if (m && m[1] && m[1] !== "PostList" && m[1] !== "BlogHome") return m[1];
            }
          }
          return null;
        });

        if (!blogId) {
          blogId = await page.evaluate(() => {
            const writeBtn = document.querySelector("a[href*='Redirect=Write']") as HTMLAnchorElement;
            if (writeBtn) {
              const m = writeBtn.href.match(/blog\.naver\.com\/([a-zA-Z0-9_-]+)/);
              return m ? m[1] : null;
            }
            return null;
          });
        }

        if (blogId) {
          console.log(`[session] ✅ 블로그 아이디 자동 감지: ${blogId}`);
          blogName = blogId;
        } else {
          console.warn("[session] ⚠️ 블로그 아이디 자동 감지 실패");
        }
      } catch (e: any) {
        console.warn("[session] 블로그 아이디 추출 에러:", e.message);
      }
    }

    const cookies = await context.cookies();
    const session: Session = {
      userId, platform, username, blogName, cookies,
      savedAt: new Date().toISOString(),
    };
    await fs.writeJson(sessionPath(userId), session, { spaces: 2 });
    await context.close();
    console.log(`[session] ${platform} 세션 저장 완료: ${username} (쿠키 ${cookies.length}개) — 프로필 영구 저장됨`);
    return { cookies: cookies.length };
  } catch (e) {
    await context.close();
    throw e;
  }
}

export async function getSession(userId: string): Promise<Session | null> {
  try {
    if (!await fs.pathExists(sessionPath(userId))) return null;
    return await fs.readJson(sessionPath(userId));
  } catch { return null; }
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
  await fs.remove(profilePath(userId));
}
