import { chromium, Page } from "playwright";
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
  const page = await context.newPage();

  try {
    // 로그인 유지 확인
    // 세션 쿠키로 바로 글쓰기 진입
    console.log("[naver] 세션 쿠키로 글쓰기 진입...");

    // 글쓰기 진입
    console.log("[naver] 글쓰기 진입...");
    await page.goto(`https://blog.naver.com/posting/start.naver?blogId=${session.username}`, {
      waitUntil: "domcontentloaded", timeout: 60000,
    });
    await page.waitForTimeout(2500);

    // 에디터 로드 대기
    await page.waitForSelector("iframe, .se-placeholder", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // 제목 입력
    console.log("[naver] 제목 입력...");
    try {
      const titleFrame = page.frameLocator(".se-title-input iframe, iframe[name*='title']").first();
      await titleFrame.locator("[contenteditable='true']").fill(title).catch(async () => {
        await page.click(".se-title-input, .PostTitleInput, input[placeholder*='제목']").catch(() => {});
        await page.keyboard.type(title, { delay: 20 });
      });
    } catch {
      await page.click(".se-title-input").catch(() => {});
      await page.keyboard.type(title, { delay: 20 });
    }
    await page.waitForTimeout(500);

    // 본문 입력 (클립보드 방식)
    console.log("[naver] 본문 입력...");
    try {
      const editorFrame = page.frameLocator(".se-main-section iframe, .se-editor iframe").first();
      const editorBody = editorFrame.locator("[contenteditable='true'], .se-content").first();
      await editorBody.click();
      await page.waitForTimeout(300);
      await page.evaluate((text) => navigator.clipboard.writeText(text).catch(() => {}), content);
      await page.keyboard.press("Control+v");
    } catch {
      console.warn("[naver] iframe 접근 실패, 직접 입력 시도");
      await page.click(".se-content, .se-paragraph-text, [contenteditable='true']").catch(() => {});
      await page.keyboard.type(content.slice(0, 2000), { delay: 5 });
    }
    await page.waitForTimeout(800);

    // 태그 입력
    if (tags.length > 0) {
      try {
        const tagInput = await page.$(".tag_input, input[placeholder*='태그'], .se-tag");
        if (tagInput) {
          await tagInput.click();
          for (const tag of tags.slice(0, 10)) {
            await tagInput.type(tag);
            await page.keyboard.press("Enter");
            await page.waitForTimeout(150);
          }
        }
      } catch { console.warn("[naver] 태그 입력 실패"); }
    }

    // 발행
    console.log("[naver] 발행 처리...");
    const publishBtn = await page.$("button[data-action='publish'], button:has-text('발행'), .publish_btn, .se-publish-button");
    if (!publishBtn) throw new Error("발행 버튼 없음");
    await publishBtn.click();
    await page.waitForTimeout(2000);

    // 팝업에서 전체 공개 + 확인
    try {
      const publicBtn = await page.$("label:has-text('전체공개'), input[value='0']");
      if (publicBtn) await publicBtn.click();
      const confirmBtn = await page.$("button.btn_publish, button:has-text('발행'), .confirm_btn");
      if (confirmBtn) await confirmBtn.click();
    } catch { console.warn("[naver] 발행 팝업 처리 중 경고"); }

    await page.waitForTimeout(3000);
    const postUrl = page.url();

    // 쿠키 갱신
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
