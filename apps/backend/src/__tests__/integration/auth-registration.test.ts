import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import authRoutes from '../../routes/auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock Redis cache
vi.mock('../../utils/cache.js', () => ({
  cacheRedis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  },
}));

// Mock email service
vi.mock('../../services/email/EmailService.js', () => ({
  emailService: {
    sendOTPEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-msg-id' }),
    isReady: vi.fn().mockReturnValue(true),
  },
}));

// Import mocked modules
import { cacheRedis } from '../../utils/cache.js';
import { emailService } from '../../services/email/EmailService.js';

// Create test app
const app = new Hono();
app.route('/api/v1/auth', authRoutes);

describe('Auth Registration Endpoints', () => {
  const testEmail = `authreg_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  beforeAll(async () => {
    // Setup test environment
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars';
  });

  afterAll(async () => {
    // Cleanup test users
    // NOTE: use a prefix unique to this file so we never delete users created by
    // other test files running in parallel (vitest runs test files concurrently).
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'authreg_' } },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await prisma.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(cacheRedis.incr).mockResolvedValue(1);
    vi.mocked(cacheRedis.expire).mockResolvedValue(1);
    vi.mocked(cacheRedis.setex).mockResolvedValue('OK');
    vi.mocked(cacheRedis.del).mockResolvedValue(1);
  });


  describe('POST /register/initiate', () => {
    it('should initiate registration and return success', async () => {
      const response = await app.request('/api/v1/auth/register/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toBe('OTP sent to email');
      expect(data.data).toHaveProperty('expiresAt');
      expect(data.data).toHaveProperty('resendCooldown');
      expect(emailService.sendOTPEmail).toHaveBeenCalled();
    });

    it('should return 400 for invalid email', async () => {
      const response = await app.request('/api/v1/auth/register/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: testPassword,
          name: testName,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ValidationError');
    });

    it('should return 400 for short password', async () => {
      const response = await app.request('/api/v1/auth/register/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'short',
          name: testName,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ValidationError');
    });

    it('should return 429 when rate limited', async () => {
      vi.mocked(cacheRedis.incr).mockResolvedValue(6); // Over limit
      vi.mocked(cacheRedis.ttl).mockResolvedValue(1800);

      const response = await app.request('/api/v1/auth/register/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error.code).toBe('RateLimitExceeded');
      expect(data.error).toHaveProperty('retryAfter');
    });
  });


  describe('POST /register/verify', () => {
    it('should return 400 for invalid OTP format', async () => {
      const response = await app.request('/api/v1/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          otp: '12345', // Only 5 digits
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ValidationError');
    });

    it('should return 400 when no pending registration exists', async () => {
      vi.mocked(cacheRedis.get).mockResolvedValue(null);

      const response = await app.request('/api/v1/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          otp: '123456',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('InvalidOTP');
    });
  });

  describe('POST /register/resend', () => {
    it('should return 400 when no pending registration exists', async () => {
      vi.mocked(cacheRedis.get).mockResolvedValue(null);

      const response = await app.request('/api/v1/auth/register/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ResendFailed');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await app.request('/api/v1/auth/register/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ValidationError');
    });
  });
});
