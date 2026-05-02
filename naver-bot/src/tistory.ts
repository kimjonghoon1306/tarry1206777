import { Page } from "playwright";
import { Session, updateCookies, buildHeadlessContext } from "./session-manager";

interface TistoryOptions {
  session: Session;
  title: string;
  content: string;
  imageUrls: string[];
  tags: string[];
}

interface PublishResult {
  postUrl?: string;
  publishedAt: string;
}

/* ──────────────────────────────────────────────────────────────────
 * 티스토리 자동 발행 (헤드리스)
 *
 * 핵심:
 * 1. blogName.tistory.com/manage/newpost 직접 진입
 * 2. 제목/본문은 일반 input + textarea (네이버보다 단순)
 * 3. HTML 모드 전환 후 본문 주입이 가장 안정적
 * ────────────────────────────────────────────────────────────────── */
export async function publishToTistory(opts: TistoryOptions): Promise<PublishResult> {
  const { session, title, content, tags } = opts;

  if (!session.blogName) {
    throw new Error("session.blogName 없음. 티스토리 블로그 주소(예: myblog) 설정 필요");
  }

  const { browser, context } = await buildHeadlessContext(session);

  try {
    const page = await context.newPage();

    // 1. 글쓰기 페이지 직접 진입
    const writeUrl = `https://${session.blogName}.tistory.com/manage/newpost/`;
    console.log(`[tistory] 글쓰기 진입: ${writeUrl}`);
    await page.goto(writeUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // 세션 만료 체크
    if (page.url().includes("kakao.com") || page.url().includes("login")) {
      throw new Error("티스토리 세션 만료. 계정 재연결 필요");
    }

    await page.waitForTimeout(3000);

    // 2. 임시저장 복원 팝업 닫기
    await dismissDraftPopup(page);

    // 3. 제목 입력
    console.log("[tistory] 제목 입력...");
    const titleInput = page.locator("#post-title-inp, input[name='title'], textarea[name='title']").first();
    await titleInput.waitFor({ timeout: 15000 });
    await titleInput.click();
    await titleInput.fill(title);
    await page.waitForTimeout(500);

    // 4. HTML 모드로 전환 (가장 안정적)
    console.log("[tistory] HTML 모드 전환...");
    try {
      // 모드 변경 버튼 클릭
      await page.click("#editor-mode-layer-btn-open, .btn-edit-mode", { timeout: 5000 });
      await page.waitForTimeout(800);
      // HTML 선택
      await page.click("#editor-mode-html, [data-mode='html']", { timeout: 5000 });
      await page.waitForTimeout(800);
      // 모드 변경 확인 팝업
      await page.click(".btn-default.btn-confirm, button:has-text('확인')", { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1500);
    } catch (e) {
      console.warn("[tistory] HTML 모드 전환 실패, 기본 모드로 진행");
    }

    // 5. 본문 입력 - HTML 모드의 textarea (CodeMirror)
    console.log("[tistory] 본문 입력...");
    const htmlContent = content.replace(/\n/g, "<br>");

    try {
      // CodeMirror 영역 직접 조작
      await page.evaluate((html) => {
        const cm = (window as any).CodeMirror;
        const editor = document.querySelector(".CodeMirror") as any;
        if (editor && editor.CodeMirror) {
          editor.CodeMirror.setValue(html);
          return true;
        }
        // 폴백: textarea 직접
        const ta = document.querySelector("textarea#html-editor, textarea.html-source") as HTMLTextAreaElement;
        if (ta) {
          ta.value = html;
          ta.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        }
        return false;
      }, htmlContent);
      await page.waitForTimeout(800);
    } catch (e) {
      console.warn("[tistory] HTML 직접 주입 실패, contenteditable 시도");
      // 최후 폴백 - iframe 내부 body 클릭 후 키보드 입력
      try {
        const editorFrame = page.frameLocator(".tox-edit-area iframe, iframe.tx_canvas_iframe").first();
        await editorFrame.locator("body").click({ timeout: 5000 });
        await page.keyboard.type(content, { delay: 5 });
      } catch {}
    }

    // 6. 태그 입력
    if (tags.length > 0) {
      console.log(`[tistory] 태그 ${tags.length}개 입력...`);
      try {
        const tagInput = page.locator("#tagText, input[name='tag'], input.tagText").first();
        await tagInput.click({ timeout: 5000 });
        for (const tag of tags.slice(0, 30)) {
          await tagInput.fill(tag);
          await page.keyboard.press("Enter");
          await page.waitForTimeout(150);
        }
      } catch {
        console.warn("[tistory] 태그 입력 실패 (무시)");
      }
    }

    // 7. 발행 1단계: "완료" 또는 "발행" 버튼
    console.log("[tistory] 발행 버튼 클릭...");
    await page.click(
      "#publish-layer-btn, button.btn-publish, button:has-text('완료'), button:has-text('발행')"
    , { timeout: 10000 });
    await page.waitForTimeout(2000);

    // 8. 발행 2단계: 패널에서 "공개" 선택 후 최종 발행
    try {
      // 공개 라디오 선택
      await page.click("#open20, label[for='open20'], input[value='20']", { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);

      // 최종 발행 버튼
      await page.click(
        "#publish-btn, button.btn-publish-confirm, .layer-btn-publish button:has-text('공개 발행')"
      , { timeout: 10000 });
    } catch {
      // 폴백: 가장 마지막 발행 버튼
      await page.locator("button:has-text('공개 발행'), button:has-text('발행')").last().click({ timeout: 10000 });
    }

    // 9. 발행 완료 대기
    console.log("[tistory] 발행 완료 대기...");
    await page.waitForTimeout(5000);

    // URL 추출 시도
    let postUrl = `https://${session.blogName}.tistory.com`;
    try {
      const url = page.url();
      const m = url.match(/\/(\d+)(?:\?|$)/);
      if (m) postUrl = `https://${session.blogName}.tistory.com/${m[1]}`;
    } catch {}

    // 쿠키 갱신
    const cookies = await context.cookies();
    await updateCookies(session.userId, cookies);

    await browser.close();
    console.log(`[tistory] ✅ 발행 완료: ${postUrl}`);
    return { postUrl, publishedAt: new Date().toISOString() };
  } catch (e: any) {
    try {
      const pages = context.pages();
      if (pages.length > 0) {
        const fs = await import("fs-extra");
        const path = await import("path");
        const debugDir = path.join(__dirname, "../debug");
        await fs.ensureDir(debugDir);
        const fname = `tistory_error_${session.userId}_${Date.now()}.png`;
        await pages[0].screenshot({ path: path.join(debugDir, fname), fullPage: true });
        console.error(`[tistory] 디버그 스크린샷: ${fname}`);
      }
    } catch {}
    await browser.close().catch(() => {});
    throw e;
  }
}

async function dismissDraftPopup(page: Page) {
  try {
    const popup = page.locator(
      ".btn-cancel:has-text('취소'), " +
      "button:has-text('새로 작성'), " +
      "#mfHandler_popButton_close"
    ).first();
    if (await popup.isVisible({ timeout: 3000 })) {
      await popup.click();
      console.log("[tistory] 임시저장 팝업 닫음");
    }
  } catch {}
}
