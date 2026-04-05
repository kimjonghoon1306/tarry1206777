import { userGet, SETTINGS_KEYS } from "./user-storage";

export type ContentAIProvider = "gemini" | "claude" | "openai" | "groq";
export type ImageAIProvider = "openai" | "replicate";

// userGet 자체에 admin 폴백이 포함되어 있음 (user-storage.ts 참고)
export function getContentProvider(): ContentAIProvider {
  return (userGet(SETTINGS_KEYS.CONTENT_AI) as ContentAIProvider) || "gemini";
}

export function getImageProvider(): ImageAIProvider {
  return (userGet(SETTINGS_KEYS.IMAGE_AI) as ImageAIProvider) || "replicate";
}

export function getAPIKey(provider: string): string {
  const keyMap: Record<string, string> = {
    gemini:      SETTINGS_KEYS.GEMINI_KEY,
    claude:      SETTINGS_KEYS.CLAUDE_KEY,
    openai:      SETTINGS_KEYS.OPENAI_KEY,
    flux:        SETTINGS_KEYS.FLUX_KEY,
    groq:        SETTINGS_KEYS.GROQ_KEY,
    replicate:   SETTINGS_KEYS.REPLICATE_KEY,
    huggingface: SETTINGS_KEYS.HUGGING_KEY,
    imgbb:       SETTINGS_KEYS.IMGBB_KEY,
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
    value: "openai" as ImageAIProvider,
    label: "GPT Image",
    badge: "유료",
    badgeColor: "oklch(0.75 0.12 300)",
    desc: "OpenAI · 최고 품질 이미지",
    pros: "최고 품질 이미지 · 정확한 프롬프트 이해",
    cons: "유료 · 이미지당 비용 발생",
    logo: "O", logoColor: "oklch(0.75 0.12 300)",
    keyLabel: "OpenAI API Key", keyPlaceholder: "sk-...",
    keyStorageKey: SETTINGS_KEYS.OPENAI_KEY,
    keyLink: "https://platform.openai.com/api-keys",
  },
  {
    value: "replicate" as ImageAIProvider,
    label: "Replicate (Flux)",
    badge: "유료",
    badgeColor: "oklch(0.769 0.188 70.08)",
    desc: "Replicate · 가입 시 무료 크레딧 제공",
    pros: "가입 시 무료 크레딧 · Flux 고품질 · 이미지당 약 3~25원",
    cons: "무료 크레딧 소진 후 유료 전환",
    logo: "R", logoColor: "oklch(0.769 0.188 70.08)",
    keyLabel: "Replicate API Token", keyPlaceholder: "r8_...",
    keyStorageKey: SETTINGS_KEYS.REPLICATE_KEY,
    keyLink: "https://replicate.com/account/api-tokens",
  },
];
