import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./EnhancedAuthContext";
import apiService, { UserMemory } from "@/lib/apiService";
import { toast } from "sonner";

interface MemoryContextType {
  memory: UserMemory | null;
  isLoading: boolean;

  // Memory management
  addFact: (fact: string) => Promise<void>;
  removeFact: (index: number) => Promise<void>;
  updateFact: (index: number, newFact: string) => Promise<void>;
  clearAllMemory: () => Promise<void>;

  // Personality preferences
  updatePersonalityPreferences: (
    preferences: Record<string, any>,
  ) => Promise<void>;

  // Utilities
  refreshMemory: () => Promise<void>;
  extractFactsFromMessage: (message: string) => string[];
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load memory when user is authenticated
  useEffect(() => {
    if (user) {
      refreshMemory();
    } else {
      setMemory(null);
    }
  }, [user]);

  const refreshMemory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userMemory = await apiService.getMemory();
      setMemory(userMemory);
    } catch (error) {
      console.error("Failed to load memory:", error);
      toast.error("Failed to load memory");
    } finally {
      setIsLoading(false);
    }
  };

  const updateMemoryOnServer = async (updatedMemory: UserMemory) => {
    try {
      const result = await apiService.updateMemory(updatedMemory);
      setMemory(result);
      return result;
    } catch (error) {
      console.error("Failed to update memory:", error);
      toast.error("Failed to update memory");
      throw error;
    }
  };

  const addFact = async (fact: string) => {
    if (!memory || !fact.trim()) return;

    const updatedMemory = {
      ...memory,
      facts: [...memory.facts, fact.trim()],
    };

    await updateMemoryOnServer(updatedMemory);
    toast.success("Memory added");
  };

  const removeFact = async (index: number) => {
    if (!memory || index < 0 || index >= memory.facts.length) return;

    const updatedMemory = {
      ...memory,
      facts: memory.facts.filter((_, i) => i !== index),
    };

    await updateMemoryOnServer(updatedMemory);
    toast.success("Memory removed");
  };

  const updateFact = async (index: number, newFact: string) => {
    if (!memory || index < 0 || index >= memory.facts.length) return;

    const updatedMemory = {
      ...memory,
      facts: memory.facts.map((fact, i) =>
        i === index ? newFact.trim() : fact,
      ),
    };

    await updateMemoryOnServer(updatedMemory);
    toast.success("Memory updated");
  };

  const clearAllMemory = async () => {
    if (!memory) return;

    const updatedMemory = {
      ...memory,
      facts: [],
    };

    await updateMemoryOnServer(updatedMemory);
    toast.success("All memories cleared");
  };

  const updatePersonalityPreferences = async (
    preferences: Record<string, any>,
  ) => {
    if (!memory) return;

    const updatedMemory = {
      ...memory,
      personality_preferences: {
        ...memory.personality_preferences,
        ...preferences,
      },
    };

    await updateMemoryOnServer(updatedMemory);
    toast.success("Personality preferences updated");
  };

  const extractFactsFromMessage = (message: string): string[] => {
    const facts: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Explicit memory commands
    const explicitPatterns = [
      /(?:remember that|keep in mind that|don't forget that|note that)\s+(.+)/i,
      /(?:remember this|keep this in mind|don't forget this|note this):\s*(.+)/i,
      /(?:remember|keep in mind|don't forget|note):\s*(.+)/i,
      /(?:sam,?\s*remember|sam,?\s*keep in mind|sam,?\s*don't forget)\s+(.+)/i,
    ];

    for (const pattern of explicitPatterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        facts.push(`EXPLICIT: ${match[1].trim()}`);
      }
    }

    // Auto-detected patterns
    const autoPatterns = [
      {
        pattern: /(?:i'm|i am|my name is|call me|i'm called)\s+([a-zA-Z\s]+)/i,
        prefix: "NAME",
      },
      {
        pattern: /(?:i'm|i am|i'm)\s+(\d+)\s+(?:years old|year old|years|yo)/i,
        prefix: "AGE",
      },
      {
        pattern: /(?:i live in|i'm from|i'm in|from)\s+([a-zA-Z\s]+)/i,
        prefix: "LOCATION",
      },
      {
        pattern:
          /(?:i work as|i'm a|i am a|my job is|i work at)\s+([a-zA-Z\s]+)/i,
        prefix: "JOB",
      },
      {
        pattern:
          /(?:i like|i love|i enjoy|i'm into|i'm interested in)\s+([a-zA-Z\s]+)/i,
        prefix: "INTEREST",
      },
      {
        pattern: /(?:i prefer|i usually|i always|i never)\s+([a-zA-Z\s]+)/i,
        prefix: "PREFERENCE",
      },
    ];

    for (const { pattern, prefix } of autoPatterns) {
      const match = message.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        facts.push(`${prefix}: ${match[1].trim()}`);
      }
    }

    return facts;
  };

  return (
    <MemoryContext.Provider
      value={{
        memory,
        isLoading,
        addFact,
        removeFact,
        updateFact,
        clearAllMemory,
        updatePersonalityPreferences,
        refreshMemory,
        extractFactsFromMessage,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (context === undefined) {
    throw new Error("useMemory must be used within a MemoryProvider");
  }
  return context;
}
