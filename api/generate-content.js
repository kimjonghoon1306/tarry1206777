// BlogAuto Pro - generate-content v5.0
// 고퀄 HTML 출력: 목차 + 색상표 + 마크박스 + FAQ + 참고링크

// ───────────────────────────────────────────────
// 텍스트 정제 (한자/마크다운 제거)
// ───────────────────────────────────────────────
function removeNonKorean(text) {
  const markers = ["[참고자료시작]","[참고자료끝]","[FAQ시작]","[FAQ끝]"];
  const placeholders = markers.map((m, i) => [`XSECMARK${i}X`, m]);
  placeholders.forEach(([key, val]) => { text = text.split(val).join(key); });

  text = text
    .replace(/[一-鿿㐀-䶿]/g, "")
    .replace(/[぀-ゟ゠-ヿ]/g, "")
    .replace(/\*{2,}/g, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/_{2,}/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  placeholders.forEach(([key, val]) => { text = text.split(key).join(val); });
  return text;
}

// ───────────────────────────────────────────────
// 섹션 파싱: AI 텍스트 → 구조화 데이터
// ───────────────────────────────────────────────
function parseAiText(rawText) {
  let body = rawText;
  let faqItems = [];
  let refLinks = [];

  // FAQ 파싱
  const faqMatch = rawText.match(/\[FAQ시작\]([\s\S]*?)\[FAQ끝\]/);
  if (faqMatch) {
    body = body.replace(faqMatch[0], "").trim();
    const faqRaw = faqMatch[1].trim();
    const qBlocks = faqRaw.split(/Q\d+:/g).filter(Boolean);
    qBlocks.forEach(block => {
      const [qPart, ...aParts] = block.split(/A\d+:/);
      if (qPart && aParts.length) {
        faqItems.push({
          q: qPart.trim(),
          a: aParts.join("").trim()
        });
      }
    });
  }

  // 참고자료 파싱
  const refMatch = rawText.match(/\[참고자료시작\]([\s\S]*?)\[참고자료끝\]/);
  if (refMatch) {
    body = body.replace(refMatch[0], "").trim();
    const refRaw = refMatch[1].trim();
    const lines = refRaw.split("\n").filter(l => l.trim().startsWith("LINK"));
    lines.forEach(line => {
      const parts = line.replace(/^LINK\d+:\s*/, "").split("|");
      if (parts.length >= 3) {
        refLinks.push({
          name: parts[0].trim(),
          desc: parts[1].trim(),
          url: parts[2].trim()
        });
      }
    });
  }

  return { body: body.trim(), faqItems, refLinks };
}

// ───────────────────────────────────────────────
// 본문 텍스트 → HTML 변환 (단락 + H2 섹션)
// ───────────────────────────────────────────────
function textToHtml(bodyText) {
  const lines = bodyText.split("\n").map(l => l.trim()).filter(Boolean);
  let html = "";
  let sectionCount = 0;

  lines.forEach((line, i) => {
    // 첫 줄 = 제목이면 스킵 (renderPostPage에서 h1으로 표시)
    if (i === 0 && line.length < 80 && !line.includes("요.") && !line.includes("다.")) return;

    // 소제목 감지: 짧고 마침표 없고 앞뒤 빈줄 있는 줄
    const isHeading = line.length < 40 && !line.endsWith(".") && !line.endsWith("요") && !line.endsWith("다") && !line.endsWith("!");
    if (isHeading && i > 0) {
      sectionCount++;
      html += `<h2>${line}</h2>\n`;
    } else {
      html += `<p>${line}</p>\n`;
    }
  });

  return html;
}

// ───────────────────────────────────────────────
// 목차 자동 생성
// ───────────────────────────────────────────────
function buildTOC(bodyHtml, faqItems, refLinks) {
  const h2Matches = [...bodyHtml.matchAll(/<h2>(.*?)<\/h2>/g)];
  if (h2Matches.length < 2 && !faqItems.length) return "";

  let items = h2Matches.map((m, i) => `<li><a href="#section-${i+1}">${m[1]}</a></li>`);
  if (faqItems.length) items.push(`<li><a href="#faq-section">자주 묻는 질문</a></li>`);
  if (refLinks.length) items.push(`<li><a href="#ref-section">참고자료 & 링크</a></li>`);

  return `
<div class="toc-box">
  <div class="toc-title">📋 목차</div>
  <ol class="toc-list">
    ${items.join("\n    ")}
  </ol>
</div>`;
}

// ───────────────────────────────────────────────
// 소제목에 id 삽입 (목차 앵커용)
// ───────────────────────────────────────────────
function addSectionIds(bodyHtml) {
  let count = 0;
  return bodyHtml.replace(/<h2>(.*?)<\/h2>/g, (_, title) => {
    count++;
    return `<h2 id="section-${count}">${title}</h2>`;
  });
}

// ───────────────────────────────────────────────
// FAQ HTML 렌더링
// ───────────────────────────────────────────────
function buildFaqHtml(faqItems) {
  if (!faqItems.length) return "";
  const items = faqItems.map(item => `
  <div class="faq-item">
    <div class="faq-q">❓ ${item.q}</div>
    <div class="faq-a">${item.a}</div>
  </div>`).join("\n");

  return `
<div id="faq-section" class="faq-section">
  <h2>자주 묻는 질문</h2>
  ${items}
</div>`;
}

// ───────────────────────────────────────────────
// 참고자료 링크 그리드 HTML
// ───────────────────────────────────────────────
function buildRefHtml(refLinks) {
  if (!refLinks.length) return "";
  const cards = refLinks.map(link => `
  <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="ref-card">
    <div class="ref-name">🔗 ${link.name}</div>
    <div class="ref-desc">${link.desc}</div>
  </a>`).join("\n");

  return `
<div id="ref-section" class="ref-section">
  <h2>참고자료 &amp; 링크</h2>
  <div class="ref-grid">
    ${cards}
  </div>
</div>`;
}

// ───────────────────────────────────────────────
// CSS 스타일 (tarryguide.com 렌더링 최적화)
// ───────────────────────────────────────────────
function buildStyles() {
  return `<style>
/* 목차 */
.toc-box{background:#f8f9ff;border:1px solid #d0d8ff;border-radius:12px;padding:20px 24px;margin:24px 0;font-size:.93rem}
.toc-title{font-weight:800;font-size:1rem;margin-bottom:10px;color:#2563eb}
.toc-list{margin:0;padding-left:20px;line-height:2}
.toc-list a{color:#2563eb;text-decoration:none;font-weight:500}
.toc-list a:hover{text-decoration:underline}

/* 소제목 */
.content h2{font-size:1.35rem;font-weight:800;margin:36px 0 14px;padding-bottom:8px;border-bottom:2px solid #e8e8ed;letter-spacing:-.02em;color:#1d1d1f}
.content h3{font-size:1.1rem;font-weight:700;margin:24px 0 10px;color:#333}

/* 단락 */
.content p{line-height:1.9;margin:0 0 16px;color:#2c2c2e}

/* 정보 마크 박스 */
.info-box{background:#eff6ff;border-left:4px solid #2563eb;border-radius:0 10px 10px 0;padding:14px 18px;margin:20px 0;font-size:.93rem;color:#1e3a8a;line-height:1.7}
.tip-box{background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 10px 10px 0;padding:14px 18px;margin:20px 0;font-size:.93rem;color:#14532d;line-height:1.7}
.warn-box{background:#fff7ed;border-left:4px solid #ea580c;border-radius:0 10px 10px 0;padding:14px 18px;margin:20px 0;font-size:.93rem;color:#7c2d12;line-height:1.7}

/* 표 */
.content table{width:100%;border-collapse:collapse;margin:20px 0;border-radius:10px;overflow:hidden;font-size:.9rem}
.content table thead tr{background:#2563eb;color:#fff}
.content table th{padding:12px 16px;text-align:left;font-weight:700}
.content table td{padding:11px 16px;border-bottom:1px solid #e8e8ed}
.content table tbody tr:nth-child(even){background:#f5f7ff}
.content table tbody tr:hover{background:#eff3ff}

/* FAQ */
.faq-section{margin:36px 0}
.faq-item{border:1px solid #e8e8ed;border-radius:12px;margin-bottom:12px;overflow:hidden}
.faq-q{background:#f5f5f7;padding:14px 18px;font-weight:700;font-size:.95rem;color:#1d1d1f;cursor:pointer}
.faq-a{padding:14px 18px;font-size:.9rem;line-height:1.8;color:#444;border-top:1px solid #e8e8ed}

/* 참고자료 그리드 */
.ref-section{margin:36px 0}
.ref-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:14px}
.ref-card{display:block;text-decoration:none;border:1px solid #e8e8ed;border-radius:12px;padding:16px 18px;transition:box-shadow .2s,transform .2s;background:#fff}
.ref-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08);transform:translateY(-2px)}
.ref-name{font-weight:700;font-size:.92rem;color:#2563eb;margin-bottom:6px}
.ref-desc{font-size:.82rem;color:#86868b;line-height:1.5}

/* 태그 */
.content-tags{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 0}
.content-tag{padding:5px 12px;background:#f0f4ff;color:#2563eb;border-radius:999px;font-size:.8rem;font-weight:600}

@media(max-width:600px){
  .ref-grid{grid-template-columns:1fr}
  .toc-box{padding:14px 16px}
}
</style>`;
}

// ───────────────────────────────────────────────
// 전체 HTML 조립
// ───────────────────────────────────────────────
function buildRichHtml(rawText, keyword, tags = []) {
  const { body, faqItems, refLinks } = parseAiText(rawText);

  let bodyHtml = textToHtml(body);
  bodyHtml = addSectionIds(bodyHtml);

  const toc = buildTOC(bodyHtml, faqItems, refLinks);
  const faqHtml = buildFaqHtml(faqItems);
  const refHtml = buildRefHtml(refLinks);
  const styles = buildStyles();

  // 태그 HTML
  const tagHtml = tags.length
    ? `<div class="content-tags">${tags.map(t => `<span class="content-tag">#${t}</span>`).join("")}</div>`
    : keyword
    ? `<div class="content-tags"><span class="content-tag">#${keyword}</span></div>`
    : "";

  return `${styles}
${toc}
${bodyHtml}
${faqHtml}
${refHtml}
${tagHtml}`.trim();
}

function ensureMinChars(text, minChars, keyword, title) {
  let out = removeNonKorean(text || "");
  if (out.length >= minChars) return out;
  const filler = `이어서 실제로 느낀 점을 조금 더 적어보면, ${keyword}는 상황에 따라 체감 차이가 꽤 큰 편입니다. 처음에는 작은 차이처럼 보여도 계속 비교해보면 선택 기준이 분명해집니다.`;
  while (out.length < minChars) out += `\n\n${filler}`;
  return removeNonKorean(out);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    provider, apiKey, keyword, title,
    language = "ko", minChars = 1500,
    stylePrompt = "", adPlatform = "",
    tags = []
  } = req.body;

  if (!provider || !apiKey || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const langMap = {
    ko: "한국어", en: "English", ja: "日本語", zh: "中文",
    es: "Español", fr: "Français", de: "Deutsch", pt: "Português",
  };
  const langLabel = langMap[language] || "한국어";
  const targetChars = parseInt(minChars) || 1500;
  const maxTokens = Math.min(8000, Math.max(4000, Math.ceil(targetChars * 2)));

  const titleInstruction = title
    ? `글 제목은 반드시 "${title}" 으로 시작해줘.`
    : `글 제목은 키워드 "${keyword}"를 포함한 클릭률 높은 제목으로 만들어줘.`;

  const adGuide = adPlatform === "adsense"
    ? "구글 애드센스 CPC 최적화: 클릭 유도 문구, 정보성 키워드 밀도 높게"
    : adPlatform === "adpost"
    ? "네이버 애드포스트 CPM 최적화: 체류 시간 늘리는 스토리 구성, 감성적 공감 유도"
    : "애드센스/애드포스트 통합 최적화";

  const styleGuide = stylePrompt ? `\n[글쓰기 스타일]\n${stylePrompt}` : "";

  const kw = (keyword + " " + (title || "")).toLowerCase();
  let categoryGuide = "";

  if (/맛집|음식|카페|식당|요리|레스토랑|빵|디저트|커피|치킨|피자|라면|떡볶이|삼겹살|회|초밥|파스타|브런치|술집|포차/.test(kw)) {
    categoryGuide = `[맛집/음식] 가게 분위기, 메뉴 맛 상세 묘사, 가격/웨이팅, 인스타 포인트, 솔직한 단점, 재방문 의향`;
  } else if (/it|앱|어플|프로그램|소프트웨어|ai|인공지능|테크|스마트폰|노트북|챗gpt|유튜브|넷플릭스/.test(kw)) {
    categoryGuide = `[IT/테크] 전문용어 쉽게 풀이, 실제 사용 후기, 비교표, 무료/유료 차이, 초보자 단계별 가이드`;
  } else if (/리뷰|후기|사용기|체험|써봤|먹어봤|가봤|구매|샀|직접/.test(kw)) {
    categoryGuide = `[리뷰] 사용 전 기대 vs 실제 평가, 사용 기간, 장단점 균형, 수치로 표현, 다시 살 의향`;
  } else if (/여행|관광|호텔|숙소|펜션|리조트|해외|국내|제주|부산|서울|강원|경주/.test(kw)) {
    categoryGuide = `[여행] 교통+비용, 명소 TOP5, 현지 맛집, 예산 총정리, 시즌별 추천, 숨은 명소`;
  } else if (/건강|다이어트|운동|헬스|영양|의학|병원|약|증상|피부|탈모/.test(kw)) {
    categoryGuide = `[건강] 용어 쉽게 풀이, 집에서 할 수 있는 방법 vs 병원 필요 경우, 잘못된 상식 바로잡기`;
  } else if (/재테크|투자|주식|부동산|코인|적금|보험|카드|할인|절약|돈/.test(kw)) {
    categoryGuide = `[재테크] 초보자 눈높이, 실제 수치 예시, 리스크+수익률 균형, 연령대별 전략`;
  } else {
    categoryGuide = `[정보성] 독자가 몰랐던 새 정보, 바로 써먹는 실용 팁, 구체적 사례와 수치`;
  }

  const prompt = `당신은 대한민국 최고의 블로그 작가입니다. 친구에게 카톡 보내듯, 기자가 르포 기사 쓰듯 생생하게 씁니다.

키워드: "${keyword}"
${titleInstruction}
언어: ${langLabel}
목표 글자수: ${targetChars}자 이상
수익 최적화: ${adGuide}

${categoryGuide}

[필수 원칙]
① AI 티 절대 금지: "저도 처음엔", "솔직히 말하면", "이거 진짜 써보니까" 같은 자연스러운 표현
② 구체적 정보: 실제 가격, 수치, 날짜, 기간 반드시 포함
③ 소제목 구조: 본문을 4~6개 소제목으로 나눠서 작성 (각 소제목은 줄바꿈 후 단독 줄에 20자 이내로)
④ 단락: 각 3~5문장씩 균등하게
⑤ SEO: 키워드 7회 이상 자연스럽게 포함

[형식 규칙 - 절대 준수]
- 반드시 ${targetChars}자 이상
- ** 별표 절대 금지
- ## 샵 절대 금지
- - 대시 목록 절대 금지
- 순수 텍스트만 (한글+영어+숫자만)
- 한자/일본어/중국어 절대 금지${styleGuide}

[필수 섹션 - 본문 끝에 반드시 추가]

[참고자료시작]
LINK1: (공식기관 또는 신뢰할 수 있는 사이트 이름)|(한 줄 설명)|(https://실제URL)
LINK2: (사이트 이름)|(설명)|(https://실제URL)
LINK3: (사이트 이름)|(설명)|(https://실제URL)
[참고자료끝]

[FAQ시작]
Q1: (독자가 가장 궁금해하는 질문)
A1: (구체적 답변)
Q2: (질문)
A2: (답변)
Q3: (질문)
A3: (답변)
Q4: (질문)
A4: (답변)
[FAQ끝]`;

  try {

    // ── Gemini ──────────────────────────────────────────
    if (provider === "gemini") {
      const GEMINI_MODELS = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash-exp",
        "gemini-exp-1206",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
      ];

      let lastError = null;
      for (const model of GEMINI_MODELS) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: Math.min(maxTokens, 8192) },
              }),
            }
          );

          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            const msg = (err.error?.message || "").toLowerCase();
            const status = resp.status;

            if (msg.includes("api key") || msg.includes("api_key") || status === 403) {
              throw new Error("FATAL:Gemini API 키가 잘못되었거나 권한이 없습니다.");
            }
            if (status === 429 || status === 503 || status === 404 ||
              msg.includes("quota") || msg.includes("resource_exhausted") ||
              msg.includes("rate") || msg.includes("overloaded") ||
              msg.includes("limit") || msg.includes("not found")) {
              lastError = `${model} 한도 초과`;
              continue;
            }
            lastError = `Gemini 오류 (${status})`;
            continue;
          }

          const data = await resp.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!text) { lastError = `${model} 빈 응답`; continue; }

          const richHtml = buildRichHtml(removeNonKorean(text), keyword, tags);
          return res.json({ content: richHtml });

        } catch (e) {
          if (e.message?.startsWith("FATAL:")) throw new Error(e.message.replace("FATAL:", ""));
          lastError = e.message;
          continue;
        }
      }
      throw new Error(`Gemini 한도 초과 (${lastError}). 잠시 후 다시 시도하거나 Groq로 전환해주세요.`);
    }

    // ── Claude ──────────────────────────────────────────
    if (provider === "claude") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("credit") || msg.includes("balance")) throw new Error("Claude 크레딧 부족. 충전해주세요.");
        if (msg.includes("api_key")) throw new Error("Claude API 키가 잘못되었습니다.");
        throw new Error(`Claude 오류: ${resp.status}`);
      }
      const data = await resp.json();
      const richHtml = buildRichHtml(removeNonKorean(data.content?.[0]?.text || ""), keyword, tags);
      return res.json({ content: richHtml });
    }

    // ── OpenAI ──────────────────────────────────────────
    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("quota") || msg.includes("billing")) throw new Error("OpenAI 크레딧 부족.");
        throw new Error(`OpenAI 오류: ${resp.status}`);
      }
      const data = await resp.json();
      const richHtml = buildRichHtml(removeNonKorean(data.choices?.[0]?.message?.content || ""), keyword, tags);
      return res.json({ content: richHtml });
    }

    // ── Groq ────────────────────────────────────────────
    if (provider === "groq") {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: Math.min(maxTokens, 8000),
          temperature: 0.7,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("rate_limit")) throw new Error("Groq 분당 요청 한도 초과. 잠시 후 다시 시도해주세요.");
        throw new Error(`Groq 오류: ${resp.status}`);
      }
      const data = await resp.json();
      const richHtml = buildRichHtml(removeNonKorean(data.choices?.[0]?.message?.content || ""), keyword, tags);
      return res.json({ content: richHtml });
    }

    return res.status(400).json({ error: "지원하지 않는 AI입니다" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
