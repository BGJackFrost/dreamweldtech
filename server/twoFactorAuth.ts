import { getDb } from "./db";
import { user2FASettings, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";

// App name for TOTP
const APP_NAME = "DreamWeldTech";

// Number of backup codes to generate
const BACKUP_CODES_COUNT = 10;

// Max failed attempts before lockout
const MAX_FAILED_ATTEMPTS = 5;

// Lockout duration in minutes
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Generate a random backup code
 */
function generateBackupCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Hash a backup code for storage
 */
function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}

/**
 * Get 2FA settings for a user
 */
export async function get2FASettings(userId: number): Promise<{
  isEnabled: boolean;
  hasSecret: boolean;
  backupCodesRemaining: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const settings = await db
    .select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    return {
      isEnabled: false,
      hasSecret: false,
      backupCodesRemaining: 0,
    };
  }

  const setting = settings[0];
  const backupCodes = setting.backupCodes ? JSON.parse(setting.backupCodes) : [];

  return {
    isEnabled: setting.isEnabled === "true",
    hasSecret: !!setting.totpSecret,
    backupCodesRemaining: backupCodes.length - (setting.backupCodesUsed || 0),
  };
}

/**
 * Setup 2FA for a user - generates secret and QR code
 */
export async function setup2FA(userId: number): Promise<{
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  message: string;
}> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng." };
  }

  // Get user info
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) {
    return { success: false, message: "Người dùng không tồn tại." };
  }

  const foundUser = user[0];
  const userIdentifier = foundUser.email || foundUser.username || `user_${userId}`;

  // Generate TOTP secret
  const secret = authenticator.generateSecret();

  // Generate backup codes
  const rawBackupCodes: string[] = [];
  const hashedBackupCodes: string[] = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const code = generateBackupCode();
    rawBackupCodes.push(code);
    hashedBackupCodes.push(hashBackupCode(code));
  }

  // Generate QR code URL
  const otpauthUrl = authenticator.keyuri(userIdentifier, APP_NAME, secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  // Check if settings exist
  const existingSettings = await db
    .select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .limit(1);

  if (existingSettings.length > 0) {
    // Update existing settings
    await db
      .update(user2FASettings)
      .set({
        totpSecret: secret,
        backupCodes: JSON.stringify(hashedBackupCodes),
        backupCodesUsed: 0,
        isEnabled: "false", // Not enabled until verified
        updatedAt: new Date(),
      })
      .where(eq(user2FASettings.userId, userId));
  } else {
    // Create new settings
    await db.insert(user2FASettings).values({
      userId,
      totpSecret: secret,
      backupCodes: JSON.stringify(hashedBackupCodes),
      backupCodesUsed: 0,
      isEnabled: "false",
    });
  }

  return {
    success: true,
    secret,
    qrCodeUrl,
    backupCodes: rawBackupCodes,
    message: "Đã tạo mã 2FA. Vui lòng quét QR code và xác nhận.",
  };
}

/**
 * Verify TOTP code and enable 2FA
 */
