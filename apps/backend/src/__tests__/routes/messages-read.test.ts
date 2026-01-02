import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';

// Mock the database
vi.mock('../../utils/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock WhatsApp client
vi.mock('../../utils/whatsapp.js', () => ({
  getWhatsAppClientAsync: vi.fn().mockResolvedValue({
    markAsRead: vi.fn().mockResolvedValue(true),
  }),
}));

// Mock resolveContext middleware
vi.mock('../../middleware/resolveContext.js', () => ({
  resolveContext: async (c: any, next: () => Promise<void>) => {
    c.set('effectiveUserId', c.user?.id || 'test-user-123');
    c.set('actingAgentId', null);
    await next();
  },
  getEffectiveUserId: (c: any) => c.get('effectiveUserId') || c.user?.id || '',
}));

import { prisma } from '../../utils/database.js';
import { getWhatsAppClientAsync } from '../../utils/whatsapp.js';
import messagesReadRoutes from '../../routes/messages/read.js';

// Create test app
const createTestApp = (user?: { id?: string; role?: string }) => {
  const app = new Hono();
  
  // Mock user context
  app.use('*', async (c, next) => {
    (c as any).user = user || { id: 'test-user-123', role: 'BUSINESS_OWNER' };
    c.set('effectiveUserId', user?.id || 'test-user-123');
    await next();
  });
  
  app.route('/api/v1/messages/read', messagesReadRoutes);
  return app;
};

describe('Messages Read API - Mark as Read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/messages/read - Mark Messages as Read', () => {
    /**
     * Property 2: Mark as Read Resets Count
     * For any conversation, after calling markAsRead, the unreadCount SHALL be 0 
     * and all INBOUND messages SHALL have status READ.
     * Validates: Requirements 1.3, 2.1, 2.2
     */

    it('should mark all INBOUND messages as READ and return unreadCount: 0', async () => {
      const mockUser = {
        phoneNumberId: 'phone-123',
        wabaConnectionStatus: 'connected',
        wabaAccessToken: 'token-123',
      };

      const mockUnreadMessages = [
        { id: 'msg-1', wamId: 'wam-1', status: 'DELIVERED', direction: 'INBOUND' },
        { id: 'msg-2', wamId: 'wam-2', status: 'DELIVERED', direction: 'INBOUND' },
        { id: 'msg-3', wamId: 'wam-3', status: 'SENT', direction: 'INBOUND' },
      ];

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockUnreadMessages as any);
      vi.mocked(prisma.message.updateMany).mockResolvedValue({ count: 3 });

      const app = createTestApp();
      const response = await app.request('/api/v1/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 'customer-123' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.unreadCount).toBe(0);
      expect(data.markedCount).toBe(3);

      // Verify updateMany was called with correct parameters
      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['msg-1', 'msg-2', 'msg-3'] },
        },
        data: {
          status: 'READ',
        },
      });
    });

    it('should return unreadCount: 0 when no unread messages exist', async () => {
      const mockUser = {
        phoneNumberId: 'phone-123',
        wabaConnectionStatus: 'connected',
        wabaAccessToken: 'token-123',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.message.findMany).mockResolvedValue([]);

      const app = createTestApp();
      const response = await app.request('/api/v1/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 'customer-123' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.unreadCount).toBe(0);
      expect(data.markedCount).toBe(0);
      expect(data.message).toBe('No unread messages');
    });

    it('should only query INBOUND messages with DELIVERED or SENT status', async () => {
      const mockUser = {
        phoneNumberId: 'phone-123',
        wabaConnectionStatus: 'connected',
        wabaAccessToken: 'token-123',
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.message.findMany).mockResolvedValue([]);

      const app = createTestApp();
      await app.request('/api/v1/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 'customer-123' }),
      });

      // Verify findMany was called with correct filters
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'test-user-123',
          customerId: 'customer-123',
          direction: 'INBOUND',
          status: { in: ['DELIVERED', 'SENT'] },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });
    });

    it('should still update local status even if WhatsApp API fails', async () => {
      const mockUser = {
        phoneNumberId: 'phone-123',
        wabaConnectionStatus: 'connected',
        wabaAccessToken: 'token-123',
      };

      const mockUnreadMessages = [
        { id: 'msg-1', wamId: 'wam-1', status: 'DELIVERED', direction: 'INBOUND' },
      ];

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.message.findMany).mockResolvedValue(mockUnreadMessages as any);
      vi.mocked(prisma.message.updateMany).mockResolvedValue({ count: 1 });
      
      // Mock WhatsApp API failure
      const mockWhatsApp = { markAsRead: vi.fn().mockRejectedValue(new Error('API Error')) };
      vi.mocked(getWhatsAppClientAsync).mockResolvedValue(mockWhatsApp as any);

      const app = createTestApp();
      const response = await app.request('/api/v1/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 'customer-123' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should still succeed and return unreadCount: 0
      expect(data.success).toBe(true);
      expect(data.unreadCount).toBe(0);
      
      // Local status should still be updated
      expect(prisma.message.updateMany).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      const app = new Hono();
      app.use('*', async (c, next) => {
        // No user set - effectiveUserId will be empty
        await next();
      });
      app.route('/api/v1/messages/read', messagesReadRoutes);

      const response = await app.request('/api/v1/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 'customer-123' }),
      });

      expect(response.status).toBe(401);
    });

    it('should return 400 when customerId is missing', async () => {
      const app = createTestApp();
      const response = await app.request('/api/v1/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when WhatsApp is not connected', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ phoneNumberId: null } as any);

      const app = createTestApp();
      const response = await app.request('/api/v1/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: 'customer-123' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('WhatsApp not connected');
    });
  });
});
