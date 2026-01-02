import type { Context, Next } from 'hono';
import { cacheRedis } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyPrefix: string; // Redis key prefix
  message?: string; // Custom error message
}

/**
 * Rate limit result
 */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until reset
}

// Rate limit configurations
const GLOBAL_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyPrefix: 'ratelimit:global:',
  message: 'API rate limit exceeded. Maximum 100 requests per minute.',
};

const SEND_MESSAGE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 messages per minute
  keyPrefix: 'ratelimit:send:',
  message: 'Message send rate limit exceeded. Maximum 60 messages per minute.',
};

/**
 * Check rate limit using Redis sliding window counter
 * Uses a simple fixed window approach with Redis INCR and EXPIRE
 */
async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(config.windowMs / 1000);
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const key = `${config.keyPrefix}${identifier}:${windowStart}`;

  try {
    // Increment counter
    const count = await cacheRedis.incr(key);

    // Set expiry on first request in window
    if (count === 1) {
      await cacheRedis.expire(key, windowSeconds + 1); // +1 for safety margin
    }

    const resetTime = windowStart + windowSeconds;
    const remaining = Math.max(0, config.max - count);
    const allowed = count <= config.max;

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : resetTime - now,
    };
  } catch (error) {
    logger.error('Rate limit check error:', error);
    // Fail open - allow request if Redis is unavailable
    return {
      allowed: true,
      remaining: config.max,
      resetTime: now + windowSeconds,
    };
  }
}


/**
 * Set rate limit headers on response
 */
function setRateLimitHeaders(c: Context, result: RateLimitResult, max: number): void {
  c.header('X-RateLimit-Limit', max.toString());
  c.header('X-RateLimit-Remaining', result.remaining.toString());
  c.header('X-RateLimit-Reset', result.resetTime.toString());
}

/**
 * Global rate limiter middleware for Public API
 * Limits to 100 requests per minute per API key
 * 
 * Requirements: 7.3
 */
export async function publicApiGlobalRateLimiter(c: Context, next: Next): Promise<Response | void> {
  // Skip rate limiting for OPTIONS (CORS preflight)
  if (c.req.method === 'OPTIONS') {
    return await next();
  }

  // Get API key ID from context (set by apiKeyAuthMiddleware)
  const apiKeyId = c.get('apiKeyId');
  
  if (!apiKeyId) {
    // If no API key ID, authentication middleware should have already rejected
    // This is a fallback - use IP-based limiting
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
               c.req.header('x-real-ip') || 
               'unknown';
    
    const result = await checkRateLimit(ip, GLOBAL_RATE_LIMIT);
    
    if (!result.allowed) {
      setRateLimitHeaders(c, result, GLOBAL_RATE_LIMIT.max);
      return c.json(
        {
          error: {
            code: 'RateLimitExceeded',
            message: GLOBAL_RATE_LIMIT.message,
            retryAfter: result.retryAfter,
          },
        },
        429,
        {
          'Retry-After': result.retryAfter?.toString() || '60',
        }
      );
    }
    
    setRateLimitHeaders(c, result, GLOBAL_RATE_LIMIT.max);
    return await next();
  }

  // Check global rate limit for API key
  const result = await checkRateLimit(apiKeyId, GLOBAL_RATE_LIMIT);

  if (!result.allowed) {
    setRateLimitHeaders(c, result, GLOBAL_RATE_LIMIT.max);
    
    logger.warn(`Rate limit exceeded for API key ${apiKeyId.substring(0, 8)}...`);
    
    return c.json(
      {
        error: {
          code: 'RateLimitExceeded',
          message: GLOBAL_RATE_LIMIT.message,
          retryAfter: result.retryAfter,
        },
      },
      429,
      {
        'Retry-After': result.retryAfter?.toString() || '60',
      }
    );
  }

  // Set rate limit headers
  setRateLimitHeaders(c, result, GLOBAL_RATE_LIMIT.max);

  await next();
}

/**
 * Send message rate limiter middleware
 * Limits to 60 messages per minute per API key
 * Apply this to POST /api/v1/messages/send endpoint
 * 
 * Requirements: 6.7
 */
