import { getDb } from "./db";
import { dndSchedule } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Check if DND is currently active based on schedule
 */
export function isDndActiveNow(
  schedule: typeof dndSchedule.$inferSelect,
  timezone: string = "Asia/Ho_Chi_Minh"
): boolean {
  if (schedule.isEnabled !== "true") {
    return false;
  }

  const now = new Date();
  
  // Get current time in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(parts.find(p => p.type === "hour")?.value || "0");
  const currentMinute = parseInt(parts.find(p => p.type === "minute")?.value || "0");
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Get current day of week (1=Monday, 7=Sunday)
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const dayStr = dayFormatter.format(now);
  const dayMap: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  const currentDay = dayMap[dayStr] || 1;

  // Check if current day is in schedule
  const scheduledDays = schedule.daysOfWeek.split(",").map(d => parseInt(d.trim()));
  if (!scheduledDays.includes(currentDay)) {
    return false;
  }

  // Parse start and end times
  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
  const startTimeMinutes = startHour * 60 + startMinute;
  const endTimeMinutes = endHour * 60 + endMinute;

  // Handle overnight schedules (e.g., 22:00 - 08:00)
  if (startTimeMinutes > endTimeMinutes) {
    // DND spans midnight
    return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
  } else {
    // DND within same day
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
  }
}

/**
 * Get DND schedule for a user
 */
export async function getDndSchedule(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [schedule] = await db
    .select()
    .from(dndSchedule)
    .where(eq(dndSchedule.userId, userId));

  return schedule || null;
}

/**
 * Get all DND schedules for a user (supports multiple schedules)
 */
export async function getAllDndSchedules(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(dndSchedule)
    .where(eq(dndSchedule.userId, userId));
}

/**
 * Create or update DND schedule
 */
export async function upsertDndSchedule(
  userId: number,
  data: {
    startTime: string;
    endTime: string;
    daysOfWeek?: string;
    timezone?: string;
    isEnabled?: "true" | "false";
  }
) {
  const db = await getDb();
  if (!db) return null;

  // Check if schedule exists
  const existing = await getDndSchedule(userId);

  if (existing) {
    await db
      .update(dndSchedule)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(dndSchedule.id, existing.id));
  } else {
    await db.insert(dndSchedule).values({
      userId,
      startTime: data.startTime,
      endTime: data.endTime,
      daysOfWeek: data.daysOfWeek || "1,2,3,4,5,6,7",
      timezone: data.timezone || "Asia/Ho_Chi_Minh",
      isEnabled: data.isEnabled || "true",
    });
  }

  return getDndSchedule(userId);
}

/**
 * Delete DND schedule
 */
export async function deleteDndSchedule(userId: number, scheduleId?: number) {
  const db = await getDb();
  if (!db) return false;

  if (scheduleId) {
    await db
      .delete(dndSchedule)
      .where(and(eq(dndSchedule.id, scheduleId), eq(dndSchedule.userId, userId)));
  } else {
    await db.delete(dndSchedule).where(eq(dndSchedule.userId, userId));
  }

  return true;
}

/**
 * Toggle DND schedule enabled state
 */
export async function toggleDndSchedule(userId: number, scheduleId: number, enabled: boolean) {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(dndSchedule)
    .set({
      isEnabled: enabled ? "true" : "false",
      updatedAt: new Date(),
    })
    .where(and(eq(dndSchedule.id, scheduleId), eq(dndSchedule.userId, userId)));

  return getDndSchedule(userId);
}

/**
 * Check if user should receive notifications based on DND schedule
 */
export async function shouldReceiveNotification(userId: number): Promise<boolean> {
  const schedule = await getDndSchedule(userId);
  
  if (!schedule) {
    return true; // No schedule means notifications are allowed
  }

  return !isDndActiveNow(schedule, schedule.timezone);
}

/**
 * Get next DND window start/end times
 */
export function getNextDndWindow(
  schedule: typeof dndSchedule.$inferSelect,
  timezone: string = "Asia/Ho_Chi_Minh"
): { start: Date; end: Date } | null {
  if (schedule.isEnabled !== "true") {
    return null;
  }

  const now = new Date();
  const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
  const [endHour, endMinute] = schedule.endTime.split(":").map(Number);

  // Create start date for today
  const start = new Date(now);
  start.setHours(startHour, startMinute, 0, 0);

  // If start time has passed today, move to tomorrow
  if (start <= now) {
    start.setDate(start.getDate() + 1);
  }

  // Calculate end time
  const end = new Date(start);
  if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
    // End time is next day
    end.setDate(end.getDate() + 1);
  }
  end.setHours(endHour, endMinute, 0, 0);

  return { start, end };
}

/**
 * Format DND schedule for display
 */
export function formatDndSchedule(schedule: typeof dndSchedule.$inferSelect): string {
  const days = schedule.daysOfWeek.split(",").map(d => parseInt(d.trim()));
  const dayNames = ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const dayStr = days.map(d => dayNames[d]).join(", ");

  return `${schedule.startTime} - ${schedule.endTime} (${dayStr})`;
}
