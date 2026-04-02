import { userGet, SETTINGS_KEYS } from "./user-storage";

export type ContentAIProvider = "gemini" | "claude" | "openai" | "groq";
export type ImageAIProvider = "gemini" | "openai" | "flux" | "pollinations";

export function getContentProvider(): ContentAIProvider {
  return (userGet(SETTINGS_KEYS.CONTENT_AI) as ContentAIProvider) || "gemini";
}

export function getImageProvider(): ImageAIProvider {
  return (userGet(SETTINGS_KEYS.IMAGE_AI) as ImageAIProvider) || "pollinations";
}

export function getAPIKey(provider: string): string {
  const keyMap: Record<string, string> = {
    gemini:      SETTINGS_KEYS.GEMINI_KEY,
    claude:      SETTINGS_KEYS.CLAUDE_KEY,
    openai:      SETTINGS_KEYS.OPENAI_KEY,
    flux:        SETTINGS_KEYS.FLUX_KEY,
    groq:        SETTINGS_KEYS.GROQ_KEY,
    pollinations: "",
    huggingface: SETTINGS_KEYS.HUGGING_KEY,
  };
  const k = keyMap[provider];
  return k ? userGet(k) : "";
}

export const CONTENT_AI_OPTIONS = [
  {
    value: "gemini" as ContentAIProvider,
    label: "Gemini Flash",
    badge: "무료",
    badgeColor: "var(--color-emerald)",
    desc: "Google AI · 빠르고 무료",
    logo: "G", logoColor: "#4285F4",
    keyLabel: "Gemini API Key", keyPlaceholder: "AIza...",
    keyStorageKey: SETTINGS_KEYS.GEMINI_KEY,
    keyLink: "https://aistudio.google.com/app/apikey",
  },
  {
    value: "groq" as ContentAIProvider,
    label: "Groq (Llama 3)",
    badge: "무료",
    badgeColor: "var(--color-emerald)",
    desc: "Groq · 초고속 완전 무료",
    logo: "L", logoColor: "#F55036",
    keyLabel: "Groq API Key", keyPlaceholder: "gsk_...",
    keyStorageKey: SETTINGS_KEYS.GROQ_KEY,
    keyLink: "https://console.groq.com/keys",
  },
  {
    value: "claude" as ContentAIProvider,
    label: "Claude Sonnet",
    badge: "유료",
    badgeColor: "oklch(0.769 0.188 70.08)",
    desc: "Anthropic · 고품질",
    logo: "A", logoColor: "#CC785C",
    keyLabel: "Claude API Key", keyPlaceholder: "sk-ant-...",
    keyStorageKey: SETTINGS_KEYS.CLAUDE_KEY,
    keyLink: "https://console.anthropic.com/",
  },
  {
    value: "openai" as ContentAIProvider,
    label: "GPT-4o",
    badge: "유료",
    badgeColor: "oklch(0.769 0.188 70.08)",
    desc: "OpenAI · 범용 최강",
    logo: "O", logoColor: "#10A37F",
    keyLabel: "OpenAI API Key", keyPlaceholder: "sk-...",
    keyStorageKey: SETTINGS_KEYS.OPENAI_KEY,
    keyLink: "https://platform.openai.com/api-keys",
  },
];

export const IMAGE_AI_OPTIONS = [
  {
    value: "pollinations" as ImageAIProvider,
    label: "Pollinations AI",
    badge: "완전 무료",
    badgeColor: "var(--color-emerald)",
    desc: "API 키 없이 바로 사용",
    pros: "설정 없이 즉시 사용 · 무제한",
    cons: "퀄리티 들쑥날쑥 · 가끔 느림",
    logo: "P", logoColor: "#7C3AED",
    keyLabel: "", keyPlaceholder: "", keyStorageKey: "",
    keyLink: "https://pollinations.ai",
  },

  {
    value: "gemini" as ImageAIProvider,
    label: "Gemini Flash",
    badge: "무료/유료",
    badgeColor: "oklch(0.65 0.15 200)",
    desc: "Google · 무료 키로 이용 가능",
    pros: "무료 API 키 발급 · 빠른 속도",
    cons: "이미지 전용 아님 · 한도 제한",
    logo: "G", logoColor: "#4285F4",
    keyLabel: "Gemini API Key", keyPlaceholder: "AIza...",
    keyStorageKey: SETTINGS_KEYS.GEMINI_KEY,
    keyLink: "https://aistudio.google.com/app/apikey",
  },
  {
    value: "flux" as ImageAIProvider,
    label: "Flux Schnell",
    badge: "무료",
    badgeColor: "var(--color-emerald)",
    desc: "fal.ai · 빠른 무료 이미지",
    pros: "빠른 생성 속도 · fal.ai 무료 크레딧",
    cons: "API 키 필요 · 무료 한도 제한",
    logo: "F", logoColor: "#F55036",
    keyLabel: "fal.ai API Key", keyPlaceholder: "fal-...",
    keyStorageKey: SETTINGS_KEYS.FLUX_KEY,
    keyLink: "https://fal.ai/dashboard/keys",
  },
  {
    value: "openai" as ImageAIProvider,
    label: "DALL-E 3",
    badge: "유료",
    badgeColor: "oklch(0.769 0.188 70.08)",
    desc: "OpenAI · 창의적 이미지",
    pros: "최고 품질 이미지 · 정확한 프롬프트 이해",
    cons: "유료 · 이미지당 비용 발생",
    logo: "O", logoColor: "#10A37F",
    keyLabel: "OpenAI API Key", keyPlaceholder: "sk-...",
    keyStorageKey: SETTINGS_KEYS.OPENAI_KEY,
    keyLink: "https://platform.openai.com/api-keys",
  },
];
