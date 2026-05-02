import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  saveSession,
  getSession,
  deleteSession,
} from "./session-manager";
import { publishToNaver } from "./publisher";
import { publishToTistory } from "./tistory";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const PORT = parseInt(process.env.PORT || "3333", 10);

/* ──────────────────────────────────────────────────────────────────
 * 발행 큐 - 동시 실행 제한
 * 수천명이 동시에 누르면 크롬 수천개 뜨면서 서버 죽음
 * 동시 N개로 제한하고 나머지는 대기
 * ────────────────────────────────────────────────────────────────── */
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || "3", 10);
let running = 0;
const waitQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running++;
    return;
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      running++;
      resolve();
    });
  });
}

function releaseSlot() {
  running--;
  const next = waitQueue.shift();
  if (next) next();
}

/* ──────────────────────────────────────────────────────────────────
 * Health check
 * ────────────────────────────────────────────────────────────────── */
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "2.0.0",
    running,
    queued: waitQueue.length,
    maxConcurrent: MAX_CONCURRENT,
  });
});

/* ──────────────────────────────────────────────────────────────────
 * 계정 연결 (첫 로그인 - 사용자에게 브라우저 보임)
 * POST /sessions/connect
 * body: { userId, platform, username, password, blogName? }
 * ────────────────────────────────────────────────────────────────── */
app.post("/sessions/connect", async (req: Request, res: Response) => {
  const { userId, platform, username, password, blogName } = req.body;

  if (!userId || !platform || !username || !password) {
    return res.status(400).json({ error: "userId, platform, username, password 필수" });
  }
  if (platform !== "naver" && platform !== "tistory") {
    return res.status(400).json({ error: "platform은 naver 또는 tistory" });
  }

  try {
    const result = await saveSession(userId, platform, username, password, blogName);
    return res.json({ success: true, ...result });
  } catch (e: any) {
    console.error("[connect] 실패:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

/* ──────────────────────────────────────────────────────────────────
 * 세션 조회
 * GET /sessions/:userId
 * ────────────────────────────────────────────────────────────────── */
app.get("/sessions/:userId", async (req: Request, res: Response) => {
  const session = await getSession(req.params.userId);
  if (!session) return res.status(404).json({ error: "세션 없음" });
  // 쿠키는 응답에서 제외
  return res.json({
    userId: session.userId,
    platform: session.platform,
    username: session.username,
    blogName: session.blogName,
    savedAt: session.savedAt,
    cookieCount: session.cookies.length,
  });
});

/* ──────────────────────────────────────────────────────────────────
 * 세션 삭제
 * DELETE /sessions/:userId
 * ────────────────────────────────────────────────────────────────── */
app.delete("/sessions/:userId", async (req: Request, res: Response) => {
  await deleteSession(req.params.userId);
  return res.json({ success: true });
});

/* ──────────────────────────────────────────────────────────────────
 * 발행 (큐에 들어감)
 * POST /publish
 * body: { userId, title, content, imageUrls?, tags? }
 * ────────────────────────────────────────────────────────────────── */
app.post("/publish", async (req: Request, res: Response) => {
  const { userId, title, content, imageUrls = [], tags = [] } = req.body;

  if (!userId || !title || !content) {
    return res.status(400).json({ error: "userId, title, content 필수" });
  }

  const session = await getSession(userId);
  if (!session) {
    return res.status(404).json({ error: "세션 없음. 먼저 계정 연결 필요" });
  }

  // 큐 슬롯 획득까지 대기
  console.log(`[publish] 요청 수신 userId=${userId} (running=${running}, queued=${waitQueue.length})`);
  await acquireSlot();

  try {
    let result;
    if (session.platform === "naver") {
      result = await publishToNaver({ session, title, content, imageUrls, tags });
    } else {
      result = await publishToTistory({ session, title, content, imageUrls, tags });
    }
    return res.json({ success: true, ...result });
  } catch (e: any) {
    console.error(`[publish] 실패 userId=${userId}:`, e.message);

    // 세션 만료면 클라이언트가 재연결 트리거하도록 코드 반환
    if (e.message?.includes("세션 만료") || e.message?.includes("재연결")) {
      return res.status(401).json({ error: e.message, code: "SESSION_EXPIRED" });
    }
    return res.status(500).json({ error: e.message });
  } finally {
    releaseSlot();
  }
});

/* ──────────────────────────────────────────────────────────────────
 * 서버 시작
 * ────────────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  Publy 자동발행 봇 v2.0                        ║
║  포트: ${String(PORT).padEnd(40)}║
║  동시발행 최대: ${String(MAX_CONCURRENT).padEnd(31)}║
╚════════════════════════════════════════════════╝
  `);
  console.log("API:");
  console.log(`  GET    http://localhost:${PORT}/health`);
  console.log(`  POST   http://localhost:${PORT}/sessions/connect`);
  console.log(`  GET    http://localhost:${PORT}/sessions/:userId`);
  console.log(`  DELETE http://localhost:${PORT}/sessions/:userId`);
  console.log(`  POST   http://localhost:${PORT}/publish`);
});
