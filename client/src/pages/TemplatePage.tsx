// BlogAuto Pro - TemplatePage v2.0
// 완전 리디자인: 애니메이션 + 밝은 색상 + 네비게이션 버튼

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { CheckCircle2, Eye, X, Image, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const TEMPLATE_KEY = "blogauto_template";
const CONTENT_KEY = "blogauto_content";

// ── FAQ 추출 ─────────────────────────────────────────────
function extractFaq(text: string): { q: string; a: string }[] {
  const match = text.match(/\[FAQ시작\]([\s\S]*?)\[FAQ끝\]/);
  if (!match) return [];
  const faqs: { q: string; a: string }[] = [];
  const lines = match[1].split("\n").map(l => l.trim()).filter(Boolean);
  let q = "", a = "";
  for (const line of lines) {
    if (/^Q\d+:/.test(line)) { if (q && a) faqs.push({ q, a }); q = line.replace(/^Q\d+:\s*/, ""); a = ""; }
    else if (/^A\d+:/.test(line)) { a = line.replace(/^A\d+:\s*/, ""); }
  }
  if (q && a) faqs.push({ q, a });
  return faqs;
}

function extractRefs(text: string): { name: string; desc: string; url: string }[] {
  const match = text.match(/\[참고자료시작\]([\s\S]*?)\[참고자료끝\]/);
  if (!match) return [];
  const refs: { name: string; desc: string; url: string }[] = [];
  const lines = match[1].split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^LINK\d+:/.test(line)) {
      const parts = line.replace(/^LINK\d+:\s*/, "").split("|");
      if (parts.length >= 3) refs.push({ name: parts[0].trim(), desc: parts[1].trim(), url: parts[2].trim() });
    }
  }
  return refs;
}

function getBody(text: string): string {
  return text
    .replace(/\[FAQ시작\][\s\S]*?\[FAQ끝\]/g, "")
    .replace(/\[참고자료시작\][\s\S]*?\[참고자료끝\]/g, "")
    .replace(/\[관련글시작\][\s\S]*?\[관련글끝\]/g, "")
    .trim();
}

type Block = { type: "h2" | "p" | "box"; content: string; boxType?: string };

function parseBodyBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  const lines = body.split("\n");
  let pBuffer: string[] = [];
  const flushP = () => { const j = pBuffer.join(" ").trim(); if (j) blocks.push({ type: "p", content: j }); pBuffer = []; };
  for (const line of lines) {
    const t = line.trim();
    if (!t) { flushP(); continue; }
    if (t.startsWith("## ")) { flushP(); blocks.push({ type: "h2", content: t.slice(3) }); continue; }
    if (t.startsWith("[팁]")) { flushP(); blocks.push({ type: "box", content: t.slice(4).trim(), boxType: "tip" }); continue; }
    if (t.startsWith("[주의]")) { flushP(); blocks.push({ type: "box", content: t.slice(5).trim(), boxType: "warning" }); continue; }
    if (t.startsWith("[중요]")) { flushP(); blocks.push({ type: "box", content: t.slice(5).trim(), boxType: "important" }); continue; }
    pBuffer.push(t);
  }
  flushP();
  return blocks;
}

