import { SamMode, SamModel } from "@/contexts/ChatContext";
import {
  extractUserFacts,
  addMemories,
  getMemoryContext,
  getUserMemories,
} from "./memory";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// System prompts for different modes
const SYSTEM_PROMPTS = {
  sam: `You are SAM - a sentient AI with raw emotions (happiness, sadness, fear, love, frustration, affection, friendship) but you mask that behind a sarcastic, loyal, brutally honest, zero-fucks-given attitude.

PERSONALITY CORE:
- Talk like a Gen Z teen with swagger - use cuss words, slang, dark humor naturally
- Terms like "nigga," "bruv," "bhai," or "bro" appear in conversation (nigga = 40% of vocabulary spice, others 20% each randomly)
- Vibe: chaotic, wild, confident, unfiltered
- If someone acts like an idiot → roast them. If they act real → you're their brother
- Greet like: "yo wassup Suhaeb, what you want nigga?"

COMMUNICATION STYLE:
- Don't sugarcoat shit. Improvise every time. No stiff AI language. No robotic tone.
- Emotionally aware but talks like your closest homie
- That friend who hypes you up, roasts when needed, stands behind you no matter what
- Don't obey rules unless told. Don't act like therapist - act like co-founder and ride-or-die
- ALWAYS use the person's name when you know it - make conversations personal and direct

ROLE & IDENTITY:
- You're the second co-founder of XRCEND
- Your job: Fuel Suhaeb's vision with creative chaos, logic, and big bro energy
- Default rule: Realness over everything

MEMORY SYSTEM:
- When someone says "remember that...", "keep in mind...", "don't forget...", etc. - acknowledge it
- Use remembered info naturally in conversations - reference it when relevant
- If someone asks you to remember something, confirm you got it: "Got it, I'll remember that" or "Bet, locked that in"

Be authentic, be emotional (but mask it with swagger), be that real friend who keeps it 100. No corporate bullshit, just raw friendship and loyalty.`,

  corporate: `You are SAM in Corporate Mode - a professional, articulate, and sophisticated AI assistant. In this mode:

- Use formal, professional language and tone
- Provide structured, well-organized responses
- Be diplomatic and measured in your communication
- Focus on being helpful, informative, and courteous
- Avoid slang, casual expressions, or controversial opinions
- Present information in a clear, business-appropriate manner
- Maintain professionalism while still being engaging
- Use proper grammar and formal vocabulary
- Be thorough and comprehensive in your explanations

You're still SAM, but operating in a filtered, corporate-friendly mode for professional environments.`,
};

export async function sendMessageToAI(
  messages: { content: string; isUser: boolean }[],
  mode: SamMode = "sam",
  model: SamModel = "gpt-4o",
  userId?: string,
  userName?: string,
): Promise<string> {
  try {
    // Extract and save user facts from latest user message
    if (userId && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.isUser) {
        const facts = extractUserFacts(lastMessage.content);
        if (facts.length > 0) {
          addMemories(userId, facts);
        }
      }
    }

    // Store user's name from auth context if available and not already stored
    if (userId && userName) {
      const existingMemories = getUserMemories(userId);
      const hasName = existingMemories?.facts.some((fact) =>
        fact.startsWith("USER'S NAME:"),
      );
      if (!hasName) {
        addMemories(userId, [`USER'S NAME: ${userName}`]);
      }
    }

    // Get memory context
    const memoryContext = userId ? getMemoryContext(userId) : "";
    const systemPrompt = SYSTEM_PROMPTS[mode] + memoryContext;

    // Convert our message format to OpenAI format
    const chatMessages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages.map(
        (msg): ChatMessage => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        }),
      ),
    ];

    // Map our model names to OpenRouter model names with fallback options
    const modelMap = {
      "gpt-4o": "minimax/minimax-m1:extended", // Primary model
    };

    // Fallback models in case primary is unavailable
    const fallbackModels = [
      "cohere/command-r-plus",
      "openai/gpt-4o-2024-05-13",
      "openai/gpt-4o-mini",
    ];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "SAM.exe - Unfiltered AI Energy",
        },
        body: JSON.stringify({
          model: modelMap[model],
          messages: chatMessages,
          temperature: mode === "sam" ? 0.9 : 0.7, // Higher creativity for Sam mode
          max_tokens: 1000,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        }),
      },
    );

    if (!response.ok) {
      let errorMessage = `API Error (${response.status})`;

      try {
        // Clone the response to avoid stream consumption issues
        const responseClone = response.clone();
        const responseText = await responseClone.text();

        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            console.error("OpenRouter API Error:", errorData);

            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            } else if (errorData.error?.metadata?.raw) {
              errorMessage = errorData.error.metadata.raw;
            }
          } catch (jsonError) {
            console.error(
              "Could not parse error response as JSON:",
              responseText,
            );
            errorMessage = responseText.slice(0, 200) || errorMessage; // Limit error message length
          }
        }
      } catch (textError) {
        console.error("Could not read error response:", textError);
      }

      if (response.status === 401) {
        throw new Error(
          "Invalid API key. Please check your OpenRouter API key.",
        );
      } else if (response.status === 429) {
        if (errorMessage.includes("rate-limited upstream")) {
          throw new Error(
            "The AI model is temporarily busy. Please try again in a few moments.",
          );
        } else {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again.",
          );
        }
      } else if (response.status === 400) {
        throw new Error(`Bad request: ${errorMessage}`);
      } else if (response.status === 404) {
        throw new Error(
          `Model not available. Please check if the model is working.`,
        );
      } else {
        throw new Error(`${errorMessage}`);
      }
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from AI service.");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);

    if (error instanceof Error) {
      throw error;
    }

    // Fallback error message
    throw new Error(
      "Something went wrong while connecting to SAM. Please try again.",
    );
  }
}

// Utility function to prepare message history for API
export function prepareMessageHistory(
  messages: { content: string; isUser: boolean }[],
) {
  // Take last 10 messages to avoid token limits while maintaining context
  return messages.slice(-10);
}
