import { useState, useEffect, useCallback } from "react";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "default",
  );
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!supported) {
      console.warn("Browser doesn't support notifications");
      return false;
    }

    if (permission === "granted") {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [supported, permission]);

  const sendNotification = useCallback(
    async (options: NotificationOptions): Promise<boolean> => {
      if (!supported) {
        console.warn("Browser doesn't support notifications");
        return false;
      }

      if (permission !== "granted") {
        console.log("Requesting notification permission...");
        const granted = await requestPermission();
        if (!granted) {
          console.warn("Notification permission denied");
          return false;
        }
      }

      try {
        console.log("Sending notification:", options.title, options.body);
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || "/favicon.ico",
          tag: options.tag || "sam-notification",
          requireInteraction: options.requireInteraction || false,
          silent: false,
        });

        // Auto-close after 5 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
          setTimeout(() => {
            notification.close();
          }, 5000);
        }

        // Handle click event
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        console.log("Notification sent successfully");
        return true;
      } catch (error) {
        console.error("Error sending notification:", error);
        return false;
      }
    },
    [supported, permission, requestPermission],
  );

  const checkPermission = useCallback((): boolean => {
    return supported && permission === "granted";
  }, [supported, permission]);

  return {
    supported,
    permission,
    requestPermission,
    sendNotification,
    checkPermission,
  };
}
