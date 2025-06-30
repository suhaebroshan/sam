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
    console.log("requestPermission called");
    console.log("Browser support:", supported);
    console.log("Current permission:", permission);

    if (!supported) {
      console.warn("Browser doesn't support notifications");
      alert("Your browser doesn't support notifications");
      return false;
    }

    if (permission === "granted") {
      console.log("Permission already granted");
      return true;
    }

    try {
      console.log("Requesting notification permission...");
      let result: NotificationPermission;

      // Handle both callback and promise-based APIs
      if (typeof Notification.requestPermission === "function") {
        const permissionResult = Notification.requestPermission();
        if (permissionResult instanceof Promise) {
          result = await permissionResult;
        } else {
          // Older callback-based API
          result = await new Promise((resolve) => {
            Notification.requestPermission(resolve);
          });
        }
      } else {
        console.error("Notification.requestPermission is not available");
        return false;
      }

      console.log("Permission result:", result);
      setPermission(result);

      if (result === "granted") {
        console.log("Permission granted successfully");
        return true;
      } else {
        console.warn("Permission denied:", result);
        alert("Please allow notifications to use this feature");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      alert(`Failed to request notification permission: ${error.message}`);
      return false;
    }
  }, [supported, permission]);

  const sendNotification = useCallback(
    async (options: NotificationOptions): Promise<boolean> => {
      console.log("sendNotification called with:", options);
      console.log("Browser support:", supported);
      console.log("Current permission:", permission);

      if (!supported) {
        console.warn("Browser doesn't support notifications");
        alert("Your browser doesn't support notifications");
        return false;
      }

      // Check if we're in a secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        console.warn("Notifications require a secure context (HTTPS)");
        alert("Notifications require HTTPS");
        return false;
      }

      if (permission !== "granted") {
        console.log("Permission not granted, requesting...");
        const granted = await requestPermission();
        console.log("Permission request result:", granted);
        if (!granted) {
          console.warn("Notification permission denied");
          alert("Please allow notifications in your browser settings");
          return false;
        }
      }

      try {
        console.log("Creating notification with:", {
          title: options.title,
          body: options.body,
          icon: options.icon || "/favicon.ico",
          tag: options.tag || "sam-notification",
          requireInteraction: options.requireInteraction || false,
        });

        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || "/favicon.ico",
          tag: options.tag || "sam-notification",
          requireInteraction: options.requireInteraction || false,
          silent: false,
        });

        console.log("Notification object created:", notification);

        // Handle events
        notification.onshow = () => {
          console.log("Notification shown");
        };

        notification.onerror = (error) => {
          console.error("Notification error:", error);
        };

        notification.onclick = () => {
          console.log("Notification clicked");
          window.focus();
          notification.close();
        };

        notification.onclose = () => {
          console.log("Notification closed");
        };

        // Auto-close after 5 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
          setTimeout(() => {
            console.log("Auto-closing notification");
            notification.close();
          }, 5000);
        }

        console.log("Notification sent successfully");
        return true;
      } catch (error) {
        console.error("Error creating notification:", error);
        alert(`Failed to create notification: ${error.message}`);
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
