import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    teamMember: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
  },
}));

// Import after mocks
import { TeamService, teamService } from '../../services/team-service.js';
import { prisma } from '../../utils/database.js';

describe('TeamService', () => {
  let service: TeamService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TeamService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTeamMembers', () => {
    it('should return team members with agent details', async () => {
      const mockTeamMembers = [
        {
          id: 'tm_1',
          businessOwnerId: 'owner_123',
          agentUserId: 'agent_1',
          status: 'ACTIVE',
          invitedAt: new Date(),
          joinedAt: new Date(),
          removedAt: null,
          agent: {
            id: 'agent_1',
            name: 'Agent One',
            email: 'agent1@example.com',
            image: null,
          },
        },
      ];

      vi.mocked(prisma.teamMember.findMany).mockResolvedValue(mockTeamMembers as any);

      const result = await service.getTeamMembers('owner_123');

      expect(result).toHaveLength(1);
      expect(result[0].agent?.name).toBe('Agent One');
      expect(prisma.teamMember.findMany).toHaveBeenCalledWith({
        where: {
          businessOwnerId: 'owner_123',
          status: { not: 'REMOVED' },
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          invitedAt: 'desc',
        },
      });
    });

    it('should exclude removed team members', async () => {
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

      await service.getTeamMembers('owner_123');

      expect(prisma.teamMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: 'REMOVED' },
          }),
        })
      );
    });
  });

  describe('getActiveAgentCount', () => {
    it('should return count of active agents', async () => {
      vi.mocked(prisma.teamMember.count).mockResolvedValue(3);

      const result = await service.getActiveAgentCount('owner_123');

      expect(result).toBe(3);
      expect(prisma.teamMember.count).toHaveBeenCalledWith({
        where: {
          businessOwnerId: 'owner_123',
          status: 'ACTIVE',
        },
      });
    });

    it('should return 0 when no active agents', async () => {
      vi.mocked(prisma.teamMember.count).mockResolvedValue(0);

      const result = await service.getActiveAgentCount('owner_123');

      expect(result).toBe(0);
    });
  });

  describe('removeAgent', () => {
    it('should update status to REMOVED and invalidate sessions', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
        id: 'tm_1',
        businessOwnerId: 'owner_123',
        agentUserId: 'agent_1',
        status: 'ACTIVE',
      } as any);
      vi.mocked(prisma.teamMember.update).mockResolvedValue({} as any);
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 });

      await service.removeAgent('owner_123', 'tm_1');

      expect(prisma.teamMember.update).toHaveBeenCalledWith({
        where: { id: 'tm_1' },
        data: {
          status: 'REMOVED',
          removedAt: expect.any(Date),
        },
      });
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'agent_1' },
      });
    });

    it('should throw AGENT_NOT_FOUND when team member not found', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      await expect(service.removeAgent('owner_123', 'nonexistent')).rejects.toThrow('AGENT_NOT_FOUND');
    });

    it('should verify ownership before removing', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      await expect(service.removeAgent('wrong_owner', 'tm_1')).rejects.toThrow('AGENT_NOT_FOUND');

      expect(prisma.teamMember.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'tm_1',
          businessOwnerId: 'wrong_owner',
          status: 'ACTIVE',
        },
      });
    });
  });

  describe('getBusinessOwnerIdForAgent', () => {
    it('should return business owner ID for active agent', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
        businessOwnerId: 'owner_123',
      } as any);

      const result = await service.getBusinessOwnerIdForAgent('agent_1');

      expect(result).toBe('owner_123');
      expect(prisma.teamMember.findFirst).toHaveBeenCalledWith({
        where: {
          agentUserId: 'agent_1',
          status: 'ACTIVE',
        },
        select: {
          businessOwnerId: true,
        },
      });
    });

    it('should return null when agent not found', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      const result = await service.getBusinessOwnerIdForAgent('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('isAgentOf', () => {
    it('should return true when user is active agent of business owner', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
        id: 'tm_1',
      } as any);

      const result = await service.isAgentOf('agent_1', 'owner_123');

      expect(result).toBe(true);
    });

    it('should return false when user is not agent of business owner', async () => {
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      const result = await service.isAgentOf('agent_1', 'owner_123');

      expect(result).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(teamService).toBeInstanceOf(TeamService);
    });
  });
});
