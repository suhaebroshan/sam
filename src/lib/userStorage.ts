import { Chat, SamMode, SamModel } from "@/contexts/ChatContext";

// User-specific storage keys
const getUserStorageKey = (userId: string, dataType: string) =>
  `sam_${dataType}_${userId}`;

// Chats management
export function getUserChats(userId: string): Chat[] {
  try {
    const saved = localStorage.getItem(getUserStorageKey(userId, "chats"));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveUserChats(userId: string, chats: Chat[]): void {
  localStorage.setItem(
    getUserStorageKey(userId, "chats"),
    JSON.stringify(chats),
  );
}

// User preferences
export function getUserMode(userId: string): SamMode {
  try {
    const saved = localStorage.getItem(getUserStorageKey(userId, "mode"));
    return (saved as SamMode) || "corporate"; // Default to corporate mode
  } catch {
    return "corporate";
  }
}

export function saveUserMode(userId: string, mode: SamMode): void {
  localStorage.setItem(getUserStorageKey(userId, "mode"), mode);
}

export function getUserModel(userId: string): SamModel {
  try {
    const saved = localStorage.getItem(getUserStorageKey(userId, "model"));
    return (saved as SamModel) || "gpt-4o";
  } catch {
    return "gpt-4o";
  }
}

export function saveUserModel(userId: string, model: SamModel): void {
  localStorage.setItem(getUserStorageKey(userId, "model"), model);
}

// Initialize user data if they don't have any
export function initializeUserData(userId: string): {
  chats: Chat[];
  mode: SamMode;
  model: SamModel;
} {
  const existingChats = getUserChats(userId);

  if (existingChats.length === 0) {
    // Create initial welcome chat for new users
    const welcomeChat: Chat = {
      id: "welcome_" + Date.now(),
      title: "Welcome to SAM",
      messages: [
        {
          id: "welcome_1",
          content:
            "Welcome to SAM! I'm your AI assistant. I start in Corporate mode by default - professional and polished. You can switch to Sam mode anytime for a more casual, unfiltered experience. How can I help you today?",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
      lastMessage: "Welcome to SAM! I'm your AI assistant...",
      timestamp: "Now",
      isActive: true,
    };

    saveUserChats(userId, [welcomeChat]);
    return {
      chats: [welcomeChat],
      mode: "corporate",
      model: "gpt-4o",
    };
  }

  return {
    chats: existingChats,
    mode: getUserMode(userId),
    model: getUserModel(userId),
  };
}

// Clear all user data (useful for logout)
export function clearUserData(userId: string): void {
  const keysToRemove = [
    getUserStorageKey(userId, "chats"),
    getUserStorageKey(userId, "mode"),
    getUserStorageKey(userId, "model"),
    getUserStorageKey(userId, "memories"), // This will be used by memory system
  ];

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

// Migrate old global data to user-specific data (for existing users)
export function migrateGlobalDataToUser(userId: string): void {
  try {
    // Check if we have old global data
    const oldChats = localStorage.getItem("sam_chats");
    const oldMode = localStorage.getItem("sam_mode");
    const oldModel = localStorage.getItem("sam_model");
    const oldMemories = localStorage.getItem("sam_memories_1"); // Old memory format

    // Only migrate if user doesn't have data yet and old data exists
    const existingChats = getUserChats(userId);
    if (existingChats.length === 0) {
      if (oldChats) {
        saveUserChats(userId, JSON.parse(oldChats));
        localStorage.removeItem("sam_chats");
      }

      if (oldMode) {
        saveUserMode(userId, oldMode as SamMode);
        localStorage.removeItem("sam_mode");
      }

      if (oldModel) {
        saveUserModel(userId, oldModel as SamModel);
        localStorage.removeItem("sam_model");
      }

      // Migrate memories
      if (oldMemories) {
        localStorage.setItem(
          getUserStorageKey(userId, "memories"),
          oldMemories,
        );
        localStorage.removeItem("sam_memories_1");
      }
    }
  } catch (error) {
    console.error("Error migrating global data:", error);
  }
}
