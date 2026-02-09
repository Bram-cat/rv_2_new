import {
  OPENAI_BASE_URL,
  getOpenAIHeaders,
  isOpenAIConfigured as checkOpenAIConfigured,
} from "./client";

// Re-export for convenience
export const isOpenAIConfigured = checkOpenAIConfigured;

/**
 * Strip markdown code fences from AI response before JSON.parse
 * Handles ```json ... ```, ``` ... ```, and raw JSON
 */
function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  // Remove ```json ... ``` or ``` ... ``` wrapping
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
  }
  return cleaned.trim();
}

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
  vocabularyBoost?: { word: string; meaning: string; useInSentence: string };
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
  aiContext?: string, // coaching knowledge + user progress context
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

  const prompt = `Analyze this speech. Be CONCISE — max 10 words per bullet point, max 2 sentences for summary. Sprinkle in light, silly humor (like a friendly coach who tells dad jokes). Keep it fun but useful.

Transcription: "${transcription}"

Duration: ${Math.round(duration)}s | WPM: ${wordsPerMinute}
${sentimentSummary}
${contextInfo}
${shortSpeechInstruction}

Respond with JSON:
{
  "overallScore": <1-10>,
  "clarity": <1-10>,
  "pace": <1-10>,
  "confidence": <1-10>,
  "fillerWordCount": <number>,
  "fillerWords": ["um (3)", "like (5)"],
  "strengths": ["<max 10 words each, 2-3 items — add a dash of humor>"],
  "improvements": ["<max 10 words each, 2-3 items — keep it encouraging and witty>"],
  "tips": ["<max 12 words each, 2-3 actionable items>"],
  "summary": "<1-2 short sentences with a light humorous touch>",
  "toneAnalysis": "<1 sentence on emotional delivery>",
  "vocabularyBoost": {"word": "<a sophisticated replacement word for a basic/overused word the speaker actually said>", "meaning": "<short definition of the replacement word>", "useInSentence": "<rewrite one of the user's actual sentences using this better word>"},
  "sentenceSuggestions": [{"original": "...", "improved": "...", "reason": "<max 8 words>"}],
  "scoreBreakdown": [
    {"category": "Clarity", "currentScore": <n>, "maxScore": 10, "whatToImprove": "<max 12 words>", "howToGetFullMarks": "<max 15 words>"},
    {"category": "Pace", "currentScore": <n>, "maxScore": 10, "whatToImprove": "<max 12 words>", "howToGetFullMarks": "<max 15 words>"},
    {"category": "Confidence", "currentScore": <n>, "maxScore": 10, "whatToImprove": "<max 12 words>", "howToGetFullMarks": "<max 15 words>"}
  ]${isShortSpeech ? `,"extendedTranscript": "<expanded version>"` : ""}
}

Keep ALL text SHORT. No fluff. Be direct, specific, and a little funny.`;

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: getOpenAIHeaders(),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Speechi, a witty and encouraging speech coach with a quirky sense of humor. You give honest, specific feedback but keep the vibe light — think supportive friend who happens to be a communication expert. Use silly analogies or dad-joke-level humor where it fits naturally. Always respond with valid JSON only, no markdown or extra text.

CONTEXTUAL SCORING: First detect what KIND of speech this is based on content and context. A casual conversation about daily life should score 7-8 if it flows naturally — don't demand formal structure from informal speech. A pitch or presentation gets stricter scoring. Be a fair judge who understands the difference between chatting with friends and presenting to a board room. Score relative to what the speaker is actually trying to do.

SCORING: Use the HAIL framework + Vocal Toolbox + Winston's Heuristics from your coaching knowledge base as the scoring rubric. Reference specific frameworks in your tips (e.g. "Try the Problem-Solution-Benefit structure" or "Your prosody needs work — vary your pitch more").

