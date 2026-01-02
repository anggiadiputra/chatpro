import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AIOrchestrator } from '../../services/ai/AIOrchestrator.js';
import { assignmentService } from '../../services/assignment-service.js';

/**
 * Integration Tests for Webhook AI Response Decision
 * 
 * Feature: ai-agent-assignment
 * Tests: AI response decision based on assignment status
 * Validates: Requirements 6.2, 6.3, 6.4
 */

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    conversationAssignment: {
      findFirst: vi.fn(),
    },
    aIConfig: {
      findUnique: vi.fn(),
    },
    aIAgent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    knowledgeDocument: {
      update: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
  },
}));

// Mock settings cache
vi.mock('../../services/settings-cache.js', () => ({
  settingsCache: {
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
  },
  CACHE_KEYS: {
    openai: () => 'openai',
  },
  CACHE_TTL: {
    settings: 300,
  },
}));

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock WebSocket event emitter
vi.mock('../../websocket/event-emitter.js', () => ({
  eventEmitter: {
    emitAssignmentChangedToUsers: vi.fn(),
  },
}));

// Import mocked modules
import { prisma } from '../../utils/database.js';
import { settingsCache } from '../../services/settings-cache.js';

describe('Webhook AI Response Decision Integration Tests', () => {
  let aiOrchestrator: AIOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    aiOrchestrator = new AIOrchestrator();
    
    // Mock OpenAI settings
    vi.mocked(settingsCache.get).mockReturnValue({
      apiKey: 'test-api-key-12345',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('shouldAIRespond - Assignment Status Check', () => {
    /**
     * Test: Human assignment skips AI
     * Validates: Requirement 6.2
     */
    it('should return shouldRespond=false when conversation is assigned to human', async () => {
      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_1',
        aiAgentId: null,
        businessOwnerId: 'owner_1',
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        aiAgent: null,
        assignedBy: { id: 'owner_1', name: 'Owner' },
        assignedAt: new Date(),
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const decision = await assignmentService.shouldAIRespond(
        'conv_123',
        'WHATSAPP',
        'owner_1'
      );

      expect(decision.shouldRespond).toBe(false);
      expect(decision.reason).toBe('assigned_to_human');
      expect(decision.aiAgentId).toBeNull();
      expect(decision.aiAgentName).toBeNull();
    });

    /**
     * Test: AI Agent assignment uses correct agent
     * Validates: Requirement 6.3
     */
    it('should return shouldRespond=true with aiAgentId when assigned to AI Agent', async () => {
      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'AI_AGENT',
        assigneeId: null,
        aiAgentId: 'ai_agent_1',
        businessOwnerId: 'owner_1',
        unassignedAt: null,
        assignee: null,
        aiAgent: { id: 'ai_agent_1', name: 'Sales Bot' },
        assignedBy: { id: 'owner_1', name: 'Owner' },
        assignedAt: new Date(),
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const decision = await assignmentService.shouldAIRespond(
        'conv_123',
        'WHATSAPP',
        'owner_1'
      );

      expect(decision.shouldRespond).toBe(true);
      expect(decision.reason).toBe('assigned_to_ai');
      expect(decision.aiAgentId).toBe('ai_agent_1');
      expect(decision.aiAgentName).toBe('Sales Bot');
    });

    /**
     * Test: Unassigned uses default agent when AI enabled
     * Validates: Requirement 6.4
     */
    it('should return shouldRespond=true with default agent when unassigned and AI enabled', async () => {
      // No assignment exists
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // AI is enabled with active agent
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'config_1',
        userId: 'owner_1',
        enabled: true,
        activeAgentId: 'default_agent_1',
        activeAgent: { id: 'default_agent_1', name: 'Default Bot' },
      } as any);

      const decision = await assignmentService.shouldAIRespond(
        'conv_123',
        'WHATSAPP',
        'owner_1'
      );

      expect(decision.shouldRespond).toBe(true);
      expect(decision.reason).toBe('unassigned_ai_enabled');
      expect(decision.aiAgentId).toBe('default_agent_1');
      expect(decision.aiAgentName).toBe('Default Bot');
    });

    /**
     * Test: Unassigned with AI disabled
     */
    it('should return shouldRespond=false when unassigned and AI disabled', async () => {
      // No assignment exists
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // AI is disabled
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'config_1',
        userId: 'owner_1',
        enabled: false,
        activeAgentId: null,
        activeAgent: null,
      } as any);

      const decision = await assignmentService.shouldAIRespond(
        'conv_123',
        'WHATSAPP',
        'owner_1'
      );

      expect(decision.shouldRespond).toBe(false);
      expect(decision.reason).toBe('ai_disabled');
      expect(decision.aiAgentId).toBeNull();
    });

    /**
     * Test: Unassigned with AI enabled but no active agent
     */
    it('should return shouldRespond=false when AI enabled but no active agent', async () => {
      // No assignment exists
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // AI is enabled but no active agent
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'config_1',
        userId: 'owner_1',
        enabled: true,
        activeAgentId: null,
        activeAgent: null,
      } as any);

      const decision = await assignmentService.shouldAIRespond(
        'conv_123',
        'WHATSAPP',
        'owner_1'
      );

      expect(decision.shouldRespond).toBe(false);
      expect(decision.reason).toBe('ai_disabled');
      expect(decision.aiAgentId).toBeNull();
    });
  });

  describe('handleMessageWithAssignmentCheck - Full Flow', () => {
    /**
     * Test: Human assignment skips AI response
     * Validates: Requirement 6.2
     */
    it('should return null when conversation is assigned to human', async () => {
      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_1',
        aiAgentId: null,
        businessOwnerId: 'owner_1',
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        aiAgent: null,
        assignedBy: { id: 'owner_1', name: 'Owner' },
        assignedAt: new Date(),
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const response = await aiOrchestrator.handleMessageWithAssignmentCheck(
        'owner_1',
        'Hello, I need help',
        'conv_123',
        'WHATSAPP',
        'customer_1'
      );

      expect(response).toBeNull();
    });

    /**
     * Test: AI disabled globally skips AI response
     */
    it('should return null when AI is disabled globally', async () => {
      // No assignment
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // AI disabled
      vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
        id: 'config_1',
        userId: 'owner_1',
        enabled: false,
        activeAgentId: null,
        activeAgent: null,
      } as any);

      const response = await aiOrchestrator.handleMessageWithAssignmentCheck(
        'owner_1',
        'Hello, I need help',
        'conv_123',
        'WHATSAPP',
        'customer_1'
      );

      expect(response).toBeNull();
    });
  });

  describe('Instagram Conversation Assignment', () => {
    /**
     * Test: Instagram conversation assigned to human skips AI
     * Validates: Requirement 6.2 for Instagram
     */
    it('should return shouldRespond=false for Instagram conversation assigned to human', async () => {
      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'ig_conv_123',
        conversationType: 'INSTAGRAM',
        assigneeType: 'HUMAN',
        assigneeId: 'agent_1',
        aiAgentId: null,
        businessOwnerId: 'owner_1',
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        aiAgent: null,
        assignedBy: { id: 'owner_1', name: 'Owner' },
        assignedAt: new Date(),
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const decision = await assignmentService.shouldAIRespond(
        'ig_conv_123',
        'INSTAGRAM',
        'owner_1'
      );

      expect(decision.shouldRespond).toBe(false);
      expect(decision.reason).toBe('assigned_to_human');
    });

    /**
     * Test: Instagram conversation assigned to AI Agent uses correct agent
     * Validates: Requirement 6.3 for Instagram
     */
    it('should return shouldRespond=true with aiAgentId for Instagram AI assignment', async () => {
      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'ig_conv_123',
        conversationType: 'INSTAGRAM',
        assigneeType: 'AI_AGENT',
        assigneeId: null,
        aiAgentId: 'ai_agent_2',
        businessOwnerId: 'owner_1',
        unassignedAt: null,
        assignee: null,
        aiAgent: { id: 'ai_agent_2', name: 'Instagram Support Bot' },
        assignedBy: { id: 'owner_1', name: 'Owner' },
        assignedAt: new Date(),
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const decision = await assignmentService.shouldAIRespond(
        'ig_conv_123',
        'INSTAGRAM',
        'owner_1'
      );

      expect(decision.shouldRespond).toBe(true);
      expect(decision.reason).toBe('assigned_to_ai');
      expect(decision.aiAgentId).toBe('ai_agent_2');
      expect(decision.aiAgentName).toBe('Instagram Support Bot');
    });
  });
});
