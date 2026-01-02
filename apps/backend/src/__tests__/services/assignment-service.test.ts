import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Unit Tests for AssignmentService
 * 
 * Feature: oneinbox-assignment, ai-agent-assignment
 * Tests: Core assignment functionality including AI Agent assignments
 * Validates: Requirements 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 8.3
 */

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    conversationAssignment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    teamMember: {
      findMany: vi.fn(),
    },
    aIConfig: {
      findUnique: vi.fn(),
    },
    aIAgent: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Import after mocks
import { AssignmentService, ASSIGNMENT_ERRORS, AI_ASSIGNMENT_ERRORS } from '../../services/assignment-service.js';
import { prisma } from '../../utils/database.js';

describe('AssignmentService', () => {
  let service: AssignmentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AssignmentService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAssignment', () => {
    it('should return current active assignment', async () => {
      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'user_1',
        aiAgentId: null,
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'user_1', name: 'Agent One', image: null },
        aiAgent: null,
        assignedBy: { id: 'owner_1', name: 'Owner' },
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const result = await service.getAssignment('conv_123', 'WHATSAPP', 'owner_1');

      expect(result).not.toBeNull();
      expect(result?.assigneeId).toBe('user_1');
      expect(result?.assigneeName).toBe('Agent One');
      expect(result?.assigneeType).toBe('HUMAN');
      expect(prisma.conversationAssignment.findFirst).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv_123',
          conversationType: 'WHATSAPP',
          businessOwnerId: 'owner_1',
          unassignedAt: null,
        },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          aiAgent: { select: { id: true, name: true } },
          assignedBy: { select: { id: true, name: true } },
        },
      });
    });

    it('should return null when no active assignment exists', async () => {
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      const result = await service.getAssignment('conv_123', 'WHATSAPP', 'owner_1');

      expect(result).toBeNull();
    });
  });

  describe('assignConversation', () => {
    it('should assign conversation to Business Owner', async () => {
      const mockNewAssignment = {
        id: 'assignment_new',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'owner_1',
        aiAgentId: null,
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'owner_1', name: 'Business Owner', image: null },
        assignedBy: { id: 'owner_1', name: 'Business Owner' },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockNewAssignment),
          },
        };
        return callback(tx);
      });

      // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

      const result = await service.assignConversation(
        'conv_123',
        'WHATSAPP',
        'owner_1',
        'owner_1',
        'owner_1'
      );

      expect(result.assigneeId).toBe('owner_1');
      expect(result.assigneeName).toBe('Business Owner');
      expect(result.assigneeType).toBe('HUMAN');
    });

    it('should assign conversation to Agent', async () => {
      const mockNewAssignment = {
        id: 'assignment_new',
        conversationId: 'conv_123',
        conversationType: 'INSTAGRAM',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_1',
        aiAgentId: null,
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        assignedBy: { id: 'owner_1', name: 'Business Owner' },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockNewAssignment),
          },
        };
        return callback(tx);
      });

      // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

      const result = await service.assignConversation(
        'conv_123',
        'INSTAGRAM',
        'agent_1',
        'owner_1',
        'owner_1'
      );

      expect(result.assigneeId).toBe('agent_1');
      expect(result.conversationType).toBe('INSTAGRAM');
      expect(result.assigneeType).toBe('HUMAN');
    });

    it('should create history when re-assigning (unassign previous)', async () => {
      const existingAssignment = {
        id: 'assignment_old',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_1',
        aiAgentId: null,
        unassignedAt: null,
      };

      const mockNewAssignment = {
        id: 'assignment_new',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_2',
        aiAgentId: null,
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_2', name: 'Agent Two', image: null },
        assignedBy: { id: 'owner_1', name: 'Business Owner' },
      };

      let updateCalled = false;

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(existingAssignment),
            update: vi.fn().mockImplementation(async (query: any) => {
              updateCalled = true;
              expect(query.where.id).toBe('assignment_old');
              expect(query.data.unassignedAt).toBeInstanceOf(Date);
              return { ...existingAssignment, unassignedAt: query.data.unassignedAt };
            }),
            create: vi.fn().mockResolvedValue(mockNewAssignment),
          },
        };
        return callback(tx);
      });

      // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

      const result = await service.assignConversation(
        'conv_123',
        'WHATSAPP',
        'agent_2',
        'owner_1',
        'owner_1'
      );

      expect(updateCalled).toBe(true);
      expect(result.assigneeId).toBe('agent_2');
    });

    it('should throw ALREADY_ASSIGNED when assigning to same user', async () => {
      const existingAssignment = {
        id: 'assignment_old',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_1',
        aiAgentId: null,
        unassignedAt: null,
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(existingAssignment),
          },
        };
        return callback(tx);
      });

      await expect(
        service.assignConversation('conv_123', 'WHATSAPP', 'agent_1', 'owner_1', 'owner_1')
      ).rejects.toThrow(ASSIGNMENT_ERRORS.ALREADY_ASSIGNED);
    });
  });

  describe('unassignConversation', () => {
    it('should set unassignedAt timestamp when unassigning', async () => {
      const existingAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_1',
        unassignedAt: null,
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(existingAssignment as any);
      vi.mocked(prisma.conversationAssignment.update).mockImplementation(async (query: any) => {
        expect(query.data.unassignedAt).toBeInstanceOf(Date);
        return { ...existingAssignment, unassignedAt: query.data.unassignedAt } as any;
      });

      // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

      await service.unassignConversation('conv_123', 'WHATSAPP', 'owner_1', 'owner_1');

      expect(prisma.conversationAssignment.update).toHaveBeenCalledWith({
        where: { id: 'assignment_1' },
        data: { unassignedAt: expect.any(Date) },
      });
    });

    it('should throw NOT_ASSIGNED when no active assignment exists', async () => {
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      await expect(
        service.unassignConversation('conv_123', 'WHATSAPP', 'owner_1', 'owner_1')
      ).rejects.toThrow(ASSIGNMENT_ERRORS.NOT_ASSIGNED);
    });
  });

  describe('getAssignmentHistory', () => {
    it('should return history ordered by assignedAt descending (newest first)', async () => {
      const mockHistory = [
        {
          id: 'assignment_3',
          conversationId: 'conv_123',
          conversationType: 'WHATSAPP',
          assigneeType: 'HUMAN',
          assigneeId: 'agent_3',
          aiAgentId: null,
          assignedById: 'owner_1',
          businessOwnerId: 'owner_1',
          assignedAt: new Date('2024-01-03'),
          unassignedAt: null,
          assignee: { id: 'agent_3', name: 'Agent Three', image: null },
          aiAgent: null,
          assignedBy: { id: 'owner_1', name: 'Owner' },
        },
        {
          id: 'assignment_2',
          conversationId: 'conv_123',
          conversationType: 'WHATSAPP',
          assigneeType: 'HUMAN',
          assigneeId: 'agent_2',
          aiAgentId: null,
          assignedById: 'owner_1',
          businessOwnerId: 'owner_1',
          assignedAt: new Date('2024-01-02'),
          unassignedAt: new Date('2024-01-03'),
          assignee: { id: 'agent_2', name: 'Agent Two', image: null },
          aiAgent: null,
          assignedBy: { id: 'owner_1', name: 'Owner' },
        },
        {
          id: 'assignment_1',
          conversationId: 'conv_123',
          conversationType: 'WHATSAPP',
          assigneeType: 'HUMAN',
          assigneeId: 'agent_1',
          aiAgentId: null,
          assignedById: 'owner_1',
          businessOwnerId: 'owner_1',
          assignedAt: new Date('2024-01-01'),
          unassignedAt: new Date('2024-01-02'),
          assignee: { id: 'agent_1', name: 'Agent One', image: null },
          aiAgent: null,
          assignedBy: { id: 'owner_1', name: 'Owner' },
        },
      ];

      vi.mocked(prisma.conversationAssignment.findMany).mockResolvedValue(mockHistory as any);

      const result = await service.getAssignmentHistory('conv_123', 'WHATSAPP', 'owner_1');

      expect(result).toHaveLength(3);
      // Verify ordering: newest first
      expect(result[0].assigneeId).toBe('agent_3');
      expect(result[1].assigneeId).toBe('agent_2');
      expect(result[2].assigneeId).toBe('agent_1');

      expect(prisma.conversationAssignment.findMany).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv_123',
          conversationType: 'WHATSAPP',
          businessOwnerId: 'owner_1',
        },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          aiAgent: { select: { id: true, name: true } },
          assignedBy: { select: { id: true, name: true } },
        },
        orderBy: { assignedAt: 'desc' },
      });
    });

    it('should return empty array when no history exists', async () => {
      vi.mocked(prisma.conversationAssignment.findMany).mockResolvedValue([]);

      const result = await service.getAssignmentHistory('conv_123', 'WHATSAPP', 'owner_1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getAssignableUsers', () => {
    it('should return business owner and active agents', async () => {
      const mockOwner = {
        id: 'owner_1',
        name: 'Business Owner',
        email: 'owner@example.com',
        image: null,
        role: 'BUSINESS_OWNER',
      };

      const mockTeamMembers = [
        {
          id: 'tm_1',
          businessOwnerId: 'owner_1',
          agentUserId: 'agent_1',
          status: 'ACTIVE',
          agent: {
            id: 'agent_1',
            name: 'Agent One',
            email: 'agent1@example.com',
            image: null,
            role: 'AGENT',
          },
        },
        {
          id: 'tm_2',
          businessOwnerId: 'owner_1',
          agentUserId: 'agent_2',
          status: 'ACTIVE',
          agent: {
            id: 'agent_2',
            name: 'Agent Two',
            email: 'agent2@example.com',
            image: 'https://example.com/avatar.jpg',
            role: 'AGENT',
          },
        },
      ];

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOwner as any);
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue(mockTeamMembers as any);

      const result = await service.getAssignableUsers('owner_1');

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('owner_1');
      expect(result[0].role).toBe('BUSINESS_OWNER');
      expect(result[1].id).toBe('agent_1');
      expect(result[2].id).toBe('agent_2');
    });

    it('should return empty array when business owner not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await service.getAssignableUsers('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', async () => {
      const { assignmentService } = await import('../../services/assignment-service.js');
      expect(assignmentService).toBeInstanceOf(AssignmentService);
    });
  });

  describe('assignToAIAgent', () => {
    it('should assign conversation to AI Agent', async () => {
      const mockNewAssignment = {
        id: 'assignment_new',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'AI_AGENT',
        assigneeId: null,
        aiAgentId: 'ai_agent_1',
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        aiAgent: { id: 'ai_agent_1', name: 'Support Bot' },
        assignedBy: { id: 'owner_1', name: 'Business Owner' },
      };

      // Mock AI enabled
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'ai_config_1',
        userId: 'owner_1',
        enabled: true,
      } as any);

      // Mock AI Agent exists
      vi.mocked(prisma.aIAgent.findFirst).mockResolvedValue({
        id: 'ai_agent_1',
        name: 'Support Bot',
        userId: 'owner_1',
      } as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockNewAssignment),
          },
        };
        return callback(tx);
      });

      // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

      const result = await service.assignToAIAgent(
        'conv_123',
        'WHATSAPP',
        'ai_agent_1',
        'owner_1',
        'owner_1'
      );

      expect(result.aiAgentId).toBe('ai_agent_1');
      expect(result.aiAgentName).toBe('Support Bot');
      expect(result.assigneeType).toBe('AI_AGENT');
      expect(result.assigneeId).toBeNull();
    });

    it('should throw AI_DISABLED when AI is not enabled', async () => {
      // Mock AI disabled
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'ai_config_1',
        userId: 'owner_1',
        enabled: false,
      } as any);

      await expect(
        service.assignToAIAgent('conv_123', 'WHATSAPP', 'ai_agent_1', 'owner_1', 'owner_1')
      ).rejects.toThrow(AI_ASSIGNMENT_ERRORS.AI_DISABLED);
    });

    it('should throw AI_AGENT_NOT_FOUND when AI Agent does not exist', async () => {
      // Mock AI enabled
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'ai_config_1',
        userId: 'owner_1',
        enabled: true,
      } as any);

      // Mock AI Agent not found
      vi.mocked(prisma.aIAgent.findFirst).mockResolvedValue(null);

      await expect(
        service.assignToAIAgent('conv_123', 'WHATSAPP', 'nonexistent', 'owner_1', 'owner_1')
      ).rejects.toThrow(AI_ASSIGNMENT_ERRORS.AI_AGENT_NOT_FOUND);
    });

    it('should throw AI_AGENT_REQUIRED when aiAgentId is empty', async () => {
      await expect(
        service.assignToAIAgent('conv_123', 'WHATSAPP', '', 'owner_1', 'owner_1')
      ).rejects.toThrow(AI_ASSIGNMENT_ERRORS.AI_AGENT_REQUIRED);
    });

    it('should unassign previous human assignment when assigning to AI Agent', async () => {
      const existingAssignment = {
        id: 'assignment_old',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_1',
        aiAgentId: null,
        unassignedAt: null,
      };

      const mockNewAssignment = {
        id: 'assignment_new',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'AI_AGENT',
        assigneeId: null,
        aiAgentId: 'ai_agent_1',
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        aiAgent: { id: 'ai_agent_1', name: 'Support Bot' },
        assignedBy: { id: 'owner_1', name: 'Business Owner' },
      };

      // Mock AI enabled
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'ai_config_1',
        userId: 'owner_1',
        enabled: true,
      } as any);

      // Mock AI Agent exists
      vi.mocked(prisma.aIAgent.findFirst).mockResolvedValue({
        id: 'ai_agent_1',
        name: 'Support Bot',
        userId: 'owner_1',
      } as any);

      let updateCalled = false;

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(existingAssignment),
            update: vi.fn().mockImplementation(async (query: any) => {
              updateCalled = true;
              expect(query.where.id).toBe('assignment_old');
              expect(query.data.unassignedAt).toBeInstanceOf(Date);
              return { ...existingAssignment, unassignedAt: query.data.unassignedAt };
            }),
            create: vi.fn().mockResolvedValue(mockNewAssignment),
          },
        };
        return callback(tx);
      });

      // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

      const result = await service.assignToAIAgent(
        'conv_123',
        'WHATSAPP',
        'ai_agent_1',
        'owner_1',
        'owner_1'
      );

      expect(updateCalled).toBe(true);
      expect(result.aiAgentId).toBe('ai_agent_1');
      expect(result.assigneeType).toBe('AI_AGENT');
    });
  });

  describe('shouldAIRespond', () => {
    it('should return false when assigned to human', async () => {
      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_1',
        aiAgentId: null,
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        aiAgent: null,
        assignedBy: { id: 'owner_1', name: 'Owner' },
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const result = await service.shouldAIRespond('conv_123', 'WHATSAPP', 'owner_1');

      expect(result.shouldRespond).toBe(false);
      expect(result.reason).toBe('assigned_to_human');
      expect(result.aiAgentId).toBeNull();
    });

    it('should return true with AI Agent ID when assigned to AI Agent', async () => {
      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'AI_AGENT',
        assigneeId: null,
        aiAgentId: 'ai_agent_1',
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: null,
        aiAgent: { id: 'ai_agent_1', name: 'Support Bot' },
        assignedBy: { id: 'owner_1', name: 'Owner' },
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const result = await service.shouldAIRespond('conv_123', 'WHATSAPP', 'owner_1');

      expect(result.shouldRespond).toBe(true);
      expect(result.reason).toBe('assigned_to_ai');
      expect(result.aiAgentId).toBe('ai_agent_1');
      expect(result.aiAgentName).toBe('Support Bot');
    });

    it('should return true with default agent when unassigned and AI enabled', async () => {
      // Mock no assignment
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // Mock AI enabled with active agent
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'ai_config_1',
        userId: 'owner_1',
        enabled: true,
        activeAgentId: 'default_agent',
        activeAgent: { id: 'default_agent', name: 'Default Bot' },
      } as any);

      const result = await service.shouldAIRespond('conv_123', 'WHATSAPP', 'owner_1');

      expect(result.shouldRespond).toBe(true);
      expect(result.reason).toBe('unassigned_ai_enabled');
      expect(result.aiAgentId).toBe('default_agent');
      expect(result.aiAgentName).toBe('Default Bot');
    });

    it('should return false when unassigned and AI disabled', async () => {
      // Mock no assignment
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // Mock AI disabled
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'ai_config_1',
        userId: 'owner_1',
        enabled: false,
        activeAgentId: null,
        activeAgent: null,
      } as any);

      const result = await service.shouldAIRespond('conv_123', 'WHATSAPP', 'owner_1');

      expect(result.shouldRespond).toBe(false);
      expect(result.reason).toBe('ai_disabled');
      expect(result.aiAgentId).toBeNull();
    });

    it('should return false when unassigned and no AI config exists', async () => {
      // Mock no assignment
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // Mock no AI config
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue(null);

      const result = await service.shouldAIRespond('conv_123', 'WHATSAPP', 'owner_1');

      expect(result.shouldRespond).toBe(false);
      expect(result.reason).toBe('ai_disabled');
      expect(result.aiAgentId).toBeNull();
    });
  });
});
