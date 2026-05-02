import { Page, FrameLocator } from "playwright";
import { Session, updateCookies, buildHeadlessContext } from "./session-manager";

interface PublishOptions {
  session: Session;
  title: string;
  content: string;
  imageUrls: string[];   // 현재 미사용. 추후 본문 삽입 확장
  tags: string[];
}

interface PublishResult {
  postUrl?: string;
  publishedAt: string;
}

/* ──────────────────────────────────────────────────────────────────
 * 네이버 블로그 자동 발행 (헤드리스)
 *
 * 핵심 포인트:
 * 1. PostWriteForm.naver?blogId=xxx 로 직접 진입 (Redirect=Write 안 씀)
 * 2. #mainFrame iframe 안으로 들어가야 SmartEditor가 잡힘
 * 3. "작성 중인 글 복원" 팝업 자동 취소
 * 4. SmartEditor ONE의 contenteditable 영역에 직접 입력
 * 5. 발행 2단계 (발행 버튼 → 공개설정 패널 → 최종 발행)
 * ────────────────────────────────────────────────────────────────── */
export async function publishToNaver(opts: PublishOptions): Promise<PublishResult> {
  const { session, title, content, tags } = opts;

  if (!session.blogName) {
    throw new Error("session.blogName 없음. 재연결 필요");
  }

  const { browser, context } = await buildHeadlessContext(session);

  try {
    const page = await context.newPage();

    // 0. 세션 살아있는지 가볍게 확인
    console.log("[naver] 세션 확인 중...");
    await page.goto("https://www.naver.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1500);

    // 1. 글쓰기 페이지 직접 진입 (이게 핵심)
    //    Redirect=Write 는 새 창 띄우는 리다이렉트라 봇이 못 따라감
    //    PostWriteForm.naver 가 진짜 글쓰기 URL
    const blogId = session.blogName;
    const writeUrl = `https://blog.naver.com/PostWriteForm.naver?blogId=${blogId}`;
    console.log(`[naver] 글쓰기 진입: ${writeUrl}`);

    await page.goto(writeUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 세션 만료 체크
    if (page.url().includes("nidlogin") || page.url().includes("login.naver")) {
      throw new Error("네이버 세션 만료. 계정 재연결 필요");
    }

    // 2. mainFrame iframe 찾기 (이게 두 번째 핵심)
    //    PostWriteForm 페이지는 #mainFrame 안에 SmartEditor가 들어있음
    console.log("[naver] mainFrame 로드 대기...");
    await page.waitForSelector("iframe#mainFrame, frame#mainFrame", { timeout: 30000 });
    await page.waitForTimeout(3000);

    const mainFrame: FrameLocator = page.frameLocator("#mainFrame");

    // 3. "작성 중인 글 복원" 팝업 처리 (이게 세 번째 핵심)
    //    이걸 안 닫으면 에디터가 활성화 안 됨
    await dismissDraftPopup(mainFrame);

    // 4. "도움말" 또는 "처음 사용 가이드" 레이어 닫기 (있을 때만)
    await dismissHelpLayer(mainFrame);

    // 5. 에디터 로드 대기 - 여러 셀렉터로 시도
    console.log("[naver] SmartEditor 로드 대기...");
    await mainFrame.locator(".se-section-documentTitle, .se_documentTitle, .se-title-text").first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(2000);

    // 6. 제목 입력
    console.log("[naver] 제목 입력...");
    await typeTitle(page, mainFrame, title);

    // 7. 본문 입력
    console.log("[naver] 본문 입력...");
    await typeContent(page, mainFrame, content);

    // 8. 발행 1단계: 우측 상단 "발행" 버튼
    console.log("[naver] 발행 버튼 클릭...");
    const publishBtn = mainFrame.locator(
      "button.publish_btn__m9KHH, " +
      "button[class*='publish_btn'], " +
      ".publish_btn, " +
      "button:has-text('발행')"
    ).first();
    await publishBtn.click({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // 9. 발행 2단계: 공개 설정 패널에서 옵션 처리 후 최종 발행
    //    - 전체공개 선택
    //    - 태그 입력
    //    - 최종 "발행" 버튼
    await handlePublishPanel(page, mainFrame, tags);

    // 10. 발행 완료 대기 + URL 추출
    console.log("[naver] 발행 완료 대기...");
    await page.waitForTimeout(5000);

    // 발행 후 URL은 보통 PostList.naver 또는 PostView.naver 로 이동
    let postUrl = page.url();
    try {
      // 가장 최근 글 URL 추출 시도
      const latestPostUrl = await extractLatestPostUrl(page, blogId);
      if (latestPostUrl) postUrl = latestPostUrl;
    } catch {}

    // 쿠키 갱신 (만료 연장)
    const cookies = await context.cookies();
    await updateCookies(session.userId, cookies);

    await browser.close();
    console.log(`[naver] ✅ 발행 완료: ${postUrl}`);
    return { postUrl, publishedAt: new Date().toISOString() };
  } catch (e: any) {
    // 디버깅용 스크린샷 (개발 시에만)
    try {
      const pages = context.pages();
      if (pages.length > 0) {
        const fs = await import("fs-extra");
        const path = await import("path");
        const debugDir = path.join(__dirname, "../debug");
        await fs.ensureDir(debugDir);
        const fname = `error_${session.userId}_${Date.now()}.png`;
        await pages[0].screenshot({ path: path.join(debugDir, fname), fullPage: true });
        console.error(`[naver] 디버그 스크린샷: ${fname}`);
      }
    } catch {}
    await browser.close().catch(() => {});
    throw e;
  }
}

/* ──────────────────────────────────────────────────────────────────
 * 헬퍼: "작성 중인 글 복원" 팝업 닫기
 * ────────────────────────────────────────────────────────────────── */
async function dismissDraftPopup(mainFrame: FrameLocator) {
  try {
    // 팝업이 뜨는지 확인 (3초 대기)
    const popup = mainFrame.locator(".se-popup-button-cancel, button.se-popup-button-cancel").first();
    await popup.waitFor({ timeout: 3000 });
    await popup.click({ timeout: 3000 });
    console.log("[naver] '작성 중인 글' 팝업 취소 완료");
  } catch {
    // 팝업이 없는 경우 (정상)
  }

  // 다른 형태의 팝업도 시도
  try {
    const altPopup = mainFrame.locator("button:has-text('취소'), button:has-text('아니오')").first();
    if (await altPopup.isVisible({ timeout: 1000 })) {
      await altPopup.click();
      console.log("[naver] 보조 팝업 취소 완료");
    }
  } catch {}
}

/* ──────────────────────────────────────────────────────────────────
 * 헬퍼: 도움말 레이어 닫기
 * ────────────────────────────────────────────────────────────────── */
async function dismissHelpLayer(mainFrame: FrameLocator) {
  try {
    const closeBtn = mainFrame.locator(
      ".se-help-panel-close-button, " +
      "button.se-help-panel-close-button, " +
      ".help-panel-close, " +
      "button[aria-label='닫기']"
    ).first();
    if (await closeBtn.isVisible({ timeout: 1500 })) {
      await closeBtn.click();
      console.log("[naver] 도움말 레이어 닫음");
    }
  } catch {}
}

/* ──────────────────────────────────────────────────────────────────
 * 헬퍼: 제목 입력
 * SmartEditor ONE은 제목도 contenteditable로 되어있음
 * ────────────────────────────────────────────────────────────────── */
async function typeTitle(page: Page, mainFrame: FrameLocator, title: string) {
  // 제목 영역 클릭
  const titleArea = mainFrame.locator(
    ".se-section-documentTitle .se-text-paragraph, " +
    ".se_documentTitle .se-text-paragraph, " +
    ".se-title-text [contenteditable='true']"
  ).first();

  await titleArea.click({ timeout: 10000 });
  await page.waitForTimeout(500);

  // 키보드로 직접 타이핑 (네이버는 fill이 잘 안 먹음)
  await page.keyboard.type(title, { delay: 30 });
  await page.waitForTimeout(800);
}

/* ──────────────────────────────────────────────────────────────────
 * 헬퍼: 본문 입력
 * ────────────────────────────────────────────────────────────────── */
async function typeContent(page: Page, mainFrame: FrameLocator, content: string) {
  // 본문 영역 클릭 - 제목 다음의 첫 컴포넌트
  const bodyArea = mainFrame.locator(
    ".se-component-content .se-text-paragraph, " +
    ".se-main-container .se-text-paragraph, " +
    ".se-component.se-text [contenteditable='true']"
  ).first();

  await bodyArea.click({ timeout: 10000 });
  await page.waitForTimeout(500);

  // 본문은 줄바꿈 처리가 필요
  // 한 줄씩 타이핑하며 Enter
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) {
      await page.keyboard.type(lines[i], { delay: 8 });
    }
    if (i < lines.length - 1) {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(50);
    }
  }
  await page.waitForTimeout(800);
}

/* ──────────────────────────────────────────────────────────────────
 * 헬퍼: 발행 패널 처리 (공개설정 + 태그 + 최종 발행)
 * ────────────────────────────────────────────────────────────────── */
async function handlePublishPanel(page: Page, mainFrame: FrameLocator, tags: string[]) {
  // 1. 발행 패널이 열렸는지 확인
  console.log("[naver] 발행 패널 처리 중...");
  await page.waitForTimeout(1500);

  // 2. 전체공개 선택 (기본값이긴 하지만 명시적으로)
  try {
    const publicRadio = mainFrame.locator(
      "input[value='0'][name*='open'], " +
      "label:has-text('전체공개'), " +
      ".btn_public[value='0']"
    ).first();
    if (await publicRadio.isVisible({ timeout: 2000 })) {
      await publicRadio.click();
      console.log("[naver] 전체공개 선택");
    }
  } catch {}

  // 3. 태그 입력
  if (tags.length > 0) {
    try {
      const tagInput = mainFrame.locator(
        "input.tag_input, " +
        "input[placeholder*='태그'], " +
        ".tag_text input, " +
        ".tag-input"
      ).first();
      await tagInput.click({ timeout: 5000 });
      for (const tag of tags.slice(0, 30)) {
        await tagInput.fill(tag);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(150);
      }
      console.log(`[naver] 태그 ${tags.length}개 입력`);
    } catch {
      console.warn("[naver] 태그 입력 실패 (무시)");
    }
  }

  // 4. 최종 발행 버튼
  //    이게 패널 안의 "발행" 버튼 (1단계 발행 버튼과 다름)
  console.log("[naver] 최종 발행...");
  const finalPublishBtn = mainFrame.locator(
    "button.confirm_btn__b_X8s, " +
    "button[class*='confirm_btn'], " +
    ".btn_panel_publish, " +
    "button[data-testid='seOnePublishBtn'], " +
    "button[data-click-area*='publish']"
  ).first();

  // 폴백: 패널 내 '발행' 텍스트 버튼
  try {
    await finalPublishBtn.click({ timeout: 10000 });
  } catch {
    console.log("[naver] 폴백: 텍스트로 발행 버튼 찾기");
    await mainFrame.locator("button:has-text('발행')").last().click({ timeout: 10000 });
  }
}

/* ──────────────────────────────────────────────────────────────────
 * 헬퍼: 발행된 글의 URL 추출
 * 발행 후 PostList나 PostView로 이동했을 때 URL 정리
 * ────────────────────────────────────────────────────────────────── */
async function extractLatestPostUrl(page: Page, blogId: string): Promise<string | null> {
  try {
    await page.waitForTimeout(2000);
    const url = page.url();

    // 이미 PostView 형태면 그대로
    const viewMatch = url.match(/blog\.naver\.com\/[^/]+\/(\d+)/) || url.match(/logNo=(\d+)/);
    if (viewMatch) {
      return `https://blog.naver.com/${blogId}/${viewMatch[1]}`;
    }

    // 아니면 블로그 메인
    return `https://blog.naver.com/${blogId}`;
  } catch {
    return null;
  }
}
