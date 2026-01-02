import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the WebSocket module
vi.mock('../websocket', () => ({
  broadcastNotification: vi.fn(),
  broadcastToUser: vi.fn(),
  getConnectedUsers: vi.fn(() => []),
  setupWebSocket: vi.fn(),
}));

// Mock the emailWorkflows module
vi.mock('../emailWorkflows', () => ({
  workflowNewContact: vi.fn(),
  workflowNewJobApplication: vi.fn(),
  workflowNewsletterSubscription: vi.fn(),
  workflowLeadScoring: vi.fn(),
}));

// Mock the activityLogger module
vi.mock('../activityLogger', () => ({
  logActivity: vi.fn(),
}));

// Mock the database
vi.mock('../db', () => ({
  getDb: vi.fn(() => ({
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    })),
  })),
}));

describe('Integrations Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendAdminNotification', () => {
    it('should broadcast notification via WebSocket', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { sendAdminNotification } = await import('../integrations');

      await sendAdminNotification({
        type: 'contact',
        title: 'Test Notification',
        message: 'Test message',
        priority: 'normal',
      });

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'contact',
          title: 'Test Notification',
          message: 'Test message',
        })
      );
    });

    it('should handle different notification types', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { sendAdminNotification } = await import('../integrations');

      const types = ['contact', 'quote', 'application', 'newsletter', 'system'] as const;

      for (const type of types) {
        await sendAdminNotification({
          type,
          title: `${type} notification`,
          message: 'Test',
        });
      }

      expect(broadcastNotification).toHaveBeenCalledTimes(types.length);
    });

    it('should handle priority levels', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { sendAdminNotification } = await import('../integrations');

      await sendAdminNotification({
        type: 'system',
        title: 'Urgent',
        message: 'Critical issue',
        priority: 'urgent',
      });

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'urgent',
        })
      );
    });
  });

  describe('triggerNewContact', () => {
    it('should trigger WebSocket notification for new contact', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { triggerNewContact } = await import('../integrations');

      await triggerNewContact({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0123456789',
        company: 'Test Corp',
        subject: 'Inquiry',
        message: 'Hello',
        requestType: 'contact',
      });

      expect(broadcastNotification).toHaveBeenCalled();
    });

    it('should trigger email workflow for new contact', async () => {
      const { workflowNewContact } = await import('../emailWorkflows');
      const { triggerNewContact } = await import('../integrations');

      await triggerNewContact({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(workflowNewContact).toHaveBeenCalledWith(1);
    });

    it('should trigger lead scoring for new contact', async () => {
      const { workflowLeadScoring } = await import('../emailWorkflows');
      const { triggerNewContact } = await import('../integrations');

      await triggerNewContact({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(workflowLeadScoring).toHaveBeenCalledWith(1);
    });

    it('should log activity for new contact', async () => {
      const { logActivity } = await import('../activityLogger');
      const { triggerNewContact } = await import('../integrations');

      await triggerNewContact({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'contact',
          entityId: 1,
        })
      );
    });

    it('should handle quote request type with high priority', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { triggerNewContact } = await import('../integrations');

      await triggerNewContact({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        requestType: 'quote',
      });

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'quote',
          priority: 'high',
        })
      );
    });
  });

  describe('triggerNewJobApplication', () => {
    it('should trigger WebSocket notification for new application', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { triggerNewJobApplication } = await import('../integrations');

      await triggerNewJobApplication({
        id: 1,
        jobId: 1,
        jobTitle: 'Software Engineer',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application',
        })
      );
    });

    it('should trigger email workflow for new application', async () => {
      const { workflowNewJobApplication } = await import('../emailWorkflows');
      const { triggerNewJobApplication } = await import('../integrations');

      await triggerNewJobApplication({
        id: 1,
        jobId: 1,
        jobTitle: 'Software Engineer',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      expect(workflowNewJobApplication).toHaveBeenCalledWith(1);
    });

    it('should log activity for new application', async () => {
      const { logActivity } = await import('../activityLogger');
      const { triggerNewJobApplication } = await import('../integrations');

      await triggerNewJobApplication({
        id: 1,
        jobId: 1,
        jobTitle: 'Software Engineer',
        name: 'Jane Doe',
        email: 'jane@example.com',
      });

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'application',
          entityId: 1,
        })
      );
    });

    it('should include job metadata in notification', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { triggerNewJobApplication } = await import('../integrations');

      await triggerNewJobApplication({
        id: 1,
        jobId: 5,
        jobTitle: 'Senior Developer',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '0987654321',
        resumeUrl: 'https://example.com/cv.pdf',
      });

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              jobId: 5,
              hasResume: true,
            }),
          }),
        })
      );
    });
  });

  describe('triggerNewNewsletterSubscription', () => {
    it('should trigger WebSocket notification for new subscription', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { triggerNewNewsletterSubscription } = await import('../integrations');

      await triggerNewNewsletterSubscription({
        id: 1,
        email: 'subscriber@example.com',
        name: 'Subscriber',
        source: 'website',
      });

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'newsletter',
        })
      );
    });

    it('should trigger email workflow for new subscription', async () => {
      const { workflowNewsletterSubscription } = await import('../emailWorkflows');
      const { triggerNewNewsletterSubscription } = await import('../integrations');

      await triggerNewNewsletterSubscription({
        id: 1,
        email: 'subscriber@example.com',
      });

      expect(workflowNewsletterSubscription).toHaveBeenCalledWith(1);
    });

    it('should log activity for new subscription', async () => {
      const { logActivity } = await import('../activityLogger');
      const { triggerNewNewsletterSubscription } = await import('../integrations');

      await triggerNewNewsletterSubscription({
        id: 1,
        email: 'subscriber@example.com',
      });

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'newsletter',
          entityId: 1,
        })
      );
    });

    it('should have low priority for newsletter notifications', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { triggerNewNewsletterSubscription } = await import('../integrations');

      await triggerNewNewsletterSubscription({
        id: 1,
        email: 'subscriber@example.com',
      });

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'low',
        })
      );
    });
  });

  describe('sendSystemNotification', () => {
    it('should send system notification with default priority', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { sendSystemNotification } = await import('../integrations');

      await sendSystemNotification('System Alert', 'Test message');

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          title: 'System Alert',
          message: 'Test message',
          priority: 'normal',
        })
      );
    });

    it('should send system notification with custom priority', async () => {
      const { broadcastNotification } = await import('../websocket');
      const { sendSystemNotification } = await import('../integrations');

      await sendSystemNotification('Critical Alert', 'Urgent issue', 'urgent');

      expect(broadcastNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'urgent',
        })
      );
    });
  });

  describe('getWebSocketStatus', () => {
    it('should return WebSocket connection status', async () => {
      const { getConnectedUsers } = await import('../websocket');
      const { getWebSocketStatus } = await import('../integrations');

      (getConnectedUsers as any).mockReturnValue(['user1', 'user2']);

      const status = getWebSocketStatus();

      expect(status).toEqual({
        connectedUsers: ['user1', 'user2'],
        isActive: true,
      });
    });
  });
});

describe('Email Workflows', () => {
  describe('workflowNewContact', () => {
    it('should be exported from emailWorkflows', async () => {
      const emailWorkflows = await import('../emailWorkflows');
      expect(typeof emailWorkflows.workflowNewContact).toBe('function');
    });
  });

  describe('workflowNewJobApplication', () => {
    it('should be exported from emailWorkflows', async () => {
      const emailWorkflows = await import('../emailWorkflows');
      expect(typeof emailWorkflows.workflowNewJobApplication).toBe('function');
    });
  });

  describe('workflowNewsletterSubscription', () => {
    it('should be exported from emailWorkflows', async () => {
      const emailWorkflows = await import('../emailWorkflows');
      expect(typeof emailWorkflows.workflowNewsletterSubscription).toBe('function');
    });
  });

  describe('workflowLeadScoring', () => {
    it('should be exported from emailWorkflows', async () => {
      const emailWorkflows = await import('../emailWorkflows');
      expect(typeof emailWorkflows.workflowLeadScoring).toBe('function');
    });
  });
});
