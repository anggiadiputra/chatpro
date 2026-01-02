import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, PlanLimits } from '../../config/plans.js';
import { SubscriptionTier } from '@prisma/client';

describe('Plan Limits Configuration', () => {
  describe('FREE tier', () => {
    const freeLimits = PLAN_LIMITS[SubscriptionTier.FREE];

    it('should have apiAccess disabled', () => {
      expect(freeLimits.apiAccess).toBe(false);
    });

    it('should have webhooksEnabled disabled', () => {
      expect(freeLimits.webhooksEnabled).toBe(false);
    });

    it('should have maxApiKeys set to 0', () => {
      expect(freeLimits.maxApiKeys).toBe(0);
    });

    it('should have maxWebhookEndpoints set to 0', () => {
      expect(freeLimits.maxWebhookEndpoints).toBe(0);
    });

    it('should have aiChatbot disabled', () => {
      expect(freeLimits.aiChatbot).toBe(false);
    });
  });

  describe('LITE tier', () => {
    const liteLimits = PLAN_LIMITS[SubscriptionTier.LITE];

    it('should have apiAccess enabled', () => {
      expect(liteLimits.apiAccess).toBe(true);
    });

    it('should have webhooksEnabled enabled', () => {
      expect(liteLimits.webhooksEnabled).toBe(true);
    });

    it('should have maxApiKeys set to 2', () => {
      expect(liteLimits.maxApiKeys).toBe(2);
    });

    it('should have maxWebhookEndpoints set to 3', () => {
      expect(liteLimits.maxWebhookEndpoints).toBe(3);
    });

    it('should have aiChatbot enabled', () => {
      expect(liteLimits.aiChatbot).toBe(true);
    });
  });

  describe('PRO tier', () => {
    const proLimits = PLAN_LIMITS[SubscriptionTier.PRO];

    it('should have apiAccess enabled', () => {
      expect(proLimits.apiAccess).toBe(true);
    });

    it('should have webhooksEnabled enabled', () => {
      expect(proLimits.webhooksEnabled).toBe(true);
    });

    it('should have maxApiKeys set to 10', () => {
      expect(proLimits.maxApiKeys).toBe(10);
    });

    it('should have maxWebhookEndpoints set to 20', () => {
      expect(proLimits.maxWebhookEndpoints).toBe(20);
    });

    it('should have aiChatbot enabled', () => {
      expect(proLimits.aiChatbot).toBe(true);
    });
  });

  describe('All tiers configuration', () => {
    it('should have configuration for all subscription tiers', () => {
      expect(PLAN_LIMITS[SubscriptionTier.FREE]).toBeDefined();
      expect(PLAN_LIMITS[SubscriptionTier.LITE]).toBeDefined();
      expect(PLAN_LIMITS[SubscriptionTier.PRO]).toBeDefined();
    });

    it('should have all required properties in each tier', () => {
      const requiredProps: (keyof PlanLimits)[] = [
        'aiChatbot',
        'maxKnowledgeDocs',
        'maxAgents',
        'apiAccess',
        'webhooksEnabled',
        'maxApiKeys',
        'maxWebhookEndpoints',
      ];

      for (const tier of Object.values(SubscriptionTier)) {
        const limits = PLAN_LIMITS[tier];
        for (const prop of requiredProps) {
          expect(limits[prop]).toBeDefined();
        }
      }
    });
  });
});
