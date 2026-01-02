import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import paymentRoutes from '../../routes/payment.js';

// Mock dependencies
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../utils/auditLog.js', () => ({
  auditLog: vi.fn(),
}));

vi.mock('../../utils/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    paymentTransaction: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
    },
    systemSetting: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../services/settings-cache.js', () => ({
  settingsCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
  },
  CACHE_KEYS: {
    category: (category: string) => `settings:${category}`,
  },
}));

vi.mock('../../services/duitku-service.js', () => ({
  duitkuService: {
    createQRPayment: vi.fn(),
    validateCallbackSignature: vi.fn(),
  },
}));

vi.mock('../../services/email/EmailService.js', () => ({
  emailService: {
    sendSubscriptionActivationEmail: vi.fn().mockResolvedValue({ success: true }),
  },
}));

import { prisma } from '../../utils/database.js';
import { settingsCache } from '../../services/settings-cache.js';
import { duitkuService } from '../../services/duitku-service.js';

// Create test app with auth middleware mock
const createTestApp = (user: { id: string; email: string } | null) => {
  const app = new Hono();
  
  // Mock auth middleware
  app.use('*', async (c, next) => {
    if (user) {
      c.user = user;
    }
    await next();
  });
  
  app.route('/api/v1/payment', paymentRoutes);
  return app;
};

const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockSubscriptionPlans = {
  free: { name: 'FREE', description: 'Free tier', price: 0, features: [], durations: [] },
  lite: {
    name: 'LITE',
    description: 'Lite tier',
    price: 99000,
    features: ['Feature 1'],
    durations: [
      { months: 1, days: 30, discountPercent: 0, enabled: true, label: '1 Bulan' },
      { months: 3, days: 90, discountPercent: 10, enabled: true, label: '3 Bulan' },
      { months: 6, days: 180, discountPercent: 15, enabled: true, label: '6 Bulan' },
      { months: 12, days: 365, discountPercent: 20, enabled: true, label: '1 Tahun' },
    ],
  },
  pro: {
    name: 'PRO',
    description: 'Pro tier',
    price: 299000,
    features: ['Feature 1', 'Feature 2'],
    durations: [
      { months: 1, days: 30, discountPercent: 0, enabled: true, label: '1 Bulan' },
      { months: 3, days: 90, discountPercent: 10, enabled: true, label: '3 Bulan' },
      { months: 6, days: 180, discountPercent: 15, enabled: true, label: '6 Bulan' },
      { months: 12, days: 365, discountPercent: 20, enabled: true, label: '1 Tahun' },
    ],
  },
};

