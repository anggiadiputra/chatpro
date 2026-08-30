import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WABAService } from '../../services/waba/index';

// Mock modules before importing
const { mockAxiosInstance, mockAxiosCreate } = vi.hoisted(() => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
  };

  return {
    mockAxiosInstance: instance,
    mockAxiosCreate: vi.fn(() => instance),
  };
});

vi.mock('axios', () => ({
  default: {
    create: mockAxiosCreate,
    get: mockAxiosInstance.get,
    post: mockAxiosInstance.post,
    isAxiosError: vi.fn((error: any) => error?.isAxiosError === true),
  },
  isAxiosError: vi.fn((error: any) => error?.isAxiosError === true),
}));

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    businessAccount: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    wABAConnectionLog: {
      create: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
  })),
}));

// Mock email service
vi.mock('../../services/EmailService.js', () => ({
  emailService: {
    sendWABADisconnected: vi.fn(),
  },
}));

// Mock request queue
vi.mock('../../utils/requestQueue.js', () => ({
  metaApiQueue: {
    enqueue: vi.fn((fn) => fn()),
  },
  criticalQueue: {
    enqueue: vi.fn((fn) => fn()),
  },
}));

import { execSync } from 'child_process';

describe('WABAService', () => {
  let service: WABAService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.post.mockReset();
    vi.mocked(execSync).mockReset();

    // Create service instance
    service = new WABAService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSignupUrl', () => {
    it('should generate a valid signup URL with encrypted state', async () => {
      const businessAccountId = 'ba_123456789';
      const result = await service.generateSignupUrl(businessAccountId);

      expect(result).toHaveProperty('signupUrl');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('expiresAt');

      // Verify URL structure
      const url = new URL(result.signupUrl);
      expect(url.hostname).toBe('www.facebook.com');
      expect(url.pathname).toBe('/v23.0/dialog/oauth');
      expect(url.searchParams.get('client_id')).toBeTruthy();
      expect(url.searchParams.get('config_id')).toBeTruthy();
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('scope')).toContain('whatsapp_business_management');
      expect(url.searchParams.get('state')).toBe(result.state);
    });

    it('should use custom redirect URI when provided', async () => {
      const businessAccountId = 'ba_123456789';
      const customRedirectUri = 'https://custom.example.com/callback';
      const result = await service.generateSignupUrl(businessAccountId, customRedirectUri);

      const url = new URL(result.signupUrl);
      expect(url.searchParams.get('redirect_uri')).toBe(customRedirectUri);
    });

    it('should generate unique state for each call', async () => {
      const businessAccountId = 'ba_123456789';
      const result1 = await service.generateSignupUrl(businessAccountId);
      const result2 = await service.generateSignupUrl(businessAccountId);

      expect(result1.state).not.toBe(result2.state);
    });

    it('should set expiration to 10 minutes from now', async () => {
      const businessAccountId = 'ba_123456789';
      const beforeCall = Date.now();
      const result = await service.generateSignupUrl(businessAccountId);
      const afterCall = Date.now();

      const expiresAt = new Date(result.expiresAt).getTime();
      const expectedMin = beforeCall + 10 * 60 * 1000;
      const expectedMax = afterCall + 10 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange authorization code for access token', async () => {
      const code = 'test_auth_code';
      const userId = 'user_123456789';
      
      // Generate a valid state
      const signupResult = await service.generateSignupUrl(userId);
      const state = signupResult.state;

      vi.mocked(execSync).mockReturnValueOnce(
        JSON.stringify({
          access_token: 'test_access_token_12345',
          token_type: 'Bearer',
          expires_in: 5184000,
        }) as never
      );

      const result = await service.exchangeCodeForToken(code, state);

      expect(result.accessToken).toBe('test_access_token_12345');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(5184000);
      expect(result.userId).toBe(userId);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining(`code=${code}`),
        expect.objectContaining({ encoding: 'utf-8' })
      );
    });

    it('should throw error for expired state', async () => {
      const code = 'test_auth_code';
      
      // Create an expired state (11 minutes old)
      const expiredTimestamp = Date.now() - 11 * 60 * 1000;
      const stateData = {
        businessAccountId: 'ba_123456789',
        nonce: 'test_nonce',
        timestamp: expiredTimestamp,
      };

      const tokenEncryption = new (await import('../../utils/tokenEncryption.js')).TokenEncryptionService();
      const encryptedState = tokenEncryption.encrypt(JSON.stringify(stateData));
      const state = Buffer.from(JSON.stringify(encryptedState)).toString('base64url');

      await expect(service.exchangeCodeForToken(code, state)).rejects.toThrow('State parameter expired');
    });

    it('should handle Meta API errors', async () => {
      const code = 'invalid_code';
      const businessAccountId = 'ba_123456789';
      const signupResult = await service.generateSignupUrl(businessAccountId);
      const state = signupResult.state;

      vi.mocked(execSync).mockReturnValueOnce(
        JSON.stringify({
          error: {
            message: 'Invalid authorization code',
            type: 'OAuthException',
            code: 100,
          },
        }) as never
      );

      await expect(service.exchangeCodeForToken(code, state)).rejects.toThrow('Token exchange failed');
    });
  });

  describe('discoverWABAResources', () => {
    it('should discover WABA resources successfully', async () => {
      const accessToken = 'test_access_token';

      // Mock debug token response
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            granular_scopes: [
              {
                scope: 'whatsapp_business_management',
                target_ids: ['123456789012345'],
              },
            ],
          },
        },
      });

      // Mock WABA details response
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: '123456789012345',
          name: 'Test Business',
          timezone_id: 'America/Los_Angeles',
          currency: 'USD',
          message_template_namespace: 'abc123_def456',
        },
      });

      // Mock phone numbers response
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: '987654321098765',
              display_phone_number: '+1234567890',
              verified_name: 'Test Business',
              quality_rating: 'GREEN',
              code_verification_status: 'VERIFIED',
            },
          ],
        },
      });

      const result = await service.discoverWABAResources(accessToken);

      expect(result.wabaId).toBe('123456789012345');
      expect(result.wabaName).toBe('Test Business');
      expect(result.timezone).toBe('America/Los_Angeles');
      expect(result.currency).toBe('USD');
      expect(result.phoneNumbers).toHaveLength(1);
      expect(result.phoneNumbers[0].displayPhoneNumber).toBe('+1234567890');
      expect(result.phoneNumbers[0].qualityRating).toBe('GREEN');
    });

    it('should throw error when no WABA found in token', async () => {
      const accessToken = 'test_access_token';

      // Mock debug token response with no WABA
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            granular_scopes: [],
          },
        },
      });

      await expect(service.discoverWABAResources(accessToken)).rejects.toThrow('No WABA found in token permissions');
    });

    it('should handle empty phone numbers list', async () => {
      const accessToken = 'test_access_token';

      // Mock debug token response
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: {
            granular_scopes: [
              {
                scope: 'whatsapp_business_management',
                target_ids: ['123456789012345'],
              },
            ],
          },
        },
      });

      // Mock WABA details response
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          id: '123456789012345',
          name: 'Test Business',
        },
      });

      // Mock empty phone numbers response
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          data: [],
        },
      });

      const result = await service.discoverWABAResources(accessToken);

      expect(result.phoneNumbers).toHaveLength(0);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const crypto = require('crypto');
      const appSecret = service.getAppSecret();
      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');
      const signature = `sha256=${expectedSignature}`;

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'sha256=invalid_signature';

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toBe(false);
    });

    it('should reject signature without sha256 prefix', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'invalid_format';

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toBe(false);
    });

    it('should reject empty signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = '';

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ test: 'data' });
      const tamperedPayload = JSON.stringify({ test: 'tampered' });
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', 'test_app_secret_456')
        .update(originalPayload)
        .digest('hex');
      const signature = `sha256=${expectedSignature}`;

      const result = service.verifyWebhookSignature(tamperedPayload, signature);

      expect(result).toBe(false);
    });
  });

  describe('configureWebhooks', () => {
    it('should configure webhooks successfully', async () => {
      const wabaId = '123456789012345';
      const accessToken = 'test_access_token';

      // Mock webhook subscription responses
      mockAxiosInstance.post.mockResolvedValue({
        data: { success: true },
      });

      const result = await service.configureWebhooks(wabaId, accessToken);

      expect(result.success).toBe(true);
      expect(result.subscriptions).toContain('messages');
      expect(result.subscriptions).toContain('message_status');
      expect(result.subscriptions).toContain('message_template_status_update');
      expect(result.webhookUrl).toContain('/api/v1/webhooks');

      // Verify API calls
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });

    it('should handle webhook configuration errors', async () => {
      const wabaId = '123456789012345';
      const accessToken = 'test_access_token';

      // Mock webhook subscription error
      mockAxiosInstance.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error: {
              message: 'Invalid webhook URL',
              type: 'OAuthException',
              code: 100,
            },
          },
        },
      });

      await expect(service.configureWebhooks(wabaId, accessToken)).rejects.toThrow('Webhook configuration failed');
    });
  });

  describe('handleWebhookEvent', () => {
    it('should handle message webhook event', async () => {
      const event = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789012345',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  messages: [
                    {
                      from: '1234567890',
                      id: 'msg_123',
                      text: { body: 'Hello' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      // Should not throw
      await expect(service.handleWebhookEvent(event)).resolves.toBeUndefined();
    });

    it('should handle message status webhook event', async () => {
      const event = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789012345',
            changes: [
              {
                field: 'message_status',
                value: {
                  statuses: [
                    {
                      id: 'msg_123',
                      status: 'delivered',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      await expect(service.handleWebhookEvent(event)).resolves.toBeUndefined();
    });

    it('should handle template status webhook event', async () => {
      const event = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789012345',
            changes: [
              {
                field: 'message_template_status_update',
                value: {
                  event: 'APPROVED',
                  message_template_id: 'tmpl_123',
                },
              },
            ],
          },
        ],
      };

      await expect(service.handleWebhookEvent(event)).resolves.toBeUndefined();
    });

    it('should throw error for unsupported object type', async () => {
      const event = {
        object: 'unsupported_type',
        entry: [],
      };

      await expect(service.handleWebhookEvent(event)).rejects.toThrow('Unsupported webhook object type');
    });
  });
});
