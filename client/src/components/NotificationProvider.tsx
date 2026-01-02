import { createContext, useContext, useEffect, useCallback, useState, ReactNode } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";

interface NotificationContextType {
  isConnected: boolean;
  error: string | null;
  sendNotification: (message: any) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const handleWebSocketMessage = useCallback((message: any) => {
    console.log("WebSocket message received:", message);

    switch (message.type) {
      case "notification":
        // Show toast notification
        toast.info(message.data.title, {
          description: message.data.message,
        });
        // Increment unread count
        setUnreadCount((prev) => prev + 1);
        break;

      case "activity":
        // Log activity
        console.log("Activity:", message.data);
        break;

      case "update":
        // Handle update
        console.log("Update:", message.data);
        break;

      case "error":
        // Show error toast
        toast.error(message.data.message || "An error occurred");
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  }, []);

  const { isConnected, error, send } = useWebSocket("/api/ws/notifications", handleWebSocketMessage);

  return (
    <NotificationContext.Provider
      value={{
        isConnected,
        error,
        sendNotification: send,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  return context;
}
