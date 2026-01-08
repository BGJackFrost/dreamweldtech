/**
 * User Access History Service
 * Ghi log và quản lý lịch sử truy cập của user
 */

import { getDb } from "./db";
import { userAccessHistory, knownDevices, userSecurityPreferences } from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { sendEmailNotification } from "./email";

// Action types
export type ActionType = 
  | "login"
  | "login_failed"
  | "logout"
  | "password_change"
  | "password_reset_request"
  | "password_reset_complete"
  | "2fa_enable"
  | "2fa_disable"
  | "2fa_verify"
  | "2fa_verify_failed"
  | "profile_update"
  | "session_revoke"
  | "session_revoke_all"
  | "new_device_login"
  | "suspicious_activity";

interface LogAccessParams {
  userId: number;
  actionType: ActionType;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  status?: "success" | "failed" | "blocked";
  riskLevel?: "low" | "medium" | "high";
}

/**
 * Generate device fingerprint from user agent and IP
 */
function generateDeviceFingerprint(userAgent: string, ipAddress?: string): string {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  
  const fingerprintData = [
    browser.name || "unknown",
    browser.version?.split(".")[0] || "0",
    os.name || "unknown",
    os.version || "unknown",
    device.type || "desktop",
    device.vendor || "unknown",
  ].join("|");
  
  return crypto.createHash("sha256").update(fingerprintData).digest("hex").substring(0, 32);
}

/**
 * Parse user agent to get device info
 */
function parseUserAgent(userAgent: string) {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  
  return {
    browser: browser.name ? `${browser.name} ${browser.version || ""}`.trim() : "Unknown",
    os: os.name ? `${os.name} ${os.version || ""}`.trim() : "Unknown",
    deviceType: device.type || "desktop",
    deviceName: device.vendor ? `${device.vendor} ${device.model || ""}`.trim() : 
                device.type === "mobile" ? "Mobile Device" : 
                device.type === "tablet" ? "Tablet" : "Desktop",
  };
}

/**
 * Log user access/action
 */
export async function logAccess(params: LogAccessParams): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const deviceInfo = params.userAgent ? parseUserAgent(params.userAgent) : null;
    
    await db.insert(userAccessHistory).values({
      userId: params.userId,
      actionType: params.actionType,
      description: params.description || getDefaultDescription(params.actionType),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      deviceInfo: deviceInfo?.deviceName,
      browser: deviceInfo?.browser,
      os: deviceInfo?.os,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      status: params.status || "success",
      riskLevel: params.riskLevel || "low",
    });
    
    return true;
  } catch (error) {
    console.error("[Access History] Error logging access:", error);
    return false;
  }
}

/**
 * Get default description for action type
 */
function getDefaultDescription(actionType: ActionType): string {
  const descriptions: Record<ActionType, string> = {
    login: "Đăng nhập thành công",
    login_failed: "Đăng nhập thất bại",
    logout: "Đăng xuất",
    password_change: "Đổi mật khẩu",
    password_reset_request: "Yêu cầu đặt lại mật khẩu",
    password_reset_complete: "Đặt lại mật khẩu thành công",
    "2fa_enable": "Bật xác thực 2 yếu tố",
    "2fa_disable": "Tắt xác thực 2 yếu tố",
    "2fa_verify": "Xác thực 2FA thành công",
    "2fa_verify_failed": "Xác thực 2FA thất bại",
    profile_update: "Cập nhật thông tin cá nhân",
    session_revoke: "Thu hồi phiên đăng nhập",
    session_revoke_all: "Thu hồi tất cả phiên đăng nhập",
    new_device_login: "Đăng nhập từ thiết bị mới",
    suspicious_activity: "Phát hiện hoạt động đáng ngờ",
  };
  return descriptions[actionType] || actionType;
}

/**
 * Get user access history
 */
