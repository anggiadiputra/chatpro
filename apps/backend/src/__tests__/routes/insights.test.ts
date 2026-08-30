import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';

// Mock the database
vi.mock('../../utils/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock the insights service
vi.mock('../../services/insights-service.js', () => ({
  insightsService: {
    getMessageAnalytics: vi.fn(),
    getConversationAnalytics: vi.fn(),
    getTemplatePerformance: vi.fn(),
    getInsightsOverview: vi.fn(),
  },
  InsightsServiceError: class InsightsServiceError extends Error {
    code: string;
    details?: Record<string, unknown>;
    cachedData?: unknown;
    constructor(code: string, message: string, details?: Record<string, unknown>, cachedData?: unknown) {
      super(message);
      this.code = code;
      this.details = details;
      this.cachedData = cachedData;
    }
    toJSON() {
      return { code: this.code, message: this.message, details: this.details };
    }
  },
}));

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  requireRole: () => async (c: any, next: () => Promise<void>) => {
    await next();
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
import insightsRoutes from '../../routes/insights.js';
import { insightsService, InsightsServiceError } from '../../services/insights-service.js';

// Create test app
const createTestApp = (user?: { id?: string; wabaId?: string; role?: string }) => {
  const app = new Hono();
  
  // Mock user context
  app.use('*', async (c, next) => {
    (c as any).user = user || { id: 'test-user-123', wabaId: 'test-waba-123', role: 'ADMIN' };
    await next();
  });
  
  app.route('/api/v1/insights', insightsRoutes);
  return app;
};

describe('Insights API Routes', () => {
  const mockStartDate = 1703980800;
  const mockEndDate = 1704067200;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: user has wabaId
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ wabaId: 'test-waba-123' } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/insights/messages', () => {
    const mockMessageData = {
      phoneNumbers: ['+1234567890'],
      countryCodes: ['US'],
      granularity: 'DAILY' as const,
      dataPoints: [{ start: mockStartDate, end: mockEndDate, sent: 100, delivered: 95 }],
      totals: { sent: 100, delivered: 95, deliveryRate: 95 },
    };

    it('should return message analytics successfully', async () => {
      vi.mocked(insightsService.getMessageAnalytics).mockResolvedValue(mockMessageData);
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.totals.sent).toBe(100);
      expect(data.data.totals.delivered).toBe(95);
    });

    it('should return 400 when no WABA connected', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ wabaId: null } as any);
      const app = createTestApp({ id: 'test-user', role: 'ADMIN' });

      const response = await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NO_WABA_CONNECTED');
    });

    it('should return 400 for missing date parameters', async () => {
      const app = createTestApp();

      const response = await app.request('/api/v1/insights/messages', { method: 'GET' });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_PARAMS');
    });

    it('should return 400 for invalid date parameters', async () => {
      const app = createTestApp();

      const response = await app.request(
        '/api/v1/insights/messages?startDate=invalid&endDate=invalid',
        { method: 'GET' }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_PARAMS');
    });

    it('should return 400 for date range exceeding 90 days', async () => {
      const app = createTestApp();
      const startDate = mockStartDate;
      const endDate = mockStartDate + (91 * 24 * 60 * 60); // 91 days

      const response = await app.request(
        `/api/v1/insights/messages?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_PARAMS');
    });

    it('should use default granularity when not specified', async () => {
      vi.mocked(insightsService.getMessageAnalytics).mockResolvedValue(mockMessageData);
      const app = createTestApp();

      await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(insightsService.getMessageAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ granularity: 'DAY' })
      );
    });

    it('should accept custom granularity', async () => {
      vi.mocked(insightsService.getMessageAnalytics).mockResolvedValue(mockMessageData);
      const app = createTestApp();

      await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}&granularity=MONTHLY`,
        { method: 'GET' }
      );

      expect(insightsService.getMessageAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ granularity: 'MONTH' })
      );
    });

    it('should parse phone numbers from query', async () => {
      vi.mocked(insightsService.getMessageAnalytics).mockResolvedValue(mockMessageData);
      const app = createTestApp();

      await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}&phoneNumbers=1234567890,0987654321`,
        { method: 'GET' }
      );

      expect(insightsService.getMessageAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ phoneNumbers: ['1234567890', '0987654321'] })
      );
    });
  });

  describe('GET /api/v1/insights/conversations', () => {
    const mockConversationData = {
      dataPoints: [],
      totals: {
        totalConversations: 100,
        totalCost: 50,
        byCategory: { marketing: 40, utility: 30, authentication: 20, service: 10 },
        costByCategory: { marketing: 20, utility: 15, authentication: 10, service: 5 },
      },
    };

    it('should return conversation analytics successfully', async () => {
      vi.mocked(insightsService.getConversationAnalytics).mockResolvedValue(mockConversationData);
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/conversations?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.totals.totalConversations).toBe(100);
    });

    it('should parse conversation categories from query', async () => {
      vi.mocked(insightsService.getConversationAnalytics).mockResolvedValue(mockConversationData);
      const app = createTestApp();

      await app.request(
        `/api/v1/insights/conversations?startDate=${mockStartDate}&endDate=${mockEndDate}&categories=MARKETING,UTILITY`,
        { method: 'GET' }
      );

      expect(insightsService.getConversationAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({ conversationCategories: ['MARKETING', 'UTILITY'] })
      );
    });
  });

  describe('GET /api/v1/insights/templates', () => {
    const mockTemplateData = {
      templates: [
        { templateId: 'template-1', sent: 100, delivered: 95, read: 80, deliveryRate: 95, readRate: 84.21 },
      ],
    };

    it('should return template performance successfully', async () => {
      vi.mocked(insightsService.getTemplatePerformance).mockResolvedValue(mockTemplateData);
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/templates?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
    });

    it('should handle region restriction error', async () => {
      vi.mocked(insightsService.getTemplatePerformance).mockRejectedValue(
        new InsightsServiceError('REGION_RESTRICTED', 'Not available in your region')
      );
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/templates?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('REGION_RESTRICTED');
    });

    it('should parse template IDs from query', async () => {
      vi.mocked(insightsService.getTemplatePerformance).mockResolvedValue(mockTemplateData);
      const app = createTestApp();

      await app.request(
        `/api/v1/insights/templates?startDate=${mockStartDate}&endDate=${mockEndDate}&templateIds=t1,t2`,
        { method: 'GET' }
      );

      expect(insightsService.getTemplatePerformance).toHaveBeenCalledWith(
        expect.objectContaining({ templateIds: ['t1', 't2'] })
      );
    });
  });

  describe('GET /api/v1/insights/overview', () => {
    const mockOverviewData = {
      messages: { totalSent: 100, totalDelivered: 95, deliveryRate: 95 },
      conversations: { total: 50, estimatedCost: 25, byCategory: { marketing: 20, utility: 15, authentication: 10, service: 5 } },
      period: { start: mockStartDate, end: mockEndDate, granularity: 'DAILY' as const },
    };

    it('should return insights overview successfully', async () => {
      vi.mocked(insightsService.getInsightsOverview).mockResolvedValue(mockOverviewData);
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/overview?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.messages.totalSent).toBe(100);
      expect(data.data.conversations.total).toBe(50);
    });
  });

  describe('Error handling', () => {
    it('should handle rate limiting with cached data fallback', async () => {
      const cachedData = { totals: { sent: 50, delivered: 48, deliveryRate: 96 } };
      const error = new InsightsServiceError('RATE_LIMITED', 'Rate limit exceeded', { retryAfter: 60 }, cachedData);
      vi.mocked(insightsService.getMessageAnalytics).mockRejectedValue(error);
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.cached).toBe(true);
      expect(data.error.code).toBe('RATE_LIMITED');
    });

    it('should return 429 for rate limiting without cached data', async () => {
      const error = new InsightsServiceError('RATE_LIMITED', 'Rate limit exceeded', { retryAfter: 60 });
      vi.mocked(insightsService.getMessageAnalytics).mockRejectedValue(error);
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error.code).toBe('RATE_LIMITED');
    });

    it('should return 401 for unauthorized errors', async () => {
      const error = new InsightsServiceError('UNAUTHORIZED', 'Invalid access token');
      vi.mocked(insightsService.getMessageAnalytics).mockRejectedValue(error);
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(insightsService.getMessageAnalytics).mockRejectedValue(new Error('Unexpected error'));
      const app = createTestApp();

      const response = await app.request(
        `/api/v1/insights/messages?startDate=${mockStartDate}&endDate=${mockEndDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('META_API_ERROR');
    });
  });
});
