// BlogAuto Pro - TemplatePage v2.0
// 완전 리디자인: 애니메이션 + 밝은 색상 + 네비게이션 버튼

import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { CheckCircle2, Eye, X, Image, Sparkles } from "lucide-react";
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

// 공통 목차 생성 함수
function buildToc(blocks: Block[], accentColor: string, bgColor: string, borderColor: string, textColor: string): string {
  const headings = blocks.filter(b => b.type === "h2");
  if (headings.length < 2) return "";
  let toc = `<div style="background:${bgColor};border:1px solid ${borderColor};border-left:4px solid ${accentColor};border-radius:10px;padding:18px 22px;margin:24px 0 32px;">`;
  toc += `<p style="font-size:0.8rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${accentColor};margin-bottom:12px;">📋 목차</p>`;
  toc += `<ol style="margin:0;padding-left:20px;">`;
  headings.forEach((b, i) => {
    const id = `section-${i}`;
    toc += `<li style="margin:6px 0;"><a href="#${id}" style="color:${textColor};text-decoration:none;font-size:0.95rem;font-weight:500;">${b.content}</a></li>`;
  });
  toc += `</ol></div>`;
  return toc;
}

function buildMinimal(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  const bx: Record<string, string> = { tip: "#f0faf4|#22c55e|💡 팁", warning: "#fff7ed|#f97316|⚠️ 주의", important: "#fef2f2|#ef4444|🚨 중요" };
  let h = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:720px;margin:0 auto;padding:32px 24px;background:#fff;color:#1a1a1a;line-height:1.85;">`;
  h += `<h1 style="font-size:2rem;font-weight:900;border-bottom:2px solid #1a1a1a;padding-bottom:16px;margin-bottom:20px;">${title}</h1>`;
  h += buildToc(blocks, "#1a1a1a", "#f5f5f5", "#d4d4d0", "#333333");
  let secIdx = 0;
  for (const b of blocks) {
    if (b.type === "h2") { h += `<h2 id="section-${secIdx++}" style="font-size:1.3rem;font-weight:700;margin:2rem 0 1rem;">${b.content}</h2>`; }
    else if (b.type === "p") h += `<p style="margin:1rem 0;font-size:1.05rem;">${b.content}</p>`;
    else if (b.type === "box") { const [bg,br,lb] = bx[b.boxType!].split("|"); h += `<div style="background:${bg};border-left:4px solid ${br};padding:14px 18px;margin:1.25rem 0;border-radius:4px;"><strong style="display:block;margin-bottom:6px;font-size:0.875rem;">${lb}</strong>${b.content}</div>`; }
  }
  if (faqs.length) { h += `<div style="margin-top:2.5rem;border-top:2px solid #1a1a1a;padding-top:1.5rem;"><h3 style="font-size:1.1rem;font-weight:800;margin-bottom:1rem;">자주 묻는 질문</h3>`; for (const f of faqs) h += `<div style="margin-bottom:1rem;"><p style="font-weight:700;margin-bottom:4px;">Q. ${f.q}</p><p style="color:#555;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="margin-top:2rem;border-top:1px solid #ddd;padding-top:1rem;"><h4 style="font-size:0.9rem;font-weight:700;color:#888;margin-bottom:0.75rem;">참고자료</h4>`; for (const r of refs) h += `<div style="margin-bottom:8px;font-size:0.9rem;"><a href="${r.url}" style="color:#2563eb;">${r.name}</a> — ${r.desc}</div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildCard(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  let h = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:740px;margin:0 auto;padding:32px 20px;background:#f0f6ff;color:#1a1a1a;line-height:1.85;">`;
  h += `<h1 style="font-size:1.9rem;font-weight:900;color:#1e3a8a;text-align:center;margin-bottom:20px;padding:24px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(37,99,235,0.12);">${title}</h1>`;
  h += buildToc(blocks, "#2563eb", "#eff6ff", "#bfdbfe", "#1e3a8a");
  let card = ""; let inCard = false; let secIdx = 0;
  const flush = () => { if (inCard && card) { h += `<div style="background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(37,99,235,0.1);padding:20px 24px;margin-bottom:20px;">${card}</div>`; card = ""; inCard = false; } };
  for (const b of blocks) {
    if (b.type === "h2") { flush(); inCard = true; card += `<h2 id="section-${secIdx++}" style="font-size:1.15rem;font-weight:800;color:#2563eb;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #dbeafe;">${b.content}</h2>`; }
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
  h += `<div style="border-top:1px solid #1a1a1a;border-bottom:1px solid #c8102e;padding:4px 0;margin-bottom:20px;"></div>`;
  h += buildToc(blocks, "#c8102e", "#fff8f8", "#fecaca", "#1a1a1a");
  let secIdx = 0;
  for (const b of blocks) {
    if (b.type === "h2") h += `<h2 id="section-${secIdx++}" style="font-size:1.25rem;font-weight:800;font-family:'Noto Sans KR',sans-serif;border-left:4px solid #c8102e;padding-left:12px;margin:2rem 0 1rem;">${b.content}</h2>`;
    else if (b.type === "p") h += `<p style="margin:1.1rem 0;font-size:1.05rem;text-align:justify;">${b.content}</p>`;
    else if (b.type === "box") { const l: Record<string,string> = { tip:"💡 팁", warning:"⚠️ 주의", important:"🚨 중요" }; h += `<blockquote style="border-left:4px solid #c8102e;background:#fff;padding:14px 20px;margin:1.5rem 0;font-style:italic;color:#555;"><strong style="font-style:normal;color:#c8102e;">${l[b.boxType!]}</strong> ${b.content}</blockquote>`; }
  }
  if (faqs.length) { h += `<div style="margin-top:2.5rem;"><div style="border-top:3px solid #1a1a1a;border-bottom:1px solid #1a1a1a;padding:4px 0;margin-bottom:16px;"></div><h3 style="font-size:1rem;font-weight:800;font-family:'Noto Sans KR',sans-serif;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:1rem;">FAQ</h3>`; for (const f of faqs) h += `<div style="margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #e5e0d8;"><p style="font-weight:700;font-family:'Noto Sans KR',sans-serif;margin-bottom:6px;">Q. ${f.q}</p><p style="color:#666;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="margin-top:1.5rem;border-top:1px solid #ccc;padding-top:1rem;"><h4 style="font-size:0.8rem;font-weight:700;letter-spacing:0.15em;color:#888;font-family:'Noto Sans KR',sans-serif;margin-bottom:0.75rem;">REFERENCES</h4>`; for (const r of refs) h += `<div style="margin-bottom:6px;font-size:0.88rem;"><a href="${r.url}" style="color:#c8102e;">${r.name}</a> — ${r.desc}</div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildDark(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  let h = `<div style="font-family:'Noto Sans KR',sans-serif;max-width:720px;margin:0 auto;padding:36px 24px;background:#0f0f1a;color:#e8e8f0;line-height:1.85;">`;
  h += `<h1 style="font-size:1.9rem;font-weight:900;color:#ffffff;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #e94560;">${title}</h1>`;
  h += buildToc(blocks, "#e94560", "#1a1a2e", "#333366", "#c8c8d8");
  let secIdx = 0;
  for (const b of blocks) {
    if (b.type === "h2") h += `<h2 id="section-${secIdx++}" style="font-size:1.2rem;font-weight:700;color:#e94560;margin:2rem 0 1rem;padding-left:12px;border-left:3px solid #e94560;">${b.content}</h2>`;
    else if (b.type === "p") h += `<p style="margin:1rem 0;font-size:1.02rem;color:#c8c8d8;">${b.content}</p>`;
    else if (b.type === "box") { const c: Record<string,string> = { tip:"#0d2e1a|#22c55e|💡", warning:"#2e1a0d|#f97316|⚠️", important:"#2e0d0d|#ef4444|🚨" }; const [bg,br,ic] = c[b.boxType!].split("|"); h += `<div style="background:${bg};border:1px solid ${br};border-left:4px solid ${br};padding:14px 18px;margin:1.25rem 0;border-radius:6px;">${ic} ${b.content}</div>`; }
  }
  if (faqs.length) { h += `<div style="margin-top:2.5rem;border-top:1px solid #333;padding-top:1.5rem;"><h3 style="font-size:1rem;font-weight:700;color:#e94560;margin-bottom:1rem;">자주 묻는 질문</h3>`; for (const f of faqs) h += `<div style="margin-bottom:1rem;background:#1a1a2e;padding:14px 18px;border-radius:8px;"><p style="font-weight:700;color:#fff;margin-bottom:4px;">Q. ${f.q}</p><p style="color:#aaa;font-size:0.97rem;">A. ${f.a}</p></div>`; h += `</div>`; }
  if (refs.length) { h += `<div style="margin-top:1.5rem;border-top:1px solid #333;padding-top:1rem;"><h4 style="font-size:0.85rem;color:#666;margin-bottom:0.75rem;">참고자료</h4>`; for (const r of refs) h += `<div style="margin-bottom:6px;font-size:0.88rem;"><a href="${r.url}" style="color:#e94560;">${r.name}</a> <span style="color:#666;">— ${r.desc}</span></div>`; h += `</div>`; }
  return h + `</div>`;
}

function buildWarm(title: string, blocks: Block[], faqs: ReturnType<typeof extractFaq>, refs: ReturnType<typeof extractRefs>): string {
  let h = `<div style="font-family:'Noto Serif KR','Georgia',serif;max-width:720px;margin:0 auto;padding:36px 24px;background:#fdf6ec;color:#3d2b1f;line-height:1.9;">`;
  h += `<h1 style="font-size:1.9rem;font-weight:900;color:#7c3e0e;margin-bottom:20px;padding-bottom:14px;border-bottom:2px dashed #e5c18e;">${title}</h1>`;
  h += buildToc(blocks, "#d97706", "#fffbeb", "#fde68a", "#7c3e0e");
  let secIdx = 0;
  for (const b of blocks) {
    if (b.type === "h2") h += `<h2 id="section-${secIdx++}" style="font-size:1.2rem;font-weight:800;color:#92400e;margin:2rem 0 1rem;background:#fef3c7;padding:10px 16px;border-radius:8px;border-left:4px solid #d97706;">${b.content}</h2>`;
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
  h += `<h1 style="font-size:1.9rem;font-weight:900;text-align:center;margin-bottom:20px;background:linear-gradient(135deg,#7c3aed,#2563eb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${title}</h1>`;
  h += buildToc(blocks, "#7c3aed", "#f5f3ff", "#ddd6fe", "#3730a3");
  let secIdx = 0;
  for (const b of blocks) {
    if (b.type === "h2") { const c = palette[ci++ % palette.length]; h += `<h2 id="section-${secIdx++}" style="font-size:1.2rem;font-weight:800;color:${c};margin:2rem 0 1rem;display:flex;align-items:center;gap:8px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};flex-shrink:0;"></span>${b.content}</h2>`; }
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
  h += buildToc(blocks, "#059669", "#fff", "#d1fae5", "#065f46");
  let sec = false; let secIdx = 0;
  for (const b of blocks) {
    if (b.type === "h2") { if (sec) h += `</div>`; h += `<div style="background:#fff;border-radius:8px;padding:20px 24px;margin-bottom:16px;border-top:3px solid #059669;"><h2 id="section-${secIdx++}" style="font-size:1.05rem;font-weight:800;color:#059669;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">${b.content}</h2>`; sec = true; }
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

const SAMPLE = `## 다이어트 보조제 추천\n이 글은 실제 콘텐츠가 없을 때 표시되는 샘플입니다. 콘텐츠를 먼저 생성해주세요.\n\n[팁] 콘텐츠 생성 페이지에서 글을 먼저 작성하면 실제 내용으로 미리보기가 가능합니다.\n\n## 효과와 성분 분석\n각 소제목마다 선택한 템플릿 스타일이 이렇게 적용됩니다.\n\n[중요] 이것은 샘플 데이터입니다. 실제 발행 시에는 생성된 콘텐츠가 이 형식으로 전송됩니다.\n\n## 가격 비교 및 추천\n세 번째 섹션입니다. 목차가 자동으로 상단에 생성됩니다.\n\n[FAQ시작]\nQ1: 이 템플릿을 선택하면 어떻게 되나요?\nA1: 배포 시 콘텐츠가 이 스타일의 HTML로 변환되어 전송됩니다.\nQ2: 나중에 템플릿을 바꿀 수 있나요?\nA2: 네, 언제든지 이 페이지에서 다시 선택하면 됩니다.\n[FAQ끝]\n\n[참고자료시작]\nLINK1: 식품의약품안전처|안전한 다이어트 정보|https://www.mfds.go.kr\nLINK2: 국민건강보험|건강 관련 정보|https://www.nhis.or.kr\n[참고자료끝]`;

// ── 애니메이션 CSS ────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position:  300% center; }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
    50%       { box-shadow: 0 0 0 6px rgba(124,58,237,0.15); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .tpl-page-bg {
    background: radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.06) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 100%, rgba(37,99,235,0.06) 0%, transparent 60%);
    min-height: 100vh;
  }

  .tpl-shimmer {
    background: linear-gradient(90deg, #7c3aed 0%, #2563eb 30%, #059669 60%, #c8102e 80%, #7c3aed 100%);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }

  .tpl-card {
    animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
    transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
    cursor: pointer;
  }
  .tpl-card:hover {
    transform: translateY(-6px) scale(1.01);
  }
  .tpl-card.is-selected {
    animation: glow-pulse 2s ease infinite;
  }

  .tpl-preview-btn {
    transition: all 0.15s ease;
    position: relative;
    overflow: hidden;
  }
  .tpl-preview-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background 0.15s ease;
  }
  .tpl-preview-btn:hover::after { background: rgba(255,255,255,0.15); }
  .tpl-preview-btn:active { transform: scale(0.97); }

  .tpl-nav-btn {
    transition: all 0.18s cubic-bezier(0.16,1,0.3,1);
    position: relative;
    overflow: hidden;
  }
  .tpl-nav-btn:hover { transform: translateY(-3px); filter: brightness(1.08); }
  .tpl-nav-btn:active { transform: translateY(0) scale(0.98); }

  .tpl-modal-enter {
    animation: fadeUp 0.2s cubic-bezier(0.16,1,0.3,1);
  }

  .tpl-select-btn {
    transition: all 0.15s ease;
  }
  .tpl-select-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
  .tpl-select-btn:active { transform: scale(0.98); }
`;

// ── 미리보기용 전체 HTML 문서 생성 (iframe용) ─────────────
function wrapForIframe(innerHtml: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #f9fafb; padding: 0; }
  img { max-width: 100%; height: auto; }
  a { color: inherit; }
</style>
</head>
<body>${innerHtml}</body>
</html>`;
}

export default function TemplatePage() {
  const [selected, setSelected] = useState<string>("minimal");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string>("");
  const [savedContent, setSavedContent] = useState<string>("");
  const [savedTitle, setSavedTitle] = useState<string>("");
  const [hasRealContent, setHasRealContent] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem(TEMPLATE_KEY);
    if (saved) setSelected(saved);
    try {
      const raw = localStorage.getItem(CONTENT_KEY) || "{}";
      const parsed = JSON.parse(raw);
      const content: string = parsed?.content || "";
      const title: string = parsed?.title || "";
      setSavedContent(content);
      setSavedTitle(title || "블로그 포스트 제목 예시");
      setHasRealContent(content.length > 50);
    } catch {
      setSavedContent("");
      setSavedTitle("블로그 포스트 제목 예시");
      setHasRealContent(false);
    }
  }, []);

  const handleSelect = (id: string) => {
    setSelected(id);
    localStorage.setItem(TEMPLATE_KEY, id);
    toast.success(`✨ "${TEMPLATES.find(t => t.id === id)?.name}" 템플릿 선택됨`);
  };

  const openPreview = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const content = savedContent || SAMPLE;
    const title = savedTitle || "블로그 포스트 제목 예시";
    const html = buildTemplateHtml(id, title, content);
    setPreviewDoc(wrapForIframe(html));
    setPreviewId(id);
  };

  const selectedTpl = TEMPLATES.find(t => t.id === selected)!;

  return (
    <Layout>
      <style>{css}</style>
      <div className="tpl-page-bg">
        <div style={{ maxWidth: 1020, margin: "0 auto", padding: "36px 24px 60px" }}>

          {/* ── 헤더 ── */}
          <div style={{ marginBottom: 40, animation: "fadeUp 0.5s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.3rem", boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
              }}>🎨</div>
              <h1 className="tpl-shimmer" style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em" }}>
                템플릿 선택
              </h1>
            </div>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", marginLeft: 56 }}>
              배포할 글의 스타일을 선택하세요. <strong style={{ color: "#374151" }}>미리보기</strong>를 누르면 실제 발행 화면을 그대로 확인할 수 있어요.
            </p>
          </div>

          {/* ── 실제 콘텐츠 없음 경고 ── */}
          {!hasRealContent && (
            <div style={{
              background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
              border: "1px solid #fcd34d", borderRadius: 12,
              padding: "14px 18px", marginBottom: 28,
              display: "flex", alignItems: "center", gap: 10,
              animation: "fadeUp 0.4s ease 0.1s both",
            }}>
              <span style={{ fontSize: "1.2rem" }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#92400e" }}>저장된 콘텐츠가 없습니다</p>
                <p style={{ fontSize: "0.82rem", color: "#b45309" }}>미리보기는 샘플 텍스트로 표시됩니다. 콘텐츠 생성 후 다시 확인하세요.</p>
              </div>
            </div>
          )}

          {/* ── 현재 선택 + 구독자 미리보기 ── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
            background: "#fff",
            border: `2px solid ${selectedTpl.accent}33`,
            borderRadius: 16, padding: "16px 22px", marginBottom: 36,
            boxShadow: `0 4px 20px ${selectedTpl.accent}18`,
            animation: "fadeUp 0.5s ease 0.15s both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: selectedTpl.grad,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem",
              }}>{selectedTpl.emoji}</div>
              <div>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>현재 선택</p>
                <p style={{ fontSize: "1rem", fontWeight: 800, color: "#111", letterSpacing: "-0.01em" }}>{selectedTpl.name}</p>
              </div>
              <span style={{
                fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20,
                background: selectedTpl.grad, color: selectedTpl.accent,
                fontWeight: 800, letterSpacing: "0.05em",
              }}>{selectedTpl.tag}</span>
            </div>
            <button
              className="tpl-nav-btn"
              onClick={() => openPreview(selected)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 22px", borderRadius: 11, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#7c3aed,#2563eb)",
                color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
              }}>
              <Eye size={16} /> 구독자 미리보기
            </button>
          </div>

          {/* ── 템플릿 그리드 ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20, marginBottom: 40,
          }}>
            {TEMPLATES.map((t, i) => (
              <div
                key={t.id}
                className={`tpl-card${selected === t.id ? " is-selected" : ""}`}
                onClick={() => handleSelect(t.id)}
                style={{
                  animationDelay: `${i * 0.06}s`,
                  borderRadius: 18,
                  border: selected === t.id
                    ? `2px solid ${t.accent}`
                    : "2px solid #f0f0f0",
                  background: "#fff",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: selected === t.id
                    ? `0 8px 32px ${t.accent}28`
                    : "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                {/* 선택됨 배지 */}
                {selected === t.id && (
                  <div style={{
                    position: "absolute", top: 12, right: 12, zIndex: 2,
                    background: t.accent, borderRadius: "50%",
                    width: 24, height: 24,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <CheckCircle2 size={14} color="#fff" />
                  </div>
                )}

                {/* 상단 비주얼 영역 */}
                <div style={{
                  height: 100,
                  background: t.grad,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* 배경 패턴 */}
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
                  }} />
                  <span style={{ fontSize: "2.8rem", position: "relative", zIndex: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}>{t.emoji}</span>
                </div>

                {/* 카드 바디 */}
                <div style={{ padding: "16px 18px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111", letterSpacing: "-0.01em" }}>{t.name}</span>
                    <span style={{
                      fontSize: "0.68rem", padding: "2px 8px", borderRadius: 20,
                      background: t.grad, color: t.accent, fontWeight: 800,
                    }}>{t.tag}</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.55, whiteSpace: "pre-line", marginBottom: 14 }}>{t.desc}</p>

                  {/* 컬러 스트립 */}
                  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                    {[...Array(5)].map((_, j) => (
                      <div key={j} style={{
                        flex: j === 2 ? 2 : 1, height: 4, borderRadius: 4,
                        background: t.grad, opacity: 0.6 + j * 0.08,
                      }} />
                    ))}
                  </div>

                  {/* 미리보기 버튼 */}
                  <button
                    className="tpl-preview-btn"
                    onClick={(e) => openPreview(t.id, e)}
                    style={{
                      width: "100%", padding: "9px 0",
                      borderRadius: 10, border: "none", cursor: "pointer",
                      background: selected === t.id ? t.accent : t.grad,
                      color: selected === t.id ? "#fff" : t.accent,
                      fontWeight: 700, fontSize: "0.84rem",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      boxShadow: selected === t.id ? `0 4px 14px ${t.accent}44` : "none",
                    }}>
                    <Eye size={14} /> 실제 발행 미리보기
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── 하단 네비 버튼 ── */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", animation: "fadeUp 0.5s ease 0.5s both" }}>
            <button
              className="tpl-nav-btn"
              onClick={() => {
                const saved = JSON.parse(localStorage.getItem("blogauto_content") || "{}");
                const kw: string = saved?.keyword || "";
                const ttl: string = saved?.title || savedTitle || "";
                const content: string = saved?.content || savedContent || "";
                const autoPrompt = ttl ? `${kw} ${ttl}` : kw;
                const paragraphCount = content ? content.split(/\n\n+/).filter((p: string) => p.trim().length > 10).length : 0;
                const maxImgs = Math.max(1, Math.floor(paragraphCount / 3));
                navigate(`/images?prompt=${encodeURIComponent(autoPrompt)}&keyword=${encodeURIComponent(kw)}&maxImages=${maxImgs}`);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "13px 30px", borderRadius: 13, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#059669,#0d9488)",
                color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                boxShadow: "0 6px 20px rgba(5,150,105,0.4)",
              }}>
              <Image size={18} /> 이미지 생성으로 →
            </button>
            <button
              className="tpl-nav-btn"
              onClick={() => navigate("/deploy")}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "13px 30px", borderRadius: 13, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#c8102e,#e11d48)",
                color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                boxShadow: "0 6px 20px rgba(200,16,46,0.4)",
              }}>
              <Sparkles size={18} /> 배포 관리로 →
            </button>
          </div>

          {/* ── 안내 텍스트 ── */}
          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.82rem", color: "#9ca3af", animation: "fadeUp 0.5s ease 0.6s both" }}>
            선택한 템플릿은 배포 관리에서 발행 시 자동 적용됩니다
          </p>
        </div>
      </div>

      {/* ── 미리보기 모달 (iframe 격리) ── */}
      {previewId && (
        <div
          onClick={() => setPreviewId(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-start",
            padding: "24px 16px", overflowY: "auto",
          }}
        >
          <div
            className="tpl-modal-enter"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 860,
              borderRadius: 20, overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* 모달 상단 바 */}
            <div style={{
              background: "#0f0f0f",
              padding: "14px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* 맥OS 트래픽 라이트 */}
                <div style={{ display: "flex", gap: 6 }}>
                  {["#ff5f57","#febc2e","#28c840"].map(c => (
                    <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
                  ))}
                </div>
                <div style={{ width: 1, height: 16, background: "#333", margin: "0 4px" }} />
                <span style={{ fontSize: "0.9rem" }}>{TEMPLATES.find(t => t.id === previewId)?.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>
                  {TEMPLATES.find(t => t.id === previewId)?.name} — 실제 발행 미리보기
                </span>
                {hasRealContent
                  ? <span style={{ fontSize: "0.72rem", padding: "2px 8px", background: "#22c55e22", color: "#22c55e", borderRadius: 20, fontWeight: 700 }}>실제 콘텐츠</span>
                  : <span style={{ fontSize: "0.72rem", padding: "2px 8px", background: "#f59e0b22", color: "#f59e0b", borderRadius: 20, fontWeight: 700 }}>샘플 데이터</span>
                }
              </div>
              <button
                onClick={() => setPreviewId(null)}
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: "4px 6px", borderRadius: 6, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#666")}
              >
                <X size={18} />
              </button>
            </div>

            {/* iframe - 완전 격리된 실제 발행 화면 */}
            <iframe
              srcDoc={previewDoc}
              style={{
                width: "100%",
                height: "72vh",
                border: "none",
                background: "#fff",
                display: "block",
              }}
              sandbox="allow-same-origin allow-scripts"
              title="템플릿 미리보기"
            />

            {/* 모달 하단 버튼 */}
            <div style={{
              background: "#1a1a1a",
              padding: "14px 20px",
              display: "flex", gap: 10,
            }}>
              <button
                className="tpl-select-btn"
                onClick={() => { handleSelect(previewId); setPreviewId(null); }}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 11, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${TEMPLATES.find(t=>t.id===previewId)?.accent || "#7c3aed"}, ${TEMPLATES.find(t=>t.id===previewId)?.accent || "#2563eb"}cc)`,
                  color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                  boxShadow: `0 4px 16px ${TEMPLATES.find(t=>t.id===previewId)?.accent || "#7c3aed"}55`,
                }}>
                ✅ 이 템플릿으로 선택
              </button>
              <button
                className="tpl-select-btn"
                onClick={() => setPreviewId(null)}
                style={{
                  padding: "11px 24px", borderRadius: 11,
                  border: "1px solid #333", cursor: "pointer",
                  background: "transparent", color: "#aaa", fontWeight: 600, fontSize: "0.9rem",
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
