import { chromium } from "playwright";
import fs from "fs-extra";
import path from "path";
import axios from "axios";

const SESSION_PATH = path.join(__dirname, "../sessions/google-flow.json");
const IMAGES_DIR   = path.join(__dirname, "../generated-images");

interface FlowOptions {
  googleEmail: string;
  googlePw: string;
  prompt: string;
  count: number;
}

export async function generateFlowImage(opts: FlowOptions): Promise<string[]> {
  const { googleEmail, googlePw, prompt, count } = opts;
  await fs.ensureDir(IMAGES_DIR);

  const browser = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
  });

  const saved = await loadFlowSession();
  if (saved) await context.addCookies(saved);

  const page = await context.newPage();
  const imagePaths: string[] = [];

  try {
    await page.goto("https://labs.google/flow", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    const needLogin = page.url().includes("accounts.google.com") ||
      await page.$("button:has-text('Sign in')").then(Boolean).catch(()=>false);

    if (needLogin) {
      await page.waitForSelector("input[type='email']", { timeout: 15000 });
      await page.fill("input[type='email']", googleEmail);
      await page.click("#identifierNext");
      await page.waitForSelector("input[type='password']", { timeout: 10000 });
      await page.waitForTimeout(1000);
      await page.fill("input[type='password']", googlePw);
      await page.click("#passwordNext");
      await page.waitForTimeout(3000);

      const url = page.url();
      if (url.includes("accounts.google.com")) {
        console.log("[flow] 추가 인증 대기 (최대 60초)...");
        await page.waitForURL("**labs.google**", { timeout: 60000 }).catch(() => {});
      }
    }

    // 이미지 생성 페이지 진입
    const createBtn = await page.$("button:has-text('Create'), a:has-text('Create with Flow')");
    if (createBtn) { await createBtn.click(); await page.waitForTimeout(2000); }

    // 프롬프트 입력
    const input = await page.$("textarea, input[type='text']");
    if (!input) throw new Error("프롬프트 입력창 없음");
    await input.fill(prompt);
    await page.waitForTimeout(400);

    // 생성 클릭
    const genBtn = await page.$("button[type='submit'], button:has-text('Generate'), button:has-text('Create')");
    if (!genBtn) throw new Error("생성 버튼 없음");
    await genBtn.click();

    // 완료 대기
    console.log("[flow] 이미지 생성 대기 중...");
    await page.waitForTimeout(5000);
    await page.waitForSelector("img[src*='blob:'], img[src*='googleusercontent']", { timeout: 60000 });

    // 이미지 다운로드
    const imgs = await page.$$("img[src*='blob:'], img[src*='googleusercontent']");
    for (let i = 0; i < Math.min(count, imgs.length); i++) {
      const src = await imgs[i].getAttribute("src");
      if (!src) continue;
      const filename = `flow_${Date.now()}_${i}.jpg`;
      const savePath = path.join(IMAGES_DIR, filename);

      if (src.startsWith("blob:")) {
        const b64 = await page.evaluate(async (url) => {
          const r = await fetch(url);
          const blob = await r.blob();
          return new Promise<string>(res => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result as string);
            fr.readAsDataURL(blob);
          });
        }, src);
        await fs.writeFile(savePath, Buffer.from(b64.split(",")[1], "base64"));
      } else {
        const r = await axios.get(src, { responseType: "arraybuffer" });
        await fs.writeFile(savePath, Buffer.from(r.data));
      }
      imagePaths.push(savePath);
      console.log("[flow] 저장:", filename);
    }

    await saveFlowSession(await context.cookies());
    await browser.close();
    return imagePaths;
  } catch (e) {
    await browser.close();
    throw e;
  }
}

async function saveFlowSession(cookies: any[]) {
  await fs.ensureDir(path.dirname(SESSION_PATH));
  await fs.writeJson(SESSION_PATH, cookies, { spaces: 2 });
}

async function loadFlowSession(): Promise<any[] | null> {
  try {
    if (!await fs.pathExists(SESSION_PATH)) return null;
    return await fs.readJson(SESSION_PATH);
  } catch { return null; }
}
