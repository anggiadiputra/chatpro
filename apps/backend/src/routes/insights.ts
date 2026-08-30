/**
 * WhatsApp Insights API Routes
 * 
 * Provides REST API endpoints for fetching WhatsApp analytics
 * from Meta Graph API.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { requireRole } from '../middleware/auth.js';
import { resolveContext, getEffectiveUserId } from '../middleware/resolveContext.js';
import { prisma } from '../utils/database.js';
import { logger } from '../utils/logger.js';
import { insightsService, InsightsServiceError } from '../services/insights-service.js';
import type {
  Granularity,
  ConversationCategory,
  InsightsApiResponse,
  MessageAnalyticsData,
  ConversationAnalyticsData,
  TemplatePerformanceData,
  InsightsOverviewData,
} from '../types/insights.js';

const app = new Hono();

// Apply context resolution middleware for agent support
app.use('*', resolveContext);

/**
 * Parse and validate date range parameters
 */
function parseDateParams(c: Context): { startDate: number; endDate: number } | null {
  const startDateStr = c.req.query('startDate');
  const endDateStr = c.req.query('endDate');

  if (!startDateStr || !endDateStr) {
    logger.warn('Insights request rejected: missing date params', {
      path: c.req.path,
      startDate: startDateStr ?? null,
      endDate: endDateStr ?? null,
    });
    return null;
  }

  const startDate = Number.parseInt(startDateStr, 10);
  const endDate = Number.parseInt(endDateStr, 10);

  if (!Number.isFinite(startDate) || !Number.isFinite(endDate)) {
    logger.warn('Insights request rejected: non-numeric date params', {
      path: c.req.path,
      startDate: startDateStr,
      endDate: endDateStr,
    });
    return null;
  }

  if (startDate > endDate) {
    logger.warn('Insights request rejected: startDate is later than endDate', {
      path: c.req.path,
      startDate,
      endDate,
    });
    return null;
  }

  // Validate date range (max 90 days)
  const maxRange = 90 * 24 * 60 * 60; // 90 days in seconds
  if (endDate - startDate > maxRange) {
    logger.warn('Insights request rejected: date range exceeds 90 days', {
      path: c.req.path,
      startDate,
      endDate,
      rangeSeconds: endDate - startDate,
      maxRangeSeconds: maxRange,
    });
    return null;
  }

  return { startDate, endDate };
}

function buildInvalidDateParamsResponse(c: Context): Response {
  const startDateStr = c.req.query('startDate');
  const endDateStr = c.req.query('endDate');
  const startValue = startDateStr !== undefined ? Number.parseInt(startDateStr, 10) : Number.NaN;
  const endValue = endDateStr !== undefined ? Number.parseInt(endDateStr, 10) : Number.NaN;

  const invalidReason =
    startDateStr && endDateStr && Number.isFinite(startValue) && Number.isFinite(endValue) && startValue > endValue
      ? 'startDate must be less than or equal to endDate.'
      : 'Provide startDate and endDate as Unix timestamps (max 90 days range).';

  const response: InsightsApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code: 'INVALID_PARAMS',
      message: `Invalid date parameters. ${invalidReason}`,
    },
  };

  return c.json(response, 400);
}

/**
 * Parse granularity parameter
 */
function parseGranularity(c: Context): Granularity {
  const granularity = c.req.query('granularity')?.toUpperCase();
  const validGranularities: Granularity[] = ['HALF_HOUR', 'DAY', 'MONTH'];
  
  // Map common aliases
  const granularityMap: Record<string, Granularity> = {
    'HALF_HOUR': 'HALF_HOUR',
    'DAILY': 'DAY',
    'DAY': 'DAY',
    'MONTHLY': 'MONTH',
    'MONTH': 'MONTH',
  };
  
  const mapped = granularityMap[granularity || ''];
  if (mapped && validGranularities.includes(mapped)) {
    return mapped;
  }
  
  return 'DAY'; // Default
}

/**
 * Parse phone numbers array from query
 */
