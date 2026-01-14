import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users, user2FASettings } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dreamweldtech-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";
const TEMP_TOKEN_EXPIRES_IN = "5m"; // Temporary token for 2FA verification

// Input validation schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Password phải có ít nhất 6 ký tự"),
});

const login2FASchema = z.object({
  tempToken: z.string(),
  code: z.string().min(6, "Mã 2FA phải có ít nhất 6 ký tự"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username phải có ít nhất 3 ký tự").max(50),
  password: z.string().min(6, "Password phải có ít nhất 6 ký tự"),
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, "Password mới phải có ít nhất 6 ký tự"),
});

// Helper function to generate JWT token
function generateToken(userId: number, role: string, expiresIn: string = JWT_EXPIRES_IN): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
}

// Helper function to generate temporary token for 2FA
function generateTempToken(userId: number, role: string): string {
  return jwt.sign(
    { userId, role, type: "2fa_pending" },
    JWT_SECRET,
    { expiresIn: TEMP_TOKEN_EXPIRES_IN }
  );
}

// Helper function to verify JWT token
export function verifyToken(token: string): { userId: number; role: string; type?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string; type?: string };
    return decoded;
  } catch {
    return null;
  }
}

// Hash backup code for comparison
function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toUpperCase()).digest("hex");
}

// Check if user has 2FA enabled
async function check2FAEnabled(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const settings = await db
    .select()
    .from(user2FASettings)
    .where(eq(user2FASettings.userId, userId))
    .limit(1);

  return settings.length > 0 && settings[0].isEnabled === "true";
}

// Verify 2FA code (TOTP or backup code)
async function verify2FACodeInternal(userId: number, code: string): Promise<{ success: boolean; message: string; isBackupCode?: boolean }> {
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
      message: `Tài khoản bị khóa do nhập sai mã quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`,
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
      isBackupCode: true,
    };
  }

  // Invalid code - increment failed attempts
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MINUTES = 15;
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

  const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
  if (remainingAttempts <= 0) {
    return {
      success: false,
      message: `Mã không hợp lệ. Tài khoản đã bị khóa ${LOCKOUT_DURATION_MINUTES} phút.`,
    };
  }

  return {
    success: false,
    message: `Mã không hợp lệ. Còn ${remainingAttempts} lần thử.`,
  };
}

