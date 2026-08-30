import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';

// Mock the database
vi.mock('../../utils/database.js', () => ({
  prisma: {
    message: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    conversationAssignment: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
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
import messagesListRoutes from '../../routes/messages/list.js';

// Create test app
const createTestApp = (user?: { id?: string; role?: string }) => {
  const app = new Hono();
  
  // Mock user context
  app.use('*', async (c, next) => {
    (c as any).user = user || { id: 'test-user-123', role: 'BUSINESS_OWNER' };
    c.set('effectiveUserId', user?.id || 'test-user-123');
    await next();
  });
  
  app.route('/api/v1/messages', messagesListRoutes);
  return app;
};

describe('Messages List API - Unread Count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/messages - Unread Count Calculation', () => {
    /**
     * Property 1: Unread Count Accuracy
     * For any customer with messages, the unreadCount SHALL equal the count of 
     * INBOUND messages where status is not READ.
     * Validates: Requirements 1.1, 5.1
     */

    it('should return unreadCounts in response', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          customerId: 'customer-1',
          direction: 'INBOUND',
          status: 'DELIVERED',
          content: 'Hello',
          timestamp: new Date(),
          customer: { id: 'customer-1', phoneNumber: '+1234567890', name: 'John' },
          user: { id: 'test-user-123', name: 'Test User', email: 'test@example.com' },
          template: null,
        },
      ];

      const mockUnreadCounts = [
        { customerId: 'customer-1', _count: { id: 1 } },
      ];

      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages as any);
      vi.mocked(prisma.message.groupBy).mockResolvedValue(mockUnreadCounts as any);

      const app = createTestApp();
      const response = await app.request('/api/v1/messages', { method: 'GET' });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.unreadCounts).toBeDefined();
      expect(data.unreadCounts['customer-1']).toBe(1);
    });

    it('should return empty unreadCounts when no unread messages', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          customerId: 'customer-1',
          direction: 'INBOUND',
          status: 'READ',
          content: 'Hello',
          timestamp: new Date(),
          customer: { id: 'customer-1', phoneNumber: '+1234567890', name: 'John' },
          user: { id: 'test-user-123', name: 'Test User', email: 'test@example.com' },
          template: null,
        },
      ];

      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages as any);
      vi.mocked(prisma.message.groupBy).mockResolvedValue([]);

      const app = createTestApp();
      const response = await app.request('/api/v1/messages', { method: 'GET' });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.unreadCounts).toEqual({});
    });

    it('should calculate correct unread counts for multiple customers', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          customerId: 'customer-1',
          direction: 'INBOUND',
          status: 'DELIVERED',
          content: 'Hello',
          timestamp: new Date(),
          customer: { id: 'customer-1', phoneNumber: '+1234567890', name: 'John' },
          user: { id: 'test-user-123', name: 'Test User', email: 'test@example.com' },
          template: null,
        },
        {
          id: 'msg-2',
          customerId: 'customer-2',
          direction: 'INBOUND',
          status: 'DELIVERED',
          content: 'Hi',
          timestamp: new Date(),
          customer: { id: 'customer-2', phoneNumber: '+0987654321', name: 'Jane' },
          user: { id: 'test-user-123', name: 'Test User', email: 'test@example.com' },
          template: null,
        },
      ];

      const mockUnreadCounts = [
        { customerId: 'customer-1', _count: { id: 3 } },
        { customerId: 'customer-2', _count: { id: 5 } },
      ];

      vi.mocked(prisma.message.findMany).mockResolvedValue(mockMessages as any);
      vi.mocked(prisma.message.groupBy).mockResolvedValue(mockUnreadCounts as any);

      const app = createTestApp();
      const response = await app.request('/api/v1/messages', { method: 'GET' });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.unreadCounts['customer-1']).toBe(3);
      expect(data.unreadCounts['customer-2']).toBe(5);
    });

    it('should only count INBOUND messages with status NOT READ', async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([]);
      vi.mocked(prisma.message.groupBy).mockResolvedValue([]);

      const app = createTestApp();
      await app.request('/api/v1/messages', { method: 'GET' });

      // Verify the groupBy query filters correctly
      expect(prisma.message.groupBy).toHaveBeenCalledWith({
        by: ['customerId'],
        where: {
          userId: 'test-user-123',
          direction: 'INBOUND',
          status: { not: 'READ' },
        },
        _count: { id: true },
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      const app = new Hono();
      app.use('*', async (c, next) => {
        // No user set
        await next();
      });
      app.route('/api/v1/messages', messagesListRoutes);

      const response = await app.request('/api/v1/messages', { method: 'GET' });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('Unauthorized');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(prisma.message.findMany).mockRejectedValue(new Error('Database error'));

      const app = createTestApp();
      const response = await app.request('/api/v1/messages', { method: 'GET' });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('InternalServerError');
    });
  });
});
