import { getUserMemories } from "./memory";

// Get the user's preferred name from memories or fallback to auth name
export function getUserPreferredName(
  userId: string,
  fallbackName?: string,
): string {
  const memories = getUserMemories(userId);

  if (memories?.facts) {
    const nameMemory = memories.facts.find((fact) =>
      fact.startsWith("USER'S NAME:"),
    );
    if (nameMemory) {
      return nameMemory.replace("USER'S NAME: ", "");
    }
  }

  return fallbackName || "User";
}

// Check if we know the user's name
export function hasUserName(userId: string): boolean {
  const memories = getUserMemories(userId);
  return (
    memories?.facts.some((fact) => fact.startsWith("USER'S NAME:")) || false
  );
}
