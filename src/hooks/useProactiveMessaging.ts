import { useState, useEffect, useCallback } from "react";
import { useNotifications } from "./useNotifications";
import {
  ProactiveMessageSettings,
  PROACTIVE_MESSAGE_FREQUENCIES,
} from "../types/customGPT";

interface ProactiveMessage {
  id: string;
  content: string;
  timestamp: string;
  from: "sam" | "corporate" | string; // string for custom GPT IDs
}

const PROACTIVE_MESSAGES = {
  sam: [
    "Yo, bored rn. You up?",
    "Check this idea I came up with.",
    "What if we built this?",
    "You good, bro? Haven't heard from you today.",
    "Nigga where you at? It's been quiet.",
    "Wassup, got something on my mind.",
    "Bruv, you gotta see this.",
    "Yo, random thought just hit me.",
    "Bhai, we need to talk about something.",
    "Heyy, miss our convos ngl.",
  ],
  corporate: [
    "Good morning! How may I assist you today?",
    "I hope you're having a productive day.",
    "Would you like to review our recent conversations?",
    "I'm here if you need any assistance.",
    "How can I help optimize your workflow today?",
    "I noticed you haven't been active recently. Everything alright?",
    "Ready to tackle some new challenges together?",
    "Is there anything I can help you accomplish today?",
  ],
  general: [
    "Hey there! What's on your mind?",
    "Ready for our next conversation?",
    "I've been thinking about our last chat.",
    "Hope you're doing well!",
    "Anything interesting happening today?",
    "Feel like chatting?",
    "What's new in your world?",
    "How's your day going?",
  ],
};

export function useProactiveMessaging() {
  const { sendNotification, checkPermission } = useNotifications();
  const [settings, setSettings] = useState<ProactiveMessageSettings>({
    enabled: false,
    frequency: "few_hours",
    quietHours: { start: "22:00", end: "08:00" },
    totalSent: 0,
  });
  const [messageQueue, setMessageQueue] = useState<ProactiveMessage[]>([]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("sam_proactive_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback(
    (newSettings: Partial<ProactiveMessageSettings>) => {
      setSettings((prev) => {
        const updated = { ...prev, ...newSettings };
        localStorage.setItem("sam_proactive_settings", JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  // Check if current time is within quiet hours
  const isQuietHour = useCallback((): boolean => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = settings.quietHours.start
      .split(":")
      .map(Number);
    const [endHour, endMin] = settings.quietHours.end.split(":").map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }, [settings.quietHours]);

  // Check if enough time has passed since last message
  const shouldSendMessage = useCallback((): boolean => {
    if (!settings.enabled || isQuietHour()) {
      return false;
    }

    if (!settings.lastSent) {
      return true;
    }

    const lastSentTime = new Date(settings.lastSent).getTime();
    const now = Date.now();
    const frequency = PROACTIVE_MESSAGE_FREQUENCIES[settings.frequency];

    return now - lastSentTime >= frequency.intervalMs;
  }, [settings, isQuietHour]);

  // Generate a random message based on personality
  const generateMessage = useCallback((personality: string = "sam"): string => {
    let messages = PROACTIVE_MESSAGES.general;

    if (personality === "sam") {
      messages = PROACTIVE_MESSAGES.sam;
    } else if (personality === "corporate") {
      messages = PROACTIVE_MESSAGES.corporate;
    }

    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }, []);

  // Send a proactive message
  const sendProactiveMessage = useCallback(
    async (
      personality: string = "sam",
      customMessage?: string,
    ): Promise<boolean> => {
      if (!checkPermission()) {
        console.warn("Notification permission not granted");
        return false;
      }

      const content = customMessage || generateMessage(personality);
      const message: ProactiveMessage = {
        id: `proactive_${Date.now()}`,
        content,
        timestamp: new Date().toISOString(),
        from: personality,
      };

      // Send notification
      const notificationSent = await sendNotification({
        title:
          personality === "sam"
            ? "SAM"
            : personality === "corporate"
              ? "Assistant"
              : personality,
        body: content,
        tag: "sam-proactive",
        requireInteraction: true,
      });

      if (notificationSent) {
        // Add to message queue for UI handling
        setMessageQueue((prev) => [...prev, message]);

        // Update settings
        updateSettings({
          lastSent: new Date().toISOString(),
          totalSent: settings.totalSent + 1,
        });

        // Dispatch custom event for the main app to handle
        window.dispatchEvent(
          new CustomEvent("proactiveMessage", {
            detail: { message, personality },
          }),
        );

        return true;
      }

      return false;
    },
    [
      checkPermission,
      generateMessage,
      sendNotification,
      updateSettings,
      settings.totalSent,
    ],
  );

  // Clear message from queue (when user interacts)
  const clearMessage = useCallback((messageId: string) => {
    setMessageQueue((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  // Setup interval for checking if we should send messages
  useEffect(() => {
    if (!settings.enabled) {
      return;
    }

    const checkInterval = setInterval(() => {
      if (shouldSendMessage()) {
        // Get current personality from localStorage (fallback to sam)
        const userDir = localStorage.getItem("sam_current_user");
        const currentPersonality = userDir
          ? localStorage.getItem(`${userDir}_personality`) || "sam"
          : "sam";

        sendProactiveMessage(currentPersonality);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [settings.enabled, shouldSendMessage, sendProactiveMessage]);

  return {
    settings,
    updateSettings,
    messageQueue,
    sendProactiveMessage,
    clearMessage,
    isQuietHour,
    shouldSendMessage,
  };
}
