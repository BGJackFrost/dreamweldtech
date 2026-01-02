import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import webpush from "web-push";

// VAPID keys for push notifications
// In production, these should be stored in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@dreamweldtech.com";

// Initialize web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("[Push] Web Push initialized successfully");
} else {
  console.log("[Push] VAPID keys not configured - push notifications disabled");
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

/**
 * Save a push subscription for a user
 */
export async function savePushSubscription(
  userId: number,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userAgent?: string
) {
  const db = await getDb();
  if (!db) return null;

  // Check if subscription already exists
  const [existing] = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      )
    );

  if (existing) {
    // Update existing subscription
    await db
      .update(pushSubscriptions)
      .set({
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        isActive: "true",
        updatedAt: new Date(),
      })
      .where(eq(pushSubscriptions.id, existing.id));
    
    return existing.id;
  } else {
    // Create new subscription
    const result = await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
      isActive: "true",
    });

    return result[0].insertId;
  }
}

/**
 * Remove a push subscription
 */
export async function removePushSubscription(userId: number, endpoint: string) {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );

  return true;
}

/**
 * Get all active subscriptions for a user
 */
export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, "true")
      )
    );
}

/**
 * Get all active subscriptions (for broadcast)
 */
export async function getAllActiveSubscriptions() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.isActive, "true"));
}

/**
 * Send push notification to a specific subscription
 */
async function sendToSubscription(
  subscription: typeof pushSubscriptions.$inferSelect,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.log("[Push] Skipping - VAPID keys not configured");
    return false;
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    console.error("[Push] Error sending notification:", error);

    // If subscription is invalid, mark it as inactive
    if (error.statusCode === 404 || error.statusCode === 410) {
      const db = await getDb();
      if (db) {
        await db
          .update(pushSubscriptions)
          .set({ isActive: "false" })
          .where(eq(pushSubscriptions.id, subscription.id));
      }
    }

    return false;
  }
}

/**
 * Send push notification to a user
 */
export async function sendPushToUser(userId: number, payload: PushPayload): Promise<number> {
  const subscriptions = await getUserSubscriptions(userId);
  let successCount = 0;

  for (const subscription of subscriptions) {
    const success = await sendToSubscription(subscription, payload);
    if (success) successCount++;
  }

  return successCount;
}

/**
 * Send push notification to all users (broadcast)
 */
export async function broadcastPush(payload: PushPayload): Promise<number> {
  const subscriptions = await getAllActiveSubscriptions();
  let successCount = 0;

  for (const subscription of subscriptions) {
    const success = await sendToSubscription(subscription, payload);
    if (success) successCount++;
  }

  return successCount;
}

/**
 * Send notification for new contact
 */
export async function notifyNewContact(contact: {
  name: string;
  email: string;
  subject?: string;
}) {
  const payload: PushPayload = {
    title: "Liên hệ mới",
    body: `${contact.name} - ${contact.subject || "Yêu cầu liên hệ"}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "contact",
    data: {
      type: "contact",
      url: "/admin/contacts",
    },
    actions: [
      { action: "view", title: "Xem chi tiết" },
      { action: "dismiss", title: "Bỏ qua" },
    ],
  };

  return broadcastPush(payload);
}

/**
 * Send notification for new job application
 */
export async function notifyNewApplication(application: {
  name: string;
  jobTitle: string;
}) {
  const payload: PushPayload = {
    title: "Đơn ứng tuyển mới",
    body: `${application.name} ứng tuyển vị trí ${application.jobTitle}`,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: "application",
    data: {
      type: "application",
      url: "/admin/applications",
    },
    actions: [
      { action: "view", title: "Xem CV" },
      { action: "dismiss", title: "Bỏ qua" },
    ],
  };

  return broadcastPush(payload);
}

/**
 * Send notification for new newsletter subscription
 */
export async function notifyNewSubscriber(email: string) {
  const payload: PushPayload = {
    title: "Đăng ký newsletter mới",
    body: `${email} đã đăng ký nhận tin`,
    icon: "/icons/icon-192x192.png",
    tag: "newsletter",
    data: {
      type: "newsletter",
      url: "/admin/newsletter",
    },
  };

  return broadcastPush(payload);
}

/**
 * Get VAPID public key for client
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured(): boolean {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}
