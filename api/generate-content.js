// BlogAuto Pro - generate-content v3.1
// 한자/외국문자 강제 제거
function removeNonKorean(text) {
  return text
    .replace(/[一-鿿㐀-䶿]/g, "")
    .replace(/[぀-ゟ゠-ヿ]/g, "")
    .replace(/ {2,}/g, " ")
    .trim();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, keyword, title, language = "ko", minChars = 1500, stylePrompt = "", adPlatform = "" } = req.body;
  if (!provider || !apiKey || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락" });
  }

  const langMap = {
    ko: "한국어", en: "English", ja: "日本語", zh: "中文",
    es: "Español", fr: "Français", de: "Deutsch", pt: "Português",
  };
  const langLabel = langMap[language] || "한국어";
  const targetChars = parseInt(minChars) || 1500;

  // max_tokens 글자수에 맞게 조정 (한국어 기준 1자 ≈ 1.5토큰)
  // Gemini Flash 최대 8192, Groq 최대 8000 → 안전하게 8000으로 상한
  const maxTokens = Math.min(8000, Math.max(4000, Math.ceil(targetChars * 2)));

  // 제목 지정 여부에 따라 프롬프트 다르게
  const titleInstruction = title
    ? `글 제목은 반드시 "${title}" 으로 시작해줘.`
    : `글 제목은 키워드 "${keyword}"를 포함한 클릭률 높은 제목으로 만들어줘.`;

  // 수익 플랫폼별 최적화 지침
  const adGuide = adPlatform === "adsense"
    ? "구글 애드센스 CPC 최적화: 클릭 유도 문구, 정보성 키워드 밀도 높게, 광고 친화적 단락 구성"
    : adPlatform === "adpost"
    ? "네이버 애드포스트 CPM 최적화: 체류 시간 늘리는 스토리 구성, 감성적 공감 유도, 이미지 설명 풍부하게"
    : "애드센스/애드포스트 통합 최적화";

  // 스타일 지침
  const styleGuide = stylePrompt
    ? `

[글쓰기 스타일]
${stylePrompt}`
    : "";

  // 키워드 기반 카테고리 감지
  const kw = (keyword + " " + (title || "")).toLowerCase();
  
  let categoryGuide = "";
  
  if (/맛집|음식|카페|식당|요리|레스토랑|빵|디저트|커피|치킨|피자|라면|떡볶이|삼겹살|회|초밥|파스타|브런치|술집|포차|이자카야/.test(kw)) {
    categoryGuide = `[맛집/음식 카테고리 필수 요소]
- 직접 방문한 것처럼: 가게 외관, 내부 분위기, 조명, BGM, 테이블 간격, 직원 친절도
- 메뉴 하나하나 맛 묘사: 첫 한 입 느낌, 식감(바삭함/부드러움/쫄깃함), 간의 세기, 향, 온도
- 가격 정보 필수 (1인 기준, 2인 기준), 웨이팅 시간, 주차 가능 여부
- 사진 찍기 좋은 포인트, 인스타 감성 여부
- "이런 날 가면 딱이에요", "이건 꼭 시켜야 해요" 같은 실질적 조언
- 단점도 솔직하게 (예: 웨이팅이 길다, 주차가 불편하다)
- 재방문 의향과 추천 대상 (데이트, 가족, 친구 모임 등)`;
  } else if (/it|앱|어플|프로그램|소프트웨어|ai|인공지능|테크|스마트폰|노트북|컴퓨터|갤럭시|아이폰|맥북|챗gpt|유튜브|넷플릭스|구독|클라우드|코딩|개발/.test(kw)) {
    categoryGuide = `[IT/테크 카테고리 필수 요소]
- 전문 용어는 반드시 쉽게 풀어서 설명 (예: "RAM이란 쉽게 말하면...")
- 실제로 써본 사람처럼: 설치 과정, 처음 실행했을 때 느낌, 배우는 데 걸린 시간
- 이런 분께 추천: 직장인/학생/주부/어르신 각각 활용법
- 비슷한 제품/서비스와 비교 (예: A vs B, 뭐가 더 나을까?)
- 무료/유료 차이, 가격 대비 가치
- 자주 발생하는 문제와 해결 방법
- 초보자도 따라할 수 있는 단계별 사용법`;
  } else if (/리뷰|후기|사용기|체험|써봤|먹어봤|가봤|해봤|구매|샀|직접/.test(kw)) {
    categoryGuide = `[리뷰/후기 카테고리 필수 요소]
- 구매/사용 전 기대감 → 실제 사용 후 솔직한 평가 구조
- 사용 기간 명시 (예: "한 달 동안 매일 써봤어요")
- 장점 3개 이상, 단점 2개 이상 균형있게
- 수치로 표현 가능한 효과는 반드시 수치로 (예: "2주 만에 3kg 감량")
- 다시 살 의향이 있는지, 주변에 추천할지 솔직하게
- 어디서 샀는지, 현재 가격, 정품 구분법
- "이런 분은 사세요, 이런 분은 사지 마세요" 명확하게`;
  } else if (/여행|관광|호텔|숙소|펜션|리조트|해외|국내|제주|부산|서울|강원|경주|전주|여수|속초/.test(kw)) {
    categoryGuide = `[여행 카테고리 필수 요소]
- 교통편 (대중교통/자차), 소요 시간, 비용
- 숙소 위치 선택 팁, 추천 숙소 유형
- 꼭 가야 할 명소 TOP5와 각각의 특징
- 현지 맛집 추천 (아침/점심/저녁/야식)
- 여행 예산 총정리 (숙박+교통+식비+입장료)
- 시즌별 추천 (봄/여름/가을/겨울)
- 현지인만 아는 숨은 명소, 피해야 할 곳
- 짐 싸기 팁, 주의사항`;
  } else if (/건강|다이어트|운동|헬스|영양|의학|병원|약|증상|치료|피부|탈모|다이어트|식단/.test(kw)) {
    categoryGuide = `[건강/의료 카테고리 필수 요소]
- 전문 의학 용어는 쉬운 말로 반드시 풀이
- 증상과 원인을 구체적으로 (언제, 어떤 상황에서 발생하는지)
- 집에서 할 수 있는 방법 vs 병원 가야 하는 경우 구분
- 잘못 알려진 상식 바로잡기
- 연령대별/성별 다른 접근법
- 실제 경험담 형식으로 공감대 형성
- 주의사항 및 부작용 솔직하게
- 전문의 상담 권고 문구 자연스럽게 포함`;
  } else if (/대학생|취준|취업|알바|아르바이트|인턴|스펙|자소서|면접|학점|공부|시험|수능|고등학생|중학생/.test(kw)) {
    categoryGuide = `[학생/취준 카테고리 필수 요소]
- 또래 친구에게 말하듯 편한 말투
- 실제 경험 기반: "저도 그때 엄청 고민했는데요"
- 구체적인 수치와 방법 (예: "하루 3시간, 3개월 만에")
- 돈 아끼는 꿀팁, 무료로 할 수 있는 방법
- 선배가 후배에게 알려주는 느낌
- 흔히 하는 실수와 극복법
- 멘탈 관리, 슬럼프 극복 공감 포함
- 현실적인 조언 (너무 이상적이지 않게)`;
  } else if (/육아|아이|아기|엄마|맘|임신|출산|유아|어린이|초등|교육|장난감|분유|기저귀/.test(kw)) {
    categoryGuide = `[육아/맘 카테고리 필수 요소]
- 같은 엄마/아빠 입장에서 공감하는 말투
- 월령별/나이별 구체적인 정보
- 안전성 최우선 (성분, 인증 마크, 주의사항)
- 가격 비교와 실속 있는 선택법
- 아이 반응과 실제 효과 솔직하게
- 수면/식사/놀이 각각의 팁
- 지치는 부모를 위한 공감과 위로 포함
- 소아과 의사 또는 전문가 의견 언급`;
  } else if (/재테크|투자|주식|부동산|코인|적금|보험|카드|할인|절약|돈|경제|금융|ETF|펀드/.test(kw)) {
    categoryGuide = `[재테크/금융 카테고리 필수 요소]
- 초보자도 이해하는 쉬운 설명 (금융 용어 반드시 풀이)
- 실제 숫자 예시 (예: "월 30만원 투자 시 10년 후")
- 리스크와 수익률 균형있게 설명
- 연령대별 다른 전략 (20대/30대/40대/50대)
- 지금 당장 할 수 있는 것부터 단계별 안내
- 흔한 실수와 주의사항 강조
- 실제 경험담 (성공+실패 모두)
- 투자는 본인 책임 안내 자연스럽게 포함`;
  } else if (/패션|옷|코디|스타일|뷰티|화장|메이크업|스킨케어|향수|가방|신발|악세사리/.test(kw)) {
    categoryGuide = `[패션/뷰티 카테고리 필수 요소]
- 체형별/피부타입별 다른 추천
- 실제 착용/사용 후기 (색상, 사이즈 선택 기준)
- 계절별/TPO별 활용법
- 저가 vs 고가 선택 기준
- 관리 방법과 보관 팁
- 지속력/내구성 솔직한 평가
- 어디서 살 수 있는지, 가격 정보
- "이런 분께 추천" 명확하게`;
  } else {
    categoryGuide = `[정보성/일상 카테고리 필수 요소]
- 독자가 몰랐던 새로운 정보 반드시 포함
- 일상에서 바로 써먹을 수 있는 실용적 팁
- 연령/상황별 다양한 활용법
- 전문가처럼 신뢰감 있되 친근한 말투
- 구체적 사례와 수치로 설득력 강화
- 독자 공감 포인트 중간중간 삽입`;
  }

  const prompt = \`당신은 대한민국 최고의 블로그 작가입니다. 수백만 독자를 보유한 파워블로거로서 친구에게 카톡 보내듯, 엄마가 딸한테 알려주듯, 기자가 르포 기사 쓰듯 — 상황에 맞게 가장 자연스럽고 생생한 글을 씁니다.

키워드: "\${keyword}"
\${titleInstruction}
언어: \${langLabel}
목표 글자수: \${targetChars}자 이상
수익 최적화: \${adGuide}

\${categoryGuide}

[모든 카테고리 공통 필수 원칙]
① 절대 AI 티 나지 않게
   - "저도 처음엔 몰랐는데요", "솔직히 말하면", "이거 진짜 써보니까", "주변 지인한테 물어봤더니"
   - 독자에게 직접 말 걸기: "혹시 이런 거 고민해보셨나요?", "아마 많이들 궁금하셨을 텐데"
   - 감탄/공감: "이게 진짜 신기한 게요", "저도 처음에 이거 보고 깜짝 놀랐어요"
   - 문장 끝을 다양하게: "~해요", "~거든요", "~더라고요", "~잖아요", "~더라구요"
   
② 독자층별 맞춤 언어
   - 20대: 친구한테 말하듯 편하게, 줄임말 적절히
   - 30~40대: 공감과 실용 정보 균형, 경험 공유
   - 50대 이상: 존댓말 기반, 천천히 설명, 따뜻하게
   
③ 구체적 정보 (막연한 표현 절대 금지)
   - "맛있어요" → "첫 한 입에 고소함이 확 퍼지면서 적당히 짭조름한 게 딱 제 취향이었어요"
   - "좋아요" → "3주 써보니까 아침에 일어날 때 확실히 달라진 게 느껴졌어요"
   - 실제 가격, 수치, 날짜, 기간 반드시 포함

④ 완성도 높은 구조
   - 도입: 독자 공감/흥미 유발 (질문 또는 공감 문장으로 시작)
   - 본론: 핵심 정보를 구체적 사례와 함께
   - 마무리: 독자 행동 유도 (댓글, 공유, 저장)

[형식 규칙 - 반드시 준수]
- 반드시 \${targetChars}자 이상 작성 (이게 제일 중요!)
- 마크다운 기호 절대 금지 (**, ##, --, __, - 등)
- 순수 텍스트만 사용
- 자연스러운 단락 구분 (2~4문장마다 줄바꿈)
- SEO: 키워드 자연스럽게 7회 이상 포함
- 절대 한자, 중국어, 일본어, 베트남어 등 외국 문자 사용 금지
- 오직 한글, 영어, 숫자만 사용\${styleGuide}\`;

  try {

    // ── Gemini ────────────────────────────────────────────
    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        if (status === 429 || msg.includes("quota") || msg.includes("rate") || msg.includes("limit") || msg.includes("exhausted") || msg.includes("resource_exhausted")) {
          throw new Error("Gemini 무료 요청 한도 초과 (분당 또는 일일 한도). 1분 후 다시 시도하거나 Groq(무료)로 전환해보세요.");
        }
        if (msg.includes("api key") || msg.includes("api_key") || status === 400) throw new Error("Gemini API 키가 잘못되었습니다. 설정에서 확인해주세요.");
        if (status === 403) throw new Error("Gemini API 키 권한 없음. Google AI Studio에서 키를 확인해주세요.");
        throw new Error(`Gemini 오류 (${status}): ${err.error?.message || "알 수 없는 오류"}`);
      }
      const data = await resp.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!content) throw new Error("Gemini 응답이 비어있습니다. 잠시 후 다시 시도해주세요.");
      return res.json({ content: removeNonKorean(content) });
    }

    // ── Claude ────────────────────────────────────────────
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
        if (msg.includes("credit") || msg.includes("balance")) throw new Error("Claude 크레딧 부족. console.anthropic.com에서 충전해주세요.");
        if (msg.includes("api_key")) throw new Error("Claude API 키가 잘못되었습니다. 설정에서 확인해주세요.");
        throw new Error(`Claude 오류: ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({ content: data.content?.[0]?.text || "" });
    }

    // ── OpenAI ────────────────────────────────────────────
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
        if (msg.includes("quota") || msg.includes("billing")) throw new Error("OpenAI 크레딧 부족. platform.openai.com에서 충전해주세요.");
        throw new Error(`OpenAI 오류: ${resp.status}`);
      }
      const data = await resp.json();
      return res.json({ content: data.choices?.[0]?.message?.content || "" });
    }

    // ── Groq (완전 무료) ──────────────────────────────────
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
          max_tokens: Math.min(maxTokens, 8000), // Groq 최대 8000
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
      return res.json({ content: data.choices?.[0]?.message?.content || "" });
    }

    return res.status(400).json({ error: "지원하지 않는 AI입니다" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
