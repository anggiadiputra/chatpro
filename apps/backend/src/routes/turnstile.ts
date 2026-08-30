/**
 * Public Cloudflare Turnstile Routes
 * 
 * Public API endpoint for fetching Turnstile public settings (siteKey, enabled)
 * and verifying Turnstile tokens.
 */

import { Hono } from 'hono'
import type { Context } from 'hono'
import axios from 'axios'
import { settingsCache, CACHE_TTL } from '../services/settings-cache.js'
import { prisma } from '../utils/database.js'
import { logger } from '../utils/logger.js'
import { 
  DEFAULT_TURNSTILE,
  type TurnstileSettings 
} from '../types/admin-settings.js'
import { adminSettingsService } from '../services/admin/settings-service.js'

const app = new Hono()

const TURNSTILE_CACHE_KEY = 'turnstile:public'

export interface TurnstilePublicConfig {
  enabled: boolean
  siteKey: string
}

/**
 * GET /api/v1/turnstile
 * Public endpoint to fetch Turnstile client configuration
 * Returns enabled flag and public siteKey
 * Cached for 60 seconds
 */
app.get('/', async (c: Context) => {
  try {
    // Check cache first
    const cached = settingsCache.get<TurnstilePublicConfig>(TURNSTILE_CACHE_KEY)
    if (cached) {
      return c.json({
        success: true,
        data: cached
      })
    }

    // Fetch from database
    const dbSettings = await prisma.systemSetting.findMany({
      where: { category: 'turnstile' }
    })

    let enabled = process.env.TURNSTILE_ENABLED === 'true'
    let siteKey = process.env.TURNSTILE_SITE_KEY || DEFAULT_TURNSTILE.siteKey

    if (dbSettings.length > 0) {
      for (const setting of dbSettings) {
        if (setting.key === 'enabled') {
          enabled = setting.value === 'true'
        } else if (setting.key === 'site_key' && setting.value) {
          siteKey = setting.value
        }
      }
    }

    const publicConfig: TurnstilePublicConfig = {
      enabled,
      siteKey: enabled ? siteKey : ''
    }

    // Cache for 60 seconds
    settingsCache.set(TURNSTILE_CACHE_KEY, publicConfig, CACHE_TTL.settings)

    return c.json({
      success: true,
      data: publicConfig
    })
  } catch (error) {
    logger.error('Failed to fetch Turnstile public settings', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return c.json({
      success: true,
      data: {
        enabled: false,
        siteKey: ''
      }
    })
  }
})

/**
 * POST /api/v1/turnstile/verify
 * Verifies a Turnstile response token with Cloudflare API
 */
app.post('/verify', async (c: Context) => {
  try {
    const body = await c.req.json()
    const { token } = body

    if (!token) {
      return c.json({
        success: false,
        message: 'Turnstile token is required'
      }, 400)
    }

    // Get secret key from database or .env
    const secretKey = await adminSettingsService.getRawValue('turnstile', 'secret_key')

    if (!secretKey) {
      return c.json({
        success: false,
        message: 'Turnstile secret key is not configured'
      }, 500)
    }

    // Call Cloudflare Turnstile siteverify API
    const verifyRes = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || ''
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    )

    const outcome = verifyRes.data

    if (outcome.success) {
      return c.json({
        success: true,
        message: 'Verification successful'
      })
    } else {
      logger.warn('Turnstile verification failed', {
        errorCodes: outcome['error-codes']
      })
      return c.json({
        success: false,
        message: 'Turnstile verification failed',
        errorCodes: outcome['error-codes']
      }, 400)
    }
  } catch (error) {
    logger.error('Error verifying Turnstile token', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Verification request failed'
    }, 500)
  }
})

/**
 * Invalidate Turnstile cache
 */
export function invalidateTurnstileCache(): void {
  settingsCache.invalidate(TURNSTILE_CACHE_KEY)
  logger.debug('Turnstile cache invalidated')
}

export default app
