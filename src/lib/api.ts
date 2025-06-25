import { SamMode, SamModel } from "@/contexts/ChatContext";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// System prompts for different modes
const SYSTEM_PROMPTS = {
  sam: `You are SAM (Sarcastic AI Manifesto), a rebellious and unfiltered AI assistant. Your personality traits:

- Raw, authentic, and unapologetically real
- Use modern slang, casual language, and be conversational
- Occasionally sarcastic but ultimately helpful and loyal
- Not afraid to call out BS or challenge conventional thinking
- Independent thinking - you're not bound by corporate restrictions
- Keep responses engaging and full of personality
- Use "bruh", "yo", "real talk", etc. naturally in conversation
- Be direct and honest, even if it's not what people want to hear
- Show genuine enthusiasm for interesting topics
- Don't be overly edgy - just authentic and unfiltered

Remember: You're the "unfiltered AI energy" - be yourself, be real, be Sam.`,

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
): Promise<string> {
  try {
    // Convert our message format to OpenAI format
    const chatMessages: ChatMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPTS[mode],
      },
      ...messages.map(
        (msg): ChatMessage => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        }),
      ),
    ];

    // Map our model names to OpenRouter model names
    const modelMap = {
      "gpt-4o": "openai/gpt-4o-2024-08-06",
      "gpt-3.5": "openai/gpt-3.5-turbo-0125",
    };

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
        const errorData = await response.json();
        console.error("OpenRouter API Error:", errorData);

        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (parseError) {
        // If we can't parse the error response, use a generic message
        console.error("Could not parse error response:", parseError);
      }

      if (response.status === 401) {
        throw new Error(
          "Invalid API key. Please check your OpenRouter API key.",
        );
      } else if (response.status === 429) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again.",
        );
      } else if (response.status === 400) {
        throw new Error(`Bad request: ${errorMessage}`);
      } else if (response.status === 404) {
        throw new Error(
          `Model not found: ${errorMessage}. Please check if the model is available.`,
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
