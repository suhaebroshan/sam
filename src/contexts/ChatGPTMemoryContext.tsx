import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./ChatGPTAuthContext";
import { toast } from "sonner";

interface UserMemory {
  facts: string[];
  personality_preferences: Record<string, any>;
  last_updated: string;
}

interface MemoryContextType {
  memory: UserMemory | null;
  isLoading: boolean;

  // Memory management
  addFact: (fact: string) => Promise<void>;
  removeFact: (index: number) => Promise<void>;
  updateFact: (index: number, newFact: string) => Promise<void>;
  clearAllMemory: () => Promise<void>;

  // Utilities
  extractFactsFromMessage: (message: string) => string[];
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load memory when user changes
  useEffect(() => {
    if (user) {
      loadUserMemory();
    } else {
      setMemory(null);
    }
  }, [user]);

  const loadUserMemory = () => {
    if (!user) return;

    const userDir = `sam_user_${user.id}`;
    const savedMemory = localStorage.getItem(`${userDir}_memory`);

    if (savedMemory) {
      try {
        setMemory(JSON.parse(savedMemory));
      } catch (error) {
        console.error("Error loading user memory:", error);
        initializeMemory();
      }
    } else {
      initializeMemory();
    }
  };

  const initializeMemory = () => {
    const initialMemory: UserMemory = {
      facts: [],
      personality_preferences: {},
      last_updated: new Date().toISOString(),
    };
    setMemory(initialMemory);
    saveMemory(initialMemory);
  };

  const saveMemory = (memoryToSave: UserMemory) => {
    if (!user) return;

    const userDir = `sam_user_${user.id}`;
    const updatedMemory = {
      ...memoryToSave,
      last_updated: new Date().toISOString(),
    };

    localStorage.setItem(`${userDir}_memory`, JSON.stringify(updatedMemory));
    setMemory(updatedMemory);
  };

  const addFact = async (fact: string) => {
    if (!memory || !fact.trim()) return;

    const factToAdd = fact.trim();

    // Check if fact already exists (case-insensitive)
    const existingFact = memory.facts.find(
      (f) => f.toLowerCase() === factToAdd.toLowerCase(),
    );

    if (existingFact) {
      return; // Don't add duplicate facts
    }

    const updatedMemory = {
      ...memory,
      facts: [...memory.facts, factToAdd],
    };

    saveMemory(updatedMemory);
  };

  const removeFact = async (index: number) => {
    if (!memory || index < 0 || index >= memory.facts.length) return;

    const updatedMemory = {
      ...memory,
      facts: memory.facts.filter((_, i) => i !== index),
    };

    saveMemory(updatedMemory);
  };

  const updateFact = async (index: number, newFact: string) => {
    if (!memory || index < 0 || index >= memory.facts.length) return;

    const updatedMemory = {
      ...memory,
      facts: memory.facts.map((fact, i) =>
        i === index ? newFact.trim() : fact,
      ),
    };

    saveMemory(updatedMemory);
  };

  const clearAllMemory = async () => {
    if (!memory) return;

    const updatedMemory = {
      ...memory,
      facts: [],
    };

    saveMemory(updatedMemory);
  };

  const extractFactsFromMessage = (message: string): string[] => {
    const facts: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Explicit memory commands (high priority)
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

    // Auto-detected patterns (lower priority)
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
      {
        pattern:
          /(?:my|i have a?)\s+(wife|husband|mom|dad|mother|father|sister|brother|son|daughter|kids|children|family)/i,
        prefix: "FAMILY",
      },
      {
        pattern:
          /(?:i can|i know how to|i'm good at|i'm skilled in)\s+([a-zA-Z\s]+)/i,
        prefix: "SKILL",
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
