export type ContentAIProvider = "gemini" | "groq" | "claude" | "openai";

export type ImageAIProvider =
  | "openai"
  | "gemini"
  | "replicate";

export const CONTENT_AI_OPTIONS = [
  {
    id: "gemini",
    name: "Gemini Flash",
    desc: "Google AI · 블로그 무료",
    free: true,
  },
  {
    id: "groq",
    name: "Groq (Llama 3)",
    desc: "Groq · 초고속 완전 무료",
    free: true,
  },
  {
    id: "claude",
    name: "Claude Sonnet",
    desc: "Anthropic · 고품질",
    free: false,
  },
  {
    id: "openai",
    name: "GPT-4o",
    desc: "OpenAI · 범용 최강",
    free: false,
  },
];

export const IMAGE_AI_OPTIONS = [
  {
    id: "gemini",
    name: "Gemini Image",
    desc: "일부 무료 사용 후 유료 결제",
    color: "blue",
    link: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "openai",
    name: "DALL·E 3",
    desc: "유료 · 최고 품질 이미지",
    color: "purple",
    link: "https://platform.openai.com/api-keys",
  },
  {
    id: "replicate",
    name: "Replicate",
    desc: "일부 무료 사용 후 유료 결제",
    color: "yellow",
    link: "https://replicate.com/account/api-tokens",
  },
];

export function getImageProvider(): ImageAIProvider {
  return (localStorage.getItem("image_provider") as ImageAIProvider) || "gemini";
}

export function setImageProvider(provider: ImageAIProvider) {
  localStorage.setItem("image_provider", provider);
}

export function getAPIKey(provider: string) {
  return localStorage.getItem(`${provider}_api_key`) || "";
}
