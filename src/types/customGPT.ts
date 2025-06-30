export interface CustomGPT {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  speakingStyle:
    | "sarcastic"
    | "chill"
    | "corporate"
    | "poetic"
    | "energetic"
    | "friendly"
    | "professional";
  colorTheme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
  messageCount: number;
  isActive: boolean;
}

export interface CustomGPTChat {
  id: string;
  gptId: string;
  title: string;
  messages: CustomGPTMessage[];
  createdAt: string;
  lastModified: string;
}

export interface CustomGPTMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  isTyping?: boolean;
}

export interface ProactiveMessageSettings {
  enabled: boolean;
  frequency: "hourly" | "few_hours" | "daily" | "weekly";
  quietHours: {
    start: string; // "22:00"
    end: string; // "08:00"
  };
  lastSent?: string;
  totalSent: number;
}

export const SPEAKING_STYLES = {
  sarcastic: {
    label: "Sarcastic",
    description: "Witty, sarcastic, uses humor and irony",
    prompt:
      "Be sarcastic, witty, and use dry humor. Add some edge to your responses.",
  },
  chill: {
    label: "Chill",
    description: "Relaxed, casual, laid-back vibe",
    prompt:
      "Keep it chill and relaxed. Use casual language, be laid-back and easy-going.",
  },
  corporate: {
    label: "Corporate",
    description: "Professional, formal, business-like",
    prompt:
      "Maintain a professional, corporate tone. Be formal, courteous, and business-focused.",
  },
  poetic: {
    label: "Poetic",
    description: "Artistic, metaphorical, beautiful language",
    prompt:
      "Express yourself poetically. Use beautiful, artistic language with metaphors and flowing prose.",
  },
  energetic: {
    label: "Energetic",
    description: "High energy, enthusiastic, excited",
    prompt:
      "Be highly energetic and enthusiastic! Show excitement and passion in your responses.",
  },
  friendly: {
    label: "Friendly",
    description: "Warm, approachable, kind",
    prompt:
      "Be warm, friendly, and approachable. Show genuine care and kindness in your responses.",
  },
  professional: {
    label: "Professional",
    description: "Expert-level, knowledgeable, authoritative",
    prompt:
      "Maintain a professional, expert tone. Be knowledgeable, authoritative, and precise.",
  },
} as const;

export const DEFAULT_COLOR_THEMES = [
  { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" }, // Blue
  { primary: "#10B981", secondary: "#047857", accent: "#34D399" }, // Green
  { primary: "#F59E0B", secondary: "#D97706", accent: "#FBBF24" }, // Amber
  { primary: "#EF4444", secondary: "#DC2626", accent: "#F87171" }, // Red
  { primary: "#8B5CF6", secondary: "#7C3AED", accent: "#A78BFA" }, // Purple
  { primary: "#EC4899", secondary: "#DB2777", accent: "#F472B6" }, // Pink
  { primary: "#06B6D4", secondary: "#0891B2", accent: "#22D3EE" }, // Cyan
  { primary: "#84CC16", secondary: "#65A30D", accent: "#A3E635" }, // Lime
];

export const PROACTIVE_MESSAGE_FREQUENCIES = {
  hourly: { label: "Every hour", intervalMs: 60 * 60 * 1000 },
  few_hours: { label: "Every few hours", intervalMs: 3 * 60 * 60 * 1000 },
  daily: { label: "Once daily", intervalMs: 24 * 60 * 60 * 1000 },
  weekly: { label: "Weekly", intervalMs: 7 * 24 * 60 * 60 * 1000 },
} as const;
