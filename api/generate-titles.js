// BlogAuto Pro - generate-titles v3.0
function cleanTitles(titles) {
  return titles
    .map(t => String(t || "")
      .replace(/[一-鿿㐀-䶿]/g, "")
      .replace(/[぀-ゟ゠-ヿ]/g, "")
      .replace(/[^가-힣a-zA-Z0-9\s.,!?;:()\-'"\[\]%@#&+=/\\~`|<>{}^_$]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim())
    .filter(t => t.length > 3);
}

function extractTitles(text) {
  if (!text) return [];
  const clean = String(text).replace(/```json|```/gi, "").trim();
  try {
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return cleanTitles(parsed);
    }
  } catch {}
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return cleanTitles(parsed);
  } catch {}
  const lines = clean.split("\n")
    .map(l => l.replace(/^[\d]+[\).\s]+|^[-*•\s]+/, "").replace(/^[\s"'「」『』]+|[\s"'「」『』]+$/g, "").trim())
    .filter(l => l.length > 4 && l.length < 120 && !l.startsWith("{") && !l.startsWith("["));
  if (lines.length) return cleanTitles(lines);
  const quoted = [...clean.matchAll(/"([^"]{4,100})"/g)].map(m => m[1]);
  return cleanTitles(quoted);
}

function fillToTen(keyword, titles) {
  const uniq = Array.from(new Set(cleanTitles(titles)));
  const templates = [
    `2026년 ${keyword} BEST 7가지 정리`,
    `${keyword} 처음이라면 이것부터`,
    `${keyword} 솔직 후기와 핵심 정리`,
    `${keyword} 제대로 고르는 방법`,
    `${keyword} 잘 모르면 손해인 팁`,
    `${keyword} 진짜 효과 있을까`,
    `${keyword} 추천 이유 총정리`,
    `${keyword} 비교 포인트 한눈에`,
    `${keyword} 초보자 가이드`,
    `${keyword} 실전 활용법 정리`,
  ];
  for (const t of templates) {
    if (uniq.length >= 10) break;
    if (!uniq.includes(t)) uniq.push(t);
  }
  return uniq.slice(0, 10);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, keyword, mode, prompt: customPrompt } = req.body || {};
  if (!provider || !apiKey || !keyword) {
    return res.status(400).json({ error: "필수 파라미터 누락 (provider, apiKey, keyword)" });
  }

  // mode: "keywords" + customPrompt → AI 키워드 추천 모드
  const isKeywordMode = mode === "keywords" && !!customPrompt;

  const prompt = isKeywordMode ? customPrompt : `당신은 대한민국 최고의 SEO 블로그 제목 전문가입니다.
키워드: "${keyword}"

반드시 제목 10개를 만들어야 합니다.
반드시 JSON 배열 하나만 반환하세요.
반드시 10개 모두 서로 다른 제목이어야 합니다.
반드시 각 제목에 "${keyword}"를 자연스럽게 포함하세요.
각 제목은 30자 안팎으로 짧고 클릭률 높게 만드세요.

출력 예시:
["제목1","제목2","제목3","제목4","제목5","제목6","제목7","제목8","제목9","제목10"]`;

  try {
    if (provider === "gemini") {
      const models = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
      ];
      let lastErr = "알 수 없는 오류";
      for (const model of models) {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 1200,
              responseMimeType: "application/json",
            },
          }),
        });
        const payload = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          const msg = payload?.error?.message || "";
          if (resp.status === 401 || resp.status === 403 || /api[_ ]?key|permission/i.test(msg)) {
            throw new Error("Gemini API 키가 잘못되었거나 권한이 없습니다.");
          }
          lastErr = `${model} 오류(${resp.status})`;
          continue;
        }
        const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (isKeywordMode) {
          // 키워드 모드: 원본 JSON 파싱 후 반환
          const parsed = extractTitles(text);
          return res.json({ titles: parsed });
        }
        const titles = fillToTen(keyword, extractTitles(text));
        if (titles.length >= 10) return res.json({ titles });
        lastErr = `${model} 응답 파싱 실패`;
      }
      throw new Error(`Gemini 제목 생성 실패: ${lastErr}`);
    }

    if (provider === "groq") {
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
          max_tokens: 1200,
        }),
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(`Groq 오류 (${resp.status}): ${payload?.error?.message || ""}`);
      const groqText = payload?.choices?.[0]?.message?.content || "";
      if (isKeywordMode) return res.json({ titles: extractTitles(groqText) });
      return res.json({ titles: fillToTen(keyword, extractTitles(groqText)) });
    }

    if (provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
          max_tokens: 1200,
        }),
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(`OpenAI 오류 (${resp.status}): ${payload?.error?.message || ""}`);
      const openaiText = payload?.choices?.[0]?.message?.content || "";
      if (isKeywordMode) return res.json({ titles: extractTitles(openaiText) });
      return res.json({ titles: fillToTen(keyword, extractTitles(openaiText)) });
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
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(`Claude 오류 (${resp.status}): ${payload?.error?.message || ""}`);
      const claudeText = payload?.content?.[0]?.text || "";
      if (isKeywordMode) return res.json({ titles: extractTitles(claudeText) });
      return res.json({ titles: fillToTen(keyword, extractTitles(claudeText)) });
    }

    return res.status(400).json({ error: "지원하지 않는 AI입니다" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
//fix
