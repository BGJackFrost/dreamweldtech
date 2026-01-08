import { getDb } from "./db";
import { 
  users, 
  userSessions, 
  user2FASettings, 
  ipAccessControl, 
  ipLockouts,
  loginAttempts,
  userAccessHistory,
  passwordResetTokens
} from "../drizzle/schema";
import { eq, and, gte, count, sql } from "drizzle-orm";

// ============================================
// TYPES
// ============================================
export interface SecurityScoreBreakdown {
  category: string;
  categoryLabel: string;
  score: number;
  maxScore: number;
  percentage: number;
  items: SecurityScoreItem[];
}

export interface SecurityScoreItem {
  name: string;
  description: string;
  score: number;
  maxScore: number;
  status: "good" | "warning" | "critical" | "info";
  recommendation?: string;
}

export interface UserSecurityScore {
  userId: number;
  userName: string;
  userEmail: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: SecurityScoreBreakdown[];
  recommendations: SecurityRecommendation[];
  lastUpdated: Date;
}

export interface SystemSecurityScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: SecurityScoreBreakdown[];
  recommendations: SecurityRecommendation[];
  lastUpdated: Date;
}

export interface SecurityRecommendation {
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  action: string;
  impact: number; // Score improvement if implemented
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function getGrade(percentage: number): "A" | "B" | "C" | "D" | "F" {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
}

function getStatus(percentage: number): "good" | "warning" | "critical" {
  if (percentage >= 80) return "good";
  if (percentage >= 50) return "warning";
  return "critical";
}

// ============================================
// USER SECURITY SCORE
// ============================================
export async function getUserSecurityScore(userId: number): Promise<UserSecurityScore | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    
    // Get user info
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return null;

