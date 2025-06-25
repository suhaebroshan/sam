interface UserMemory {
  userId: string;
  facts: string[];
  lastUpdated: string;
}

// Extract meaningful facts about the user from their messages
export function extractUserFacts(message: string): string[] {
  const facts: string[] = [];
  const lowerMessage = message.toLowerCase();

  // Name mentions
  const nameMatch = message.match(
    /(?:i'm|i am|my name is|call me|i'm called)\s+([a-zA-Z]+)/i,
  );
  if (nameMatch) {
    facts.push(`User's name is ${nameMatch[1]}`);
  }

  // Age mentions
  const ageMatch = message.match(
    /(?:i'm|i am|i'm)\s+(\d+)\s+(?:years old|year old|years|yo)/i,
  );
  if (ageMatch) {
    facts.push(`User is ${ageMatch[1]} years old`);
  }

  // Location mentions
  const locationMatch = message.match(
    /(?:i live in|i'm from|i'm in|from)\s+([a-zA-Z\s]+)/i,
  );
  if (locationMatch && locationMatch[1].trim().length > 2) {
    facts.push(`User is from/lives in ${locationMatch[1].trim()}`);
  }

  // Job/profession mentions
  const jobMatch = message.match(
    /(?:i work as|i'm a|i am a|my job is|i work at)\s+([a-zA-Z\s]+)/i,
  );
  if (jobMatch && jobMatch[1].trim().length > 2) {
    facts.push(`User works as/is a ${jobMatch[1].trim()}`);
  }

  // Interests/hobbies
  const hobbyMatch = message.match(
    /(?:i like|i love|i enjoy|i'm into|i'm interested in)\s+([a-zA-Z\s]+)/i,
  );
  if (hobbyMatch && hobbyMatch[1].trim().length > 2) {
    facts.push(`User likes/enjoys ${hobbyMatch[1].trim()}`);
  }

  // Preferences
  const preferenceMatch = message.match(
    /(?:i prefer|i usually|i always|i never)\s+([a-zA-Z\s]+)/i,
  );
  if (preferenceMatch && preferenceMatch[1].trim().length > 3) {
    facts.push(`User ${preferenceMatch[0].toLowerCase()}`);
  }

  // Family mentions
  const familyMatch = message.match(
    /(?:my|i have a?)\s+(wife|husband|mom|dad|mother|father|sister|brother|son|daughter|kids|children|family)/i,
  );
  if (familyMatch) {
    facts.push(`User has/mentions their ${familyMatch[1]}`);
  }

  // Skills/abilities
  const skillMatch = message.match(
    /(?:i can|i know how to|i'm good at|i'm skilled in)\s+([a-zA-Z\s]+)/i,
  );
  if (skillMatch && skillMatch[1].trim().length > 2) {
    facts.push(`User can/knows ${skillMatch[1].trim()}`);
  }

  return facts;
}

// Get user memories from localStorage
export function getUserMemories(userId: string): UserMemory | null {
  try {
    const stored = localStorage.getItem(`sam_memories_${userId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Save user memories to localStorage
export function saveUserMemories(userId: string, facts: string[]): void {
  const memory: UserMemory = {
    userId,
    facts,
    lastUpdated: new Date().toISOString(),
  };

  localStorage.setItem(`sam_memories_${userId}`, JSON.stringify(memory));
}

// Add new facts to existing memories
export function addMemories(userId: string, newFacts: string[]): void {
  if (newFacts.length === 0) return;

  const existing = getUserMemories(userId);
  const currentFacts = existing?.facts || [];

  // Deduplicate facts (case-insensitive)
  const uniqueNewFacts = newFacts.filter(
    (newFact) =>
      !currentFacts.some(
        (existingFact) => existingFact.toLowerCase() === newFact.toLowerCase(),
      ),
  );

  if (uniqueNewFacts.length > 0) {
    const allFacts = [...currentFacts, ...uniqueNewFacts];
    // Keep only last 20 facts to avoid memory bloat
    const limitedFacts = allFacts.slice(-20);
    saveUserMemories(userId, limitedFacts);
  }
}

// Get memory context for AI prompts
export function getMemoryContext(userId: string): string {
  const memories = getUserMemories(userId);

  if (!memories || memories.facts.length === 0) {
    return "";
  }

  return `\n\nThings you remember about this user:\n${memories.facts.map((fact) => `- ${fact}`).join("\n")}`;
}

// Clear all memories for a user
export function clearUserMemories(userId: string): void {
  localStorage.removeItem(`sam_memories_${userId}`);
}
