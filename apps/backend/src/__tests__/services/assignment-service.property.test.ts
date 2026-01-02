import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fc from 'fast-check';

/**
 * Property-Based Tests for AssignmentService
 * 
 * Feature: oneinbox-assignment, ai-agent-assignment
 * Property 1: Single Active Assignment Constraint
 * Property 5: Permission Rules
 * Property 7: WebSocket Notification on Assignment
 * Property AI-1: Assignable Entities List Correctness
 * Validates: Requirements 1.2, 2.4, 7.1, 7.2, 7.3, 7.4, 1.1, 1.2, 1.3, 1.6
 */

// Mock eventEmitter - must be defined before vi.mock
vi.mock('../../websocket/event-emitter.js', () => ({
  eventEmitter: {
    emitAssignmentChangedToUsers: vi.fn().mockReturnValue({ sent: 1, failed: 0 }),
  },
}));

// Mock Prisma - must be defined before vi.mock
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
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Import after mocks
import { AssignmentService } from '../../services/assignment-service.js';
import { prisma } from '../../utils/database.js';
import { eventEmitter } from '../../websocket/event-emitter.js';

// Arbitraries for generating test data
const conversationIdArb = fc.uuid();
const userIdArb = fc.uuid();
const conversationTypeArb = fc.constantFrom('WHATSAPP' as const, 'INSTAGRAM' as const);

// Service instance at module level
let service: AssignmentService;

