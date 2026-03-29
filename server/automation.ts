/**
 * BlogAuto Pro - 자동화 파이프라인
 * collectKeywords → processKeywords → createPost → 반복
 */

import crypto from "crypto";

const NAVER_LICENSE = process.env.NAVER_ACCESS_LICENSE || "";
const NAVER_SECRET = process.env.NAVER_SECRET_KEY || "";
const NAVER_CUSTOMER = process.env.NAVER_CUSTOMER_ID || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const WP_URL = process.env.WP_URL || "";
const WP_USER = process.env.WP_USERNAME || "";
const WP_PASS = process.env.WP_APP_PASSWORD || "";

const KEYWORD_POOL = [
  "맛집","여행","재테크","다이어트","인테리어","강아지","건강","운동",
  "주식","부업","육아","요리","뷰티","패션","커피","제주도","부산",
  "캠핑","등산","요가","자격증","이직","창업","고양이","스킨케어",
];

interface Keyword {
  keyword: string;
  volume: number;
  competition: string;
  cpc: number;
}

// 1. 키워드 수집
async function collectKeywords(seed?: string): Promise<Keyword[]> {
  try {
    const seeds = seed
      ? [seed]
      : [...KEYWORD_POOL].sort(() => Math.random() - 0.5).slice(0, 5);

    const timestamp = Date.now().toString();
    const message = `${timestamp}.GET./keywordstool`;
    const signature = crypto
      .createHmac("sha256", NAVER_SECRET)
      .update(message)
      .digest("base64");

    const url = `https://api.naver.com/keywordstool?hintKeywords=${encodeURIComponent(seeds.join(","))}&showDetail=1`;

    const resp = await fetch(url, {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": NAVER_LICENSE,
        "X-Customer": NAVER_CUSTOMER,
        "X-Signature": signature,
      },
    });

    if (!resp.ok) {
      console.error(`네이버 API 오류: ${resp.status}`);
      return [];
    }

    const data = await resp.json();

    // map of undefined 방지
    const list = Array.isArray(data.keywordList) ? data.keywordList : [];

    return list.map((item: any) => {
      const pc = parseInt(((item.monthlyPcQcCnt || "0") + "").replace(/,/g, "")) || 0;
      const mob = parseInt(((item.monthlyMobileQcCnt || "0") + "").replace(/,/g, "")) || 0;
      return {
        keyword: item.relKeyword || "",
        volume: pc + mob,
        competition: item.compIdx || "중",
        cpc: Math.round((parseFloat(item.avgMonthlyPC || "0") || 0) * 1000),
      };
    }).filter((k: Keyword) => k.keyword !== "");

  } catch (e: any) {
    console.error(`키워드 수집 오류: ${e.message}`);
    return [];
  }
}

// 2. 키워드 필터링 및 정렬
function processKeywords(keywords: Keyword[]): Keyword[] {
  if (!Array.isArray(keywords) || keywords.length === 0) return [];

  return keywords
    .filter(k => k.volume > 1000)
    .filter(k => k.competition !== "높음")
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
}

// 3. 글 생성
async function createPost(keyword: string): Promise<string> {
  try {
    if (!GEMINI_KEY) throw new Error("Gemini API 키가 없습니다");

    const prompt = `"${keyword}" 키워드로 SEO에 최적화된 블로그 글을 한국어로 2000자 이상 작성해줘.
- 마크다운 형식 (##, ###, **강조** 사용)
- 제목, 소제목, 본문, 결론 구조
- 실제 도움이 되는 정보 포함
- 자연스러운 키워드 포함`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!resp.ok) throw new Error(`Gemini API 오류: ${resp.status}`);
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  } catch (e: any) {
    console.error(`글 생성 오류: ${e.message}`);
    return "";
  }
}

// 4. WordPress 발행
async function publishToWordPress(title: string, content: string): Promise<boolean> {
  try {
    if (!WP_URL || !WP_USER || !WP_PASS) {
      console.log("WordPress 설정 없음 - 발행 건너뜀");
      return false;
    }

    const credentials = Buffer.from(`${WP_USER}:${WP_PASS}`).toString("base64");
    const resp = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({ title, content, status: "publish" }),
    });

    if (!resp.ok) throw new Error(`WordPress 발행 오류: ${resp.status}`);
    console.log(`✅ WordPress 발행 완료: ${title}`);
    return true;

  } catch (e: any) {
    console.error(`WordPress 발행 오류: ${e.message}`);
    return false;
  }
}

// 전체 자동화 파이프라인
async function runPipeline(seed?: string): Promise<void> {
  console.log(`\n🚀 파이프라인 시작 ${seed ? `[${seed}]` : "[랜덤]"}`);

  // 1. 수집
  console.log("📡 키워드 수집 중...");
  const raw = await collectKeywords(seed);
  console.log(`   수집: ${raw.length}개`);

  if (raw.length === 0) {
    console.log("   ⚠️ 수집된 키워드 없음");
    return;
  }

  // 2. 처리
  const filtered = processKeywords(raw);
  console.log(`   필터링 후: ${filtered.length}개`);

  if (filtered.length === 0) {
    console.log("   ⚠️ 적합한 키워드 없음 - 필터 조건 완화");
    // 필터 없이 첫 번째 키워드 사용
    filtered.push(raw[0]);
  }

  // 3. 글 생성
  const target = filtered[0];
  console.log(`✍️  글 생성: "${target.keyword}" (검색량: ${target.volume})`);
  const content = await createPost(target.keyword);

  if (!content) {
    console.log("   ⚠️ 글 생성 실패");
    return;
  }
  console.log(`   생성 완료: ${content.length}자`);

  // 4. 발행
  await publishToWordPress(target.keyword, content);

  console.log("✅ 파이프라인 완료\n");
}

// 반복 실행 구조
async function startAutomation(
  intervalMinutes: number = 60,
  maxRuns: number = 0
): Promise<void> {
  console.log(`⚙️  자동화 시작 (${intervalMinutes}분 간격${maxRuns > 0 ? `, 최대 ${maxRuns}회` : ""})`);

  let runCount = 0;

  const execute = async () => {
    runCount++;
    console.log(`\n[실행 ${runCount}회차]`);
    await runPipeline();

    if (maxRuns > 0 && runCount >= maxRuns) {
      console.log("✅ 최대 실행 횟수 도달. 종료.");
      process.exit(0);
    }
  };

  await execute();
  setInterval(execute, intervalMinutes * 60 * 1000);
}

// 실행
const args = process.argv.slice(2);
const mode = args[0] || "once";
const interval = parseInt(args[1] || "60");
const maxRuns = parseInt(args[2] || "0");

if (mode === "loop") {
  startAutomation(interval, maxRuns);
} else {
  runPipeline(args[1]).then(() => process.exit(0));
}
