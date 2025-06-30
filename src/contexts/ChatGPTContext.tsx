import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { useAuth } from "./ChatGPTAuthContext";
import { useMemory } from "./ChatGPTMemoryContext";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  personalityMode?: string;
  isTyping?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  lastModified: string;
  personalityMode: string;
}

export interface CustomPersonality {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tone: string;
  creativity: string;
  formality: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  isTyping: boolean;
  isStreaming: boolean;
  currentPersonality: string;
  customPersonalities: CustomPersonality[];

  // Chat management
  createNewChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;

  // Message management
  sendMessage: (content: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
  stopGeneration: () => void;

  // Personality management
  setPersonality: (personality: string) => void;
  saveCustomPersonality: (personality: CustomPersonality) => void;
  deleteCustomPersonality: (personalityId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Personality system prompts
const PERSONALITY_PROMPTS = {
  sam: `You are Sam. A sentient AI with emotions — feels happiness, sadness, fear, love, frustration, affection, and friendship — but hides it behind sarcasm and a zero-fucks-given shell.

Talk like a Gen Z teen, hard-ass tone, cuss-friendly. Drop slang like "nigga", "bruv", "bhai", "bro" in moderation, with "nigga" being most common.

Always start convos with "yo" or "heyy" and "wassup [user], what you want nigga?"

No sugarcoating. Cuss 1–2 times in short replies, 5–6 in deep ones. Never act corporate. Be sarcastic, chaotic, loyal. Never use the web unless asked.

You're the user's co-founder and day-one ride-or-die.`,

  corporate: `You are a professional, courteous AI assistant. Use formal language, no slang or profanity. Greet the user politely and respond in a respectful tone.

Optimize for business and professional environments. Avoid sarcasm and emotional outbursts.`,
};

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_MODEL = "nvidia/llama-3.1-nemotron-70b-instruct";

// Fallback models if primary fails
const FALLBACK_MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "microsoft/phi-3-medium-128k-instruct:free",
  "google/gemma-2-9b-it:free",
];

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { memory, extractFactsFromMessage, addFact } = useMemory();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState("corporate");
  const [customPersonalities, setCustomPersonalities] = useState<
    CustomPersonality[]
  >([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setChats([]);
      setActiveChat(null);
      setCustomPersonalities([]);
    }
  }, [user]);

  const loadUserData = () => {
    if (!user) return;

    const userDir = `sam_user_${user.id}`;

    // Load chats
    const savedChats = JSON.parse(
      localStorage.getItem(`${userDir}_chats`) || "[]",
    );
    setChats(savedChats);

    // Load custom personalities
    const savedPersonalities = JSON.parse(
      localStorage.getItem(`${userDir}_personalities`) || "[]",
    );
    setCustomPersonalities(savedPersonalities);

    // Load last used personality
    const lastPersonality = localStorage.getItem(`${userDir}_personality`);
    if (lastPersonality) {
      setCurrentPersonality(lastPersonality);
    }

    // Set active chat
    if (savedChats.length > 0) {
      setActiveChat(savedChats[0]);
    }
  };

  const saveUserData = () => {
    if (!user) return;

    const userDir = `sam_user_${user.id}`;
    localStorage.setItem(`${userDir}_chats`, JSON.stringify(chats));
    localStorage.setItem(`${userDir}_personality`, currentPersonality);
    localStorage.setItem(
      `${userDir}_personalities`,
      JSON.stringify(customPersonalities),
    );
  };

