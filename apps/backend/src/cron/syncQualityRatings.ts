import cron from 'node-cron';
import axios from 'axios';
import https from 'https';
import { logger } from '../utils/logger.js';
import { PrismaClient, QualityRatingEnum } from '@prisma/client';
import { TokenEncryptionService } from '../utils/tokenEncryption.js';
import { emailService } from '../services/email/index.js';

const prisma = new PrismaClient();
const tokenEncryption = new TokenEncryptionService();

// Create HTTPS agent that forces IPv4 (fixes ETIMEDOUT on some servers)
const httpsAgent = new https.Agent({
  family: 4,
  rejectUnauthorized: true,
});

/**
 * Cron job to sync quality ratings from Meta
 * 
 * Runs every 6 hours to check phone number quality ratings
 * and send alerts if ratings drop.
 */
export function startQualityRatingSyncJob() {
  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Starting quality rating sync job');

    try {
      // Get all connected users with WABA
      const users = await prisma.user.findMany({
        where: {
          wabaConnectionStatus: 'connected',
          wabaAccessToken: { not: null },
          phoneNumberId: { not: null },
        }
      });

      if (users.length === 0) {
        logger.info('No connected WABAs found for quality rating sync');
        return;
      }

      logger.info(`Syncing quality ratings for ${users.length} users with WABA`);

      const results = {
        success: 0,
        failed: 0,
        ratingsDropped: 0,
        errors: [] as Array<{ wabaId: string; error: string }>,
      };

      for (const user of users) {
        try {
          // Skip if no phone number ID
          if (!user.phoneNumberId) {
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

          // Fetch quality rating from Meta
          const response = await axios.get(
            `https://graph.facebook.com/v23.0/${user.phoneNumberId}`,
            {
              params: {
                fields: 'quality_rating,code_verification_status',
                access_token: accessToken,
              },
              timeout: 30000,
              httpsAgent,
            }
          );

          const qualityRating = response.data.quality_rating as QualityRatingEnum;

          // Get previous rating
          const previousRating = await prisma.qualityRating.findFirst({
            where: {
              userId: user.id,
              phoneNumberId: user.phoneNumberId,
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          // Store new rating
          await prisma.qualityRating.create({
            data: {
              phoneNumberId: user.phoneNumberId,
              rating: qualityRating,
              status: 'Connected',
              userId: user.id,
            },
          });

          // Check if rating dropped
          if (previousRating && previousRating.rating !== qualityRating) {
            const ratingOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
            const oldRatingValue = ratingOrder[previousRating.rating];
            const newRatingValue = ratingOrder[qualityRating];

            if (newRatingValue < oldRatingValue) {
              logger.warn(
                `Quality rating dropped for user ${user.id}: ${previousRating.rating} -> ${qualityRating}`
              );
              results.ratingsDropped++;

              // Send email notification
              await emailService.sendQualityRatingDrop(
                user.phoneNumberId,
                previousRating.rating,
                qualityRating,
                user.name || 'User',
                user.email
              );
            }
          }

          // Update last sync timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: {
              wabaLastSyncAt: new Date(),
            },
          });

          results.success++;
          logger.info(`Quality rating synced for user ${user.id}: ${qualityRating}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Failed to sync quality rating for user ${user.id}: ${errorMessage}`);
          results.failed++;
          if (user.wabaId) {
            results.errors.push({ wabaId: user.wabaId, error: errorMessage });
          }
        }
      }

      logger.info(
        `Quality rating sync completed: ${results.success} succeeded, ${results.failed} failed, ${results.ratingsDropped} ratings dropped`
      );
    } catch (error) {
      logger.error('Quality rating sync job error:', error);
    }
  });

  logger.info('Quality rating sync cron job scheduled (every 6 hours)');
}
