import { createContext, useContext, useEffect, useCallback, useState, ReactNode } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface NotificationContextType {
  isConnected: boolean;
  error: string | null;
  sendNotification: (message: any) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();
  
  // Fetch initial unread count from API
  const { data: unreadData, refetch: refetchUnreadCount } = trpc.notificationCenter.unreadCount.useQuery(
    undefined,
    { 
      enabled: isAuthenticated,
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Update unread count when data changes
  useEffect(() => {
    if (unreadData?.count !== undefined) {
      setUnreadCount(unreadData.count);
    }
  }, [unreadData]);

  const handleWebSocketMessage = useCallback((message: any) => {
    console.log("WebSocket message received:", message);

    // Handle different notification types
    const notificationType = message.type;
    const title = message.title || message.data?.title;
    const messageText = message.message || message.data?.message;
    const priority = message.priority || message.data?.priority || 'normal';

    switch (notificationType) {
      case "contact":
      case "quote":
        // Contact/Quote notification
        toast.info(title || "Liên hệ mới", {
          description: messageText,
          duration: 5000,
        });
        setUnreadCount((prev) => prev + 1);
        break;

      case "application":
        // Job application notification
        toast.success(title || "Đơn ứng tuyển mới", {
          description: messageText,
          duration: 5000,
        });
        setUnreadCount((prev) => prev + 1);
        break;

      case "newsletter":
        // Newsletter subscription notification
        toast.info(title || "Đăng ký newsletter mới", {
          description: messageText,
          duration: 3000,
        });
        setUnreadCount((prev) => prev + 1);
        break;

      case "system":
        // System notification
        if (priority === 'urgent' || priority === 'high') {
          toast.error(title || "Thông báo hệ thống", {
            description: messageText,
            duration: 10000,
          });
        } else {
          toast.info(title || "Thông báo hệ thống", {
            description: messageText,
          });
        }
        setUnreadCount((prev) => prev + 1);
        break;

      case "notification":
        // Generic notification
        toast.info(title, {
          description: messageText,
        });
        setUnreadCount((prev) => prev + 1);
        break;

      case "subscribed":
        // Subscription confirmation
        console.log("WebSocket subscribed for user:", message.userId);
        break;

      case "pong":
        // Heartbeat response
        break;

      case "activity":
        // Activity log (don't show toast)
        console.log("Activity:", message.data);
        break;

      case "update":
        // Data update notification
        console.log("Update:", message.data);
        break;

      case "error":
        // Error notification
        toast.error(messageText || "Đã xảy ra lỗi");
        break;

      default:
        console.log("Unknown message type:", notificationType);
    }
  }, []);

  const { isConnected, error, send } = useWebSocket("/api/ws/notifications", handleWebSocketMessage);

  // Subscribe to notifications when connected and authenticated
  useEffect(() => {
    if (isConnected && isAuthenticated && user?.id) {
      // Send subscribe message with user ID
      send({
        type: "subscribe",
        userId: user.id,
      });
      console.log("Subscribed to WebSocket notifications for user:", user.id);
    }
  }, [isConnected, isAuthenticated, user?.id, send]);

  // Refresh unread count function
  const refreshUnreadCount = useCallback(() => {
    if (isAuthenticated) {
      refetchUnreadCount();
    }
  }, [isAuthenticated, refetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        isConnected,
        error,
        sendNotification: send,
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
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
