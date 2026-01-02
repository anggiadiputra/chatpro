import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property-Based Tests for AIOrchestrator
 * 
 * Feature: ai-agent-assignment
 * Property 4: AI Agent Configuration Usage
 * Validates: Requirements 3.1, 3.3, 3.4
 */

// Mock dependencies - must be defined before vi.mock
vi.mock('../../utils/database.js', () => ({
  prisma: {
    aIConfig: {
      findUnique: vi.fn(),
    },
    aIAgent: {
      findUnique: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
    },
    knowledgeDocument: {
      update: vi.fn(),
    },
  },
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../settings-cache.js', () => ({
  settingsCache: {
    get: vi.fn().mockReturnValue({ apiKey: 'sk-test-mock-api-key-12345' }),
    set: vi.fn(),
    invalidate: vi.fn(),
  },
  CACHE_KEYS: {
    openai: () => 'openai_settings',
  },
  CACHE_TTL: {
    settings: 300,
  },
}));

// Mock admin settings service
vi.mock('../admin/settings-service.js', () => ({
  adminSettingsService: {
    getSettings: vi.fn().mockResolvedValue({
      data: { apiKey: 'sk-test-mock-api-key-12345' },
      source: 'database',
    }),
  },
}));

// Set environment variable for fallback
process.env.OPENAI_API_KEY = 'sk-test-mock-api-key-12345';

// Mock OpenAI Provider
vi.mock('../../services/ai/providers/OpenAIProvider.js', () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => ({
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    generateEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    generateResponse: vi.fn().mockResolvedValue('AI response'),
  })),
}));

// Mock Vector Store
vi.mock('../../services/ai/vector/PgVectorStore.js', () => ({
  PgVectorStore: vi.fn().mockImplementation(() => ({
    addDocument: vi.fn(),
    similaritySearch: vi.fn().mockResolvedValue([]),
  })),
}));

// Mock assignment service
vi.mock('../../services/assignment-service.js', () => ({
  assignmentService: {
    shouldAIRespond: vi.fn(),
  },
}));

// Import after mocks
import { AIOrchestrator } from '../../services/ai/AIOrchestrator.js';
import { prisma } from '../../utils/database.js';
import { OpenAIProvider } from '../../services/ai/providers/OpenAIProvider.js';
import { assignmentService } from '../../services/assignment-service.js';

// Arbitraries for generating test data
const userIdArb = fc.uuid();
const aiAgentIdArb = fc.uuid();
const conversationIdArb = fc.uuid();
const messageArb = fc.string({ minLength: 1, maxLength: 200 });
const systemPromptArb = fc.string({ minLength: 10, maxLength: 500 });
const agentNameArb = fc.string({ minLength: 1, maxLength: 50 });
const conversationTypeArb = fc.constantFrom('WHATSAPP', 'INSTAGRAM') as fc.Arbitrary<'WHATSAPP' | 'INSTAGRAM'>;

