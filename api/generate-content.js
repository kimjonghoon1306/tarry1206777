// BlogAuto Pro - generate-content v5.1
// 플레인 텍스트 출력 (## 소제목 허용) + FAQ/참고자료 마커 유지

// Groq가 마커 없이 날것 텍스트로 쓸 때 자동으로 마커 씌우기
function ensureMarkers(text) {
  // 이미 마커가 있으면 그대로 반환
  if (text.includes("[FAQ시작]") && text.includes("[참고자료시작]")) return text;

  // Q1:/A1: 패턴 또는 **Q1** 또는 질문1: 등 다양한 FAQ 패턴 감지
  const faqPattern = /Q1\s*[:.：]|\*\*Q1\*\*|질문\s*1\s*[:.：]|FAQ\s*1\s*[:.：]/i;
  if (!text.includes("[FAQ시작]") && faqPattern.test(text)) {
    text = text.replace(
      /((?:Q1|\*\*Q1\*\*|질문\s*1)\s*[:.：][\s\S]*?)(?=\nLINK1\s*[:.：]|\nPOST1\s*[:.：]|\n\[참고자료|\n\[관련글|$)/i,
      "[FAQ시작]\n$1\n[FAQ끝]"
    );
  }

  // LINK1: 패턴 → [참고자료시작]~[참고자료끝] (URL 전체 유지)
  if (!text.includes("[참고자료시작]") && /LINK1\s*:/i.test(text)) {
    text = text.replace(
      /(LINK1\s*:[\s\S]*?)(?=\nPOST1\s*:|\n\[|$)/i,
      (match) => {
        return "[참고자료시작]\n" + match + "\n[참고자료끝]";
      }
    );
  }

  // POST1: 패턴 → [관련글시작]~[관련글끝] (URL 제거)
  if (!text.includes("[관련글시작]") && /POST1\s*:/i.test(text)) {
    text = text.replace(
      /(POST1\s*:[\s\S]*?)(?=\n\[|$)/i,
      (match) => {
        // POST 각 줄에서 URL 부분 제거 (제목|설명 형식만 유지)
        const cleaned = match.split("\n").map(line => {
          return line.replace(/\|?\s*https?:\/\/\S+/gi, "").trim();
        }).join("\n");
        return "[관련글시작]\n" + cleaned + "\n[관련글끝]";
      }
    );
  }

  return text;
}

function removeNonKorean(text) {
  const markers = ["[참고자료시작]","[참고자료끝]","[FAQ시작]","[FAQ끝]","[팁]","[주의]","[중요]"];
  const placeholders = markers.map((m, i) => [`XSECMARK${i}X`, m]);
  placeholders.forEach(([key, val]) => { text = text.split(val).join(key); });

  // ## 소제목 보호
  const h2Lines = [];
  text = text.replace(/^## .+$/gm, (match) => {
    const idx = h2Lines.length;
    h2Lines.push(match);
    return 'XH2LINE' + idx + 'X';
  });

  text = text
    .replace(/[一-鿿㐀-䶿]/g, "")
    .replace(/[\u3040-ゟ゠-ヿ]/g, "")
    .replace(/\*{2,}/g, "")
    .replace(/^#{3,}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/_{2,}/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // ## 소제목 복원
  h2Lines.forEach((line, idx) => { text = text.split('XH2LINE' + idx + 'X').join(line); });
  placeholders.forEach(([key, val]) => { text = text.split(key).join(val); });
  return text;
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
    // 체험단 모드
    cheokdanMode = false,
    shopName, region, category, visitDate, companions,
    menus, tasteStar, atmosphereStar, serviceStar,
    highlight, weakness,
  } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  // ── 체험단 전용 처리 ──────────────────────────────────────
  if (cheokdanMode) {
    const menuText = (menus || []).filter(m => m.name)
      .map(m => m.price ? `${m.name} (${m.price}원)` : m.name).join(", ");
    const starToText = n => ["★☆☆☆☆","★★☆☆☆","★★★☆☆","★★★★☆","★★★★★"][Math.min(Math.max((n||3)-1,0),4)];

    // 글쓰기 스타일 변주 뱅크 - 매 생성마다 랜덤 선택
    const styleVariants = [
      {
        name: "친근 수다체",
        tone: "친한 친구한테 카톡 보내듯 편하고 수다스럽게. 감탄사 자연스럽게 사용(진짜, 대박, 헐 등). 짧은 문장과 긴 문장을 섞어서 리듬감 살리기.",
        intro: `${shopName ? shopName + "에" : "여기에"} 다녀왔는데 진짜 너무 좋아서 바로 글 남겨요.`,
      },
      {
        name: "꼼꼼 리뷰어체",
        tone: "꼼꼼하게 분석하는 리뷰어처럼. 메뉴별 점수나 구체적 수치 포함. 장단점을 균형 있게 서술. 신뢰감 있는 담백한 문체.",
        intro: `${visitDate || "최근"}에 방문해서 꼼꼼하게 살펴봤어요. 솔직하게 정리해드릴게요.`,
      },
      {
        name: "감성 스토리텔러체",
        tone: "방문 전 설렘부터 떠나는 아쉬움까지 감성적으로 스토리텔링. 분위기와 감정을 풍부하게 묘사. 독자가 함께 방문한 느낌이 들도록.",
        intro: `${companions ? companions + "과 함께" : "오랜만에"} 찾아간 ${shopName || "이곳"}은 기대 이상이었어요.`,
      },
    ];
    const sv = styleVariants[Math.floor(Math.random() * styleVariants.length)];

    const cheokdanPrompt = `당신은 네이버 블로그 체험단 상위 노출 전문 작가입니다. 아래 정보로 실제 체험단 블로거처럼 생생한 포스팅을 작성하세요.

[가게 정보]
- 가게명: ${shopName || ""}
- 지역: ${region || ""}
- 업종: ${category || ""}
- 방문일: ${visitDate || ""}
- 동반인: ${companions || ""}
- 주문 메뉴: ${menuText || ""}
- 맛 평점: ${starToText(tasteStar)} (${tasteStar||3}/5)
- 분위기 평점: ${starToText(atmosphereStar)} (${atmosphereStar||3}/5)
- 서비스 평점: ${starToText(serviceStar)} (${serviceStar||3}/5)
- 특별했던 점: ${highlight || ""}
- 아쉬운 점: ${weakness || "없음"}

[이번 글 스타일: ${sv.name}]
${sv.tone}
첫 문장 예시(그대로 쓰지 말고 이 톤으로 변형): "${sv.intro}"

[글쓰기 원칙]
- 위 스타일에 맞는 1인칭 구어체로 작성
- 마크다운 기호(*, #) 절대 사용 금지, 일반 텍스트만
- FAQ/참고자료/관련글 절대 금지
- 반드시 완전히 끝마칠 것 (마침표/느낌표로 마무리)
- 총 글자수 반드시 1500자 이상 (마커 제외, 짧으면 절대 안 됨)
- AI 티 나는 표현 금지: "~해보겠습니다", "~에 대해 알아보겠습니다" 등 사용 금지

[필수 구조 - 아래 순서와 마커를 정확히 그대로 사용할 것]

(방문 전 기대감과 인트로 3줄 - 위 스타일로 작성)

[📸 가게 외관 또는 간판 사진]

(가게 분위기와 인테리어 3줄 작성)

[📸 내부 인테리어 또는 테이블 사진]

(주문 과정과 첫인상 2줄 작성)

[📸 메뉴판 또는 음식 전체 사진]

(메뉴별 맛 상세 후기 - 시각/후각/미각/식감 오감으로 묘사 4줄)

[📸 음식 클로즈업 사진]

[🎬 음식 나오는 순간 또는 먹는 장면 영상 - 30초~1분 추천]

(서비스와 직원 친절함 2줄 작성)

[📸 서비스 또는 공간 분위기 사진]

(솔직한 총평 + 재방문 의사 + 추천 여부 3줄 - 위 스타일로 마무리)

[📸 가게 외관 또는 마무리 대표 사진]

#${shopName||""} #${region||""}맛집 #${category||""} #네이버블로그 #체험단

지금 바로 위 구조 그대로 작성해주세요:`;

    try {
      let content = "";
      if (provider === "gemini") {
        const models = ["gemini-2.0-flash","gemini-2.5-flash","gemini-1.5-flash"];
        for (const model of models) {
          try {
            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              { method:"POST", headers:{"Content-Type":"application/json"},
                body: JSON.stringify({ contents:[{parts:[{text:cheokdanPrompt}]}], generationConfig:{maxOutputTokens:4096,temperature:0.8} }) });
            if (!r.ok) continue;
            const d = await r.json();
            const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
            if (t) { content = t; break; }
          } catch {}
        }
      } else if (provider === "claude") {
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST", headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
          body: JSON.stringify({ model:"claude-3-5-haiku-20241022", max_tokens:4096, messages:[{role:"user",content:cheokdanPrompt}] }) });
        const d = await r.json(); content = d.content?.[0]?.text || "";
      } else if (provider === "openai") {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
          body: JSON.stringify({ model:"gpt-4o-mini", messages:[{role:"user",content:cheokdanPrompt}], max_tokens:4096, temperature:0.8 }) });
        const d = await r.json(); content = d.choices?.[0]?.message?.content || "";
      } else if (provider === "groq") {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
          body: JSON.stringify({ model:"llama-3.3-70b-versatile", messages:[{role:"user",content:cheokdanPrompt}], max_tokens:4096, temperature:0.8 }) });
        const d = await r.json(); content = d.choices?.[0]?.message?.content || "";
      }
      if (!content) throw new Error("AI 응답이 비어있습니다.");
      return res.json({ content });
    } catch(e) {
      return res.status(500).json({ error: e.message || "체험단 글 생성 오류" });
    }
  }
  // ─────────────────────────────────────────────────────────

  // ── extend 모드: 기존 글 이어쓰기 ────────────────────────
  if (req.body.extendMode) {
    const { existingContent, shopName: sn } = req.body;
    const needed = 1500 - (existingContent || "").length;
    const extPrompt = `아래 체험단 블로그 글이 현재 ${(existingContent||"").length}자로 짧아요. 최소 ${needed}자 이상 자연스럽게 이어서 써주세요. 추가 내용만 출력하고 기존 글은 반복하지 마세요. 마크다운(**,#)은 쓰지 마세요.\n\n기존 글:\n${existingContent}`;
    try {
      let added = "";
      if (provider === "gemini") {
        const models = ["gemini-2.0-flash","gemini-2.5-flash","gemini-1.5-flash"];
        for (const model of models) {
          try {
            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
              { method:"POST", headers:{"Content-Type":"application/json"},
                body: JSON.stringify({ contents:[{parts:[{text:extPrompt}]}], generationConfig:{maxOutputTokens:2048,temperature:0.7} }) });
            if (!r.ok) continue;
            const d = await r.json();
            const t = d.candidates?.[0]?.content?.parts?.[0]?.text;
            if (t) { added = t; break; }
          } catch {}
        }
      } else if (provider === "openai") {
        const r = await fetch("https://api.openai.com/v1/chat/completions",
          { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
            body: JSON.stringify({ model:"gpt-4o-mini", messages:[{role:"user",content:extPrompt}], max_tokens:2048 }) });
        const d = await r.json(); added = d.choices?.[0]?.message?.content || "";
      } else if (provider === "groq") {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions",
          { method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
            body: JSON.stringify({ model:"llama-3.3-70b-versatile", messages:[{role:"user",content:extPrompt}], max_tokens:2048 }) });
        const d = await r.json(); added = d.choices?.[0]?.message?.content || "";
      } else if (provider === "claude") {
        const r = await fetch("https://api.anthropic.com/v1/messages",
          { method:"POST", headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
            body: JSON.stringify({ model:"claude-3-5-haiku-20241022", max_tokens:2048, messages:[{role:"user",content:extPrompt}] }) });
        const d = await r.json(); added = d.content?.[0]?.text || "";
      }
      if (!added) throw new Error("이어쓰기 응답이 비어있습니다.");
      return res.json({ content: added.replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1").replace(/^#{1,3}\s+/gm,"").trim() });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }
  // ─────────────────────────────────────────────────────────

  if (!keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const langMap = {
    ko: "한국어", en: "English", ja: "日本語", zh: "中文",
    es: "Español", fr: "Français", de: "Deutsch", pt: "Português",
  };
  const langLabel = langMap[language] || "한국어";
  const targetChars = parseInt(minChars) || 1500;
  const maxTokens = 8000; // 항상 최대 토큰 (잘림 방지)

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

  // 카테고리별 경험 시나리오 뱅크 (AI 냄새 차단용 1인칭 경험 삽입)
  const experienceScenarios = {
    food: [
      "지난 주말 친구랑 우연히 들어갔다가 완전 반해버렸어요.",
      "줄 서서 기다리면서 반신반의했는데 막상 먹어보니 기다린 보람이 있더라고요.",
      "동네 단골 맛집을 찾다가 블로그 보고 방문했는데 기대 이상이었어요.",
    ],
    tech: [
      "한 달 넘게 직접 써보고 나서야 확실히 판단이 섰어요.",
      "처음엔 익숙해지는 데 2주 정도 걸렸는데 지금은 없으면 안 될 것 같아요.",
      "무료 버전 2주 쓰다가 결국 유료 결제했습니다.",
    ],
    review: [
      "실제로 3개월 써본 솔직한 후기예요. 광고 아닙니다.",
      "온라인에서 좋은 리뷰만 보고 샀다가 실망한 적이 있어서 최대한 균형 잡으려 했어요.",
      "구매 전에 이런 글 없어서 직접 써봤어요.",
    ],
    travel: [
      "2박 3일 일정 짜면서 정말 많이 찾아봤는데 도움 되는 글이 없어서 다녀와서 직접 씁니다.",
      "성수기에 다녀왔는데 사람 많아도 충분히 가볼 만했어요.",
      "처음 가는 곳이라 긴장했는데 막상 가보니 생각보다 훨씬 좋았어요.",
    ],
    health: [
      "3개월 직접 해보고 달라진 점 솔직하게 정리해봤어요.",
      "병원 두 군데 돌아다니고 나서 내린 결론이에요.",
      "저도 똑같은 고민 하다가 이것저것 해봤는데 이게 제일 효과 있었어요.",
    ],
    money: [
      "실제로 1년 해본 결과물이에요. 수익률 숫자도 그대로 공개할게요.",
      "재테크 시작할 때 이런 글 있었으면 시행착오 줄였을 텐데 싶어서 씁니다.",
      "처음엔 소액으로 시작했다가 지금은 금액을 올렸어요.",
    ],
    info: [
      "찾아봤는데 정리된 글이 없어서 직접 알아보고 정리했어요.",
      "저도 이거 몰라서 한참 헤맸는데 이제서야 알게 됐어요.",
      "주변에서 많이 물어봐서 한 번에 정리해봤습니다.",
    ],
  };

  // 랜덤 경험 문장 선택
  function pickExp(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  let categoryGuide = "";
  let experienceHint = "";
  if (/맛집|음식|카페|식당|요리|레스토랑|빵|디저트|커피|치킨|피자/.test(kw)) {
    categoryGuide = `[맛집/음식] 가게 분위기, 메뉴 맛 상세 묘사(시각·후각·미각·식감), 가격/웨이팅 현실 정보, 인스타 포인트, 솔직한 단점, 재방문 의향
소제목 예시(이런 질문형으로): "왜 여기가 웨이팅이 생겼을까?", "직접 먹어본 시그니처 메뉴 솔직 후기", "이 가격이면 가볼 만할까?"`;
    experienceHint = pickExp(experienceScenarios.food);
  } else if (/it|앱|어플|프로그램|소프트웨어|ai|인공지능|테크|스마트폰|노트북|챗gpt|유튜브|넷플릭스/.test(kw)) {
    categoryGuide = `[IT/테크] 전문용어 쉽게 풀이, 실제 사용 후기(기간 명시), 비교 정보, 무료/유료 차이, 초보자 단계별 가이드
소제목 예시(이런 질문형으로): "실제로 써보니 어떤가요?", "무료로 써도 충분할까요?", "이런 분들께 추천합니다"`;
    experienceHint = pickExp(experienceScenarios.tech);
  } else if (/리뷰|후기|사용기|체험|써봤|먹어봤|가봤|구매|샀|직접/.test(kw)) {
    categoryGuide = `[리뷰] 사용 전 기대 vs 실제 평가, 사용 기간 명시, 장단점 균형, 수치로 표현, 다시 살 의향
소제목 예시(이런 질문형으로): "사기 전에 이것만 확인하세요", "실제로 써보니 달랐던 점은?", "이런 분들께는 비추합니다"`;
    experienceHint = pickExp(experienceScenarios.review);
  } else if (/여행|관광|호텔|숙소|펜션|리조트|해외|국내|제주|부산|서울|강원/.test(kw)) {
    categoryGuide = `[여행] 교통+실제 비용(구체적 금액), 명소 현실 정보, 현지 맛집, 예산 총정리, 시즌별 팁, 아무도 안 알려주는 정보
소제목 예시(이런 질문형으로): "여기 진짜 가볼 만한가요?", "얼마 있으면 2박 3일 가능할까요?", "처음 가는 분들이 꼭 알아야 할 것"`;
    experienceHint = pickExp(experienceScenarios.travel);
  } else if (/건강|다이어트|운동|헬스|영양|의학|병원|약|증상|피부|탈모/.test(kw)) {
    categoryGuide = `[건강] 용어 쉽게 풀이, 집에서 할 수 있는 방법 vs 병원 필요 경우, 잘못된 상식 바로잡기, 실제 경험 기간+결과 수치
소제목 예시(이런 질문형으로): "정말 효과가 있을까요?", "언제 병원에 가야 할까요?", "이렇게 하면 안 됩니다"`;
    experienceHint = pickExp(experienceScenarios.health);
  } else if (/재테크|투자|주식|부동산|코인|적금|보험|카드|할인|절약|돈/.test(kw)) {
    categoryGuide = `[재테크] 초보자 눈높이, 실제 수치 예시(금액 명시), 리스크+수익률 균형, 연령대별 전략, 내가 직접 해본 결과
소제목 예시(이런 질문형으로): "진짜 수익이 날까요?", "초보가 처음 시작하려면?", "이것만은 조심하세요"`;
    experienceHint = pickExp(experienceScenarios.money);
  } else {
    categoryGuide = `[정보성] 독자가 몰랐던 새 정보, 바로 써먹는 실용 팁, 구체적 사례와 수치, 내가 직접 알아본 과정
소제목 예시(이런 질문형으로): "왜 이게 중요한가요?", "실제로 어떻게 하면 되나요?", "이런 실수 하지 마세요"`;
    experienceHint = pickExp(experienceScenarios.info);
  }

  const prompt = `당신은 대한민국 블로그 작가입니다. 실제로 경험한 사람처럼, 독자와 대화하듯 생생하게 씁니다.

키워드: "${keyword}"
${titleInstruction}
언어: ${langLabel}
목표 글자수: ${targetChars}자 이상
수익 최적화: ${adGuide}

${categoryGuide}

[경험 시나리오 - 글 앞부분에 이 맥락을 자연스럽게 녹여서 사용]
"${experienceHint}"
(위 문장을 그대로 쓰지 말고 이 감정과 맥락을 변형해서 사용)

[필수 원칙]
① AI 티 절대 금지: "~해보겠습니다", "~에 대해 알아보겠습니다", "결론적으로" 같은 AI 패턴 표현 사용 금지
② 구체적 정보: 실제 가격, 수치, 날짜, 기간 반드시 포함 (애매한 표현 금지)
③ 소제목은 반드시 독자의 질문 형태로 작성 (4~6개)
   예) ❌ "맛집 소개" → ✅ "왜 여기가 웨이팅이 생겼을까?"
   예) ❌ "사용 방법" → ✅ "처음 쓰는 분들이 꼭 알아야 할 것은?"
④ 각 소제목 아래 단락은 3~5문장으로 균등하게
⑤ 키워드는 3~4회만 자연스럽게 포함. 나머지는 동의어·연관어로 다양하게 표현
⑥ 중요 문장 마커: 글 전체에서 3~5회 아래 마커를 문장 맨 앞에 단독 줄로 사용
   [팁] 독자에게 유용한 꿀팁, 추천, 노하우 문장
   [주의] 독자가 조심해야 할 것, 실수하기 쉬운 것
   [중요] 반드시 알아야 할 핵심 정보, 요약 포인트

[형식 규칙]
- 본문(소제목+단락)만 ${targetChars}자 이상 작성
- FAQ와 참고자료는 글자수에 포함하지 않음 (별도 추가)
- 소제목은 ## 소제목 형식만 사용 (### 이상 금지)
- ** 별표 강조 금지
- - 대시 목록 금지
- 순수 텍스트 + ## 소제목만 사용
- 한자/일본어/중국어 절대 금지${styleGuide}

[작성 순서 - 반드시 이 순서대로]
1단계: 본문을 ${targetChars}자 이상 완전히 작성하고 마무리 문장까지 끝낼 것
2단계: 본문 끝나면 바로 아래 형식으로 FAQ 추가 (글자수 무관)
3단계: FAQ 끝나면 바로 아래 형식으로 참고자료 추가 (글자수 무관)
4단계: 참고자료 끝나면 바로 아래 형식으로 관련글 추가 (글자수 무관)

[FAQ시작]
Q1: (독자가 가장 궁금해하는 질문)
A1: (구체적 답변)
Q2: (질문)
A2: (답변)
Q3: (질문)
A3: (답변)
[FAQ끝]

[참고자료시작]
⚠️ URL 규칙: 반드시 실제 존재하는 공식 사이트 메인 URL만 사용할 것. 확실하지 않으면 아래 공식 URL만 사용.
- 정부/공공: https://www.gov.kr, https://www.nts.go.kr, https://www.fsc.go.kr, https://www.moel.go.kr
- 금융: https://www.krx.co.kr, https://www.bok.or.kr, https://www.fss.or.kr
- 건강: https://www.nhis.or.kr, https://www.kdca.go.kr
LINK1: (공식기관 또는 신뢰할 수 있는 사이트 이름)|(한 줄 설명)|(https://실제공식URL)
LINK2: (사이트 이름)|(설명)|(https://실제공식URL)
LINK3: (사이트 이름)|(설명)|(https://실제공식URL)
[참고자료끝]

[관련글시작]
POST1: (이 글과 연관된 블로그 주제 제목 1)|(독자가 이 글을 읽으면 좋은 이유 한 줄)
POST2: (연관 주제 제목 2)|(이유)
POST3: (연관 주제 제목 3)|(이유)
[관련글끝]`;

  try {
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
          return res.json({ content: removeNonKorean(text) });
        } catch (e) {
          if (e.message?.startsWith("FATAL:")) throw new Error(e.message.replace("FATAL:", ""));
          lastError = e.message;
          continue;
        }
      }
      throw new Error(`Gemini 한도 초과 (${lastError}). Groq로 전환해주세요.`);
    }

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
        if (msg.includes("credit") || msg.includes("balance")) throw new Error("Claude 크레딧 부족.");
        if (msg.includes("api_key")) throw new Error("Claude API 키가 잘못되었습니다.");
        throw new Error(`Claude 오류: ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({ content: removeNonKorean(data.content?.[0]?.text || "") });
    }

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
      return res.json({ content: removeNonKorean(data.choices?.[0]?.message?.content || "") });
    }

    if (provider === "groq") {
      // Groq용 프롬프트: 글자수 조건 제거 + 마커 강제 추가
      const groqPrompt = prompt
        .replace(/1단계: 본문을 \d+자 이상 완전히 작성하고 마무리 문장까지 끝낼 것/, `1단계: 본문을 자연스럽게 완성할 것 (글자수 무관, 마무리 문장까지 반드시 끝낼 것)`)
        + `

[관련글시작]
POST1: (연관 주제 블로그 제목 1)|(이 글을 읽으면 좋은 이유 한 줄)
POST2: (연관 주제 블로그 제목 2)|(이유)
POST3: (연관 주제 블로그 제목 3)|(이유)
[관련글끝]

⚠️ 반드시 위의 [FAQ시작]~[FAQ끝], [참고자료시작]~[참고자료끝], [관련글시작]~[관련글끝] 세 섹션을 본문 뒤에 빠짐없이 추가할 것. 글자수와 무관하게 본문이 끝나면 즉시 추가할 것.`;

      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "당신은 한국어 블로그 전문 작가입니다. 본문을 완성한 후 반드시 FAQ, 참고자료, 관련글 섹션을 마커와 함께 추가해야 합니다. 절대 중간에 끊으면 안 됩니다." },
            { role: "user", content: groqPrompt }
          ],
          max_tokens: Math.min(maxTokens, 8000),
          temperature: 0.7,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error?.message || "";
        if (msg.includes("rate_limit")) throw new Error("Groq 분당 요청 한도 초과.");
        throw new Error(`Groq 오류: ${resp.status}`);
      }
      const data = await resp.json();
      const groqText = data.choices?.[0]?.message?.content || "";
      return res.json({ content: removeNonKorean(ensureMarkers(groqText)) });
    }

    return res.status(400).json({ error: "지원하지 않는 AI입니다" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
