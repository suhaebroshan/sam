import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
export type SamModel = "gpt-4o" | "gpt-3.5";

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
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [samMode, setSamModeState] = useState<SamMode>("sam");
  const [samModel, setSamModelState] = useState<SamModel>("gpt-4o");

  useEffect(() => {
    // Load saved chats
    const savedChats = localStorage.getItem("sam_chats");
    const savedMode = localStorage.getItem("sam_mode") as SamMode;
    const savedModel = localStorage.getItem("sam_model") as SamModel;

    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChats(parsedChats);
      const active = parsedChats.find((chat: Chat) => chat.isActive);
      if (active) setActiveChat(active);
    } else {
      // Create initial chat
      const initialChat: Chat = {
        id: "1",
        title: "New Chat",
        messages: initialMessages,
        lastMessage: initialMessages[initialMessages.length - 1].content,
        timestamp: "Today",
        isActive: true,
      };
      setChats([initialChat]);
      setActiveChat(initialChat);
    }

    if (savedMode) setSamModeState(savedMode);
    if (savedModel) setSamModelState(savedModel);
  }, []);

  useEffect(() => {
    localStorage.setItem("sam_chats", JSON.stringify(chats));
  }, [chats]);

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
          return {
            ...chat,
            messages: updatedMessages,
            lastMessage: message.content,
            timestamp: message.isUser ? "Now" : "Now",
          };
        }
        return chat;
      }),
    );

    if (activeChat?.id === chatId) {
      setActiveChat((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, message],
              lastMessage: message.content,
              timestamp: message.isUser ? "Now" : "Now",
            }
          : null,
      );
    }
  };

  const setSamMode = (mode: SamMode) => {
    setSamModeState(mode);
    localStorage.setItem("sam_mode", mode);
  };

  const setSamModel = (model: SamModel) => {
    setSamModelState(model);
    localStorage.setItem("sam_model", model);
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
