import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Prisma
vi.mock('../../utils/database.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    message: {
      count: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    qualityRating: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    instagramAccount: {
      findFirst: vi.fn(),
    },
    iGMessage: {
      count: vi.fn(),
    },
    phoneNumber: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock messageWindow utility
vi.mock('../../utils/messageWindow.js', () => ({
  getActiveWindowsCount: vi.fn().mockResolvedValue(5),
}));

import { prisma } from '../../utils/database.js';
import { getActiveWindowsCount } from '../../utils/messageWindow.js';
import { DashboardStatsService } from '../../services/dashboard-stats-service.js';

describe('DashboardStatsService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getEnhancedStats', () => {
    it('should return comprehensive dashboard stats', async () => {
      // Mock message stats
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{
          total: BigInt(100),
          today: BigInt(10),
          thisWeek: BigInt(50),
          thisMonth: BigInt(100),
          sent: BigInt(80),
          delivered: BigInt(75),
          read: BigInt(60),
          failed: BigInt(5),
        }])
        // Mock message type stats
        .mockResolvedValueOnce([{
          text: BigInt(40),
          image: BigInt(20),
          video: BigInt(10),
          document: BigInt(15),
          template: BigInt(10),
          other: BigInt(5),
        }])
        // Mock customer stats
        .mockResolvedValueOnce([{
          total: BigInt(50),
          newThisWeek: BigInt(5),
          consented: BigInt(30),
          blacklisted: BigInt(2),
        }])
        // Mock template stats
        .mockResolvedValueOnce([{
          total: BigInt(15),
          approved: BigInt(10),
          pending: BigInt(3),
          rejected: BigInt(2),
        }])
        // Mock template category stats
        .mockResolvedValueOnce([{
          marketing: BigInt(5),
          utility: BigInt(8),
          authentication: BigInt(2),
        }])
        // Mock Instagram conversation stats
        .mockResolvedValueOnce([{
          total: BigInt(10),
          unread: BigInt(3),
          activeWindows: BigInt(2),
        }])
        // Mock pipeline distribution
        .mockResolvedValueOnce([
          { stageId: 'stage-1', stageName: 'New', stageColor: '#3B82F6', count: BigInt(20) },
          { stageId: 'stage-2', stageName: 'Contacted', stageColor: '#10B981', count: BigInt(15) },
        ]);

      // Mock template usage count
      vi.mocked(prisma.message.count).mockResolvedValue(25);

      // Mock Instagram account
      vi.mocked(prisma.instagramAccount.findFirst).mockResolvedValue({
        id: 'ig-account-1',
        userId: mockUserId,
        connectionStatus: 'connected',
      } as any);

      // Mock Instagram message count
      vi.mocked(prisma.iGMessage.count).mockResolvedValue(15);

      // Mock quality rating
      vi.mocked(prisma.qualityRating.findFirst).mockResolvedValue({
        rating: 'HIGH',
        status: 'CONNECTED',
        blockCount7days: 1,
        spamReportCount7days: 0,
      } as any);

      // Mock user for messaging tier
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        messagingTier: 'TIER_1K',
      } as any);

      // Mock phone number (fallback for quality)
      vi.mocked(prisma.phoneNumber.findFirst).mockResolvedValue(null);

      // Mock top leads
      vi.mocked(prisma.customer.findMany).mockResolvedValue([
        { id: 'c1', name: 'John Doe', phoneNumber: '+1234567890', leadScore: 95, pipelineStage: { name: 'New' } },
        { id: 'c2', name: 'Jane Smith', phoneNumber: '+0987654321', leadScore: 88, pipelineStage: { name: 'Contacted' } },
      ] as any);

      // Mock new customers count
      vi.mocked(prisma.customer.count)
        .mockResolvedValueOnce(5)  // newThisWeek
        .mockResolvedValueOnce(30); // consented

      const result = await DashboardStatsService.getEnhancedStats(mockUserId);

      // Verify message stats
      expect(result.messages.total).toBe(100);
      expect(result.messages.today).toBe(10);
      expect(result.messages.sent).toBe(80);
      expect(result.messages.delivered).toBe(75);
      expect(result.messages.deliveryRate).toBeCloseTo(93.8, 1);

      // Verify message type breakdown
      expect(result.messages.byType.text).toBe(40);
      expect(result.messages.byType.template).toBe(10);

      // Verify customer stats
      expect(result.customers.total).toBe(50);
      expect(result.customers.activeWindows).toBe(5);

      // Verify template stats
      expect(result.templates.total).toBe(15);
      expect(result.templates.approved).toBe(10);
      expect(result.templates.byCategory.marketing).toBe(5);

      // Verify quality metrics
      expect(result.quality.rating).toBe('HIGH');
      expect(result.quality.blockCount7days).toBe(1);

      // Verify lastUpdated is set
      expect(result.lastUpdated).toBeDefined();
    });

    it('should handle empty data gracefully', async () => {
      // Mock all queries to return empty/zero values
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{
          total: BigInt(0),
          today: BigInt(0),
          thisWeek: BigInt(0),
          thisMonth: BigInt(0),
          sent: BigInt(0),
          delivered: BigInt(0),
          read: BigInt(0),
          failed: BigInt(0),
        }])
        .mockResolvedValueOnce([{
          text: BigInt(0),
          image: BigInt(0),
          video: BigInt(0),
          document: BigInt(0),
          template: BigInt(0),
          other: BigInt(0),
        }])
        .mockResolvedValueOnce([{
          total: BigInt(0),
          newThisWeek: BigInt(0),
          consented: BigInt(0),
          blacklisted: BigInt(0),
        }])
        .mockResolvedValueOnce([{
          total: BigInt(0),
          approved: BigInt(0),
          pending: BigInt(0),
          rejected: BigInt(0),
        }])
        .mockResolvedValueOnce([{
          marketing: BigInt(0),
          utility: BigInt(0),
          authentication: BigInt(0),
        }])
        .mockResolvedValueOnce([]);

      vi.mocked(prisma.message.count).mockResolvedValue(0);
      vi.mocked(prisma.instagramAccount.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.qualityRating.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.phoneNumber.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(prisma.customer.count).mockResolvedValue(0);
      vi.mocked(getActiveWindowsCount).mockResolvedValue(0);

      const result = await DashboardStatsService.getEnhancedStats(mockUserId);

      expect(result.messages.total).toBe(0);
      expect(result.messages.deliveryRate).toBe(0);
      expect(result.customers.total).toBe(0);
      expect(result.instagram.connected).toBe(false);
      expect(result.quality.rating).toBeNull();
    });
  });

  describe('getMessageVolume', () => {
    it('should return message volume data for specified days', async () => {
      // Mock WhatsApp messages
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([
          { date: '2025-12-01', count: BigInt(10) },
          { date: '2025-12-02', count: BigInt(15) },
          { date: '2025-12-03', count: BigInt(20) },
        ])
        // Mock Instagram messages
        .mockResolvedValueOnce([
          { date: '2025-12-01', count: BigInt(5) },
          { date: '2025-12-02', count: BigInt(8) },
        ]);

      const result = await DashboardStatsService.getMessageVolume(mockUserId, 7);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(7);
      
      // Each entry should have date, whatsapp, instagram, and total
      result.forEach(entry => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('whatsapp');
        expect(entry).toHaveProperty('instagram');
        expect(entry).toHaveProperty('total');
        expect(entry.total).toBe(entry.whatsapp + entry.instagram);
      });
    });

    it('should return empty volume data when no messages exist', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await DashboardStatsService.getMessageVolume(mockUserId, 7);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(7);
      result.forEach(entry => {
        expect(entry.whatsapp).toBe(0);
        expect(entry.instagram).toBe(0);
        expect(entry.total).toBe(0);
      });
    });
  });

  describe('getCustomerInsights', () => {
    it('should return pipeline distribution and top leads', async () => {
      // Mock pipeline distribution
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
        { stageId: 'stage-1', stageName: 'New', stageColor: '#3B82F6', count: BigInt(20) },
        { stageId: 'stage-2', stageName: 'Contacted', stageColor: '#10B981', count: BigInt(15) },
        { stageId: 'stage-3', stageName: 'Qualified', stageColor: '#F59E0B', count: BigInt(10) },
      ]);

      // Mock top leads
      vi.mocked(prisma.customer.findMany).mockResolvedValue([
        { id: 'c1', name: 'John Doe', phoneNumber: '+1234567890', leadScore: 95, pipelineStage: { name: 'New' } },
        { id: 'c2', name: 'Jane Smith', phoneNumber: '+0987654321', leadScore: 88, pipelineStage: { name: 'Contacted' } },
        { id: 'c3', name: null, phoneNumber: '+1122334455', leadScore: 75, pipelineStage: null },
      ] as any);

      // Mock counts
      vi.mocked(prisma.customer.count)
        .mockResolvedValueOnce(5)  // newThisWeek
        .mockResolvedValueOnce(30); // consented

      const result = await DashboardStatsService.getCustomerInsights(mockUserId);

      // Verify pipeline stages
      expect(result.byPipelineStage).toHaveLength(3);
      expect(result.byPipelineStage[0].stageName).toBe('New');
      expect(result.byPipelineStage[0].count).toBe(20);

      // Verify top leads
      expect(result.topLeads).toHaveLength(3);
      expect(result.topLeads[0].name).toBe('John Doe');
      expect(result.topLeads[0].leadScore).toBe(95);
      expect(result.topLeads[2].name).toBe('Unknown'); // null name should be 'Unknown'
      expect(result.topLeads[2].pipelineStage).toBeNull();

      // Verify counts
      expect(result.newThisWeek).toBe(5);
      expect(result.consented).toBe(30);
    });

    it('should handle empty pipeline and leads', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(prisma.customer.count).mockResolvedValue(0);

      const result = await DashboardStatsService.getCustomerInsights(mockUserId);

      expect(result.byPipelineStage).toHaveLength(0);
      expect(result.topLeads).toHaveLength(0);
      expect(result.newThisWeek).toBe(0);
      expect(result.consented).toBe(0);
    });
  });

  describe('getQualityMetrics', () => {
    it('should return quality metrics when QualityRating data available', async () => {
      vi.mocked(prisma.qualityRating.findFirst).mockResolvedValue({
        rating: 'HIGH',
        status: 'CONNECTED',
        blockCount7days: 2,
        spamReportCount7days: 1,
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        messagingTier: 'TIER_10K',
      } as any);

      vi.mocked(prisma.phoneNumber.findFirst).mockResolvedValue(null);

      const result = await DashboardStatsService.getQualityMetrics(mockUserId);

      expect(result.rating).toBe('HIGH');
      expect(result.messagingTier).toBe('TIER_10K');
      expect(result.blockCount7days).toBe(2);
      expect(result.spamReportCount7days).toBe(1);
      expect(result.status).toBe('CONNECTED');
    });

    it('should fallback to PhoneNumber data when QualityRating is empty', async () => {
      vi.mocked(prisma.qualityRating.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.phoneNumber.findFirst).mockResolvedValue({
        qualityRating: 'GREEN',
        messagingLimitTier: 'TIER_1K',
      } as any);

      const result = await DashboardStatsService.getQualityMetrics(mockUserId);

      // GREEN should map to HIGH
      expect(result.rating).toBe('HIGH');
      expect(result.messagingTier).toBe('TIER_1K');
      expect(result.blockCount7days).toBe(0);
      expect(result.spamReportCount7days).toBe(0);
      expect(result.status).toBe('CONNECTED');
    });

    it('should map YELLOW to MEDIUM quality rating', async () => {
      vi.mocked(prisma.qualityRating.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.phoneNumber.findFirst).mockResolvedValue({
        qualityRating: 'YELLOW',
        messagingLimitTier: 'TIER_10K',
      } as any);

      const result = await DashboardStatsService.getQualityMetrics(mockUserId);

      expect(result.rating).toBe('MEDIUM');
      expect(result.messagingTier).toBe('TIER_10K');
    });

    it('should map RED to LOW quality rating', async () => {
      vi.mocked(prisma.qualityRating.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.phoneNumber.findFirst).mockResolvedValue({
        qualityRating: 'RED',
        messagingLimitTier: 'TIER_250',
      } as any);

      const result = await DashboardStatsService.getQualityMetrics(mockUserId);

      expect(result.rating).toBe('LOW');
      expect(result.messagingTier).toBe('TIER_250');
    });

    it('should return null values when no quality data exists', async () => {
      vi.mocked(prisma.qualityRating.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.phoneNumber.findFirst).mockResolvedValue(null);

      const result = await DashboardStatsService.getQualityMetrics(mockUserId);

      expect(result.rating).toBeNull();
      expect(result.messagingTier).toBeNull();
      expect(result.blockCount7days).toBe(0);
      expect(result.spamReportCount7days).toBe(0);
      expect(result.status).toBeNull();
    });

    it('should handle LOW quality rating from QualityRating table', async () => {
      vi.mocked(prisma.qualityRating.findFirst).mockResolvedValue({
        rating: 'LOW',
        status: 'FLAGGED',
        blockCount7days: 15,
        spamReportCount7days: 10,
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        messagingTier: 'TIER_250',
      } as any);

      vi.mocked(prisma.phoneNumber.findFirst).mockResolvedValue(null);

      const result = await DashboardStatsService.getQualityMetrics(mockUserId);

      expect(result.rating).toBe('LOW');
      expect(result.blockCount7days).toBe(15);
      expect(result.spamReportCount7days).toBe(10);
    });
  });
});
