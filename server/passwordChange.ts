/**
 * Password Change Service
 * Xử lý đổi mật khẩu cho user đã đăng nhập
 */

import { getDb } from "./db";
import { users, userSessions } from "../drizzle/schema";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logAccess } from "./accessHistory";
import { sendEmailNotification } from "./email";

interface ChangePasswordResult {
  success: boolean;
  message: string;
}

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Mật khẩu phải có ít nhất 8 ký tự");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Mật khẩu phải có ít nhất 1 chữ hoa");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Mật khẩu phải có ít nhất 1 chữ thường");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Mật khẩu phải có ít nhất 1 số");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Change password for a logged-in user
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  options?: {
    logoutAllSessions?: boolean;
    currentSessionToken?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<ChangePasswordResult> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng" };
  }
  
  try {
    // Get user
    const userList = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userList.length === 0) {
      return { success: false, message: "Không tìm thấy người dùng" };
    }
    
    const user = userList[0];
    
    // Check if user has password (not OAuth-only)
    if (!user.passwordHash) {
      return { success: false, message: "Tài khoản này sử dụng đăng nhập OAuth, không thể đổi mật khẩu" };
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      // Log failed attempt
      await logAccess({
        userId,
        actionType: "password_change",
        description: "Đổi mật khẩu thất bại - mật khẩu hiện tại không đúng",
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        status: "failed",
        riskLevel: "medium",
      });
      
      return { success: false, message: "Mật khẩu hiện tại không đúng" };
    }
    
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, message: validation.errors.join(". ") };
    }
    
    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return { success: false, message: "Mật khẩu mới không được trùng với mật khẩu hiện tại" };
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await db.update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    // Log success
    await logAccess({
      userId,
      actionType: "password_change",
      description: "Đổi mật khẩu thành công",
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      status: "success",
    });
    
    // Logout all other sessions if requested
    if (options?.logoutAllSessions && options?.currentSessionToken) {
      await db.update(userSessions)
        .set({
          isRevoked: "true",
          revokedAt: new Date(),
          revokeReason: "Đổi mật khẩu - đăng xuất tất cả phiên khác",
        })
        .where(and(
          eq(userSessions.userId, userId),
          ne(userSessions.sessionToken, options.currentSessionToken),
          eq(userSessions.isRevoked, "false")
        ));
      
      await logAccess({
        userId,
        actionType: "session_revoke_all",
        description: "Đăng xuất tất cả phiên khác sau khi đổi mật khẩu",
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
      });
    }
    
    // Send notification email
    if (user.email) {
      await sendPasswordChangeNotification(user.email as string, (user.name || user.username) as string);
    }
    
    return { success: true, message: "Đổi mật khẩu thành công" };
  } catch (error) {
    console.error("[Password Change] Error:", error);
    return { success: false, message: "Có lỗi xảy ra khi đổi mật khẩu" };
  }
}

/**
 * Send password change notification email
 */
async function sendPasswordChangeNotification(
  email: string,
  name: string
): Promise<void> {
  try {
    const template = {
      subject: "🔐 Mật khẩu tài khoản DreamWeldTech đã được thay đổi",
      text: `Mật khẩu tài khoản của bạn đã được thay đổi thành công.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">DreamWeldTech</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Xin chào ${name},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Mật khẩu tài khoản của bạn đã được thay đổi thành công vào lúc 
              <strong>${new Date().toLocaleString("vi-VN")}</strong>.
            </p>
            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;">
                ⚠️ Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.VITE_APP_URL || "https://dreamweldtech.vn"}/admin/security/sessions" 
                 style="background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Kiểm tra phiên đăng nhập
              </a>
            </div>
          </div>
          <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>Email này được gửi tự động từ hệ thống bảo mật DreamWeldTech.</p>
          </div>
        </div>
      `,
    };
    
    if (email) {
      await sendEmailNotification(template, email);
    }
  } catch (error) {
    console.error("[Password Change] Error sending notification:", error);
  }
}

/**
 * Check if user can change password (has password set)
 */
export async function canChangePassword(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const userList = await db.select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return userList.length > 0 && !!userList[0].passwordHash;
  } catch (error) {
    console.error("[Password Change] Error checking password:", error);
    return false;
  }
}
