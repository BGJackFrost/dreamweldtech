/**
 * Email Service for Dreamweldtech
 * Handles sending notification emails for job applications and contact form submissions
 * 
 * Note: This uses the built-in notification system. For production, integrate with
 * an email service provider like SendGrid, Mailgun, or AWS SES.
 */

import { getDb } from "./db";
import { notifications } from "../drizzle/schema";

// Email configuration
const EMAIL_CONFIG = {
  from: "noreply@dreamweldtech.com",
  adminEmail: process.env.ADMIN_EMAIL || "admin@dreamweldtech.com",
  companyName: "Dreamweldtech",
};

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0d9488; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #0d9488; }
    .value { margin-top: 5px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 10px 20px; background: #0d9488; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Đơn Ứng Tuyển Mới</h1>
    </div>
    <div class="content">
      <p>Bạn nhận được một đơn ứng tuyển mới cho vị trí <strong>${data.jobTitle}</strong>.</p>
      
      <div class="field">
        <div class="label">Họ và tên:</div>
        <div class="value">${data.applicantName}</div>
      </div>
      
      <div class="field">
        <div class="label">Email:</div>
        <div class="value"><a href="mailto:${data.applicantEmail}">${data.applicantEmail}</a></div>
      </div>
      
      ${data.applicantPhone ? `
      <div class="field">
        <div class="label">Số điện thoại:</div>
        <div class="value"><a href="tel:${data.applicantPhone}">${data.applicantPhone}</a></div>
      </div>
      ` : ""}
      
      ${data.coverLetter ? `
      <div class="field">
        <div class="label">Thư xin việc:</div>
        <div class="value" style="white-space: pre-wrap; background: white; padding: 15px; border-radius: 5px;">${data.coverLetter}</div>
      </div>
      ` : ""}
      
      ${data.cvUrl ? `
      <div class="field">
        <div class="label">CV/Hồ sơ:</div>
        <div class="value"><a href="${data.cvUrl}" class="button">Tải xuống CV</a></div>
      </div>
      ` : ""}
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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0d9488; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #0d9488; }
    .value { margin-top: 5px; }
    .message-box { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #0d9488; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .reply-button { display: inline-block; padding: 10px 20px; background: #0d9488; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Liên Hệ Mới</h1>
    </div>
    <div class="content">
      <p>Bạn nhận được một yêu cầu liên hệ mới từ website.</p>
      
      <div class="field">
        <div class="label">Họ và tên:</div>
        <div class="value">${data.name}</div>
      </div>
      
      <div class="field">
        <div class="label">Email:</div>
        <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
      </div>
      
      ${data.phone ? `
      <div class="field">
        <div class="label">Số điện thoại:</div>
        <div class="value"><a href="tel:${data.phone}">${data.phone}</a></div>
      </div>
      ` : ""}
      
      ${data.company ? `
      <div class="field">
        <div class="label">Công ty:</div>
        <div class="value">${data.company}</div>
      </div>
      ` : ""}
      
      ${data.subject ? `
      <div class="field">
        <div class="label">Chủ đề:</div>
        <div class="value">${data.subject}</div>
      </div>
      ` : ""}
      
      <div class="field">
        <div class="label">Nội dung:</div>
        <div class="message-box">${data.message.replace(/\n/g, "<br>")}</div>
      </div>
      
      <p style="margin-top: 20px;">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject || "Yêu cầu tư vấn")}" class="reply-button">
          Trả lời email
        </a>
      </p>
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

// Send email notification (placeholder - integrate with email service)
export async function sendEmailNotification(template: EmailTemplate, to: string) {
  // Log the email for development
  console.log("=== EMAIL NOTIFICATION ===");
  console.log("To:", to);
  console.log("Subject:", template.subject);
  console.log("Text:", template.text);
  console.log("=========================");

  // In production, integrate with an email service:
  // - SendGrid: https://sendgrid.com/
  // - Mailgun: https://www.mailgun.com/
  // - AWS SES: https://aws.amazon.com/ses/
  // - Resend: https://resend.com/

  // Example with SendGrid (uncomment when API key is available):
  /*
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to,
      from: EMAIL_CONFIG.from,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
  }
  */

  return true;
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
  await sendEmailNotification(template, EMAIL_CONFIG.adminEmail);
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
  await sendEmailNotification(template, EMAIL_CONFIG.adminEmail);
}

export { EMAIL_CONFIG };