describe('AIOrchestrator Property Tests', () => {
  let orchestrator: AIOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new AIOrchestrator();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });


  describe('Property 4: AI Agent Configuration Usage', () => {
    /**
     * Property 4: AI Agent Configuration Usage
     * For any conversation assigned to a specific AI Agent, the AI Orchestrator SHALL use
     * that AI Agent's configuration (system prompt, knowledge documents) for response generation,
     * NOT the default active agent.
     * 
     * Feature: ai-agent-assignment
     * **Validates: Requirements 3.1, 3.3, 3.4**
     */
    it('should use override AI Agent configuration when aiAgentIdOverride is provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          aiAgentIdArb, // overrideAgentId
          aiAgentIdArb, // defaultAgentId (different from override)
          messageArb,
          systemPromptArb, // overrideSystemPrompt
          systemPromptArb, // defaultSystemPrompt
          agentNameArb, // overrideAgentName
          agentNameArb, // defaultAgentName
          async (
            userId,
            overrideAgentId,
            defaultAgentId,
            message,
            overrideSystemPrompt,
            defaultSystemPrompt,
            overrideAgentName,
            defaultAgentName
          ) => {
            // Skip if same agent IDs
            if (overrideAgentId === defaultAgentId) return;

            // Track which agent was used
            let usedAgentId: string | null = null;
            let usedSystemPrompt: string | null = null;

            // Mock AI config with default active agent
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId,
              enabled: true,
              activeAgentId: defaultAgentId,
              model: 'gpt-4',
              systemPrompt: 'Default system prompt',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Mock AI Agent lookup - return the override agent when queried
            vi.mocked(prisma.aIAgent.findUnique).mockImplementation(async (query: any) => {
              const queriedId = query.where.id;
              usedAgentId = queriedId;

              if (queriedId === overrideAgentId) {
                usedSystemPrompt = overrideSystemPrompt;
                return {
                  id: overrideAgentId,
                  name: overrideAgentName,
                  userId,
                  systemPrompt: overrideSystemPrompt,
                  knowledgeDocuments: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as any;
              } else if (queriedId === defaultAgentId) {
                usedSystemPrompt = defaultSystemPrompt;
                return {
                  id: defaultAgentId,
                  name: defaultAgentName,
                  userId,
                  systemPrompt: defaultSystemPrompt,
                  knowledgeDocuments: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                } as any;
              }
              return null;
            });

            // Mock message history
            vi.mocked(prisma.message.findMany).mockResolvedValue([]);

            // Call handleMessage with override
            await orchestrator.handleMessage(userId, message, undefined, overrideAgentId);

            // Property: Should use the override agent, not the default (Requirement 3.3, 3.4)
            expect(usedAgentId).toBe(overrideAgentId);
            expect(usedSystemPrompt).toBe(overrideSystemPrompt);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default active agent when no aiAgentIdOverride is provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          aiAgentIdArb, // defaultAgentId
          messageArb,
          systemPromptArb, // defaultSystemPrompt
          agentNameArb, // defaultAgentName
          async (userId, defaultAgentId, message, defaultSystemPrompt, defaultAgentName) => {
            // Track which agent was used
            let usedAgentId: string | null = null;

            // Mock AI config with default active agent
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId,
              enabled: true,
              activeAgentId: defaultAgentId,
              model: 'gpt-4',
              systemPrompt: 'Default system prompt',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Mock AI Agent lookup
            vi.mocked(prisma.aIAgent.findUnique).mockImplementation(async (query: any) => {
              usedAgentId = query.where.id;
              return {
                id: defaultAgentId,
                name: defaultAgentName,
                userId,
                systemPrompt: defaultSystemPrompt,
                knowledgeDocuments: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any;
            });

            // Mock message history
            vi.mocked(prisma.message.findMany).mockResolvedValue([]);

            // Call handleMessage WITHOUT override
            await orchestrator.handleMessage(userId, message);

            // Property: Should use the default active agent (Requirement 3.1)
            expect(usedAgentId).toBe(defaultAgentId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when override AI Agent does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          aiAgentIdArb, // nonExistentAgentId
          aiAgentIdArb, // defaultAgentId
          messageArb,
          async (userId, nonExistentAgentId, defaultAgentId, message) => {
            // Skip if same agent IDs
            if (nonExistentAgentId === defaultAgentId) return;

            // Mock AI config with default active agent
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId,
              enabled: true,
              activeAgentId: defaultAgentId,
              model: 'gpt-4',
              systemPrompt: 'Default system prompt',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Mock AI Agent lookup - return null for non-existent agent
            vi.mocked(prisma.aIAgent.findUnique).mockResolvedValue(null);

            // Call handleMessage with non-existent override
            const result = await orchestrator.handleMessage(userId, message, undefined, nonExistentAgentId);

            // Property: Should return null when override agent doesn't exist
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when AI is disabled even with override', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          aiAgentIdArb, // overrideAgentId
          messageArb,
          async (userId, overrideAgentId, message) => {
            // Mock AI config with AI disabled
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId,
              enabled: false, // AI is disabled
              activeAgentId: null,
              model: 'gpt-4',
              systemPrompt: 'Default system prompt',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Call handleMessage with override
            const result = await orchestrator.handleMessage(userId, message, undefined, overrideAgentId);

            // Property: Should return null when AI is disabled
            expect(result).toBeNull();

            // Property: Should NOT query for AI Agent when AI is disabled
            expect(prisma.aIAgent.findUnique).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: AI Disabled for Human Assignments', () => {
    /**
     * Property 3: AI Disabled for Human Assignments
     * For any conversation assigned to a human user, the AI Orchestrator SHALL NOT
     * generate a response when handleMessageWithAssignmentCheck is called.
     * 
     * Feature: ai-agent-assignment
     * **Validates: Requirements 2.1, 2.2, 2.4**
     */
    it('should return null when conversation is assigned to human', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          conversationIdArb,
          conversationTypeArb,
          messageArb,
          agentNameArb, // humanAssigneeName
          async (userId, conversationId, conversationType, message, humanAssigneeName) => {
            // Mock shouldAIRespond to return assigned_to_human decision (Requirement 2.1, 2.2)
            vi.mocked(assignmentService.shouldAIRespond).mockResolvedValue({
              shouldRespond: false,
              reason: 'assigned_to_human',
              aiAgentId: null,
              aiAgentName: null,
            });

            // Call handleMessageWithAssignmentCheck
            const result = await orchestrator.handleMessageWithAssignmentCheck(
              userId,
              message,
              conversationId,
              conversationType
            );

            // Property: Should return null when assigned to human (Requirement 2.1, 2.2)
            expect(result).toBeNull();

            // Property: Should have called shouldAIRespond with correct params
            expect(assignmentService.shouldAIRespond).toHaveBeenCalledWith(
              conversationId,
              conversationType,
              userId
            );

            // Property: Should NOT call handleMessage (no AI response generated)
            // We verify this by checking that AIConfig was not queried
            // (handleMessage queries AIConfig first)
            expect(prisma.aIConfig.findUnique).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should call handleMessage with aiAgentId when assigned to AI Agent', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          conversationIdArb,
          conversationTypeArb,
          aiAgentIdArb,
          messageArb,
          agentNameArb, // aiAgentName
          systemPromptArb,
          async (userId, conversationId, conversationType, aiAgentId, message, aiAgentName, systemPrompt) => {
            // Reset mocks for this test
            vi.clearAllMocks();

            // Mock shouldAIRespond to return assigned_to_ai decision (Requirement 3.1)
            vi.mocked(assignmentService.shouldAIRespond).mockResolvedValue({
              shouldRespond: true,
              reason: 'assigned_to_ai',
              aiAgentId,
              aiAgentName,
            });

            // Mock AI config
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId,
              enabled: true,
              activeAgentId: 'default_agent_id', // Different from assigned agent
              model: 'gpt-4',
              systemPrompt: 'Default system prompt',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Track which agent was used
            let usedAgentId: string | null = null;

            // Mock AI Agent lookup
            vi.mocked(prisma.aIAgent.findUnique).mockImplementation(async (query: any) => {
              usedAgentId = query.where.id;
              return {
                id: aiAgentId,
                name: aiAgentName,
                userId,
                systemPrompt,
                knowledgeDocuments: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any;
            });

            // Mock message history
            vi.mocked(prisma.message.findMany).mockResolvedValue([]);

            // Call handleMessageWithAssignmentCheck
            const result = await orchestrator.handleMessageWithAssignmentCheck(
              userId,
              message,
              conversationId,
              conversationType
            );

            // Property: Should have called shouldAIRespond
            expect(assignmentService.shouldAIRespond).toHaveBeenCalledWith(
              conversationId,
              conversationType,
              userId
            );

            // Property: Should use the assigned AI Agent (Requirement 3.1)
            expect(usedAgentId).toBe(aiAgentId);

            // Property: Should return AI response (not null)
            expect(result).toBe('AI response');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use default agent when unassigned and AI enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          conversationIdArb,
          conversationTypeArb,
          aiAgentIdArb, // defaultAgentId
          messageArb,
          agentNameArb, // defaultAgentName
          systemPromptArb,
          async (userId, conversationId, conversationType, defaultAgentId, message, defaultAgentName, systemPrompt) => {
            // Reset mocks for this test
            vi.clearAllMocks();

            // Mock shouldAIRespond to return unassigned_ai_enabled decision (Requirement 3.2)
            vi.mocked(assignmentService.shouldAIRespond).mockResolvedValue({
              shouldRespond: true,
              reason: 'unassigned_ai_enabled',
              aiAgentId: defaultAgentId,
              aiAgentName: defaultAgentName,
            });

            // Mock AI config
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId,
              enabled: true,
              activeAgentId: defaultAgentId,
              model: 'gpt-4',
              systemPrompt: 'Default system prompt',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Track which agent was used
            let usedAgentId: string | null = null;

            // Mock AI Agent lookup
            vi.mocked(prisma.aIAgent.findUnique).mockImplementation(async (query: any) => {
              usedAgentId = query.where.id;
              return {
                id: defaultAgentId,
                name: defaultAgentName,
                userId,
                systemPrompt,
                knowledgeDocuments: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any;
            });

            // Mock message history
            vi.mocked(prisma.message.findMany).mockResolvedValue([]);

            // Call handleMessageWithAssignmentCheck
            const result = await orchestrator.handleMessageWithAssignmentCheck(
              userId,
              message,
              conversationId,
              conversationType
            );

            // Property: Should have called shouldAIRespond
            expect(assignmentService.shouldAIRespond).toHaveBeenCalledWith(
              conversationId,
              conversationType,
              userId
            );

            // Property: Should use the default agent (Requirement 3.2)
            expect(usedAgentId).toBe(defaultAgentId);

            // Property: Should return AI response (not null)
            expect(result).toBe('AI response');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null when AI is globally disabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb,
          conversationIdArb,
          conversationTypeArb,
          messageArb,
          async (userId, conversationId, conversationType, message) => {
            // Reset mocks for this test
            vi.clearAllMocks();

            // Mock shouldAIRespond to return ai_disabled decision (Requirement 2.4)
            vi.mocked(assignmentService.shouldAIRespond).mockResolvedValue({
              shouldRespond: false,
              reason: 'ai_disabled',
              aiAgentId: null,
              aiAgentName: null,
            });

            // Call handleMessageWithAssignmentCheck
            const result = await orchestrator.handleMessageWithAssignmentCheck(
              userId,
              message,
              conversationId,
              conversationType
            );

            // Property: Should return null when AI is disabled (Requirement 2.4)
            expect(result).toBeNull();

            // Property: Should have called shouldAIRespond
            expect(assignmentService.shouldAIRespond).toHaveBeenCalledWith(
              conversationId,
              conversationType,
              userId
            );

            // Property: Should NOT call handleMessage
            expect(prisma.aIConfig.findUnique).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