function parsePhoneNumbers(c: Context): string[] | undefined {
  const phoneNumbers = c.req.query('phoneNumbers');
  if (!phoneNumbers) return undefined;
  
  try {
    return JSON.parse(phoneNumbers);
  } catch {
    return phoneNumbers.split(',').map(p => p.trim()).filter(Boolean);
  }
}

/**
 * Get user's WABA ID from database
 * Uses effectiveUserId to support agents accessing their business owner's data
 */
async function getWabaId(c: Context): Promise<string | null> {
  const userId = getEffectiveUserId(c);
  if (!userId) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wabaId: true }
  });
  
  return user?.wabaId || null;
}

/**
 * GET /api/v1/insights/messages
 * Get message analytics from Meta Graph API
 * Requirements: 6.1
 */
app.get('/messages', requireRole(['ADMIN', 'BUSINESS_OWNER', 'AGENT']), async (c: Context) => {
  try {
    const wabaId = await getWabaId(c);
    if (!wabaId) {
      logger.warn('Insights request rejected: no WABA connected', {
        path: c.req.path,
        userId: getEffectiveUserId(c),
      });
      const response: InsightsApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NO_WABA_CONNECTED',
          message: 'No WhatsApp Business Account connected. Please connect your WABA first.',
        },
      };
      return c.json(response, 400);
    }

    const dateParams = parseDateParams(c);
    if (!dateParams) {
      return buildInvalidDateParamsResponse(c);
    }

    const granularity = parseGranularity(c);
    const phoneNumbers = parsePhoneNumbers(c);

    const data = await insightsService.getMessageAnalytics({
      wabaId,
      startDate: dateParams.startDate,
      endDate: dateParams.endDate,
      granularity,
      phoneNumbers,
    });

    const response: InsightsApiResponse<MessageAnalyticsData> = {
      success: true,
      data,
    };
    return c.json(response);
  } catch (error) {
    return handleInsightsError(c, error);
  }
});

/**
 * GET /api/v1/insights/conversations
 * Get conversation analytics from Meta Graph API
 * Requirements: 6.2
 */
app.get('/conversations', requireRole(['ADMIN', 'BUSINESS_OWNER', 'AGENT']), async (c: Context) => {
  try {
    const wabaId = await getWabaId(c);
    if (!wabaId) {
      logger.warn('Insights request rejected: no WABA connected', {
        path: c.req.path,
        userId: getEffectiveUserId(c),
      });
      const response: InsightsApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NO_WABA_CONNECTED',
          message: 'No WhatsApp Business Account connected. Please connect your WABA first.',
        },
      };
      return c.json(response, 400);
    }

    const dateParams = parseDateParams(c);
    if (!dateParams) {
      return buildInvalidDateParamsResponse(c);
    }

    const granularity = parseGranularity(c);
    const phoneNumbers = parsePhoneNumbers(c);
    
    // Parse conversation categories
    const categoriesStr = c.req.query('categories');
    let conversationCategories: ConversationCategory[] | undefined;
    if (categoriesStr) {
      try {
        conversationCategories = JSON.parse(categoriesStr);
      } catch {
        conversationCategories = categoriesStr.split(',').map(c => c.trim().toUpperCase()) as ConversationCategory[];
      }
    }

    const data = await insightsService.getConversationAnalytics({
      wabaId,
      startDate: dateParams.startDate,
      endDate: dateParams.endDate,
      granularity,
      phoneNumbers,
      conversationCategories,
    });

    const response: InsightsApiResponse<ConversationAnalyticsData> = {
      success: true,
      data,
    };
    return c.json(response);
  } catch (error) {
    return handleInsightsError(c, error);
  }
});

/**
 * GET /api/v1/insights/templates
 * Get template performance metrics from Meta Graph API
 * Requirements: 6.3
 */