export async function getUserAccessHistory(
  userId: number,
  options?: {
    limit?: number;
    offset?: number;
    actionType?: ActionType;
    startDate?: Date;
    endDate?: Date;
    status?: "success" | "failed" | "blocked";
  }
): Promise<{ history: any[]; total: number }> {
  const db = await getDb();
  if (!db) return { history: [], total: 0 };
  
  try {
    const conditions = [eq(userAccessHistory.userId, userId)];
    
    if (options?.actionType) {
      conditions.push(eq(userAccessHistory.actionType, options.actionType));
    }
    if (options?.status) {
      conditions.push(eq(userAccessHistory.status, options.status));
    }
    if (options?.startDate) {
      conditions.push(gte(userAccessHistory.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(userAccessHistory.createdAt, options.endDate));
    }
    
    const [history, countResult] = await Promise.all([
      db.select()
        .from(userAccessHistory)
        .where(and(...conditions))
        .orderBy(desc(userAccessHistory.createdAt))
        .limit(options?.limit || 50)
        .offset(options?.offset || 0),
      db.select({ count: sql<number>`count(*)` })
        .from(userAccessHistory)
        .where(and(...conditions)),
    ]);
    
    return {
      history,
      total: countResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("[Access History] Error getting history:", error);
    return { history: [], total: 0 };
  }
}

/**
 * Check if device is known for user
 */
export async function isKnownDevice(
  userId: number,
  userAgent: string,
  ipAddress?: string
): Promise<{ isKnown: boolean; device: any | null }> {
  const db = await getDb();
  if (!db) return { isKnown: false, device: null };
  
  try {
    const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);
    
    const devices = await db.select()
      .from(knownDevices)
      .where(and(
        eq(knownDevices.userId, userId),
        eq(knownDevices.deviceFingerprint, fingerprint)
      ))
      .limit(1);
    
    if (devices.length > 0) {
      // Update last seen
      await db.update(knownDevices)
        .set({
          lastSeenAt: new Date(),
          lastIpAddress: ipAddress,
        })
        .where(eq(knownDevices.id, devices[0].id));
      
      return { isKnown: true, device: devices[0] };
    }
    
    return { isKnown: false, device: null };
  } catch (error) {
    console.error("[Access History] Error checking known device:", error);
    return { isKnown: false, device: null };
  }
}

/**
 * Add device to known devices
 */
export async function addKnownDevice(
  userId: number,
  userAgent: string,
  ipAddress?: string,
  trusted: boolean = false
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);
    const deviceInfo = parseUserAgent(userAgent);
    
    // Check if already exists
    const existing = await db.select()
      .from(knownDevices)
      .where(and(
        eq(knownDevices.userId, userId),
        eq(knownDevices.deviceFingerprint, fingerprint)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0].id;
    }
    
    const result = await db.insert(knownDevices).values({
      userId,
      deviceFingerprint: fingerprint,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      lastIpAddress: ipAddress,
      isTrusted: trusted ? "true" : "false",
    });
    
    return result[0].insertId;
  } catch (error) {
    console.error("[Access History] Error adding known device:", error);
    return null;
  }
}

/**
 * Get user's known devices
 */
export async function getUserKnownDevices(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select()
      .from(knownDevices)
      .where(eq(knownDevices.userId, userId))
      .orderBy(desc(knownDevices.lastSeenAt));
  } catch (error) {
    console.error("[Access History] Error getting known devices:", error);
    return [];
  }
}

/**
 * Remove known device
 */
export async function removeKnownDevice(userId: number, deviceId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(knownDevices)
      .where(and(
        eq(knownDevices.id, deviceId),
        eq(knownDevices.userId, userId)
      ));
    return true;
  } catch (error) {
    console.error("[Access History] Error removing known device:", error);
    return false;
  }
}

/**
 * Get user security preferences
 */
export async function getUserSecurityPreferences(userId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const prefs = await db.select()
      .from(userSecurityPreferences)
      .where(eq(userSecurityPreferences.userId, userId))
      .limit(1);
    
    if (prefs.length > 0) {
      return prefs[0];
    }
    
    // Create default preferences
    await db.insert(userSecurityPreferences).values({
      userId,
    });
    
    const newPrefs = await db.select()
      .from(userSecurityPreferences)
      .where(eq(userSecurityPreferences.userId, userId))
      .limit(1);
    
    return newPrefs[0] || null;
  } catch (error) {
    console.error("[Access History] Error getting security preferences:", error);
    return null;
  }
}

/**
 * Update user security preferences
 */
