import { SubscriptionTier } from '@prisma/client'

export interface PlanLimits {
  aiChatbot: boolean
  maxKnowledgeDocs: number
  maxAgents: number
  // Developer Features
  apiAccess: boolean
  webhooksEnabled: boolean
  maxApiKeys: number
  maxWebhookEndpoints: number
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  [SubscriptionTier.FREE]: {
    aiChatbot: false,
    maxKnowledgeDocs: 0,
    maxAgents: 0,
    apiAccess: false,
    webhooksEnabled: false,
    maxApiKeys: 0,
    maxWebhookEndpoints: 0
  },
  [SubscriptionTier.LITE]: {
    aiChatbot: true,
    maxKnowledgeDocs: 5,
    maxAgents: 1,
    apiAccess: true,
    webhooksEnabled: true,
    maxApiKeys: 2,
    maxWebhookEndpoints: 3
  },
  [SubscriptionTier.PRO]: {
    aiChatbot: true,
    maxKnowledgeDocs: 50,
    maxAgents: 10,
    apiAccess: true,
    webhooksEnabled: true,
    maxApiKeys: 10,
    maxWebhookEndpoints: 20
  }
}