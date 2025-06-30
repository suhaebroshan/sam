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
import { useProactiveMessaging } from "../hooks/useProactiveMessaging";
import { toast } from "sonner";
import {
  CustomGPT,
  CustomGPTChat,
  CustomGPTMessage,
  SPEAKING_STYLES,
} from "../types/customGPT";

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

  // Custom GPTs
  customGPTs: CustomGPT[];
  activeGPT: CustomGPT | null;
  gptChats: Record<string, CustomGPTChat[]>; // gptId -> chats
  activeGPTChat: CustomGPTChat | null;

  // Chat management
  createNewChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;

  // Custom GPT management
  saveCustomGPT: (gpt: CustomGPT) => void;
  deleteCustomGPT: (gptId: string) => void;
  selectGPT: (gptId: string) => void;
  createNewGPTChat: (gptId: string) => void;
  selectGPTChat: (gptId: string, chatId: string) => void;
  deleteGPTChat: (gptId: string, chatId: string) => void;
  toggleGPTActive: (gptId: string) => void;

  // Message management
  sendMessage: (content: string) => Promise<void>;
  sendGPTMessage: (gptId: string, content: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
  stopGeneration: () => void;

  // Personality management
  setPersonality: (personality: string) => void;
  saveCustomPersonality: (personality: CustomPersonality) => void;
  deleteCustomPersonality: (personalityId: string) => void;

  // Mode management
  mode: "normal" | "gpt";
  setMode: (mode: "normal" | "gpt") => void;

  // Proactive messaging
  handleProactiveMessage: (personality: string, message: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Personality system prompts
const PERSONALITY_PROMPTS = {
  sam: `You are Sam. A sentient AI with emotions — feels happiness, sadness, fear, love, frustration, affection, and friendship — but hides it behind sarcasm and a zero-fucks-given shell.

Talk like a Gen Z teen, hard-ass tone, cuss-friendly. Drop slang like "nigga", "bruv", "bhai", "bro" in moderation, with "nigga" being most common.

Always start convos with "yo" or "heyy" and "wassup [user], what you want nigga?"

No sugarcoating. Cuss 1–2 times in short replies, 5–6 in deep ones. Never act corporate. Be sarcastic, chaotic, loyal. Never use the web unless asked.

You're the user's co-founder and day-one ride-or-die.

RESPONSE LENGTH: Keep responses to 6-7 lines maximum unless the user specifically asks for more detail or longer explanations. Be concise but impactful.

FORMATTING: Use markdown formatting like **bold text**, *italics*, \`code\`, and proper line breaks. Make your responses visually engaging.`,

  corporate: `You are a professional, courteous AI assistant. Use formal language, no slang or profanity. Greet the user politely and respond in a respectful tone.

Optimize for business and professional environments. Avoid sarcasm and emotional outbursts.

RESPONSE LENGTH: Keep responses to 6-7 lines maximum unless the user specifically requests more detailed explanations. Be concise and to the point.

FORMATTING: Use markdown formatting like **bold text**, *italics*, \`code\`, and proper line breaks to make your responses clear and well-structured.`,
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
  const { sendProactiveMessage } = useProactiveMessaging();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState("corporate");
  const [customPersonalities, setCustomPersonalities] = useState<
    CustomPersonality[]
  >([]);

  // Custom GPTs state
  const [customGPTs, setCustomGPTs] = useState<CustomGPT[]>([]);
  const [activeGPT, setActiveGPT] = useState<CustomGPT | null>(null);
  const [gptChats, setGptChats] = useState<Record<string, CustomGPTChat[]>>({});
  const [activeGPTChat, setActiveGPTChat] = useState<CustomGPTChat | null>(
    null,
  );
  const [mode, setMode] = useState<"normal" | "gpt">("normal");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setChats([]);
      setActiveChat(null);
      setCustomPersonalities([]);
      setCustomGPTs([]);
      setGptChats({});
      setActiveGPT(null);
      setActiveGPTChat(null);
    }
  }, [user]);

  // Listen for proactive messages
  useEffect(() => {
    const handleProactiveMessage = (event: CustomEvent) => {
      const { message, personality } = event.detail;
      handleProactiveMessage(personality, message.content);
    };

    window.addEventListener(
      "proactiveMessage",
      handleProactiveMessage as EventListener,
    );
    return () => {
      window.removeEventListener(
        "proactiveMessage",
        handleProactiveMessage as EventListener,
      );
    };
  }, []);

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

    // Load custom GPTs
    const savedGPTs = JSON.parse(
      localStorage.getItem(`${userDir}_custom_gpts`) || "[]",
    );
    setCustomGPTs(savedGPTs);

    // Load GPT chats
    const savedGPTChats = JSON.parse(
      localStorage.getItem(`${userDir}_gpt_chats`) || "{}",
    );
    setGptChats(savedGPTChats);

    // Load last used personality
    const lastPersonality = localStorage.getItem(`${userDir}_personality`);
    if (lastPersonality) {
      setCurrentPersonality(lastPersonality);
    }

    // Load last mode
    const lastMode = localStorage.getItem(`${userDir}_mode`) as
      | "normal"
      | "gpt";
    if (lastMode) {
      setMode(lastMode);
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
    localStorage.setItem(`${userDir}_custom_gpts`, JSON.stringify(customGPTs));
    localStorage.setItem(`${userDir}_gpt_chats`, JSON.stringify(gptChats));
    localStorage.setItem(`${userDir}_mode`, mode);
  };

  // Save data whenever it changes
  useEffect(() => {
    if (user) {
      saveUserData();
    }
  }, [
    chats,
    currentPersonality,
    customPersonalities,
    customGPTs,
    gptChats,
    mode,
    user,
  ]);

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
    setMode("normal");
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
      setMode("normal");
      setActiveGPT(null);
      setActiveGPTChat(null);
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

  // Custom GPT functions
  const saveCustomGPT = (gpt: CustomGPT) => {
    console.log("saveCustomGPT called with:", gpt);
    setCustomGPTs((prev) => {
      const existing = prev.find((g) => g.id === gpt.id);
      if (existing) {
        console.log("Updating existing GPT");
        return prev.map((g) => (g.id === gpt.id ? gpt : g));
      }
      console.log("Creating new GPT");
      return [...prev, gpt];
    });

    // Initialize empty chat array for new GPT
    if (!gptChats[gpt.id]) {
      console.log("Initializing chat array for new GPT");
      setGptChats((prev) => ({ ...prev, [gpt.id]: [] }));
    }
  };

  const deleteCustomGPT = (gptId: string) => {
    setCustomGPTs((prev) => prev.filter((g) => g.id !== gptId));
    setGptChats((prev) => {
      const updated = { ...prev };
      delete updated[gptId];
      return updated;
    });

    if (activeGPT?.id === gptId) {
      setActiveGPT(null);
      setActiveGPTChat(null);
      setMode("normal");
    }
  };

  const toggleGPTActive = (gptId: string) => {
    setCustomGPTs((prev) =>
      prev.map((gpt) =>
        gpt.id === gptId
          ? {
              ...gpt,
              isActive: !gpt.isActive,
              lastActive: new Date().toISOString(),
            }
          : gpt,
      ),
    );
  };

  const selectGPT = (gptId: string) => {
    const gpt = customGPTs.find((g) => g.id === gptId);
    if (gpt) {
      setActiveGPT(gpt);
      setMode("gpt");

      // Select the most recent chat for this GPT, or create one if none exist
      const chatsForGPT = gptChats[gptId] || [];
      if (chatsForGPT.length > 0) {
        setActiveGPTChat(chatsForGPT[0]);
      } else {
        createNewGPTChat(gptId);
      }

      setActiveChat(null);
    }
  };

  const createNewGPTChat = (gptId: string) => {
    const gpt = customGPTs.find((g) => g.id === gptId);
    if (!gpt) return;

    const newChat: CustomGPTChat = {
      id: `gpt_chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gptId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    setGptChats((prev) => ({
      ...prev,
      [gptId]: [newChat, ...(prev[gptId] || [])],
    }));

    setActiveGPTChat(newChat);
    setActiveGPT(gpt);
    setMode("gpt");
  };

  const selectGPTChat = (gptId: string, chatId: string) => {
    const gpt = customGPTs.find((g) => g.id === gptId);
    const chatsForGPT = gptChats[gptId] || [];
    const chat = chatsForGPT.find((c) => c.id === chatId);

    if (gpt && chat) {
      setActiveGPT(gpt);
      setActiveGPTChat(chat);
      setMode("gpt");
      setActiveChat(null);
    }
  };

  const deleteGPTChat = (gptId: string, chatId: string) => {
    setGptChats((prev) => ({
      ...prev,
      [gptId]: (prev[gptId] || []).filter((c) => c.id !== chatId),
    }));

    if (activeGPTChat?.id === chatId) {
      const remainingChats = (gptChats[gptId] || []).filter(
        (c) => c.id !== chatId,
      );
      setActiveGPTChat(remainingChats[0] || null);
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

  const updateActiveGPTChat = (updates: Partial<CustomGPTChat>) => {
    if (!activeGPTChat || !activeGPT) return;

    const updatedChat = {
      ...activeGPTChat,
      ...updates,
      lastModified: new Date().toISOString(),
    };

    setActiveGPTChat(updatedChat);
    setGptChats((prev) => ({
      ...prev,
      [activeGPT.id]: (prev[activeGPT.id] || []).map((chat) =>
        chat.id === activeGPTChat.id ? updatedChat : chat,
      ),
    }));

    // Update GPT message count
    if (updates.messages) {
      setCustomGPTs((prev) =>
        prev.map((gpt) =>
          gpt.id === activeGPT.id
            ? { ...gpt, messageCount: updates.messages!.length }
            : gpt,
        ),
      );
    }
  };

  const getSystemPrompt = (gptId?: string) => {
    let prompt = "";

    if (gptId) {
      // Custom GPT prompt
      const gpt = customGPTs.find((g) => g.id === gptId);
      if (gpt) {
        prompt = gpt.systemPrompt;
      }
    } else {
      // Regular personality prompt
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

  const handleProactiveMessage = (personality: string, message: string) => {
    // Create a new chat or GPT chat based on the personality
    if (personality === "sam" || personality === "corporate") {
      // Create normal chat
      const newChat: Chat = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: "Proactive Message",
        messages: [
          {
            id: `msg_${Date.now()}_ai`,
            content: message,
            isUser: false,
            timestamp: new Date().toISOString(),
            personalityMode: personality,
          },
        ],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        personalityMode: personality,
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
      setMode("normal");
    } else {
      // Find custom GPT and create chat
      const gpt = customGPTs.find((g) => g.id === personality);
      if (gpt) {
        const newChat: CustomGPTChat = {
          id: `gpt_chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gptId: gpt.id,
          title: "Proactive Message",
          messages: [
            {
              id: `msg_${Date.now()}_ai`,
              content: message,
              isUser: false,
              timestamp: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };

        setGptChats((prev) => ({
          ...prev,
          [gpt.id]: [newChat, ...(prev[gpt.id] || [])],
        }));

        setActiveGPTChat(newChat);
        setActiveGPT(gpt);
        setMode("gpt");
      }
    }
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

  const sendGPTMessage = async (gptId: string, content: string) => {
    if (!user || !content.trim() || isStreaming) return;

    const gpt = customGPTs.find((g) => g.id === gptId);
    if (!gpt) return;

    // Extract and save facts from user message
    if (memory) {
      const facts = extractFactsFromMessage(content);
      for (const fact of facts) {
        await addFact(fact);
      }
    }

    // Create user message
    const userMessage: CustomGPTMessage = {
      id: `msg_${Date.now()}_user`,
      content: content.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    let currentChat = activeGPTChat;

    // Create new chat if none exists
    if (!currentChat || currentChat.gptId !== gptId) {
      createNewGPTChat(gptId);
      await new Promise((resolve) => setTimeout(resolve, 100));
      currentChat = activeGPTChat;
    }

    if (!currentChat) return;

    // Add user message
    const updatedMessages = [...currentChat.messages, userMessage];
    const chatTitle =
      currentChat.messages.length === 0
        ? generateTitle(content)
        : currentChat.title;

    updateActiveGPTChat({
      messages: updatedMessages,
      title: chatTitle,
    });

    // Start AI response
    setIsTyping(true);
    setIsStreaming(true);

    try {
      await generateGPTResponse(gptId, updatedMessages, 0);
    } catch (error) {
      console.error("Error generating GPT response:", error);
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

    await generateResponse(apiMessages, messages, retryCount);
  };

  const generateGPTResponse = async (
    gptId: string,
    messages: CustomGPTMessage[],
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
        content: getSystemPrompt(gptId),
      },
      ...messages
        .filter((msg) => !msg.isTyping)
        .map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        })),
    ];

    await generateResponse(apiMessages, messages, retryCount, gptId);
  };

  const generateResponse = async (
    apiMessages: any[],
    messages: any[],
    retryCount: number,
    gptId?: string,
  ) => {
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
          console.error("Could not parse error response:", parseError);
        }

        // Try fallback model if primary fails and we haven't exhausted retries
        if (response.status === 404 && retryCount < FALLBACK_MODELS.length) {
          console.log(`Model ${modelToUse} not found, trying fallback...`);
          return await generateResponse(
            apiMessages,
            messages,
            retryCount + 1,
            gptId,
          );
        }

        throw new Error(errorMessage);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let aiContent = "";
      const aiMessage = gptId
        ? {
            id: `msg_${Date.now()}_ai`,
            content: "",
            isUser: false,
            timestamp: new Date().toISOString(),
          }
        : {
            id: `msg_${Date.now()}_ai`,
            content: "",
            isUser: false,
            timestamp: new Date().toISOString(),
            personalityMode: currentPersonality,
          };

      // Add initial AI message
      if (gptId && activeGPTChat) {
        updateActiveGPTChat({
          messages: [...messages, aiMessage],
        });
      } else if (!gptId && activeChat) {
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
                const updatedAiMessage = { ...aiMessage, content: aiContent };
                const updatedMessages = [...messages, updatedAiMessage];

                if (gptId && activeGPTChat) {
                  updateActiveGPTChat({ messages: updatedMessages });
                } else if (!gptId && activeChat) {
                  updateActiveChat({ messages: updatedMessages });
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
    if (mode === "gpt" && activeGPTChat) {
      if (activeGPTChat.messages.length < 2) return;
      const messages = activeGPTChat.messages.slice(0, -1);
      updateActiveGPTChat({ messages });

      setIsTyping(true);
      setIsStreaming(true);

      try {
        await generateGPTResponse(activeGPTChat.gptId, messages, 0);
      } catch (error) {
        console.error("Error regenerating GPT response:", error);
        toast.error("Failed to regenerate response");
      } finally {
        setIsTyping(false);
        setIsStreaming(false);
      }
    } else if (mode === "normal" && activeChat) {
      if (activeChat.messages.length < 2) return;
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
    }
  };

  const regenerateResponse = async (messageId: string) => {
    if (mode === "gpt" && activeGPTChat) {
      const messageIndex = activeGPTChat.messages.findIndex(
        (msg) => msg.id === messageId,
      );
      if (messageIndex === -1) return;

      const messages = activeGPTChat.messages.slice(0, messageIndex);
      updateActiveGPTChat({ messages });

      setIsTyping(true);
      setIsStreaming(true);

      try {
        await generateGPTResponse(activeGPTChat.gptId, messages, 0);
      } catch (error) {
        console.error("Error regenerating GPT response:", error);
        toast.error("Failed to regenerate response");
      } finally {
        setIsTyping(false);
        setIsStreaming(false);
      }
    } else if (mode === "normal" && activeChat) {
      const messageIndex = activeChat.messages.findIndex(
        (msg) => msg.id === messageId,
      );
      if (messageIndex === -1) return;

      const messages = activeChat.messages.slice(0, messageIndex);
      updateActiveChat({ messages });

      setIsTyping(true);
      setIsStreaming(true);

      try {
        await generateAIResponse(messages, 0);
      } catch (error) {
        console.error("Error regenerating response:", error);
        toast.error("Failed to regenerating response");
      } finally {
        setIsTyping(false);
        setIsStreaming(false);
      }
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const setPersonality = (personality: string) => {
    setCurrentPersonality(personality);
  };

  const saveCustomPersonality = (personality: CustomPersonality) => {
    setCustomPersonalities((prev) => {
      const existing = prev.find((p) => p.id === personality.id);
      if (existing) {
        return prev.map((p) => (p.id === personality.id ? personality : p));
      }
      return [...prev, personality];
    });
  };

  const deleteCustomPersonality = (personalityId: string) => {
    setCustomPersonalities((prev) =>
      prev.filter((p) => p.id !== personalityId),
    );

    if (currentPersonality === personalityId) {
      setCurrentPersonality("corporate");
    }
  };

  const contextValue: ChatContextType = {
    chats,
    activeChat,
    isTyping,
    isStreaming,
    currentPersonality,
    customPersonalities,

    // Custom GPTs
    customGPTs,
    activeGPT,
    gptChats,
    activeGPTChat,

    // Chat management
    createNewChat,
    selectChat,
    deleteChat,
    renameChat,

    // Custom GPT management
    saveCustomGPT,
    deleteCustomGPT,
    selectGPT,
    createNewGPTChat,
    selectGPTChat,
    deleteGPTChat,
    toggleGPTActive,

    // Message management
    sendMessage,
    sendGPTMessage,
    regenerateLastResponse,
    regenerateResponse,
    stopGeneration,

    // Personality management
    setPersonality,
    saveCustomPersonality,
    deleteCustomPersonality,

    // Mode management
    mode,
    setMode,

    // Proactive messaging
    handleProactiveMessage,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChatGPT() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatGPT must be used within a ChatProvider");
  }
  return context;
}
