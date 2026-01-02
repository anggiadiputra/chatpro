import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createHash } from 'crypto';

// Mock Prisma - must use factory function
vi.mock('../../utils/database.js', () => ({
  prisma: {
    apiKey: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock Redis cache - must use factory function
vi.mock('../../utils/cache.js', () => ({
  cacheRedis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
  CACHE_TTL: {
    USER: 300,
    DASHBOARD_STATS: 60,
    SHORT: 30,
    MEDIUM: 300,
    LONG: 3600,
  },
}));

// Import after mocks
import { ApiKeyService, apiKeyService } from '../../services/api-key-service.js';
import { prisma } from '../../utils/database.js';
import { cacheRedis } from '../../utils/cache.js';

describe('ApiKeyService', () => {
  let service: ApiKeyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ApiKeyService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createApiKey', () => {
    it('should generate a secure API key with correct format', async () => {
      vi.mocked(prisma.apiKey.count).mockResolvedValue(0);
      vi.mocked(prisma.apiKey.create).mockImplementation(async ({ data }: any) => ({
        id: 'key_123',
        ...data,
        createdAt: new Date(),
        lastUsedAt: null,
      }));

      const result = await service.createApiKey({
        userId: 'user_123',
        name: 'Test API Key',
      });

      expect(result.key).toBeDefined();
      expect(result.key).toMatch(/^kc_live_/);
      expect(result.key!.length).toBeGreaterThan(40); // Prefix + base64url encoded 32 bytes
      expect(result.name).toBe('Test API Key');
      expect(result.keyPrefix).toBe(result.key!.substring(0, 16));
    });

    it('should store only the hash of the API key', async () => {
      vi.mocked(prisma.apiKey.count).mockResolvedValue(0);
      
      let storedKeyHash: string | undefined;
      vi.mocked(prisma.apiKey.create).mockImplementation(async ({ data }: any) => {
        storedKeyHash = data.keyHash;
        return {
          id: 'key_123',
          ...data,
          createdAt: new Date(),
          lastUsedAt: null,
        };
      });

      const result = await service.createApiKey({
        userId: 'user_123',
        name: 'Test API Key',
      });

      // Verify the stored hash matches SHA-256 of the key
      const expectedHash = createHash('sha256').update(result.key!).digest('hex');
      expect(storedKeyHash).toBe(expectedHash);
    });

    it('should set expiration to 365 days by default', async () => {
      vi.mocked(prisma.apiKey.count).mockResolvedValue(0);
      
      let storedExpiresAt: Date | undefined;
      vi.mocked(prisma.apiKey.create).mockImplementation(async ({ data }: any) => {
        storedExpiresAt = data.expiresAt;
        return {
          id: 'key_123',
          ...data,
          createdAt: new Date(),
          lastUsedAt: null,
        };
      });

      const beforeCreate = new Date();
      await service.createApiKey({
        userId: 'user_123',
        name: 'Test API Key',
      });
      const afterCreate = new Date();

      // Expiration should be ~365 days from now
      const expectedMinExpiry = new Date(beforeCreate);
      expectedMinExpiry.setDate(expectedMinExpiry.getDate() + 365);
      
      const expectedMaxExpiry = new Date(afterCreate);
      expectedMaxExpiry.setDate(expectedMaxExpiry.getDate() + 365);

      expect(storedExpiresAt!.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry.getTime() - 1000);
      expect(storedExpiresAt!.getTime()).toBeLessThanOrEqual(expectedMaxExpiry.getTime() + 1000);
    });

    it('should allow custom expiration days', async () => {
      vi.mocked(prisma.apiKey.count).mockResolvedValue(0);
      
      let storedExpiresAt: Date | undefined;
      vi.mocked(prisma.apiKey.create).mockImplementation(async ({ data }: any) => {
        storedExpiresAt = data.expiresAt;
        return {
          id: 'key_123',
          ...data,
          createdAt: new Date(),
          lastUsedAt: null,
        };
      });

      const beforeCreate = new Date();
      await service.createApiKey({
        userId: 'user_123',
        name: 'Test API Key',
        expiresInDays: 30,
      });

      // Expiration should be ~30 days from now
      const expectedExpiry = new Date(beforeCreate);
      expectedExpiry.setDate(expectedExpiry.getDate() + 30);

      const diffMs = Math.abs(storedExpiresAt!.getTime() - expectedExpiry.getTime());
      expect(diffMs).toBeLessThan(2000); // Within 2 seconds
    });

    it('should reject when user has reached maximum API key limit', async () => {
      vi.mocked(prisma.apiKey.count).mockResolvedValue(5); // Max limit

      await expect(
        service.createApiKey({
          userId: 'user_123',
          name: 'Test API Key',
        })
      ).rejects.toThrow('Maximum limit of 5 active API keys reached');
    });

    it('should generate unique keys for each call', async () => {
      vi.mocked(prisma.apiKey.count).mockResolvedValue(0);
      vi.mocked(prisma.apiKey.create).mockImplementation(async ({ data }: any) => ({
        id: `key_${Date.now()}`,
        ...data,
        createdAt: new Date(),
        lastUsedAt: null,
      }));

      const result1 = await service.createApiKey({
        userId: 'user_123',
        name: 'Key 1',
      });

      const result2 = await service.createApiKey({
        userId: 'user_123',
        name: 'Key 2',
      });

      expect(result1.key).not.toBe(result2.key);
    });
  });

  describe('validateApiKey', () => {
    it('should validate a correct API key', async () => {
      const testKey = 'kc_live_test1234567890abcdefghijklmnop';

      vi.mocked(cacheRedis.get).mockResolvedValue(null);
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'key_123',
        userId: 'user_123',
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        revokedAt: null,
      } as any);

      const result = await service.validateApiKey(testKey);

      expect(result).toEqual({
        userId: 'user_123',
        apiKeyId: 'key_123',
      });
    });

    it('should return cached result when available', async () => {
      const testKey = 'kc_live_test1234567890abcdefghijklmnop';
      const cachedResult = { userId: 'user_123', apiKeyId: 'key_123' };

      vi.mocked(cacheRedis.get).mockResolvedValue(JSON.stringify(cachedResult));

      const result = await service.validateApiKey(testKey);

      expect(result).toEqual(cachedResult);
      expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
    });

    it('should cache validated keys', async () => {
      const testKey = 'kc_live_test1234567890abcdefghijklmnop';
      const keyHash = createHash('sha256').update(testKey).digest('hex');

      vi.mocked(cacheRedis.get).mockResolvedValue(null);
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'key_123',
        userId: 'user_123',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
      } as any);

      await service.validateApiKey(testKey);

      expect(cacheRedis.setex).toHaveBeenCalledWith(
        `apikey:${keyHash}`,
        300, // 5 min TTL
        expect.any(String)
      );
    });

    it('should reject keys without correct prefix', async () => {
      const result = await service.validateApiKey('invalid_prefix_key');
      expect(result).toBeNull();
    });

    it('should reject empty keys', async () => {
      const result = await service.validateApiKey('');
      expect(result).toBeNull();
    });

    it('should reject revoked keys', async () => {
      const testKey = 'kc_live_test1234567890abcdefghijklmnop';

      vi.mocked(cacheRedis.get).mockResolvedValue(null);
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'key_123',
        userId: 'user_123',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(), // Revoked
      } as any);

      const result = await service.validateApiKey(testKey);
      expect(result).toBeNull();
    });

    it('should reject expired keys', async () => {
      const testKey = 'kc_live_test1234567890abcdefghijklmnop';

      vi.mocked(cacheRedis.get).mockResolvedValue(null);
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
        id: 'key_123',
        userId: 'user_123',
        expiresAt: new Date(Date.now() - 86400000), // Yesterday (expired)
        revokedAt: null,
      } as any);

      const result = await service.validateApiKey(testKey);
      expect(result).toBeNull();
    });

    it('should reject non-existent keys', async () => {
      const testKey = 'kc_live_nonexistent1234567890abcdef';

      vi.mocked(cacheRedis.get).mockResolvedValue(null);
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null);

      const result = await service.validateApiKey(testKey);
      expect(result).toBeNull();
    });
  });

  describe('listApiKeys', () => {
    it('should return API keys without full key values', async () => {
      const mockKeys = [
        {
          id: 'key_1',
          name: 'Production Key',
          keyPrefix: 'kc_live_abc123',
          expiresAt: new Date('2026-01-01'),
          createdAt: new Date('2025-01-01'),
          lastUsedAt: new Date('2025-06-01'),
        },
        {
          id: 'key_2',
          name: 'Development Key',
          keyPrefix: 'kc_live_def456',
          expiresAt: new Date('2026-06-01'),
          createdAt: new Date('2025-06-01'),
          lastUsedAt: null,
        },
      ];

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mockKeys as any);

      const result = await service.listApiKeys('user_123');

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('key');
      expect(result[0]).not.toHaveProperty('keyHash');
      expect(result[0].name).toBe('Production Key');
      expect(result[0].keyPrefix).toBe('kc_live_abc123');
    });

    it('should only return non-revoked keys', async () => {
      vi.mocked(prisma.apiKey.findMany).mockResolvedValue([]);

      await service.listApiKeys('user_123');

      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user_123',
            revokedAt: null,
          },
        })
      );
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key and clear cache', async () => {
      const keyHash = 'test_hash_123';
      vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({
        id: 'key_123',
        keyHash,
      } as any);
      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

      await service.revokeApiKey('user_123', 'key_123');

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key_123' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(cacheRedis.del).toHaveBeenCalledWith(`apikey:${keyHash}`);
    });

    it('should throw error when key not found', async () => {
      vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null);

      await expect(
        service.revokeApiKey('user_123', 'nonexistent_key')
      ).rejects.toThrow('API key not found or already revoked');
    });

    it('should verify ownership before revoking', async () => {
      vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null);

      await expect(
        service.revokeApiKey('wrong_user', 'key_123')
      ).rejects.toThrow('API key not found or already revoked');

      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'key_123',
          userId: 'wrong_user',
          revokedAt: null,
        },
        select: {
          id: true,
          keyHash: true,
        },
      });
    });
  });

  describe('updateLastUsed', () => {
    it('should update last used timestamp', async () => {
      vi.mocked(prisma.apiKey.update).mockResolvedValue({} as any);

      await service.updateLastUsed('key_123');

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key_123' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should not throw on error (non-critical operation)', async () => {
      vi.mocked(prisma.apiKey.update).mockRejectedValue(new Error('DB error'));

      // Should not throw
      await expect(service.updateLastUsed('key_123')).resolves.toBeUndefined();
    });
  });

  describe('getExpiringKeys', () => {
    it('should return keys expiring within specified days', async () => {
      const mockExpiringKeys = [
        {
          id: 'key_1',
          name: 'Expiring Key',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          userId: 'user_123',
          user: {
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      ];

      vi.mocked(prisma.apiKey.findMany).mockResolvedValue(mockExpiringKeys as any);

      const result = await service.getExpiringKeys(30);

      expect(result).toHaveLength(1);
      expect(result[0].userEmail).toBe('test@example.com');
      expect(result[0].userName).toBe('Test User');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(apiKeyService).toBeInstanceOf(ApiKeyService);
    });
  });
});