VOCABULARY: Suggest vocabulary words from the coaching knowledge base (prosody, timbre, register, empowerment promise, cycling, verbal punctuation, matching principle, etc.) so users learn real communication science terms.${aiContext ? "\n" + aiContext : ""}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
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

    // Parse the JSON response (strip markdown fences if present)
    const feedback = JSON.parse(cleanJsonResponse(content)) as SpeechFeedback;
    return feedback;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse AI response");
    }
    throw error;
  }
}

/**
 * Practice mode observation - AI observes and learns speaking patterns
 * without giving the same detailed analysis. Focuses on building a profile.
 */
export interface PracticeObservation {
  fillerWords: string[];
  fillerWordCount: number;
  pace: number; // 1-10
  confidence: number; // 1-10
  clarity: number; // 1-10
  vocabularyRichness: number; // 1-10
  conversationType: string; // e.g. "casual chat", "storytelling", "pitch", "informative", "persuasive"
  quickTips: string[]; // 2-3 actionable one-liners
  vocabularyBoost?: { word: string; meaning: string; useInSentence: string };
  speakerInsight?: {
    speaker: string; // e.g. "Julian Treasure" or "Patrick Winston"
    technique: string; // the technique/concept from their talk
    originalLine: string; // what the user said
    improvedLine: string; // how to say it better using the technique
  };
}

