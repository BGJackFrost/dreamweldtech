import sgMail from '@sendgrid/mail';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { contactRequests, jobApplications, newsletterSubscribers, jobs } from '../drizzle/schema';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[Email] SendGrid initialized successfully');
} else {
  console.warn('[Email] SendGrid API key not configured - emails will be logged only');
}

// Admin email for notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dreamweldtech.vn';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dreamweldtech.vn';
const COMPANY_NAME = 'Dreamweldtech';
const COMPANY_WEBSITE = process.env.VITE_APP_URL || 'https://dreamweldtech.vn';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email template for new contact inquiry - Vietnamese
 */
function getContactThankYouTemplate(name: string, email: string): EmailTemplate {
  return {
    subject: `Cảm ơn bạn đã liên hệ - ${COMPANY_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2, #164e63); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          .btn { display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔧 ${COMPANY_NAME}</h1>
            <p>Giải Pháp Công Nghệ Laser Hàng Đầu</p>
          </div>
          <div class="content">
            <h2>Xin chào ${name}!</h2>
            <p>Cảm ơn bạn đã liên hệ với ${COMPANY_NAME}. Chúng tôi đã nhận được yêu cầu của bạn và sẽ phản hồi trong thời gian sớm nhất.</p>
            <p>Đội ngũ chuyên gia của chúng tôi sẽ xem xét yêu cầu và liên hệ với bạn trong vòng <strong>24 giờ làm việc</strong>.</p>
            <p>Trong thời gian chờ đợi, bạn có thể:</p>
            <ul>
              <li>Xem các sản phẩm của chúng tôi tại website</li>
              <li>Tìm hiểu về các giải pháp laser công nghiệp</li>
              <li>Đọc các case study thành công</li>
            </ul>
            <a href="${COMPANY_WEBSITE}/products" class="btn">Xem Sản Phẩm</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
            <p>📞 Hotline: +84 123 456 789 | 📧 contact@dreamweldtech.vn</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Xin chào ${name}!\n\nCảm ơn bạn đã liên hệ với ${COMPANY_NAME}. Chúng tôi đã nhận được yêu cầu của bạn và sẽ phản hồi trong vòng 24 giờ làm việc.\n\nTrân trọng,\n${COMPANY_NAME}`,
  };
}

/**
 * Email template for admin notification of new contact
 */
