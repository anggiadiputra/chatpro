import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import wabaRoutes from '../../routes/waba';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create test app
const app = new Hono();

// Mock authentication middleware
app.use('*', async (c, next) => {
  // Mock authenticated user
  c.user = {
    id: 'test_user_123',
    email: 'test@example.com',
    role: 'ADMIN',
    businessAccountId: 'test_business_123',
  };
  await next();
});

app.route('/api/v1/waba', wabaRoutes);

describe('WABA Endpoints Integration Tests', () => {
  let testBusinessAccountId: string;
  let testWabaId: string;
  let testMetaAppId: string;

  beforeAll(async () => {
    // Setup test data
    testBusinessAccountId = 'test_business_' + Date.now();
    testWabaId = 'test_waba_' + Date.now();
    
    // Create or get test MetaApp
    const existingMetaApp = await prisma.metaApp.findFirst({
      where: { appId: 'test_app_integration' }
    });
    
    if (existingMetaApp) {
      testMetaAppId = existingMetaApp.id;
    } else {
      const metaApp = await prisma.metaApp.create({
        data: {
          appId: 'test_app_integration',
          appSecret: 'test_secret',
          techProviderStatus: 'approved',
        }
      });
      testMetaAppId = metaApp.id;
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await prisma.wABAConnectionLog.deleteMany({
        where: { businessAccountId: testBusinessAccountId },
      });
      await prisma.phoneNumber.deleteMany({
        where: { businessAccountId: testBusinessAccountId },
      });
      await prisma.businessAccount.deleteMany({
        where: { id: testBusinessAccountId },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /signup/init', () => {
    it('should initialize signup flow successfully', async () => {
      // Create test business account
      await prisma.businessAccount.create({
        data: {
          id: testBusinessAccountId,
          name: 'Test Business',
          metaAppId: testMetaAppId,
        },
      });

      const response = await app.request('/api/v1/waba/signup/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessAccountId: testBusinessAccountId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('signupUrl');
      expect(data.data).toHaveProperty('state');
      expect(data.data).toHaveProperty('expiresAt');
      expect(data.data.signupUrl).toContain('facebook.com');
    });

    it('should return 404 for non-existent business account', async () => {
      const response = await app.request('/api/v1/waba/signup/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessAccountId: 'non_existent_account',
        }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NotFound');
    });

    it('should return 400 for invalid input', async () => {
      const response = await app.request('/api/v1/waba/signup/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessAccountId: '',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ValidationError');
    });
  });

  describe('GET /signup/callback', () => {
    it('should handle user cancellation', async () => {
      const response = await app.request(
        '/api/v1/waba/signup/callback?error=access_denied&error_reason=user_denied&error_description=User%20cancelled',
        {
          method: 'GET',
        }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('USER_CANCELLED');
      expect(data.error.retryable).toBe(true);
    });

    it('should return error for missing code parameter', async () => {
      const response = await app.request('/api/v1/waba/signup/callback?state=test_state', {
        method: 'GET',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_CODE');
    });

    it('should return error for missing state parameter', async () => {
      const response = await app.request('/api/v1/waba/signup/callback?code=test_code', {
        method: 'GET',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_CODE');
    });
  });

  describe('GET /:wabaId/phone-numbers', () => {
    beforeEach(async () => {
      // Create test business account with WABA
      await prisma.businessAccount.upsert({
        where: { id: testBusinessAccountId },
        create: {
          id: testBusinessAccountId,
          name: 'Test Business',
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
          metaAppId: testMetaAppId,
        },
        update: {
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
        },
      });

      // Create test phone number
      await prisma.phoneNumber.create({
        data: {
          phoneNumberId: 'test_phone_123',
          displayPhoneNumber: '+1234567890',
          verifiedName: 'Test Business',
          qualityRating: 'GREEN',
          isVerified: true,
          isPrimary: true,
          businessAccountId: testBusinessAccountId,
        },
      });
    });

    it('should return phone numbers for a WABA', async () => {
      const response = await app.request(`/api/v1/waba/${testWabaId}/phone-numbers`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('displayPhoneNumber');
      expect(data.data[0]).toHaveProperty('qualityRating');
    });

    it('should return 404 for non-existent WABA', async () => {
      const response = await app.request('/api/v1/waba/non_existent_waba/phone-numbers', {
        method: 'GET',
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NotFound');
    });
  });

  describe('POST /:wabaId/disconnect', () => {
    beforeEach(async () => {
      // Create test business account with WABA and token
      const tokenEncryption = new (await import('../../utils/tokenEncryption.js')).TokenEncryptionService();
      const encrypted = tokenEncryption.encrypt('test_access_token');

      await prisma.businessAccount.upsert({
        where: { id: testBusinessAccountId },
        create: {
          id: testBusinessAccountId,
          name: 'Test Business',
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
          wabaAccessToken: encrypted.ciphertext,
          wabaAccessTokenIV: encrypted.iv,
          wabaAccessTokenTag: encrypted.authTag,
          metaAppId: testMetaAppId,
        },
        update: {
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
          wabaAccessToken: encrypted.ciphertext,
          wabaAccessTokenIV: encrypted.iv,
          wabaAccessTokenTag: encrypted.authTag,
        },
      });
    });

    it('should disconnect WABA successfully', async () => {
      const response = await app.request(`/api/v1/waba/${testWabaId}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Test disconnection',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('disconnected successfully');

      // Verify database state
      const businessAccount = await prisma.businessAccount.findUnique({
        where: { id: testBusinessAccountId },
      });
      expect(businessAccount?.wabaConnectionStatus).toBe('disconnected');
      expect(businessAccount?.wabaAccessToken).toBeNull();
    });

    it('should return 400 when already disconnected', async () => {
      // First disconnect
      await app.request(`/api/v1/waba/${testWabaId}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Test disconnection',
        }),
      });

      // Try to disconnect again
      const response = await app.request(`/api/v1/waba/${testWabaId}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Test disconnection',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BadRequest');
      expect(data.error.message).toContain('already disconnected');
    });

    it('should return 404 for non-existent WABA', async () => {
      const response = await app.request('/api/v1/waba/non_existent_waba/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NotFound');
    });
  });

  describe('POST /:wabaId/refresh-token', () => {
    it('should return 404 for non-existent WABA', async () => {
      const response = await app.request('/api/v1/waba/non_existent_waba/refresh-token', {
        method: 'POST',
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NotFound');
    });

    it('should return 400 when WABA is not connected', async () => {
      // Create disconnected WABA
      await prisma.businessAccount.upsert({
        where: { id: testBusinessAccountId },
        create: {
          id: testBusinessAccountId,
          name: 'Test Business',
          wabaId: testWabaId,
          wabaConnectionStatus: 'disconnected',
          metaAppId: testMetaAppId,
        },
        update: {
          wabaConnectionStatus: 'disconnected',
          wabaAccessToken: null,
          wabaAccessTokenIV: null,
          wabaAccessTokenTag: null,
        },
      });

      const response = await app.request(`/api/v1/waba/${testWabaId}/refresh-token`, {
        method: 'POST',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BadRequest');
      expect(data.error.message).toContain('not connected');
    });
  });

  describe('GET /:wabaId/webhook-health', () => {
    beforeEach(async () => {
      await prisma.businessAccount.upsert({
        where: { id: testBusinessAccountId },
        create: {
          id: testBusinessAccountId,
          name: 'Test Business',
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
          metaAppId: testMetaAppId,
        },
        update: {
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
        },
      });
    });

    it('should return webhook health status', async () => {
      const response = await app.request(`/api/v1/waba/${testWabaId}/webhook-health`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('status');
    });

    it('should return 404 for non-existent WABA', async () => {
      const response = await app.request('/api/v1/waba/non_existent_waba/webhook-health', {
        method: 'GET',
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NotFound');
    });
  });

  describe('GET /:wabaId/webhook-metrics', () => {
    beforeEach(async () => {
      await prisma.businessAccount.upsert({
        where: { id: testBusinessAccountId },
        create: {
          id: testBusinessAccountId,
          name: 'Test Business',
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
          metaAppId: testMetaAppId,
        },
        update: {
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
        },
      });
    });

    it('should return webhook metrics', async () => {
      const response = await app.request(`/api/v1/waba/${testWabaId}/webhook-metrics`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalEvents');
      expect(data.data).toHaveProperty('successfulEvents');
      expect(data.data).toHaveProperty('failedEvents');
    });

    it('should accept date range parameters', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await app.request(
        `/api/v1/waba/${testWabaId}/webhook-metrics?startDate=${startDate}&endDate=${endDate}`,
        {
          method: 'GET',
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
