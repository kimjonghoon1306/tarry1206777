import { chromium } from "playwright";
import { Session, updateCookies } from "./session-manager";

interface TistoryOptions {
  session: Session;
  title: string;
  content: string;
  imageUrls: string[];
  tags: string[];
}

export async function publishToTistory(opts: TistoryOptions): Promise<{ postUrl?: string; publishedAt: string }> {
  const { session, title, content, tags } = opts;

  const browser = await chromium.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
  });
  await context.addCookies(session.cookies);
  const page = await context.newPage();

  const blogName = session.blogName || session.username;

  try {
    // 로그인 확인
    await page.goto(`https://${blogName}.tistory.com/manage`, { waitUntil: "networkidle" });
    const isLoggedIn = !page.url().includes("login");
    if (!isLoggedIn) throw new Error("티스토리 세션 만료. 재연결 필요");

    // 글쓰기 페이지
    console.log("[tistory] 글쓰기 진입...");
    await page.goto(`https://${blogName}.tistory.com/manage/newpost/`, {
      waitUntil: "networkidle", timeout: 30000,
    });
    await page.waitForTimeout(2500);

    // 제목 입력
    const titleInput = await page.$("input#post-title-inp, input[placeholder*='제목']");
    if (titleInput) {
      await titleInput.click();
      await titleInput.fill(title);
    }
    await page.waitForTimeout(500);

    // 에디터 모드 전환 (HTML 모드)
    try {
      const htmlModeBtn = await page.$("button[data-mode='html'], button:has-text('HTML'), #editor-mode-html");
      if (htmlModeBtn) { await htmlModeBtn.click(); await page.waitForTimeout(1000); }
    } catch { console.warn("[tistory] HTML 모드 전환 실패, 기본 에디터 사용"); }

    // 본문 입력
    try {
      const editor = await page.$("#editor-ttml, textarea#contents, .CodeMirror-code, [contenteditable='true']");
      if (editor) {
        await editor.click();
        await page.evaluate((text) => navigator.clipboard.writeText(text).catch(() => {}), content);
        await page.keyboard.press("Control+a");
        await page.keyboard.press("Control+v");
      }
    } catch { console.warn("[tistory] 본문 입력 실패"); }
    await page.waitForTimeout(800);

    // 태그 입력
    if (tags.length > 0) {
      try {
        const tagArea = await page.$("input#tag-name, input[placeholder*='태그']");
        if (tagArea) {
          for (const tag of tags.slice(0, 10)) {
            await tagArea.fill(tag);
            await page.keyboard.press("Enter");
            await page.waitForTimeout(200);
          }
        }
      } catch { console.warn("[tistory] 태그 입력 실패"); }
    }

    // 발행
    console.log("[tistory] 발행 처리...");
    const publishBtn = await page.$("button[data-btn='publish'], button:has-text('완료'), button:has-text('발행')");
    if (!publishBtn) throw new Error("발행 버튼 없음");
    await publishBtn.click();
    await page.waitForTimeout(2000);

    // 공개 확인
    try {
      const publicBtn = await page.$("button[data-status='public'], label:has-text('공개')");
      if (publicBtn) await publicBtn.click();
      const confirmBtn = await page.$("button[data-btn='publish-confirm'], button:has-text('확인')");
      if (confirmBtn) await confirmBtn.click();
    } catch { console.warn("[tistory] 발행 팝업 처리 경고"); }

    await page.waitForTimeout(3000);
    const postUrl = page.url();

    const cookies = await context.cookies();
    await updateCookies(session.userId, cookies);
    await browser.close();

    console.log("[tistory] 발행 완료:", postUrl);
    return { postUrl, publishedAt: new Date().toISOString() };
  } catch (e) {
    await browser.close();
    throw e;
  }
}