export async function sendMessageRateLimiter(c: Context, next: Next): Promise<Response | void> {
  // Skip rate limiting for OPTIONS (CORS preflight)
  if (c.req.method === 'OPTIONS') {
    return await next();
  }

  // Get API key ID from context
  const apiKeyId = c.get('apiKeyId');
  
  if (!apiKeyId) {
    // Fallback to IP-based limiting
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
               c.req.header('x-real-ip') || 
               'unknown';
    
    const result = await checkRateLimit(ip, SEND_MESSAGE_RATE_LIMIT);
    
    if (!result.allowed) {
      c.header('X-RateLimit-Limit-Send', SEND_MESSAGE_RATE_LIMIT.max.toString());
      c.header('X-RateLimit-Remaining-Send', result.remaining.toString());
      c.header('X-RateLimit-Reset-Send', result.resetTime.toString());
      
      return c.json(
        {
          error: {
            code: 'RateLimitExceeded',
            message: SEND_MESSAGE_RATE_LIMIT.message,
            retryAfter: result.retryAfter,
          },
        },
        429,
        {
          'Retry-After': result.retryAfter?.toString() || '60',
        }
      );
    }
    
    return await next();
  }

  // Check send message rate limit for API key
  const result = await checkRateLimit(apiKeyId, SEND_MESSAGE_RATE_LIMIT);

  if (!result.allowed) {
    c.header('X-RateLimit-Limit-Send', SEND_MESSAGE_RATE_LIMIT.max.toString());
    c.header('X-RateLimit-Remaining-Send', result.remaining.toString());
    c.header('X-RateLimit-Reset-Send', result.resetTime.toString());
    
    logger.warn(`Send message rate limit exceeded for API key ${apiKeyId.substring(0, 8)}...`);
    
    return c.json(
      {
        error: {
          code: 'RateLimitExceeded',
          message: SEND_MESSAGE_RATE_LIMIT.message,
          retryAfter: result.retryAfter,
        },
      },
      429,
      {
        'Retry-After': result.retryAfter?.toString() || '60',
      }
    );
  }

  // Set send-specific rate limit headers
  c.header('X-RateLimit-Limit-Send', SEND_MESSAGE_RATE_LIMIT.max.toString());
  c.header('X-RateLimit-Remaining-Send', result.remaining.toString());
  c.header('X-RateLimit-Reset-Send', result.resetTime.toString());

  await next();
}

/**
 * Combined rate limiter that checks both global and endpoint-specific limits
 * Use this for the send message endpoint to apply both limits
 */
export async function combinedSendRateLimiter(c: Context, next: Next): Promise<Response | void> {
  // Skip rate limiting for OPTIONS (CORS preflight)
  if (c.req.method === 'OPTIONS') {
    return await next();
  }

  const apiKeyId = c.get('apiKeyId');
  const identifier = apiKeyId || 
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
    c.req.header('x-real-ip') || 
    'unknown';

  // Check global rate limit first
  const globalResult = await checkRateLimit(identifier, GLOBAL_RATE_LIMIT);
  
  if (!globalResult.allowed) {
    setRateLimitHeaders(c, globalResult, GLOBAL_RATE_LIMIT.max);
    
    return c.json(
      {
        error: {
          code: 'RateLimitExceeded',
          message: GLOBAL_RATE_LIMIT.message,
          retryAfter: globalResult.retryAfter,
        },
      },
      429,
      {
        'Retry-After': globalResult.retryAfter?.toString() || '60',
      }
    );
  }

  // Check send message rate limit
  const sendResult = await checkRateLimit(identifier, SEND_MESSAGE_RATE_LIMIT);
  
  if (!sendResult.allowed) {
    // Set both headers
    setRateLimitHeaders(c, globalResult, GLOBAL_RATE_LIMIT.max);
    c.header('X-RateLimit-Limit-Send', SEND_MESSAGE_RATE_LIMIT.max.toString());
    c.header('X-RateLimit-Remaining-Send', sendResult.remaining.toString());
    c.header('X-RateLimit-Reset-Send', sendResult.resetTime.toString());
    
    return c.json(
      {
        error: {
          code: 'RateLimitExceeded',
          message: SEND_MESSAGE_RATE_LIMIT.message,
          retryAfter: sendResult.retryAfter,
        },
      },
      429,
      {
        'Retry-After': sendResult.retryAfter?.toString() || '60',
      }
    );
  }

  // Set all rate limit headers
  setRateLimitHeaders(c, globalResult, GLOBAL_RATE_LIMIT.max);
  c.header('X-RateLimit-Limit-Send', SEND_MESSAGE_RATE_LIMIT.max.toString());
  c.header('X-RateLimit-Remaining-Send', sendResult.remaining.toString());
  c.header('X-RateLimit-Reset-Send', sendResult.resetTime.toString());

  await next();
}
