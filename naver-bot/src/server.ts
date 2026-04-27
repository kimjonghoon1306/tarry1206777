import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { publishToNaver } from "./publisher";
import { publishToTistory } from "./tistory";
import { saveSession, getSession, deleteSession } from "./session-manager";
import { generateFlowImage } from "./flow-image";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));

// ── 헬스체크 ─────────────────────────────────────────────
app.get("/health", (_, res) => {
  res.json({ status: "ok", service: "naver-bot", ts: new Date().toISOString() });
});

// ── 네이버 세션 저장 ──────────────────────────────────────
app.post("/api/naver/save-session", async (req, res) => {
  try {
    const { userId, id, pw } = req.body;
    if (!userId || !id || !pw) return res.status(400).json({ error: "필수 정보 누락" });
    const result = await saveSession(userId, "naver", id, pw);
    return res.json({ success: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── 티스토리 세션 저장 ────────────────────────────────────
app.post("/api/tistory/save-session", async (req, res) => {
  try {
    const { userId, id, pw, blogName } = req.body;
    if (!userId || !id || !pw) return res.status(400).json({ error: "필수 정보 누락" });
    const result = await saveSession(userId, "tistory", id, pw, blogName);
    return res.json({ success: true, ...result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── 세션 삭제 ────────────────────────────────────────────
app.delete("/api/session/:userId", async (req, res) => {
  await deleteSession(req.params.userId);
  return res.json({ success: true });
});

// ── Flow 이미지 생성 ──────────────────────────────────────
app.post("/api/flow/generate", async (req, res) => {
  try {
    const { prompt, count = 1 } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt 필수" });
    const email = process.env.GOOGLE_FLOW_EMAIL!;
    const pw    = process.env.GOOGLE_FLOW_PASSWORD!;
    if (!email || !pw) return res.status(500).json({ error: "Google Flow 계정 미설정" });
    const images = await generateFlowImage({ googleEmail: email, googlePw: pw, prompt, count });
    return res.json({ success: true, images });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ── 통합 발행 (이미지 생성 + 발행) ───────────────────────
app.post("/api/publish-full", async (req, res) => {
  try {
    const { userId, platform = "naver", title, content, tags = [], imagePrompt } = req.body;
    if (!userId || !title || !content) return res.status(400).json({ error: "필수 항목 누락" });

    const session = await getSession(userId);
    if (!session) return res.status(401).json({ error: "세션 없음. 계정 연결 먼저 필요" });

    let imageUrls: string[] = [];
    if (imagePrompt) {
      console.log("[bot] Flow 이미지 생성:", imagePrompt);
      try {
        const email = process.env.GOOGLE_FLOW_EMAIL!;
        const pw    = process.env.GOOGLE_FLOW_PASSWORD!;
        if (email && pw) {
          imageUrls = await generateFlowImage({ googleEmail: email, googlePw: pw, prompt: imagePrompt, count: 1 });
        }
      } catch (e: any) {
        console.warn("[bot] 이미지 생성 실패 (발행 계속):", e.message);
      }
    }

    let result: any;
    if (platform === "tistory") {
      result = await publishToTistory({ session, title, content, imageUrls, tags });
    } else {
      result = await publishToNaver({ session, title, content, imageUrls, tags });
    }

    return res.json({ success: true, ...result });
  } catch (e: any) {
    console.error("[bot] 발행 실패:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  BlogAuto Pro — Naver Bot             ║
  ║  http://localhost:${PORT}               ║
  ╚═══════════════════════════════════════╝
  `);
});