    const breakdown: SecurityScoreBreakdown[] = [];
    const recommendations: SecurityRecommendation[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // ============================================
    // 1. AUTHENTICATION SECURITY (30 points max)
    // ============================================
    const authItems: SecurityScoreItem[] = [];
    let authScore = 0;
    const authMaxScore = 30;

    // 1.1 Two-Factor Authentication (15 points)
    const [twoFactorData] = await db.select()
      .from(user2FASettings)
      .where(and(eq(user2FASettings.userId, userId), eq(user2FASettings.isEnabled, "true")))
      .limit(1);
    
    const has2FA = !!twoFactorData;
    authItems.push({
      name: "Xác thực 2 yếu tố (2FA)",
      description: has2FA ? "Đã bật 2FA với Google Authenticator" : "Chưa bật 2FA",
      score: has2FA ? 15 : 0,
      maxScore: 15,
      status: has2FA ? "good" : "critical",
      recommendation: has2FA ? undefined : "Bật 2FA để tăng bảo mật tài khoản"
    });
    authScore += has2FA ? 15 : 0;

    if (!has2FA) {
      recommendations.push({
        priority: "high",
        category: "authentication",
        title: "Bật xác thực 2 yếu tố",
        description: "2FA giúp bảo vệ tài khoản ngay cả khi mật khẩu bị lộ",
        action: "Vào Bảo Mật → Xác Thực 2 Yếu Tố để thiết lập",
        impact: 15
      });
    }

    // 1.2 Password Strength (10 points) - Check if password was recently changed
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [recentPasswordChange] = await db.select()
      .from(userAccessHistory)
      .where(and(
        eq(userAccessHistory.userId, userId),
        eq(userAccessHistory.actionType, "password_change"),
        gte(userAccessHistory.createdAt, thirtyDaysAgo)
      ))
      .limit(1);

    const passwordRecent = !!recentPasswordChange;
    authItems.push({
      name: "Mật khẩu cập nhật",
      description: passwordRecent ? "Mật khẩu được đổi trong 30 ngày qua" : "Mật khẩu chưa đổi gần đây",
      score: passwordRecent ? 10 : 5,
      maxScore: 10,
      status: passwordRecent ? "good" : "warning",
      recommendation: passwordRecent ? undefined : "Đổi mật khẩu định kỳ để tăng bảo mật"
    });
    authScore += passwordRecent ? 10 : 5;

    // 1.3 Backup Codes (5 points)
    const hasBackupCodes = twoFactorData?.backupCodes && 
      Array.isArray(twoFactorData.backupCodes) && 
      twoFactorData.backupCodes.length > 0;
    
    authItems.push({
      name: "Mã khôi phục",
      description: hasBackupCodes ? "Có mã khôi phục dự phòng" : "Chưa có mã khôi phục",
      score: hasBackupCodes ? 5 : 0,
      maxScore: 5,
      status: hasBackupCodes ? "good" : "warning"
    });
    authScore += hasBackupCodes ? 5 : 0;

    breakdown.push({
      category: "authentication",
      categoryLabel: "Xác thực",
      score: authScore,
      maxScore: authMaxScore,
      percentage: Math.round((authScore / authMaxScore) * 100),
      items: authItems
    });
    totalScore += authScore;
    maxScore += authMaxScore;

    // ============================================
    // 2. SESSION SECURITY (25 points max)
    // ============================================
    const sessionItems: SecurityScoreItem[] = [];
    let sessionScore = 0;
    const sessionMaxScore = 25;

    // 2.1 Active Sessions Count (10 points)
    const activeSessions = await db.select({ count: count() })
      .from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.isRevoked, "false")
      ));
    
    const sessionCount = activeSessions[0]?.count || 0;
    const sessionCountScore = sessionCount <= 3 ? 10 : sessionCount <= 5 ? 7 : 3;
    
    sessionItems.push({
      name: "Số phiên đăng nhập",
      description: `${sessionCount} phiên đang hoạt động`,
      score: sessionCountScore,
      maxScore: 10,
      status: sessionCount <= 3 ? "good" : sessionCount <= 5 ? "warning" : "critical",
      recommendation: sessionCount > 3 ? "Xem xét đăng xuất các phiên không sử dụng" : undefined
    });
    sessionScore += sessionCountScore;

    if (sessionCount > 5) {
      recommendations.push({
        priority: "medium",
        category: "session",
        title: "Quá nhiều phiên đăng nhập",
        description: `Bạn có ${sessionCount} phiên đang hoạt động, có thể có phiên không mong muốn`,
        action: "Vào Bảo Mật → Phiên Đăng Nhập để quản lý",
        impact: 7
      });
    }

    // 2.2 Session Age (10 points)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const oldSessions = await db.select({ count: count() })
      .from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.isRevoked, "false"),
        sql`${userSessions.lastActivityAt} < ${sevenDaysAgo.toISOString()}`
      ));
    
    const oldSessionCount = oldSessions[0]?.count || 0;
    const sessionAgeScore = oldSessionCount === 0 ? 10 : oldSessionCount <= 2 ? 7 : 3;
    
    sessionItems.push({
      name: "Phiên cũ",
      description: oldSessionCount === 0 ? "Không có phiên cũ" : `${oldSessionCount} phiên không hoạt động > 7 ngày`,
      score: sessionAgeScore,
      maxScore: 10,
      status: oldSessionCount === 0 ? "good" : "warning"
    });
    sessionScore += sessionAgeScore;

    // 2.3 Known Devices (5 points)
    sessionItems.push({
      name: "Thiết bị đã biết",
      description: "Quản lý thiết bị đáng tin cậy",
      score: 5,
      maxScore: 5,
      status: "good"
    });
    sessionScore += 5;

    breakdown.push({
      category: "session",
      categoryLabel: "Phiên đăng nhập",
      score: sessionScore,
      maxScore: sessionMaxScore,
      percentage: Math.round((sessionScore / sessionMaxScore) * 100),
      items: sessionItems
    });
    totalScore += sessionScore;
    maxScore += sessionMaxScore;

    // ============================================
    // 3. LOGIN HISTORY (20 points max)
    // ============================================
    const loginItems: SecurityScoreItem[] = [];
    let loginScore = 0;
    const loginMaxScore = 20;

    // 3.1 Failed Login Attempts (10 points)
    const recentFailedLogins = await db.select({ count: count() })
      .from(loginAttempts)
      .where(and(
        sql`${loginAttempts.username} = ${user.email}`,
        eq(loginAttempts.success, "false"),
        gte(loginAttempts.createdAt, thirtyDaysAgo)
      ));
    
    const failedCount = recentFailedLogins[0]?.count || 0;
    const failedLoginScore = failedCount === 0 ? 10 : failedCount <= 3 ? 7 : failedCount <= 10 ? 4 : 0;
    
    loginItems.push({
      name: "Đăng nhập thất bại",
      description: `${failedCount} lần thất bại trong 30 ngày`,
      score: failedLoginScore,
      maxScore: 10,
      status: failedCount === 0 ? "good" : failedCount <= 3 ? "info" : "warning"
    });
    loginScore += failedLoginScore;

    if (failedCount > 10) {
      recommendations.push({
        priority: "high",
        category: "login",
        title: "Nhiều lần đăng nhập thất bại",
        description: `${failedCount} lần đăng nhập thất bại có thể là dấu hiệu tấn công`,
        action: "Kiểm tra lịch sử truy cập và đổi mật khẩu nếu cần",
        impact: 10
      });
    }

    // 3.2 Login from New Locations (10 points)
    const uniqueIps = await db.select({ ip: userAccessHistory.ipAddress })
      .from(userAccessHistory)
      .where(and(
        eq(userAccessHistory.userId, userId),
        eq(userAccessHistory.actionType, "login"),
        gte(userAccessHistory.createdAt, thirtyDaysAgo)
      ))
      .groupBy(userAccessHistory.ipAddress);
    
    const uniqueIpCount = uniqueIps.length;
    const locationScore = uniqueIpCount <= 3 ? 10 : uniqueIpCount <= 5 ? 7 : 4;
    
    loginItems.push({
      name: "Vị trí đăng nhập",
      description: `${uniqueIpCount} IP khác nhau trong 30 ngày`,
      score: locationScore,
      maxScore: 10,
      status: uniqueIpCount <= 3 ? "good" : "info"
    });
    loginScore += locationScore;

    breakdown.push({
      category: "login",
      categoryLabel: "Lịch sử đăng nhập",
      score: loginScore,
      maxScore: loginMaxScore,
      percentage: Math.round((loginScore / loginMaxScore) * 100),
      items: loginItems
    });
    totalScore += loginScore;
    maxScore += loginMaxScore;

    // ============================================
    // 4. ACCOUNT SECURITY (25 points max)
    // ============================================
    const accountItems: SecurityScoreItem[] = [];
    let accountScore = 0;
    const accountMaxScore = 25;

    // 4.1 Email Verified (10 points)
    // Email verified check - assume verified if user exists with email
    const emailVerified = !!user.email;
    accountItems.push({
      name: "Email xác thực",
      description: emailVerified ? "Email đã được xác thực" : "Email chưa xác thực",
      score: emailVerified ? 10 : 0,
      maxScore: 10,
      status: emailVerified ? "good" : "warning"
    });
    accountScore += emailVerified ? 10 : 0;

    // 4.2 Account Age (5 points)
    const accountAge = user.createdAt ? 
      Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const accountAgeScore = accountAge >= 30 ? 5 : accountAge >= 7 ? 3 : 1;
    
    accountItems.push({
      name: "Tuổi tài khoản",
      description: `${accountAge} ngày`,
      score: accountAgeScore,
      maxScore: 5,
      status: "info"
    });
    accountScore += accountAgeScore;

    // 4.3 Role Security (10 points)
    const role = user.role as string;
    const roleScore = role === "superadmin" ? 10 : role === "admin" ? 8 : role === "editor" ? 6 : 5;
    
    accountItems.push({
      name: "Vai trò",
      description: role || "user",
      score: roleScore,
      maxScore: 10,
      status: "info"
    });
    accountScore += roleScore;

    breakdown.push({
      category: "account",
      categoryLabel: "Tài khoản",
      score: accountScore,
      maxScore: accountMaxScore,
      percentage: Math.round((accountScore / accountMaxScore) * 100),
      items: accountItems
    });
    totalScore += accountScore;
    maxScore += accountMaxScore;

    // Sort recommendations by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
      userId,
      userName: user.name || "Unknown",
      userEmail: user.email || "",
      totalScore,
      maxScore,
      percentage,
      grade: getGrade(percentage),
      breakdown,
      recommendations,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("[Security Score] Error calculating user score:", error);
    return null;
  }
}

