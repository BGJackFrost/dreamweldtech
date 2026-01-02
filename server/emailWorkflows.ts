import sgMail from '@sendgrid/mail';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { contactRequests, jobApplications, newsletterSubscribers } from '../drizzle/schema';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Email template for new contact inquiry
 */
function getContactThankYouTemplate(name: string, email: string): EmailTemplate {
  return {
    subject: 'Thank You for Your Inquiry - Dreamweldtech',
    html: `
      <h2>Thank You, ${name}!</h2>
      <p>We have received your inquiry and will get back to you as soon as possible.</p>
      <p>Our team will review your message and contact you within 24 hours.</p>
      <p>Best regards,<br>Dreamweldtech Team</p>
    `,
    text: `Thank you for your inquiry. We will contact you within 24 hours.`,
  };
}

/**
 * Email template for admin notification of new contact
 */
function getAdminContactNotificationTemplate(contact: any): EmailTemplate {
  return {
    subject: `New Contact Inquiry from ${contact.name}`,
    html: `
      <h2>New Contact Inquiry</h2>
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> ${contact.email}</p>
      <p><strong>Phone:</strong> ${contact.phone}</p>
      <p><strong>Company:</strong> ${contact.company || 'N/A'}</p>
      <p><strong>Subject:</strong> ${contact.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${contact.message}</p>
      <p><a href="https://admin.dreamweldtech.com/admin/contacts/${contact.id}">View in Admin</a></p>
    `,
    text: `New contact inquiry from ${contact.name} (${contact.email})`,
  };
}

/**
 * Email template for job application confirmation
 */
function getJobApplicationThankYouTemplate(name: string, position: string): EmailTemplate {
  return {
    subject: `Application Received - ${position} Position`,
    html: `
      <h2>Thank You for Your Application, ${name}!</h2>
      <p>We have received your application for the <strong>${position}</strong> position.</p>
      <p>Our HR team will review your application and contact you if you are selected for an interview.</p>
      <p>Best regards,<br>Dreamweldtech HR Team</p>
    `,
    text: `Thank you for applying for the ${position} position.`,
  };
}

/**
 * Email template for newsletter subscription confirmation
 */
function getNewsletterConfirmationTemplate(name: string): EmailTemplate {
  return {
    subject: 'Welcome to Dreamweldtech Newsletter',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>You will now receive updates about our latest products, news, and special offers.</p>
      <p>Best regards,<br>Dreamweldtech Team</p>
    `,
    text: `Thank you for subscribing to our newsletter.`,
  };
}

/**
 * Send email using SendGrid
 */
async function sendEmail(to: string, template: EmailTemplate, from: string = 'noreply@dreamweldtech.com') {
  try {
    await sgMail.send({
      to,
      from,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    console.log(`[Email] Sent to ${to}: ${template.subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
    return false;
  }
}

/**
 * Send email to multiple recipients
 */
async function sendBulkEmail(recipients: string[], template: EmailTemplate, from: string = 'noreply@dreamweldtech.com') {
  try {
    const messages = recipients.map((to) => ({
      to,
      from,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }));

    await sgMail.sendMultiple({
      personalizations: messages.map((msg) => ({ to: [{ email: msg.to }] })),
      from: { email: from },
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log(`[Email] Bulk sent to ${recipients.length} recipients: ${template.subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Bulk send failed:`, error);
    return false;
  }
}

/**
 * Workflow: New contact inquiry
 */
export async function workflowNewContact(contactId: number) {
  try {
    const db = await getDb();
    if (!db) return;

    const contact = await db.select().from(contactRequests).where(eq(contactRequests.id, contactId)).limit(1);
    if (!contact.length) return;

    const contactData = contact[0];

    // Send thank you email to customer
    await sendEmail(contactData.email, getContactThankYouTemplate(contactData.name, contactData.email));

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dreamweldtech.com';
    await sendEmail(adminEmail, getAdminContactNotificationTemplate(contactData));

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
    if (!db) return;

    const application = await db.select().from(jobApplications).where(eq(jobApplications.id, applicationId)).limit(1);
    if (!application.length) return;

    const appData = application[0];

    // Send confirmation email to applicant
    await sendEmail(appData.email, getJobApplicationThankYouTemplate(appData.name, 'Position'));

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dreamweldtech.com';
    await sendEmail(
      adminEmail,
      {
        subject: `New Job Application - Position`,
        html: `<p>New application from ${appData.name}</p>`,
        text: `New application from ${appData.name}`,
      }
    );

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
    if (!db) return;

    const subscriber = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, subscriberId)).limit(1);
    if (!subscriber.length) return;

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
    if (!db) return;

    // Get all active subscribers
    const subscribers = await db
      .select({ email: newsletterSubscribers.email })
      .from(newsletterSubscribers);

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
    const itemsList = items.map((item) => `<li>${item.name} - $${item.price}</li>`).join('');

    const template: EmailTemplate = {
      subject: 'Complete Your Order - Dreamweldtech',
      html: `
        <h2>Don't forget your items!</h2>
        <p>You have items in your cart:</p>
        <ul>${itemsList}</ul>
        <p><a href="https://dreamweldtech.com/checkout">Complete Your Order</a></p>
      `,
      text: 'Complete your order',
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

    console.log(`[Workflow] Lead score for ${contactData.email}: ${score}`);

    // If score > 20, send priority follow-up
    if (score > 20) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@dreamweldtech.com';
      await sendEmail(
        adminEmail,
        {
          subject: `High Priority Lead - ${contactData.name}`,
          html: `<p>High priority lead (score: ${score}) from ${contactData.name}</p>`,
          text: `High priority lead from ${contactData.name}`,
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
