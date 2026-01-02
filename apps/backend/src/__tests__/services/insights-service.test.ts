import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock dependencies
vi.mock('../../utils/whatsapp.js', () => ({
  getWhatsAppClientAsync: vi.fn(),
}));

vi.mock('../../services/settings-cache.js', () => ({
  settingsCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { getWhatsAppClientAsync } from '../../utils/whatsapp.js';
import { settingsCache } from '../../services/settings-cache.js';
import { insightsService, InsightsServiceError } from '../../services/insights-service.js';
import type {
  MessageAnalyticsParams,
  ConversationAnalyticsParams,
  TemplatePerformanceParams,
  MetaMessageAnalyticsResponse,
  MetaConversationAnalyticsResponse,
} from '../../types/insights.js';

describe('InsightsService', () => {
  const mockWabaId = 'waba-123';
  const mockStartDate = 1703980800; // 2023-12-31
  const mockEndDate = 1704067200; // 2024-01-01

  const mockWhatsAppClient = {
    getAnalytics: vi.fn(),
    getConversationAnalytics: vi.fn(),
    getTemplatePerformanceMetrics: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWhatsAppClientAsync).mockResolvedValue(mockWhatsAppClient as any);
    vi.mocked(settingsCache.get).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getMessageAnalytics', () => {
    const mockParams: MessageAnalyticsParams = {
      wabaId: mockWabaId,
      startDate: mockStartDate,
      endDate: mockEndDate,
      granularity: 'DAILY',
    };

    const mockMetaResponse: MetaMessageAnalyticsResponse = {
      analytics: {
        phone_numbers: ['+1234567890'],
        country_codes: ['US'],
        granularity: 'DAILY',
        data_points: [
          { start: mockStartDate, end: mockEndDate, sent: 100, delivered: 95 },
        ],
      },
      id: mockWabaId,
    };

    it('should fetch and process message analytics from Meta API', async () => {
      mockWhatsAppClient.getAnalytics.mockResolvedValue(mockMetaResponse);

      const result = await insightsService.getMessageAnalytics(mockParams);

      expect(mockWhatsAppClient.getAnalytics).toHaveBeenCalledWith(mockWabaId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        granularity: 'DAILY',
        phoneNumbers: undefined,
      });
      expect(result.totals.sent).toBe(100);
      expect(result.totals.delivered).toBe(95);
      expect(result.totals.deliveryRate).toBe(95);
      expect(result.phoneNumbers).toEqual(['+1234567890']);
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        phoneNumbers: ['+1234567890'],
        countryCodes: ['US'],
        granularity: 'DAILY' as const,
        dataPoints: [{ start: mockStartDate, end: mockEndDate, sent: 50, delivered: 48 }],
        totals: { sent: 50, delivered: 48, deliveryRate: 96 },
      };
      vi.mocked(settingsCache.get).mockReturnValue(cachedData);

      const result = await insightsService.getMessageAnalytics(mockParams);

      expect(mockWhatsAppClient.getAnalytics).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should cache fetched data', async () => {
      mockWhatsAppClient.getAnalytics.mockResolvedValue(mockMetaResponse);

      await insightsService.getMessageAnalytics(mockParams);

      expect(settingsCache.set).toHaveBeenCalled();
    });

    it('should handle rate limiting with cached fallback', async () => {
      const rateLimitError = {
        response: {
          status: 429,
          data: { error: { code: 4, message: 'Rate limit exceeded' } },
          headers: { 'retry-after': '60' },
        },
      };
      mockWhatsAppClient.getAnalytics.mockRejectedValue(rateLimitError);

      await expect(insightsService.getMessageAnalytics(mockParams))
        .rejects.toThrow(InsightsServiceError);

      try {
        await insightsService.getMessageAnalytics(mockParams);
      } catch (error) {
        expect(error).toBeInstanceOf(InsightsServiceError);
        expect((error as InsightsServiceError).code).toBe('RATE_LIMITED');
      }
    });

    it('should handle Meta API errors', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { error: { code: 100, message: 'Internal error' } },
        },
      };
      mockWhatsAppClient.getAnalytics.mockRejectedValue(apiError);

      await expect(insightsService.getMessageAnalytics(mockParams))
        .rejects.toThrow(InsightsServiceError);
    });

    it('should calculate delivery rate correctly', async () => {
      const responseWithMultiplePoints: MetaMessageAnalyticsResponse = {
        analytics: {
          phone_numbers: ['+1234567890'],
          country_codes: ['US'],
          granularity: 'DAILY',
          data_points: [
            { start: mockStartDate, end: mockEndDate, sent: 100, delivered: 90 },
            { start: mockEndDate, end: mockEndDate + 86400, sent: 200, delivered: 180 },
          ],
        },
        id: mockWabaId,
      };
      mockWhatsAppClient.getAnalytics.mockResolvedValue(responseWithMultiplePoints);

      const result = await insightsService.getMessageAnalytics(mockParams);

      expect(result.totals.sent).toBe(300);
      expect(result.totals.delivered).toBe(270);
      expect(result.totals.deliveryRate).toBe(90);
    });
  });

  describe('getConversationAnalytics', () => {
    const mockParams: ConversationAnalyticsParams = {
      wabaId: mockWabaId,
      startDate: mockStartDate,
      endDate: mockEndDate,
      granularity: 'DAILY',
    };

    const mockMetaResponse: MetaConversationAnalyticsResponse = {
      conversation_analytics: {
        data: [{
          data_points: [
            {
              start: mockStartDate,
              end: mockEndDate,
              conversation: 50,
              phone_number: '+1234567890',
              country: 'US',
              conversation_type: 'REGULAR',
              conversation_direction: 'BUSINESS_INITIATED',
              conversation_category: 'MARKETING',
              cost: 25.5,
            },
            {
              start: mockStartDate,
              end: mockEndDate,
              conversation: 30,
              phone_number: '+1234567890',
              country: 'US',
              conversation_type: 'REGULAR',
              conversation_direction: 'USER_INITIATED',
              conversation_category: 'UTILITY',
              cost: 15.0,
            },
          ],
        }],
      },
      id: mockWabaId,
    };

    it('should fetch and process conversation analytics', async () => {
      mockWhatsAppClient.getConversationAnalytics.mockResolvedValue(mockMetaResponse);

      const result = await insightsService.getConversationAnalytics(mockParams);

      expect(result.totals.totalConversations).toBe(80);
      expect(result.totals.totalCost).toBe(40.5);
      expect(result.totals.byCategory.marketing).toBe(50);
      expect(result.totals.byCategory.utility).toBe(30);
    });

    it('should return cached conversation data when available', async () => {
      const cachedData = {
        dataPoints: [],
        totals: {
          totalConversations: 100,
          totalCost: 50,
          byCategory: { marketing: 40, utility: 30, authentication: 20, service: 10 },
          costByCategory: { marketing: 20, utility: 15, authentication: 10, service: 5 },
        },
      };
      vi.mocked(settingsCache.get).mockReturnValue(cachedData);

      const result = await insightsService.getConversationAnalytics(mockParams);

      expect(mockWhatsAppClient.getConversationAnalytics).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('should handle empty conversation data', async () => {
      const emptyResponse: MetaConversationAnalyticsResponse = {
        conversation_analytics: { data: [] },
        id: mockWabaId,
      };
      mockWhatsAppClient.getConversationAnalytics.mockResolvedValue(emptyResponse);

      const result = await insightsService.getConversationAnalytics(mockParams);

      expect(result.totals.totalConversations).toBe(0);
      expect(result.totals.totalCost).toBe(0);
    });
  });

  describe('getTemplatePerformance', () => {
    const mockParams: TemplatePerformanceParams = {
      wabaId: mockWabaId,
      startDate: mockStartDate,
      endDate: mockEndDate,
    };

    const mockMetaResponse = {
      data: [
        {
          template_id: 'template-1',
          analytics: { sent: 100, delivered: 95, read: 80, clicked: 20 },
        },
        {
          template_id: 'template-2',
          analytics: { sent: 50, delivered: 48, read: 40 },
        },
      ],
    };

    it('should fetch and process template performance', async () => {
      mockWhatsAppClient.getTemplatePerformanceMetrics.mockResolvedValue(mockMetaResponse);

      const result = await insightsService.getTemplatePerformance(mockParams);

      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].templateId).toBe('template-1');
      expect(result.templates[0].deliveryRate).toBe(95);
      expect(result.templates[0].readRate).toBeCloseTo(84.21, 1);
      expect(result.templates[0].clickRate).toBeCloseTo(21.05, 1);
    });

    it('should handle region restriction error', async () => {
      const regionError = {
        response: {
          status: 400,
          data: { error: { code: 100, message: 'Template analytics not available in your region' } },
        },
      };
      mockWhatsAppClient.getTemplatePerformanceMetrics.mockRejectedValue(regionError);

      await expect(insightsService.getTemplatePerformance(mockParams))
        .rejects.toThrow(InsightsServiceError);

      try {
        await insightsService.getTemplatePerformance(mockParams);
      } catch (error) {
        expect(error).toBeInstanceOf(InsightsServiceError);
        expect((error as InsightsServiceError).code).toBe('REGION_RESTRICTED');
      }
    });

    it('should return cached template data when available', async () => {
      const cachedData = {
        templates: [{ templateId: 'cached-1', sent: 10, delivered: 9, read: 8, deliveryRate: 90, readRate: 88.89 }],
      };
      vi.mocked(settingsCache.get).mockReturnValue(cachedData);

      const result = await insightsService.getTemplatePerformance(mockParams);

      expect(mockWhatsAppClient.getTemplatePerformanceMetrics).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });
  });

  describe('getInsightsOverview', () => {
    const mockParams = {
      wabaId: mockWabaId,
      startDate: mockStartDate,
      endDate: mockEndDate,
      granularity: 'DAILY' as const,
    };

    it('should combine message and conversation analytics', async () => {
      const messageResponse: MetaMessageAnalyticsResponse = {
        analytics: {
          phone_numbers: ['+1234567890'],
          country_codes: ['US'],
          granularity: 'DAILY',
          data_points: [{ start: mockStartDate, end: mockEndDate, sent: 100, delivered: 95 }],
        },
        id: mockWabaId,
      };

      const conversationResponse: MetaConversationAnalyticsResponse = {
        conversation_analytics: {
          data: [{
            data_points: [{
              start: mockStartDate,
              end: mockEndDate,
              conversation: 50,
              phone_number: '+1234567890',
              country: 'US',
              conversation_type: 'REGULAR',
              conversation_direction: 'BUSINESS_INITIATED',
              conversation_category: 'MARKETING',
              cost: 25.0,
            }],
          }],
        },
        id: mockWabaId,
      };

      mockWhatsAppClient.getAnalytics.mockResolvedValue(messageResponse);
      mockWhatsAppClient.getConversationAnalytics.mockResolvedValue(conversationResponse);

      const result = await insightsService.getInsightsOverview(mockParams);

      expect(result.messages.totalSent).toBe(100);
      expect(result.messages.totalDelivered).toBe(95);
      expect(result.messages.deliveryRate).toBe(95);
      expect(result.conversations.total).toBe(50);
      expect(result.conversations.estimatedCost).toBe(25);
      expect(result.period.start).toBe(mockStartDate);
      expect(result.period.end).toBe(mockEndDate);
    });

    it('should return cached overview when available', async () => {
      const cachedOverview = {
        messages: { totalSent: 200, totalDelivered: 190, deliveryRate: 95 },
        conversations: { total: 100, estimatedCost: 50, byCategory: { marketing: 40, utility: 30, authentication: 20, service: 10 } },
        period: { start: mockStartDate, end: mockEndDate, granularity: 'DAY' as const },
      };
      vi.mocked(settingsCache.get).mockReturnValue(cachedOverview);

      const result = await insightsService.getInsightsOverview(mockParams);

      expect(mockWhatsAppClient.getAnalytics).not.toHaveBeenCalled();
      expect(mockWhatsAppClient.getConversationAnalytics).not.toHaveBeenCalled();
      expect(result).toEqual(cachedOverview);
    });
  });

  describe('InsightsServiceError', () => {
    it('should create error with correct properties', () => {
      const error = new InsightsServiceError(
        'META_API_ERROR',
        'Test error message',
        { metaErrorCode: 100, metaErrorMessage: 'Meta error' }
      );

      expect(error.code).toBe('META_API_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.details?.metaErrorCode).toBe(100);
    });

    it('should serialize to JSON correctly', () => {
      const error = new InsightsServiceError(
        'RATE_LIMITED',
        'Rate limit exceeded',
        { retryAfter: 60 }
      );

      const json = error.toJSON();

      expect(json.code).toBe('RATE_LIMITED');
      expect(json.message).toBe('Rate limit exceeded');
      expect(json.details?.retryAfter).toBe(60);
    });

    it('should include cached data when provided', () => {
      const cachedData = { test: 'data' };
      const error = new InsightsServiceError(
        'RATE_LIMITED',
        'Rate limit exceeded',
        { retryAfter: 60 },
        cachedData
      );

      expect(error.cachedData).toEqual(cachedData);
    });
  });

  describe('Error handling', () => {
    it('should handle unauthorized errors', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: { error: { code: 190, message: 'Invalid access token' } },
        },
      };
      mockWhatsAppClient.getAnalytics.mockRejectedValue(unauthorizedError);

      try {
        await insightsService.getMessageAnalytics({
          wabaId: mockWabaId,
          startDate: mockStartDate,
          endDate: mockEndDate,
          granularity: 'DAY',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InsightsServiceError);
        expect((error as InsightsServiceError).code).toBe('UNAUTHORIZED');
      }
    });

    it('should handle network errors', async () => {
      mockWhatsAppClient.getAnalytics.mockRejectedValue(new Error('Network error'));

      try {
        await insightsService.getMessageAnalytics({
          wabaId: mockWabaId,
          startDate: mockStartDate,
          endDate: mockEndDate,
          granularity: 'DAY',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(InsightsServiceError);
        expect((error as InsightsServiceError).code).toBe('META_API_ERROR');
      }
    });
  });
});
