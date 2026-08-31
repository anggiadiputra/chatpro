import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { turnstileService } from "../services/turnstile-service.js"

const prisma = new PrismaClient()

// Helper to create audit log
async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>,
  userId?: string,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : undefined,
        userId,
        ipAddress
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3005",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true, // Auto sign in after registration
    sendResetPasswordEmail: undefined, // Disable password reset
    // Use bcrypt for password hashing (compatible with OTP registration flow)
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 12)
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash)
      }
    }
  },

  // Google OAuth Provider
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Enable account linking - allow linking Google to existing email/password accounts
      enabled: true,
    },
  },

  // Account linking configuration
  account: {
    accountLinking: {
      enabled: true, // Allow linking OAuth accounts to existing users
      trustedProviders: ["google"], // Trust Google for auto-linking
    },
  },

  // Registration is now ENABLED
  // onRequest hook removed to allow sign-up
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: false,
      maxAge: 60 * 60 * 24 * 7,
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "BUSINESS_OWNER",
        input: false,
      },
      wabaId: {
        type: "string",
        required: false,
        input: false,
      },
      phoneNumberId: {
        type: "string",
        required: false,
        input: false,
      },
      wabaConnectionStatus: {
        type: "string",
        required: false,
        input: false,
      },
      subscriptionTier: {
        type: "string",
        required: false,
        defaultValue: "FREE",
        input: false,
      },
    },
  },
  trustedOrigins: (() => {
    const corsOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : []
    const frontendUrl = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []
    const publicUrl = process.env.PUBLIC_URL ? [process.env.PUBLIC_URL.trim()] : []
    const defaults = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3005",
      "https://kirim.chat",
      "https://api.kirim.chat",
      "https://app.prochat.work",
      "https://api.prochat.work"
    ]
    return Array.from(new Set([...defaults, ...corsOrigins, ...frontendUrl, ...publicUrl])).filter(Boolean)
  })(),
  advanced: {
    crossSubDomainCookies: {
      enabled: true,  // Always enable for cross-subdomain support
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    },
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  
  // Hooks for audit logging
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-up/email") return
      if (!await turnstileService.isEnabled()) return

      const token = ctx.headers?.get('x-turnstile-token') || ''
      const remoteIp = ctx.headers?.get('cf-connecting-ip')
        || ctx.headers?.get('x-real-ip')
        || undefined
      if (!token || !await turnstileService.verify(token, remoteIp)) {
        throw new APIError('FORBIDDEN', {
          code: 'TURNSTILE_VERIFICATION_FAILED',
          message: 'Security verification failed',
        })
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      const ip = ctx.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() 
        || ctx.headers?.get('x-real-ip') 
        || 'unknown'
      
      // Log successful sign-in
      if (ctx.path === "/sign-in/email" && ctx.context.newSession) {
        const user = ctx.context.newSession.user
        await createAuditLog(
          'LOGIN_SUCCESS',
          'User',
          user.id,
          { email: user.email, provider: 'email' },
          user.id,
          ip
        )
      }
      
      // Log successful sign-up
      if (ctx.path === "/sign-up/email" && ctx.context.newSession) {
        const user = ctx.context.newSession.user
        await createAuditLog(
          'USER_REGISTERED',
          'User',
          user.id,
          { email: user.email, provider: 'email' },
          user.id,
          ip
        )
      }
      
      // Log Google OAuth sign-in/sign-up
      if (ctx.path?.startsWith("/callback/google") && ctx.context.newSession) {
        const user = ctx.context.newSession.user
        await createAuditLog(
          'LOGIN_SUCCESS',
          'User',
          user.id,
          { email: user.email, provider: 'google' },
          user.id,
          ip
        )
      }
      
      // Log failed sign-in (check if returned has error)
      if (ctx.path === "/sign-in/email" && !ctx.context.newSession) {
        const body = ctx.body as { email?: string } | undefined
        const email = body?.email || 'unknown'
        await createAuditLog(
          'LOGIN_FAILED',
          'User',
          email,
          { email, reason: 'Invalid credentials or account not found', provider: 'email' },
          undefined,
          ip
        )
      }
      
      // Log sign-out
      if (ctx.path === "/sign-out") {
        const session = ctx.context.session
        if (session?.user) {
          await createAuditLog(
            'LOGOUT',
            'User',
            session.user.id,
            { email: session.user.email },
            session.user.id,
            ip
          )
        }
      }
    }),
  },
})
