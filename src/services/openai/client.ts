// OpenAI API configuration

// Try multiple possible API key environment variables
const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY ||
  process.env.EXPO_PUBLIC_OPENAI_API_KEY_1 ||
  process.env.EXPO_PUBLIC_OPENAI_API_KEY_2;

export const OPENAI_BASE_URL = "https://api.openai.com/v1";

export function getOpenAIApiKey(): string | undefined {
  return OPENAI_API_KEY;
}

export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY;
}

export function getOpenAIHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  };
}
