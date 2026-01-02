import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

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
      findMany: vi.fn(),
      count: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../../services/admin/settings-service.js', () => ({
  adminSettingsService: {
    getDecryptedSettings: vi.fn(),
  },
}));

vi.mock('../../services/admin/subscription-plans-service.js', () => ({
  adminSubscriptionPlansService: {
    getPlans: vi.fn(),
    getPlanPricing: vi.fn(),
  },
}));

vi.mock('../../services/duitku-service.js', () => ({
  duitkuService: {
    createQRPayment: vi.fn(),
    validateCallbackSignature: vi.fn(),
  },
}));

describe('PaymentService', () => {
  let PaymentService: typeof import('../../services/payment-service.js').PaymentService;
  let prisma: typeof import('../../utils/database.js').prisma;
  let adminSettingsService: typeof import('../../services/admin/settings-service.js').adminSettingsService;
  let adminSubscriptionPlansService: typeof import('../../services/admin/subscription-plans-service.js').adminSubscriptionPlansService;
  let duitkuService: typeof import('../../services/duitku-service.js').duitkuService;


  const mockDuitkuSettings = {
    merchantCode: 'TEST123',
    apiKey: 'test-api-key',
    enabled: true,
    environment: 'sandbox',
    litePriceMonthly: 99000,
    proPriceMonthly: 299000,
  };

  const mockDurations = [
    { months: 1, days: 30, discountPercent: 0, enabled: true, label: '1 Bulan' },
    { months: 3, days: 90, discountPercent: 10, enabled: true, label: '3 Bulan' },
    { months: 6, days: 180, discountPercent: 15, enabled: true, label: '6 Bulan' },
    { months: 12, days: 365, discountPercent: 20, enabled: true, label: '1 Tahun' },
  ];

  const mockSubscriptionPlans = {
    free: {
      name: 'FREE',
      description: 'Untuk memulai bisnis Anda',
      price: 0,
      features: ['WhatsApp Business API', 'Instagram DM Integration'],
      durations: [],
    },
    lite: {
      name: 'LITE',
      description: 'Untuk bisnis yang berkembang',
      price: 99000,
      features: ['Semua fitur FREE', '1 AI Agent'],
      durations: mockDurations,
    },
    pro: {
      name: 'PRO',
      description: 'Untuk bisnis enterprise',
      price: 299000,
      features: ['Semua fitur LITE', '10 AI Agents'],
      durations: mockDurations,
    },
  };

  const mockPlanPricing = {
    tier: 'lite' as const,
    name: 'LITE',
    basePrice: 99000,
    features: ['Semua fitur FREE', '1 AI Agent'],
    durations: [
      { months: 1, days: 30, discountPercent: 0, totalPrice: 99000, effectiveMonthlyPrice: 99000, savings: 0, label: '1 Bulan', enabled: true },
      { months: 3, days: 90, discountPercent: 10, totalPrice: 267300, effectiveMonthlyPrice: 89100, savings: 29700, label: '3 Bulan', enabled: true },
      { months: 6, days: 180, discountPercent: 15, totalPrice: 504900, effectiveMonthlyPrice: 84150, savings: 89100, label: '6 Bulan', enabled: true, recommended: true },
      { months: 12, days: 365, discountPercent: 20, totalPrice: 950400, effectiveMonthlyPrice: 79200, savings: 237600, label: '1 Tahun', enabled: true },
    ],
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscription: { tier: 'FREE', status: 'ACTIVE' },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const paymentModule = await import('../../services/payment-service.js');
    PaymentService = paymentModule.PaymentService;

    const dbModule = await import('../../utils/database.js');
    prisma = dbModule.prisma;

    const settingsModule = await import('../../services/admin/settings-service.js');
    adminSettingsService = settingsModule.adminSettingsService;

    const plansModule = await import('../../services/admin/subscription-plans-service.js');
    adminSubscriptionPlansService = plansModule.adminSubscriptionPlansService;

    const duitkuModule = await import('../../services/duitku-service.js');
    duitkuService = duitkuModule.duitkuService;

    // Primary source: subscription plans
    vi.mocked(adminSubscriptionPlansService.getPlans).mockResolvedValue(mockSubscriptionPlans);
    vi.mocked(adminSubscriptionPlansService.getPlanPricing).mockResolvedValue(mockPlanPricing);
    // Fallback source: duitku settings
    vi.mocked(adminSettingsService.getDecryptedSettings).mockResolvedValue(mockDuitkuSettings);
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('getPricing', () => {
    it('should return pricing from subscription plans config', async () => {
      const service = new PaymentService();
      const pricing = await service.getPricing();

      expect(pricing.lite.price).toBe(99000);
      expect(pricing.pro.price).toBe(299000);
      expect(pricing.lite.features).toEqual(['Semua fitur FREE', '1 AI Agent']);
      expect(pricing.pro.features).toEqual(['Semua fitur LITE', '10 AI Agents']);
      expect(adminSubscriptionPlansService.getPlans).toHaveBeenCalled();
    });

    it('should fallback to duitku settings when subscription plans fail', async () => {
      vi.mocked(adminSubscriptionPlansService.getPlans).mockRejectedValue(new Error('Plans error'));

      const service = new PaymentService();
      const pricing = await service.getPricing();

      expect(pricing.lite.price).toBe(99000);
      expect(pricing.pro.price).toBe(299000);
      expect(adminSettingsService.getDecryptedSettings).toHaveBeenCalledWith('duitku');
    });

    it('should return default pricing when both sources fail', async () => {
      vi.mocked(adminSubscriptionPlansService.getPlans).mockRejectedValue(new Error('Plans error'));
      vi.mocked(adminSettingsService.getDecryptedSettings).mockRejectedValue(new Error('DB error'));

      const service = new PaymentService();
      const pricing = await service.getPricing();

      expect(pricing.lite.price).toBe(99000);
      expect(pricing.pro.price).toBe(299000);
    });
  });

  describe('generateOrderId', () => {
    it('should generate unique order IDs', () => {
      const service = new PaymentService();
      const id1 = service.generateOrderId();
      const id2 = service.generateOrderId();

      expect(id1).toMatch(/^KC-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(id2).toMatch(/^KC-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('createPayment', () => {
    it('should create payment successfully with 1 month duration', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
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

      const service = new PaymentService();
      const result = await service.createPayment({
        userId: 'user-123',
        targetTier: 'LITE',
        durationMonths: 1,
      });

      expect(result.success).toBe(true);
      expect(result.qrString).toBe('qr-string-data');
      expect(result.amount).toBe(99000);
      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationDays: 30,
            amount: 99000,
          }),
        })
      );
    });

    it('should create payment with 6 month duration and apply discount', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
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

      const service = new PaymentService();
      const result = await service.createPayment({
        userId: 'user-123',
        targetTier: 'LITE',
        durationMonths: 6,
      });

      expect(result.success).toBe(true);
      expect(result.amount).toBe(504900); // 6 months with 15% discount
      expect(prisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationDays: 180,
            amount: 504900,
          }),
        })
      );
    });

    it('should reject invalid duration', async () => {
      const service = new PaymentService();
      const result = await service.createPayment({
        userId: 'user-123',
        targetTier: 'LITE',
        durationMonths: 5 as any, // Invalid duration
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_DURATION');
    });

    it('should reject if user already on target tier', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        subscription: { tier: 'LITE', status: 'ACTIVE' },
      } as any);

      const service = new PaymentService();
      const result = await service.createPayment({
        userId: 'user-123',
        targetTier: 'LITE',
        durationMonths: 1,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_SUBSCRIBED');
    });

    it('should handle Duitku API failure', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.paymentTransaction.create).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
      } as any);
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({} as any);
      vi.mocked(duitkuService.createQRPayment).mockResolvedValue({
        success: false,
        error: 'API Error',
        errorCode: 'DUITKU_ERROR',
      });

      const service = new PaymentService();
      const result = await service.createPayment({
        userId: 'user-123',
        targetTier: 'LITE',
        durationMonths: 1,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DUITKU_ERROR');
    });

    it('should reject disabled duration', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(adminSubscriptionPlansService.getPlanPricing).mockResolvedValue({
        ...mockPlanPricing,
        durations: [
          { months: 1, days: 30, discountPercent: 0, totalPrice: 99000, effectiveMonthlyPrice: 99000, savings: 0, label: '1 Bulan', enabled: false },
        ],
      });

      const service = new PaymentService();
      const result = await service.createPayment({
        userId: 'user-123',
        targetTier: 'LITE',
        durationMonths: 1,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('DURATION_DISABLED');
    });
  });


  describe('getTransactionStatus', () => {
    it('should return transaction status', async () => {
      vi.mocked(prisma.paymentTransaction.findFirst).mockResolvedValue({
        status: 'PENDING',
        paidAt: null,
        amount: 99000,
        targetTier: 'LITE',
      } as any);

      const service = new PaymentService();
      const result = await service.getTransactionStatus('KC-TEST-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('PENDING');
    });

    it('should return null for non-existent transaction', async () => {
      vi.mocked(prisma.paymentTransaction.findFirst).mockResolvedValue(null);

      const service = new PaymentService();
      const result = await service.getTransactionStatus('INVALID', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('processCallback', () => {
    const mockPayload = {
      partnerReferenceNo: 'KC-TEST-123',
      merchantOrderId: 'KC-TEST-123',
      merchantCode: 'TEST123',
      referenceNo: 'REF123',
      reference: 'REF123',
      paymentCode: 'QRIS',
      resultCode: '00',
      amount: { value: '99000', currency: 'IDR' },
      responseCode: '2004700',
      additionalInfo: { transactionStatus: '00' },
    } as any;

    it('should process successful callback', async () => {
      vi.mocked(duitkuService.validateCallbackSignature).mockReturnValue(true);
      vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        userId: 'user-123',
        status: 'PENDING',
        targetTier: 'LITE',
        user: mockUser,
      } as any);
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({} as any);
      vi.mocked(prisma.subscription.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const service = new PaymentService();
      const result = await service.processCallback(mockPayload, 'valid-sig', '2024-01-15T10:00:00Z');

      expect(result.success).toBe(true);
      expect(prisma.subscription.upsert).toHaveBeenCalled();
    });

    it('should reject invalid signature', async () => {
      vi.mocked(duitkuService.validateCallbackSignature).mockReturnValue(false);

      const service = new PaymentService();
      const result = await service.processCallback(mockPayload, 'invalid-sig', '2024-01-15T10:00:00Z');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('should handle idempotency (already processed)', async () => {
      vi.mocked(duitkuService.validateCallbackSignature).mockReturnValue(true);
      vi.mocked(prisma.paymentTransaction.findUnique).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        status: 'COMPLETED', // Already processed
        user: mockUser,
      } as any);

      const service = new PaymentService();
      const result = await service.processCallback(mockPayload, 'valid-sig', '2024-01-15T10:00:00Z');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Already processed');
    });
  });

  describe('getPaymentHistory', () => {
    it('should return paginated payment history', async () => {
      const mockTransactions = [
        { id: 'tx-1', orderId: 'KC-1', amount: 99000, paymentMethod: 'QRIS', targetTier: 'LITE', status: 'COMPLETED', createdAt: new Date(), paidAt: new Date() },
        { id: 'tx-2', orderId: 'KC-2', amount: 299000, paymentMethod: 'SHOPEEPAY', targetTier: 'PRO', status: 'PENDING', createdAt: new Date(), paidAt: null },
      ];

      vi.mocked(prisma.paymentTransaction.findMany).mockResolvedValue(mockTransactions as any);
      vi.mocked(prisma.paymentTransaction.count).mockResolvedValue(2);

      const service = new PaymentService();
      const result = await service.getPaymentHistory('user-123', 1, 10);

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel pending transaction', async () => {
      vi.mocked(prisma.paymentTransaction.findFirst).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        status: 'PENDING',
      } as any);
      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({} as any);

      const service = new PaymentService();
      const result = await service.cancelTransaction('KC-TEST-123', 'user-123');

      expect(result.success).toBe(true);
    });

    it('should reject cancellation of non-pending transaction', async () => {
      vi.mocked(prisma.paymentTransaction.findFirst).mockResolvedValue({
        id: 'tx-123',
        orderId: 'KC-TEST-123',
        status: 'COMPLETED',
      } as any);

      const service = new PaymentService();
      const result = await service.cancelTransaction('KC-TEST-123', 'user-123');

      expect(result.success).toBe(false);
    });
  });
});
