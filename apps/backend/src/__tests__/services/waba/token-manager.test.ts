import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma - define mocks inside factory
vi.mock('@prisma/client', () => {
  const mockPrismaUser = {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  };
  const mockPrismaWABAConnectionLog = {
    create: vi.fn(),
  };
  return {
    PrismaClient: vi.fn(() => ({
      user: mockPrismaUser,
      wABAConnectionLog: mockPrismaWABAConnectionLog,
    })),
    __mockPrismaUser: mockPrismaUser,
    __mockPrismaWABAConnectionLog: mockPrismaWABAConnectionLog,
  };
});

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((error: any) => error?.isAxiosError === true),
    },
    isAxiosError: vi.fn((error: any) => error?.isAxiosError === true),
    __mockAxiosInstance: mockAxiosInstance,
  };
});

// Mock settings cache
vi.mock('../../../services/settings-cache.js', () => ({
  settingsCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
  },
  CACHE_KEYS: {
    whatsapp: vi.fn(() => 'whatsapp'),
  },
  CACHE_TTL: {
    settings: 300,
  },
}));

// Mock admin settings service
vi.mock('../../../services/admin/settings-service.js', () => ({
  adminSettingsService: {
    getSettings: vi.fn().mockResolvedValue({
      data: {},
      source: 'env',
    }),
  },
}));

// Mock request queue
vi.mock('../../../utils/requestQueue.js', () => ({
  metaApiQueue: {
    enqueue: vi.fn((fn) => fn()),
  },
  criticalQueue: {
    enqueue: vi.fn((fn) => fn()),
  },
}));

// Mock email service
vi.mock('../../../services/email/index.js', () => ({
  emailService: {
    sendWABADisconnected: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock wabaErrors
vi.mock('../../../utils/wabaErrors.js', () => ({
  parseMetaError: vi.fn((error) => error),
  getRetryDelay: vi.fn((attempt, base) => base * Math.pow(2, attempt)),
}));

import axios from 'axios';
import * as prismaModule from '@prisma/client';
import { WABATokenManager } from '../../../services/waba/token-manager';
import { WABASettings } from '../../../services/waba/settings';
import { WABAServiceError } from '../../../services/waba/errors';

describe('WABATokenManager', () => {
  let tokenManager: WABATokenManager;
  let settings: WABASettings;
  let mockAxiosInstance: any;
  let mockPrismaUser: any;
  let mockPrismaWABAConnectionLog: any;

  beforeEach(() => {
    vi.clearAllMocks();
    settings = new WABASettings();
    tokenManager = new WABATokenManager(settings);
    
    // Get mock instances
    mockAxiosInstance = (axios as any).__mockAxiosInstance;
    mockPrismaUser = (prismaModule as any).__mockPrismaUser;
    mockPrismaWABAConnectionLog = (prismaModule as any).__mockPrismaWABAConnectionLog;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('refreshAccessToken', () => {
    it('should throw error when user not found', async () => {
      const wabaId = 'nonexistent_waba';
      mockPrismaUser.findFirst.mockResolvedValueOnce(null);

      await expect(tokenManager.refreshAccessToken(wabaId)).rejects.toThrow(WABAServiceError);
    });

    it('should throw error when no token found', async () => {
      const wabaId = 'waba_123456789';
      mockPrismaUser.findFirst.mockResolvedValueOnce({
        id: 'user_123',
        wabaId,
        wabaAccessToken: null,
        wabaAccessTokenIV: null,
        wabaAccessTokenTag: null,
      });

      await expect(tokenManager.refreshAccessToken(wabaId)).rejects.toThrow('No access token found');
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return true when token expires within 7 days', async () => {
      const userId = 'user_123';
      const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

      mockPrismaUser.findUnique.mockResolvedValueOnce({
        wabaTokenExpiresAt: expiresAt,
      });

      const result = await tokenManager.isTokenExpiringSoon(userId);
      expect(result).toBe(true);
    });

    it('should return false when token expires after 7 days', async () => {
      const userId = 'user_123';
      const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now

      mockPrismaUser.findUnique.mockResolvedValueOnce({
        wabaTokenExpiresAt: expiresAt,
      });

      const result = await tokenManager.isTokenExpiringSoon(userId);
      expect(result).toBe(false);
    });

    it('should return false when no expiration date', async () => {
      const userId = 'user_123';
      mockPrismaUser.findUnique.mockResolvedValueOnce({
        wabaTokenExpiresAt: null,
      });

      const result = await tokenManager.isTokenExpiringSoon(userId);
      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      const userId = 'nonexistent_user';
      mockPrismaUser.findUnique.mockResolvedValueOnce(null);

      const result = await tokenManager.isTokenExpiringSoon(userId);
      expect(result).toBe(false);
    });
  });

  describe('getAccountsWithExpiringTokens', () => {
    it('should return WABA IDs with expiring tokens', async () => {
      mockPrismaUser.findMany.mockResolvedValueOnce([
        { wabaId: 'waba_1' },
        { wabaId: 'waba_2' },
        { wabaId: 'waba_3' },
      ]);

      const result = await tokenManager.getAccountsWithExpiringTokens();

      expect(result).toEqual(['waba_1', 'waba_2', 'waba_3']);
      expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            wabaConnectionStatus: 'connected',
          }),
        })
      );
    });

    it('should filter out null WABA IDs', async () => {
      mockPrismaUser.findMany.mockResolvedValueOnce([
        { wabaId: 'waba_1' },
        { wabaId: null },
        { wabaId: 'waba_3' },
      ]);

      const result = await tokenManager.getAccountsWithExpiringTokens();

      expect(result).toEqual(['waba_1', 'waba_3']);
    });

    it('should return empty array when no expiring tokens', async () => {
      mockPrismaUser.findMany.mockResolvedValueOnce([]);

      const result = await tokenManager.getAccountsWithExpiringTokens();

      expect(result).toEqual([]);
    });
  });

  describe('encryptToken/decryptToken', () => {
    it('should encrypt and decrypt token correctly', () => {
      const originalToken = 'test_access_token_12345';

      const encrypted = tokenManager.encryptToken(originalToken);
      
      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('algorithm', 'aes-256-gcm');

      const decrypted = tokenManager.decryptToken(encrypted);
      expect(decrypted).toBe(originalToken);
    });

    it('should produce different ciphertext for same token', () => {
      const token = 'test_access_token';

      const encrypted1 = tokenManager.encryptToken(token);
      const encrypted2 = tokenManager.encryptToken(token);

      // Different IVs should produce different ciphertexts
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });
});
