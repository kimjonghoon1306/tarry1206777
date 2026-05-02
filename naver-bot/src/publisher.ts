import { chromium } from "playwright";
import { Session, updateCookies } from "./session-manager";

interface PublishOptions {
  session: Session;
  title: string;
  content: string;
  imageUrls: string[];
  tags: string[];
}

export async function publishToNaver(opts: PublishOptions): Promise<{ postUrl?: string; publishedAt: string }> {
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

  try {
    const page = await context.newPage();

    // 네이버 메인 방문
    console.log("[naver] 쿠키 적용 중...");
    await page.goto("https://www.naver.com", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    // 글쓰기 페이지 진입 - 새 탭 감지
    const blogId = session.blogName || session.username;
    console.log("[naver] 글쓰기 직접 진입:", blogId);
    
    const pagePromise = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);
    await page.goto(`https://blog.naver.com/${blogId}?Redirect=Write&`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    
    const newPage = await pagePromise;
    const writePage = newPage ?? page;
    await writePage.bringToFront();
    await writePage.waitForLoadState("domcontentloaded");
    await writePage.waitForTimeout(5000);
    console.log("[naver] 글쓰기 최종 URL:", writePage.url());

    // 에디터 로드 대기
    await writePage.waitForSelector(".se-placeholder, .se-title-input, [contenteditable]", { timeout: 30000 });
    await writePage.waitForTimeout(3000);

    // 제목 입력
    console.log("[naver] 제목 입력...");
    try {
      const titleFrame = writePage.frameLocator(".se-title-input iframe").first();
      await titleFrame.locator("[contenteditable='true']").fill(title).catch(async () => {
        await writePage.click(".se-title-input").catch(() => {});
        await writePage.keyboard.type(title, { delay: 20 });
      });
    } catch {
      await writePage.click(".se-title-input").catch(() => {});
      await writePage.keyboard.type(title, { delay: 20 });
    }
    await writePage.waitForTimeout(500);

    // 본문 입력
    console.log("[naver] 본문 입력...");
    try {
      const editorFrame = writePage.frameLocator(".se-main-section iframe").first();
      const editorBody = editorFrame.locator("[contenteditable='true']").first();
      await editorBody.click();
      await writePage.waitForTimeout(300);
      await writePage.evaluate((text: string) => navigator.clipboard.writeText(text).catch(() => {}), content);
      await writePage.keyboard.press("Control+v");
    } catch {
      await writePage.click("[contenteditable='true']").catch(() => {});
      await writePage.keyboard.type(content.slice(0, 2000), { delay: 5 });
    }
    await writePage.waitForTimeout(800);

    // 태그 입력
    if (tags.length > 0) {
      try {
        const tagInput = await writePage.$(".tag_input, input[placeholder*='태그']");
        if (tagInput) {
          await tagInput.click();
          for (const tag of tags.slice(0, 10)) {
            await tagInput.type(tag);
            await writePage.keyboard.press("Enter");
            await writePage.waitForTimeout(150);
          }
        }
      } catch { console.warn("[naver] 태그 입력 실패"); }
    }

    // 발행
    console.log("[naver] 발행 처리...");
    const publishBtn = await writePage.$("button[data-action='publish'], button:has-text('발행'), .publish_btn");
    if (!publishBtn) throw new Error("발행 버튼 없음");
    await publishBtn.click();
    await writePage.waitForTimeout(2000);

    // 팝업 처리
    try {
      const publicBtn = await writePage.$("label:has-text('전체공개'), input[value='0']");
      if (publicBtn) await publicBtn.click();
      const confirmBtn = await writePage.$("button.btn_publish, button:has-text('발행')");
      if (confirmBtn) await confirmBtn.click();
    } catch { console.warn("[naver] 발행 팝업 경고"); }

    await writePage.waitForTimeout(3000);
    const postUrl = writePage.url();

    const cookies = await context.cookies();
    await updateCookies(session.userId, cookies);
    await browser.close();

    console.log("[naver] 발행 완료:", postUrl);
    return { postUrl, publishedAt: new Date().toISOString() };
  } catch (e) {
    await browser.close();
    throw e;
  }
}
