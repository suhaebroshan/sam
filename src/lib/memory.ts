interface UserMemory {
  userId: string;
  facts: string[];
  lastUpdated: string;
}

// Extract meaningful facts about the user from their messages
export function extractUserFacts(message: string): string[] {
  const facts: string[] = [];
  const lowerMessage = message.toLowerCase();

  // EXPLICIT MEMORY COMMANDS - High Priority
  // Remember that/this patterns
  const explicitRememberMatches = [
    /(?:remember that|keep in mind that|don't forget that|note that)\s+(.+)/i,
    /(?:remember this|keep this in mind|don't forget this|note this):\s*(.+)/i,
    /(?:remember|keep in mind|don't forget|note):\s*(.+)/i,
    /(?:sam,?\s*remember|sam,?\s*keep in mind|sam,?\s*don't forget)\s+(.+)/i,
  ];

  for (const pattern of explicitRememberMatches) {
    const match = message.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      facts.push(`IMPORTANT: ${match[1].trim()}`);
    }
  }

  // For later reference patterns
  const laterReferenceMatches = [
    /(?:for later|for future reference|for next time):\s*(.+)/i,
    /(?:save this|store this|bookmark this):\s*(.+)/i,
  ];

  for (const pattern of laterReferenceMatches) {
    const match = message.match(pattern);
    if (match && match[1] && match[1].trim().length > 3) {
      facts.push(`FOR REFERENCE: ${match[1].trim()}`);
    }
  }

  // AUTO-DETECTED FACTS - Lower Priority

  // Name mentions (Enhanced patterns)
  const namePatterns = [
    /(?:i'm|i am|my name is|call me|i'm called)\s+([a-zA-Z]+)/i,
    /(?:this is|hey i'm|hi i'm|hello i'm)\s+([a-zA-Z]+)/i,
    /(?:my name's|name's)\s+([a-zA-Z]+)/i,
    /(?:everyone calls me|people call me|just call me)\s+([a-zA-Z]+)/i,
  ];

  for (const pattern of namePatterns) {
    const nameMatch = message.match(pattern);
    if (nameMatch && nameMatch[1] && nameMatch[1].length > 1) {
      facts.push(`USER'S NAME: ${nameMatch[1]}`);
      break; // Only take the first name match to avoid duplicates
    }
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

  // Goals and aspirations
  const goalMatch = message.match(
    /(?:i want to|i plan to|i'm planning to|my goal is to|i aim to)\s+([a-zA-Z\s]+)/i,
  );
  if (goalMatch && goalMatch[1].trim().length > 3) {
    facts.push(`User wants to/plans to ${goalMatch[1].trim()}`);
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

  // Separate different types of memories
  const userName = memories.facts.find((fact) =>
    fact.startsWith("USER'S NAME:"),
  );
  const explicitMemories = memories.facts.filter(
    (fact) =>
      fact.startsWith("IMPORTANT:") || fact.startsWith("FOR REFERENCE:"),
  );
  const autoDetectedMemories = memories.facts.filter(
    (fact) =>
      !fact.startsWith("IMPORTANT:") &&
      !fact.startsWith("FOR REFERENCE:") &&
      !fact.startsWith("USER'S NAME:"),
  );

  let context = "\n\nThings you remember about this user:";

  // Prioritize user's name at the top
  if (userName) {
    const name = userName.replace("USER'S NAME: ", "");
    context += `\n\nUSER'S NAME: ${name} (use this name when talking to them)`;
  }

  if (explicitMemories.length > 0) {
    context +=
      "\n\nEXPLICIT MEMORIES (they specifically asked you to remember these):";
    explicitMemories.forEach((fact) => {
      context += `\n- ${fact}`;
    });
  }

  if (autoDetectedMemories.length > 0) {
    context += "\n\nAUTO-DETECTED INFO:";
    autoDetectedMemories.forEach((fact) => {
      context += `\n- ${fact}`;
    });
  }

  return context;
}

// Clear all memories for a user
export function clearUserMemories(userId: string): void {
  localStorage.removeItem(`sam_memories_${userId}`);
}

// Delete a specific memory by index
export function deleteMemory(userId: string, index: number): void {
  const existing = getUserMemories(userId);
  if (!existing || !existing.facts) return;

  const updatedFacts = existing.facts.filter((_, i) => i !== index);
  saveUserMemories(userId, updatedFacts);
}
