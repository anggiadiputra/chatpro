import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import https from 'https';
import { logger } from '../utils/logger.js';
import { emailService } from '../services/email/index.js';
import { TokenEncryptionService } from '../utils/tokenEncryption.js';

const prisma = new PrismaClient();
const tokenEncryption = new TokenEncryptionService();

// Create HTTPS agent that forces IPv4 (fixes ETIMEDOUT on some servers)
const httpsAgent = new https.Agent({
  family: 4,
  rejectUnauthorized: true,
});

/**
 * Webhook health check failure tracking
 * Tracks consecutive failures per WABA to avoid spam
 */
const failureTracker = new Map<string, number>();

/**
 * Maximum consecutive failures before alerting administrators
 */
const MAX_FAILURES_BEFORE_ALERT = 3;

/**
 * Webhook fields to subscribe to
 */
const WEBHOOK_FIELDS = ['messages', 'message_status', 'message_template_status_update'];

/**
 * Cron job to verify webhook subscriptions are active
 * 
 * Runs hourly to check if webhooks are still subscribed and
 * resubscribes if needed. Alerts administrators on repeated failures.
 */
export function startWebhookHealthCheckJob() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting webhook health check job');

    try {
      // Get all connected users with WABA
      const users = await prisma.user.findMany({
        where: {
          wabaConnectionStatus: 'connected',
          wabaAccessToken: { not: null },
          wabaId: { not: null },
        },
      });

      if (users.length === 0) {
        logger.info('No connected WABAs found for webhook health check');
        return;
      }

      logger.info(`Checking webhook health for ${users.length} users`);

      const results = {
        healthy: 0,
        resubscribed: 0,
        failed: 0,
        errors: [] as Array<{ wabaId: string; error: string; attemptCount: number }>,
      };

      for (const user of users) {
        try {
          if (!user.wabaId) {
            continue;
          }

          // Decrypt access token
          if (!user.wabaAccessToken || !user.wabaAccessTokenIV || !user.wabaAccessTokenTag) {
            logger.warn(`No access token found for user ${user.id}`);
            continue;
          }

          const accessToken = tokenEncryption.decrypt({
            ciphertext: user.wabaAccessToken,
            iv: user.wabaAccessTokenIV,
            authTag: user.wabaAccessTokenTag,
            algorithm: 'aes-256-gcm',
          });

          // Check if webhook subscription is active
          const subscriptionResponse = await axios.get(
            `https://graph.facebook.com/v23.0/${user.wabaId}/subscribed_apps`,
            {
              params: {
                access_token: accessToken,
              },
              timeout: 30000,
              httpsAgent,
            }
          );

          const subscriptions = subscriptionResponse.data.data || [];
          const isSubscribed = subscriptions.some((sub: any) => 
            sub.whatsapp_business_api_data?.subscribed_fields?.length > 0
          );

          if (isSubscribed) {
            // Webhook is healthy
            results.healthy++;
            
            // Reset failure counter
            if (failureTracker.has(user.wabaId)) {
              failureTracker.delete(user.wabaId);
            }

            logger.info(`Webhook subscription healthy for WABA ${user.wabaId}`);
          } else {
            // Webhook subscription is missing, try to resubscribe
            logger.warn(`Webhook subscription missing for WABA ${user.wabaId}, attempting to resubscribe`);

            try {
              // Resubscribe to webhooks
              await axios.post(
                `https://graph.facebook.com/v23.0/${user.wabaId}/subscribed_apps`,
                {},
                {
                  params: {
                    access_token: accessToken,
                  },
                  timeout: 30000,
                  httpsAgent,
                }
              );

              results.resubscribed++;
              
              // Reset failure counter
              if (failureTracker.has(user.wabaId)) {
                failureTracker.delete(user.wabaId);
              }

              // Update webhook subscription timestamp
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  webhookSubscribedAt: new Date(),
                },
              });

              logger.info(`Successfully resubscribed webhooks for WABA ${user.wabaId}`);
            } catch (resubscribeError) {
              const errorMessage = resubscribeError instanceof Error 
                ? resubscribeError.message 
                : 'Unknown error';

              // Increment failure counter
              const currentFailures = (failureTracker.get(user.wabaId) || 0) + 1;
              failureTracker.set(user.wabaId, currentFailures);

              results.failed++;
              results.errors.push({
                wabaId: user.wabaId,
                error: errorMessage,
                attemptCount: currentFailures,
              });

              logger.error(
                `Failed to resubscribe webhooks for WABA ${user.wabaId} (attempt ${currentFailures}): ${errorMessage}`
              );

              // Alert administrators after MAX_FAILURES_BEFORE_ALERT consecutive failures
              if (currentFailures >= MAX_FAILURES_BEFORE_ALERT) {
                await emailService.sendWebhookSubscriptionFailure(
                  user.wabaId,
                  user.name || 'Unknown User',
                  errorMessage,
                  currentFailures
                );

                logger.info(
                  `Sent webhook subscription failure alert for WABA ${user.wabaId} after ${currentFailures} attempts`
                );
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Increment failure counter
          const wabaId = user.wabaId || 'unknown';
          const currentFailures = (failureTracker.get(wabaId) || 0) + 1;
          failureTracker.set(wabaId, currentFailures);

          results.failed++;
          results.errors.push({
            wabaId,
            error: errorMessage,
            attemptCount: currentFailures,
          });

          logger.error(
            `Webhook health check failed for user ${user.id}: ${errorMessage}`
          );

          // Alert administrators after MAX_FAILURES_BEFORE_ALERT consecutive failures
          if (currentFailures >= MAX_FAILURES_BEFORE_ALERT) {
            await emailService.sendWebhookSubscriptionFailure(
              wabaId,
              user.name || 'Unknown User',
              errorMessage,
              currentFailures
            );
          }
        }

        // Wait 500ms between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      logger.info(
        `Webhook health check completed: ${results.healthy} healthy, ${results.resubscribed} resubscribed, ${results.failed} failed`
      );

      if (results.errors.length > 0) {
        logger.error('Webhook health check errors:', JSON.stringify(results.errors, null, 2));
      }
    } catch (error) {
      logger.error('Webhook health check job error:', error);
    }
  });

  logger.info('Webhook health check cron job scheduled (hourly)');
}
