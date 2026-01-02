/**
 * Email Service for Dreamweldtech
 * Handles sending notification emails for job applications and contact form submissions
 * Integrated with SendGrid for production email delivery
 */

import sgMail from "@sendgrid/mail";
import { getDb } from "./db";
import { notifications } from "../drizzle/schema";

// Initialize SendGrid with API key if available
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("SendGrid initialized successfully");
} else {
  console.log("SendGrid API key not configured - emails will be logged to console");
}

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.SENDGRID_FROM_EMAIL || "noreply@dreamweldtech.com",
  fromName: process.env.SENDGRID_FROM_NAME || "Dreamweldtech",
  adminEmail: process.env.ADMIN_EMAIL || "admin@dreamweldtech.com",
  companyName: "Dreamweldtech",
};

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email sending result
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function generateJobApplicationEmail(data: {
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  jobTitle: string;
  coverLetter?: string;
  cvUrl?: string;
}): EmailTemplate {
  const subject = `[Đơn ứng tuyển mới] ${data.jobTitle} - ${data.applicantName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .field { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .label { font-weight: bold; color: #0d9488; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
    .value { margin-top: 5px; font-size: 16px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f3f4f6; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .button:hover { background: #0f766e; }
    a { color: #0d9488; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Đơn Ứng Tuyển Mới</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Vị trí: ${data.jobTitle}</p>
    </div>
    <div class="content">
      <p style="margin-top: 0;">Bạn nhận được một đơn ứng tuyển mới cho vị trí <strong>${data.jobTitle}</strong>.</p>
      
      <div class="field">
        <div class="label">👤 Họ và tên</div>
        <div class="value">${data.applicantName}</div>
      </div>
      
      <div class="field">
        <div class="label">📧 Email</div>
        <div class="value"><a href="mailto:${data.applicantEmail}">${data.applicantEmail}</a></div>
      </div>
      
      ${data.applicantPhone ? `
      <div class="field">
        <div class="label">📱 Số điện thoại</div>
        <div class="value"><a href="tel:${data.applicantPhone}">${data.applicantPhone}</a></div>
      </div>
      ` : ""}
      
      ${data.coverLetter ? `
      <div class="field">
        <div class="label">📝 Thư xin việc</div>
        <div class="value" style="white-space: pre-wrap; background: #f9fafb; padding: 15px; border-radius: 5px; border-left: 3px solid #0d9488;">${data.coverLetter}</div>
      </div>
      ` : ""}
      
      ${data.cvUrl ? `
      <div class="field" style="text-align: center;">
        <div class="label">📄 CV/Hồ sơ</div>
        <div class="value" style="margin-top: 15px;">
          <a href="${data.cvUrl}" class="button">Tải xuống CV</a>
        </div>
      </div>
      ` : ""}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="mailto:${data.applicantEmail}?subject=Re: Đơn ứng tuyển ${data.jobTitle}" class="button">
          Trả lời ứng viên
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Email này được gửi tự động từ hệ thống Dreamweldtech.</p>
      <p>© ${new Date().getFullYear()} Dreamweldtech. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Đơn Ứng Tuyển Mới - ${data.jobTitle}

Họ và tên: ${data.applicantName}
Email: ${data.applicantEmail}
${data.applicantPhone ? `Số điện thoại: ${data.applicantPhone}` : ""}
${data.coverLetter ? `\nThư xin việc:\n${data.coverLetter}` : ""}
${data.cvUrl ? `\nCV: ${data.cvUrl}` : ""}

---
Email này được gửi tự động từ hệ thống Dreamweldtech.
  `.trim();

  return { subject, html, text };
}

