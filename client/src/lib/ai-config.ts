// AI 설정 읽기 유틸리티
export type ContentAIProvider = "gemini" | "claude" | "openai" | "groq";
export type ImageAIProvider = "gemini" | "openai" | "flux" | "pollinations";

export function getContentProvider(): ContentAIProvider {
  return (localStorage.getItem("content_ai_provider") as ContentAIProvider) || "gemini";
}

export function getImageProvider(): ImageAIProvider {
  return (localStorage.getItem("image_ai_provider") as ImageAIProvider) || "flux";
}

export function getAPIKey(provider: string): string {
  const keyMap: Record<string, string> = {
    gemini: "gemini_api_key",
    claude: "claude_api_key",
    openai: "openai_api_key",
    flux: "flux_api_key",
    groq: "groq_api_key",
    pollinations: "", // API 키 불필요
  };
  return localStorage.getItem(keyMap[provider] || "") || "";
}

export const CONTENT_AI_OPTIONS = [
  {
    value: "gemini" as ContentAIProvider,
    label: "Gemini Flash",
    badge: "무료",
    badgeColor: "var(--color-emerald)",
    desc: "Google AI · 빠르고 무료",
    logo: "G",
    logoColor: "#4285F4",
    keyLabel: "Gemini API Key",
    keyPlaceholder: "AIza...",
    keyStorageKey: "gemini_api_key",
    keyLink: "https://aistudio.google.com/app/apikey",
  },
  {
    value: "groq" as ContentAIProvider,
    label: "Groq (Llama 3)",
    badge: "무료",
    badgeColor: "var(--color-emerald)",
    desc: "Groq · 초고속 완전 무료",
    logo: "L",
    logoColor: "#F55036",
    keyLabel: "Groq API Key",
    keyPlaceholder: "gsk_...",
    keyStorageKey: "groq_api_key",
    keyLink: "https://console.groq.com/keys",
  },
  {
    value: "claude" as ContentAIProvider,
    label: "Claude Sonnet",
    badge: "유료",
    badgeColor: "oklch(0.769 0.188 70.08)",
    desc: "Anthropic · 고품질",
    logo: "A",
    logoColor: "#CC785C",
    keyLabel: "Claude API Key",
    keyPlaceholder: "sk-ant-...",
    keyStorageKey: "claude_api_key",
    keyLink: "https://console.anthropic.com/",
  },
  {
    value: "openai" as ContentAIProvider,
    label: "GPT-4o",
    badge: "유료",
    badgeColor: "oklch(0.769 0.188 70.08)",
    desc: "OpenAI · 범용 최강",
    logo: "O",
    logoColor: "#10A37F",
    keyLabel: "OpenAI API Key",
    keyPlaceholder: "sk-...",
    keyStorageKey: "openai_api_key",
    keyLink: "https://platform.openai.com/api-keys",
  },
];

export const IMAGE_AI_OPTIONS = [
  {
    value: "pollinations" as ImageAIProvider,
    label: "Pollinations AI",
    badge: "무료",
    badgeColor: "var(--color-emerald)",
    desc: "완전 무료 · API 키 없음",
    logo: "P",
    logoColor: "#7C3AED",
    keyLabel: "",
    keyPlaceholder: "",
    keyStorageKey: "",
    keyLink: "https://pollinations.ai",
  },
  {
    value: "flux" as ImageAIProvider,
    label: "Flux Schnell",
    badge: "무료",
    badgeColor: "var(--color-emerald)",
    desc: "fal.ai · 빠른 무료 이미지",
    logo: "F",
    logoColor: "#F55036",
    keyLabel: "fal.ai API Key",
    keyPlaceholder: "fal-...",
    keyStorageKey: "flux_api_key",
    keyLink: "https://fal.ai/dashboard/keys",
  },
  {
    value: "gemini" as ImageAIProvider,
    label: "Gemini Imagen",
    badge: "유료",
    badgeColor: "oklch(0.769 0.188 70.08)",
    desc: "Google · 고품질 사진",
    logo: "G",
    logoColor: "#4285F4",
    keyLabel: "Gemini API Key",
    keyPlaceholder: "AIza...",
    keyStorageKey: "gemini_api_key",
    keyLink: "https://aistudio.google.com/app/apikey",
  },
  {
    value: "openai" as ImageAIProvider,
    label: "DALL-E 3",
    badge: "유료",
    badgeColor: "oklch(0.769 0.188 70.08)",
    desc: "OpenAI · 창의적 이미지",
    logo: "O",
    logoColor: "#10A37F",
    keyLabel: "OpenAI API Key",
    keyPlaceholder: "sk-...",
    keyStorageKey: "openai_api_key",
    keyLink: "https://platform.openai.com/api-keys",
  },
];
