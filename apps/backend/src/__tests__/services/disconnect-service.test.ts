import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    message: { deleteMany: vi.fn() },
    phoneNumber: { deleteMany: vi.fn() },
    consentLog: { deleteMany: vi.fn() },
    customerCustomField: { deleteMany: vi.fn() },
    customerActivity: { deleteMany: vi.fn() },
    customer: { deleteMany: vi.fn() },
    user: { update: vi.fn() },
    iGMessage: { deleteMany: vi.fn() },
    iGConversation: { deleteMany: vi.fn() },
    iGConnectionLog: { deleteMany: vi.fn() },
    instagramAccount: { update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from '../../utils/database.js';
import { DisconnectService, WabaDeletedCounts, InstagramDeletedCounts } from '../../services/disconnect-service.js';

describe('DisconnectService', () => {
  let service: DisconnectService;
  const mockUserId = 'user-123';
  const mockAccountId = 'ig-account-123';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DisconnectService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('softDisconnectWaba', () => {
    it('should delete messages and phone numbers while preserving customer data', async () => {
      // Mock transaction to execute callback
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          message: { deleteMany: vi.fn().mockResolvedValue({ count: 50 }) },
          phoneNumber: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await service.softDisconnectWaba(mockUserId);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('soft');
      const counts = result.deletedCounts as WabaDeletedCounts;
      expect(counts.messages).toBe(50);
      expect(counts.phoneNumbers).toBe(2);
      // Customer data should not be in deletedCounts for soft disconnect
      expect(counts.customers).toBeUndefined();
      expect(result.message).toContain('Customer data has been preserved');
    });

    it('should clear WABA credentials and update status to disconnected', async () => {
      let userUpdateData: any = null;
      
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          message: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          phoneNumber: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          user: { 
            update: vi.fn().mockImplementation(({ data }) => {
              userUpdateData = data;
              return Promise.resolve({});
            })
          },
        };
        return callback(tx);
      });

      await service.softDisconnectWaba(mockUserId);

      expect(userUpdateData).toMatchObject({
        wabaId: null,
        phoneNumberId: null,
        wabaAccessToken: null,
        wabaAccessTokenIV: null,
        wabaAccessTokenTag: null,
        wabaConnectionStatus: 'disconnected',
      });
    });
  });

  describe('hardDisconnectWaba', () => {
    it('should delete all data including customers', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          message: { deleteMany: vi.fn().mockResolvedValue({ count: 100 }) },
          consentLog: { deleteMany: vi.fn().mockResolvedValue({ count: 25 }) },
          customerCustomField: { deleteMany: vi.fn().mockResolvedValue({ count: 30 }) },
          customerActivity: { deleteMany: vi.fn().mockResolvedValue({ count: 50 }) },
          customer: { deleteMany: vi.fn().mockResolvedValue({ count: 20 }) },
          phoneNumber: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await service.hardDisconnectWaba(mockUserId);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('hard');
      const counts = result.deletedCounts as WabaDeletedCounts;
      expect(counts.messages).toBe(100);
      expect(counts.customers).toBe(20);
      expect(counts.customerActivities).toBe(50);
      expect(counts.customerCustomFields).toBe(30);
      expect(counts.consentLogs).toBe(25);
      expect(counts.phoneNumbers).toBe(3);
      expect(result.message).toContain('All data including customers has been deleted');
    });

    it('should use transaction for atomicity', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          message: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          consentLog: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          customerCustomField: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          customerActivity: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          customer: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          phoneNumber: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      await service.hardDisconnectWaba(mockUserId);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should rollback on error', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));

      await expect(service.hardDisconnectWaba(mockUserId)).rejects.toThrow('Database error');
    });
  });

  describe('softDisconnectInstagram', () => {
    it('should delete messages and conversations while preserving account record', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          iGMessage: { deleteMany: vi.fn().mockResolvedValue({ count: 75 }) },
          iGConversation: { deleteMany: vi.fn().mockResolvedValue({ count: 10 }) },
          instagramAccount: { update: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await service.softDisconnectInstagram(mockAccountId);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('soft');
      const counts = result.deletedCounts as InstagramDeletedCounts;
      expect(counts.messages).toBe(75);
      expect(counts.conversations).toBe(10);
      expect(counts.accountDeleted).toBeUndefined();
      expect(result.message).toContain('Account record has been preserved');
    });

    it('should clear access token and update status to disconnected', async () => {
      let accountUpdateData: any = null;
      
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          iGMessage: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          iGConversation: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
          instagramAccount: { 
            update: vi.fn().mockImplementation(({ data }) => {
              accountUpdateData = data;
              return Promise.resolve({});
            })
          },
        };
        return callback(tx);
      });

      await service.softDisconnectInstagram(mockAccountId);

      expect(accountUpdateData).toMatchObject({
        connectionStatus: 'disconnected',
        accessToken: '',
        accessTokenIV: '',
        accessTokenTag: '',
      });
    });
  });

  describe('hardDisconnectInstagram', () => {
    it('should delete all data including account record', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          iGMessage: { deleteMany: vi.fn().mockResolvedValue({ count: 150 }) },
          iGConversation: { deleteMany: vi.fn().mockResolvedValue({ count: 15 }) },
          iGConnectionLog: { deleteMany: vi.fn().mockResolvedValue({ count: 5 }) },
          instagramAccount: { delete: vi.fn().mockResolvedValue({}) },
        };
        return callback(tx);
      });

      const result = await service.hardDisconnectInstagram(mockAccountId);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('hard');
      const counts = result.deletedCounts as InstagramDeletedCounts;
      expect(counts.messages).toBe(150);
      expect(counts.conversations).toBe(15);
      expect(counts.accountDeleted).toBe(true);
      expect(result.message).toContain('All data including account has been deleted');
    });

    it('should delete connection logs before account (foreign key constraint)', async () => {
      const callOrder: string[] = [];
      
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          iGMessage: { 
            deleteMany: vi.fn().mockImplementation(() => {
              callOrder.push('iGMessage');
              return Promise.resolve({ count: 0 });
            })
          },
          iGConversation: { 
            deleteMany: vi.fn().mockImplementation(() => {
              callOrder.push('iGConversation');
              return Promise.resolve({ count: 0 });
            })
          },
          iGConnectionLog: { 
            deleteMany: vi.fn().mockImplementation(() => {
              callOrder.push('iGConnectionLog');
              return Promise.resolve({ count: 0 });
            })
          },
          instagramAccount: { 
            delete: vi.fn().mockImplementation(() => {
              callOrder.push('instagramAccount');
              return Promise.resolve({});
            })
          },
        };
        return callback(tx);
      });

      await service.hardDisconnectInstagram(mockAccountId);

      // Connection logs should be deleted before account
      const logIndex = callOrder.indexOf('iGConnectionLog');
      const accountIndex = callOrder.indexOf('instagramAccount');
      expect(logIndex).toBeLessThan(accountIndex);
    });

    it('should rollback on error', async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'));

      await expect(service.hardDisconnectInstagram(mockAccountId)).rejects.toThrow('Database error');
    });
  });
});
