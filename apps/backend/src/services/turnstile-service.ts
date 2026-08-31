import axios from 'axios'
import { adminSettingsService } from './admin/settings-service.js'

interface TurnstileVerificationResponse {
  success: boolean
  'error-codes'?: string[]
}

class TurnstileService {
  async isEnabled(): Promise<boolean> {
    const configured = await adminSettingsService.getRawValue('turnstile', 'enabled')
      .catch(() => null)
    if (configured !== null && configured !== undefined && configured !== '') {
      return configured === 'true'
    }
    if (process.env.TURNSTILE_ENABLED !== undefined && process.env.TURNSTILE_ENABLED !== '') {
      return process.env.TURNSTILE_ENABLED === 'true'
    }
    return false
  }

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    if (!token) return false

    const secret = await adminSettingsService.getRawValue('turnstile', 'secret_key')
      || process.env.TURNSTILE_SECRET_KEY
    if (!secret) return false

    try {
      const response = await axios.post<TurnstileVerificationResponse>(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        new URLSearchParams({
          secret,
          response: token,
          ...(remoteIp ? { remoteip: remoteIp } : {}),
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 10_000,
        }
      )
      return response.data.success === true
    } catch {
      return false
    }
  }
}

export const turnstileService = new TurnstileService()
