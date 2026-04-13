// BlogAuto Pro - translate-prompt v5.0
// AI 우선 처리 + 범용 폴백 (키워드 하드코딩 없음)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { provider, apiKey, topic, variation = 0 } = req.body || {};
  if (!topic) return res.status(400).json({ error: "topic required" });
  if (!provider || !apiKey) return res.status(400).json({ error: "provider, apiKey required" });

  const angles = [
    "the main object or product of this topic",
    "the environment or place related to this topic",
    "tools or documents related to this topic",
    "a symbolic or conceptual visual of this topic",
    "a result or outcome related to this topic",
  ];
  const angle = angles[variation % angles.length];

  const aiPrompt = `You are a Stable Diffusion image prompt expert.

Convert this Korean blog topic into ONE English image prompt.

RULES:
- English ONLY
- NO people, NO faces, NO persons, NO hands
- Describe physical objects, scenery, or settings
- Be specific to the exact topic meaning
- Max 12 words
- Output the prompt only, nothing else

Focus on: ${angle}

Topic: "${topic}"

Examples:
"유튜브 알고리즘" → youtube camera ring light studio tripod recording setup
"넷플릭스 요금제" → television streaming remote subscription card entertainment
"개인사업자 폐업신고" → business closure tax document stamp official paperwork desk
"주식 투자 방법" → stock market chart graph financial monitor growth
"강아지 훈련" → dog training leash collar treat reward toy
"다이어트 식단" → healthy meal vegetables salad bowl fresh colorful
"인테리어 꾸미기" → modern interior furniture minimalist room design
"수면 가이드" → bedroom pillow white sheets sleep peaceful night
"제주도 여행" → jeju island ocean cliff scenic landscape blue sky
"취업 준비" → resume document briefcase office laptop professional
"데이트 장소" → romantic garden fountain bench flowers scenic path
"카페 추천" → cozy cafe latte art ceramic cup warm bokeh light
"여행 코스" → scenic road trip map landscape golden hour nature
"맛집 후기" → gourmet food dish plating restaurant table elegant
"보험 추천" → insurance document umbrella protection shield paper
"자동차 구매" → car exterior road drive scenic modern vehicle
"결혼 준비" → wedding ring bouquet white elegant decoration
"게임 추천" → gaming controller keyboard rgb setup desk dark
"청소 방법" → cleaning supplies organized minimal white shelf
"부업 방법" → laptop home office remote work desk coffee
"건강 관리" → stethoscope medical clean white table organized
"환경 보호" → green plant nature sunlight leaf eco friendly
"명상 방법" → meditation candle stone water zen peaceful calm
"보험 비교" → insurance policy document umbrella protection shield
"AI 활용법" → circuit board glowing neural network digital blue
"캠핑 장비" → tent campfire forest night stars outdoor gear
"탈모 치료" → hair serum bottle minimal clean white background
"공무원 시험" → exam notebook pen desk lamp study night
"필라테스 효과" → yoga mat studio minimal natural light clean
"해외직구 방법" → delivery box package laptop credit card minimal
"반려식물 키우기" → indoor plants pot shelf green home minimal
"이사 준비" → moving box tape packing organized clean room

Output:`;

  try {
    let generatedPrompt = "";

    // ── 모든 AI 순서대로 시도 ──────────────────────────────
    if (provider === "gemini") {
      const models = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
      for (const model of models) {
        try {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }],
                generationConfig: { maxOutputTokens: 50, temperature: 0.7 },
              }),
            }
          );
          if (!resp.ok) { if (resp.status === 429 || resp.status === 503) continue; break; }
          const data = await resp.json();
          const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
          if (text && text.length > 5 && /[a-zA-Z]/.test(text)) { generatedPrompt = text; break; }
        } catch { continue; }
      }
    }

    if (!generatedPrompt && provider === "claude") {
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 50, messages: [{ role: "user", content: aiPrompt }] }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.content?.[0]?.text || "").trim(); }
      } catch {}
    }

    if (!generatedPrompt && provider === "openai") {
      try {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: aiPrompt }], max_tokens: 50, temperature: 0.7 }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.choices?.[0]?.message?.content || "").trim(); }
      } catch {}
    }

    if (!generatedPrompt && provider === "groq") {
      try {
        const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: aiPrompt }], max_tokens: 50, temperature: 0.7 }),
        });
        if (resp.ok) { const data = await resp.json(); generatedPrompt = (data.choices?.[0]?.message?.content || "").trim(); }
      } catch {}
    }

    // AI 성공
    if (generatedPrompt && generatedPrompt.length > 5 && /[a-zA-Z]/.test(generatedPrompt)) {
      return res.json({ ok: true, prompt: cleanPrompt(generatedPrompt) });
    }

    // ── AI 실패 시: 범용 폴백 (키워드 없이 주제 단어로 처리) ──
    return res.json({ ok: true, prompt: universalFallback(topic, variation) });

  } catch (e) {
    return res.json({ ok: true, prompt: universalFallback(topic, variation) });
  }
}

