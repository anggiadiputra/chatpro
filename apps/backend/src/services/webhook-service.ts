import { randomBytes, randomUUID } from 'crypto';
import { prisma } from '../utils/database.js';
import { tokenEncryption } from '../utils/tokenEncryption.js';
import { webhookOutboundQueue } from '../utils/queue.js';

/**
 * Webhook event types supported by the system
 */
export type WebhookEventType =
  | 'message.received'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed';

/**
 * Channel types for webhook filtering
 */
export type WebhookChannel = 'whatsapp' | 'instagram' | 'all';

/**
 * Input for creating a webhook endpoint
 */
export interface CreateWebhookEndpointInput {
  userId: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  channels: WebhookChannel[];
}

/**
 * Input for updating a webhook endpoint
 */
export interface UpdateWebhookEndpointInput {
  name?: string;
  url?: string;
  events?: WebhookEventType[];
  channels?: WebhookChannel[];
  isActive?: boolean;
}

/**
 * Webhook endpoint response
 */
export interface WebhookEndpointResponse {
  id: string;
  name: string;
  url: string;
  events: string[];
  channels: string[];
  isActive: boolean;
  failureCount: number;
  lastFailedAt: Date | null;
  disabledAt: Date | null;
  disableReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  secret?: string; // Only returned on creation
}

/**
 * Test endpoint result
 */
export interface TestEndpointResult {
  success: boolean;
  statusCode?: number;
  latencyMs?: number;
  error?: string;
}

/**
 * Webhook payload structure (as per requirements 8.1, 8.2, 8.4)
 */
export interface WebhookPayload {
  event_type: WebhookEventType;
  event_id: string; // UUID for idempotency
  timestamp: string; // ISO 8601
  data: {
    message_id: string;
    customer_id: string;
    customer_phone?: string; // WhatsApp
    customer_username?: string; // Instagram
    direction: 'inbound' | 'outbound';
    message_type: string;
    content?: string;
    media_url?: string;
    channel: 'whatsapp' | 'instagram';
  };
}

/**
 * Webhook outbound job data for BullMQ
 */
export interface WebhookOutboundJobData {
  webhookEndpointId: string;
  eventId: string;
  eventType: WebhookEventType;
  payload: WebhookPayload;
  attempt: number;
  maxAttempts: number;
}

// Maximum number of webhook endpoints per user
const MAX_ENDPOINTS_PER_USER = 3;

// Valid event types
const VALID_EVENT_TYPES: WebhookEventType[] = [
  'message.received',
  'message.sent',
  'message.delivered',
  'message.read',
  'message.failed',
];

// Valid channels
const VALID_CHANNELS: WebhookChannel[] = ['whatsapp', 'instagram', 'all'];

// Test endpoint timeout (10 seconds as per requirements)
const TEST_ENDPOINT_TIMEOUT_MS = 10000;

/**
 * WebhookService
 * 
 * Handles webhook endpoint management including creation, updates, deletion,
 * and testing. Webhook secrets are encrypted using AES-256-GCM.
 */
