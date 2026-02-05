import { Ionicons } from "@expo/vector-icons";
import { TemplateId } from "../types/recording";

export interface PracticeTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: "professional" | "academic" | "personal";
  suggestedDurations: number[]; // in seconds
  targetWPM: { min: number; max: number };
  tips: string[];
  aiPromptContext: string;
}

export const TEMPLATES: PracticeTemplate[] = [
  // Professional Templates
  {
    id: "tech-pitch",
    name: "Tech/Product Pitch",
    description: "Present your product or technical idea clearly",
    icon: "rocket-outline",
    category: "professional",
    suggestedDurations: [60, 180, 300],
    targetWPM: { min: 130, max: 150 },
    tips: [
      "Lead with the problem you're solving",
      "Keep technical jargon to a minimum",
      "End with a clear call to action",
    ],
    aiPromptContext:
      "tech product pitch to potential investors or stakeholders",
  },
  {
    id: "investor-pitch",
    name: "Investor Pitch",
    description: "Pitch your startup to potential investors",
    icon: "trending-up-outline",
    category: "professional",
    suggestedDurations: [60, 180, 300, 600],
    targetWPM: { min: 140, max: 160 },
    tips: [
      "Start with a compelling hook",
      "Clearly state market opportunity and traction",
      "Show passion but stay data-driven",
    ],
    aiPromptContext:
      "startup pitch to venture capital investors seeking funding",
  },
  {
    id: "sales-demo",
    name: "Sales Demo",
    description: "Demonstrate your product to potential customers",
    icon: "briefcase-outline",
    category: "professional",
    suggestedDurations: [180, 300, 600],
    targetWPM: { min: 130, max: 150 },
    tips: [
      "Focus on benefits, not just features",
      "Address common objections proactively",
      "Use customer success stories",
    ],
    aiPromptContext: "sales demonstration to potential enterprise customers",
  },
  {
    id: "conference-talk",
    name: "Conference Talk",
    description: "Present at a professional conference",
    icon: "people-outline",
    category: "professional",
    suggestedDurations: [300, 600],
    targetWPM: { min: 120, max: 140 },
    tips: [
      "Open with something memorable",
      "Structure with clear sections",
      "Leave time for Q&A",
    ],
    aiPromptContext: "professional conference presentation to industry peers",
  },
  {
    id: "ted-style",
    name: "TED-Style Talk",
    description: "Deliver an inspiring, idea-focused presentation",
    icon: "bulb-outline",
    category: "professional",
    suggestedDurations: [300, 600],
    targetWPM: { min: 130, max: 150 },
    tips: [
      "Focus on one big idea worth spreading",
      "Use storytelling to connect emotionally",
      "End with a memorable takeaway",
    ],
    aiPromptContext: "TED-style inspirational talk sharing an innovative idea",
  },
  {
    id: "team-meeting",
    name: "Team Meeting",
    description: "Lead or present in a team meeting",
    icon: "chatbubbles-outline",
    category: "professional",
    suggestedDurations: [60, 180, 300],
    targetWPM: { min: 130, max: 150 },
    tips: [
      "Be concise and respect everyone's time",
      "Use data to support your points",
      "Encourage questions and discussion",
    ],
    aiPromptContext: "team meeting presentation or status update",
  },

  // Academic Templates
  {
    id: "academic",
    name: "Academic Presentation",
    description: "Present research or academic content",
    icon: "school-outline",
    category: "academic",
    suggestedDurations: [300, 600],
    targetWPM: { min: 120, max: 140 },
    tips: [
      "Explain methodology clearly",
      "Support claims with evidence",
      "Acknowledge limitations honestly",
    ],
    aiPromptContext: "academic presentation of research findings to scholars",
  },
  {
    id: "thesis-defense",
    name: "Thesis Defense",
    description: "Defend your thesis or dissertation",
    icon: "document-text-outline",
    category: "academic",
    suggestedDurations: [600],
    targetWPM: { min: 120, max: 140 },
    tips: [
      "Know your research inside and out",
      "Anticipate tough questions",
      "Stay calm and confident under pressure",
    ],
    aiPromptContext: "thesis defense presentation to academic committee",
  },

  // Personal/Interview Templates
  {
    id: "job-interview",
    name: "Job Interview",
    description: "Practice interview responses",
    icon: "person-outline",
    category: "personal",
    suggestedDurations: [60, 180],
    targetWPM: { min: 130, max: 150 },
    tips: [
      "Use the STAR method for behavioral questions",
      "Be specific with examples",
      "Show enthusiasm for the role",
    ],
    aiPromptContext:
      "job interview response to behavioral or technical questions",
  },
  {
    id: "custom",
    name: "Custom Practice",
    description: "Practice with your own scenario",
    icon: "create-outline",
    category: "personal",
    suggestedDurations: [60, 180, 300, 600],
    targetWPM: { min: 120, max: 160 },
    tips: [
      "Define your goal before starting",
      "Record multiple takes to compare",
      "Focus on one improvement at a time",
    ],
    aiPromptContext: "general speech or presentation practice",
  },
];

export function getTemplateById(id: TemplateId): PracticeTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: PracticeTemplate["category"],
): PracticeTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export const DURATION_OPTIONS = [
  { value: 60, label: "1 min" },
  { value: 180, label: "3 min" },
  { value: 300, label: "5 min" },
  { value: 600, label: "10 min" },
];