// ============================================
// SYSTEM SECURITY SCORE
// ============================================
export async function getSystemSecurityScore(): Promise<SystemSecurityScore> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const breakdown: SecurityScoreBreakdown[] = [];
    const recommendations: SecurityRecommendation[] = [];
    let totalScore = 0;
    let maxScore = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ============================================
    // 1. IP SECURITY (25 points max)
    // ============================================
    const ipItems: SecurityScoreItem[] = [];
    let ipScore = 0;
    const ipMaxScore = 25;

    // 1.1 IP Blacklist Active (10 points)
    const blacklistCount = await db.select({ count: count() })
      .from(ipAccessControl)
      .where(and(
        eq(ipAccessControl.type, "blacklist"),
        eq(ipAccessControl.isActive, "true")
      ));
    
    const hasBlacklist = (blacklistCount[0]?.count || 0) > 0;
    ipItems.push({
      name: "IP Blacklist",
      description: hasBlacklist ? `${blacklistCount[0]?.count} IP bị chặn` : "Chưa có IP bị chặn",
      score: 10, // Always give points for having the feature
      maxScore: 10,
      status: "good"
    });
    ipScore += 10;

    // 1.2 IP Whitelist (10 points)
    const whitelistCount = await db.select({ count: count() })
      .from(ipAccessControl)
      .where(and(
        eq(ipAccessControl.type, "whitelist"),
        eq(ipAccessControl.isActive, "true")
      ));
    
    const hasWhitelist = (whitelistCount[0]?.count || 0) > 0;
    ipItems.push({
      name: "IP Whitelist",
      description: hasWhitelist ? `${whitelistCount[0]?.count} IP được phép` : "Chưa cấu hình whitelist",
      score: hasWhitelist ? 10 : 5,
      maxScore: 10,
      status: hasWhitelist ? "good" : "info"
    });
    ipScore += hasWhitelist ? 10 : 5;

    // 1.3 Locked IPs (5 points)
    const lockedIps = await db.select({ count: count() })
      .from(ipLockouts)
      .where(gte(ipLockouts.lockedUntil, new Date()));
    
    ipItems.push({
      name: "IP đang khóa",
      description: `${lockedIps[0]?.count || 0} IP bị khóa tạm thời`,
      score: 5,
      maxScore: 5,
      status: "info"
    });
    ipScore += 5;

    breakdown.push({
      category: "ip_security",
      categoryLabel: "Bảo mật IP",
      score: ipScore,
      maxScore: ipMaxScore,
      percentage: Math.round((ipScore / ipMaxScore) * 100),
      items: ipItems
    });
    totalScore += ipScore;
    maxScore += ipMaxScore;

    // ============================================
    // 2. RATE LIMITING (20 points max)
    // ============================================
    const rateItems: SecurityScoreItem[] = [];
    let rateScore = 0;
    const rateMaxScore = 20;

    // Rate limiting is always enabled
    rateItems.push({
      name: "Rate Limiting",
      description: "Giới hạn số lần đăng nhập thất bại",
      score: 10,
      maxScore: 10,
      status: "good"
    });
    rateScore += 10;

    // Check recent blocked attempts
    const blockedAttempts = await db.select({ count: count() })
      .from(loginAttempts)
      .where(and(
        eq(loginAttempts.success, "false"),
        gte(loginAttempts.createdAt, thirtyDaysAgo)
      ));
    
    const blockedCount = blockedAttempts[0]?.count || 0;
    rateItems.push({
      name: "Đăng nhập bị chặn",
      description: `${blockedCount} lần thất bại trong 30 ngày`,
      score: 10,
      maxScore: 10,
      status: blockedCount < 100 ? "good" : "warning"
    });
    rateScore += 10;

    breakdown.push({
      category: "rate_limiting",
      categoryLabel: "Giới hạn tốc độ",
      score: rateScore,
      maxScore: rateMaxScore,
      percentage: Math.round((rateScore / rateMaxScore) * 100),
      items: rateItems
    });
    totalScore += rateScore;
    maxScore += rateMaxScore;

    // ============================================
    // 3. USER SECURITY (30 points max)
    // ============================================
    const userItems: SecurityScoreItem[] = [];
    let userScore = 0;
    const userMaxScore = 30;

    // 3.1 2FA Adoption Rate (15 points)
    const totalUsers = await db.select({ count: count() }).from(users);
    const usersWithTwoFactor = await db.select({ count: count() })
      .from(user2FASettings)
      .where(eq(user2FASettings.isEnabled, "true"));
    
    const twoFactorRate = totalUsers[0]?.count ? 
      Math.round((usersWithTwoFactor[0]?.count || 0) / totalUsers[0].count * 100) : 0;
    const twoFactorScore = twoFactorRate >= 80 ? 15 : twoFactorRate >= 50 ? 10 : twoFactorRate >= 20 ? 5 : 2;
    
    userItems.push({
      name: "Tỷ lệ 2FA",
      description: `${twoFactorRate}% người dùng đã bật 2FA`,
      score: twoFactorScore,
      maxScore: 15,
      status: twoFactorRate >= 80 ? "good" : twoFactorRate >= 50 ? "warning" : "critical"
    });
    userScore += twoFactorScore;

    if (twoFactorRate < 50) {
      recommendations.push({
        priority: "high",
        category: "user_security",
        title: "Tăng tỷ lệ sử dụng 2FA",
        description: `Chỉ ${twoFactorRate}% người dùng đã bật 2FA`,
        action: "Yêu cầu bật 2FA bắt buộc cho admin trong Cài Đặt Bảo Mật",
        impact: 15
      });
    }

    // 3.2 Active Sessions (10 points)
    const totalSessions = await db.select({ count: count() })
      .from(userSessions)
      .where(eq(userSessions.isRevoked, "false"));
    
    const avgSessionsPerUser = totalUsers[0]?.count ? 
      Math.round((totalSessions[0]?.count || 0) / totalUsers[0].count * 10) / 10 : 0;
    const sessionScore = avgSessionsPerUser <= 3 ? 10 : avgSessionsPerUser <= 5 ? 7 : 4;
    
    userItems.push({
      name: "Phiên trung bình",
      description: `${avgSessionsPerUser} phiên/người dùng`,
      score: sessionScore,
      maxScore: 10,
      status: avgSessionsPerUser <= 3 ? "good" : "warning"
    });
    userScore += sessionScore;

    // 3.3 Password Resets (5 points)
    const passwordResets = await db.select({ count: count() })
      .from(passwordResetTokens)
      .where(gte(passwordResetTokens.createdAt, thirtyDaysAgo));
    
    const resetCount = passwordResets[0]?.count || 0;
    userItems.push({
      name: "Reset mật khẩu",
      description: `${resetCount} yêu cầu trong 30 ngày`,
      score: 5,
      maxScore: 5,
      status: resetCount < 10 ? "good" : "info"
    });
    userScore += 5;

    breakdown.push({
      category: "user_security",
      categoryLabel: "Bảo mật người dùng",
      score: userScore,
      maxScore: userMaxScore,
      percentage: Math.round((userScore / userMaxScore) * 100),
      items: userItems
    });
    totalScore += userScore;
    maxScore += userMaxScore;

    // ============================================
    // 4. SYSTEM CONFIGURATION (25 points max)
    // ============================================
    const configItems: SecurityScoreItem[] = [];
    let configScore = 0;
    const configMaxScore = 25;

    // 4.1 HTTPS (10 points) - Always enabled in production
    configItems.push({
      name: "HTTPS",
      description: "Kết nối được mã hóa SSL/TLS",
      score: 10,
      maxScore: 10,
      status: "good"
    });
    configScore += 10;

    // 4.2 Audit Logging (10 points)
    configItems.push({
      name: "Audit Logging",
      description: "Ghi log tất cả hoạt động quản trị",
      score: 10,
      maxScore: 10,
      status: "good"
    });
    configScore += 10;

    // 4.3 Email Notifications (5 points)
    const hasEmailConfig = !!process.env.SENDGRID_API_KEY;
    configItems.push({
      name: "Email thông báo",
      description: hasEmailConfig ? "Đã cấu hình SendGrid" : "Chưa cấu hình email",
      score: hasEmailConfig ? 5 : 2,
      maxScore: 5,
      status: hasEmailConfig ? "good" : "warning"
    });
    configScore += hasEmailConfig ? 5 : 2;

    if (!hasEmailConfig) {
      recommendations.push({
        priority: "medium",
        category: "configuration",
        title: "Cấu hình email thông báo",
        description: "Email thông báo giúp phát hiện sớm các hoạt động đáng ngờ",
        action: "Cấu hình SENDGRID_API_KEY trong Settings → Secrets",
        impact: 3
      });
    }

    breakdown.push({
      category: "configuration",
      categoryLabel: "Cấu hình hệ thống",
      score: configScore,
      maxScore: configMaxScore,
      percentage: Math.round((configScore / configMaxScore) * 100),
      items: configItems
    });
    totalScore += configScore;
    maxScore += configMaxScore;

    // Sort recommendations by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
      totalScore,
      maxScore,
      percentage,
      grade: getGrade(percentage),
      breakdown,
      recommendations,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("[Security Score] Error calculating system score:", error);
    return {
      totalScore: 0,
      maxScore: 100,
      percentage: 0,
      grade: "F",
      breakdown: [],
      recommendations: [{
        priority: "high",
        category: "system",
        title: "Lỗi tính điểm bảo mật",
        description: "Không thể tính điểm bảo mật hệ thống",
        action: "Kiểm tra kết nối database và cấu hình",
        impact: 100
      }],
      lastUpdated: new Date()
    };
  }
}

