import { getDb } from "./db";
import { passwordResetTokens, users } from "../drizzle/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmailNotification } from "./email";

// Token expiration time (1 hour)
const TOKEN_EXPIRATION_HOURS = 1;

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token for storage
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Request password reset - sends email with reset link
 */
export async function requestPasswordReset(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng." };
  }

  // Find user by email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) {
    // Don't reveal if email exists - security best practice
    return {
      success: true,
      message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.",
    };
  }

  const foundUser = user[0];

  // Check if user has password auth enabled
  if (!foundUser.passwordHash) {
    return {
      success: false,
      message: "Tài khoản này sử dụng OAuth để đăng nhập. Vui lòng đăng nhập bằng OAuth.",
    };
  }

  // Generate token
  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRATION_HOURS);

  // Invalidate any existing tokens for this user
  await db
    .update(passwordResetTokens)
    .set({ isUsed: "true" })
    .where(eq(passwordResetTokens.userId, foundUser.id));

  // Create new token
  await db.insert(passwordResetTokens).values({
    userId: foundUser.id,
    token: hashedToken,
    expiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  // Send email with reset link
  const resetUrl = `${process.env.VITE_APP_URL || "https://dreamweldtech.vn"}/admin/reset-password?token=${rawToken}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0d9488; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; background: #0d9488; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DreamWeldTech</h1>
        </div>
        <div class="content">
          <h2>Yêu cầu đặt lại mật khẩu</h2>
          <p>Xin chào <strong>${foundUser.name || foundUser.username}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Đặt Lại Mật Khẩu</a>
          </p>
          <div class="warning">
            <strong>Lưu ý:</strong> Link này sẽ hết hạn sau ${TOKEN_EXPIRATION_HOURS} giờ.
          </div>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <p>Hoặc copy link sau vào trình duyệt:</p>
          <p style="word-break: break-all; font-size: 12px; color: #666;">${resetUrl}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} DreamWeldTech. All rights reserved.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmailNotification(
      {
        subject: "[DreamWeldTech] Yêu cầu đặt lại mật khẩu",
        html: emailHtml,
        text: `Đặt lại mật khẩu: ${resetUrl}`,
      },
      email
    );
  } catch (error) {
    console.error("[Password Reset] Failed to send email:", error);
    return {
      success: false,
      message: "Không thể gửi email. Vui lòng thử lại sau.",
    };
  }

  return {
    success: true,
    message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.",
  };
}

/**
 * Verify reset token
 */
export async function verifyResetToken(
  token: string
): Promise<{ valid: boolean; userId?: number; message: string }> {
  const db = await getDb();
  if (!db) {
    return { valid: false, message: "Database không khả dụng." };
  }

  const hashedToken = hashToken(token);

  const tokenRecord = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, hashedToken),
        eq(passwordResetTokens.isUsed, "false"),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (tokenRecord.length === 0) {
    return {
      valid: false,
      message: "Token không hợp lệ hoặc đã hết hạn.",
    };
  }

  return {
    valid: true,
    userId: tokenRecord[0].userId,
    message: "Token hợp lệ.",
  };
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database không khả dụng." };
  }

  // Verify token
  const verification = await verifyResetToken(token);
  if (!verification.valid || !verification.userId) {
    return {
      success: false,
      message: verification.message,
    };
  }

  // Validate password
  if (newPassword.length < 6) {
    return {
      success: false,
      message: "Mật khẩu phải có ít nhất 6 ký tự.",
    };
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update user password
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, verification.userId));

  // Mark token as used
  const hashedToken = hashToken(token);
  await db
    .update(passwordResetTokens)
    .set({ isUsed: "true" })
    .where(eq(passwordResetTokens.token, hashedToken));

  return {
    success: true,
    message: "Mật khẩu đã được đặt lại thành công.",
  };
}

/**
 * Clean up expired tokens (call periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  await db
    .delete(passwordResetTokens)
    .where(lt(passwordResetTokens.expiresAt, new Date()));

  return 0; // Drizzle doesn't return affected rows easily
}