export class WebhookService {
  /**
   * Generate a cryptographically secure webhook secret
   * Creates a 256-bit (32 bytes) random secret
   * 
   * @returns The webhook secret string (base64url encoded)
   */
  private generateSecret(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Validate URL format and ensure HTTPS for production
   * 
   * @param url - The URL to validate
   * @throws Error if URL is invalid
   */
  private validateUrl(url: string): void {
    try {
      const parsedUrl = new URL(url);

      // Require HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
        throw new Error('Webhook URL must use HTTPS protocol in production');
      }

      // Allow HTTP only in development
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        throw new Error('Webhook URL must use HTTP or HTTPS protocol');
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Invalid URL format');
      }
      throw error;
    }
  }

  /**
   * Validate event types
   * 
   * @param events - Array of event types to validate
   * @throws Error if any event type is invalid
   */
  private validateEvents(events: WebhookEventType[]): void {
    if (!events || events.length === 0) {
      throw new Error('At least one event type must be specified');
    }

    for (const event of events) {
      if (!VALID_EVENT_TYPES.includes(event)) {
        throw new Error(`Invalid event type: ${event}`);
      }
    }
  }

  /**
   * Validate channels
   * 
   * @param channels - Array of channels to validate
   * @throws Error if any channel is invalid
   */
  private validateChannels(channels: WebhookChannel[]): void {
    if (!channels || channels.length === 0) {
      throw new Error('At least one channel must be specified');
    }

    for (const channel of channels) {
      if (!VALID_CHANNELS.includes(channel)) {
        throw new Error(`Invalid channel: ${channel}`);
      }
    }
  }

  /**
   * Create a new webhook endpoint
   * 
   * @param input - CreateWebhookEndpointInput
   * @returns WebhookEndpointResponse with the secret (only shown once)
   * @throws Error if user has reached maximum endpoint limit or validation fails
   */
  async createEndpoint(input: CreateWebhookEndpointInput): Promise<WebhookEndpointResponse> {
    const { userId, name, url, events, channels } = input;

    // Validate inputs
    this.validateUrl(url);
    this.validateEvents(events);
    this.validateChannels(channels);

    if (!name || name.trim().length === 0) {
      throw new Error('Webhook endpoint name is required');
    }

    // Check if user has reached the maximum limit
    const existingEndpointsCount = await prisma.webhookEndpoint.count({
      where: { userId },
    });

    if (existingEndpointsCount >= MAX_ENDPOINTS_PER_USER) {
      throw new Error(`Maximum limit of ${MAX_ENDPOINTS_PER_USER} webhook endpoints reached`);
    }

    // Generate and encrypt the webhook secret
    const plainSecret = this.generateSecret();
    const encryptedSecret = tokenEncryption.encrypt(plainSecret);

    // Create the webhook endpoint
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        userId,
        name: name.trim(),
        url,
        secret: encryptedSecret.ciphertext,
        secretIV: encryptedSecret.iv,
        secretTag: encryptedSecret.authTag,
        events,
        channels,
        isActive: true,
        failureCount: 0,
      },
    });

    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events,
      channels: endpoint.channels,
      isActive: endpoint.isActive,
      failureCount: endpoint.failureCount,
      lastFailedAt: endpoint.lastFailedAt,
      disabledAt: endpoint.disabledAt,
      disableReason: endpoint.disableReason,
      createdAt: endpoint.createdAt,
      updatedAt: endpoint.updatedAt,
      secret: plainSecret, // Only returned on creation
    };
  }

  /**
   * Update an existing webhook endpoint
   * 
   * @param userId - The user ID (for authorization)
   * @param endpointId - The endpoint ID to update
   * @param input - UpdateWebhookEndpointInput
   * @returns Updated WebhookEndpointResponse
   * @throws Error if endpoint not found or validation fails
   */
  async updateEndpoint(
    userId: string,
    endpointId: string,
    input: UpdateWebhookEndpointInput
  ): Promise<WebhookEndpointResponse> {
    // Find the endpoint and verify ownership
    const existingEndpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    });

    if (!existingEndpoint) {
      throw new Error('Webhook endpoint not found');
    }

    // Validate inputs if provided
    if (input.url) {
      this.validateUrl(input.url);
    }

    if (input.events) {
      this.validateEvents(input.events);
    }

    if (input.channels) {
      this.validateChannels(input.channels);
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new Error('Webhook endpoint name cannot be empty');
    }

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }
    if (input.url !== undefined) {
      updateData.url = input.url;
    }
    if (input.events !== undefined) {
      updateData.events = input.events;
    }
    if (input.channels !== undefined) {
      updateData.channels = input.channels;
    }
    if (input.isActive !== undefined) {
      updateData.isActive = input.isActive;
      // If re-enabling, reset failure count and clear disable info
      if (input.isActive) {
        updateData.failureCount = 0;
        updateData.disabledAt = null;
        updateData.disableReason = null;
      }
    }

    // Update the endpoint
    const endpoint = await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: updateData,
    });

    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events,
      channels: endpoint.channels,
      isActive: endpoint.isActive,
      failureCount: endpoint.failureCount,
      lastFailedAt: endpoint.lastFailedAt,
      disabledAt: endpoint.disabledAt,
      disableReason: endpoint.disableReason,
      createdAt: endpoint.createdAt,
      updatedAt: endpoint.updatedAt,
    };
  }

  /**
   * Delete a webhook endpoint
   * 
   * @param userId - The user ID (for authorization)
   * @param endpointId - The endpoint ID to delete
   * @throws Error if endpoint not found
   */
  async deleteEndpoint(userId: string, endpointId: string): Promise<void> {
    // Find the endpoint and verify ownership
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    });

    if (!endpoint) {
      throw new Error('Webhook endpoint not found');
    }

    // Delete the endpoint (cascade will delete delivery logs)
    await prisma.webhookEndpoint.delete({
      where: { id: endpointId },
    });
  }

  /**
   * List all webhook endpoints for a user
   * 
   * @param userId - The user ID
   * @returns Array of WebhookEndpointResponse
   */
  async listEndpoints(userId: string): Promise<WebhookEndpointResponse[]> {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return endpoints.map((endpoint) => ({
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events,
      channels: endpoint.channels,
      isActive: endpoint.isActive,
      failureCount: endpoint.failureCount,
      lastFailedAt: endpoint.lastFailedAt,
      disabledAt: endpoint.disabledAt,
      disableReason: endpoint.disableReason,
      createdAt: endpoint.createdAt,
      updatedAt: endpoint.updatedAt,
    }));
  }

  /**
   * Test a webhook endpoint by sending a test payload
   * 
   * @param userId - The user ID (for authorization)
   * @param endpointId - The endpoint ID to test
   * @returns TestEndpointResult with success status and details
   */
  async testEndpoint(userId: string, endpointId: string): Promise<TestEndpointResult> {
    // Find the endpoint and verify ownership
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    });

    if (!endpoint) {
      throw new Error('Webhook endpoint not found');
    }

    // Decrypt the webhook secret
    const secret = tokenEncryption.decrypt({
      ciphertext: endpoint.secret,
      iv: endpoint.secretIV,
      authTag: endpoint.secretTag,
      algorithm: 'aes-256-gcm',
    });

    // Create test payload
    const testPayload = {
      event_type: 'test',
      event_id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from KirimChat',
        endpoint_id: endpointId,
      },
    };

    // Calculate HMAC signature
    const { createHmac } = await import('crypto');
    const payloadString = JSON.stringify(testPayload);
    const signature = createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    const startTime = Date.now();

    try {
      // Send test request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TEST_ENDPOINT_TIMEOUT_MS);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KirimChat-Signature': signature,
          'X-KirimChat-Event': 'test',
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          latencyMs,
        };
      } else {
        return {
          success: false,
          statusCode: response.status,
          latencyMs,
          error: `Server returned status ${response.status}`,
        };
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            latencyMs,
            error: 'Request timed out after 10 seconds',
          };
        }
        return {
          success: false,
          latencyMs,
          error: error.message,
        };
      }

      return {
        success: false,
        latencyMs,
        error: 'Unknown error occurred',
      };
    }
  }

  /**
   * Get delivery logs for a webhook endpoint
   * 
   * @param userId - The user ID (for authorization)
   * @param endpointId - The endpoint ID
   * @param limit - Maximum number of logs to return (default 50)
   * @returns Array of delivery logs
   */
  async getDeliveryLogs(
    userId: string,
    endpointId: string,
    limit: number = 50
  ): Promise<any[]> {
    // Verify endpoint ownership
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    });

    if (!endpoint) {
      throw new Error('Webhook endpoint not found');
    }

    const logs = await prisma.webhookDeliveryLog.findMany({
      where: { webhookEndpointId: endpointId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        eventId: true,
        eventType: true,
        responseStatus: true,
        latencyMs: true,
        attemptNumber: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        nextRetryAt: true,
      },
    });

    return logs;
  }

  /**
   * Get the decrypted secret for a webhook endpoint (internal use)
   * 
   * @param endpointId - The endpoint ID
   * @returns The decrypted secret or null if not found
   */
  async getEndpointSecret(endpointId: string): Promise<string | null> {
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
      select: {
        secret: true,
        secretIV: true,
        secretTag: true,
      },
    });

    if (!endpoint) {
      return null;
    }

    return tokenEncryption.decrypt({
      ciphertext: endpoint.secret,
      iv: endpoint.secretIV,
      authTag: endpoint.secretTag,
      algorithm: 'aes-256-gcm',
    });
  }

  /**
   * Get endpoint by ID (internal use for webhook delivery)
   * 
   * @param endpointId - The endpoint ID
   * @returns The endpoint or null if not found
   */
  async getEndpointById(endpointId: string): Promise<WebhookEndpointResponse | null> {
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint) {
      return null;
    }

    return {
      id: endpoint.id,
      name: endpoint.name,
      url: endpoint.url,
      events: endpoint.events,
      channels: endpoint.channels,
      isActive: endpoint.isActive,
      failureCount: endpoint.failureCount,
      lastFailedAt: endpoint.lastFailedAt,
      disabledAt: endpoint.disabledAt,
      disableReason: endpoint.disableReason,
      createdAt: endpoint.createdAt,
      updatedAt: endpoint.updatedAt,
    };
  }

  /**
   * Emit a webhook event to all matching endpoints for a user
   * Queues webhook delivery jobs to BullMQ within 100ms (Requirement 3.1)
   * 
   * @param userId - The user ID
   * @param eventType - The type of event
   * @param channel - The channel (whatsapp or instagram)
   * @param data - The event data
   */
  async emitEvent(
    userId: string,
    eventType: WebhookEventType,
    channel: 'whatsapp' | 'instagram',
    data: {
      message_id: string;
      customer_id: string;
      customer_phone?: string;
      customer_username?: string;
      direction: 'inbound' | 'outbound';
      message_type: string;
      content?: string;
      media_url?: string;
    }
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`[Webhook Service] 🔔 emitEvent called:`);
      console.log(`  - userId: ${userId}`);
      console.log(`  - eventType: ${eventType}`);
      console.log(`  - channel: ${channel}`);
      console.log(`  - message_id: ${data.message_id}`);

      // Find all active endpoints for this user that match the event type and channel
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: {
          userId,
          isActive: true,
          events: {
            has: eventType,
          },
          OR: [
            { channels: { has: channel } },
            { channels: { has: 'all' } },
          ],
        },
        select: {
          id: true,
        },
      });

      console.log(`[Webhook Service] 📊 Found ${endpoints.length} matching endpoint(s)`);

      if (endpoints.length === 0) {
        console.log(`[Webhook Service] ⚠️ No matching endpoints found for userId: ${userId}, event: ${eventType}, channel: ${channel}`);
        return; // No matching endpoints
      }

      console.log(`[Webhook Service] ✅ Queueing webhooks for ${endpoints.length} endpoint(s)...`);

      // Generate unique event_id (UUID) for idempotency (Requirement 8.3)
      const eventId = randomUUID();

      // Create the webhook payload (Requirements 8.1, 8.2, 8.4)
      const payload: WebhookPayload = {
        event_type: eventType,
        event_id: eventId,
        timestamp: new Date().toISOString(),
        data: {
          message_id: data.message_id,
          customer_id: data.customer_id,
          customer_phone: data.customer_phone,
          customer_username: data.customer_username,
          direction: data.direction,
          message_type: data.message_type,
          content: data.content,
          media_url: data.media_url,
          channel,
        },
      };

      // Queue jobs for each matching endpoint
      const jobPromises = endpoints.map((endpoint) => {
        const jobData: WebhookOutboundJobData = {
          webhookEndpointId: endpoint.id,
          eventId: `${eventId}_${endpoint.id}`, // Unique per endpoint
          eventType,
          payload,
          attempt: 1,
          maxAttempts: 5, // Initial + 4 retries
        };

        return webhookOutboundQueue.add(
          `webhook-${eventType}-${endpoint.id}`,
          jobData,
          {
            jobId: `${eventId}_${endpoint.id}`,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
      });

      // Queue all jobs in parallel
      await Promise.all(jobPromises);

      const elapsed = Date.now() - startTime;
      console.log(`[Webhook Service] ✅ Successfully queued ${endpoints.length} webhook job(s) in ${elapsed}ms`);

      if (elapsed > 100) {
        console.warn(`⚠️ Webhook event queuing took ${elapsed}ms (target: <100ms)`);
      }
    } catch (error) {
      console.error('❌ [Webhook Service] Error emitting webhook event:', error);
      console.error('   Error details:', {
        userId,
        eventType,
        channel,
        message_id: data.message_id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Don't throw - webhook emission should not block the main flow
    }
  }

  /**
   * Get active endpoints for a user matching event type and channel
   * (Used by webhook worker for filtering)
   * 
   * @param userId - The user ID
   * @param eventType - The event type to filter
   * @param channel - The channel to filter
   * @returns Array of matching endpoint IDs
   */
  async getMatchingEndpoints(
    userId: string,
    eventType: WebhookEventType,
    channel: 'whatsapp' | 'instagram'
  ): Promise<string[]> {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        userId,
        isActive: true,
        events: {
          has: eventType,
        },
        OR: [
          { channels: { has: channel } },
          { channels: { has: 'all' } },
        ],
      },
      select: {
        id: true,
      },
    });

    return endpoints.map((e) => e.id);
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
