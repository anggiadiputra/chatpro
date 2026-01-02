import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    invitation: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    teamMember: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    account: {
      create: vi.fn(),
    },
  },
}));

// Mock email service
vi.mock('../../services/email/EmailService.js', () => ({
  emailService: {
    send: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock team service
vi.mock('../../services/team-service.js', () => ({
  teamService: {
    getActiveAgentCount: vi.fn().mockResolvedValue(0),
  },
}));

// Import after mocks
import { InvitationService, invitationService } from '../../services/invitation-service.js';
import { prisma } from '../../utils/database.js';
import { emailService } from '../../services/email/EmailService.js';
import { teamService } from '../../services/team-service.js';

describe('InvitationService', () => {
  let service: InvitationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InvitationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAgentLimit', () => {
    it('should return correct limits for each tier', () => {
      expect(service.getAgentLimit('FREE')).toBe(0);
      expect(service.getAgentLimit('LITE')).toBe(2);
      expect(service.getAgentLimit('PRO')).toBe(5);
    });

    it('should return 0 for unknown tier', () => {
      expect(service.getAgentLimit('UNKNOWN')).toBe(0);
    });
  });

  describe('checkAgentLimit', () => {
    it('should allow invitation when under limit', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        subscriptionTier: 'PRO',
      } as any);
      vi.mocked(teamService.getActiveAgentCount).mockResolvedValue(2);

      const result = await service.checkAgentLimit('owner_123');

      expect(result.canInvite).toBe(true);
      expect(result.currentCount).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.tier).toBe('PRO');
    });

    it('should deny invitation when at limit', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        subscriptionTier: 'LITE',
      } as any);
      vi.mocked(teamService.getActiveAgentCount).mockResolvedValue(2);

      const result = await service.checkAgentLimit('owner_123');

      expect(result.canInvite).toBe(false);
      expect(result.currentCount).toBe(2);
      expect(result.limit).toBe(2);
    });

    it('should deny invitation for FREE tier', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        subscriptionTier: 'FREE',
      } as any);
      vi.mocked(teamService.getActiveAgentCount).mockResolvedValue(0);

      const result = await service.checkAgentLimit('owner_123');

      expect(result.canInvite).toBe(false);
      expect(result.limit).toBe(0);
    });
  });


  describe('validateToken', () => {
    it('should return invitation for valid token', async () => {
      const mockInvitation = {
        id: 'inv_1',
        businessOwnerId: 'owner_123',
        email: 'agent@example.com',
        token: 'valid_token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        businessOwner: {
          id: 'owner_123',
          name: 'Business Owner',
          email: 'owner@example.com',
        },
      };

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any);

      const result = await service.validateToken('valid_token');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('agent@example.com');
    });

    it('should return null for non-existent token', async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(null);

      const result = await service.validateToken('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null and update status for expired token', async () => {
      const mockInvitation = {
        id: 'inv_1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      };

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any);
      vi.mocked(prisma.invitation.update).mockResolvedValue({} as any);

      const result = await service.validateToken('expired_token');

      expect(result).toBeNull();
      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv_1' },
        data: { status: 'EXPIRED' },
      });
    });

    it('should return null for already accepted invitation', async () => {
      const mockInvitation = {
        id: 'inv_1',
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 86400000),
      };

      vi.mocked(prisma.invitation.findUnique).mockResolvedValue(mockInvitation as any);

      const result = await service.validateToken('accepted_token');

      expect(result).toBeNull();
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel pending invitation', async () => {
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue({
        id: 'inv_1',
        status: 'PENDING',
      } as any);
      vi.mocked(prisma.invitation.update).mockResolvedValue({} as any);

      await service.cancelInvitation('owner_123', 'inv_1');

      expect(prisma.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv_1' },
        data: {
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
        },
      });
    });

    it('should throw INVITATION_NOT_FOUND when not found', async () => {
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null);

      await expect(service.cancelInvitation('owner_123', 'nonexistent')).rejects.toThrow('INVITATION_NOT_FOUND');
    });

    it('should verify ownership before cancelling', async () => {
      vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null);

      await expect(service.cancelInvitation('wrong_owner', 'inv_1')).rejects.toThrow('INVITATION_NOT_FOUND');

      expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'inv_1',
          businessOwnerId: 'wrong_owner',
          status: 'PENDING',
        },
      });
    });
  });

  describe('getPendingInvitations', () => {
    it('should return pending and failed invitations', async () => {
      const mockInvitations = [
        { id: 'inv_1', status: 'PENDING', email: 'agent1@example.com' },
        { id: 'inv_2', status: 'FAILED', email: 'agent2@example.com' },
      ];

      vi.mocked(prisma.invitation.findMany).mockResolvedValue(mockInvitations as any);

      const result = await service.getPendingInvitations('owner_123');

      expect(result).toHaveLength(2);
      expect(prisma.invitation.findMany).toHaveBeenCalledWith({
        where: {
          businessOwnerId: 'owner_123',
          status: { in: ['PENDING', 'FAILED'] },
        },
        include: {
          businessOwner: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('cleanupExpiredInvitations', () => {
    it('should update expired invitations to EXPIRED status', async () => {
      vi.mocked(prisma.invitation.updateMany).mockResolvedValue({ count: 5 });

      const result = await service.cleanupExpiredInvitations();

      expect(result).toBe(5);
      expect(prisma.invitation.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          expiresAt: { lt: expect.any(Date) },
        },
        data: {
          status: 'EXPIRED',
        },
      });
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(invitationService).toBeInstanceOf(InvitationService);
    });
  });
});