function getAdminContactNotificationTemplate(contact: any): EmailTemplate {
  const requestTypeLabel = contact.requestType === 'quote' ? '📋 Yêu cầu báo giá' : 
                           contact.requestType === 'support' ? '🔧 Yêu cầu hỗ trợ' : '📩 Liên hệ mới';
  
  return {
    subject: `[${COMPANY_NAME}] ${requestTypeLabel} từ ${contact.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #fff; border: 1px solid #e5e7eb; }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
          .label { font-weight: bold; width: 120px; color: #6b7280; }
          .value { flex: 1; }
          .message-box { background: #f8fafc; padding: 15px; border-left: 4px solid #0891b2; margin-top: 15px; }
          .btn { display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .priority-high { background: #fef2f2; border-left: 4px solid #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${requestTypeLabel}</h2>
            <p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
          </div>
          <div class="content ${contact.requestType === 'quote' ? 'priority-high' : ''}">
            <h3>Thông tin khách hàng:</h3>
            <div class="info-row">
              <span class="label">Họ tên:</span>
              <span class="value">${contact.name}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value"><a href="mailto:${contact.email}">${contact.email}</a></span>
            </div>
            <div class="info-row">
              <span class="label">Điện thoại:</span>
              <span class="value">${contact.phone || 'Không cung cấp'}</span>
            </div>
            <div class="info-row">
              <span class="label">Công ty:</span>
              <span class="value">${contact.company || 'Không cung cấp'}</span>
            </div>
            <div class="info-row">
              <span class="label">Chủ đề:</span>
              <span class="value">${contact.subject || 'Không có'}</span>
            </div>
            
            <div class="message-box">
              <strong>Nội dung:</strong>
              <p>${contact.message || 'Không có nội dung'}</p>
            </div>
            
            <a href="${COMPANY_WEBSITE}/admin/contacts" class="btn">Xem trong Admin Panel</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `${requestTypeLabel} từ ${contact.name}\n\nEmail: ${contact.email}\nĐiện thoại: ${contact.phone || 'N/A'}\nCông ty: ${contact.company || 'N/A'}\nChủ đề: ${contact.subject || 'N/A'}\n\nNội dung:\n${contact.message || 'Không có nội dung'}`,
  };
}

/**
 * Email template for job application confirmation
 */
function getJobApplicationThankYouTemplate(name: string, position: string): EmailTemplate {
  return {
    subject: `Đã nhận đơn ứng tuyển - ${position} | ${COMPANY_NAME}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .position-badge { display: inline-block; background: #0891b2; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          .steps { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .step { display: flex; align-items: center; padding: 10px 0; }
          .step-number { background: #0891b2; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👤 Cảm ơn bạn đã ứng tuyển!</h1>
            <p>${COMPANY_NAME} - Tuyển dụng</p>
          </div>
          <div class="content">
            <h2>Xin chào ${name}!</h2>
            <p>Chúng tôi đã nhận được đơn ứng tuyển của bạn cho vị trí:</p>
            <p><span class="position-badge">${position}</span></p>
            
            <div class="steps">
              <h3>Quy trình tiếp theo:</h3>
              <div class="step">
                <span class="step-number">1</span>
                <span>Đội ngũ HR sẽ xem xét hồ sơ của bạn (1-3 ngày làm việc)</span>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <span>Nếu phù hợp, chúng tôi sẽ liên hệ để sắp xếp phỏng vấn</span>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <span>Phỏng vấn kỹ thuật và văn hóa công ty</span>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <span>Thông báo kết quả và đề xuất offer</span>
              </div>
            </div>
            
            <p style="margin-top: 20px;">Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ: <a href="mailto:hr@dreamweldtech.vn">hr@dreamweldtech.vn</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Xin chào ${name}!\n\nCảm ơn bạn đã ứng tuyển vị trí ${position} tại ${COMPANY_NAME}.\n\nĐội ngũ HR sẽ xem xét hồ sơ và liên hệ với bạn trong thời gian sớm nhất.\n\nTrân trọng,\n${COMPANY_NAME} HR Team`,
  };
}

/**
 * Email template for admin notification of new job application
 */
function getAdminJobApplicationTemplate(application: any, jobTitle: string): EmailTemplate {
  return {
    subject: `[${COMPANY_NAME}] 👤 Đơn ứng tuyển mới - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #fff; border: 1px solid #e5e7eb; }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
          .label { font-weight: bold; width: 120px; color: #6b7280; }
          .value { flex: 1; }
          .btn { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; margin-right: 10px; }
          .btn-secondary { background: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>👤 Đơn ứng tuyển mới</h2>
            <p>Vị trí: ${jobTitle}</p>
          </div>
          <div class="content">
            <h3>Thông tin ứng viên:</h3>
            <div class="info-row">
              <span class="label">Họ tên:</span>
              <span class="value">${application.name}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value"><a href="mailto:${application.email}">${application.email}</a></span>
            </div>
            <div class="info-row">
              <span class="label">Điện thoại:</span>
              <span class="value">${application.phone || 'Không cung cấp'}</span>
            </div>
            ${application.resumeUrl ? `
            <div class="info-row">
              <span class="label">CV:</span>
              <span class="value"><a href="${application.resumeUrl}" target="_blank">Tải xuống CV</a></span>
            </div>
            ` : ''}
            ${application.coverLetter ? `
            <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-left: 4px solid #7c3aed;">
              <strong>Thư xin việc:</strong>
              <p>${application.coverLetter}</p>
            </div>
            ` : ''}
            
            <a href="${COMPANY_WEBSITE}/admin/applications" class="btn">Xem trong Admin</a>
            ${application.resumeUrl ? `<a href="${application.resumeUrl}" class="btn btn-secondary">Tải CV</a>` : ''}
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Đơn ứng tuyển mới - ${jobTitle}\n\nỨng viên: ${application.name}\nEmail: ${application.email}\nĐiện thoại: ${application.phone || 'N/A'}\n${application.resumeUrl ? `CV: ${application.resumeUrl}` : ''}\n\nThư xin việc:\n${application.coverLetter || 'Không có'}`,
  };
}

/**
 * Email template for newsletter subscription confirmation
 */
function getNewsletterConfirmationTemplate(name: string): EmailTemplate {
  return {
    subject: `Chào mừng bạn đến với ${COMPANY_NAME} Newsletter!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f8fafc; }
          .benefits { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .benefit { display: flex; align-items: center; padding: 10px 0; }
          .benefit-icon { font-size: 24px; margin-right: 15px; }
          .footer { padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
          .btn { display: inline-block; background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Chào mừng đến với Newsletter!</h1>
            <p>${COMPANY_NAME}</p>
          </div>
          <div class="content">
            <h2>Xin chào ${name || 'bạn'}!</h2>
            <p>Cảm ơn bạn đã đăng ký nhận tin từ ${COMPANY_NAME}. Bạn sẽ nhận được:</p>
            
            <div class="benefits">
              <div class="benefit">
                <span class="benefit-icon">🔧</span>
                <span>Tin tức mới nhất về công nghệ laser</span>
              </div>
              <div class="benefit">
                <span class="benefit-icon">💡</span>
                <span>Hướng dẫn và tips sử dụng máy laser</span>
              </div>
              <div class="benefit">
                <span class="benefit-icon">🎁</span>
                <span>Ưu đãi đặc biệt dành riêng cho subscribers</span>
              </div>
              <div class="benefit">
                <span class="benefit-icon">📊</span>
                <span>Case studies và dự án thành công</span>
              </div>
            </div>
            
            <a href="${COMPANY_WEBSITE}/products" class="btn">Khám Phá Sản Phẩm</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
            <p>Bạn nhận được email này vì đã đăng ký newsletter.</p>
            <p><a href="${COMPANY_WEBSITE}/unsubscribe">Hủy đăng ký</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Chào mừng ${name || 'bạn'} đến với ${COMPANY_NAME} Newsletter!\n\nCảm ơn bạn đã đăng ký. Bạn sẽ nhận được tin tức, hướng dẫn và ưu đãi đặc biệt từ chúng tôi.\n\nTrân trọng,\n${COMPANY_NAME}`,
  };
}

/**
 * Send email using SendGrid
 */
async function sendEmail(to: string, template: EmailTemplate, from: string = FROM_EMAIL) {
  try {
    if (!SENDGRID_API_KEY) {
      console.log(`[Email] (Mock) Would send to ${to}: ${template.subject}`);
      return true;
    }

    await sgMail.send({
      to,
      from: {
        email: from,
        name: COMPANY_NAME,
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    console.log(`[Email] Sent to ${to}: ${template.subject}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] Failed to send to ${to}:`, error?.response?.body || error);
    return false;
  }
}

/**
 * Send email to multiple recipients
 */
async function sendBulkEmail(recipients: string[], template: EmailTemplate, from: string = FROM_EMAIL) {
  try {
    if (!SENDGRID_API_KEY) {
      console.log(`[Email] (Mock) Would bulk send to ${recipients.length} recipients: ${template.subject}`);
      return true;
    }

    const messages = recipients.map((to) => ({
      to,
      from: {
        email: from,
        name: COMPANY_NAME,
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
    }));

    // SendGrid allows up to 1000 recipients per request
    const batchSize = 1000;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      await Promise.all(batch.map(msg => sgMail.send(msg)));
    }

    console.log(`[Email] Bulk sent to ${recipients.length} recipients: ${template.subject}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] Bulk send failed:`, error?.response?.body || error);
    return false;
  }
}

/**
 * Workflow: New contact inquiry
 */
export async function workflowNewContact(contactId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Workflow] Database not available');
      return;
    }

    const contact = await db.select().from(contactRequests).where(eq(contactRequests.id, contactId)).limit(1);
    if (!contact.length) {
      console.error('[Workflow] Contact not found:', contactId);
      return;
    }

    const contactData = contact[0];

    // Send thank you email to customer
    await sendEmail(contactData.email, getContactThankYouTemplate(contactData.name, contactData.email));

    // Send notification to admin
    await sendEmail(ADMIN_EMAIL, getAdminContactNotificationTemplate(contactData));

    console.log(`[Workflow] New contact workflow completed for ${contactData.email}`);
  } catch (error) {
    console.error('[Workflow] Error in new contact workflow:', error);
  }
}

/**
 * Workflow: New job application
 */
export async function workflowNewJobApplication(applicationId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Workflow] Database not available');
      return;
    }

    const application = await db.select().from(jobApplications).where(eq(jobApplications.id, applicationId)).limit(1);
    if (!application.length) {
      console.error('[Workflow] Application not found:', applicationId);
      return;
    }

    const appData = application[0];

    // Get job title
    const job = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, appData.jobId)).limit(1);
    const jobTitle = job[0]?.title || 'Vị trí tuyển dụng';

    // Send confirmation email to applicant
    await sendEmail(appData.email, getJobApplicationThankYouTemplate(appData.name, jobTitle));

    // Send notification to admin
    await sendEmail(ADMIN_EMAIL, getAdminJobApplicationTemplate(appData, jobTitle));

    console.log(`[Workflow] Job application workflow completed for ${appData.email}`);
  } catch (error) {
    console.error('[Workflow] Error in job application workflow:', error);
  }
}

/**
 * Workflow: Newsletter subscription
 */
export async function workflowNewsletterSubscription(subscriberId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Workflow] Database not available');
      return;
    }

    const subscriber = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, subscriberId)).limit(1);
    if (!subscriber.length) {
      console.error('[Workflow] Subscriber not found:', subscriberId);
      return;
    }

    const subData = subscriber[0];

    // Send confirmation email
    await sendEmail(subData.email, getNewsletterConfirmationTemplate(subData.name || 'Subscriber'));

    console.log(`[Workflow] Newsletter subscription workflow completed for ${subData.email}`);
  } catch (error) {
    console.error('[Workflow] Error in newsletter subscription workflow:', error);
  }
}

/**
 * Workflow: Send newsletter to all subscribers
 */
export async function workflowSendNewsletter(subject: string, html: string, text: string) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Workflow] Database not available');
      return;
    }

    // Get all active subscribers
    const subscribers = await db
      .select({ email: newsletterSubscribers.email })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, 'active'));

    if (subscribers.length === 0) {
      console.log('[Workflow] No active subscribers for newsletter');
      return;
    }

    const emails = subscribers.map((s) => s.email);

    // Send bulk email
    await sendBulkEmail(emails, { subject, html, text });

    console.log(`[Workflow] Newsletter sent to ${emails.length} subscribers`);
  } catch (error) {
    console.error('[Workflow] Error in newsletter workflow:', error);
  }
}

/**
 * Workflow: Abandoned cart reminder (if applicable)
 */
export async function workflowAbandonedCartReminder(email: string, items: any[]) {
  try {
    const itemsList = items.map((item) => `<li>${item.name} - ${item.price}</li>`).join('');

    const template: EmailTemplate = {
      subject: `Hoàn tất đơn hàng của bạn - ${COMPANY_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #fff; }
            .btn { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🛒 Đừng quên giỏ hàng của bạn!</h2>
            </div>
            <div class="content">
              <p>Bạn có các sản phẩm đang chờ trong giỏ hàng:</p>
              <ul>${itemsList}</ul>
              <a href="${COMPANY_WEBSITE}/checkout" class="btn">Hoàn Tất Đơn Hàng</a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Bạn có sản phẩm trong giỏ hàng đang chờ. Hoàn tất đơn hàng tại: ${COMPANY_WEBSITE}/checkout`,
    };

    await sendEmail(email, template);
    console.log(`[Workflow] Abandoned cart reminder sent to ${email}`);
  } catch (error) {
    console.error('[Workflow] Error in abandoned cart workflow:', error);
  }
}

/**
 * Workflow: Lead scoring and follow-up
 */
export async function workflowLeadScoring(contactId: number) {
  try {
    const db = await getDb();
    if (!db) return;

    const contact = await db.select().from(contactRequests).where(eq(contactRequests.id, contactId)).limit(1);
    if (!contact.length) return;

    const contactData = contact[0];

    // Calculate lead score based on various factors
    let score = 0;

    // Company provided = +10 points
    if (contactData.company) score += 10;

    // Phone provided = +5 points
    if (contactData.phone) score += 5;

    // Message length > 100 chars = +10 points
    if (contactData.message && contactData.message.length > 100) score += 10;

    // Quote request = +15 points (high intent)
    if (contactData.requestType === 'quote') score += 15;

    console.log(`[Workflow] Lead score for ${contactData.email}: ${score}`);

    // If score > 20, send priority follow-up
    if (score > 20) {
      await sendEmail(
        ADMIN_EMAIL,
        {
          subject: `🔥 [High Priority Lead] ${contactData.name} - Score: ${score}`,
          html: `
            <h2>Lead có điểm số cao!</h2>
            <p><strong>Điểm số:</strong> ${score}/40</p>
            <p><strong>Khách hàng:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Công ty:</strong> ${contactData.company || 'N/A'}</p>
            <p><strong>Loại yêu cầu:</strong> ${contactData.requestType}</p>
            <p><a href="${COMPANY_WEBSITE}/admin/contacts">Xem trong Admin</a></p>
          `,
          text: `High priority lead: ${contactData.name} (Score: ${score})`,
        }
      );
    }
  } catch (error) {
    console.error('[Workflow] Error in lead scoring workflow:', error);
  }
}

export default {
  workflowNewContact,
  workflowNewJobApplication,
  workflowNewsletterSubscription,
  workflowSendNewsletter,
  workflowAbandonedCartReminder,
  workflowLeadScoring,
};