export async function updateUserSecurityPreferences(
  userId: number,
  preferences: Partial<{
    notifyOnNewLogin: boolean;
    notifyOnPasswordChange: boolean;
    notifyOn2FAChange: boolean;
    require2FAForSensitiveActions: boolean;
  }>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const updateData: any = { updatedAt: new Date() };
    
    if (preferences.notifyOnNewLogin !== undefined) {
      updateData.notifyOnNewLogin = preferences.notifyOnNewLogin ? "true" : "false";
    }
    if (preferences.notifyOnPasswordChange !== undefined) {
      updateData.notifyOnPasswordChange = preferences.notifyOnPasswordChange ? "true" : "false";
    }
    if (preferences.notifyOn2FAChange !== undefined) {
      updateData.notifyOn2FAChange = preferences.notifyOn2FAChange ? "true" : "false";
    }
    if (preferences.require2FAForSensitiveActions !== undefined) {
      updateData.require2FAForSensitiveActions = preferences.require2FAForSensitiveActions ? "true" : "false";
    }
    
    // Check if exists
    const existing = await db.select()
      .from(userSecurityPreferences)
      .where(eq(userSecurityPreferences.userId, userId))
      .limit(1);
    
    if (existing.length > 0) {
      await db.update(userSecurityPreferences)
        .set(updateData)
        .where(eq(userSecurityPreferences.userId, userId));
    } else {
      await db.insert(userSecurityPreferences).values({
        userId,
        ...updateData,
      });
    }
    
    return true;
  } catch (error) {
    console.error("[Access History] Error updating security preferences:", error);
    return false;
  }
}

/**
 * Send new login notification email
 */
export async function sendNewLoginNotification(
  userEmail: string,
  userName: string,
  deviceInfo: {
    browser: string;
    os: string;
    ipAddress?: string;
    location?: string;
  }
): Promise<boolean> {
  try {
    const template = {
      subject: "🔐 Đăng nhập mới vào tài khoản DreamWeldTech",
      text: `Đăng nhập mới vào tài khoản của bạn từ ${deviceInfo.browser} trên ${deviceInfo.os}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">DreamWeldTech</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Xin chào ${userName},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Chúng tôi phát hiện một đăng nhập mới vào tài khoản của bạn:
            </p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0d9488;">
              <p style="margin: 5px 0;"><strong>🌐 Trình duyệt:</strong> ${deviceInfo.browser}</p>
              <p style="margin: 5px 0;"><strong>💻 Hệ điều hành:</strong> ${deviceInfo.os}</p>
              ${deviceInfo.ipAddress ? `<p style="margin: 5px 0;"><strong>🔗 Địa chỉ IP:</strong> ${deviceInfo.ipAddress}</p>` : ""}
              ${deviceInfo.location ? `<p style="margin: 5px 0;"><strong>📍 Vị trí:</strong> ${deviceInfo.location}</p>` : ""}
              <p style="margin: 5px 0;"><strong>⏰ Thời gian:</strong> ${new Date().toLocaleString("vi-VN")}</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">
              Nếu đây không phải là bạn, vui lòng đổi mật khẩu ngay lập tức và liên hệ với chúng tôi.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.VITE_APP_URL || "https://dreamweldtech.vn"}/admin/security/sessions" 
                 style="background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Quản lý phiên đăng nhập
              </a>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>Email này được gửi tự động từ hệ thống bảo mật DreamWeldTech.</p>
          </div>
        </div>
      `,
    };
    const result = await sendEmailNotification(template, userEmail);
    
    return result.success;
  } catch (error) {
    console.error("[Access History] Error sending new login notification:", error);
    return false;
  }
}

/**
 * Handle login and check for new device
 */
export async function handleLoginWithDeviceCheck(
  userId: number,
  userEmail: string,
  userName: string,
  userAgent: string,
  ipAddress?: string
): Promise<{ isNewDevice: boolean; deviceId: number | null }> {
  // Check if device is known
  const { isKnown, device } = await isKnownDevice(userId, userAgent, ipAddress);
  
  const deviceInfo = parseUserAgent(userAgent);
  
  // Log the login
  await logAccess({
    userId,
    actionType: isKnown ? "login" : "new_device_login",
    description: isKnown ? "Đăng nhập thành công" : "Đăng nhập từ thiết bị mới",
    ipAddress,
    userAgent,
    riskLevel: isKnown ? "low" : "medium",
  });
  
  if (!isKnown) {
    // Add to known devices
    const deviceId = await addKnownDevice(userId, userAgent, ipAddress);
    
    // Check user preferences for notification
    const prefs = await getUserSecurityPreferences(userId);
    if (prefs?.notifyOnNewLogin === "true") {
      await sendNewLoginNotification(userEmail, userName, {
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress,
      });
    }
    
    return { isNewDevice: true, deviceId };
  }
  
  return { isNewDevice: false, deviceId: device?.id || null };
}