export const adminAuthRouter = router({
  // Login with username/password - Step 1
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database không khả dụng");
      }

      // Find user by username
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) {
        throw new Error("Username hoặc password không đúng");
      }

      // Check if user has password set
      if (!user.passwordHash) {
        throw new Error("Tài khoản này không hỗ trợ đăng nhập bằng password. Vui lòng sử dụng đăng nhập OAuth.");
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error("Username hoặc password không đúng");
      }

      // Check if user is admin or editor
      if (user.role !== "admin" && user.role !== "editor") {
        throw new Error("Bạn không có quyền truy cập trang quản trị");
      }

      // Check if 2FA is enabled
      const has2FA = await check2FAEnabled(user.id);

      if (has2FA) {
        // Generate temporary token for 2FA verification
        const tempToken = generateTempToken(user.id, user.role);
        
        return {
          success: true,
          requires2FA: true,
          tempToken,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }

      // No 2FA - complete login
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      const token = generateToken(user.id, user.role);

      return {
        success: true,
        requires2FA: false,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  // Verify 2FA code - Step 2 (only if 2FA is enabled)
  verify2FA: publicProcedure
    .input(login2FASchema)
    .mutation(async ({ input }) => {
      // Verify temp token
      const decoded = verifyToken(input.tempToken);
      if (!decoded || decoded.type !== "2fa_pending") {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database không khả dụng");
      }

      // Verify 2FA code
      const verification = await verify2FACodeInternal(decoded.userId, input.code);
      if (!verification.success) {
        throw new Error(verification.message);
      }

      // Get user info
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user) {
        throw new Error("Không tìm thấy tài khoản");
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Generate full access token
      const token = generateToken(user.id, user.role);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username || "",
          name: user.name || "",
          email: user.email || "",
          role: user.role,
        },
        message: verification.isBackupCode 
          ? verification.message 
          : "Đăng nhập thành công!",
      };
    }),

  // Check if user has 2FA enabled (for login flow)
  check2FAStatus: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { has2FA: false };
      }

      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) {
        return { has2FA: false };
      }

      const has2FA = await check2FAEnabled(user.id);
      return { has2FA };
    }),

  // Register first admin (only works if no admin exists)
  registerFirstAdmin: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database không khả dụng");
      }

      // Check if any admin already exists
      const [existingAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);

      if (existingAdmin) {
        throw new Error("Đã có admin trong hệ thống. Vui lòng liên hệ admin hiện tại để được cấp quyền.");
      }

      // Check if username already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (existingUser) {
        throw new Error("Username đã tồn tại");
      }

      // Check if email already exists
      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingEmail) {
        throw new Error("Email đã được sử dụng");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Create admin user
      const [newUser] = await db
        .insert(users)
        .values({
          openId: `local-admin-${Date.now()}`,
          username: input.username,
          passwordHash,
          name: input.name,
          email: input.email,
          loginMethod: "local",
          role: "admin",
        })
        .$returningId();

      // Generate JWT token
      const token = generateToken(newUser.id, "admin");

      return {
        success: true,
        message: "Tạo tài khoản admin thành công",
        token,
        user: {
          id: newUser.id,
          username: input.username,
          name: input.name,
          email: input.email,
          role: "admin",
        },
      };
    }),

  // Check if admin exists (for showing register form)
  checkAdminExists: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return { exists: false };
    }

    const [existingAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    return { exists: !!existingAdmin };
  }),

  // Get current user from token
  me: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const decoded = verifyToken(input.token);
      if (!decoded) {
        return { user: null };
      }

      // Reject temp tokens (2FA pending)
      if (decoded.type === "2fa_pending") {
        return { user: null };
      }

      const db = await getDb();
      if (!db) {
        return { user: null };
      }

      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      return { user: user || null };
    }),

  // Change password (for logged in admin)
  changePassword: publicProcedure
    .input(z.object({
      token: z.string(),
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const decoded = verifyToken(input.token);
      if (!decoded || decoded.type === "2fa_pending") {
        throw new Error("Token không hợp lệ hoặc đã hết hạn");
      }

      const db = await getDb();
      if (!db) {
        throw new Error("Database không khả dụng");
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user || !user.passwordHash) {
        throw new Error("Không tìm thấy tài khoản");
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new Error("Mật khẩu hiện tại không đúng");
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

      // Update password
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      return { success: true, message: "Đổi mật khẩu thành công" };
    }),

  // Logout (client-side only, just for API consistency)
  logout: publicProcedure.mutation(async () => {
    return { success: true, message: "Đăng xuất thành công" };
  }),

  // Get OAuth URL for admin login
  getOAuthUrl: publicProcedure.query(async () => {
    const portalUrl = process.env.VITE_OAUTH_PORTAL_URL;
    const appId = process.env.VITE_APP_ID;
    
    if (!portalUrl || !appId) {
      return { url: null, error: "OAuth chưa được cấu hình" };
    }

    // Build OAuth URL with admin callback
    const callbackUrl = `${process.env.VITE_OAUTH_PORTAL_URL?.replace('/portal', '')}/api/oauth/admin-callback`;
    const oauthUrl = `${portalUrl}?app_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}`;
    
    return { url: oauthUrl };
  }),

  // OAuth login for admin (called after OAuth callback)
  loginWithOAuth: publicProcedure
    .input(z.object({ openId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database không khả dụng");
      }

      // Find user by openId
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.openId, input.openId))
        .limit(1);

      if (!user) {
        throw new Error("Tài khoản chưa được đăng ký trong hệ thống. Vui lòng liên hệ admin.");
      }

      // Check if user has admin or editor role
      if (user.role !== "admin" && user.role !== "editor") {
        throw new Error("Bạn không có quyền truy cập trang quản trị");
      }

      // Check if 2FA is enabled
      const has2FA = await check2FAEnabled(user.id);

      if (has2FA) {
        // Generate temporary token for 2FA verification
        const tempToken = generateTempToken(user.id, user.role);
        
        return {
          success: true,
          requires2FA: true,
          tempToken,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }

      // No 2FA - complete login
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      const token = generateToken(user.id, user.role);

      return {
        success: true,
        requires2FA: false,
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),
});

export type AdminAuthRouter = typeof adminAuthRouter;
