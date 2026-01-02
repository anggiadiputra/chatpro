import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createHmac } from 'crypto';

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

// Mock logger
vi.mock('../../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { WABAWebhook } from '../../../services/waba/webhook';
import { WABASettings } from '../../../services/waba/settings';

describe('WABAWebhook', () => {
  let webhook: WABAWebhook;
  let settings: WABASettings;
  const appSecret = process.env.META_APP_SECRET || 'test_app_secret_456';

  beforeEach(() => {
    vi.clearAllMocks();
    settings = new WABASettings();
    webhook = new WABAWebhook(settings);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('verifySignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const expectedSignature = createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');
      const signature = `sha256=${expectedSignature}`;

      const result = webhook.verifySignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';

      const result = webhook.verifySignature(payload, signature);

      expect(result).toBe(false);
    });

    it('should reject signature without sha256 prefix', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = 'invalid_format';

      const result = webhook.verifySignature(payload, signature);

      expect(result).toBe(false);
    });

    it('should reject empty signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = '';

      const result = webhook.verifySignature(payload, signature);

      expect(result).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ test: 'data' });
      const tamperedPayload = JSON.stringify({ test: 'tampered' });
      const expectedSignature = createHmac('sha256', appSecret)
        .update(originalPayload)
        .digest('hex');
      const signature = `sha256=${expectedSignature}`;

      const result = webhook.verifySignature(tamperedPayload, signature);

      expect(result).toBe(false);
    });

    it('should handle complex payload', () => {
      const payload = JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{
          id: '123456789',
          changes: [{
            field: 'messages',
            value: { messages: [{ from: '1234567890', text: { body: 'Hello' } }] }
          }]
        }]
      });
      const expectedSignature = createHmac('sha256', appSecret)
        .update(payload)
        .digest('hex');
      const signature = `sha256=${expectedSignature}`;

      const result = webhook.verifySignature(payload, signature);

      expect(result).toBe(true);
    });
  });

  describe('verifyChallenge', () => {
    it('should verify valid challenge', () => {
      const mode = 'subscribe';
      const token = 'my_verify_token';
      const challenge = 'challenge_12345';
      const expectedToken = 'my_verify_token';

      const result = webhook.verifyChallenge(mode, token, challenge, expectedToken);

      expect(result).toBe(challenge);
    });

    it('should reject invalid mode', () => {
      const mode = 'invalid_mode';
      const token = 'my_verify_token';
      const challenge = 'challenge_12345';
      const expectedToken = 'my_verify_token';

      const result = webhook.verifyChallenge(mode, token, challenge, expectedToken);

      expect(result).toBeNull();
    });

    it('should reject mismatched token', () => {
      const mode = 'subscribe';
      const token = 'wrong_token';
      const challenge = 'challenge_12345';
      const expectedToken = 'my_verify_token';

      const result = webhook.verifyChallenge(mode, token, challenge, expectedToken);

      expect(result).toBeNull();
    });
  });

  describe('handleEvent', () => {
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
      await expect(webhook.handleEvent(event)).resolves.toBeUndefined();
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

      await expect(webhook.handleEvent(event)).resolves.toBeUndefined();
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

      await expect(webhook.handleEvent(event)).resolves.toBeUndefined();
    });

    it('should handle coexistence history event', async () => {
      const event = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789012345',
            changes: [
              {
                field: 'history',
                value: {
                  sync_status: 'completed',
                },
              },
            ],
          },
        ],
      };

      await expect(webhook.handleEvent(event)).resolves.toBeUndefined();
    });

    it('should handle account update event', async () => {
      const event = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789012345',
            changes: [
              {
                field: 'account_update',
                value: {
                  event: 'VERIFIED_ACCOUNT',
                },
              },
            ],
          },
        ],
      };

      await expect(webhook.handleEvent(event)).resolves.toBeUndefined();
    });

    it('should throw error for unsupported object type', async () => {
      const event = {
        object: 'unsupported_type',
        entry: [],
      };

      await expect(webhook.handleEvent(event)).rejects.toThrow('Unsupported webhook object type');
    });

    it('should handle multiple changes in single entry', async () => {
      const event = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789012345',
            changes: [
              {
                field: 'messages',
                value: { messages: [{ from: '1234567890' }] },
              },
              {
                field: 'message_status',
                value: { statuses: [{ id: 'msg_123', status: 'delivered' }] },
              },
            ],
          },
        ],
      };

      await expect(webhook.handleEvent(event)).resolves.toBeUndefined();
    });

    it('should handle multiple entries', async () => {
      const event = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'waba_1',
            changes: [{ field: 'messages', value: {} }],
          },
          {
            id: 'waba_2',
            changes: [{ field: 'messages', value: {} }],
          },
        ],
      };

      await expect(webhook.handleEvent(event)).resolves.toBeUndefined();
    });
  });
});
