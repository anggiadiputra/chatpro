import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { auth } from '../../lib/auth.js'
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import authRoutes from '../../routes/auth.js'

const prisma = new PrismaClient()
const emailPrefix = `authsec_${Date.now()}`
const legacyAuthApp = new Hono().route('/api/v1/auth', authRoutes)

describe('Better Auth server-managed user fields', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: emailPrefix } },
    })
    await prisma.$disconnect()
  })

  it('does not allow public sign-up to choose an administrator role', async () => {
    const email = `${emailPrefix}@example.com`
    const response = await auth.handler(new Request('http://localhost:3005/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email,
        name: 'Security Test',
        password: 'StrongPassword123!',
        role: 'ADMIN',
        subscriptionTier: 'PRO',
      }),
    }))

    expect(response.status).toBe(200)

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      select: { role: true, subscriptionTier: true },
    })

    expect(user.role).toBe('BUSINESS_OWNER')
    expect(user.subscriptionTier).toBe('FREE')
  })

  it('does not accept an arbitrary token for a 2FA-enabled legacy account', async () => {
    const email = `${emailPrefix}_2fa@example.com`
    await prisma.user.create({
      data: {
        email,
        name: '2FA Security Test',
        passwordHash: await bcrypt.hash('StrongPassword123!', 4),
        role: 'BUSINESS_OWNER',
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      },
    })

    const response = await legacyAuthApp.request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'StrongPassword123!',
        twoFactorToken: '000000',
      }),
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({
      error: { code: 'Invalid2FA' },
    })
  })

  it('rejects email sign-up without a Turnstile token when protection is enabled', async () => {
    vi.stubEnv('TURNSTILE_ENABLED', 'true')
    const response = await auth.handler(new Request('http://localhost:3005/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: `${emailPrefix}_turnstile@example.com`,
        name: 'Turnstile Security Test',
        password: 'StrongPassword123!',
      }),
    }))

    expect(response.status).toBe(403)
  })

  it('rejects OTP registration initiation without a Turnstile token when protection is enabled', async () => {
    vi.stubEnv('TURNSTILE_ENABLED', 'true')
    const email = `${emailPrefix}_otp_turnstile@example.com`
    await prisma.user.create({
      data: {
        email,
        name: 'Existing OTP Turnstile Test',
        role: 'BUSINESS_OWNER',
      },
    })
    const response = await legacyAuthApp.request('/api/v1/auth/register/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        name: 'OTP Turnstile Test',
        password: 'StrongPassword123!',
      }),
    })

    expect(response.status).toBe(403)
  })
})