app.get('/templates', requireRole(['ADMIN', 'BUSINESS_OWNER', 'AGENT']), async (c: Context) => {
  try {
    const wabaId = await getWabaId(c);
    if (!wabaId) {
      logger.warn('Insights request rejected: no WABA connected', {
        path: c.req.path,
        userId: getEffectiveUserId(c),
      });
      const response: InsightsApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NO_WABA_CONNECTED',
          message: 'No WhatsApp Business Account connected. Please connect your WABA first.',
        },
      };
      return c.json(response, 400);
    }

    const dateParams = parseDateParams(c);
    if (!dateParams) {
      return buildInvalidDateParamsResponse(c);
    }

    // Parse template IDs
    const templateIdsStr = c.req.query('templateIds');
    let templateIds: string[] | undefined;
    if (templateIdsStr) {
      try {
        templateIds = JSON.parse(templateIdsStr);
      } catch {
        templateIds = templateIdsStr.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const data = await insightsService.getTemplatePerformance({
      wabaId,
      startDate: dateParams.startDate,
      endDate: dateParams.endDate,
      templateIds,
    });

    const response: InsightsApiResponse<TemplatePerformanceData> = {
      success: true,
      data,
    };
    return c.json(response);
  } catch (error) {
    return handleInsightsError(c, error);
  }
});

/**
 * GET /api/v1/insights/overview
 * Get combined insights overview
 * Requirements: 6.1, 6.2, 6.3
 */
app.get('/overview', requireRole(['ADMIN', 'BUSINESS_OWNER', 'AGENT']), async (c: Context) => {
  try {
    const wabaId = await getWabaId(c);
    if (!wabaId) {
      logger.warn('Insights request rejected: no WABA connected', {
        path: c.req.path,
        userId: getEffectiveUserId(c),
      });
      const response: InsightsApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NO_WABA_CONNECTED',
          message: 'No WhatsApp Business Account connected. Please connect your WABA first.',
        },
      };
      return c.json(response, 400);
    }

    const dateParams = parseDateParams(c);
    if (!dateParams) {
      return buildInvalidDateParamsResponse(c);
    }

    const granularity = parseGranularity(c);
    const phoneNumbers = parsePhoneNumbers(c);

    const data = await insightsService.getInsightsOverview({
      wabaId,
      startDate: dateParams.startDate,
      endDate: dateParams.endDate,
      granularity,
      phoneNumbers,
    });

    const response: InsightsApiResponse<InsightsOverviewData> = {
      success: true,
      data,
    };
    return c.json(response);
  } catch (error) {
    return handleInsightsError(c, error);
  }
});

/**
 * Handle insights service errors
 * Requirements: 1.4, 2.5, 3.3, 7.4
 */
function handleInsightsError(c: Context, error: unknown) {
  if (error instanceof InsightsServiceError) {
    const statusCode = getStatusCodeForError(error.code);
    
    // If rate limited but we have cached data, return it with a warning (Requirement 7.4)
    if (error.code === 'RATE_LIMITED' && error.cachedData) {
      const response: InsightsApiResponse<unknown> = {
        success: true,
        data: error.cachedData,
        cached: true,
        error: {
          code: 'RATE_LIMITED',
          message: error.message,
          details: error.details,
        },
      };
      return c.json(response, 200);
    }
    
    const response: InsightsApiResponse<null> = {
      success: false,
      data: null,
      error: error.toJSON(),
    };
    return c.json(response, statusCode as 400 | 401 | 403 | 429 | 500);
  }

  console.error('Unexpected error in insights route:', error);
  const response: InsightsApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code: 'META_API_ERROR',
      message: 'An unexpected error occurred while fetching insights data.',
    },
  };
  return c.json(response, 500);
}

/**
 * Get HTTP status code for error type
 */
function getStatusCodeForError(code: string): 400 | 401 | 403 | 429 | 500 {
  switch (code) {
    case 'NO_WABA_CONNECTED':
    case 'INVALID_PARAMS':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'RATE_LIMITED':
      return 429;
    case 'REGION_RESTRICTED':
      return 403;
    default:
      return 500;
  }
}

export default app;
