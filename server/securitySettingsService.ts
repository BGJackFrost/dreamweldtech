/**
 * Security Settings Service
 * Quản lý cài đặt bảo mật hệ thống
 */

import { getDb } from "./db";
import { securitySettings, user2FASettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Default security settings
const DEFAULT_SETTINGS: Record<string, { value: string; type: string; description: string }> = {
  require2FAForAdmin: {
    value: "false",
    type: "boolean",
    description: "Yêu cầu bật 2FA cho tất cả tài khoản admin",
  },
  require2FAForEditor: {
    value: "false",
    type: "boolean",
    description: "Yêu cầu bật 2FA cho tài khoản editor",
  },
  maxLoginAttempts: {
    value: "5",
    type: "number",
    description: "Số lần đăng nhập thất bại tối đa trước khi khóa tài khoản",
  },
  lockoutDuration: {
    value: "30",
    type: "number",
    description: "Thời gian khóa tài khoản (phút)",
  },
  sessionTimeout: {
    value: "1440",
    type: "number",
    description: "Thời gian hết hạn phiên đăng nhập (phút)",
  },
  passwordMinLength: {
    value: "8",
    type: "number",
    description: "Độ dài mật khẩu tối thiểu",
  },
  passwordRequireUppercase: {
    value: "true",
    type: "boolean",
    description: "Yêu cầu chữ hoa trong mật khẩu",
  },
  passwordRequireNumber: {
    value: "true",
    type: "boolean",
    description: "Yêu cầu số trong mật khẩu",
  },
  passwordRequireSpecial: {
    value: "true",
    type: "boolean",
    description: "Yêu cầu ký tự đặc biệt trong mật khẩu",
  },
  notifyNewDeviceLogin: {
    value: "true",
    type: "boolean",
    description: "Gửi email khi đăng nhập từ thiết bị mới",
  },
};

/**
 * Get a security setting by key
 */
export async function getSecuritySetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return DEFAULT_SETTINGS[key]?.value || null;
  
  try {
    const settings = await db.select()
      .from(securitySettings)
      .where(eq(securitySettings.key, key))
      .limit(1);
    
    if (settings.length > 0) {
      return settings[0].value;
    }
    
    // Return default if not found
    return DEFAULT_SETTINGS[key]?.value || null;
  } catch (error) {
    console.error("[Security Settings] Error getting setting:", error);
    return DEFAULT_SETTINGS[key]?.value || null;
  }
}

/**
 * Get a security setting as boolean
 */
export async function getSecuritySettingBool(key: string): Promise<boolean> {
  const value = await getSecuritySetting(key);
  return value === "true";
}

/**
 * Get a security setting as number
 */
export async function getSecuritySettingNumber(key: string): Promise<number> {
  const value = await getSecuritySetting(key);
  return parseInt(value || "0", 10);
}

/**
 * Set a security setting
 */
export async function setSecuritySetting(
  key: string,
  value: string,
  description?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const existing = await db.select()
      .from(securitySettings)
      .where(eq(securitySettings.key, key))
      .limit(1);
    
    const type = DEFAULT_SETTINGS[key]?.type || "string";
    const desc = description || DEFAULT_SETTINGS[key]?.description || "";
    
    if (existing.length > 0) {
      await db.update(securitySettings)
        .set({
          value,
          description: desc,
          updatedAt: new Date(),
        })
        .where(eq(securitySettings.key, key));
    } else {
      await db.insert(securitySettings).values({
        key,
        value,
        type,
        description: desc,
      });
    }
    
    return true;
  } catch (error) {
    console.error("[Security Settings] Error setting value:", error);
    return false;
  }
}

/**
 * Get all security settings
 */
export async function getAllSecuritySettings(): Promise<Record<string, any>> {
  const db = await getDb();
  const result: Record<string, any> = {};
  
  // Start with defaults
  for (const [key, setting] of Object.entries(DEFAULT_SETTINGS)) {
    result[key] = {
      value: setting.value,
      type: setting.type,
      description: setting.description,
    };
  }
  
  if (!db) return result;
  
  try {
    const settings = await db.select().from(securitySettings);
    
    for (const setting of settings) {
      result[setting.key] = {
        value: setting.value,
        type: setting.type,
        description: setting.description,
      };
    }
    
    return result;
  } catch (error) {
    console.error("[Security Settings] Error getting all settings:", error);
    return result;
  }
}

/**
 * Initialize default security settings
 */
export async function initializeSecuritySettings(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    for (const [key, setting] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await db.select()
        .from(securitySettings)
        .where(eq(securitySettings.key, key))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(securitySettings).values({
          key,
          value: setting.value,
          type: setting.type,
          description: setting.description,
        });
      }
    }
    console.log("[Security Settings] Initialized default settings");
  } catch (error) {
    console.error("[Security Settings] Error initializing settings:", error);
  }
}

/**
 * Check if 2FA is required for a user role
 */
export async function is2FARequiredForRole(role: string): Promise<boolean> {
  if (role === "admin" || role === "superadmin") {
    return await getSecuritySettingBool("require2FAForAdmin");
  }
  if (role === "editor") {
    return await getSecuritySettingBool("require2FAForEditor");
  }
  return false;
}

/**
 * Check if user has 2FA enabled
 */
export async function userHas2FAEnabled(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const settings = await db.select()
      .from(user2FASettings)
      .where(eq(user2FASettings.userId, userId))
      .limit(1);
    
    return settings.length > 0 && settings[0].isEnabled === "true";
  } catch (error) {
    console.error("[Security Settings] Error checking 2FA status:", error);
    return false;
  }
}

/**
 * Check if user needs to set up 2FA
 */
export async function userNeeds2FASetup(userId: number, role: string): Promise<boolean> {
  const required = await is2FARequiredForRole(role);
  if (!required) return false;
  
  const has2FA = await userHas2FAEnabled(userId);
  return !has2FA;
}