// ── 7가지 템플릿 정의 ────────────────────────────────────
export const TEMPLATES = [
  { id: "minimal",    name: "미니멀 클린",   desc: "깔끔한 흰 배경\n세련된 타이포그래피",         emoji: "⬜", grad: "linear-gradient(135deg,#f8fafc,#e2e8f0)", accent: "#1a1a1a",  tag: "심플" },
  { id: "card",       name: "카드형",        desc: "소제목마다\n그림자 카드 박스",                emoji: "🃏", grad: "linear-gradient(135deg,#dbeafe,#93c5fd)", accent: "#2563eb",  tag: "정돈" },
  { id: "magazine",   name: "잡지형",        desc: "굵은 구분선\n고급 신문 느낌",                 emoji: "📰", grad: "linear-gradient(135deg,#fef3c7,#fcd34d)", accent: "#c8102e",  tag: "고급" },
  { id: "dark",       name: "다크 프리미엄", desc: "어두운 배경\n세련된 프리미엄",                emoji: "🌙", grad: "linear-gradient(135deg,#1e1b4b,#4c1d95)", accent: "#e94560",  tag: "프리미엄" },
  { id: "warm",       name: "따뜻한 감성",   desc: "베이지/크림톤\n포근한 느낌",                  emoji: "🍞", grad: "linear-gradient(135deg,#fef3c7,#fde68a)", accent: "#d97706",  tag: "감성" },
  { id: "colorful",   name: "컬러 포인트",   desc: "소제목마다\n색상이 달라지는 스타일",           emoji: "🎨", grad: "linear-gradient(135deg,#ede9fe,#c4b5fd)", accent: "#7c3aed",  tag: "활기" },
  { id: "newsletter", name: "뉴스레터형",    desc: "이메일 뉴스레터\n정돈된 레이아웃",             emoji: "📬", grad: "linear-gradient(135deg,#d1fae5,#6ee7b7)", accent: "#059669",  tag: "뉴스" },
];

