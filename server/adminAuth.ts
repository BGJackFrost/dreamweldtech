import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dreamweldtech-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Input validation schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Password phải có ít nhất 6 ký tự"),
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
function generateToken(userId: number, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper function to verify JWT token
export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    return decoded;
  } catch {
    return null;
  }
}

export const adminAuthRouter = router({
  // Login with username/password
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
        throw new Error("Tài khoản này không hỗ trợ đăng nhập bằng password");
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

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Generate JWT token
      const token = generateToken(user.id, user.role);

      return {
        success: true,
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
      if (!decoded) {
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
});

export type AdminAuthRouter = typeof adminAuthRouter;
