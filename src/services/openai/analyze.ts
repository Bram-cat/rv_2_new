import {
  OPENAI_BASE_URL,
  getOpenAIHeaders,
  isOpenAIConfigured as checkOpenAIConfigured,
} from "./client";

// Re-export for convenience
export const isOpenAIConfigured = checkOpenAIConfigured;

export interface SentenceSuggestion {
  original: string;
  improved: string;
  reason: string;
}

export interface ScoreBreakdown {
  category: string;
  currentScore: number;
  maxScore: number;
  whatToImprove: string;
  howToGetFullMarks: string;
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
  scoreBreakdown?: ScoreBreakdown[];
  extendedTranscript?: string;
  toneAnalysis?: string;
}

/**
 * Analyze transcribed speech using OpenAI GPT
 */
export async function analyzeSpeechWithAI(
  transcription: string,
  duration: number, // in seconds
  sentimentData?: { text: string; sentiment: string; confidence: number }[],
  speechContext?: {
    speechType?: string;
    audience?: string;
    goal?: string;
    timeLimitMinutes?: number;
  },
): Promise<SpeechFeedback> {
  if (!checkOpenAIConfigured()) {
    throw new Error(
      "OpenAI is not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.",
    );
  }

  const wordCount = transcription.split(/\s+/).length;
  const wordsPerMinute = Math.round((wordCount / duration) * 60);
  const isShortSpeech = duration < 60 || wordCount < 100;
  const timeLimitMinutes = speechContext?.timeLimitMinutes || 0;

  // Build sentiment summary
  let sentimentSummary = "";
  if (sentimentData && sentimentData.length > 0) {
    const positive = sentimentData.filter(
      (s) => s.sentiment === "POSITIVE",
    ).length;
    const negative = sentimentData.filter(
      (s) => s.sentiment === "NEGATIVE",
    ).length;
    const neutral = sentimentData.filter(
      (s) => s.sentiment === "NEUTRAL",
    ).length;
    const total = sentimentData.length;
    sentimentSummary = `
Sentiment Analysis Data (from AssemblyAI):
- Positive segments: ${positive}/${total} (${Math.round((positive / total) * 100)}%)
- Neutral segments: ${neutral}/${total} (${Math.round((neutral / total) * 100)}%)
- Negative segments: ${negative}/${total} (${Math.round((negative / total) * 100)}%)
Some example segments:
${sentimentData
  .slice(0, 5)
  .map(
    (s) =>
      `  "${s.text}" -> ${s.sentiment} (${(s.confidence * 100).toFixed(0)}%)`,
  )
  .join("\n")}`;
  }

  // Build context info
  let contextInfo = "";
  if (speechContext) {
    contextInfo = `
Speech Context:
- Type: ${speechContext.speechType || "General"}
- Audience: ${speechContext.audience || "General"}
- Goal: ${speechContext.goal || "Not specified"}
${timeLimitMinutes > 0 ? `- Time limit: ${timeLimitMinutes} minutes` : ""}`;
  }

  // Short speech handling
  let shortSpeechInstruction = "";
  if (isShortSpeech && timeLimitMinutes > 0) {
    const expectedWords = wordsPerMinute * timeLimitMinutes;
    shortSpeechInstruction = `
IMPORTANT: The speech is very short (${wordCount} words in ${Math.round(duration)}s) but the speaker had a ${timeLimitMinutes}-minute time limit (expected ~${expectedWords} words).
In "extendedTranscript", provide an improved and expanded version of their speech that:
1. Fills the ${timeLimitMinutes}-minute time frame properly
2. Maintains the speaker's key points and style
3. Adds better transitions, examples, and elaboration
4. Removes filler words and awkward phrasing
Keep it realistic and in the speaker's voice.`;
  } else if (isShortSpeech) {
    shortSpeechInstruction = `
IMPORTANT: The speech is very short (${wordCount} words in ${Math.round(duration)}s).
In "extendedTranscript", provide an improved, expanded version that elaborates on the main points, adds better structure, and would make for a stronger 2-3 minute speech.`;
  }

  const prompt = `You are a professional speech coach analyzing a presentation/speech. Analyze the following transcription and provide detailed feedback.

Transcription:
"${transcription}"

Duration: ${Math.round(duration)} seconds
Words per minute: ${wordsPerMinute}
${sentimentSummary}
${contextInfo}
${shortSpeechInstruction}

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
  "toneAnalysis": "<2-3 sentences analyzing the speaker's tone based on sentiment data - enthusiastic, monotone, nervous, confident, etc. Describe how their emotional delivery affects the audience>",
  "sentenceSuggestions": [
    {
      "original": "<an awkward or unclear sentence from the speech>",
      "improved": "<a better, more professional way to say it>",
      "reason": "<brief explanation of why this is better>"
    }
  ],
  "scoreBreakdown": [
    {
      "category": "Clarity",
      "currentScore": <same as clarity score>,
      "maxScore": 10,
      "whatToImprove": "<specific issue holding the score back>",
      "howToGetFullMarks": "<concrete steps to achieve a 10/10>"
    },
    {
      "category": "Pace",
      "currentScore": <same as pace score>,
      "maxScore": 10,
      "whatToImprove": "<specific issue>",
      "howToGetFullMarks": "<concrete steps>"
    },
    {
      "category": "Confidence",
      "currentScore": <same as confidence score>,
      "maxScore": 10,
      "whatToImprove": "<specific issue>",
      "howToGetFullMarks": "<concrete steps>"
    },
    {
      "category": "Content & Structure",
      "currentScore": <1-10>,
      "maxScore": 10,
      "whatToImprove": "<specific issue>",
      "howToGetFullMarks": "<concrete steps>"
    }
  ]${
    isShortSpeech
      ? `,
  "extendedTranscript": "<improved and expanded version of the speech>"`
      : ""
  }
}

For sentenceSuggestions, identify 2-4 sentences that could be improved for clarity, professionalism, or impact.

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
        max_tokens: 2000,
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