describe('AssignmentService Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service = new AssignmentService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 1: Single Active Assignment Constraint', () => {
    /**
     * Property 1: Single Active Assignment Constraint
     * For any conversation, there SHALL be at most one active assignment
     * (where unassignedAt is null) at any given time.
     * 
     * **Validates: Requirements 1.2**
     */
    it('should ensure only one active assignment exists after multiple assign operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          fc.array(userIdArb, { minLength: 2, maxLength: 5 }), // multiple assignees
          async (conversationId, conversationType, businessOwnerId, assigneeIds) => {
            // Track all assignments created
            const createdAssignments: Array<{
              id: string;
              conversationId: string;
              conversationType: string;
              assigneeId: string;
              unassignedAt: Date | null;
            }> = [];

            // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

            // Mock transaction to track assignment state
            vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
              const tx = {
                conversationAssignment: {
                  findFirst: vi.fn().mockImplementation(async (query: any) => {
                    // Find active assignment for this conversation
                    return createdAssignments.find(
                      (a) =>
                        a.conversationId === query.where.conversationId &&
                        a.conversationType === query.where.conversationType &&
                        a.unassignedAt === null
                    ) || null;
                  }),
                  update: vi.fn().mockImplementation(async (query: any) => {
                    // Mark assignment as unassigned
                    const assignment = createdAssignments.find((a) => a.id === query.where.id);
                    if (assignment) {
                      assignment.unassignedAt = query.data.unassignedAt;
                    }
                    return assignment;
                  }),
                  create: vi.fn().mockImplementation(async (query: any) => {
                    const newAssignment = {
                      id: `assignment_${createdAssignments.length + 1}`,
                      conversationId: query.data.conversationId,
                      conversationType: query.data.conversationType,
                      assigneeId: query.data.assigneeId,
                      assignedById: query.data.assignedById,
                      businessOwnerId: query.data.businessOwnerId,
                      assignedAt: new Date(),
                      unassignedAt: null,
                      assignee: { id: query.data.assigneeId, name: 'Test User', image: null },
                      assignedBy: { id: query.data.assignedById, name: 'Assigner' },
                    };
                    createdAssignments.push(newAssignment);
                    return newAssignment;
                  }),
                },
              };
              return callback(tx);
            });

            // Perform multiple assignments sequentially
            for (const assigneeId of assigneeIds) {
              try {
                await service.assignConversation(
                  conversationId,
                  conversationType,
                  assigneeId,
                  businessOwnerId, // assignedById
                  businessOwnerId
                );
              } catch {
                // ALREADY_ASSIGNED error is expected if same user
              }
            }

            // Property: Count active assignments (unassignedAt === null)
            const activeAssignments = createdAssignments.filter(
              (a) =>
                a.conversationId === conversationId &&
                a.conversationType === conversationType &&
                a.unassignedAt === null
            );

            // There should be at most 1 active assignment
            expect(activeAssignments.length).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Re-assignment should unassign previous assignment
     * When a conversation is re-assigned, the previous assignment SHALL have
     * unassignedAt set to a non-null timestamp.
     * 
     * **Validates: Requirements 1.3**
     */
    it('should unassign previous assignment when re-assigning', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // first assignee
          userIdArb, // second assignee
          async (conversationId, conversationType, businessOwnerId, firstAssignee, secondAssignee) => {
            // Skip if same assignee
            if (firstAssignee === secondAssignee) return;

            let existingAssignment: { id: string; assigneeId: string; unassignedAt: Date | null } | null = null;
            let previousUnassignedAt: Date | null = null;

            // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

            vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
              const tx = {
                conversationAssignment: {
                  findFirst: vi.fn().mockImplementation(async () => {
                    return existingAssignment;
                  }),
                  update: vi.fn().mockImplementation(async (query: any) => {
                    if (existingAssignment && existingAssignment.id === query.where.id) {
                      previousUnassignedAt = query.data.unassignedAt;
                      existingAssignment.unassignedAt = query.data.unassignedAt;
                    }
                    return existingAssignment;
                  }),
                  create: vi.fn().mockImplementation(async (query: any) => {
                    const newAssignment = {
                      id: `assignment_${Date.now()}`,
                      conversationId: query.data.conversationId,
                      conversationType: query.data.conversationType,
                      assigneeId: query.data.assigneeId,
                      assignedById: query.data.assignedById,
                      businessOwnerId: query.data.businessOwnerId,
                      assignedAt: new Date(),
                      unassignedAt: null,
                      assignee: { id: query.data.assigneeId, name: 'Test User', image: null },
                      assignedBy: { id: query.data.assignedById, name: 'Assigner' },
                    };
                    existingAssignment = newAssignment;
                    return newAssignment;
                  }),
                },
              };
              return callback(tx);
            });

            // First assignment
            await service.assignConversation(
              conversationId,
              conversationType,
              firstAssignee,
              businessOwnerId,
              businessOwnerId
            );

            // Second assignment (re-assign)
            await service.assignConversation(
              conversationId,
              conversationType,
              secondAssignee,
              businessOwnerId,
              businessOwnerId
            );

            // Property: Previous assignment should have been unassigned
            expect(previousUnassignedAt).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Permission Rules', () => {
    /**
     * Property 5: Permission Rules
     * For any assignment action:
     * - Business Owners can assign/unassign any conversation
     * - Agents can self-assign unassigned conversations
     * - Agents can re-assign their own assigned conversations
     * - Agents cannot unassign conversations assigned to other Agents
     * 
     * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
     */
    it('should allow Business Owner to assign any conversation', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // targetAssignee
          async (conversationId, conversationType, businessOwnerId, targetAssignee) => {
            // Mock no existing assignment
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

            const canAssign = await service.canAssign(
              businessOwnerId,
              'BUSINESS_OWNER',
              targetAssignee,
              conversationId,
              conversationType,
              businessOwnerId
            );

            // Property: Business Owner can always assign
            expect(canAssign).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow Business Owner to unassign any conversation', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          async (conversationId, conversationType, businessOwnerId) => {
            const canUnassign = await service.canUnassign(
              businessOwnerId,
              'BUSINESS_OWNER',
              conversationId,
              conversationType,
              businessOwnerId
            );

            // Property: Business Owner can always unassign
            expect(canUnassign).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow Agent to self-assign unassigned conversations', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // agentId
          async (conversationId, conversationType, businessOwnerId, agentId) => {
            // Mock no existing assignment (unassigned)
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

            const canAssign = await service.canAssign(
              agentId,
              'AGENT',
              agentId, // self-assign
              conversationId,
              conversationType,
              businessOwnerId
            );

            // Property: Agent can self-assign unassigned conversations
            expect(canAssign).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow Agent to re-assign their own conversations', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // agentId
          userIdArb, // newAssignee
          async (conversationId, conversationType, businessOwnerId, agentId, newAssignee) => {
            // Mock existing assignment to this agent
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue({
              id: 'existing_assignment',
              conversationId,
              conversationType,
              assigneeId: agentId, // assigned to this agent
              assignedById: businessOwnerId,
              businessOwnerId,
              assignedAt: new Date(),
              unassignedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              assignee: { id: agentId, name: 'Agent', image: null },
              assignedBy: { id: businessOwnerId, name: 'Owner' },
            } as any);

            const canAssign = await service.canAssign(
              agentId,
              'AGENT',
              newAssignee,
              conversationId,
              conversationType,
              businessOwnerId
            );

            // Property: Agent can re-assign their own conversations
            expect(canAssign).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent Agent from unassigning conversations assigned to others', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // agentId
          userIdArb, // otherAgentId
          async (conversationId, conversationType, businessOwnerId, agentId, otherAgentId) => {
            // Skip if same agent
            if (agentId === otherAgentId) return;

            // Mock existing assignment to another agent
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue({
              id: 'existing_assignment',
              conversationId,
              conversationType,
              assigneeId: otherAgentId, // assigned to another agent
              assignedById: businessOwnerId,
              businessOwnerId,
              assignedAt: new Date(),
              unassignedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              assignee: { id: otherAgentId, name: 'Other Agent', image: null },
              assignedBy: { id: businessOwnerId, name: 'Owner' },
            } as any);

            const canUnassign = await service.canUnassign(
              agentId,
              'AGENT',
              conversationId,
              conversationType,
              businessOwnerId
            );

            // Property: Agent cannot unassign others' conversations
            expect(canUnassign).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent Agent from assigning conversations assigned to others', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // agentId
          userIdArb, // otherAgentId
          userIdArb, // targetAssignee
          async (conversationId, conversationType, businessOwnerId, agentId, otherAgentId, targetAssignee) => {
            // Skip if same agent
            if (agentId === otherAgentId) return;

            // Mock existing assignment to another agent
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue({
              id: 'existing_assignment',
              conversationId,
              conversationType,
              assigneeId: otherAgentId, // assigned to another agent
              assignedById: businessOwnerId,
              businessOwnerId,
              assignedAt: new Date(),
              unassignedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              assignee: { id: otherAgentId, name: 'Other Agent', image: null },
              assignedBy: { id: businessOwnerId, name: 'Owner' },
            } as any);

            const canAssign = await service.canAssign(
              agentId,
              'AGENT',
              targetAssignee,
              conversationId,
              conversationType,
              businessOwnerId
            );

            // Property: Agent cannot assign conversations assigned to others
            expect(canAssign).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: WebSocket Notification on Assignment', () => {
    /**
     * Property 7: WebSocket Notification on Assignment
     * For any successful assignment or unassignment, a WebSocket event SHALL be
     * emitted to all connected users in the business owner's context.
     * 
     * **Validates: Requirements 2.4**
     */
    it('should emit WebSocket event to all users in context on assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // assigneeId
          fc.array(userIdArb, { minLength: 0, maxLength: 3 }), // agentIds
          async (conversationId, conversationType, businessOwnerId, assigneeId, agentIds) => {
            // Reset mocks
            vi.mocked(eventEmitter.emitAssignmentChangedToUsers).mockClear();

            // Mock team members (agents in context)
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue(
              agentIds.map((agentId, index) => ({
                id: `tm_${index}`,
                businessOwnerId,
                agentUserId: agentId,
                status: 'ACTIVE' as const,
                invitedAt: new Date(),
                joinedAt: new Date(),
                removedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }))
            );

            // Mock transaction for assignment
            vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
              const tx = {
                conversationAssignment: {
                  findFirst: vi.fn().mockResolvedValue(null), // No existing assignment
                  create: vi.fn().mockResolvedValue({
                    id: 'new_assignment',
                    conversationId,
                    conversationType,
                    assigneeId,
                    assignedById: businessOwnerId,
                    businessOwnerId,
                    assignedAt: new Date(),
                    unassignedAt: null,
                    assignee: { id: assigneeId, name: 'Assignee', image: null },
                    assignedBy: { id: businessOwnerId, name: 'Owner' },
                  }),
                },
              };
              return callback(tx);
            });

            // Perform assignment
            await service.assignConversation(
              conversationId,
              conversationType,
              assigneeId,
              businessOwnerId,
              businessOwnerId
            );

            // Property: WebSocket event should be emitted
            expect(eventEmitter.emitAssignmentChangedToUsers).toHaveBeenCalledTimes(1);

            // Property: Event should be sent to all users in context (business owner + agents)
            const expectedUserIds = [businessOwnerId, ...agentIds];
            const mockFn = vi.mocked(eventEmitter.emitAssignmentChangedToUsers);
            const actualUserIds = mockFn.mock.calls[0][0];
            expect(actualUserIds).toEqual(expect.arrayContaining(expectedUserIds));
            expect(actualUserIds.length).toBe(expectedUserIds.length);

            // Property: Event payload should contain correct data
            const payload = mockFn.mock.calls[0][1];
            expect(payload.conversationId).toBe(conversationId);
            expect(payload.conversationType).toBe(conversationType.toLowerCase());
            expect(payload.assigneeId).toBe(assigneeId);
            expect(payload.action).toBe('assigned');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit WebSocket event to all users in context on unassignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // currentAssigneeId
          fc.array(userIdArb, { minLength: 0, maxLength: 3 }), // agentIds
          async (conversationId, conversationType, businessOwnerId, currentAssigneeId, agentIds) => {
            // Reset mocks
            vi.mocked(eventEmitter.emitAssignmentChangedToUsers).mockClear();

            // Mock existing assignment
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue({
              id: 'existing_assignment',
              conversationId,
              conversationType,
              assigneeId: currentAssigneeId,
              assignedById: businessOwnerId,
              businessOwnerId,
              assignedAt: new Date(),
              unassignedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Mock update for unassignment
            vi.mocked(prisma.conversationAssignment.update).mockResolvedValue({
              id: 'existing_assignment',
              conversationId,
              conversationType,
              assigneeId: currentAssigneeId,
              assignedById: businessOwnerId,
              businessOwnerId,
              assignedAt: new Date(),
              unassignedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Mock team members (agents in context)
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue(
              agentIds.map((agentId, index) => ({
                id: `tm_${index}`,
                businessOwnerId,
                agentUserId: agentId,
                status: 'ACTIVE' as const,
                invitedAt: new Date(),
                joinedAt: new Date(),
                removedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              }))
            );

            // Perform unassignment
            await service.unassignConversation(
              conversationId,
              conversationType,
              businessOwnerId,
              businessOwnerId
            );

            // Property: WebSocket event should be emitted
            expect(eventEmitter.emitAssignmentChangedToUsers).toHaveBeenCalledTimes(1);

            // Property: Event should be sent to all users in context
            const expectedUserIds = [businessOwnerId, ...agentIds];
            const mockFn = vi.mocked(eventEmitter.emitAssignmentChangedToUsers);
            const actualUserIds = mockFn.mock.calls[0][0];
            expect(actualUserIds).toEqual(expect.arrayContaining(expectedUserIds));
            expect(actualUserIds.length).toBe(expectedUserIds.length);

            // Property: Event payload should indicate unassignment
            const payload = mockFn.mock.calls[0][1];
            expect(payload.conversationId).toBe(conversationId);
            expect(payload.conversationType).toBe(conversationType.toLowerCase());
            expect(payload.assigneeId).toBeNull();
            expect(payload.assigneeName).toBeNull();
            expect(payload.action).toBe('unassigned');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property AI-1: Assignable Entities List Correctness', () => {
    /**
     * Property 1: Assignable Entities List Correctness
     * For any business owner with AI enabled, the assignable entities list SHALL contain
     * all active team members (business owner + agents) AND all AI Agents belonging to
     * that business owner, each with their correct name and type.
     * 
     * Feature: ai-agent-assignment
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.6**
     */
    it('should return all humans and AI agents when AI is enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb, // businessOwnerId
          fc.array(
            fc.record({
              id: userIdArb,
              name: fc.string({ minLength: 1, maxLength: 50 }),
              email: fc.emailAddress(),
            }),
            { minLength: 0, maxLength: 5 }
          ), // agents
          fc.array(
            fc.record({
              id: userIdArb,
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 0, maxLength: 5 }
          ), // aiAgents
          async (businessOwnerId, agents, aiAgents) => {
            // Mock business owner
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: businessOwnerId,
              name: 'Business Owner',
              email: 'owner@example.com',
              image: null,
              role: 'BUSINESS_OWNER',
            } as any);

            // Mock team members (agents)
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue(
              agents.map((agent, index) => ({
                id: `tm_${index}`,
                businessOwnerId,
                agentUserId: agent.id,
                status: 'ACTIVE' as const,
                invitedAt: new Date(),
                joinedAt: new Date(),
                removedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                agent: {
                  id: agent.id,
                  name: agent.name,
                  email: agent.email,
                  image: null,
                  role: 'AGENT' as const,
                },
              }))
            );

            // Mock AI enabled
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId: businessOwnerId,
              enabled: true,
              model: 'gpt-4',
              systemPrompt: 'Test',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              activeAgentId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            // Mock AI agents
            vi.mocked(prisma.aIAgent.findMany).mockResolvedValue(
              aiAgents.map((agent) => ({
                id: agent.id,
                name: agent.name,
                userId: businessOwnerId,
                systemPrompt: 'Test prompt',
                createdAt: new Date(),
                updatedAt: new Date(),
              }))
            );

            const result = await service.getAssignableEntities(businessOwnerId);

            // Property: Result should contain business owner
            const ownerEntity = result.find((e) => e.id === businessOwnerId);
            expect(ownerEntity).toBeDefined();
            expect(ownerEntity?.type).toBe('HUMAN');
            expect(ownerEntity?.name).toBe('Business Owner');

            // Property: Result should contain all agents with correct type
            for (const agent of agents) {
              const agentEntity = result.find((e) => e.id === agent.id && e.type === 'HUMAN');
              expect(agentEntity).toBeDefined();
              expect(agentEntity?.name).toBe(agent.name);
            }

            // Property: Result should contain all AI agents with correct type
            for (const aiAgent of aiAgents) {
              const aiEntity = result.find((e) => e.id === aiAgent.id && e.type === 'AI_AGENT');
              expect(aiEntity).toBeDefined();
              expect(aiEntity?.name).toBe(aiAgent.name);
            }

            // Property: Total count should be business owner + agents + AI agents
            const expectedCount = 1 + agents.length + aiAgents.length;
            expect(result.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return only humans when AI is disabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb, // businessOwnerId
          fc.array(
            fc.record({
              id: userIdArb,
              name: fc.string({ minLength: 1, maxLength: 50 }),
              email: fc.emailAddress(),
            }),
            { minLength: 0, maxLength: 5 }
          ), // agents
          fc.array(
            fc.record({
              id: userIdArb,
              name: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 5 }
          ), // aiAgents (at least 1 to verify they're excluded)
          async (businessOwnerId, agents, aiAgents) => {
            // Mock business owner
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: businessOwnerId,
              name: 'Business Owner',
              email: 'owner@example.com',
              image: null,
              role: 'BUSINESS_OWNER',
            } as any);

            // Mock team members (agents)
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue(
              agents.map((agent, index) => ({
                id: `tm_${index}`,
                businessOwnerId,
                agentUserId: agent.id,
                status: 'ACTIVE' as const,
                invitedAt: new Date(),
                joinedAt: new Date(),
                removedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                agent: {
                  id: agent.id,
                  name: agent.name,
                  email: agent.email,
                  image: null,
                  role: 'AGENT' as const,
                },
              }))
            );

            // Mock AI disabled (Requirement 1.2)
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId: businessOwnerId,
              enabled: false, // AI is disabled
              model: 'gpt-4',
              systemPrompt: 'Test',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              activeAgentId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            const result = await service.getAssignableEntities(businessOwnerId);

            // Property: Result should NOT contain any AI agents when AI is disabled
            const aiEntities = result.filter((e) => e.type === 'AI_AGENT');
            expect(aiEntities.length).toBe(0);

            // Property: Result should only contain humans
            const humanEntities = result.filter((e) => e.type === 'HUMAN');
            expect(humanEntities.length).toBe(1 + agents.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return only humans when AI config does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          userIdArb, // businessOwnerId
          fc.array(
            fc.record({
              id: userIdArb,
              name: fc.string({ minLength: 1, maxLength: 50 }),
              email: fc.emailAddress(),
            }),
            { minLength: 0, maxLength: 3 }
          ), // agents
          async (businessOwnerId, agents) => {
            // Mock business owner
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: businessOwnerId,
              name: 'Business Owner',
              email: 'owner@example.com',
              image: null,
              role: 'BUSINESS_OWNER',
            } as any);

            // Mock team members (agents)
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue(
              agents.map((agent, index) => ({
                id: `tm_${index}`,
                businessOwnerId,
                agentUserId: agent.id,
                status: 'ACTIVE' as const,
                invitedAt: new Date(),
                joinedAt: new Date(),
                removedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                agent: {
                  id: agent.id,
                  name: agent.name,
                  email: agent.email,
                  image: null,
                  role: 'AGENT' as const,
                },
              }))
            );

            // Mock no AI config
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue(null);

            const result = await service.getAssignableEntities(businessOwnerId);

            // Property: Result should NOT contain any AI agents when no AI config
            const aiEntities = result.filter((e) => e.type === 'AI_AGENT');
            expect(aiEntities.length).toBe(0);

            // Property: Result should only contain humans
            expect(result.length).toBe(1 + agents.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property AI-2: Assignment Record Integrity', () => {
    /**
     * Property 2: Assignment Record Integrity
     * For any assignment record:
     * - If assigneeType is "HUMAN", then assigneeId SHALL be non-null and reference a valid User
     * - If assigneeType is "AI_AGENT", then aiAgentId SHALL be non-null and reference a valid AIAgent
     * 
     * Feature: ai-agent-assignment
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
     */
    it('should create HUMAN assignment with valid assigneeId and null aiAgentId', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // assigneeId
          async (conversationId, conversationType, businessOwnerId, assigneeId) => {
            let createdAssignment: any = null;

            // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

            // Mock transaction to capture created assignment
            vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
              const tx = {
                conversationAssignment: {
                  findFirst: vi.fn().mockResolvedValue(null),
                  create: vi.fn().mockImplementation(async (query: any) => {
                    createdAssignment = {
                      id: 'new_assignment',
                      ...query.data,
                      assignedAt: new Date(),
                      unassignedAt: null,
                      assignee: { id: assigneeId, name: 'Test User', image: null },
                      assignedBy: { id: businessOwnerId, name: 'Owner' },
                    };
                    return createdAssignment;
                  }),
                },
              };
              return callback(tx);
            });

            // Perform human assignment
            const result = await service.assignConversation(
              conversationId,
              conversationType,
              assigneeId,
              businessOwnerId,
              businessOwnerId
            );

            // Property: HUMAN assignment should have assigneeType = 'HUMAN'
            expect(createdAssignment.assigneeType).toBe('HUMAN');

            // Property: HUMAN assignment should have non-null assigneeId
            expect(createdAssignment.assigneeId).toBe(assigneeId);
            expect(result.assigneeId).toBe(assigneeId);

            // Property: HUMAN assignment should have null aiAgentId
            expect(result.aiAgentId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create AI_AGENT assignment with valid aiAgentId and null assigneeId', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // aiAgentId
          fc.string({ minLength: 1, maxLength: 50 }), // aiAgentName
          async (conversationId, conversationType, businessOwnerId, aiAgentId, aiAgentName) => {
            let createdAssignment: any = null;

            // Mock AI enabled
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId: businessOwnerId,
              enabled: true,
            } as any);

            // Mock AI Agent exists
            vi.mocked(prisma.aIAgent.findFirst).mockResolvedValue({
              id: aiAgentId,
              name: aiAgentName,
              userId: businessOwnerId,
            } as any);

            // Mock for getUserIdsInContext called by emitAssignmentChangedEvent
            vi.mocked(prisma.teamMember.findMany).mockResolvedValue([]);

            // Mock transaction to capture created assignment
            vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
              const tx = {
                conversationAssignment: {
                  findFirst: vi.fn().mockResolvedValue(null),
                  create: vi.fn().mockImplementation(async (query: any) => {
                    createdAssignment = {
                      id: 'new_assignment',
                      ...query.data,
                      assignedAt: new Date(),
                      unassignedAt: null,
                      aiAgent: { id: aiAgentId, name: aiAgentName },
                      assignedBy: { id: businessOwnerId, name: 'Owner' },
                    };
                    return createdAssignment;
                  }),
                },
              };
              return callback(tx);
            });

            // Perform AI Agent assignment
            const result = await service.assignToAIAgent(
              conversationId,
              conversationType,
              aiAgentId,
              businessOwnerId,
              businessOwnerId
            );

            // Property: AI_AGENT assignment should have assigneeType = 'AI_AGENT'
            expect(createdAssignment.assigneeType).toBe('AI_AGENT');

            // Property: AI_AGENT assignment should have non-null aiAgentId
            expect(createdAssignment.aiAgentId).toBe(aiAgentId);
            expect(result.aiAgentId).toBe(aiAgentId);

            // Property: AI_AGENT assignment should have null assigneeId
            expect(result.assigneeId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate AI Agent belongs to business owner before assignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // aiAgentId
          userIdArb, // differentOwnerId
          async (conversationId, conversationType, businessOwnerId, aiAgentId, differentOwnerId) => {
            // Skip if same owner
            if (businessOwnerId === differentOwnerId) return;

            // Mock AI enabled
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId: businessOwnerId,
              enabled: true,
            } as any);

            // Mock AI Agent belongs to different owner (not found for this business owner)
            vi.mocked(prisma.aIAgent.findFirst).mockResolvedValue(null);

            // Property: Should throw error when AI Agent doesn't belong to business owner
            await expect(
              service.assignToAIAgent(
                conversationId,
                conversationType,
                aiAgentId,
                businessOwnerId,
                businessOwnerId
              )
            ).rejects.toThrow('AI Agent not found or does not belong to this account.');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property AI-3: AI Response Decision Logic', () => {
    /**
     * Property 8: AI Response Decision Logic
     * For any conversation:
     * - If assigned to a human, shouldAIRespond SHALL return { shouldRespond: false }
     * - If assigned to an AI Agent, shouldAIRespond SHALL return { shouldRespond: true, aiAgentId }
     * - If unassigned with AI enabled, shouldAIRespond SHALL return { shouldRespond: true } with default agent
     * - If unassigned with AI disabled, shouldAIRespond SHALL return { shouldRespond: false }
     * 
     * Feature: ai-agent-assignment
     * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
     */
    it('should return shouldRespond=false when assigned to human', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // humanAssigneeId
          fc.string({ minLength: 1, maxLength: 50 }), // humanName
          async (conversationId, conversationType, businessOwnerId, humanAssigneeId, humanName) => {
            // Mock assignment to human
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue({
              id: 'assignment_1',
              conversationId,
              conversationType,
              assigneeType: 'HUMAN',
              assigneeId: humanAssigneeId,
              aiAgentId: null,
              assignedById: businessOwnerId,
              businessOwnerId,
              assignedAt: new Date(),
              unassignedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              assignee: { id: humanAssigneeId, name: humanName, image: null },
              aiAgent: null,
              assignedBy: { id: businessOwnerId, name: 'Owner' },
            } as any);

            const result = await service.shouldAIRespond(conversationId, conversationType, businessOwnerId);

            // Property: Human assignment should return shouldRespond=false (Requirement 6.2)
            expect(result.shouldRespond).toBe(false);
            expect(result.reason).toBe('assigned_to_human');
            expect(result.aiAgentId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return shouldRespond=true with aiAgentId when assigned to AI Agent', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // aiAgentId
          fc.string({ minLength: 1, maxLength: 50 }), // aiAgentName
          async (conversationId, conversationType, businessOwnerId, aiAgentId, aiAgentName) => {
            // Mock assignment to AI Agent
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue({
              id: 'assignment_1',
              conversationId,
              conversationType,
              assigneeType: 'AI_AGENT',
              assigneeId: null,
              aiAgentId,
              assignedById: businessOwnerId,
              businessOwnerId,
              assignedAt: new Date(),
              unassignedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              assignee: null,
              aiAgent: { id: aiAgentId, name: aiAgentName },
              assignedBy: { id: businessOwnerId, name: 'Owner' },
            } as any);

            const result = await service.shouldAIRespond(conversationId, conversationType, businessOwnerId);

            // Property: AI Agent assignment should return shouldRespond=true (Requirement 6.3)
            expect(result.shouldRespond).toBe(true);
            expect(result.reason).toBe('assigned_to_ai');
            expect(result.aiAgentId).toBe(aiAgentId);
            expect(result.aiAgentName).toBe(aiAgentName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return shouldRespond=true with default agent when unassigned and AI enabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          userIdArb, // defaultAgentId
          fc.string({ minLength: 1, maxLength: 50 }), // defaultAgentName
          async (conversationId, conversationType, businessOwnerId, defaultAgentId, defaultAgentName) => {
            // Mock no assignment (unassigned)
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

            // Mock AI enabled with active agent (Requirement 6.4)
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId: businessOwnerId,
              enabled: true,
              activeAgentId: defaultAgentId,
              activeAgent: { id: defaultAgentId, name: defaultAgentName },
              model: 'gpt-4',
              systemPrompt: 'Test',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            const result = await service.shouldAIRespond(conversationId, conversationType, businessOwnerId);

            // Property: Unassigned with AI enabled should return shouldRespond=true (Requirement 6.4)
            expect(result.shouldRespond).toBe(true);
            expect(result.reason).toBe('unassigned_ai_enabled');
            expect(result.aiAgentId).toBe(defaultAgentId);
            expect(result.aiAgentName).toBe(defaultAgentName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return shouldRespond=false when unassigned and AI disabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          async (conversationId, conversationType, businessOwnerId) => {
            // Mock no assignment (unassigned)
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

            // Mock AI disabled
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue({
              id: 'ai_config_1',
              userId: businessOwnerId,
              enabled: false,
              activeAgentId: null,
              activeAgent: null,
              model: 'gpt-4',
              systemPrompt: 'Test',
              temperature: 0.7,
              maxDailyInteractions: 100,
              filterWords: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any);

            const result = await service.shouldAIRespond(conversationId, conversationType, businessOwnerId);

            // Property: Unassigned with AI disabled should return shouldRespond=false
            expect(result.shouldRespond).toBe(false);
            expect(result.reason).toBe('ai_disabled');
            expect(result.aiAgentId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return shouldRespond=false when unassigned and no AI config exists', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          async (conversationId, conversationType, businessOwnerId) => {
            // Mock no assignment (unassigned)
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

            // Mock no AI config
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue(null);

            const result = await service.shouldAIRespond(conversationId, conversationType, businessOwnerId);

            // Property: Unassigned with no AI config should return shouldRespond=false
            expect(result.shouldRespond).toBe(false);
            expect(result.reason).toBe('ai_disabled');
            expect(result.aiAgentId).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should check assignment status before AI response decision (Requirement 6.1)', async () => {
      await fc.assert(
        fc.asyncProperty(
          conversationIdArb,
          conversationTypeArb,
          userIdArb, // businessOwnerId
          async (conversationId, conversationType, businessOwnerId) => {
            // Clear mocks to track calls
            vi.mocked(prisma.conversationAssignment.findFirst).mockClear();
            vi.mocked(prisma.aIConfig.findUnique).mockClear();

            // Mock no assignment
            vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.aIConfig.findUnique).mockResolvedValue(null);

            await service.shouldAIRespond(conversationId, conversationType, businessOwnerId);

            // Property: Should always check assignment status first (Requirement 6.1)
            expect(prisma.conversationAssignment.findFirst).toHaveBeenCalledTimes(1);
            expect(prisma.conversationAssignment.findFirst).toHaveBeenCalledWith({
              where: {
                conversationId,
                conversationType,
                businessOwnerId,
                unassignedAt: null,
              },
              include: {
                assignee: { select: { id: true, name: true, image: true } },
                aiAgent: { select: { id: true, name: true } },
                assignedBy: { select: { id: true, name: true } },
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
