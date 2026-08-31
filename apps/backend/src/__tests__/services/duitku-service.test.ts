import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock admin settings service
vi.mock('../../services/admin/settings-service.js', () => ({
  adminSettingsService: {
    getDecryptedSettings: vi.fn(),
  },
}));

// Mock axios
vi.mock('axios');

import { DuitkuService } from '../../services/duitku-service.js';
import { adminSettingsService } from '../../services/admin/settings-service.js';

describe('DuitkuService', () => {
  let mockConfig: {
    merchantCode: string;
    apiKey: string;
    environment: string;
    enabled: boolean;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = {
      merchantCode: 'TEST123',
      apiKey: 'test-api-key-12345',
      environment: 'sandbox',
      enabled: true,
    };
    vi.mocked(adminSettingsService.getDecryptedSettings).mockResolvedValue(
      mockConfig as never
    );
  });

  describe('getBaseUrl', () => {
    it('should return sandbox URL for sandbox environment', () => {
      const service = new DuitkuService();
      expect(service.getBaseUrl('sandbox')).toBe('https://sandbox.duitku.com/webapi/api/merchant');
    });

    it('should return production URL for production environment', () => {
      const service = new DuitkuService();
      expect(service.getBaseUrl('production')).toBe('https://passport.duitku.com/webapi/api/merchant');
    });
  });

  describe('generateSignature', () => {
    it('should generate valid MD5 signature for legacy API', () => {
      const service = new DuitkuService();

      const merchantCode = 'TEST123';
      const orderId = 'ORDER123';
      const amount = 100000;
      const apiKey = 'test-api-key';

      const signature = service.generateSignature(merchantCode, orderId, amount, apiKey);

      // MD5(merchantCode + merchantOrderId + amount + apiKey)
      const stringToSign = `${merchantCode}${orderId}${amount}${apiKey}`;
      const expected = crypto.createHash('md5').update(stringToSign).digest('hex');

      expect(signature).toBe(expected);
      expect(signature).toHaveLength(32);
    });

    it('should generate different signatures for different inputs', () => {
      const service = new DuitkuService();

      const sig1 = service.generateSignature('TEST123', 'ORDER123', 100000, 'key');
      const sig2 = service.generateSignature('TEST123', 'ORDER456', 100000, 'key');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('validateCallbackSignature', () => {
    it('should validate legacy MD5 callback signature correctly', async () => {
      const service = new DuitkuService();
      await service.getConfig();

      // Legacy callback format: MD5(merchantCode + amount + merchantOrderId + apiKey)
      const stringToSign = `${mockConfig.merchantCode}100000ORDER123${mockConfig.apiKey}`;
      const signature = crypto.createHash('md5').update(stringToSign).digest('hex');

      const payload = {
        merchantCode: mockConfig.merchantCode,
        merchantOrderId: 'ORDER123',
        amount: '100000',
        signature,
      };

      const isValid = service.validateCallbackSignature(payload as never);

      expect(isValid).toBe(true);
    });

    it('should reject invalid callback signature', async () => {
      const service = new DuitkuService();
      await service.getConfig();

      const payload = {
        merchantCode: mockConfig.merchantCode,
        merchantOrderId: 'ORDER123',
        amount: '100000',
        signature: 'invalid-signature',
      };

      const isValid = service.validateCallbackSignature(payload as never);

      expect(isValid).toBe(false);
    });

    it('should reject an unsigned SNAP-shaped callback', async () => {
      const service = new DuitkuService();
      await service.getConfig();

      const payload = {
        merchantCode: mockConfig.merchantCode,
        merchantOrderId: 'ORDER123',
        partnerReferenceNo: 'ORDER123',
        amount: '100000',
        responseCode: '2004700',
        signature: '',
      };

      expect(service.validateCallbackSignature(payload as never)).toBe(false);
    });

    it('should return false when config is not loaded', () => {
      const service = new DuitkuService();

      const payload = {
        merchantCode: 'TEST123',
        merchantOrderId: 'ORDER123',
        amount: '100000',
        signature: 'any-signature',
      };

      const isValid = service.validateCallbackSignature(payload as never);

      expect(isValid).toBe(false);
    });
  });

  describe('parseCallback', () => {
    it('should parse valid legacy callback payload', () => {
      const service = new DuitkuService();

      const payload = {
        merchantCode: 'TEST123',
        merchantOrderId: 'ORDER123',
        amount: '100000',
        paymentCode: 'SP',
        resultCode: '00',
        reference: 'REF456',
        signature: 'abc123',
      };

      const result = service.parseCallback(payload);

      expect(result).not.toBeNull();
      expect(result?.merchantOrderId).toBe('ORDER123');
      expect(result?.reference).toBe('REF456');
      expect(result?.resultCode).toBe('00');
    });

    it('should handle invalid payload gracefully', () => {
      const service = new DuitkuService();

      // Invalid payload should not throw (parse is defensive)
      expect(() => service.parseCallback(null as never)).not.toThrow();
      expect(() => service.parseCallback('string-payload' as never)).not.toThrow();
    });
  });

  describe('getChannelId', () => {
    it('should return the ShopeePay QRIS payment code', () => {
      const service = new DuitkuService();
      expect(service.getChannelId()).toBe('SP');
    });
  });

  describe('isConfigured', () => {
    it('should return true when properly configured', async () => {
      const service = new DuitkuService();
      const result = await service.isConfigured();
      expect(result).toBe(true);
    });

    it('should return false when disabled', async () => {
      vi.mocked(adminSettingsService.getDecryptedSettings).mockResolvedValue({
        ...mockConfig,
        enabled: false,
      } as never);

      const service = new DuitkuService();
      const result = await service.isConfigured();
      expect(result).toBe(false);
    });

    it('should return false when merchantCode is missing', async () => {
      vi.mocked(adminSettingsService.getDecryptedSettings).mockResolvedValue({
        ...mockConfig,
        merchantCode: '',
      } as never);

      const service = new DuitkuService();
      const result = await service.isConfigured();
      expect(result).toBe(false);
    });

    it('should return false when apiKey is missing', async () => {
      vi.mocked(adminSettingsService.getDecryptedSettings).mockResolvedValue({
        ...mockConfig,
        apiKey: '',
      } as never);

      const service = new DuitkuService();
      const result = await service.isConfigured();
      expect(result).toBe(false);
    });
  });
})