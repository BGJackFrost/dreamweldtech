/**
 * Integration module for WebSocket notifications and Email automation
 * This module connects the routers with real-time notifications and email workflows
 */

import { broadcastNotification, broadcastToUser, getConnectedUsers } from './websocket';
import { 
  workflowNewContact, 
  workflowNewJobApplication, 
  workflowNewsletterSubscription,
  workflowLeadScoring 
} from './emailWorkflows';
import { logActivity, ActivityLogEntry } from './activityLogger';
import { getDb } from './db';
import { notificationCenter } from '../drizzle/schema';

/**
 * Notification types for WebSocket broadcasts
 */
export type NotificationType = 
  | 'contact' 
  | 'quote' 
  | 'application' 
  | 'newsletter' 
  | 'system' 
  | 'product' 
  | 'news';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Send real-time notification to all connected admin users
 */
export async function sendAdminNotification(payload: NotificationPayload) {
  try {
    // Broadcast to all connected WebSocket clients
    broadcastNotification({
      type: payload.type,
      title: payload.title,
      message: payload.message,
      priority: payload.priority || 'normal',
      data: {
        link: payload.link,
        metadata: payload.metadata,
      },
    });

    // Also save to notification center in database
    const db = await getDb();
    if (db) {
      await db.insert(notificationCenter).values({
        type: payload.type,
        title: payload.title,
        message: payload.message,
        priority: payload.priority || 'normal',
        link: payload.link,
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        isRead: 'false',
      });
    }

    console.log(`[Notification] Sent: ${payload.title}`);
  } catch (error) {
    console.error('[Notification] Error sending notification:', error);
  }
}

/**
 * Trigger when a new contact form is submitted
 */
export async function triggerNewContact(contactData: {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message?: string;
  requestType?: 'contact' | 'quote' | 'support';
}) {
  try {
    const isQuote = contactData.requestType === 'quote';
    
    // 1. Send real-time notification to admin
    await sendAdminNotification({
      type: isQuote ? 'quote' : 'contact',
      title: isQuote 
        ? `🔔 Yêu cầu báo giá mới từ ${contactData.name}`
        : `📩 Liên hệ mới từ ${contactData.name}`,
      message: contactData.subject || contactData.message?.substring(0, 100) || 'Không có nội dung',
      priority: isQuote ? 'high' : 'normal',
      link: '/admin/contacts',
      metadata: {
        contactId: contactData.id,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
      },
    });

    // 2. Trigger email workflow (send thank you email + admin notification)
    await workflowNewContact(contactData.id);

    // 3. Trigger lead scoring
    await workflowLeadScoring(contactData.id);

    // 4. Log activity
    await logActivity({
      action: 'create',
      entityType: 'contact',
      entityId: contactData.id,
      entityName: contactData.name,
      status: 'success',
      details: {
        email: contactData.email,
        requestType: contactData.requestType,
      },
    });

    console.log(`[Integration] New contact processed: ${contactData.email}`);
  } catch (error) {
    console.error('[Integration] Error processing new contact:', error);
  }
}

/**
 * Trigger when a new job application is submitted
 */
export async function triggerNewJobApplication(applicationData: {
  id: number;
  jobId: number;
  jobTitle: string;
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
}) {
  try {
    // 1. Send real-time notification to admin
    await sendAdminNotification({
      type: 'application',
      title: `👤 Đơn ứng tuyển mới từ ${applicationData.name}`,
      message: `Vị trí: ${applicationData.jobTitle}`,
      priority: 'high',
      link: '/admin/applications',
      metadata: {
        applicationId: applicationData.id,
        jobId: applicationData.jobId,
        email: applicationData.email,
        phone: applicationData.phone,
        hasResume: !!applicationData.resumeUrl,
      },
    });

    // 2. Trigger email workflow (send confirmation + admin notification)
    await workflowNewJobApplication(applicationData.id);

    // 3. Log activity
    await logActivity({
      action: 'create',
      entityType: 'application',
      entityId: applicationData.id,
      entityName: applicationData.name,
      status: 'success',
      details: {
        email: applicationData.email,
        jobTitle: applicationData.jobTitle,
        jobId: applicationData.jobId,
      },
    });

    console.log(`[Integration] New job application processed: ${applicationData.email}`);
  } catch (error) {
    console.error('[Integration] Error processing job application:', error);
  }
}

/**
 * Trigger when a new newsletter subscription is created
 */
export async function triggerNewNewsletterSubscription(subscriberData: {
  id: number;
  email: string;
  name?: string;
  source?: string;
}) {
  try {
    // 1. Send real-time notification to admin
    await sendAdminNotification({
      type: 'newsletter',
      title: `📧 Đăng ký newsletter mới`,
      message: `${subscriberData.email} đã đăng ký nhận tin`,
      priority: 'low',
      link: '/admin/newsletter',
      metadata: {
        subscriberId: subscriberData.id,
        email: subscriberData.email,
        name: subscriberData.name,
        source: subscriberData.source,
      },
    });

    // 2. Trigger email workflow (send welcome email)
    await workflowNewsletterSubscription(subscriberData.id);

    // 3. Log activity
    await logActivity({
      action: 'create',
      entityType: 'newsletter',
      entityId: subscriberData.id,
      entityName: subscriberData.email,
      status: 'success',
      details: {
        source: subscriberData.source,
      },
    });

    console.log(`[Integration] New newsletter subscription processed: ${subscriberData.email}`);
  } catch (error) {
    console.error('[Integration] Error processing newsletter subscription:', error);
  }
}

/**
 * Send system notification (for important events)
 */
export async function sendSystemNotification(
  title: string, 
  message: string, 
  priority: NotificationPriority = 'normal'
) {
  await sendAdminNotification({
    type: 'system',
    title,
    message,
    priority,
  });
}

/**
 * Get WebSocket connection status
 */
export function getWebSocketStatus() {
  return {
    connectedUsers: getConnectedUsers(),
    isActive: true,
  };
}

export default {
  sendAdminNotification,
  triggerNewContact,
  triggerNewJobApplication,
  triggerNewNewsletterSubscription,
  sendSystemNotification,
  getWebSocketStatus,
};
