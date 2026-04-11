// BlogAuto Pro - generate-content v5.1
// 플레인 텍스트 출력 (## 소제목 허용) + FAQ/참고자료 마커 유지

// Groq가 마커 없이 날것 텍스트로 쓸 때 자동으로 마커 씌우기
function ensureMarkers(text) {
  // 이미 마커가 있으면 그대로 반환
  if (text.includes("[FAQ시작]") && text.includes("[참고자료시작]")) return text;

  // Q1:/A1: 패턴 → [FAQ시작]~[FAQ끝]
  if (!text.includes("[FAQ시작]") && /Q1\s*:/i.test(text)) {
    text = text.replace(
      /(Q1\s*:[\s\S]*?)(?=\nLINK1\s*:|\nPOST1\s*:|$)/i,
      "[FAQ시작]\n$1\n[FAQ끝]"
    );
  }

  // LINK1: 패턴 → [참고자료시작]~[참고자료끝] (URL 메인 도메인만 남기기)
  if (!text.includes("[참고자료시작]") && /LINK1\s*:/i.test(text)) {
    text = text.replace(
      /(LINK1\s*:[\s\S]*?)(?=\nPOST1\s*:|\n\[|$)/i,
      (match) => {
        const cleaned = match.split("\n").map(line => {
          // URL 경로 제거하고 메인 도메인만 남기기
          return line.replace(/(https?:\/\/[^/|\s]+)\/[^|\s]*/gi, "$1");
        }).join("\n");
        return "[참고자료시작]\n" + cleaned + "\n[참고자료끝]";
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
    stylePrompt = "", adPlatform = ""
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
  let categoryGuide = "";
  if (/맛집|음식|카페|식당|요리|레스토랑|빵|디저트|커피|치킨|피자/.test(kw)) {
    categoryGuide = `[맛집/음식] 가게 분위기, 메뉴 맛 상세 묘사, 가격/웨이팅, 인스타 포인트, 솔직한 단점, 재방문 의향`;
  } else if (/it|앱|어플|프로그램|소프트웨어|ai|인공지능|테크|스마트폰|노트북|챗gpt|유튜브|넷플릭스/.test(kw)) {
    categoryGuide = `[IT/테크] 전문용어 쉽게 풀이, 실제 사용 후기, 비교 정보, 무료/유료 차이, 초보자 단계별 가이드`;
  } else if (/리뷰|후기|사용기|체험|써봤|먹어봤|가봤|구매|샀|직접/.test(kw)) {
    categoryGuide = `[리뷰] 사용 전 기대 vs 실제 평가, 사용 기간, 장단점 균형, 수치로 표현, 다시 살 의향`;
  } else if (/여행|관광|호텔|숙소|펜션|리조트|해외|국내|제주|부산|서울|강원/.test(kw)) {
    categoryGuide = `[여행] 교통+비용, 명소, 현지 맛집, 예산 총정리, 시즌별 추천, 숨은 명소`;
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
① AI 티 절대 금지: "저도 처음엔", "솔직히 말하면", "이거 진짜 써보니까" 같은 자연스러운 표현 사용
② 구체적 정보: 실제 가격, 수치, 날짜, 기간 반드시 포함
③ 소제목 구조: 본문을 4~6개 소제목으로 나눠서 작성. 각 소제목은 반드시 ## 소제목 형식으로 작성
④ 각 소제목 아래 단락은 3~5문장으로 균등하게
⑤ SEO: 키워드 7회 이상 자연스럽게 포함
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
[참고자료끝]`;

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
