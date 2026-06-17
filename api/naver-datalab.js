// BlogAuto Pro - naver-datalab v1.1
// 네이버 데이터랩 검색어 트렌드 API
// 디바이스(PC/모바일), 성별(남/녀), 연령대별 분석
// v1.1: 병렬 10요청 → 순차 처리로 Rate Limit 오류 수정

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch {} }

  const { clientId, clientSecret, keyword, startDate, endDate, timeUnit = "month" } = body || {};
  const safeClientId = String(clientId || "").trim();
  const safeClientSecret = String(clientSecret || "").trim();
  const safeKeyword = String(keyword || "").trim();

  if (!safeClientId || !safeClientSecret || !safeKeyword) {
    return res.status(400).json({ error: "clientId, clientSecret, keyword 필요" });
  }

  const end = endDate || new Date().toISOString().slice(0, 10);
  const start = startDate || (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  })();

  const keywordGroups = [{ groupName: safeKeyword, keywords: [safeKeyword] }];
  const headers = {
    "Content-Type": "application/json",
    "X-Naver-Client-Id": safeClientId,
    "X-Naver-Client-Secret": safeClientSecret,
  };

  // 네이버 API rate limit 우회: 요청 사이 딜레이
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function fetchTrend(device, gender, ages) {
    const bodyObj = {
      startDate: start,
      endDate: end,
      timeUnit,
      keywordGroups,
    };
    if (device) bodyObj.device = device;
    if (gender) bodyObj.gender = gender;
    if (ages && ages.length) bodyObj.ages = ages;

    const resp = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers,
      body: JSON.stringify(bodyObj),
    });
    if (!resp.ok) {
      const text = await resp.text();
      const status = resp.status;
      if (status === 429) throw new Error("네이버 데이터랩 API 요청 한도 초과. 잠시 후 다시 시도해주세요.");
      if (status === 401) throw new Error("네이버 Client ID 또는 Secret이 잘못되었습니다. 설정을 확인해주세요.");
      throw new Error(`데이터랩 API 오류 (${status}): ${text.slice(0, 100)}`);
    }
    const data = await resp.json();
    return data.results?.[0]?.data || [];
  }

  try {
    // 순차 처리 + 딜레이로 Rate Limit 우회
    const overall  = await fetchTrend(null, null, null);   await sleep(200);
    const pc       = await fetchTrend("pc", null, null);   await sleep(200);
    const mobile   = await fetchTrend("mo", null, null);   await sleep(200);
    const male     = await fetchTrend(null, "m", null);    await sleep(200);
    const female   = await fetchTrend(null, "f", null);    await sleep(200);
    const age10    = await fetchTrend(null, null, ["2"]);   await sleep(200);
    const age20    = await fetchTrend(null, null, ["3"]);   await sleep(200);
    const age30    = await fetchTrend(null, null, ["4"]);   await sleep(200);
    const age40    = await fetchTrend(null, null, ["5"]);   await sleep(200);
    const age50    = await fetchTrend(null, null, ["6"]);

    // 최신 데이터 기준 비율 계산
    const latestPC = pc[pc.length - 1]?.ratio || 0;
    const latestMobile = mobile[mobile.length - 1]?.ratio || 0;
    const totalDevice = latestPC + latestMobile || 1;

    const latestMale = male[male.length - 1]?.ratio || 0;
    const latestFemale = female[female.length - 1]?.ratio || 0;
    const totalGender = latestMale + latestFemale || 1;

    const ageRatios = [
      age10[age10.length - 1]?.ratio || 0,
      age20[age20.length - 1]?.ratio || 0,
      age30[age30.length - 1]?.ratio || 0,
      age40[age40.length - 1]?.ratio || 0,
      age50[age50.length - 1]?.ratio || 0,
    ];
    const totalAge = ageRatios.reduce((a, b) => a + b, 0) || 1;

    return res.json({
      ok: true,
      keyword: safeKeyword,
      period: { start, end },
      trend: overall,
      device: {
        pc: Math.round((latestPC / totalDevice) * 100),
        mobile: Math.round((latestMobile / totalDevice) * 100),
        trend: { pc, mobile },
      },
      gender: {
        male: Math.round((latestMale / totalGender) * 100),
        female: Math.round((latestFemale / totalGender) * 100),
        trend: { male, female },
      },
      ages: {
        "10대": Math.round((ageRatios[0] / totalAge) * 100),
        "20대": Math.round((ageRatios[1] / totalAge) * 100),
        "30대": Math.round((ageRatios[2] / totalAge) * 100),
        "40대": Math.round((ageRatios[3] / totalAge) * 100),
        "50대+": Math.round((ageRatios[4] / totalAge) * 100),
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
//fix
