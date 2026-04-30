import fs from "fs-extra";
import path from "path";
import { chromium } from "playwright";

const SESSIONS_DIR = path.join(__dirname, "../sessions");

export interface Session {
  userId: string;
  platform: "naver" | "tistory";
  username: string;
  blogName?: string;
  cookies: any[];
  savedAt: string;
}

const sessionPath = (userId: string) => path.join(SESSIONS_DIR, `${userId}.json`);

export async function saveSession(
  userId: string,
  platform: "naver" | "tistory",
  username: string,
  password: string,
  blogName?: string
): Promise<{ cookies: number }> {
  await fs.ensureDir(SESSIONS_DIR);

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  try {
    if (platform === "naver") {
      await page.goto("https://nid.naver.com/nidlogin.login", { waitUntil: "domcontentloaded" });
      await page.evaluate((id) => {
        const el = document.querySelector("#id") as HTMLInputElement;
        if (el) { el.value = id; el.dispatchEvent(new Event("input", { bubbles: true })); }
      }, username);
      await page.waitForTimeout(400);
      await page.evaluate((pw) => {
        const el = document.querySelector("#pw") as HTMLInputElement;
        if (el) { el.value = pw; el.dispatchEvent(new Event("input", { bubbles: true })); }
      }, password);
      await page.waitForTimeout(400);
      await page.click(".btn_login");
      await page.waitForTimeout(3000);

      // 추가 인증 대기 (최대 60초)
      if (page.url().includes("nid.naver.com")) {
        console.log("[session] 추가 인증 대기 중 (최대 60초)...");
        await page.waitForURL("**/naver.com**", { timeout: 60000 }).catch(() => {});
      }

      // 네이버 메인까지 이동해서 모든 쿠키 수집
      await page.goto("https://www.naver.com", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.goto("https://blog.naver.com", { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000);

    } else {
      await page.goto("https://www.tistory.com/auth/login", { waitUntil: "networkidle" });
      await page.click(".btn_login.btn_kakao");
      await page.waitForTimeout(2000);
      await page.fill("#loginId--1", username).catch(() => {});
      await page.fill("#password--2", password).catch(() => {});
      await page.click(".btn_confirm.btn_login").catch(() => {});
      await page.waitForTimeout(5000);

      if (page.url().includes("accounts.kakao.com") || page.url().includes("tistory.com/auth")) {
        console.log("[session] 티스토리 추가 인증 대기 (최대 60초)...");
        await page.waitForURL("**tistory.com**", { timeout: 60000 }).catch(() => {});
      }
    }

    const cookies = await context.cookies();
    const session: Session = {
      userId, platform, username, blogName, cookies,
      savedAt: new Date().toISOString(),
    };
    await fs.writeJson(sessionPath(userId), session, { spaces: 2 });
    await browser.close();
    console.log(`[session] ${platform} 세션 저장 완료: ${username} (쿠키 ${cookies.length}개)`);
    return { cookies: cookies.length };
  } catch (e) {
    await browser.close();
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
}
