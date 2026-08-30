import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock axios before imports
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

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

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

import axios from 'axios';
import { execSync } from 'child_process';
import { WABAOAuth } from '../../../services/waba/oauth';
import { WABASettings } from '../../../services/waba/settings';
import { WABAServiceError, WABAErrorCode } from '../../../services/waba/errors';

describe('WABAOAuth', () => {
  let oauth: WABAOAuth;
  let settings: WABASettings;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    settings = new WABASettings();
    oauth = new WABAOAuth(settings);
    // Get the mock instance
    mockAxiosInstance = (axios.create as any)();
    vi.mocked(execSync).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSignupUrl', () => {
    it('should generate a valid signup URL with encrypted state', async () => {
      const userId = 'user_123456789';
      const result = await oauth.generateSignupUrl(userId);

      expect(result).toHaveProperty('signupUrl');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('expiresAt');

      // Verify URL structure
      const url = new URL(result.signupUrl);
      expect(url.hostname).toBe('www.facebook.com');
      expect(url.pathname).toBe('/v23.0/dialog/oauth');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('scope')).toContain('whatsapp_business_management');
      expect(url.searchParams.get('state')).toBe(result.state);
    });

    it('should use custom redirect URI when provided', async () => {
      const userId = 'user_123456789';
      const customRedirectUri = 'https://custom.example.com/callback';
      const result = await oauth.generateSignupUrl(userId, customRedirectUri);

      const url = new URL(result.signupUrl);
      expect(url.searchParams.get('redirect_uri')).toBe(customRedirectUri);
    });

    it('should generate unique state for each call', async () => {
      const userId = 'user_123456789';
      const result1 = await oauth.generateSignupUrl(userId);
      const result2 = await oauth.generateSignupUrl(userId);

      expect(result1.state).not.toBe(result2.state);
    });

    it('should set expiration to 10 minutes from now', async () => {
      const userId = 'user_123456789';
      const beforeCall = Date.now();
      const result = await oauth.generateSignupUrl(userId);
      const afterCall = Date.now();

      const expiresAt = new Date(result.expiresAt).getTime();
      const expectedMin = beforeCall + 10 * 60 * 1000;
      const expectedMax = afterCall + 10 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should include coexistence extras when enabled', async () => {
      const userId = 'user_123456789';
      const result = await oauth.generateSignupUrl(userId, undefined, true);

      const url = new URL(result.signupUrl);
      const extras = url.searchParams.get('extras');
      expect(extras).toBeTruthy();
      
      const parsedExtras = JSON.parse(extras!);
      expect(parsedExtras.featureType).toBe('whatsapp_business_app_onboarding');
      expect(parsedExtras.sessionInfoVersion).toBe('3');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange authorization code for access token', async () => {
      const code = 'test_auth_code';
      const userId = 'user_123456789';
      
      // Generate a valid state
      const signupResult = await oauth.generateSignupUrl(userId);
      const state = signupResult.state;

      vi.mocked(execSync).mockReturnValueOnce(
        JSON.stringify({
          access_token: 'test_access_token_12345',
          token_type: 'Bearer',
          expires_in: 5184000,
        }) as never
      );

      const result = await oauth.exchangeCodeForToken(code, state);

      expect(result.accessToken).toBe('test_access_token_12345');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(5184000);
      expect(result.userId).toBe(userId);
    });

    it('should throw error for expired state', async () => {
      const code = 'test_auth_code';
      
      // Create an expired state (11 minutes old)
      const expiredTimestamp = Date.now() - 11 * 60 * 1000;
      const stateData = {
        userId: 'user_123456789',
        nonce: 'test_nonce',
        timestamp: expiredTimestamp,
      };

      const state = oauth.encryptState(stateData);

      await expect(oauth.exchangeCodeForToken(code, state)).rejects.toThrow('State parameter expired');
    });

    it('should handle Meta API errors', async () => {
      const code = 'invalid_code';
      const userId = 'user_123456789';
      const signupResult = await oauth.generateSignupUrl(userId);
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

      await expect(oauth.exchangeCodeForToken(code, state)).rejects.toThrow('Token exchange failed');
    });
  });

  describe('state encryption/decryption', () => {
    it('should encrypt and decrypt state correctly', () => {
      const stateData = {
        userId: 'user_123456789',
        nonce: 'test_nonce_abc123',
        timestamp: Date.now(),
      };

      const encrypted = oauth.encryptState(stateData);
      const decrypted = oauth.decryptState(encrypted);

      expect(decrypted.userId).toBe(stateData.userId);
      expect(decrypted.nonce).toBe(stateData.nonce);
      expect(decrypted.timestamp).toBe(stateData.timestamp);
    });

    it('should throw error for invalid encrypted state', () => {
      const invalidState = 'invalid_base64url_state';

      expect(() => oauth.decryptState(invalidState)).toThrow(WABAServiceError);
    });

    it('should throw error for tampered state', () => {
      const stateData = {
        userId: 'user_123456789',
        nonce: 'test_nonce',
        timestamp: Date.now(),
      };

      const encrypted = oauth.encryptState(stateData);
      // Tamper with the state
      const tampered = encrypted.slice(0, -5) + 'xxxxx';

      expect(() => oauth.decryptState(tampered)).toThrow(WABAServiceError);
    });
  });

  describe('validateState', () => {
    it('should validate non-expired state', () => {
      const stateData = {
        userId: 'user_123456789',
        nonce: 'test_nonce',
        timestamp: Date.now(),
      };

      const encrypted = oauth.encryptState(stateData);
      const validated = oauth.validateState(encrypted);

      expect(validated.userId).toBe(stateData.userId);
      expect(validated.nonce).toBe(stateData.nonce);
    });

    it('should throw STATE_EXPIRED for expired state', () => {
      const expiredTimestamp = Date.now() - 11 * 60 * 1000; // 11 minutes ago
      const stateData = {
        userId: 'user_123456789',
        nonce: 'test_nonce',
        timestamp: expiredTimestamp,
      };

      const encrypted = oauth.encryptState(stateData);

      try {
        oauth.validateState(encrypted);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(WABAServiceError);
        expect((error as WABAServiceError).code).toBe(WABAErrorCode.STATE_EXPIRED);
      }
    });

    it('should accept state just under 10 minutes old', () => {
      const almostExpiredTimestamp = Date.now() - 9 * 60 * 1000; // 9 minutes ago
      const stateData = {
        userId: 'user_123456789',
        nonce: 'test_nonce',
        timestamp: almostExpiredTimestamp,
      };

      const encrypted = oauth.encryptState(stateData);
      const validated = oauth.validateState(encrypted);

      expect(validated.userId).toBe(stateData.userId);
    });
  });
});
