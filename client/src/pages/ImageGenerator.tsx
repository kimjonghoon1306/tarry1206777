const handleGenerate = async () => {
  const provider = getImageProvider();
  const apiKey = getAPIKey(provider);

  if (provider !== "pollinations" && !apiKey) { 
    toast.error(`설정에서 ${currentAI?.label} API 키를 입력해주세요`); 
    return; 
  }

  if (!prompt.trim()) {
    toast.error("프롬프트를 입력해주세요");
    return;
  }

  setIsGenerating(true);
  setProgress(0);
  const numImages = parseInt(count) || 1;

  // 🔥 핵심: 번역 제거 + 그대로 사용
  const qualityBoost = "professional photography, stunning visual, highly detailed, perfect lighting";
  const fullPrompt = `${prompt}, ${STYLE_PROMPTS[style] || STYLE_PROMPTS.realistic}, ${qualityBoost}`;

  const [w, h] = (size || "1024x1024").split("x").map(Number);
  const styleLabel = STYLES.find(s => s.value === style)?.label || style;

  toast.loading(`이미지 ${numImages}개 생성 중...`, { id: "imggen" });

  await generateImages(numImages, fullPrompt, w || 1024, h || 1024, styleLabel, size);

  setIsGenerating(false);
};
