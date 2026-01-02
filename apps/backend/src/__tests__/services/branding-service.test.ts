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
    category: (category: string) => `settings:${category}`,
  },
  CACHE_TTL: {
    settings: 60000,
  },
}));

// Mock branding route cache invalidation
vi.mock('../../routes/branding.js', () => ({
  invalidateBrandingCache: vi.fn(),
}));

// Set encryption key before importing
process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');

import { prisma } from '../../utils/database.js';
import { settingsCache } from '../../services/settings-cache.js';
import { invalidateBrandingCache } from '../../routes/branding.js';
import { DEFAULT_BRANDING } from '../../types/admin-settings.js';

describe('Branding Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getBrandingSettings', () => {
    it('should return default branding when no settings in database', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([]);

      const result = await service.getBrandingSettings();

      expect(result).toEqual(DEFAULT_BRANDING);
    });

    it('should return branding from database with defaults for missing values', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([
        { key: 'website_name', value: 'My Company', isSensitive: false },
        { key: 'logo_url', value: 'https://example.com/logo.png', isSensitive: false },
      ] as any);

      const result = await service.getBrandingSettings();

      expect(result.websiteName).toBe('My Company');
      expect(result.logoUrl).toBe('https://example.com/logo.png');
      // Defaults for missing values
      expect(result.supportEmail).toBe(DEFAULT_BRANDING.supportEmail);
      expect(result.supportWhatsapp).toBe(DEFAULT_BRANDING.supportWhatsapp);
    });

    it('should return defaults on database error', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.findMany).mockRejectedValue(new Error('DB Error'));

      const result = await service.getBrandingSettings();

      expect(result).toEqual(DEFAULT_BRANDING);
    });
  });

  describe('updateSettings for branding', () => {
    it('should update branding settings and invalidate cache', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

      const result = await service.updateSettings(
        'branding',
        { websiteName: 'New Company', supportEmail: 'support@newcompany.com' },
        'admin-123',
        '192.168.1.1'
      );

      expect(result.success).toBe(true);
      expect(prisma.systemSetting.upsert).toHaveBeenCalled();
      expect(settingsCache.invalidate).toHaveBeenCalledWith('settings:branding');
      expect(invalidateBrandingCache).toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      await expect(
        service.updateSettings(
          'branding',
          { supportEmail: 'invalid-email' },
          'admin-123'
        )
      ).rejects.toThrow('Invalid email format');
    });

    it('should validate phone number format', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      await expect(
        service.updateSettings(
          'branding',
          { supportWhatsapp: 'abc' },
          'admin-123'
        )
      ).rejects.toThrow('Invalid phone number format');
    });

    it('should validate logo URL format', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      await expect(
        service.updateSettings(
          'branding',
          { logoUrl: 'not-a-valid-url' },
          'admin-123'
        )
      ).rejects.toThrow('Invalid URL format');
    });

    it('should accept valid branding settings', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

      const result = await service.updateSettings(
        'branding',
        {
          websiteName: 'Valid Company',
          logoUrl: 'https://example.com/logo.png',
          supportEmail: 'support@example.com',
          supportWhatsapp: '+6281234567890',
        },
        'admin-123'
      );

      expect(result.success).toBe(true);
    });

    it('should allow empty values for optional fields', async () => {
      const { AdminSettingsService } = await import('../../services/admin/settings-service.js');
      const service = new AdminSettingsService();

      vi.mocked(prisma.systemSetting.upsert).mockResolvedValue({} as any);

      const result = await service.updateSettings(
        'branding',
        {
          websiteName: 'Company',
          logoUrl: '',
          supportEmail: '',
          supportWhatsapp: '',
        },
        'admin-123'
      );

      expect(result.success).toBe(true);
    });
  });

  describe('branding category validation', () => {
    it('should recognize branding as valid category', async () => {
      const { isValidCategory } = await import('../../types/admin-settings.js');
      expect(isValidCategory('branding')).toBe(true);
    });

    it('should have correct branding settings keys', async () => {
      const { BRANDING_SETTINGS_KEYS } = await import('../../types/admin-settings.js');
      
      const keys = BRANDING_SETTINGS_KEYS.map(k => k.key);
      expect(keys).toContain('website_name');
      expect(keys).toContain('logo_url');
      expect(keys).toContain('support_email');
      expect(keys).toContain('support_whatsapp');
    });

    it('should have no sensitive branding fields', async () => {
      const { BRANDING_SETTINGS_KEYS } = await import('../../types/admin-settings.js');
      
      const sensitiveKeys = BRANDING_SETTINGS_KEYS.filter(k => k.sensitive);
      expect(sensitiveKeys).toHaveLength(0);
    });
  });
});