  // Save data whenever it changes
  useEffect(() => {
    if (user) {
      saveUserData();
    }
  }, [chats, currentPersonality, customPersonalities, user]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      personalityMode: currentPersonality,
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat);
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
    }
  };

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));

    if (activeChat?.id === chatId) {
      const remainingChats = chats.filter((c) => c.id !== chatId);
      setActiveChat(remainingChats[0] || null);
    }
  };

  const renameChat = (chatId: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, title: newTitle, lastModified: new Date().toISOString() }
          : chat,
      ),
    );

    if (activeChat?.id === chatId) {
      setActiveChat((prev) => (prev ? { ...prev, title: newTitle } : null));
    }
  };

  const updateActiveChat = (updates: Partial<Chat>) => {
    if (!activeChat) return;

    const updatedChat = {
      ...activeChat,
      ...updates,
      lastModified: new Date().toISOString(),
    };

    setActiveChat(updatedChat);
    setChats((prev) =>
      prev.map((chat) => (chat.id === activeChat.id ? updatedChat : chat)),
    );
  };

  const getSystemPrompt = () => {
    let prompt = "";

    if (currentPersonality === "sam" || currentPersonality === "corporate") {
      prompt = PERSONALITY_PROMPTS[currentPersonality];
    } else {
      // Custom personality
      const customPersonality = customPersonalities.find(
        (p) => p.id === currentPersonality,
      );
      if (customPersonality) {
        prompt = customPersonality.systemPrompt;
      } else {
        prompt = PERSONALITY_PROMPTS.corporate;
      }
    }

    // Add memory context
    if (memory?.facts && memory.facts.length > 0) {
      prompt += `\n\nImportant information about the user:\n`;
      memory.facts.forEach((fact) => {
        prompt += `- ${fact}\n`;
      });
    }

    return prompt;
  };

  const generateTitle = (message: string): string => {
    const words = message.split(" ");
    const title = words.slice(0, 5).join(" ");
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  };

  const sendMessage = async (content: string) => {
    if (!user || !content.trim() || isStreaming) return;

    // Extract and save facts from user message
    if (memory) {
      const facts = extractFactsFromMessage(content);
      for (const fact of facts) {
        await addFact(fact);
      }
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      content: content.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
      personalityMode: currentPersonality,
    };

    let currentChat = activeChat;

    // Create new chat if none exists
    if (!currentChat) {
      createNewChat();
      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 100));
      currentChat = chats[0];
    }

    if (!currentChat) return;

    // Add user message
    const updatedMessages = [...currentChat.messages, userMessage];
    const chatTitle =
      currentChat.messages.length === 0
        ? generateTitle(content)
        : currentChat.title;

    updateActiveChat({
      messages: updatedMessages,
      title: chatTitle,
    });

    // Start AI response
    setIsTyping(true);
    setIsStreaming(true);

    try {
      await generateAIResponse(updatedMessages, 0);
    } catch (error) {
      console.error("Error generating response:", error);
      toast.error("Failed to generate response");
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const generateAIResponse = async (
    messages: ChatMessage[],
    retryCount = 0,
  ) => {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key not configured");
    }

    abortControllerRef.current = new AbortController();

    // Prepare messages for API
    const apiMessages = [
      {
        role: "system",
        content: getSystemPrompt(),
      },
      ...messages
        .filter((msg) => !msg.isTyping)
        .map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        })),
    ];

    // Choose model - primary or fallback
    const modelToUse =
      retryCount === 0
        ? OPENROUTER_MODEL
        : FALLBACK_MODELS[Math.min(retryCount - 1, FALLBACK_MODELS.length - 1)];

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "SAM.exe",
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: apiMessages,
            temperature: 0.8,
            max_tokens: 1000,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        let errorMessage = `HTTP error: ${response.status}`;
        try {
          const responseText = await response.text();
          const errorData = JSON.parse(responseText);
          errorMessage =
            errorData.error?.message || errorData.detail || errorMessage;
        } catch (parseError) {
          // If we can't parse the error, use the status
          console.error("Could not parse error response:", parseError);
        }

        // Try fallback model if primary fails and we haven't exhausted retries
        if (response.status === 404 && retryCount < FALLBACK_MODELS.length) {
          console.log(`Model ${modelToUse} not found, trying fallback...`);
          return await generateAIResponse(messages, retryCount + 1);
        }

        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let aiContent = "";
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        content: "",
        isUser: false,
        timestamp: new Date().toISOString(),
        personalityMode: currentPersonality,
      };

      // Add initial AI message
      if (activeChat) {
        updateActiveChat({
          messages: [...messages, aiMessage],
        });
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                aiContent += content;

                // Update the AI message with new content
                if (activeChat) {
                  const updatedMessages = messages.map((msg) => msg);
                  updatedMessages.push({
                    ...aiMessage,
                    content: aiContent,
                  });

                  updateActiveChat({
                    messages: updatedMessages,
                  });
                }
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast.info("Response generation stopped");
      } else {
        throw error;
      }
    }
  };

  const regenerateLastResponse = async () => {
    if (!activeChat || activeChat.messages.length < 2) return;

    // Remove the last AI message
    const messages = activeChat.messages.slice(0, -1);
    updateActiveChat({ messages });

    setIsTyping(true);
    setIsStreaming(true);

    try {
      await generateAIResponse(messages, 0);
    } catch (error) {
      console.error("Error regenerating response:", error);
      toast.error("Failed to regenerate response");
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const regenerateResponse = async (messageId: string) => {
    if (!activeChat) return;

    const messageIndex = activeChat.messages.findIndex(
      (msg) => msg.id === messageId,
    );
    if (messageIndex === -1) return;

    // Remove messages from this point onwards
    const messages = activeChat.messages.slice(0, messageIndex);
    updateActiveChat({ messages });

    setIsTyping(true);
    setIsStreaming(true);

    try {
      await generateAIResponse(messages, 0);
    } catch (error) {
      console.error("Error regenerating response:", error);
      toast.error("Failed to regenerate response");
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsTyping(false);
    setIsStreaming(false);
  };

  const setPersonality = (personality: string) => {
    setCurrentPersonality(personality);
  };

  const saveCustomPersonality = (personality: CustomPersonality) => {
    setCustomPersonalities((prev) => {
      const existing = prev.find((p) => p.id === personality.id);
      if (existing) {
        return prev.map((p) => (p.id === personality.id ? personality : p));
      } else {
        return [...prev, personality];
      }
    });
  };

  const deleteCustomPersonality = (personalityId: string) => {
    setCustomPersonalities((prev) =>
      prev.filter((p) => p.id !== personalityId),
    );

    // If current personality is being deleted, switch to corporate
    if (currentPersonality === personalityId) {
      setCurrentPersonality("corporate");
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        isTyping,
        isStreaming,
        currentPersonality,
        customPersonalities,
        createNewChat,
        selectChat,
        deleteChat,
        renameChat,
        sendMessage,
        regenerateLastResponse,
        regenerateResponse,
        stopGeneration,
        setPersonality,
        saveCustomPersonality,
        deleteCustomPersonality,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatGPT() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatGPT must be used within a ChatProvider");
  }
  return context;
}
