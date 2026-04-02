// BlogAuto Pro - generate-titles v1.0
// Gemini CORS 우회용 제목 생성 API
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, keyword } = req.body;
  if (!provider || !apiKey || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락 (provider, apiKey, keyword)" });
  }

  const prompt = `당신은 대한민국 최고의 SEO 전문가이자 블로그 제목 작성 전문가입니다.
"${keyword}" 키워드로 아래 조건을 모두 충족하는 블로그 제목 10개를 만들어주세요.

[핵심 목표]
1. 경쟁이 낮은 롱테일 키워드 활용 (메인 키워드 + 수식어 조합)
2. 클릭률(CTR) 극대화 - 독자가 누르지 않을 수 없는 제목
3. 검색 의도 정확히 반영 (정보 탐색형/구매 의도형/비교형)

[제목 패턴 10가지 반드시 다양하게]
1. 숫자+연도형: "2026년 ${keyword} BEST 7가지 완벽 정리"
2. 경험 후기형: "직접 써봤더니 달라진 ${keyword} 진짜 솔직 후기"
3. 문제 해결형: "${keyword} 때문에 고민이라면 이것만 보세요"
4. 비교 분석형: "${keyword} vs 다른 것, 뭐가 진짜 나을까?"
5. 충격/반전형: "아무도 알려주지 않는 ${keyword}의 숨겨진 진실"
6. 초보자형: "${keyword} 처음이라면? 이것부터 시작하세요"
7. 전문가형: "전문가가 추천하는 ${keyword} 제대로 활용하는 법"
8. 실용 팁형: "${keyword} 잘 모르면 손해, 꼭 알아야 할 핵심 5가지"
9. 감성/공감형: "저도 처음엔 몰랐던 ${keyword}, 이제는 자신 있어요"
10. 질문형: "${keyword} 진짜 효과 있을까? 3개월 직접 해봤습니다"

[필수 규칙]
- 제목에 자연스럽게 키워드 포함
- 30자 이내로 간결하게
- 한글, 영어, 숫자만 사용 (한자, 중국어, 일본어 등 외국 문자 절대 금지)
- 클릭베이트 금지 (실제 내용과 일치해야 함)
- 반드시 JSON 배열로만 응답 (다른 텍스트 없이): ["제목1", "제목2", ...]
- 절대 한자, 중국어, 일본어, 베트남어 등 외국 문자 사용 금지
- 오직 한글, 영어, 숫자만 사용`;

  function extractTitles(text) {
    if (!text) return [];
    try {
      const clean = text.replace(/```json|```/gi, "").trim();
      // 1. JSON 배열 파싱 시도
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(t => typeof t === "string" && t.length > 3).slice(0, 10);
        }
      }
      // 2. JSON 직접 파싱
      try {
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(t => typeof t === "string" && t.length > 3).slice(0, 10);
        }
      } catch {}
      // 3. 줄바꿈 기반 파싱
      const lines = clean.split("\n")
        .map(l => l.replace(/^[\d]+[\).\s]+|^[-*•\s]+/, "").replace(/^[\s"'""'']+|[\s"'""'']+$/g, "").trim())
        .filter(l => l.length > 5 && l.length < 120 && !l.startsWith("{") && !l.startsWith("["));
      if (lines.length >= 2) return lines.slice(0, 10);
      // 4. 쌍따옴표로 감싼 제목 추출
      const quoted = [...clean.matchAll(/"([^"]{5,100})"/g)].map(m => m[1]);
      if (quoted.length >= 2) return quoted.slice(0, 10);
    } catch {}
    return [];
  }

  try {
    // ── Gemini ──────────────────────────────────────────────
    if (provider === "gemini") {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 1000,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = (err.error?.message || "").toLowerCase();
        const status = resp.status;
        if (status === 429 || msg.includes("quota") || msg.includes("rate") || msg.includes("exhausted")) {
          throw new Error("Gemini 요청 한도 초과. 잠시 후 다시 시도하거나 Groq으로 전환해보세요.");
        }
        if (msg.includes("api key") || status === 400) throw new Error("Gemini API 키가 잘못되었습니다.");
        if (status === 403) throw new Error("Gemini API 키 권한 없음.");
        throw new Error(`Gemini 오류 (${status}): ${err.error?.message || "알 수 없는 오류"}`);
      }
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const titles = extractTitles(text);
      if (titles.length === 0) {
        // 파싱 실패 시 텍스트를 줄 단위로 강제 분리
        const fallbackTitles = text.split("\n")
          .map(l => l.replace(/^[\d\s\-\*\.\)]+/, "").replace(/^["']|["']$/g, "").trim())
          .filter(l => l.length > 5 && l.length < 120);
        if (fallbackTitles.length > 0) return res.json({ titles: fallbackTitles.slice(0, 10) });
        throw new Error("Gemini 제목 생성 실패. 다시 시도해주세요.");
      }
      return res.json({ titles });
    }

    // ── OpenAI ──────────────────────────────────────────────
    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`OpenAI 오류 (${resp.status}): ${err.error?.message || ""}`);
      }
      const data = await resp.json();
      const titles = extractTitles(data.choices?.[0]?.message?.content || "[]");
      if (titles.length === 0) throw new Error("OpenAI 제목 생성 실패.");
      return res.json({ titles });
    }

    // ── Groq ────────────────────────────────────────────────
    if (provider === "groq") {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.8,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`Groq 오류 (${resp.status}): ${err.error?.message || ""}`);
      }
      const data = await resp.json();
      const titles = extractTitles(data.choices?.[0]?.message?.content || "[]");
      if (titles.length === 0) throw new Error("Groq 제목 생성 실패.");
      return res.json({ titles });
    }

    // ── Claude ──────────────────────────────────────────────
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
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(`Claude 오류 (${resp.status}): ${err.error?.message || ""}`);
      }
      const data = await resp.json();
      const titles = extractTitles(data.content?.[0]?.text || "[]");
      if (titles.length === 0) throw new Error("Claude 제목 생성 실패.");
      return res.json({ titles });
    }

    return res.status(400).json({ error: "지원하지 않는 AI입니다" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