export function generateContactFormEmail(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
}): EmailTemplate {
  const subject = `[Liên hệ mới] ${data.subject || "Yêu cầu tư vấn"} - ${data.name}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .field { margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .label { font-weight: bold; color: #0d9488; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
    .value { margin-top: 5px; font-size: 16px; }
    .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0d9488; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f3f4f6; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .button:hover { background: #0f766e; }
    a { color: #0d9488; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 Liên Hệ Mới</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.subject || "Yêu cầu tư vấn"}</p>
    </div>
    <div class="content">
      <p style="margin-top: 0;">Bạn nhận được một yêu cầu liên hệ mới từ website.</p>
      
      <div class="field">
        <div class="label">👤 Họ và tên</div>
        <div class="value">${data.name}</div>
      </div>
      
      <div class="field">
        <div class="label">📧 Email</div>
        <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
      </div>
      
      ${data.phone ? `
      <div class="field">
        <div class="label">📱 Số điện thoại</div>
        <div class="value"><a href="tel:${data.phone}">${data.phone}</a></div>
      </div>
      ` : ""}
      
      ${data.company ? `
      <div class="field">
        <div class="label">🏢 Công ty</div>
        <div class="value">${data.company}</div>
      </div>
      ` : ""}
      
      <div class="message-box">
        <div class="label">📝 Nội dung tin nhắn</div>
        <div class="value" style="white-space: pre-wrap; margin-top: 10px;">${data.message.replace(/\n/g, "<br>")}</div>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject || "Yêu cầu tư vấn")}" class="button">
          Trả lời email
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Email này được gửi tự động từ hệ thống Dreamweldtech.</p>
      <p>© ${new Date().getFullYear()} Dreamweldtech. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Liên Hệ Mới từ Website

Họ và tên: ${data.name}
Email: ${data.email}
${data.phone ? `Số điện thoại: ${data.phone}` : ""}
${data.company ? `Công ty: ${data.company}` : ""}
${data.subject ? `Chủ đề: ${data.subject}` : ""}

Nội dung:
${data.message}

---
Email này được gửi tự động từ hệ thống Dreamweldtech.
  `.trim();

  return { subject, html, text };
}

// Store notification in database (for in-app notifications)
export async function createNotification(data: {
  title: string;
  message: string;
  type: "contact" | "quote" | "application" | "newsletter" | "system";
  link?: string;
}) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.insert(notifications).values({
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link || null,
      isRead: "false",
    });

    return result;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// Send email notification via SendGrid or log to console