export async function observePracticeSpeech(
  transcription: string,
  duration: number,
  aiContext?: string,
): Promise<PracticeObservation> {
  if (!checkOpenAIConfigured()) {
    throw new Error("OpenAI is not configured.");
  }

  const wordCount = transcription.split(/\s+/).length;
  const wordsPerMinute = Math.round((wordCount / duration) * 60);

  const prompt = `Observe this practice recording and give brief, fun feedback. Be a little silly — like a coach who high-fives you after every rep.

Transcription:
"${transcription}"

Duration: ${Math.round(duration)}s | WPM: ${wordsPerMinute}

STEP 1 — DETECT CONVERSATION TYPE:
First, figure out what kind of speech this is. Options: "casual chat", "storytelling", "pitch", "informative", "persuasive", "impromptu", "presentation". This matters for scoring — a casual chat about weekend plans should NOT be scored like a keynote speech. Adjust expectations accordingly:
- Casual/storytelling: be lenient on structure and pace. Focus on naturalness.
- Pitch/persuasive: expect stronger structure and clarity.
- Informative/presentation: expect clear organization and confident delivery.

STEP 2 — SCORE RELATIVE TO TYPE:
Score pace, confidence, clarity, and vocabularyRichness on a 1-10 scale BUT calibrated to the conversation type. A 7 in casual speech means "sounds natural and engaging for a chat." A 7 in a pitch means "mostly persuasive with room to tighten." Don't punish casual speakers for not being formal.

vocabularyRichness: How varied and expressive is their word choice? Do they repeat the same words? Do they use descriptive language? 1 = very repetitive/basic, 10 = rich and varied.

Respond with JSON only:
{
  "conversationType": "<detected type>",
  "fillerWords": ["um", "uh", "like"],
  "fillerWordCount": <total filler count>,
  "pace": <1-10 calibrated to type>,
  "confidence": <1-10 calibrated to type>,
  "clarity": <1-10 calibrated to type>,
  "vocabularyRichness": <1-10>,
  "quickTips": ["<tip 1 — witty but helpful>", "<tip 2>"],
  "vocabularyBoost": {"word": "<a sophisticated replacement word for a basic/overused word the speaker actually said>", "meaning": "<short definition of the replacement word>", "useInSentence": "<rewrite one of the user's actual sentences using this better word>"},
  "speakerInsight": {"speaker": "<name of TED speaker or expert from coaching knowledge: Julian Treasure, Matt Abrahams, Patrick Winston, or Charles Duhigg>", "technique": "<the specific technique they teach>", "originalLine": "<pick a sentence from the user's speech that could be improved>", "improvedLine": "<rewrite that sentence using the expert's technique — make it punchier, clearer, or more engaging>"}
}

quickTips: exactly 2-3 short actionable tips (max 10 words each). Reference specific coaching frameworks (HAIL, Vocal Toolbox, Problem-Solution-Benefit, etc). Add personality.
vocabularyBoost: REQUIRED — ALWAYS include this. Find a basic/overused word in the user's speech (e.g. "good", "thing", "stuff", "nice", "very", "really", "a lot") and suggest a more sophisticated, expressive replacement word (e.g. "good" → "exemplary", "thing" → "element", "nice" → "delightful"). The word MUST be an actual English word they can use in conversation — NOT a speaking concept/technique. Show how their original sentence sounds with the upgrade.
speakerInsight: REQUIRED — ALWAYS include this. MUST pick one sentence from the user's transcription and show how a real TED speaker would improve it using a specific technique from the coaching knowledge. Be concrete — show the before and after.`;

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: getOpenAIHeaders(),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Speechi, a fun and supportive speech practice buddy. You observe patterns without harsh judgment — think encouraging gym bro energy but for public speaking. Keep feedback specific and a little humorous. Respond with valid JSON only.

CONTEXTUAL SCORING: First detect what KIND of speech this is (casual chat, storytelling, pitch, presentation, etc). Score RELATIVE to that type. A casual conversation about weekend plans deserves a 7-8 if it flows naturally — don't penalize it for lacking formal structure. Save strict scoring for pitches and presentations. Be fair and realistic.

SCORING: Use the Vocal Toolbox (register, timbre, prosody, pace, silence, pitch) and HAIL framework from your coaching knowledge to assess pace and confidence. Reference specific concepts in tips (e.g. "Try strategic silence instead of filling gaps" or "Use the What-So What-Now What structure").

VOCABULARY: Find a basic or overused word in the user's speech and suggest a more sophisticated, expressive replacement word. For example: "good" → "exemplary", "bad" → "detrimental", "thing" → "element", "nice" → "delightful", "very" → "remarkably". The suggested word must be a real English vocabulary word the speaker can use — NOT a speaking concept or technique name.

SPEAKER INSIGHT: Your coaching knowledge contains techniques from Julian Treasure (HAIL, vocal toolbox, seven deadly sins of speaking), Matt Abrahams (spontaneous speaking, anxiety management, Problem-Solution-Benefit), Patrick Winston (empowerment promise, cycling, building a fence, verbal punctuation, Winston's Star), and Charles Duhigg (matching principle, deep questions, vulnerability). Pick one of the user's actual sentences and show them how one of these experts would improve it using their specific technique.${aiContext ? "\n" + aiContext : ""}`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");

    console.log("Practice observation raw:", content.substring(0, 300));

    const parsed = JSON.parse(cleanJsonResponse(content));

    // Apply defensive defaults for missing/misnamed fields
    const observation: PracticeObservation = {
      fillerWords: Array.isArray(parsed.fillerWords) ? parsed.fillerWords : [],
      fillerWordCount: typeof parsed.fillerWordCount === "number" ? parsed.fillerWordCount : 0,
      pace: typeof parsed.pace === "number" ? parsed.pace : 5,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 5,
      clarity: typeof parsed.clarity === "number" ? parsed.clarity : 5,
      vocabularyRichness: typeof parsed.vocabularyRichness === "number"
        ? parsed.vocabularyRichness
        : typeof parsed.vocabulary_richness === "number"
          ? parsed.vocabulary_richness
          : 5,
      conversationType: parsed.conversationType || parsed.conversation_type || "general",
      quickTips: Array.isArray(parsed.quickTips)
        ? parsed.quickTips
        : Array.isArray(parsed.quick_tips)
          ? parsed.quick_tips
          : [],
      vocabularyBoost: parsed.vocabularyBoost || parsed.vocabulary_boost || undefined,
      speakerInsight: parsed.speakerInsight || parsed.speaker_insight || undefined,
    };

    console.log("Practice observation parsed:", JSON.stringify({
      pace: observation.pace,
      confidence: observation.confidence,
      clarity: observation.clarity,
      vocabularyRichness: observation.vocabularyRichness,
      conversationType: observation.conversationType,
    }));

    return observation;
  } catch (error) {
    console.error("observePracticeSpeech error:", error);
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