export async function verify2FASetup(
  userId: number,
  code: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng." };
  }

  const settings = await db
    .select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .limit(1);

  if (settings.length === 0 || !settings[0].totpSecret) {
    return { success: false, message: "Chưa thiết lập 2FA. Vui lòng bắt đầu lại." };
  }

  const setting = settings[0];

  // Check if locked out
  if (setting.lockedUntil && new Date(setting.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(setting.lockedUntil).getTime() - Date.now()) / 60000
    );
    return {
      success: false,
      message: `Tài khoản bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
    };
  }

  // Verify TOTP code
  if (!setting.totpSecret) {
    return {
      success: false,
      message: "Chưa thiết lập 2FA. Vui lòng bắt đầu lại.",
    };
  }
  
  const isValid = authenticator.verify({
    token: code,
    secret: setting.totpSecret,
  });

  if (!isValid) {
    // Increment failed attempts
    const newFailedAttempts = (setting.failedAttempts || 0) + 1;
    const updates: any = {
      failedAttempts: newFailedAttempts,
      updatedAt: new Date(),
    };

    // Lock out if too many failed attempts
    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = new Date();
      lockoutUntil.setMinutes(lockoutUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
      updates.lockedUntil = lockoutUntil;
    }

    await db
      .update(user2FASettings)
      .set(updates)
      .where(eq(user2FASettings.userId, userId));

    return {
      success: false,
      message: `Mã không hợp lệ. Còn ${MAX_FAILED_ATTEMPTS - newFailedAttempts} lần thử.`,
    };
  }

  // Enable 2FA
  await db
    .update(user2FASettings)
    .set({
      isEnabled: "true",
      failedAttempts: 0,
      lockedUntil: null,
      lastVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(user2FASettings.userId, userId));

  return {
    success: true,
    message: "Đã kích hoạt xác thực 2 yếu tố thành công!",
  };
}

/**
 * Verify TOTP code during login
 */
export async function verify2FACode(
  userId: number,
  code: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng." };
  }

  const settings = await db
    .select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .limit(1);

  if (settings.length === 0 || settings[0].isEnabled !== "true") {
    return { success: true, message: "2FA không được bật." };
  }

  const setting = settings[0];

  // Check if locked out
  if (setting.lockedUntil && new Date(setting.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(setting.lockedUntil).getTime() - Date.now()) / 60000
    );
    return {
      success: false,
      message: `Tài khoản bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
    };
  }

  // First try TOTP code
  if (setting.totpSecret) {
    const isValid = authenticator.verify({
      token: code,
      secret: setting.totpSecret,
    });

    if (isValid) {
      // Reset failed attempts
      await db
        .update(user2FASettings)
        .set({
          failedAttempts: 0,
          lockedUntil: null,
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(user2FASettings.userId, userId));

      return { success: true, message: "Xác thực thành công." };
    }
  }

  // Try backup code
  const backupCodes = setting.backupCodes ? JSON.parse(setting.backupCodes) : [];
  const hashedInputCode = hashBackupCode(code);
  const backupCodeIndex = backupCodes.indexOf(hashedInputCode);

  if (backupCodeIndex !== -1) {
    // Remove used backup code
    backupCodes.splice(backupCodeIndex, 1);

    await db
      .update(user2FASettings)
      .set({
        backupCodes: JSON.stringify(backupCodes),
        backupCodesUsed: (setting.backupCodesUsed || 0) + 1,
        failedAttempts: 0,
        lockedUntil: null,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user2FASettings.userId, userId));

    return {
      success: true,
      message: `Xác thực thành công bằng mã backup. Còn ${backupCodes.length} mã backup.`,
    };
  }

  // Invalid code
  const newFailedAttempts = (setting.failedAttempts || 0) + 1;
  const updates: any = {
    failedAttempts: newFailedAttempts,
    updatedAt: new Date(),
  };

  if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockoutUntil = new Date();
    lockoutUntil.setMinutes(lockoutUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
    updates.lockedUntil = lockoutUntil;
  }

  await db
    .update(user2FASettings)
    .set(updates)
    .where(eq(user2FASettings.userId, userId));

  return {
    success: false,
    message: `Mã không hợp lệ. Còn ${MAX_FAILED_ATTEMPTS - newFailedAttempts} lần thử.`,
  };
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(
  userId: number,
  code: string
): Promise<{ success: boolean; message: string }> {
  // First verify the code
  const verification = await verify2FACode(userId, code);
  if (!verification.success) {
    return verification;
  }

  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng." };
  }

  await db
    .update(user2FASettings)
    .set({
      isEnabled: "false",
      totpSecret: null,
      backupCodes: null,
      backupCodesUsed: 0,
      updatedAt: new Date(),
    })
    .where(eq(user2FASettings.userId, userId));

  return {
    success: true,
    message: "Đã tắt xác thực 2 yếu tố.",
  };
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  userId: number,
  code: string
): Promise<{
  success: boolean;
  backupCodes?: string[];
  message: string;
}> {
  // First verify the code
  const verification = await verify2FACode(userId, code);
  if (!verification.success) {
    return { success: false, message: verification.message };
  }

  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng." };
  }

  // Generate new backup codes
  const rawBackupCodes: string[] = [];
  const hashedBackupCodes: string[] = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const code = generateBackupCode();
    rawBackupCodes.push(code);
    hashedBackupCodes.push(hashBackupCode(code));
  }

  await db
    .update(user2FASettings)
    .set({
      backupCodes: JSON.stringify(hashedBackupCodes),
      backupCodesUsed: 0,
      updatedAt: new Date(),
    })
    .where(eq(user2FASettings.userId, userId));

  return {
    success: true,
    backupCodes: rawBackupCodes,
    message: "Đã tạo mã backup mới.",
  };
}

/**
 * Check if user has 2FA enabled
 */
export async function is2FAEnabled(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const settings = await db
    .select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .limit(1);

  return settings.length > 0 && settings[0].isEnabled === "true";
}
