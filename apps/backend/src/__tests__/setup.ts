import { beforeAll, afterAll, vi } from 'vitest';

// Set test environment variables
beforeAll(() => {
  process.env.META_APP_ID = 'test_app_id_123';
  process.env.META_APP_SECRET = 'test_app_secret_456';
  process.env.META_CONFIG_ID = 'test_config_id_789';
  process.env.OAUTH_REDIRECT_URI = 'https://test.example.com/api/v1/waba/signup/callback';
  process.env.WEBHOOK_BASE_URL = 'https://test.example.com';
  process.env.WABA_TOKEN_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
});

afterAll(() => {
  vi.clearAllMocks();
});
