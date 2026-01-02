import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

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

// Import after mocks
import { OTPService, otpService } from '../../services/otp-service.js';
import { cacheRedis } from '../../utils/cache.js';

describe('OTPService', () => {
  let service: OTPService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OTPService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit numeric OTP', () => {
      const otp = service.generateOTP();
      
      expect(otp).toMatch(/^\d{6}$/);
      expect(parseInt(otp)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otp)).toBeLessThan(1000000);
    });

    it('should generate different OTPs on each call', () => {
      const otps = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        otps.add(service.generateOTP());
      }
      
      // Should have high uniqueness (allowing some collisions in 100 tries)
      expect(otps.size).toBeGreaterThan(90);
    });
  });

  describe('hashOTP and verifyOTPHash', () => {
    it('should hash OTP and verify correctly', async () => {
      const otp = '123456';
      const hash = await service.hashOTP(otp);
      
      expect(hash).not.toBe(otp);
      expect(hash.length).toBeGreaterThan(0);
      
      const isValid = await service.verifyOTPHash(otp, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect OTP', async () => {
      const otp = '123456';
      const hash = await service.hashOTP(otp);
      
      const isValid = await service.verifyOTPHash('654321', hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same OTP (bcrypt salt)', async () => {
      const otp = '123456';
      const hash1 = await service.hashOTP(otp);
      const hash2 = await service.hashOTP(otp);
      
      expect(hash1).not.toBe(hash2);
      
      // Both should still verify correctly
      expect(await service.verifyOTPHash(otp, hash1)).toBe(true);
      expect(await service.verifyOTPHash(otp, hash2)).toBe(true);
    });
  });


  describe('checkEmailRateLimit', () => {
    it('should allow requests under the limit', async () => {
      vi.mocked(cacheRedis.incr).mockResolvedValue(1);
      vi.mocked(cacheRedis.expire).mockResolvedValue(1);

      const result = await service.checkEmailRateLimit('test@example.com');

      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
    });

    it('should block requests over the limit', async () => {
      vi.mocked(cacheRedis.incr).mockResolvedValue(6); // Over limit of 5
      vi.mocked(cacheRedis.ttl).mockResolvedValue(1800);

      const result = await service.checkEmailRateLimit('test@example.com');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(1800);
    });

    it('should set expiry on first request', async () => {
      vi.mocked(cacheRedis.incr).mockResolvedValue(1);
      vi.mocked(cacheRedis.expire).mockResolvedValue(1);

      await service.checkEmailRateLimit('test@example.com');

      expect(cacheRedis.expire).toHaveBeenCalledWith(
        expect.stringContaining('otp:rate:email:'),
        3600 // 1 hour
      );
    });
  });

  describe('checkIPRateLimit', () => {
    it('should allow requests under the limit', async () => {
      vi.mocked(cacheRedis.incr).mockResolvedValue(1);
      vi.mocked(cacheRedis.expire).mockResolvedValue(1);

      const result = await service.checkIPRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
    });

    it('should block requests over the limit', async () => {
      vi.mocked(cacheRedis.incr).mockResolvedValue(11); // Over limit of 10
      vi.mocked(cacheRedis.ttl).mockResolvedValue(2400);

      const result = await service.checkIPRateLimit('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(2400);
    });
  });

  describe('checkRateLimit (combined)', () => {
    it('should allow when both limits pass', async () => {
      vi.mocked(cacheRedis.incr).mockResolvedValue(1);
      vi.mocked(cacheRedis.expire).mockResolvedValue(1);

      const result = await service.checkRateLimit('test@example.com', '192.168.1.1');

      expect(result.allowed).toBe(true);
    });

    it('should block when email limit exceeded', async () => {
      vi.mocked(cacheRedis.incr)
        .mockResolvedValueOnce(6) // Email over limit
        .mockResolvedValueOnce(1); // IP under limit
      vi.mocked(cacheRedis.ttl).mockResolvedValue(1800);

      const result = await service.checkRateLimit('test@example.com', '192.168.1.1');

      expect(result.allowed).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(otpService).toBeInstanceOf(OTPService);
    });
  });
});
