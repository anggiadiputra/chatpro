import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
    },
    knowledgeDocument: {
      count: vi.fn(),
    },
    aIAgent: {
      count: vi.fn(),
    },
    apiKey: {
      count: vi.fn(),
    },
    webhookEndpoint: {
      count: vi.fn(),
    },
  },
}));

// Mock Redis cache
vi.mock('../../utils/cache.js', () => ({
  cacheRedis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
  getCache: vi.fn(),
  setCache: vi.fn(),
  deleteCache: vi.fn(),
  CACHE_TTL: {
    USER: 300,
    DASHBOARD_STATS: 60,
    SHORT: 30,
    MEDIUM: 300,
    LONG: 3600,
  },
  CACHE_KEYS: {
    user: (userId: string) => `user:${userId}`,
    dashboardStats: (userId: string) => `dashboard:stats:${userId}`,
    subscription: (userId: string) => `subscription:${userId}`,
  },
}));

// Import after mocks
import { 
  checkFeatureAccess, 
  checkUsageLimit, 
  requireFeature,
  getSubscription 
} from '../../middleware/subscription.js';
import { prisma } from '../../utils/database.js';
import { getCache, setCache } from '../../utils/cache.js';

describe('Subscription Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubscription', () => {
    it('should return cached subscription when available', async () => {
      const cachedData = {
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      };
      vi.mocked(getCache).mockResolvedValue(cachedData);

      const result = await getSubscription('user_123');

      expect(result).toEqual(cachedData);
      expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when not cached', async () => {
      vi.mocked(getCache).mockResolvedValue(null);
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        tier: SubscriptionTier.LITE,
        status: SubscriptionStatus.ACTIVE,
        endDate: new Date('2025-12-31'),
      } as any);

      const result = await getSubscription('user_123');

      expect(result.tier).toBe(SubscriptionTier.LITE);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(setCache).toHaveBeenCalled();
    });

    it('should default to FREE tier when no subscription exists', async () => {
      vi.mocked(getCache).mockResolvedValue(null);
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      const result = await getSubscription('user_123');

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('checkFeatureAccess', () => {
    it('should return true for PRO tier with apiAccess', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      });

      const result = await checkFeatureAccess('user_123', 'apiAccess');
      expect(result).toBe(true);
    });

    it('should return true for LITE tier with apiAccess', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.LITE,
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      });

      const result = await checkFeatureAccess('user_123', 'apiAccess');
      expect(result).toBe(true);
    });

    it('should return false for FREE tier with apiAccess', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      });

      const result = await checkFeatureAccess('user_123', 'apiAccess');
      expect(result).toBe(false);
    });

    it('should return false for FREE tier with webhooksEnabled', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      });

      const result = await checkFeatureAccess('user_123', 'webhooksEnabled');
      expect(result).toBe(false);
    });

    it('should treat EXPIRED subscription as FREE tier', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.EXPIRED,
        endDate: null,
      });

      const result = await checkFeatureAccess('user_123', 'apiAccess');
      expect(result).toBe(false);
    });

    it('should treat CANCELLED subscription as FREE tier', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.LITE,
        status: SubscriptionStatus.CANCELLED,
        endDate: null,
      });

      const result = await checkFeatureAccess('user_123', 'webhooksEnabled');
      expect(result).toBe(false);
    });

    it('should treat PENDING_PAYMENT subscription as FREE tier', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.PENDING_PAYMENT,
        endDate: null,
      });

      const result = await checkFeatureAccess('user_123', 'aiChatbot');
      expect(result).toBe(false);
    });
  });

  describe('checkUsageLimit', () => {
    describe('maxApiKeys', () => {
      it('should allow creation when under limit', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.LITE,
          status: SubscriptionStatus.ACTIVE,
          endDate: null,
        });
        vi.mocked(prisma.apiKey.count).mockResolvedValue(1);

        const result = await checkUsageLimit('user_123', 'maxApiKeys');

        expect(result.allowed).toBe(true);
        expect(result.current).toBe(1);
        expect(result.limit).toBe(2);
      });

      it('should deny creation when at limit', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.LITE,
          status: SubscriptionStatus.ACTIVE,
          endDate: null,
        });
        vi.mocked(prisma.apiKey.count).mockResolvedValue(2);

        const result = await checkUsageLimit('user_123', 'maxApiKeys');

        expect(result.allowed).toBe(false);
        expect(result.current).toBe(2);
        expect(result.limit).toBe(2);
      });

      it('should deny creation when over limit', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.LITE,
          status: SubscriptionStatus.ACTIVE,
          endDate: null,
        });
        vi.mocked(prisma.apiKey.count).mockResolvedValue(3);

        const result = await checkUsageLimit('user_123', 'maxApiKeys');

        expect(result.allowed).toBe(false);
        expect(result.current).toBe(3);
        expect(result.limit).toBe(2);
      });

      it('should use PRO tier limits for PRO users', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.PRO,
          status: SubscriptionStatus.ACTIVE,
          endDate: null,
        });
        vi.mocked(prisma.apiKey.count).mockResolvedValue(5);

        const result = await checkUsageLimit('user_123', 'maxApiKeys');

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(10);
      });
    });

    describe('maxWebhookEndpoints', () => {
      it('should allow creation when under limit', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.LITE,
          status: SubscriptionStatus.ACTIVE,
          endDate: null,
        });
        vi.mocked(prisma.webhookEndpoint.count).mockResolvedValue(2);

        const result = await checkUsageLimit('user_123', 'maxWebhookEndpoints');

        expect(result.allowed).toBe(true);
        expect(result.current).toBe(2);
        expect(result.limit).toBe(3);
      });

      it('should deny creation when at limit', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.LITE,
          status: SubscriptionStatus.ACTIVE,
          endDate: null,
        });
        vi.mocked(prisma.webhookEndpoint.count).mockResolvedValue(3);

        const result = await checkUsageLimit('user_123', 'maxWebhookEndpoints');

        expect(result.allowed).toBe(false);
        expect(result.current).toBe(3);
        expect(result.limit).toBe(3);
      });

      it('should use PRO tier limits for PRO users', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.PRO,
          status: SubscriptionStatus.ACTIVE,
          endDate: null,
        });
        vi.mocked(prisma.webhookEndpoint.count).mockResolvedValue(15);

        const result = await checkUsageLimit('user_123', 'maxWebhookEndpoints');

        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(20);
      });
    });

    describe('inactive subscription handling', () => {
      it('should use FREE tier limits for EXPIRED subscription', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.PRO,
          status: SubscriptionStatus.EXPIRED,
          endDate: null,
        });
        vi.mocked(prisma.apiKey.count).mockResolvedValue(0);

        const result = await checkUsageLimit('user_123', 'maxApiKeys');

        expect(result.limit).toBe(0);
        expect(result.allowed).toBe(false);
      });

      it('should use FREE tier limits for CANCELLED subscription', async () => {
        vi.mocked(getCache).mockResolvedValue({
          tier: SubscriptionTier.LITE,
          status: SubscriptionStatus.CANCELLED,
          endDate: null,
        });
        vi.mocked(prisma.webhookEndpoint.count).mockResolvedValue(0);

        const result = await checkUsageLimit('user_123', 'maxWebhookEndpoints');

        expect(result.limit).toBe(0);
        expect(result.allowed).toBe(false);
      });
    });
  });

  describe('requireFeature middleware', () => {
    const createMockContext = (user: any = null) => {
      const jsonMock = vi.fn().mockImplementation((data, status) => ({ data, status }));
      return {
        user,
        json: jsonMock,
      } as any;
    };

    it('should return 401 when user is not authenticated', async () => {
      const ctx = createMockContext(null);
      const next = vi.fn();

      const middleware = requireFeature('apiAccess');
      const result = await middleware(ctx, next);

      expect(ctx.json).toHaveBeenCalledWith(
        { error: { code: 'Unauthorized', message: 'Authentication required' } },
        401
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next when user has feature access', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.PRO,
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      });

      const ctx = createMockContext({ id: 'user_123' });
      const next = vi.fn();

      const middleware = requireFeature('apiAccess');
      await middleware(ctx, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 with SubscriptionRequired when user lacks access', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      });

      const ctx = createMockContext({ id: 'user_123' });
      const next = vi.fn();

      const middleware = requireFeature('apiAccess');
      await middleware(ctx, next);

      expect(ctx.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'SubscriptionRequired',
            currentTier: SubscriptionTier.FREE,
            requiredTier: SubscriptionTier.LITE,
          }),
        }),
        403
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should include upgrade URL in error response', async () => {
      vi.mocked(getCache).mockResolvedValue({
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      });

      const ctx = createMockContext({ id: 'user_123' });
      const next = vi.fn();

      const middleware = requireFeature('webhooksEnabled');
      await middleware(ctx, next);

      expect(ctx.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            upgradeUrl: '/settings/billing',
          }),
        }),
        403
      );
    });
  });
});