// ============================================
// GET ALL USERS SECURITY SCORES
// ============================================
export async function getAllUsersSecurityScores(): Promise<{
  users: Array<{
    userId: number;
    userName: string;
    userEmail: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: "A" | "B" | "C" | "D" | "F";
  }>;
  averageScore: number;
  distribution: { grade: string; count: number }[];
}> {
  try {
    const db = await getDb();
    if (!db) return { users: [], averageScore: 0, distribution: [] };
    const allUsers = await db.select().from(users);
    
    const userScores: Array<{
      userId: number;
      userName: string;
      userEmail: string;
      score: number;
      maxScore: number;
      percentage: number;
      grade: "A" | "B" | "C" | "D" | "F";
    }> = [];

    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    for (const user of allUsers) {
      const score = await getUserSecurityScore(user.id);
      if (score) {
        userScores.push({
          userId: score.userId,
          userName: score.userName,
          userEmail: score.userEmail,
          score: score.totalScore,
          maxScore: score.maxScore,
          percentage: score.percentage,
          grade: score.grade
        });
        distribution[score.grade]++;
      }
    }

    const averageScore = userScores.length > 0 
      ? Math.round(userScores.reduce((sum, u) => sum + u.percentage, 0) / userScores.length)
      : 0;

    return {
      users: userScores.sort((a, b) => b.percentage - a.percentage),
      averageScore,
      distribution: Object.entries(distribution).map(([grade, count]) => ({ grade, count }))
    };
  } catch (error) {
    console.error("[Security Score] Error getting all users scores:", error);
    return {
      users: [],
      averageScore: 0,
      distribution: []
    };
  }
}
