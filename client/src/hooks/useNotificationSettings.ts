import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dreamweldtech_notification_settings";

interface NotificationTypes {
  contact: boolean;
  quote: boolean;
  application: boolean;
  newsletter: boolean;
  system: boolean;
}

interface DndScheduleItem {
  id: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  daysOfWeek: number[]; // 1-7, 1=Monday
  isEnabled: boolean;
}

interface EmailDigestSettings {
  isEnabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  sendTime: string; // HH:mm format
  sendDay: number; // 1-7 for weekly, 1-31 for monthly
}

interface NotificationSettings {
  isEnabled: boolean;
  soundEnabled: boolean;
  dndEndTime: number | null; // Unix timestamp for manual DND
  notificationTypes: NotificationTypes;
  // DND Schedule
  dndSchedules: DndScheduleItem[];
  // Email Digest
  emailDigest: EmailDigestSettings;
  // Push Notifications
  pushEnabled: boolean;
  pushSubscription: PushSubscription | null;
}

const defaultSettings: NotificationSettings = {
  isEnabled: true,
  soundEnabled: true,
  dndEndTime: null,
  notificationTypes: {
    contact: true,
    quote: true,
    application: true,
    newsletter: true,
    system: true,
  },
  dndSchedules: [],
  emailDigest: {
    isEnabled: false,
    frequency: "daily",
    sendTime: "09:00",
    sendDay: 1,
  },
  pushEnabled: false,
  pushSubscription: null,
};

/**
 * Check if current time is within a DND schedule
 */
function isWithinDndSchedule(schedules: DndScheduleItem[]): boolean {
  const now = new Date();
  const currentDay = now.getDay() || 7; // Convert Sunday from 0 to 7
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  for (const schedule of schedules) {
    if (!schedule.isEnabled) continue;
    if (!schedule.daysOfWeek.includes(currentDay)) continue;

    const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
    const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    // Handle overnight schedules (e.g., 22:00 - 08:00)
    if (startTimeMinutes > endTimeMinutes) {
      if (currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes) {
        return true;
      }
    } else {
      if (currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes) {
        return true;
      }
    }
  }

  return false;
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if manual DND has expired
        if (parsed.dndEndTime && parsed.dndEndTime < Date.now()) {
          parsed.dndEndTime = null;
        }
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load notification settings:", e);
    }
    return defaultSettings;
  });

  const [isScheduledDndActive, setIsScheduledDndActive] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      // Don't save pushSubscription to localStorage (it's managed separately)
      const toSave = { ...settings, pushSubscription: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save notification settings:", e);
    }
  }, [settings]);

  // Check DND expiration and schedule periodically
  useEffect(() => {
    const checkDnd = () => {
      // Check manual DND expiration
      if (settings.dndEndTime && settings.dndEndTime < Date.now()) {
        setSettings((prev) => ({ ...prev, dndEndTime: null }));
      }

      // Check scheduled DND
      const scheduledActive = isWithinDndSchedule(settings.dndSchedules);
      setIsScheduledDndActive(scheduledActive);
    };

    checkDnd();
    const interval = setInterval(checkDnd, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [settings.dndEndTime, settings.dndSchedules]);

  // Computed: Is DND currently active (manual or scheduled)?
  const isDndActive = 
    (settings.dndEndTime !== null && settings.dndEndTime > Date.now()) || 
    isScheduledDndActive;

  // Set enabled state
  const setIsEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, isEnabled: enabled }));
  }, []);

  // Set sound enabled
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, soundEnabled: enabled }));
  }, []);

  // Activate manual DND mode for specified minutes
  const setDndMode = useCallback((minutes: number) => {
    const endTime = Date.now() + minutes * 60 * 1000;
    setSettings((prev) => ({ ...prev, dndEndTime: endTime }));
  }, []);

  // Clear manual DND mode
  const clearDndMode = useCallback(() => {
    setSettings((prev) => ({ ...prev, dndEndTime: null }));
  }, []);

  // Toggle specific notification type
  const toggleNotificationType = useCallback((type: string) => {
    setSettings((prev) => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: !prev.notificationTypes[type as keyof NotificationTypes],
      },
    }));
  }, []);

  // Get remaining manual DND time as formatted string
  const getRemainingDndTime = useCallback((): string => {
    if (!settings.dndEndTime) return "";
    
    const remaining = settings.dndEndTime - Date.now();
    if (remaining <= 0) return "";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [settings.dndEndTime]);

  // DND Schedule management
  const addDndSchedule = useCallback((schedule: Omit<DndScheduleItem, "id">) => {
    const newSchedule: DndScheduleItem = {
      ...schedule,
      id: `schedule_${Date.now()}`,
    };
    setSettings((prev) => ({
      ...prev,
      dndSchedules: [...prev.dndSchedules, newSchedule],
    }));
    return newSchedule.id;
  }, []);

  const updateDndSchedule = useCallback((id: string, updates: Partial<DndScheduleItem>) => {
    setSettings((prev) => ({
      ...prev,
      dndSchedules: prev.dndSchedules.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  const removeDndSchedule = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      dndSchedules: prev.dndSchedules.filter((s) => s.id !== id),
    }));
  }, []);

  const toggleDndSchedule = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      dndSchedules: prev.dndSchedules.map((s) =>
        s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
      ),
    }));
  }, []);

  // Email Digest settings
  const updateEmailDigest = useCallback((updates: Partial<EmailDigestSettings>) => {
    setSettings((prev) => ({
      ...prev,
      emailDigest: { ...prev.emailDigest, ...updates },
    }));
  }, []);

  // Push Notifications
  const setPushEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, pushEnabled: enabled }));
  }, []);

  const setPushSubscription = useCallback((subscription: PushSubscription | null) => {
    setSettings((prev) => ({ ...prev, pushSubscription: subscription }));
  }, []);

  // Check if a specific notification type should be shown
  const shouldShowNotification = useCallback(
    (type: string): boolean => {
      // If notifications are disabled globally
      if (!settings.isEnabled) return false;

      // If DND is active (manual or scheduled)
      if (isDndActive) return false;

      // Check specific type
      const typeKey = type as keyof NotificationTypes;
      if (typeKey in settings.notificationTypes) {
        return settings.notificationTypes[typeKey];
      }

      // Default to true for unknown types
      return true;
    },
    [settings.isEnabled, settings.notificationTypes, isDndActive]
  );

  return {
    // State
    isEnabled: settings.isEnabled,
    soundEnabled: settings.soundEnabled,
    isDndActive,
    isScheduledDndActive,
    dndEndTime: settings.dndEndTime,
    notificationTypes: settings.notificationTypes,
    dndSchedules: settings.dndSchedules,
    emailDigest: settings.emailDigest,
    pushEnabled: settings.pushEnabled,
    pushSubscription: settings.pushSubscription,

    // Actions
    setIsEnabled,
    setSoundEnabled,
    setDndMode,
    clearDndMode,
    toggleNotificationType,

    // DND Schedule actions
    addDndSchedule,
    updateDndSchedule,
    removeDndSchedule,
    toggleDndSchedule,

    // Email Digest actions
    updateEmailDigest,

    // Push actions
    setPushEnabled,
    setPushSubscription,

    // Helpers
    getRemainingDndTime,
    shouldShowNotification,
  };
}

export type { NotificationSettings, NotificationTypes, DndScheduleItem, EmailDigestSettings };
