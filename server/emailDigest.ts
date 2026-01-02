import { getDb } from "./db";
import { emailDigestSettings, emailDigestLog, contactRequests, jobApplications, newsletterSubscribers, notificationCenter } from "../drizzle/schema";
import { eq, gte, and, sql } from "drizzle-orm";
import { sendEmailNotification } from "./email";

interface DigestData {
  contacts: Array<{ id: number; name: string; email: string; subject: string; createdAt: Date }>;
  applications: Array<{ id: number; name: string; email: string; jobTitle: string; createdAt: Date }>;
  newsletters: Array<{ id: number; email: string; createdAt: Date }>;
  systemNotifications: Array<{ id: number; title: string; message: string; createdAt: Date }>;
}

/**
 * Get the date range for the digest based on frequency
 */
function getDateRange(frequency: string, lastSentAt: Date | null): { start: Date; end: Date } {
  const now = new Date();
  const end = now;
  let start: Date;

  if (lastSentAt) {
    start = lastSentAt;
  } else {
    switch (frequency) {
      case "daily":
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  return { start, end };
}

/**
 * Fetch digest data from database
 */
async function fetchDigestData(
  userId: number,
  settings: typeof emailDigestSettings.$inferSelect,
  dateRange: { start: Date; end: Date }
): Promise<DigestData> {
  const db = await getDb();
  if (!db) {
    return { contacts: [], applications: [], newsletters: [], systemNotifications: [] };
  }
  const result: DigestData = {
    contacts: [],
    applications: [],
    newsletters: [],
    systemNotifications: [],
  };

  // Fetch contacts if enabled
  if (settings.includeContacts === "true") {
    const contacts = await db
      .select({
        id: contactRequests.id,
        name: contactRequests.name,
        email: contactRequests.email,
        subject: contactRequests.subject,
        createdAt: contactRequests.createdAt,
      })
      .from(contactRequests)
      .where(gte(contactRequests.createdAt, dateRange.start));
    
    result.contacts = contacts.map(c => ({
      ...c,
      name: c.name || "Unknown",
      email: c.email || "",
      subject: c.subject || "No subject",
    }));
  }

  // Fetch applications if enabled
  if (settings.includeApplications === "true") {
    const applications = await db
      .select({
        id: jobApplications.id,
        name: jobApplications.name,
        email: jobApplications.email,
        jobTitle: sql<string>`'Job Application'`,
        createdAt: jobApplications.createdAt,
      })
      .from(jobApplications)
      .where(gte(jobApplications.createdAt, dateRange.start));
    
    result.applications = applications.map(a => ({
      ...a,
      name: a.name || "Unknown",
      email: a.email || "",
      jobTitle: a.jobTitle || "Unknown Position",
    }));
  }

  // Fetch newsletter subscriptions if enabled
  if (settings.includeNewsletter === "true") {
    const newsletters = await db
      .select({
        id: newsletterSubscribers.id,
        email: newsletterSubscribers.email,
        createdAt: newsletterSubscribers.createdAt,
      })
      .from(newsletterSubscribers)
      .where(gte(newsletterSubscribers.createdAt, dateRange.start));
    
    result.newsletters = newsletters;
  }

  // Fetch system notifications if enabled
  if (settings.includeSystem === "true") {
    const notifications = await db
      .select({
        id: notificationCenter.id,
        title: notificationCenter.title,
        message: notificationCenter.message,
        createdAt: notificationCenter.createdAt,
      })
      .from(notificationCenter)
      .where(
        and(
          gte(notificationCenter.createdAt, dateRange.start),
          eq(notificationCenter.type, "system")
        )
      );
    
    result.systemNotifications = notifications.map(n => ({
      ...n,
      title: n.title || "System Notification",
      message: n.message || "",
    }));
  }

  return result;
}

/**
 * Generate HTML email content for digest
 */
function generateDigestHtml(data: DigestData, frequency: string): string {
  const frequencyText = frequency === "daily" ? "hàng ngày" : frequency === "weekly" ? "hàng tuần" : "hàng tháng";
  const totalItems = data.contacts.length + data.applications.length + data.newsletters.length + data.systemNotifications.length;

  if (totalItems === 0) {
    return "";
  }

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #0891b2, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 30px; background: #f8fafc; }
    .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section h2 { color: #0891b2; margin-top: 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .item:last-child { border-bottom: none; }
    .item-title { font-weight: 600; color: #1e293b; }
    .item-meta { font-size: 13px; color: #64748b; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .badge-contact { background: #dbeafe; color: #1d4ed8; }
    .badge-application { background: #dcfce7; color: #16a34a; }
    .badge-newsletter { background: #fef3c7; color: #d97706; }
    .badge-system { background: #f1f5f9; color: #475569; }
    .summary { display: flex; justify-content: space-around; text-align: center; padding: 20px 0; }
    .summary-item { flex: 1; }
    .summary-number { font-size: 32px; font-weight: bold; color: #0891b2; }
    .summary-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
    .cta { display: inline-block; background: #0891b2; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Báo Cáo Tổng Hợp ${frequencyText.charAt(0).toUpperCase() + frequencyText.slice(1)}</h1>
    <p>Dreamweldtech Admin Digest</p>
  </div>
  <div class="content">
    <div class="section">
      <div class="summary">
        <div class="summary-item">
          <div class="summary-number">${data.contacts.length}</div>
          <div class="summary-label">Liên hệ</div>
        </div>
        <div class="summary-item">
          <div class="summary-number">${data.applications.length}</div>
          <div class="summary-label">Ứng tuyển</div>
        </div>
        <div class="summary-item">
          <div class="summary-number">${data.newsletters.length}</div>
          <div class="summary-label">Newsletter</div>
        </div>
        <div class="summary-item">
          <div class="summary-number">${data.systemNotifications.length}</div>
          <div class="summary-label">Hệ thống</div>
        </div>
      </div>
    </div>
`;

  // Contacts section
  if (data.contacts.length > 0) {
    html += `
    <div class="section">
      <h2>📬 Liên Hệ Mới (${data.contacts.length})</h2>
`;
    for (const contact of data.contacts.slice(0, 10)) {
      html += `
      <div class="item">
        <div class="item-title">${contact.name} <span class="badge badge-contact">${contact.subject}</span></div>
        <div class="item-meta">${contact.email} • ${new Date(contact.createdAt).toLocaleString("vi-VN")}</div>
      </div>
`;
    }
    if (data.contacts.length > 10) {
      html += `<div class="item-meta">...và ${data.contacts.length - 10} liên hệ khác</div>`;
    }
    html += `</div>`;
  }

  // Applications section
  if (data.applications.length > 0) {
    html += `
    <div class="section">
      <h2>💼 Đơn Ứng Tuyển Mới (${data.applications.length})</h2>
`;
    for (const app of data.applications.slice(0, 10)) {
      html += `
      <div class="item">
        <div class="item-title">${app.name} <span class="badge badge-application">${app.jobTitle}</span></div>
        <div class="item-meta">${app.email} • ${new Date(app.createdAt).toLocaleString("vi-VN")}</div>
      </div>
`;
    }
    if (data.applications.length > 10) {
      html += `<div class="item-meta">...và ${data.applications.length - 10} đơn khác</div>`;
    }
    html += `</div>`;
  }

  // Newsletter section
  if (data.newsletters.length > 0) {
    html += `
    <div class="section">
      <h2>📰 Đăng Ký Newsletter Mới (${data.newsletters.length})</h2>
`;
    for (const sub of data.newsletters.slice(0, 10)) {
      html += `
      <div class="item">
        <div class="item-title">${sub.email} <span class="badge badge-newsletter">Subscriber</span></div>
        <div class="item-meta">${new Date(sub.createdAt).toLocaleString("vi-VN")}</div>
      </div>
`;
    }
    if (data.newsletters.length > 10) {
      html += `<div class="item-meta">...và ${data.newsletters.length - 10} đăng ký khác</div>`;
    }
    html += `</div>`;
  }

  // System notifications section
  if (data.systemNotifications.length > 0) {
    html += `
    <div class="section">
      <h2>⚙️ Thông Báo Hệ Thống (${data.systemNotifications.length})</h2>
`;
    for (const notif of data.systemNotifications.slice(0, 5)) {
      html += `
      <div class="item">
        <div class="item-title">${notif.title} <span class="badge badge-system">System</span></div>
        <div class="item-meta">${notif.message}</div>
      </div>
`;
    }
    html += `</div>`;
  }

  html += `
    <div style="text-align: center;">
      <a href="${process.env.VITE_APP_URL || "https://dreamweldtech.vn"}/admin" class="cta">Xem Chi Tiết Trong Admin Panel</a>
    </div>
  </div>
  <div class="footer">
    <p>Email này được gửi tự động từ hệ thống Dreamweldtech.</p>
    <p>Bạn có thể tắt email digest trong Admin Panel → Cài đặt → Thông báo.</p>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Send email digest to a user
 */
export async function sendEmailDigest(userId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    // Get user's digest settings
    const [settings] = await db
      .select()
      .from(emailDigestSettings)
      .where(eq(emailDigestSettings.userId, userId));

    if (!settings || settings.isEnabled !== "true") {
      return { success: false, message: "Email digest is disabled for this user" };
    }

    // Get user email
    const [user] = await db
      .select({ email: sql<string>`email`, name: sql<string>`name` })
      .from(sql`users`)
      .where(sql`id = ${userId}`);

    if (!user?.email) {
      return { success: false, message: "User email not found" };
    }

    // Get date range
    const dateRange = getDateRange(settings.frequency, settings.lastSentAt);

    // Fetch digest data
    const digestData = await fetchDigestData(userId, settings, dateRange);

    // Check if there's any data to send
    const totalItems = 
      digestData.contacts.length + 
      digestData.applications.length + 
      digestData.newsletters.length + 
      digestData.systemNotifications.length;

    if (totalItems === 0) {
      // Log skipped digest
      await db.insert(emailDigestLog).values({
        userId,
        frequency: settings.frequency,
        contactsCount: 0,
        applicationsCount: 0,
        newsletterCount: 0,
        systemCount: 0,
        status: "skipped",
      });

      return { success: true, message: "No new items to digest" };
    }

    // Generate email HTML
    const html = generateDigestHtml(digestData, settings.frequency);

    // Send email
    const frequencyText = settings.frequency === "daily" ? "Hàng Ngày" : settings.frequency === "weekly" ? "Hàng Tuần" : "Hàng Tháng";
    
    await sendEmailNotification(
      {
        subject: `[Dreamweldtech] Báo Cáo Tổng Hợp ${frequencyText} - ${totalItems} mục mới`,
        html,
        text: `Bạn có ${totalItems} thông báo mới. Vui lòng xem chi tiết trong Admin Panel.`,
      },
      user.email
    );

    // Update last sent time
    await db
      .update(emailDigestSettings)
      .set({ lastSentAt: new Date() })
      .where(eq(emailDigestSettings.userId, userId));

    // Log sent digest
    await db.insert(emailDigestLog).values({
      userId,
      frequency: settings.frequency,
      contactsCount: digestData.contacts.length,
      applicationsCount: digestData.applications.length,
      newsletterCount: digestData.newsletters.length,
      systemCount: digestData.systemNotifications.length,
      status: "sent",
    });

    return { 
      success: true, 
      message: `Digest sent successfully with ${totalItems} items` 
    };
  } catch (error) {
    console.error("Error sending email digest:", error);

    // Log failed digest
    await db.insert(emailDigestLog).values({
      userId,
      frequency: "daily",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Process all pending email digests
 * This should be called by a cron job
 */
export async function processEmailDigests(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for processing digests");
    return;
  }
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, "0");
  const currentMinute = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHour}:${currentMinute}`;
  const currentDay = now.getDay() || 7; // Convert Sunday from 0 to 7
  const currentDate = now.getDate();

  try {
    // Get all enabled digest settings
    const allSettings = await db
      .select()
      .from(emailDigestSettings)
      .where(eq(emailDigestSettings.isEnabled, "true"));

    for (const settings of allSettings) {
      // Check if it's time to send
      const sendTime = settings.sendTime;
      
      // Allow 5-minute window for sending
      if (Math.abs(timeToMinutes(currentTime) - timeToMinutes(sendTime)) > 5) {
        continue;
      }

      // Check frequency conditions
      if (settings.frequency === "weekly" && settings.sendDay !== currentDay) {
        continue;
      }

      if (settings.frequency === "monthly" && settings.sendDay !== currentDate) {
        continue;
      }

      // Check if already sent today
      if (settings.lastSentAt) {
        const lastSent = new Date(settings.lastSentAt);
        const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        
        if (settings.frequency === "daily" && hoursSinceLastSent < 20) {
          continue;
        }
        if (settings.frequency === "weekly" && hoursSinceLastSent < 160) {
          continue;
        }
        if (settings.frequency === "monthly" && hoursSinceLastSent < 600) {
          continue;
        }
      }

      // Send digest
      await sendEmailDigest(settings.userId);
    }
  } catch (error) {
    console.error("Error processing email digests:", error);
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Get digest settings for a user
 */
export async function getDigestSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [settings] = await db
    .select()
    .from(emailDigestSettings)
    .where(eq(emailDigestSettings.userId, userId));
  
  return settings || null;
}

/**
 * Update digest settings for a user
 */
export async function updateDigestSettings(
  userId: number,
  data: Partial<typeof emailDigestSettings.$inferInsert>
) {
  const db = await getDb();
  if (!db) return null;
  
  // Check if settings exist
  const existing = await getDigestSettings(userId);
  
  if (existing) {
    await db
      .update(emailDigestSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(emailDigestSettings.userId, userId));
  } else {
    await db.insert(emailDigestSettings).values({
      userId,
      ...data,
    });
  }
  
  return getDigestSettings(userId);
}

/**
 * Get digest log for a user
 */
export async function getDigestLog(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(emailDigestLog)
    .where(eq(emailDigestLog.userId, userId))
    .orderBy(sql`${emailDigestLog.sentAt} DESC`)
    .limit(limit);
}