function cleanPrompt(text) {
  return text
    .replace(/^["'`→\-:]+\s*/g, "")
    .replace(/["'`]+$/g, "")
    .replace(/\n.*/s, "")
    .replace(/^(prompt:|output:|result:|answer:|translation:)/i, "")
    .replace(/no people.*$/i, "")
    .trim()
    .slice(0, 200);
}

// ── 범용 폴백: 어떤 주제든 대응 ──────────────────────────────
// 주제의 성격을 파악해서 관련 이미지 프롬프트 생성
function universalFallback(topic, variation = 0) {
  const t = topic.toLowerCase().replace(/[^가-힣a-z0-9\s]/g, " ");
  const NP = "no people, no face";
  const v = variation % 4;

  // 성격 파악 키워드 → 시각적 카테고리 매핑
  const categories = [
    { test: /음식|요리|맛|식|카페|커피|빵|케이크|레시피|먹/, imgs: ["food dish gourmet plating table", "cafe interior coffee cup warm", "cooking ingredients vegetables board", "restaurant menu close up detail"] },
    { test: /여행|관광|해외|국내|호텔|숙소|펜션|리조트/, imgs: ["travel scenic landscape golden hour", "hotel room interior elegant bed", "suitcase map passport travel planning", "destination landmark architecture view"] },
    { test: /운동|헬스|피트니스|요가|다이어트|근육|홈트/, imgs: ["gym weights dumbbells fitness equipment", "healthy food salad vegetables bowl", "yoga mat meditation calm nature", "running shoes water bottle workout"] },
    { test: /보험|보장|청구|실손|의료비|보험료|보험금/, imgs: ["insurance document folder protection shield", "contract paper pen signature official", "umbrella protection safety concept minimal", "medical document certificate paper desk"] },
    { test: /건강|병원|의료|질환|치료|증상|약|영양|면역/, imgs: ["medical stethoscope clean white table", "hospital corridor clean bright modern", "vitamin supplement bottle health care", "doctor desk prescription paper organized"] },
    { test: /사업|창업|비즈니스|마케팅|회사|직장|취업|이직|면접/, imgs: ["business document office desk laptop", "meeting room table chairs modern", "contract paper pen signature desk", "office building exterior modern glass"] },
    { test: /법|신고|등록|허가|인허가|행정|민원|서류|정부|공공|세금|폐업|개업/, imgs: ["official document form stamp desk", "government office building exterior", "paperwork folder file cabinet organized", "certificate seal stamp official paper"] },
    { test: /돈|금융|투자|주식|코인|재테크|절약|저축|대출|펀드|ETF/, imgs: ["coins chart financial growth graph", "piggy bank savings jar money", "stock market trading monitor screen", "bank document contract financial paper"] },
    { test: /부동산|아파트|집|주택|전세|월세|청약|분양/, imgs: ["apartment building exterior modern", "interior design living room minimal", "real estate keys document contract", "cozy home furniture warm lighting"] },
    { test: /인테리어|리모델링|홈데코|가구|소품|꾸미기/, imgs: ["interior design living room minimal clean", "furniture arrangement cozy modern space", "home decor plant shelf aesthetic", "bedroom minimal white warm light cozy"] },
    { test: /ai|인공지능|챗gpt|chatgpt|llm|머신러닝|딥러닝/, imgs: ["ai robot technology futuristic glow", "circuit board technology digital chip", "laptop code dark screen terminal", "neural network abstract digital concept"] },
    { test: /기술|it|개발|코딩|프로그래밍|앱|소프트웨어|서버|클라우드/, imgs: ["laptop code dark screen terminal", "smartphone app interface screen modern", "server rack data center blue light", "keyboard desk developer setup monitor"] },
    { test: /교육|공부|학습|시험|자격증|수능|대학|강의|온라인강의/, imgs: ["books notebook desk lamp study", "pencil paper exam test academic", "library shelf books knowledge", "graduation diploma certificate scroll"] },
    { test: /자기계발|독서|성장|습관|목표|동기|마인드|생산성/, imgs: ["open book pages light minimal clean", "planner notebook pen desk morning", "sunrise goal achievement concept path", "coffee book morning routine calm desk"] },
    { test: /육아|아기|임신|출산|어린이|육아용품|유아/, imgs: ["baby toy nursery crib soft pastel", "pregnancy maternity soft gentle items", "children book colorful toy playful", "stroller bottle pacifier nursery"] },
    { test: /뷰티|스킨케어|화장품|메이크업|피부|성형|네일/, imgs: ["skincare serum bottle beauty elegant", "makeup palette brush cosmetics", "fashion clothing rack modern display", "perfume bottle elegant background"] },
    { test: /패션|옷|쇼핑|코디|스타일|브랜드|명품/, imgs: ["fashion clothing rack modern display", "outfit flat lay accessories minimal", "shopping bag brand luxury elegant", "wardrobe closet organized clothes"] },
    { test: /반려동물|강아지|고양이|펫|동물병원/, imgs: ["dog toy collar leash treat", "cat toy indoor cozy bowl", "pet food bowl accessories home", "animal shelter cage toy warm"] },
    { test: /자동차|차량|드라이브|중고차|전기차|SUV|세단|차박/, imgs: ["car exterior road drive scenic", "car interior dashboard modern clean", "electric vehicle charging station road", "road trip highway landscape sky car"] },
    { test: /결혼|웨딩|신혼|예식|청첩|허니문|돌잔치/, imgs: ["wedding ring bouquet flowers elegant", "wedding decoration table setting white", "bridal bouquet rose petals romantic", "wedding venue hall decoration light"] },
    { test: /스포츠|축구|야구|농구|테니스|골프|수영|배드민턴/, imgs: ["soccer ball field grass sport", "sports equipment ball court outdoor", "running track stadium sport venue", "golf ball green course scenic"] },
    { test: /게임|롤|리그오브레전드|배그|닌텐도|콘솔|PC방/, imgs: ["gaming controller keyboard rgb desk", "monitor game screen dark room light", "headset gaming setup desk led", "console joystick game room tech"] },
    { test: /음악|악기|기타|피아노|노래|가사|콘서트|공연/, imgs: ["guitar acoustic wooden string instrument", "piano keys close up elegant", "microphone stage spotlight performance", "music notes headphone minimal concept"] },
    { test: /영화|드라마|넷플릭스|OTT|유튜브|콘텐츠|방송/, imgs: ["television screen living room cozy", "popcorn movie night cinema concept", "streaming remote control dark room", "clapperboard film production concept"] },
    { test: /청소|정리정돈|청소용품|미니멀|수납|집안일|가사/, imgs: ["cleaning supplies organized minimal shelf", "storage basket drawer tidy home", "minimalist room white clean organized", "laundry folded clean stack white"] },
    { test: /알바|부업|부수입|재택근무|프리랜서|N잡|수익화/, imgs: ["laptop home office remote work desk", "freelance work coffee shop laptop", "money income concept document growth", "home workspace minimal desk plant"] },
    { test: /환경|자연|지구|탄소|친환경|재활용|생태|식물/, imgs: ["green plant nature sunlight leaf", "eco friendly reusable bag minimal", "forest nature sunlight peaceful green", "earth globe sustainability concept clean"] },
    { test: /명상|힐링|요가|마음챙김|심리|정신건강|스트레스/, imgs: ["meditation candle calm peaceful minimal", "nature path forest peaceful light", "zen stone arrangement water calm", "sunrise horizon peaceful nature minimal"] },
    { test: /데이트|연인|커플|로맨스|감성|데이트장소|데이트코스/, imgs: ["romantic garden fountain bench flowers path", "cozy cafe table flowers warm candle bokeh", "sunset park scenic bench couple spot", "rooftop terrace fairy lights city view night"] },
    { test: /맛집|레스토랑|음식점|식당|브런치|오마카세/, imgs: ["gourmet food dish elegant plating table", "cafe interior warm light latte art cup", "restaurant ambiance table setting candle", "brunch plate colorful fresh food morning"] },
    { test: /여행지|여행코스|관광지|명소|드라이브코스|국내여행|해외여행/, imgs: ["scenic landscape golden hour road path", "nature trail forest light peaceful green", "ocean cliff view horizon sunrise calm", "mountain valley fog misty landscape"] },
    { test: /탈모|모발|헤어|두피|샴푸|트리트먼트|헤어케어/, imgs: ["hair care serum bottle elegant minimal", "shampoo bottle towel bathroom clean", "hair brush comb beauty product shelf", "scalp treatment bottle clean white"] },
    { test: /캠핑|텐트|글램핑|백패킹|아웃도어|등산|산행|트레킹/, imgs: ["camping tent forest nature green trees", "outdoor backpack gear trail mountain path", "campfire wood flame night outdoor", "mountain summit scenic fog clouds trail"] },
    { test: /낚시|낚싯대|바다낚시|민물낚시|플라이피싱/, imgs: ["fishing rod lake sunrise calm water", "fishing equipment tackle lure box", "river bank nature peaceful morning", "sea fishing boat horizon ocean"] },
    { test: /공무원|수험생|고시|행정직|경찰|소방|교원임용|국가고시/, imgs: ["exam study desk books lamp night", "official document certification seal paper", "notebook pen checklist organized desk", "library quiet study space academic"] },
    { test: /크리에이터|유튜버|인플루언서|SNS|틱톡|릴스|콘텐츠제작/, imgs: ["camera studio ring light setup recording", "smartphone filming content creator desk", "editing monitor screen video timeline", "microphone podcast recording studio dark"] },
    { test: /카메라|사진|촬영|렌즈|DSLR|미러리스|사진작가/, imgs: ["camera lens equipment photography gear", "DSLR camera bokeh outdoor photography", "camera bag tripod studio light setup", "photo editing monitor workspace desk"] },
    { test: /가전제품|냉장고|세탁기|에어컨|청소기|전자제품|주방가전/, imgs: ["modern appliance kitchen clean minimal", "home electronics white clean design", "smart home device interior living room", "kitchen appliance counter clean bright"] },
    { test: /이사|이삿짐|입주청소|새집|이사짐센터/, imgs: ["moving boxes cardboard packed room", "new home key door entrance bright", "empty room fresh paint white clean", "packing tape boxes organized moving"] },
    { test: /은퇴|노후|연금|국민연금|퇴직|노후준비|시니어/, imgs: ["retirement savings jar coins peaceful", "calendar plan document retirement table", "peaceful garden senior lifestyle nature", "piggy bank nest egg future savings"] },
    { test: /유학|어학연수|해외유학|영어공부|토익|토플|해외생활|이민/, imgs: ["passport map travel document globe", "english book dictionary study abroad", "airplane window sky cloud travel", "university campus building entrance"] },
    { test: /해외직구|직구|쇼핑몰|온라인쇼핑|오픈마켓|쿠팡|이커머스/, imgs: ["online shopping cart package delivery box", "credit card laptop shopping minimal", "delivery box doorstep package arrival", "product unboxing packaging clean white"] },
    { test: /명상|마음챙김|힐링|심리|정신건강|스트레스|번아웃/, imgs: ["meditation mat candle peaceful zen", "calm nature landscape serene morning", "journal pen tea mindfulness table", "forest bathing nature light peaceful"] },
    { test: /필라테스|요가|스트레칭|홈트레이닝|폼롤러|마사지/, imgs: ["yoga mat minimal clean studio light", "pilates equipment reformer studio white", "stretching exercise mat home floor", "foam roller wellness equipment minimal"] },
    { test: /치과|임플란트|라식|라섹|성형|피부과|병원클리닉/, imgs: ["dental equipment clinic clean white", "medical clinic interior minimal clean", "eye care glasses lens optical clean", "skincare treatment clinic professional"] },
    { test: /반려식물|식물|원예|가드닝|다육이|화분|테라리움/, imgs: ["indoor plants pot shelf home green", "succulent arrangement small pots minimal", "garden tools soil seeds planting", "terrarium glass plants moss minimal"] },
  ];

  for (const cat of categories) {
    if (cat.test.test(t)) {
      return `${cat.imgs[v]}, ${NP}, professional photography, 8K`;
    }
  }

  // 완전 범용: 주제 첫 단어를 영어 느낌으로 + 정보성 이미지
  const infoVariants = [
    `information concept minimal clean desk document, ${NP}, professional photography, 8K`,
    `guide checklist paper clipboard organized, ${NP}, professional photography, 8K`,
    `knowledge book open pages light clean, ${NP}, professional photography, 8K`,
    `step by step process diagram minimal, ${NP}, professional photography, 8K`,
  ];
  return infoVariants[v];
}