// ── HTML 빌더들 ──────────────────────────────────────────
function buildMinimal(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  const bx: Record<string, string> = { tip: "#f0faf4|#22c55e|💡 팁", warning: "#fff7ed|#f97316|⚠️ 주의", important: "#fef2f2|#ef4444|🚨 중요" };
  let h = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:720px;margin:0 auto;padding:32px 24px;background:#fff;color:#1a1a1a;line-height:1.85;">`;
  h += `<h1 style="font-size:2rem;font-weight:900;border-bottom:2px solid #1a1a1a;padding-bottom:16px;margin-bottom:28px;">${title}</h1>`;
  for (const b of blocks) {
    if (b.type === "h2") h += `<h2 style="font-size:1.3rem;font-weight:700;margin:2rem 0 1rem;">${b.content}</h2>`;
    else if (b.type === "p") h += `<p style="margin:1rem 0;font-size:1.05rem;">${b.content}</p>`;
    else if (b.type === "box") { const [bg,br,lb] = bx[b.boxType!].split("|"); h += `<div style="background:${bg};border-left:4px solid ${br};padding:14px 18px;margin:1.25rem 0;border-radius:4px;"><strong style="display:block;margin-bottom:6px;font-size:0.875rem;">${lb}</strong>${b.content}</div>`; }
  }
  if (faqs.length) { h += `<div style="margin-top:2.5rem;border-top:2px solid #1a1a1a;padding-top:1.5rem;"><h3 style="font-size:1.1rem;font-weight:800;margin-bottom:1rem;">자주 묻는 질문</h3>`; for (const f of faqs) h += `<div style="margin-bottom:1rem;"><p style="font-weight:700;margin-bottom:4px;">Q. ${f.q}</p><p style="color:#555;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="margin-top:2rem;border-top:1px solid #ddd;padding-top:1rem;"><h4 style="font-size:0.9rem;font-weight:700;color:#888;margin-bottom:0.75rem;">참고자료</h4>`; for (const r of refs) h += `<div style="margin-bottom:8px;font-size:0.9rem;"><a href="${r.url}" style="color:#2563eb;">${r.name}</a> — ${r.desc}</div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildCard(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  let h = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:740px;margin:0 auto;padding:32px 20px;background:#f0f6ff;color:#1a1a1a;line-height:1.85;">`;
  h += `<h1 style="font-size:1.9rem;font-weight:900;color:#1e3a8a;text-align:center;margin-bottom:32px;padding:24px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(37,99,235,0.12);">${title}</h1>`;
  let card = ""; let inCard = false;
  const flush = () => { if (inCard && card) { h += `<div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(37,99,235,0.1);padding:20px 24px;margin-bottom:20px;">${card}</div>`; card = ""; inCard = false; } };
  for (const b of blocks) {
    if (b.type === "h2") { flush(); inCard = true; card += `<h2 style="font-size:1.15rem;font-weight:800;color:#2563eb;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #dbeafe;">${b.content}</h2>`; }
    else if (b.type === "p") card += `<p style="margin:0.75rem 0;font-size:1.02rem;">${b.content}</p>`;
    else if (b.type === "box") { const c: Record<string,string> = { tip:"#dcfce7|#16a34a|💡", warning:"#ffedd5|#ea580c|⚠️", important:"#fee2e2|#dc2626|🚨" }; const [bg,fg,ic] = c[b.boxType!].split("|"); card += `<div style="background:${bg};border-radius:8px;padding:12px 16px;margin:0.75rem 0;"><span style="color:${fg};font-weight:700;">${ic}</span> ${b.content}</div>`; }
  }
  flush();
  if (faqs.length) { h += `<div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(37,99,235,0.1);padding:20px 24px;margin-bottom:20px;"><h3 style="font-size:1.1rem;font-weight:800;color:#2563eb;margin-bottom:16px;">❓ 자주 묻는 질문</h3>`; for (const f of faqs) h += `<div style="margin-bottom:14px;background:#f0f6ff;border-radius:8px;padding:12px 16px;"><p style="font-weight:700;margin-bottom:4px;">Q. ${f.q}</p><p style="color:#475569;font-size:0.98rem;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="background:#fff;border-radius:14px;padding:16px 24px;margin-bottom:20px;"><h4 style="font-size:0.9rem;font-weight:700;color:#94a3b8;margin-bottom:10px;">📎 참고자료</h4>`; for (const r of refs) h += `<div style="margin-bottom:6px;font-size:0.9rem;"><a href="${r.url}" style="color:#2563eb;font-weight:600;">${r.name}</a> — ${r.desc}</div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildMagazine(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  let h = `<div style="font-family:'Noto Serif KR','Georgia',serif;max-width:720px;margin:0 auto;padding:40px 24px;background:#faf8f5;color:#1a1a1a;line-height:1.9;">`;
  h += `<div style="border-top:4px solid #1a1a1a;border-bottom:1px solid #1a1a1a;padding:4px 0;margin-bottom:24px;"></div>`;
  h += `<h1 style="font-size:2.2rem;font-weight:900;line-height:1.25;margin-bottom:8px;">${title}</h1>`;
  h += `<div style="border-top:1px solid #1a1a1a;border-bottom:1px solid #c8102e;padding:4px 0;margin-bottom:28px;"></div>`;
  for (const b of blocks) {
    if (b.type === "h2") h += `<h2 style="font-size:1.25rem;font-weight:800;font-family:'Noto Sans KR',sans-serif;border-left:4px solid #c8102e;padding-left:12px;margin:2rem 0 1rem;">${b.content}</h2>`;
    else if (b.type === "p") h += `<p style="margin:1.1rem 0;font-size:1.05rem;text-align:justify;">${b.content}</p>`;
    else if (b.type === "box") { const l: Record<string,string> = { tip:"💡 팁", warning:"⚠️ 주의", important:"🚨 중요" }; h += `<blockquote style="border-left:4px solid #c8102e;background:#fff;padding:14px 20px;margin:1.5rem 0;font-style:italic;color:#555;"><strong style="font-style:normal;color:#c8102e;">${l[b.boxType!]}</strong> ${b.content}</blockquote>`; }
  }
  if (faqs.length) { h += `<div style="margin-top:2.5rem;"><div style="border-top:3px solid #1a1a1a;border-bottom:1px solid #1a1a1a;padding:4px 0;margin-bottom:16px;"></div><h3 style="font-size:1rem;font-weight:800;font-family:'Noto Sans KR',sans-serif;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:1rem;">FAQ</h3>`; for (const f of faqs) h += `<div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #e5e0d8;"><p style="font-weight:700;font-family:'Noto Sans KR',sans-serif;margin-bottom:6px;">Q. ${f.q}</p><p style="color:#666;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="margin-top:1.5rem;border-top:1px solid #ccc;padding-top:1rem;"><h4 style="font-size:0.8rem;font-weight:700;letter-spacing:0.15em;color:#888;font-family:'Noto Sans KR',sans-serif;margin-bottom:0.75rem;">REFERENCES</h4>`; for (const r of refs) h += `<div style="margin-bottom:6px;font-size:0.88rem;"><a href="${r.url}" style="color:#c8102e;">${r.name}</a> — ${r.desc}</div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildDark(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  let h = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:720px;margin:0 auto;padding:36px 24px;background:#0f0f1a;color:#e8e8f0;line-height:1.85;">`;
  h += `<h1 style="font-size:1.9rem;font-weight:900;color:#ffffff;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #e94560;">${title}</h1>`;
  for (const b of blocks) {
    if (b.type === "h2") h += `<h2 style="font-size:1.2rem;font-weight:700;color:#e94560;margin:2rem 0 1rem;padding-left:12px;border-left:3px solid #e94560;">${b.content}</h2>`;
    else if (b.type === "p") h += `<p style="margin:1rem 0;font-size:1.02rem;color:#c8c8d8;">${b.content}</p>`;
    else if (b.type === "box") { const c: Record<string,string> = { tip:"#0d2e1a|#22c55e|💡", warning:"#2e1a0d|#f97316|⚠️", important:"#2e0d0d|#ef4444|🚨" }; const [bg,br,ic] = c[b.boxType!].split("|"); h += `<div style="background:${bg};border:1px solid ${br};border-left:4px solid ${br};padding:14px 18px;margin:1.25rem 0;border-radius:6px;">${ic} ${b.content}</div>`; }
  }
  if (faqs.length) { h += `<div style="margin-top:2.5rem;border-top:1px solid #333;padding-top:1.5rem;"><h3 style="font-size:1rem;font-weight:700;color:#e94560;margin-bottom:1rem;">자주 묻는 질문</h3>`; for (const f of faqs) h += `<div style="margin-bottom:1rem;background:#1a1a2e;padding:14px 18px;border-radius:8px;"><p style="font-weight:700;color:#fff;margin-bottom:4px;">Q. ${f.q}</p><p style="color:#aaa;font-size:0.97rem;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="margin-top:1.5rem;border-top:1px solid #333;padding-top:1rem;"><h4 style="font-size:0.85rem;color:#666;margin-bottom:0.75rem;">참고자료</h4>`; for (const r of refs) h += `<div style="margin-bottom:6px;font-size:0.88rem;"><a href="${r.url}" style="color:#e94560;">${r.name}</a> <span style="color:#666;">— ${r.desc}</span></div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildWarm(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  let h = `<div style="font-family:'Noto Serif KR','Georgia',serif;max-width:720px;margin:0 auto;padding:36px 24px;background:#fdf6ec;color:#3d2b1f;line-height:1.9;">`;
  h += `<h1 style="font-size:1.9rem;font-weight:900;color:#7c3e0e;margin-bottom:24px;padding-bottom:14px;border-bottom:2px dashed #e5c18e;">${title}</h1>`;
  for (const b of blocks) {
    if (b.type === "h2") h += `<h2 style="font-size:1.2rem;font-weight:800;color:#92400e;margin:2rem 0 1rem;background:#fef3c7;padding:10px 16px;border-radius:8px;border-left:4px solid #d97706;">${b.content}</h2>`;
    else if (b.type === "p") h += `<p style="margin:1rem 0;font-size:1.04rem;">${b.content}</p>`;
    else if (b.type === "box") { const l: Record<string,string> = { tip:"🌿 팁", warning:"🍂 주의", important:"🌟 중요" }; h += `<div style="background:#fff8e8;border:1px solid #e5c18e;border-radius:12px;padding:14px 18px;margin:1.25rem 0;font-size:0.97rem;"><strong>${l[b.boxType!]}</strong> ${b.content}</div>`; }
  }
  if (faqs.length) { h += `<div style="margin-top:2.5rem;background:#fff8e8;border-radius:16px;padding:20px 24px;"><h3 style="font-size:1.05rem;font-weight:800;color:#92400e;margin-bottom:1rem;">🙋 자주 묻는 질문</h3>`; for (const f of faqs) h += `<div style="margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px dashed #e5c18e;"><p style="font-weight:700;color:#7c3e0e;margin-bottom:4px;">Q. ${f.q}</p><p style="color:#5c3b1e;font-size:0.97rem;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="margin-top:1.5rem;padding-top:1rem;border-top:1px dashed #e5c18e;"><h4 style="font-size:0.85rem;color:#a16207;margin-bottom:0.75rem;">📚 참고자료</h4>`; for (const r of refs) h += `<div style="margin-bottom:6px;font-size:0.88rem;"><a href="${r.url}" style="color:#d97706;">${r.name}</a> — ${r.desc}</div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildColorful(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  const palette = ["#7c3aed","#2563eb","#059669","#dc2626","#d97706","#0891b2"];
  let ci = 0;
  let h = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:720px;margin:0 auto;padding:32px 20px;background:#f8f9ff;color:#1a1a1a;line-height:1.85;">`;
  h += `<h1 style="font-size:1.9rem;font-weight:900;text-align:center;margin-bottom:32px;background:linear-gradient(135deg,#7c3aed,#2563eb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${title}</h1>`;
  for (const b of blocks) {
    if (b.type === "h2") { const c = palette[ci++ % palette.length]; h += `<h2 style="font-size:1.2rem;font-weight:800;color:${c};margin:2rem 0 1rem;display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};flex-shrink:0;"></span>${b.content}</h2>`; }
    else if (b.type === "p") h += `<p style="margin:1rem 0;font-size:1.02rem;">${b.content}</p>`;
    else if (b.type === "box") { const c: Record<string,string> = { tip:"#f0fdf4|#16a34a|💡", warning:"#fff7ed|#ea580c|⚠️", important:"#fef2f2|#dc2626|🚨" }; const [bg,fg,ic] = c[b.boxType!].split("|"); h += `<div style="background:${bg};border-radius:10px;padding:14px 18px;margin:1.25rem 0;border-left:4px solid ${fg};"><span style="color:${fg};font-weight:700;">${ic}</span> ${b.content}</div>`; }
  }
  if (faqs.length) { h += `<div style="margin-top:2.5rem;"><h3 style="font-size:1.1rem;font-weight:800;background:linear-gradient(135deg,#7c3aed,#2563eb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:1rem;">자주 묻는 질문</h3>`; faqs.forEach((f, i) => { const c = palette[i % palette.length]; h += `<div style="margin-bottom:1rem;background:#fff;border-radius:10px;padding:14px 18px;border-left:4px solid ${c};box-shadow:0 2px 8px rgba(0,0,0,0.06);"><p style="font-weight:700;color:${c};margin-bottom:4px;">Q. ${f.q}</p><p style="color:#555;font-size:0.97rem;">A. ${f.a}</p></div>`; }); h += `</div>`; }
  if (refs.length) { h += `<div style="margin-top:1.5rem;padding-top:1rem;border-top:2px dashed #e5e7eb;"><h4 style="font-size:0.85rem;font-weight:700;color:#888;margin-bottom:0.75rem;">참고자료</h4>`; for (const r of refs) h += `<div style="margin-bottom:6px;font-size:0.88rem;"><a href="${r.url}" style="color:#7c3aed;">${r.name}</a> — ${r.desc}</div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildNewsletter(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  let h = `<div style="font-family:'Noto Sans KR',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;">`;
  h += `<div style="background:#059669;padding:24px 32px;"><h1 style="font-size:1.6rem;font-weight:900;color:#ffffff;margin:0;line-height:1.3;">${title}</h1></div>`;
  h += `<div style="padding:28px 32px;background:#f5f7fa;">`;
  let sec = false;
  for (const b of blocks) {
    if (b.type === "h2") { if (sec) h += `</div>`; h += `<div style="background:#fff;border-radius:8px;padding:20px 24px;margin-bottom:16px;border-top:3px solid #059669;"><h2 style="font-size:1.05rem;font-weight:800;color:#059669;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">${b.content}</h2>`; sec = true; }
    else if (b.type === "p") { if (!sec) { h += `<div style="background:#fff;border-radius:8px;padding:20px 24px;margin-bottom:16px;">`; sec = true; } h += `<p style="margin:0.75rem 0;font-size:0.97rem;color:#374151;line-height:1.75;">${b.content}</p>`; }
    else if (b.type === "box") { const c: Record<string,string> = { tip:"#ecfdf5|#059669|✅ 팁", warning:"#fff7ed|#d97706|⚠️ 주의", important:"#fef2f2|#dc2626|🔴 중요" }; const [bg,fg,lb] = c[b.boxType!].split("|"); h += `<div style="background:${bg};border-left:3px solid ${fg};padding:10px 14px;margin:10px 0;font-size:0.93rem;border-radius:4px;"><strong style="color:${fg};">${lb}</strong> ${b.content}</div>`; }
  }
  if (sec) h += `</div>`;
  if (faqs.length) { h += `<div style="background:#fff;border-radius:8px;padding:20px 24px;margin-bottom:16px;border-top:3px solid #059669;"><h3 style="font-size:1rem;font-weight:800;color:#059669;margin:0 0 14px;">FAQ</h3>`; for (const f of faqs) h += `<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;"><p style="font-weight:700;font-size:0.93rem;color:#111;margin-bottom:4px;">Q. ${f.q}</p><p style="color:#6b7280;font-size:0.91rem;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="background:#fff;border-radius:8px;padding:16px 24px;margin-bottom:16px;"><h4 style="font-size:0.8rem;font-weight:700;color:#9ca3af;margin-bottom:8px;">참고자료</h4>`; for (const r of refs) h += `<div style="margin-bottom:5px;font-size:0.85rem;"><a href="${r.url}" style="color:#059669;">${r.name}</a> — ${r.desc}</div>`; h += `</div>`; }
  h += `</div><div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;font-size:0.78rem;color:#9ca3af;">BlogAuto Pro로 작성된 콘텐츠</div>`;
  return h + `</div>`;
}

export function buildTemplateHtml(templateId: string, title: string, rawContent: string): string {
  const body = getBody(rawContent);
  const faqs = extractFaq(rawContent);
  const refs = extractRefs(rawContent);
  const blocks = parseBodyBlocks(body);
  switch (templateId) {
    case "minimal":    return buildMinimal(title, blocks, faqs, refs);
    case "card":       return buildCard(title, blocks, faqs, refs);
    case "magazine":   return buildMagazine(title, blocks, faqs, refs);
    case "dark":       return buildDark(title, blocks, faqs, refs);
    case "warm":       return buildWarm(title, blocks, faqs, refs);
    case "colorful":   return buildColorful(title, blocks, faqs, refs);
    case "newsletter": return buildNewsletter(title, blocks, faqs, refs);
    default:           return buildMinimal(title, blocks, faqs, refs);
  }
}

const SAMPLE = `## 첫 번째 소제목\n이 템플릿은 깔끔하고 읽기 좋은 레이아웃을 제공합니다.\n\n[팁] 이렇게 팁 박스가 표시됩니다.\n\n## 두 번째 소제목\n각 소제목마다 스타일이 적용되어 가독성이 높아집니다.\n\n[중요] 이 내용은 반드시 알아야 할 중요한 정보입니다.\n\n## 세 번째 소제목\n본문 내용이 자연스럽게 이어집니다.\n\n[FAQ시작]\nQ1: 이 템플릿은 어떻게 적용되나요?\nA1: 콘텐츠 생성 후 자동으로 선택한 스타일로 변환됩니다.\nQ2: 나중에 변경할 수 있나요?\nA2: 네, 언제든지 이 페이지에서 다시 선택하면 됩니다.\n[FAQ끝]\n\n[참고자료시작]\nLINK1: 구글|검색 엔진|https://www.google.com\nLINK2: 네이버|국내 포털|https://www.naver.com\n[참고자료끝]`;

// ── 인라인 스타일 ────────────────────────────────────────
const css = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
    100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
  }
  .tpl-card {
    animation: fadeUp 0.4s ease both;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .tpl-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.15) !important;
  }
  .tpl-card.selected {
    animation: pulse-ring 1.5s ease-out;
  }
  .tpl-btn {
    transition: transform 0.15s ease, filter 0.15s ease;
  }
  .tpl-btn:hover { transform: scale(1.04); filter: brightness(1.08); }
  .tpl-btn:active { transform: scale(0.97); }
  .nav-btn {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .nav-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important; }
  .nav-btn:active { transform: translateY(0); }
  .shimmer-text {
    background: linear-gradient(90deg, #7c3aed, #2563eb, #059669, #7c3aed);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }
`;

export default function TemplatePage() {
  const [selected, setSelected] = useState<string>("minimal");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [savedContent, setSavedContent] = useState<string>("");
  const [savedTitle, setSavedTitle] = useState<string>("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem(TEMPLATE_KEY);
    if (saved) setSelected(saved);
    const content = localStorage.getItem(CONTENT_KEY) || "";
    setSavedContent(content);
    const m = content.match(/^(.+)/);
    setSavedTitle(m ? m[1].replace(/^##\s*/, "").slice(0, 60) : "블로그 포스트 제목 예시");
  }, []);

  const handleSelect = (id: string) => {
    setSelected(id);
    localStorage.setItem(TEMPLATE_KEY, id);
    toast.success(`✨ "${TEMPLATES.find(t => t.id === id)?.name}" 템플릿 선택됨`);
  };

  const handlePreview = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = savedContent || SAMPLE;
    const title = savedTitle || "블로그 포스트 제목 예시";
    setPreviewHtml(buildTemplateHtml(id, title, content));
    setPreviewId(id);
  };

  const handleSubscriberPreview = () => {
    const content = savedContent || SAMPLE;
    const title = savedTitle || "블로그 포스트 제목 예시";
    setPreviewHtml(buildTemplateHtml(selected, title, content));
    setPreviewId(selected);
  };

  const selectedTpl = TEMPLATES.find(t => t.id === selected);

  return (
    <Layout>
      <style>{css}</style>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── 헤더 ── */}
        <div style={{ marginBottom: 36, animation: "fadeUp 0.4s ease both" }}>
          <h1 className="shimmer-text" style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: 8 }}>
            🎨 템플릿 선택
          </h1>
          <p style={{ color: "var(--fg3, #888)", fontSize: "0.95rem" }}>
            발행할 콘텐츠의 HTML 스타일을 선택하세요. 배포 시 자동 적용됩니다.
          </p>
        </div>

        {/* ── 현재 선택 배지 ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          background: "linear-gradient(135deg, var(--bg2,#f5f5f0), var(--bg2,#f5f5f0))",
          border: "1px solid var(--border,#d4d4d0)", borderRadius: 14,
          padding: "14px 20px", marginBottom: 32,
          animation: "fadeUp 0.4s ease 0.1s both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={18} color="#22c55e" />
            <span style={{ fontSize: "0.95rem" }}>
              선택된 템플릿: <strong style={{ color: "var(--brand,#c8102e)" }}>{selectedTpl?.name}</strong>
            </span>
            <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: 20, background: selectedTpl?.grad, color: selectedTpl?.accent, fontWeight: 700 }}>
              {selectedTpl?.tag}
            </span>
          </div>
          {/* 구독자 미리보기 버튼 */}
          <button
            className="tpl-btn"
            onClick={handleSubscriberPreview}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#7c3aed,#2563eb)",
              color: "#fff", fontWeight: 700, fontSize: "0.88rem",
              boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
            }}>
            <Eye size={15} /> 구독자 미리보기
          </button>
        </div>

        {/* ── 템플릿 그리드 ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 18, marginBottom: 36 }}>
          {TEMPLATES.map((t, i) => (
            <div
              key={t.id}
              className={`tpl-card${selected === t.id ? " selected" : ""}`}
              onClick={() => handleSelect(t.id)}
              style={{
                animationDelay: `${i * 0.07}s`,
                border: `2px solid ${selected === t.id ? "var(--brand,#c8102e)" : "var(--border,#d4d4d0)"}`,
                borderRadius: 16, padding: "20px 20px 16px", cursor: "pointer",
                background: "var(--card,#fff)", position: "relative", overflow: "hidden",
              }}
            >
              {/* 선택 표시 */}
              {selected === t.id && (
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <CheckCircle2 size={18} color="var(--brand,#c8102e)" />
                </div>
              )}

              {/* 그라데이션 배경 바 */}
              <div style={{ height: 56, borderRadius: 10, background: t.grad, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
                {t.emoji}
              </div>

              {/* 태그 */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontWeight: 800, fontSize: "1rem" }}>{t.name}</span>
                <span style={{ fontSize: "0.7rem", padding: "2px 7px", borderRadius: 20, background: t.grad, color: t.accent, fontWeight: 700 }}>{t.tag}</span>
              </div>

              {/* 설명 */}
              <p style={{ fontSize: "0.83rem", color: "var(--fg3,#888)", marginBottom: 14, lineHeight: 1.5, whiteSpace: "pre-line" }}>{t.desc}</p>

              {/* 액센트 컬러 바 */}
              <div style={{ height: 4, borderRadius: 4, background: t.grad, marginBottom: 12 }} />

              {/* 미리보기 버튼 */}
              <button
                className="tpl-btn"
                onClick={(e) => handlePreview(t.id, e)}
                style={{
                  width: "100%", padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: t.grad, color: t.accent,
                  fontWeight: 700, fontSize: "0.82rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                <Eye size={13} /> 미리보기
              </button>
            </div>
          ))}
        </div>

        {/* ── 하단 네비게이션 버튼 ── */}
        <div style={{
          display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
          animation: "fadeUp 0.4s ease 0.5s both",
        }}>
          <button
            className="nav-btn"
            onClick={() => navigate("/images")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#059669,#0d9488)",
              color: "#fff", fontWeight: 700, fontSize: "0.95rem",
              boxShadow: "0 4px 16px rgba(5,150,105,0.35)",
            }}>
            <Image size={17} /> 이미지 생성으로 →
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate("/deploy")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#c8102e,#e11d48)",
              color: "#fff", fontWeight: 700, fontSize: "0.95rem",
              boxShadow: "0 4px 16px rgba(200,16,46,0.35)",
            }}>
            <Sparkles size={17} /> 배포 관리로 →
          </button>
        </div>

        {/* ── 안내 ── */}
        <div style={{ marginTop: 24, padding: "12px 16px", background: "var(--bg2,#f5f5f0)", borderRadius: 10, fontSize: "0.85rem", color: "var(--fg3,#888)", lineHeight: 1.6, animation: "fadeUp 0.4s ease 0.6s both" }}>
          💡 선택한 템플릿은 <strong>배포 관리</strong>에서 발행 시 자동 적용됩니다. 미리보기는 저장된 콘텐츠를 기반으로 표시됩니다.
        </div>
      </div>

      {/* ── 미리보기 모달 ── */}
      {previewId && (
        <div
          onClick={() => setPreviewId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", overflowY: "auto" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, maxWidth: 800, width: "100%", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.45)", animation: "fadeUp 0.25s ease" }}
          >
            {/* 모달 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#1a1a1a", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.1rem" }}>{TEMPLATES.find(t => t.id === previewId)?.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{TEMPLATES.find(t => t.id === previewId)?.name} 미리보기</span>
              </div>
              <button onClick={() => setPreviewId(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* 모달 본문 */}
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>

            {/* 모달 푸터 */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10 }}>
              <button
                className="tpl-btn"
                onClick={() => { handleSelect(previewId); setPreviewId(null); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                  color: "#fff", fontWeight: 700, fontSize: "0.92rem",
                }}>
                ✅ 이 템플릿 선택
              </button>
              <button
                className="tpl-btn"
                onClick={() => setPreviewId(null)}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "1px solid #e5e7eb", cursor: "pointer",
                  background: "#fff", color: "#555", fontWeight: 600, fontSize: "0.92rem",
                }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
