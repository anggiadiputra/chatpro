import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../services/admin/settings-service.js', () => ({
  adminSettingsService: {
    getDecryptedSettings: vi.fn(),
  },
}));

vi.mock('axios');

describe('DuitkuService', () => {
  let DuitkuService: typeof import('../../services/duitku-service.js').DuitkuService;
  let adminSettingsService: typeof import('../../services/admin/settings-service.js').adminSettingsService;
  let axios: typeof import('axios').default;

  const mockConfig = {
    merchantCode: 'TEST123',
    apiKey: 'test-api-key-secret',
    environment: 'sandbox' as const,
    enabled: true,
    litePriceMonthly: 99000,
    proPriceMonthly: 299000,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Dynamic imports after mocks are set up
    const duitkuModule = await import('../../services/duitku-service.js');
    DuitkuService = duitkuModule.DuitkuService;
    
    const settingsModule = await import('../../services/admin/settings-service.js');
    adminSettingsService = settingsModule.adminSettingsService;
    
    axios = (await import('axios')).default;
    
    // Default mock for settings
    vi.mocked(adminSettingsService.getDecryptedSettings).mockResolvedValue(mockConfig);
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('getConfig', () => {
    it('should fetch config from admin settings', async () => {
      const service = new DuitkuService();
      const config = await service.getConfig();

      expect(adminSettingsService.getDecryptedSettings).toHaveBeenCalledWith('duitku');
      expect(config.merchantCode).toBe('TEST123');
      expect(config.apiKey).toBe('test-api-key-secret');
      expect(config.environment).toBe('sandbox');
      expect(config.enabled).toBe(true);
    });

    it('should throw error when settings fetch fails', async () => {
      vi.mocked(adminSettingsService.getDecryptedSettings).mockRejectedValue(
        new Error('Database error')
      );

      const service = new DuitkuService();
      await expect(service.getConfig()).rejects.toThrow('Failed to load Duitku configuration');
    });
  });

  describe('getBaseUrl', () => {
    it('should return sandbox URL for sandbox environment', () => {
      const service = new DuitkuService();
      expect(service.getBaseUrl('sandbox')).toBe('https://snapdev.duitku.com');
    });

    it('should return production URL for production environment', () => {
      const service = new DuitkuService();
      expect(service.getBaseUrl('production')).toBe('https://snap.duitku.com');
    });
  });

  describe('generateSignature', () => {
    it('should generate valid HMAC-SHA512 signature', () => {
      const service = new DuitkuService();
      
      const httpMethod = 'POST';
      const endpointUrl = '/v1.0/qr/qr-mpm-generate';
      const accessToken = 'test-access-token';
      const requestBody = { partnerReferenceNo: 'ORDER123', amount: { value: '100000', currency: 'IDR' } };
      const timestamp = '2024-01-15T10:30:00.000Z';
      const apiKey = 'test-api-key';

      const signature = service.generateSignature(
        httpMethod,
        endpointUrl,
        accessToken,
        requestBody,
        timestamp,
        apiKey
      );

      // Verify signature is base64 encoded
      expect(signature).toBeTruthy();
      expect(() => Buffer.from(signature, 'base64')).not.toThrow();
      
      // Verify signature is consistent for same inputs
      const signature2 = service.generateSignature(
        httpMethod,
        endpointUrl,
        accessToken,
        requestBody,
        timestamp,
        apiKey
      );
      expect(signature).toBe(signature2);
    });

    it('should generate different signatures for different inputs', () => {
      const service = new DuitkuService();
      
      const baseParams = {
        httpMethod: 'POST',
        endpointUrl: '/v1.0/qr/qr-mpm-generate',
        accessToken: 'test-access-token',
        requestBody: { partnerReferenceNo: 'ORDER123' },
        timestamp: '2024-01-15T10:30:00.000Z',
        apiKey: 'test-api-key',
      };

      const sig1 = service.generateSignature(
        baseParams.httpMethod,
        baseParams.endpointUrl,
        baseParams.accessToken,
        baseParams.requestBody,
        baseParams.timestamp,
        baseParams.apiKey
      );

      // Different order ID
      const sig2 = service.generateSignature(
        baseParams.httpMethod,
        baseParams.endpointUrl,
        baseParams.accessToken,
        { partnerReferenceNo: 'ORDER456' },
        baseParams.timestamp,
        baseParams.apiKey
      );

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('generateAsymmetricSignature', () => {
    it('should generate valid asymmetric signature for token request', () => {
      const service = new DuitkuService();
      
      const merchantCode = 'TEST123';
      const timestamp = '2024-01-15T10:30:00.000Z';
      const apiKey = 'test-api-key';

      const signature = service.generateAsymmetricSignature(merchantCode, timestamp, apiKey);

      // Verify signature is base64 encoded
      expect(signature).toBeTruthy();
      expect(() => Buffer.from(signature, 'base64')).not.toThrow();
    });
  });

  describe('validateCallbackSignature', () => {
    it('should validate MD5 callback signature correctly', async () => {
      const service = new DuitkuService();
      
      // First load config
      await service.getConfig();

      const payload = {
        partnerReferenceNo: 'ORDER123',
        referenceNo: 'REF123',
        amount: { value: '100000', currency: 'IDR' },
      };

      // Generate expected MD5 signature
      const stringToSign = `${mockConfig.merchantCode}${payload.amount.value}${payload.partnerReferenceNo}${mockConfig.apiKey}`;
      const expectedSignature = crypto.createHash('md5').update(stringToSign).digest('hex');

      const isValid = service.validateCallbackSignature(
        payload,
        expectedSignature,
        '2024-01-15T10:30:00.000Z'
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid callback signature', async () => {
      const service = new DuitkuService();
      await service.getConfig();

      const payload = {
        partnerReferenceNo: 'ORDER123',
        referenceNo: 'REF123',
        amount: { value: '100000', currency: 'IDR' },
      };

      const isValid = service.validateCallbackSignature(
        payload,
        'invalid-signature',
        '2024-01-15T10:30:00.000Z'
      );

      expect(isValid).toBe(false);
    });

    it('should return false when config is not loaded', () => {
      const service = new DuitkuService();
      
      const payload = {
        partnerReferenceNo: 'ORDER123',
        referenceNo: 'REF123',
        amount: { value: '100000', currency: 'IDR' },
      };

      const isValid = service.validateCallbackSignature(
        payload,
        'any-signature',
        '2024-01-15T10:30:00.000Z'
      );

      expect(isValid).toBe(false);
    });
  });

  describe('parseCallback', () => {
    it('should parse valid callback payload', () => {
      const service = new DuitkuService();
      
      const payload = {
        partnerReferenceNo: 'ORDER123',
        referenceNo: 'REF456',
        amount: { value: '100000', currency: 'IDR' },
        additionalInfo: { transactionStatus: '00' },
        responseCode: '2004700',
        responseMessage: 'Success',
      };

      const result = service.parseCallback(payload);

      expect(result).not.toBeNull();
      expect(result?.partnerReferenceNo).toBe('ORDER123');
      expect(result?.referenceNo).toBe('REF456');
      expect(result?.amount.value).toBe('100000');
    });

    it('should return null for invalid payload without partnerReferenceNo', () => {
      const service = new DuitkuService();
      
      const payload = {
        referenceNo: 'REF456',
        amount: { value: '100000', currency: 'IDR' },
      };

      const result = service.parseCallback(payload);
      expect(result).toBeNull();
    });
  });

  describe('getChannelId', () => {
    it('should return correct channel ID for QRIS', () => {
      const service = new DuitkuService();
      expect(service.getChannelId('QRIS')).toBe('GQ');
    });

    it('should return correct channel ID for ShopeePay', () => {
      const service = new DuitkuService();
      expect(service.getChannelId('SHOPEEPAY')).toBe('SP');
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
      });

      const service = new DuitkuService();
      const result = await service.isConfigured();
      expect(result).toBe(false);
    });

    it('should return false when merchantCode is missing', async () => {
      vi.mocked(adminSettingsService.getDecryptedSettings).mockResolvedValue({
        ...mockConfig,
        merchantCode: '',
      });

      const service = new DuitkuService();
      const result = await service.isConfigured();
      expect(result).toBe(false);
    });

    it('should return false when apiKey is missing', async () => {
      vi.mocked(adminSettingsService.getDecryptedSettings).mockResolvedValue({
        ...mockConfig,
        apiKey: '',
      });

      const service = new DuitkuService();
      const result = await service.isConfigured();
      expect(result).toBe(false);
    });
  });
});