export async function sendEmailNotification(template: EmailTemplate, to: string): Promise<EmailResult> {
  // If SendGrid is configured, send real email
  if (SENDGRID_API_KEY) {
    try {
      const msg = {
        to,
        from: {
          email: EMAIL_CONFIG.from,
          name: EMAIL_CONFIG.fromName,
        },
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      const response = await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}`);
      
      return {
        success: true,
        messageId: response[0]?.headers?.["x-message-id"] || "sent",
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("SendGrid error:", errorMessage);
      
      // Log email to console as fallback
      logEmailToConsole(template, to);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Fallback: Log to console for development
  logEmailToConsole(template, to);
  
  return {
    success: true,
    messageId: "console-log",
  };
}

// Helper function to log email to console
function logEmailToConsole(template: EmailTemplate, to: string) {
  console.log("\n=== EMAIL NOTIFICATION (Console Mode) ===");
  console.log("To:", to);
  console.log("From:", `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`);
  console.log("Subject:", template.subject);
  console.log("---");
  console.log(template.text);
  console.log("=========================================\n");
}

// Send email to multiple recipients
export async function sendBulkEmail(template: EmailTemplate, recipients: string[]): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  for (const to of recipients) {
    const result = await sendEmailNotification(template, to);
    results.push(result);
  }
  
  return results;
}

// Notify admin about new job application
export async function notifyNewJobApplication(data: {
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  jobTitle: string;
  coverLetter?: string;
  cvUrl?: string;
}) {
  // Create in-app notification
  await createNotification({
    title: "Đơn ứng tuyển mới",
    message: `${data.applicantName} đã ứng tuyển vị trí ${data.jobTitle}`,
    type: "application",
    link: "/admin/applications",
  });

  // Send email notification
  const template = generateJobApplicationEmail(data);
  return await sendEmailNotification(template, EMAIL_CONFIG.adminEmail);
}

// Notify admin about new contact form submission
export async function notifyNewContactForm(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
}) {
  // Create in-app notification
  await createNotification({
    title: "Liên hệ mới",
    message: `${data.name} đã gửi yêu cầu liên hệ: ${data.subject || "Yêu cầu tư vấn"}`,
    type: "contact",
    link: "/admin/contacts",
  });

  // Send email notification
  const template = generateContactFormEmail(data);
  return await sendEmailNotification(template, EMAIL_CONFIG.adminEmail);
}

// Send confirmation email to applicant
export async function sendApplicationConfirmation(data: {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
}) {
  const template: EmailTemplate = {
    subject: `Xác nhận đơn ứng tuyển - ${data.jobTitle} | Dreamweldtech`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f3f4f6; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Xác Nhận Đơn Ứng Tuyển</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${data.applicantName}</strong>,</p>
      
      <p>Cảm ơn bạn đã ứng tuyển vị trí <strong>${data.jobTitle}</strong> tại Dreamweldtech.</p>
      
      <p>Chúng tôi đã nhận được đơn ứng tuyển của bạn và sẽ xem xét trong thời gian sớm nhất. Nếu hồ sơ của bạn phù hợp, chúng tôi sẽ liên hệ để sắp xếp buổi phỏng vấn.</p>
      
      <p>Trong thời gian chờ đợi, bạn có thể:</p>
      <ul>
        <li>Tìm hiểu thêm về công ty tại website của chúng tôi</li>
        <li>Theo dõi các vị trí tuyển dụng khác</li>
        <li>Liên hệ nếu có bất kỳ câu hỏi nào</li>
      </ul>
      
      <p>Trân trọng,<br><strong>Đội ngũ Tuyển dụng Dreamweldtech</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Dreamweldtech. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    text: `
Xin chào ${data.applicantName},

Cảm ơn bạn đã ứng tuyển vị trí ${data.jobTitle} tại Dreamweldtech.

Chúng tôi đã nhận được đơn ứng tuyển của bạn và sẽ xem xét trong thời gian sớm nhất.

Trân trọng,
Đội ngũ Tuyển dụng Dreamweldtech
    `.trim(),
  };

  return await sendEmailNotification(template, data.applicantEmail);
}

// Send confirmation email to contact form submitter
export async function sendContactConfirmation(data: {
  name: string;
  email: string;
  subject?: string;
}) {
  const template: EmailTemplate = {
    subject: `Xác nhận yêu cầu liên hệ | Dreamweldtech`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px 20px; background: #f9fafb; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background: #f3f4f6; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Xác Nhận Yêu Cầu Liên Hệ</h1>
    </div>
    <div class="content">
      <p>Xin chào <strong>${data.name}</strong>,</p>
      
      <p>Cảm ơn bạn đã liên hệ với Dreamweldtech${data.subject ? ` về "${data.subject}"` : ""}.</p>
      
      <p>Chúng tôi đã nhận được yêu cầu của bạn và sẽ phản hồi trong vòng 24 giờ làm việc.</p>
      
      <p>Nếu cần hỗ trợ khẩn cấp, vui lòng gọi hotline: <strong>+84 123 456 789</strong></p>
      
      <p>Trân trọng,<br><strong>Đội ngũ Dreamweldtech</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Dreamweldtech. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
    text: `
Xin chào ${data.name},

Cảm ơn bạn đã liên hệ với Dreamweldtech${data.subject ? ` về "${data.subject}"` : ""}.

Chúng tôi đã nhận được yêu cầu của bạn và sẽ phản hồi trong vòng 24 giờ làm việc.

Nếu cần hỗ trợ khẩn cấp, vui lòng gọi hotline: +84 123 456 789

Trân trọng,
Đội ngũ Dreamweldtech
    `.trim(),
  };

  return await sendEmailNotification(template, data.email);
}

export { EMAIL_CONFIG };
