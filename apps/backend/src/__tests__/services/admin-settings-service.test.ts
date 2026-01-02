import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    systemSetting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
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
    smtp: () => 'settings:smtp',
    whatsapp: () => 'settings:whatsapp',
    instagram: () => 'settings:instagram',
    googleOauth: () => 'settings:google_oauth',
    openai: () => 'settings:openai',
    category: (category: string) => `settings:${category}`,
  },
  CACHE_TTL: {
    settings: 60000,
  },
}));

// Set encryption key before importing
process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');

import { prisma } from '../../utils/database.js';
import { settingsCache } from '../../services/settings-cache.js';

describe('AdminSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up env variables for fallback
    process.env.SMTP_HOST = 'env-smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'env-user';
    process.env.SMTP_PASSWORD = 'env-password';
    process.env.SMTP_FROM_EMAIL = 'env@test.com';
    process.env.SMTP_FROM_NAME = 'Env Test';
    process.env.SMTP_SECURE = 'false';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return settings from database when available', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([
        { key: 'host', value: 'db-smtp.test.com', isSensitive: false },
        { key: 'port', value: '465', isSensitive: false },
        { key: 'user', value: 'db-user', isSensitive: false },
        { key: 'from_email', value: 'db@test.com', isSensitive: false },
        { key: 'from_name', value: 'DB Test', isSensitive: false },
        { key: 'secure', value: 'true', isSensitive: false },
      ] as any);

      const result = await service.getSettings('smtp');

      expect(result.source).toBe('database');
      expect(result.data.host).toBe('db-smtp.test.com');
      expect(result.data.port).toBe(465);
      expect(result.data.fromEmail).toBe('db@test.com');
      expect(result.data.secure).toBe(true);
    });

    it('should fallback to env when database is empty', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([]);

      const result = await service.getSettings('smtp');

      expect(result.source).toBe('env');
      // Host is not sensitive, so it won't be masked
      expect(result.data.host).toBe('env-smtp.test.com');
    });

    it('should fallback to env on database error', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.findMany).mockRejectedValue(new Error('DB Error'));

      const result = await service.getSettings('smtp');

      expect(result.source).toBe('env');
    });

    it('should mask sensitive values when maskSensitive is true', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      // Create encrypted password
      const { EncryptionService } = await import('../../services/encryption-service.js');
      const encService = new EncryptionService();
      const encryptedPassword = encService.encryptToString('my-secret-password');

      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([
        { key: 'host', value: 'smtp.test.com', isSensitive: false },
        { key: 'password', value: encryptedPassword, isSensitive: true },
      ] as any);

      const result = await service.getSettings('smtp', true);

      expect(result.data.host).toBe('smtp.test.com');
      expect(result.data.password).toContain('****');
    });

    it('should return decrypted values when maskSensitive is false', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      const { EncryptionService } = await import('../../services/encryption-service.js');
      const encService = new EncryptionService();
      const encryptedPassword = encService.encryptToString('my-secret-password');

      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([
        { key: 'host', value: 'smtp.test.com', isSensitive: false },
        { key: 'password', value: encryptedPassword, isSensitive: true },
      ] as any);

      const result = await service.getSettings('smtp', false);

      expect(result.data.password).toBe('my-secret-password');
    });

    it('should throw error for invalid category', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      await expect(service.getSettings('invalid' as any)).rejects.toThrow('Invalid settings category');
    });
  });

  describe('updateSettings', () => {
    it('should update settings and encrypt sensitive values', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

      const result = await service.updateSettings(
        'smtp',
        { host: 'new-smtp.test.com', password: 'new-password' },
        'admin-123',
        '192.168.1.1'
      );

      expect(result.success).toBe(true);
      expect(prisma.systemSetting.upsert).toHaveBeenCalled();
      expect(settingsCache.invalidate).toHaveBeenCalled();
    });

    it('should skip masked values (unchanged)', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

      await service.updateSettings(
        'smtp',
        { host: 'new-smtp.test.com', password: 'my****rd' }, // Masked password
        'admin-123'
      );

      // Should only update host, not password
      const upsertCalls = vi.mocked(prisma.systemSetting.upsert).mock.calls;
      const updatedKeys = upsertCalls.map(call => call[0].where.category_key.key);

      expect(updatedKeys).toContain('host');
      expect(updatedKeys).not.toContain('password');
    });

    it('should invalidate cache after update', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

      await service.updateSettings('smtp', { host: 'test.com' }, 'admin-123');

      expect(settingsCache.invalidate).toHaveBeenCalledWith('settings:smtp');
    });
  });

  describe('getRawValue', () => {
    it('should return decrypted value from database', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      const { EncryptionService } = await import('../../services/encryption-service.js');
      const encService = new EncryptionService();
      const encryptedValue = encService.encryptToString('secret-value');

      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        value: encryptedValue,
        isSensitive: true,
      } as any);

      const result = await service.getRawValue('smtp', 'password');

      expect(result).toBe('secret-value');
    });

    it('should return plain value for non-sensitive settings', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
        value: 'smtp.test.com',
        isSensitive: false,
      } as any);

      const result = await service.getRawValue('smtp', 'host');

      expect(result).toBe('smtp.test.com');
    });

    it('should fallback to env when not in database', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);

      const result = await service.getRawValue('smtp', 'host');

      expect(result).toBe('env-smtp.test.com');
    });
  });

  describe('hasDbSettings', () => {
    it('should return true when settings exist in database', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.count).mockResolvedValue(5);

      const result = await service.hasDbSettings('smtp');

      expect(result).toBe(true);
    });

    it('should return false when no settings in database', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.count).mockResolvedValue(0);

      const result = await service.hasDbSettings('smtp');

      expect(result).toBe(false);
    });
  });
});

describe('Type utilities', () => {
  it('should validate categories correctly', async () => {
    const { isValidCategory } = await import('../../types/admin-settings.js');

    expect(isValidCategory('smtp')).toBe(true);
    expect(isValidCategory('whatsapp')).toBe(true);
    expect(isValidCategory('instagram')).toBe(true);
    expect(isValidCategory('google_oauth')).toBe(true);
    expect(isValidCategory('openai')).toBe(true);
    expect(isValidCategory('invalid')).toBe(false);
  });

  it('should convert db keys to camelCase', async () => {
    const { dbKeyToCamelCase } = await import('../../types/admin-settings.js');

    expect(dbKeyToCamelCase('from_email')).toBe('fromEmail');
    expect(dbKeyToCamelCase('app_secret')).toBe('appSecret');
    expect(dbKeyToCamelCase('host')).toBe('host');
  });

  it('should convert camelCase to db keys', async () => {
    const { camelCaseToDbKey } = await import('../../types/admin-settings.js');

    expect(camelCaseToDbKey('fromEmail')).toBe('from_email');
    expect(camelCaseToDbKey('appSecret')).toBe('app_secret');
    expect(camelCaseToDbKey('host')).toBe('host');
  });
});
