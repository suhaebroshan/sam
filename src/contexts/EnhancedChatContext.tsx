import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./EnhancedAuthContext";
import apiService, { Chat, ChatMessage } from "@/lib/apiService";
import { toast } from "sonner";

export type PersonalityMode = "sam" | "corporate" | "custom";

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  typingUsers: string[];

  // Chat management
  createChat: (
    title?: string,
    personalityMode?: PersonalityMode,
  ) => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  updateChat: (chatId: string, updates: Partial<Chat>) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newTitle: string) => Promise<void>;

  // Message management
  addMessage: (chatId: string, message: ChatMessage) => Promise<void>;
  sendMessage: (
    chatId: string,
    content: string,
    personalityMode?: PersonalityMode,
  ) => Promise<void>;

  // Real-time features
  startTyping: () => void;
  stopTyping: () => void;

  // Utilities
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Load chats when user is authenticated
  useEffect(() => {
    if (user) {
      refreshChats();
    } else {
      setChats([]);
      setActiveChat(null);
    }
  }, [user]);

  // Set up real-time event listeners
  useEffect(() => {
    const handleChatCreated = (chat: Chat) => {
      setChats((prev) => [chat, ...prev]);
      toast.success("New chat created");
    };

    const handleChatUpdated = (updatedChat: Chat) => {
      setChats((prev) =>
        prev.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)),
      );

      if (activeChat?.id === updatedChat.id) {
        setActiveChat(updatedChat);
      }
    };

    const handleChatDeleted = (data: { id: string }) => {
      setChats((prev) => prev.filter((chat) => chat.id !== data.id));

      if (activeChat?.id === data.id) {
        setActiveChat(null);
      }

      toast.info("Chat deleted");
    };

    const handleUserTyping = (data: { username: string; chatId: string }) => {
      if (activeChat?.id === data.chatId && data.username !== user?.username) {
        setTypingUsers((prev) => [...new Set([...prev, data.username])]);
      }
    };

    const handleUserStopTyping = (data: {
      username: string;
      chatId: string;
    }) => {
      setTypingUsers((prev) => prev.filter((name) => name !== data.username));
    };

    apiService.on("chat_created", handleChatCreated);
    apiService.on("chat_updated", handleChatUpdated);
    apiService.on("chat_deleted", handleChatDeleted);
    apiService.on("user_typing", handleUserTyping);
    apiService.on("user_stop_typing", handleUserStopTyping);

    return () => {
      apiService.off("chat_created", handleChatCreated);
      apiService.off("chat_updated", handleChatUpdated);
      apiService.off("chat_deleted", handleChatDeleted);
      apiService.off("user_typing", handleUserTyping);
      apiService.off("user_stop_typing", handleUserStopTyping);
    };
  }, [activeChat, user]);

  const refreshChats = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userChats = await apiService.getChats();
      setChats(userChats);

      // If no active chat, select the first one
      if (!activeChat && userChats.length > 0) {
        setActiveChat(userChats[0]);
        apiService.joinChat(userChats[0].id);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
      toast.error("Failed to load chats");
    } finally {
      setIsLoading(false);
    }
  };

  const createChat = async (
    title?: string,
    personalityMode: PersonalityMode = "corporate",
  ) => {
    if (!user) return;

    try {
      const newChat = await apiService.createChat({
        title: title || "New Chat",
        personalityMode,
      });

      // The chat will be added via real-time event
      // Select the new chat
      setActiveChat(newChat);
      apiService.joinChat(newChat.id);
    } catch (error) {
      console.error("Failed to create chat:", error);
      toast.error("Failed to create chat");
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      // Leave current chat
      if (activeChat) {
        apiService.leaveChat(activeChat.id);
      }

      // Load and join new chat
      const chat = await apiService.getChat(chatId);
      setActiveChat(chat);
      apiService.joinChat(chatId);

      // Clear typing indicators
      setTypingUsers([]);
    } catch (error) {
      console.error("Failed to load chat:", error);
      toast.error("Failed to load chat");
    }
  };

  const updateChat = async (chatId: string, updates: Partial<Chat>) => {
    try {
      await apiService.updateChat(chatId, updates);
      // The chat will be updated via real-time event
    } catch (error) {
      console.error("Failed to update chat:", error);
      toast.error("Failed to update chat");
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await apiService.deleteChat(chatId);
      // The chat will be removed via real-time event
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    await updateChat(chatId, { title: newTitle });
  };

  const addMessage = async (chatId: string, message: ChatMessage) => {
    if (!activeChat || activeChat.id !== chatId) return;

    // Optimistically update local state
    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, message],
      lastModified: new Date().toISOString(),
    };

    setActiveChat(updatedChat);

    // Update on server
    try {
      await apiService.updateChat(chatId, {
        messages: updatedChat.messages,
      });
    } catch (error) {
      console.error("Failed to save message:", error);
      toast.error("Failed to save message");
    }
  };

  const sendMessage = async (
    chatId: string,
    content: string,
    personalityMode?: PersonalityMode,
  ) => {
    if (!user || !activeChat) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      isUser: true,
      timestamp: new Date().toISOString(),
      personalityMode: personalityMode || activeChat.personalityMode,
    };

    // Add user message
    await addMessage(chatId, userMessage);

    // TODO: Integrate with AI service to get response
    // For now, simulate a response
    setTimeout(async () => {
      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content:
          "I'm working on getting you a real AI response! The backend is ready for OpenRouter integration.",
        isUser: false,
        timestamp: new Date().toISOString(),
        personalityMode: personalityMode || activeChat.personalityMode,
      };

      await addMessage(chatId, aiMessage);
    }, 1000);
  };

  const startTyping = () => {
    if (activeChat) {
      apiService.startTyping(activeChat.id);
    }
  };

  const stopTyping = () => {
    if (activeChat) {
      apiService.stopTyping(activeChat.id);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        isLoading,
        typingUsers,
        createChat,
        selectChat,
        updateChat,
        deleteChat,
        renameChat,
        addMessage,
        sendMessage,
        startTyping,
        stopTyping,
        refreshChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
