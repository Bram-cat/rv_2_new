// AssemblyAI API configuration using fetch (SDK doesn't work in React Native)

const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY;

export const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";

export function getApiKey(): string | undefined {
  return ASSEMBLYAI_API_KEY;
}

export function isAssemblyAIConfigured(): boolean {
  const isConfigured = !!ASSEMBLYAI_API_KEY && ASSEMBLYAI_API_KEY.length > 0;
  console.log(
    "AssemblyAI configured:",
    isConfigured,
    "Key length:",
    ASSEMBLYAI_API_KEY?.length || 0,
  );
  return isConfigured;
}

export function getHeaders(): Record<string, string> {
  const apiKey = ASSEMBLYAI_API_KEY || "";
  console.log(
    "Using AssemblyAI API key:",
    apiKey ? `${apiKey.substring(0, 8)}...` : "NOT SET",
  );
  return {
    Authorization: apiKey,
    "Content-Type": "application/json",
  };
}
