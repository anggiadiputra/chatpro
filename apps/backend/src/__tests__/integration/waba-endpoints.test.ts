import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import wabaRoutes from '../../routes/waba';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const testUserId = `waba-endpoints-user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const testWabaId = `waba-endpoints-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const app = new Hono();

app.use('*', async (c, next) => {
  c.user = {
    id: testUserId,
    email: 'waba-endpoints@example.com',
    role: 'ADMIN',
  };
  await next();
});

app.route('/api/v1/waba', wabaRoutes);

describe('WABA Endpoints Integration Tests', () => {
  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: testUserId,
        email: `${testUserId}@example.com`,
        name: 'WABA Endpoints Test User',
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { userId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /signup/init', () => {
    it('should initialize signup flow for the authenticated user', async () => {
      const response = await app.request('/api/v1/waba/signup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('signupUrl');
      expect(data.data).toHaveProperty('state');
      expect(data.data).toHaveProperty('expiresAt');
      expect(data.data.signupUrl).toContain('facebook.com');
    });

    it('should return 400 for an invalid redirect URI', async () => {
      const response = await app.request('/api/v1/waba/signup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUri: 'not-a-url' }),
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
        { method: 'GET' }
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('USER_CANCELLED');
      expect(data.error.retryable).toBe(true);
    });

    it('should return an error for a missing code parameter', async () => {
      const response = await app.request('/api/v1/waba/signup/callback?state=test_state');

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_CODE');
    });

    it('should return an error for a missing state parameter', async () => {
      const response = await app.request('/api/v1/waba/signup/callback?code=test_code');

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_CODE');
    });
  });

  describe('GET /:wabaId/phone-numbers', () => {
    beforeEach(async () => {
      await prisma.phoneNumber.deleteMany({ where: { userId: testUserId } });
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
        },
      });
      await prisma.phoneNumber.create({
        data: {
          phoneNumberId: `${testUserId}-phone`,
          displayPhoneNumber: '+123****7890',
          verifiedName: 'Test Business',
          qualityRating: 'GREEN',
          isVerified: true,
          isPrimary: true,
          userId: testUserId,
        },
      });
    });

    it('should return phone numbers for a WABA', async () => {
      const response = await app.request(`/api/v1/waba/${testWabaId}/phone-numbers`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        displayPhoneNumber: '+123****7890',
        qualityRating: 'GREEN',
      });
    });

    it('should return 404 for a non-existent WABA', async () => {
      const response = await app.request('/api/v1/waba/non-existent-waba/phone-numbers');

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NotFound');
    });
  });

  describe('POST /:wabaId/disconnect', () => {
    beforeEach(async () => {
      const tokenEncryption = new (await import('../../utils/tokenEncryption.js')).TokenEncryptionService();
      const encrypted = tokenEncryption.encrypt('test_access_token');

      await prisma.user.update({
        where: { id: testUserId },
        data: {
          wabaId: testWabaId,
          wabaConnectionStatus: 'connected',
          wabaAccessToken: encrypted.ciphertext,
          wabaAccessTokenIV: encrypted.iv,
          wabaAccessTokenTag: encrypted.authTag,
        },
      });
    });

    it('should disconnect a WABA successfully', async () => {
      const response = await app.request(`/api/v1/waba/${testWabaId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Test disconnection' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('disconnected successfully');

      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(user?.wabaConnectionStatus).toBe('disconnected');
      expect(user?.wabaAccessToken).toBeNull();
      expect(user?.wabaId).toBeNull();
    });

    it('should return 400 when the WABA is already disconnected', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          wabaConnectionStatus: 'disconnected',
          wabaAccessToken: null,
          wabaAccessTokenIV: null,
          wabaAccessTokenTag: null,
        },
      });

      const response = await app.request(`/api/v1/waba/${testWabaId}/disconnect`, {
        method: 'POST',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ALREADY_DISCONNECTED');
    });

    it('should return 404 for a non-existent WABA', async () => {
      const response = await app.request('/api/v1/waba/non-existent-waba/disconnect', {
        method: 'POST',
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NotFound');
    });
  });

  describe('POST /:wabaId/refresh-token', () => {
    it('should return 404 for a non-existent WABA', async () => {
      const response = await app.request('/api/v1/waba/non-existent-waba/refresh-token', {
        method: 'POST',
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NotFound');
    });

    it('should return 400 when the WABA is not connected', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          wabaId: testWabaId,
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
});