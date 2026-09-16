// 이미지 밑 설명글(figcaption=alt) 자연 문구 생성 — 출력 언어(글 언어)에 맞춰.
//   기존엔 캡션이 "이미지 프롬프트 앞 20자 조각"이라 지저분했음(예: "fresh fish neatly arr...").
//   키워드 기반의 깔끔한 한 줄 캡션으로. 영어 글=영어 캡션, 한국어 글=한국어 캡션(테리 요구).

const CONTENT_LANG_KEY = "content_language";

// 현재 출력 언어(글 생성 언어)를 읽는다. 유저 네임스페이스(u:{uid}:content_language) 우선, 없으면 공용.
export function currentContentLang(): string {
  try {
    const raw = localStorage.getItem("ba_user");
    const uid = raw ? JSON.parse(raw).id : "";
    if (uid) {
      const v = localStorage.getItem(`u:${uid}:${CONTENT_LANG_KEY}`);
      if (v) return v;
    }
  } catch {}
  return localStorage.getItem(CONTENT_LANG_KEY) || "ko";
}

// 언어별 캡션 템플릿. {kw}=키워드. 여러 장이면 뒤에 번호를 붙여 중복 방지.
const TPL: Record<string, (kw: string) => string> = {
  ko: (kw) => (kw ? `${kw} 관련 이미지` : "관련 이미지"),
  en: (kw) => (kw ? `Image related to ${kw}` : "Related image"),
  ja: (kw) => (kw ? `${kw}に関する画像` : "関連画像"),
  zh: (kw) => (kw ? `与${kw}相关的图片` : "相关图片"),
  es: (kw) => (kw ? `Imagen relacionada con ${kw}` : "Imagen relacionada"),
  fr: (kw) => (kw ? `Image liée à ${kw}` : "Image associée"),
  de: (kw) => (kw ? `Bild zum Thema ${kw}` : "Zugehöriges Bild"),
  pt: (kw) => (kw ? `Imagem relacionada a ${kw}` : "Imagem relacionada"),
};

/** 키워드+언어로 자연스러운 이미지 캡션 한 줄 생성. index>0이면 번호를 붙여 중복 방지. */
export function makeCaption(keyword: string, lang?: string, index = 0): string {
  const l = (lang || currentContentLang()).toLowerCase();
  const kw = (keyword || "").trim().replace(/\s+/g, " ").slice(0, 40);
  const base = (TPL[l] || TPL.ko)(kw);
  return index > 0 ? `${base} (${index + 1})` : base;
}
