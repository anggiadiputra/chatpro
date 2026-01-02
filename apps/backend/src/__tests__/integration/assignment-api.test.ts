import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Hono } from 'hono';
import assignmentRoutes from '../../routes/assignments/index.js';
import { ASSIGNMENT_ERRORS } from '../../services/assignment-service.js';

/**
 * Integration Tests for Assignment API
 * 
 * Feature: oneinbox-assignment
 * Tests: Full assignment flow, permission denied scenarios, error responses
 * Validates: Requirements 2.2, 3.1, 7.5
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
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock Redis cache
vi.mock('../../utils/cache.js', () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
  CACHE_KEYS: {
    user: (id: string) => `user:${id}`,
  },
  CACHE_TTL: {
    USER: 300,
  },
}));

// Mock auth
vi.mock('../../lib/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock WebSocket event emitter
vi.mock('../../websocket/index.js', () => ({
  eventEmitter: {
    emitToUser: vi.fn().mockReturnValue(true),
  },
}));

// Import mocked modules
import { prisma } from '../../utils/database.js';
import { getCache, setCache } from '../../utils/cache.js';
import { auth } from '../../lib/auth.js';
import { eventEmitter } from '../../websocket/index.js';

// Create test app
const app = new Hono();
app.route('/api/v1/assignments', assignmentRoutes);

// Helper to create mock session
function mockSession(userId: string, role: 'BUSINESS_OWNER' | 'AGENT', businessOwnerId: string | null = null) {
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { id: userId },
    session: { id: 'session_1' },
  } as any);

  vi.mocked(getCache).mockResolvedValue({
    id: userId,
    email: `${userId}@example.com`,
    name: role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Agent',
    role,
    twoFactorEnabled: false,
    isActive: true,
    businessOwnerId,
  });

  // Mock team member lookup for agents
  if (role === 'AGENT' && businessOwnerId) {
    vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
      businessOwnerId,
    } as any);
  }
}

describe('Assignment API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/assignments/assignable-users', () => {
    it('should return list of assignable users', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');

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
          status: 'ACTIVE',
          agent: {
            id: 'agent_1',
            name: 'Agent One',
            email: 'agent1@example.com',
            image: null,
            role: 'AGENT',
          },
        },
      ];

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockOwner as any);
      vi.mocked(prisma.teamMember.findMany).mockResolvedValue(mockTeamMembers as any);

      const response = await app.request('/api/v1/assignments/assignable-users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].id).toBe('owner_1');
      expect(data.data[1].id).toBe('agent_1');
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const response = await app.request('/api/v1/assignments/assignable-users', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/assignments/:conversationType/:conversationId', () => {
    it('should return current assignment', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');

      const mockAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_1',
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        assignedBy: { id: 'owner_1', name: 'Owner' },
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(mockAssignment as any);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.assigneeId).toBe('agent_1');
    });

    it('should return null when no assignment exists', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeNull();
    });

    it('should return 400 for invalid conversation type', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');

      const response = await app.request('/api/v1/assignments/invalid/conv_123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ValidationError');
    });
  });

  describe('POST /api/v1/assignments/:conversationType/:conversationId', () => {
    it('should assign conversation successfully as Business Owner', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');

      const mockNewAssignment = {
        id: 'assignment_new',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_1',
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        assignedBy: { id: 'owner_1', name: 'Business Owner' },
      };

      // Mock canAssign check
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // Mock transaction for assignment
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockNewAssignment),
          },
        };
        return callback(tx);
      });

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: 'agent_1' }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.assigneeId).toBe('agent_1');
      expect(eventEmitter.emitToUser).toHaveBeenCalled();
    });

    it('should allow Agent to self-assign unassigned conversation', async () => {
      mockSession('agent_1', 'AGENT', 'owner_1');

      const mockNewAssignment = {
        id: 'assignment_new',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_1',
        assignedById: 'agent_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        assignedBy: { id: 'agent_1', name: 'Agent One' },
      };

      // Mock canAssign check - no existing assignment
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // Mock transaction for assignment
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue(mockNewAssignment),
          },
        };
        return callback(tx);
      });

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: 'agent_1' }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.assigneeId).toBe('agent_1');
    });

    it('should return 403 when Agent tries to assign others conversation', async () => {
      mockSession('agent_1', 'AGENT', 'owner_1');

      // Mock existing assignment to another agent
      const existingAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_2', // Assigned to different agent
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_2', name: 'Agent Two', image: null },
        assignedBy: { id: 'owner_1', name: 'Owner' },
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(existingAssignment as any);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: 'agent_3' }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED_ASSIGN');
    });

    it('should return 409 when already assigned to same user', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');

      const existingAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_1',
        assigneeType: 'HUMAN',
        unassignedAt: null,
      };

      // Mock canAssign check
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      // Mock transaction that throws ALREADY_ASSIGNED
      // The service checks if assigneeId matches AND assigneeType is HUMAN
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          conversationAssignment: {
            findFirst: vi.fn().mockResolvedValue(existingAssignment),
            update: vi.fn(), // Include update method even though it won't be called
          },
        };
        return callback(tx);
      });

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId: 'agent_1' }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error.code).toBe('ALREADY_ASSIGNED');
    });

    it('should return 400 for missing assigneeId', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('ValidationError');
    });
  });

  describe('DELETE /api/v1/assignments/:conversationType/:conversationId', () => {
    it('should unassign conversation successfully as Business Owner', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');

      const existingAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_1',
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        assignedBy: { id: 'owner_1', name: 'Owner' },
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(existingAssignment as any);
      vi.mocked(prisma.conversationAssignment.update).mockResolvedValue({
        ...existingAssignment,
        unassignedAt: new Date(),
      } as any);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(eventEmitter.emitToUser).toHaveBeenCalled();
    });

    it('should allow Agent to unassign their own conversation', async () => {
      mockSession('agent_1', 'AGENT', 'owner_1');

      const existingAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_1', // Assigned to the same agent
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_1', name: 'Agent One', image: null },
        assignedBy: { id: 'owner_1', name: 'Owner' },
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(existingAssignment as any);
      vi.mocked(prisma.conversationAssignment.update).mockResolvedValue({
        ...existingAssignment,
        unassignedAt: new Date(),
      } as any);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should return 403 when Agent tries to unassign others conversation', async () => {
      mockSession('agent_1', 'AGENT', 'owner_1');

      const existingAssignment = {
        id: 'assignment_1',
        conversationId: 'conv_123',
        conversationType: 'WHATSAPP',
        assigneeId: 'agent_2', // Assigned to different agent
        assignedById: 'owner_1',
        businessOwnerId: 'owner_1',
        assignedAt: new Date(),
        unassignedAt: null,
        assignee: { id: 'agent_2', name: 'Agent Two', image: null },
        assignedBy: { id: 'owner_1', name: 'Owner' },
      };

      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(existingAssignment as any);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED_UNASSIGN');
    });

    it('should return 404 when conversation is not assigned', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');
      vi.mocked(prisma.conversationAssignment.findFirst).mockResolvedValue(null);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_ASSIGNED');
    });
  });

  describe('GET /api/v1/assignments/:conversationType/:conversationId/history', () => {
    it('should return assignment history', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');

      const mockHistory = [
        {
          id: 'assignment_2',
          conversationId: 'conv_123',
          conversationType: 'WHATSAPP',
          assigneeId: 'agent_2',
          assignedById: 'owner_1',
          businessOwnerId: 'owner_1',
          assignedAt: new Date('2024-01-02'),
          unassignedAt: null,
          assignee: { id: 'agent_2', name: 'Agent Two', image: null },
          assignedBy: { id: 'owner_1', name: 'Owner' },
        },
        {
          id: 'assignment_1',
          conversationId: 'conv_123',
          conversationType: 'WHATSAPP',
          assigneeId: 'agent_1',
          assignedById: 'owner_1',
          businessOwnerId: 'owner_1',
          assignedAt: new Date('2024-01-01'),
          unassignedAt: new Date('2024-01-02'),
          assignee: { id: 'agent_1', name: 'Agent One', image: null },
          assignedBy: { id: 'owner_1', name: 'Owner' },
        },
      ];

      vi.mocked(prisma.conversationAssignment.findMany).mockResolvedValue(mockHistory as any);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123/history', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      // Verify ordering: newest first
      expect(data.data[0].assigneeId).toBe('agent_2');
      expect(data.data[1].assigneeId).toBe('agent_1');
    });

    it('should return empty array when no history exists', async () => {
      mockSession('owner_1', 'BUSINESS_OWNER');
      vi.mocked(prisma.conversationAssignment.findMany).mockResolvedValue([]);

      const response = await app.request('/api/v1/assignments/whatsapp/conv_123/history', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(0);
    });
  });
});
