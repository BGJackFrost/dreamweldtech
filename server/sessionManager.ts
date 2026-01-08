import { getDb } from "./db";
import { userSessions } from "../drizzle/schema";
import { eq, and, desc, lt } from "drizzle-orm";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";

// Session expiration time (7 days)
const SESSION_EXPIRATION_DAYS = 7;

// Max sessions per user
const MAX_SESSIONS_PER_USER = 10;

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a session token for storage
 */
function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Parse user agent to get device info
 */
function parseUserAgent(userAgent: string): {
  deviceType: string;
  deviceName: string;
  browser: string;
  os: string;
} {
  const result = UAParser(userAgent);

  let deviceType = "desktop";
  if (result.device.type === "mobile") {
    deviceType = "mobile";
  } else if (result.device.type === "tablet") {
    deviceType = "tablet";
  }

  const deviceName = result.device.model
    ? `${result.device.vendor || ""} ${result.device.model}`.trim()
    : result.os.name || "Unknown Device";

  const browser = result.browser.name
    ? `${result.browser.name} ${result.browser.version || ""}`.trim()
    : "Unknown Browser";

  const os = result.os.name
    ? `${result.os.name} ${result.os.version || ""}`.trim()
    : "Unknown OS";

  return { deviceType, deviceName, browser, os };
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date } | null> {
  const db = await getDb();
  if (!db) return null;

  // Parse user agent
  const deviceInfo = userAgent
    ? parseUserAgent(userAgent)
    : {
        deviceType: "unknown",
        deviceName: "Unknown Device",
        browser: "Unknown Browser",
        os: "Unknown OS",
      };

  // Generate token
  const rawToken = generateSessionToken();
  const hashedToken = hashSessionToken(rawToken);

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRATION_DAYS);

  // Mark all other sessions as not current
  await db
    .update(userSessions)
    .set({ isCurrent: "false" })
    .where(eq(userSessions.userId, userId));

  // Create new session
  await db.insert(userSessions).values({
    userId,
    sessionToken: hashedToken,
    deviceType: deviceInfo.deviceType,
    deviceName: deviceInfo.deviceName,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    isCurrent: "true",
    expiresAt,
    lastActivityAt: new Date(),
  });

  // Clean up old sessions (keep only MAX_SESSIONS_PER_USER)
  await cleanupOldSessions(userId);

  return { token: rawToken, expiresAt };
}

/**
 * Validate a session token
 */
export async function validateSession(
  token: string
): Promise<{ valid: boolean; userId?: number; sessionId?: number }> {
  const db = await getDb();
  if (!db) return { valid: false };

  const hashedToken = hashSessionToken(token);

  const session = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.sessionToken, hashedToken),
        eq(userSessions.isRevoked, "false")
      )
    )
    .limit(1);

  if (session.length === 0) {
    return { valid: false };
  }

  const foundSession = session[0];

  // Check if expired
  if (new Date(foundSession.expiresAt) < new Date()) {
    return { valid: false };
  }

  // Update last activity
  await db
    .update(userSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(userSessions.id, foundSession.id));

  return {
    valid: true,
    userId: foundSession.userId,
    sessionId: foundSession.id,
  };
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(
  userId: number
): Promise<
  Array<{
    id: number;
    deviceType: string | null;
    deviceName: string | null;
    browser: string | null;
    os: string | null;
    ipAddress: string | null;
    location: string | null;
    isCurrent: boolean;
    lastActivityAt: Date;
    createdAt: Date;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.userId, userId), eq(userSessions.isRevoked, "false"))
    )
    .orderBy(desc(userSessions.lastActivityAt));

  return sessions.map((s) => ({
    id: s.id,
    deviceType: s.deviceType,
    deviceName: s.deviceName,
    browser: s.browser,
    os: s.os,
    ipAddress: s.ipAddress,
    location: s.location,
    isCurrent: s.isCurrent === "true",
    lastActivityAt: s.lastActivityAt,
    createdAt: s.createdAt,
  }));
}

/**
 * Revoke a specific session
 */
export async function revokeSession(
  userId: number,
  sessionId: number,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng." };
  }

  // Verify session belongs to user
  const session = await db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.id, sessionId), eq(userSessions.userId, userId))
    )
    .limit(1);

  if (session.length === 0) {
    return { success: false, message: "Phiên đăng nhập không tồn tại." };
  }

  await db
    .update(userSessions)
    .set({
      isRevoked: "true",
      revokedAt: new Date(),
      revokeReason: reason || "Revoked by user",
    })
    .where(eq(userSessions.id, sessionId));

  return { success: true, message: "Đã thu hồi phiên đăng nhập." };
}

/**
 * Revoke all sessions for a user (except current)
 */
export async function revokeAllSessions(
  userId: number,
  currentSessionToken?: string,
  reason?: string
): Promise<{ success: boolean; count: number; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, count: 0, message: "Database không khả dụng." };
  }

  // Get all active sessions
  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.userId, userId), eq(userSessions.isRevoked, "false"))
    );

  let revokedCount = 0;
  const currentHashedToken = currentSessionToken
    ? hashSessionToken(currentSessionToken)
    : null;

  for (const session of sessions) {
    // Skip current session if provided
    if (currentHashedToken && session.sessionToken === currentHashedToken) {
      continue;
    }

    await db
      .update(userSessions)
      .set({
        isRevoked: "true",
        revokedAt: new Date(),
        revokeReason: reason || "Revoked all sessions",
      })
      .where(eq(userSessions.id, session.id));

    revokedCount++;
  }

  return {
    success: true,
    count: revokedCount,
    message: `Đã thu hồi ${revokedCount} phiên đăng nhập.`,
  };
}

/**
 * Clean up old sessions for a user
 */
async function cleanupOldSessions(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get all sessions ordered by last activity
  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.userId, userId), eq(userSessions.isRevoked, "false"))
    )
    .orderBy(desc(userSessions.lastActivityAt));

  // Revoke sessions beyond the limit
  if (sessions.length > MAX_SESSIONS_PER_USER) {
    const sessionsToRevoke = sessions.slice(MAX_SESSIONS_PER_USER);
    for (const session of sessionsToRevoke) {
      await db
        .update(userSessions)
        .set({
          isRevoked: "true",
          revokedAt: new Date(),
          revokeReason: "Session limit exceeded",
        })
        .where(eq(userSessions.id, session.id));
    }
  }
}

/**
 * Clean up expired sessions (call periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Revoke expired sessions
  await db
    .update(userSessions)
    .set({
      isRevoked: "true",
      revokedAt: new Date(),
      revokeReason: "Session expired",
    })
    .where(
      and(
        eq(userSessions.isRevoked, "false"),
        lt(userSessions.expiresAt, new Date())
      )
    );

  return 0;
}

/**
 * Get session count for a user
 */
export async function getSessionCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const sessions = await db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.userId, userId), eq(userSessions.isRevoked, "false"))
    );

  return sessions.length;
}
