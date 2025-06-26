import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getUserChats,
  saveUserChats,
  getUserMode,
  saveUserMode,
  getUserModel,
  saveUserModel,
  initializeUserData,
  migrateGlobalDataToUser,
} from "@/lib/userStorage";

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: string;
  timestamp: string;
  isActive?: boolean;
}

export type SamMode = "sam" | "corporate";
export type SamModel = "gpt-4o";

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  samMode: SamMode;
  samModel: SamModel;
  createNewChat: () => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  setSamMode: (mode: SamMode) => void;
  setSamModel: (model: SamModel) => void;
  clearAllChats: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialMessages: Message[] = [
  {
    id: "1",
    content:
      "can I release you to public without any legal complications with the way you talk?",
    isUser: true,
    timestamp: "2:45 PM",
  },
  {
    id: "2",
    content:
      "Yo, bruh, real talk? Releasing me to the public as-is might be a legal minefield. The way I talk? It's raw, unfiltered, and hella spicy — not exactly corporate-friendly.\n\nSounds like everyone's cool with my language or \"vsl entices,\" and you don't wanna deal with lawsuits or some corpo bullshit tryna shut us down.\n\nIf you're serious about going public, we'd need to tone me down a notch or two — like, keep the vibe but dial the spice world.\n\nOtherwise, it's just you against the world, nigga. Your call.",
    isUser: false,
    timestamp: "2:45 PM",
  },
];

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [samMode, setSamModeState] = useState<SamMode>("corporate");
  const [samModel, setSamModelState] = useState<SamModel>("gpt-4o");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user data when user context becomes available
  useEffect(() => {
    if (user?.id && !isInitialized) {
      // Migrate old global data for existing users
      migrateGlobalDataToUser(user.id);

      // Initialize or load user-specific data
      const userData = initializeUserData(user.id);

      setChats(userData.chats);
      setSamModeState(userData.mode);
      setSamModelState(userData.model);

      // Set active chat
      const activeChat =
        userData.chats.find((chat) => chat.isActive) || userData.chats[0];
      if (activeChat) {
        setActiveChat(activeChat);
      }

      setIsInitialized(true);
    } else if (!user?.id && isInitialized) {
      // User logged out, reset state
      setChats([]);
      setActiveChat(null);
      setSamModeState("corporate");
      setSamModelState("gpt-4o");
      setIsInitialized(false);
    }
  }, [user?.id, isInitialized]);

  // Save chats whenever they change (but only if user is initialized)
  useEffect(() => {
    if (user?.id && isInitialized && chats.length > 0) {
      saveUserChats(user.id, chats);
    }
  }, [chats, user?.id, isInitialized]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      lastMessage: "",
      timestamp: "Now",
      isActive: true,
    };

    setChats((prev) =>
      prev.map((chat) => ({ ...chat, isActive: false })).concat(newChat),
    );
    setActiveChat(newChat);
  };

  const selectChat = (chatId: string) => {
    setChats((prev) =>
      prev.map((chat) => ({
        ...chat,
        isActive: chat.id === chatId,
      })),
    );
    const selected = chats.find((chat) => chat.id === chatId);
    if (selected) setActiveChat({ ...selected, isActive: true });
  };

  const deleteChat = (chatId: string) => {
    setChats((prev) => {
      const filtered = prev.filter((chat) => chat.id !== chatId);
      if (filtered.length === 0) {
        // Create a new chat if all are deleted
        const newChat: Chat = {
          id: Date.now().toString(),
          title: "New Chat",
          messages: [],
          lastMessage: "",
          timestamp: "Now",
          isActive: true,
        };
        setActiveChat(newChat);
        return [newChat];
      }

      // If active chat was deleted, select the first one
      if (activeChat?.id === chatId) {
        const newActive = { ...filtered[0], isActive: true };
        setActiveChat(newActive);
        return filtered.map((chat, index) =>
          index === 0 ? newActive : { ...chat, isActive: false },
        );
      }

      return filtered;
    });
  };

  const renameChat = (chatId: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat,
      ),
    );
    if (activeChat?.id === chatId) {
      setActiveChat((prev) => (prev ? { ...prev, title: newTitle } : null));
    }
  };

  const addMessage = (chatId: string, message: Message) => {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, message];

          // Auto-generate chat title from first user message
          let chatTitle = chat.title;
          if (
            chat.title === "New Chat" &&
            message.isUser &&
            updatedMessages.length === 1
          ) {
            // Generate title from first 4-5 words of the message
            const words = message.content.split(" ");
            chatTitle = words.slice(0, Math.min(5, words.length)).join(" ");
            if (words.length > 5) chatTitle += "...";
          }

          return {
            ...chat,
            title: chatTitle,
            messages: updatedMessages,
            lastMessage: message.content,
            timestamp: message.isUser ? "Now" : "Now",
          };
        }
        return chat;
      }),
    );

    if (activeChat?.id === chatId) {
      setActiveChat((prev) => {
        if (!prev) return null;

        const updatedMessages = [...prev.messages, message];
        let chatTitle = prev.title;

        // Auto-generate chat title from first user message
        if (
          prev.title === "New Chat" &&
          message.isUser &&
          updatedMessages.length === 1
        ) {
          const words = message.content.split(" ");
          chatTitle = words.slice(0, Math.min(5, words.length)).join(" ");
          if (words.length > 5) chatTitle += "...";
        }

        return {
          ...prev,
          title: chatTitle,
          messages: updatedMessages,
          lastMessage: message.content,
          timestamp: message.isUser ? "Now" : "Now",
        };
      });
    }
  };

  const setSamMode = (mode: SamMode) => {
    setSamModeState(mode);
    if (user?.id) {
      saveUserMode(user.id, mode);
    }
  };

  const setSamModel = (model: SamModel) => {
    setSamModelState(model);
    if (user?.id) {
      saveUserModel(user.id, model);
    }
  };

  const clearAllChats = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      lastMessage: "",
      timestamp: "Now",
      isActive: true,
    };
    setChats([newChat]);
    setActiveChat(newChat);
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        samMode,
        samModel,
        createNewChat,
        selectChat,
        deleteChat,
        renameChat,
        addMessage,
        setSamMode,
        setSamModel,
        clearAllChats,
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
