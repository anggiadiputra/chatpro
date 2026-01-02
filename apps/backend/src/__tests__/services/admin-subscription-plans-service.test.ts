import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    systemSetting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock audit log
vi.mock('../../utils/auditLog.js', () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock settings cache
vi.mock('../../services/settings-cache.js', () => ({
  settingsCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
  },
  CACHE_KEYS: {
    category: (category: string) => `settings:${category}`,
  },
}));

import { prisma } from '../../utils/database.js';
import { settingsCache } from '../../services/settings-cache.js';
import { auditLog } from '../../utils/auditLog.js';

describe('AdminSubscriptionPlansService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlans', () => {
    it('should return defaults when no config exists in database', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      vi.mocked(settingsCache.get).mockReturnValue(null);
      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([]);

      const result = await service.getPlans();

      expect(result.free.name).toBe('FREE');
      expect(result.free.price).toBe(0);
      expect(result.lite.name).toBe('LITE');
      expect(result.lite.price).toBe(10000);
      expect(result.pro.name).toBe('PRO');
      expect(result.pro.price).toBe(299000);
    });

    it('should return cached plans when available', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const cachedPlans = {
        free: { name: 'Cached FREE', description: 'Cached', price: 0, features: [] },
        lite: { name: 'Cached LITE', description: 'Cached', price: 15000, features: [] },
        pro: { name: 'Cached PRO', description: 'Cached', price: 350000, features: [] },
      };

      vi.mocked(settingsCache.get).mockReturnValue(cachedPlans);

      const result = await service.getPlans();

      expect(result).toEqual(cachedPlans);
      expect(prisma.systemSetting.findMany).not.toHaveBeenCalled();
    });

    it('should return plans from database when available', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      vi.mocked(settingsCache.get).mockReturnValue(null);
      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([
        {
          category: 'subscription_plans',
          key: 'lite',
          value: JSON.stringify({
            name: 'DB LITE',
            description: 'From DB',
            price: 20000,
            features: ['Feature 1'],
          }),
        },
      ] as any);

      const result = await service.getPlans();

      expect(result.lite.name).toBe('DB LITE');
      expect(result.lite.price).toBe(20000);
      // Other tiers should use defaults
      expect(result.free.name).toBe('FREE');
      expect(result.pro.name).toBe('PRO');
    });
  });

  describe('updatePlan', () => {
    it('should save plan config correctly', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

      const newConfig = {
        name: 'Updated LITE',
        description: 'Updated description',
        price: 25000,
        features: ['New Feature'],
      };

      const result = await service.updatePlan('lite', newConfig, 'admin-123', '192.168.1.1');

      expect(result.success).toBe(true);
      expect(prisma.systemSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category_key: { category: 'subscription_plans', key: 'lite' } },
        })
      );
      expect(auditLog).toHaveBeenCalled();
      expect(settingsCache.invalidate).toHaveBeenCalled();
    });

    it('should reject invalid tier', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const config = { name: 'Test', description: 'Test', price: 100, features: [] };

      await expect(
        service.updatePlan('invalid' as any, config, 'admin-123')
      ).rejects.toThrow('Invalid plan tier');
    });

    it('should reject empty plan name', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const config = { name: '', description: 'Test', price: 10000, features: [] };

      await expect(service.updatePlan('lite', config, 'admin-123')).rejects.toThrow(
        'Nama paket tidak boleh kosong'
      );
    });

    it('should reject negative price for paid plans', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const config = { name: 'LITE', description: 'Test', price: -100, features: [] };

      await expect(service.updatePlan('lite', config, 'admin-123')).rejects.toThrow(
        'Harga harus berupa angka positif'
      );
    });

    it('should reject zero price for paid plans', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const config = { name: 'PRO', description: 'Test', price: 0, features: [] };

      await expect(service.updatePlan('pro', config, 'admin-123')).rejects.toThrow(
        'Harga harus berupa angka positif'
      );
    });

    it('should reject non-zero price for FREE tier', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const config = { name: 'FREE', description: 'Test', price: 100, features: [] };

      await expect(service.updatePlan('free', config, 'admin-123')).rejects.toThrow(
        'Harga untuk paket FREE harus 0'
      );
    });

    it('should reject feature exceeding 100 characters', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const longFeature = 'a'.repeat(101);
      const config = { name: 'LITE', description: 'Test', price: 10000, features: [longFeature] };

      await expect(service.updatePlan('lite', config, 'admin-123')).rejects.toThrow(
        'Setiap fitur maksimal 100 karakter'
      );
    });
  });

  describe('getDefaultPlans', () => {
    it('should return default plan configurations', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const defaults = service.getDefaultPlans();

      expect(defaults.free).toBeDefined();
      expect(defaults.lite).toBeDefined();
      expect(defaults.pro).toBeDefined();
      expect(defaults.free.price).toBe(0);
    });
  });

  describe('calculateDurationPrice', () => {
    it('should calculate price for 1 month with no discount', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const result = service.calculateDurationPrice(99000, 1, 0);

      expect(result.totalPrice).toBe(99000);
      expect(result.effectiveMonthlyPrice).toBe(99000);
      expect(result.savings).toBe(0);
    });

    it('should calculate price for 3 months with 10% discount', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const result = service.calculateDurationPrice(99000, 3, 10);

      // Full price: 99000 * 3 = 297000
      // With 10% discount: 297000 * 0.9 = 267300
      expect(result.totalPrice).toBe(267300);
      expect(result.effectiveMonthlyPrice).toBe(89100);
      expect(result.savings).toBe(29700);
    });

    it('should calculate price for 6 months with 15% discount', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const result = service.calculateDurationPrice(99000, 6, 15);

      // Full price: 99000 * 6 = 594000
      // With 15% discount: 594000 * 0.85 = 504900
      expect(result.totalPrice).toBe(504900);
      expect(result.effectiveMonthlyPrice).toBe(84150);
      expect(result.savings).toBe(89100);
    });

    it('should calculate price for 12 months with 20% discount', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const result = service.calculateDurationPrice(99000, 12, 20);

      // Full price: 99000 * 12 = 1188000
      // With 20% discount: 1188000 * 0.8 = 950400
      expect(result.totalPrice).toBe(950400);
      expect(result.effectiveMonthlyPrice).toBe(79200);
      expect(result.savings).toBe(237600);
    });

    it('should calculate price for PRO tier with discount', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      const result = service.calculateDurationPrice(299000, 6, 15);

      // Full price: 299000 * 6 = 1794000
      // With 15% discount: 1794000 * 0.85 = 1524900
      expect(result.totalPrice).toBe(1524900);
      expect(result.effectiveMonthlyPrice).toBe(254150);
      expect(result.savings).toBe(269100);
    });

    it('should round prices to whole numbers', async () => {
      const { AdminSubscriptionPlansService } = await import(
        '../../services/admin/subscription-plans-service.js'
      );
      const service = new AdminSubscriptionPlansService();

      // Use a price that would result in decimals
      const result = service.calculateDurationPrice(100000, 3, 7);

      // Full price: 100000 * 3 = 300000
      // With 7% discount: 300000 * 0.93 = 279000
      expect(Number.isInteger(result.totalPrice)).toBe(true);
      expect(Number.isInteger(result.effectiveMonthlyPrice)).toBe(true);
      expect(Number.isInteger(result.savings)).toBe(true);
    });
  });
});
