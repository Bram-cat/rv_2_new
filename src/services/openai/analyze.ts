import { OPENAI_BASE_URL, getOpenAIHeaders, isOpenAIConfigured as checkOpenAIConfigured } from "./client";

// Re-export for convenience
export const isOpenAIConfigured = checkOpenAIConfigured;

export interface SentenceSuggestion {
  original: string;
  improved: string;
  reason: string;
}

export interface SpeechFeedback {
  overallScore: number; // 1-10
  clarity: number; // 1-10
  pace: number; // 1-10
  confidence: number; // 1-10
  fillerWordCount: number;
  fillerWords: string[];
  strengths: string[];
  improvements: string[];
  tips: string[];
  summary: string;
  sentenceSuggestions: SentenceSuggestion[];
}

/**
 * Analyze transcribed speech using OpenAI GPT
 */
export async function analyzeSpeechWithAI(
  transcription: string,
  duration: number // in seconds
): Promise<SpeechFeedback> {
  if (!checkOpenAIConfigured()) {
    throw new Error(
      "OpenAI is not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file."
    );
  }

  const wordsPerMinute = Math.round(
    (transcription.split(/\s+/).length / duration) * 60
  );

  const prompt = `You are a professional speech coach analyzing a presentation/speech. Analyze the following transcription and provide detailed feedback.

Transcription:
"${transcription}"

Duration: ${Math.round(duration)} seconds
Words per minute: ${wordsPerMinute}

Please analyze this speech and respond with a JSON object containing:
{
  "overallScore": <1-10 score>,
  "clarity": <1-10 score for clarity of speech>,
  "pace": <1-10 score for speaking pace>,
  "confidence": <1-10 score for perceived confidence>,
  "fillerWordCount": <count of filler words like um, uh, like, you know>,
  "fillerWords": [<list of detected filler words with counts, e.g., "um (3)", "like (5)">],
  "strengths": [<list of 2-3 things done well>],
  "improvements": [<list of 2-3 specific areas to improve>],
  "tips": [<list of 2-3 actionable tips for next time>],
  "summary": "<2-3 sentence summary of the speech quality>",
  "sentenceSuggestions": [
    {
      "original": "<an awkward or unclear sentence from the speech>",
      "improved": "<a better, more professional way to say it>",
      "reason": "<brief explanation of why this is better>"
    }
  ]
}

For sentenceSuggestions, identify 2-4 sentences that could be improved for clarity, professionalism, or impact. Provide better alternatives that sound more polished and confident.

Be constructive and encouraging while being honest about areas for improvement. Focus on presentation skills, not content accuracy.`;

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: getOpenAIHeaders(),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful speech coach. Always respond with valid JSON only, no markdown or extra text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const feedback = JSON.parse(content) as SpeechFeedback;
    return feedback;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI response");
    }
    throw error;
  }
}

/**
 * Get quick tips based on common issues
 */
export function getQuickTips(wpm: number, fillerCount: number): string[] {
  const tips: string[] = [];

  if (wpm < 120) {
    tips.push("Try to speak a bit faster to maintain audience engagement");
  } else if (wpm > 160) {
    tips.push("Slow down slightly to ensure clarity and comprehension");
  }

  if (fillerCount > 5) {
    tips.push("Practice pausing instead of using filler words");
    tips.push("Take a breath when you feel the urge to say 'um' or 'uh'");
  }

  return tips;
}