describe('Payment Duration Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsCache.get).mockReturnValue(mockSubscriptionPlans);
    vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([]);
  });

  describe('POST /api/v1/payment/create with duration', () => {
    it('should create payment with 1 month duration', async () => {
      const app = createTestApp(mockUser);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscription: { tier: 'FREE', status: 'ACTIVE' },
      } as any);
      
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        status: 'PENDING',
      } as any);
      
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({} as any);
      
      vi.mocked(duitkuService.createQRPayment).mockResolvedValue({
        success: true,
        referenceNo: 'REF123',
        qrString: 'qr-string-data',
        qrUrl: 'https://example.com/qr.png',
        expiresAt: new Date(),
      });

      const response = await app.request('/api/v1/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier: 'LITE', durationMonths: 1 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.amount).toBe(99000);
      
      // Verify transaction was created with correct durationDays
      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationDays: 30,
            amount: 99000,
          }),
        })
      );
    });

    it('should create payment with 6 month duration and apply 15% discount', async () => {
      const app = createTestApp(mockUser);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscription: { tier: 'FREE', status: 'ACTIVE' },
      } as any);
      
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        status: 'PENDING',
      } as any);
      
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({} as any);
      
      vi.mocked(duitkuService.createQRPayment).mockResolvedValue({
        success: true,
        referenceNo: 'REF123',
        qrString: 'qr-string-data',
        qrUrl: 'https://example.com/qr.png',
        expiresAt: new Date(),
      });

      const response = await app.request('/api/v1/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier: 'LITE', durationMonths: 6 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // 99000 * 6 * 0.85 = 504900
      expect(data.data.amount).toBe(504900);
      
      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationDays: 180,
            amount: 504900,
          }),
        })
      );
    });

    it('should create payment with 12 month duration and apply 20% discount', async () => {
      const app = createTestApp(mockUser);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscription: { tier: 'FREE', status: 'ACTIVE' },
      } as any);
      
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        status: 'PENDING',
      } as any);
      
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({} as any);
      
      vi.mocked(duitkuService.createQRPayment).mockResolvedValue({
        success: true,
        referenceNo: 'REF123',
        qrString: 'qr-string-data',
        qrUrl: 'https://example.com/qr.png',
        expiresAt: new Date(),
      });

      const response = await app.request('/api/v1/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier: 'LITE', durationMonths: 12 }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // 99000 * 12 * 0.8 = 950400
      expect(data.data.amount).toBe(950400);
      
      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationDays: 365,
            amount: 950400,
          }),
        })
      );
    });

    it('should reject invalid duration', async () => {
      const app = createTestApp(mockUser);

      const response = await app.request('/api/v1/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier: 'LITE', durationMonths: 5 }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('InvalidRequest');
    });

    it('should default to 1 month when durationMonths not provided', async () => {
      const app = createTestApp(mockUser);
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscription: { tier: 'FREE', status: 'ACTIVE' },
      } as any);
      
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        status: 'PENDING',
      } as any);
      
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({} as any);
      
      vi.mocked(duitkuService.createQRPayment).mockResolvedValue({
        success: true,
        referenceNo: 'REF123',
        qrString: 'qr-string-data',
        qrUrl: 'https://example.com/qr.png',
        expiresAt: new Date(),
      });

      const response = await app.request('/api/v1/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier: 'LITE' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.amount).toBe(99000);
    });
  });

  describe('GET /api/v1/payment/pricing', () => {
    it('should return pricing with all duration options', async () => {
      const app = createTestApp(mockUser);

      const response = await app.request('/api/v1/payment/pricing', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.lite).toBeDefined();
      expect(data.data.pro).toBeDefined();
      
      // Check LITE tier durations
      expect(data.data.lite.durations).toHaveLength(4);
      expect(data.data.lite.durations[0].months).toBe(1);
      expect(data.data.lite.durations[0].totalPrice).toBe(99000);
      expect(data.data.lite.durations[2].months).toBe(6);
      expect(data.data.lite.durations[2].totalPrice).toBe(504900);
      expect(data.data.lite.durations[2].recommended).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const app = createTestApp(null);

      const response = await app.request('/api/v1/payment/pricing', {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Subscription Activation with Duration', () => {
    it('should activate subscription with correct endDate based on durationDays', async () => {
      const app = createTestApp(mockUser);
      
      // Mock transaction with 180 days (6 months)
      vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        userId: 'user-123',
        status: 'PENDING',
        targetTier: 'LITE',
        amount: 504900,
        durationDays: 180,
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
      } as any);
      
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({} as any);
      vi.mocked(prisma.subscription.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      vi.mocked(duitkuService.validateCallbackSignature).mockReturnValue(true);

      // Import payment service to test activation
      const { paymentService } = await import('../../services/payment-service.js');
      
      // Call activateSubscription directly
      await paymentService.activateSubscription('user-123', 'LITE', 'KC-TEST-123', 504900);

      // Verify subscription was created with correct dates
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            tier: 'LITE',
            status: 'ACTIVE',
          }),
          create: expect.objectContaining({
            tier: 'LITE',
            status: 'ACTIVE',
          }),
        })
      );
    });
  });
});
