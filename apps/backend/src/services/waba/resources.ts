// ============================================================================
// WABA Resource Discovery Module
// ============================================================================

import axios from 'axios';
import https from 'https';
import { wabaSettings, WABASettings } from './settings.js';
import { WABAServiceError, WABAErrorCode } from './errors.js';
import { logger } from '../../utils/logger.js';
import type {
  WABAResources,
  PhoneNumberDetails,
  WABADetails,
  MetaAPIError,
} from './types.js';

// Create HTTPS agent that forces IPv4 (fixes ETIMEDOUT on some servers)
const httpsAgent = new https.Agent({
  family: 4,
  rejectUnauthorized: true,
});

/**
 * WABAResourceDiscovery
 *
 * Handles WABA resource discovery operations including:
 * - Debug token to find WABA ID
 * - Fetch WABA details (name, timezone, currency)
 * - Fetch phone numbers associated with WABA
 *
 * Uses axios with IPv4 force for reliable connections.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export class WABAResourceDiscovery {
  constructor(private settings: WABASettings) {}

  /**
   * Discover WABA resources (WABA details and phone numbers)
   *
   * Uses debug token to find WABA ID from granular scopes,
   * then fetches WABA details and associated phone numbers.
   *
   * @param accessToken - Meta access token
   * @returns WABA resources including phone numbers
   *
   * Requirements: 5.1, 5.2, 5.3
   */
  async discoverWABAResources(accessToken: string): Promise<WABAResources> {
    // Ensure settings are loaded
    await this.settings.ensureLoaded();
    const apiVersion = this.settings.getApiVersion();
    const appId = this.settings.getAppId();
    const appSecret = this.settings.getAppSecret();

    try {
      console.log('Discovering WABA resources...');

      // Get debug token info to find WABA ID
      const debugResponse = await axios.get(
        `https://graph.facebook.com/${apiVersion}/debug_token`,
        {
          params: {
            input_token: accessToken,
            access_token: `${appId}|${appSecret}`,
          },
          timeout: 60000,
          httpsAgent,
        }
      );

      if (debugResponse.data.error) {
        throw new WABAServiceError(
          WABAErrorCode.RESOURCE_DISCOVERY_FAILED,
          `Debug token failed: ${debugResponse.data.error.message}`,
          debugResponse.data.error
        );
      }

      const debugInfo = debugResponse.data.data;

      // Extract WABA ID from granular scopes
      const wabaScope = debugInfo.granular_scopes?.find(
        (scope: any) => scope.scope === 'whatsapp_business_management'
      );

      if (!wabaScope || !wabaScope.target_ids || wabaScope.target_ids.length === 0) {
        throw new WABAServiceError(
          WABAErrorCode.NO_WABA_FOUND,
          'No WABA found in token permissions',
          { granularScopes: debugInfo.granular_scopes }
        );
      }

      const wabaId = wabaScope.target_ids[0];
      console.log('Found WABA ID:', wabaId);

      // Fetch WABA details
      const wabaDetails = await this.getWABADetails(wabaId, accessToken);

      // Fetch phone numbers associated with WABA
      const phoneNumbers = await this.getPhoneNumbers(wabaId, accessToken);

      return {
        wabaId: wabaDetails.id,
        wabaName: wabaDetails.name || 'WhatsApp Business Account',
        timezone: wabaDetails.timezone_id || 'UTC',
        currency: wabaDetails.currency || 'USD',
        messageTemplateNamespace: wabaDetails.message_template_namespace || '',
        phoneNumbers,
      };
    } catch (error) {
      // Re-throw WABAServiceError as-is
      if (error instanceof WABAServiceError) {
        throw error;
      }

      throw new WABAServiceError(
        WABAErrorCode.RESOURCE_DISCOVERY_FAILED,
        `Resource discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get phone numbers associated with a WABA
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param accessToken - Meta access token
   * @returns Array of phone number details
   *
   * Requirements: 5.3
   */
  async getPhoneNumbers(wabaId: string, accessToken: string): Promise<PhoneNumberDetails[]> {
    // Ensure settings are loaded
    await this.settings.ensureLoaded();
    const apiVersion = this.settings.getApiVersion();

    try {
      console.log('Fetching phone numbers for WABA:', wabaId);

      const response = await axios.get(
        `https://graph.facebook.com/${apiVersion}/${wabaId}/phone_numbers`,
        {
          params: {
            fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status,messaging_limit_tier',
            access_token: accessToken,
          },
          timeout: 60000,
          httpsAgent,
        }
      );

      if (response.data.error) {
        throw new WABAServiceError(
          WABAErrorCode.RESOURCE_DISCOVERY_FAILED,
          `Failed to fetch phone numbers: ${response.data.error.message}`,
          response.data.error
        );
      }

      const phoneNumbersData = response.data.data || [];

      const phoneNumbers: PhoneNumberDetails[] = phoneNumbersData.map((pn: any) => ({
        id: pn.id,
        displayPhoneNumber: pn.display_phone_number,
        verifiedName: pn.verified_name || '',
        qualityRating: pn.quality_rating || 'UNKNOWN',
        codeVerificationStatus: pn.code_verification_status || 'NOT_VERIFIED',
        messagingLimitTier: pn.messaging_limit_tier,
      }));

      if (phoneNumbers.length === 0) {
        logger.warn('No phone numbers found for WABA', { wabaId });
      }

      console.log('Found', phoneNumbers.length, 'phone numbers');
      return phoneNumbers;
    } catch (error) {
      if (error instanceof WABAServiceError) {
        throw error;
      }

      throw new WABAServiceError(
        WABAErrorCode.RESOURCE_DISCOVERY_FAILED,
        `Failed to fetch phone numbers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { wabaId }
      );
    }
  }

  /**
   * Get WABA details (name, timezone, currency, etc.)
   *
   * @param wabaId - WhatsApp Business Account ID
   * @param accessToken - Meta access token
   * @returns WABA details
   *
   * Requirements: 5.2
   */
  async getWABADetails(wabaId: string, accessToken: string): Promise<WABADetails> {
    // Ensure settings are loaded
    await this.settings.ensureLoaded();
    const apiVersion = this.settings.getApiVersion();

    try {
      console.log('Fetching WABA details for:', wabaId);

      const response = await axios.get(
        `https://graph.facebook.com/${apiVersion}/${wabaId}`,
        {
          params: {
            fields: 'id,name,timezone_id,currency,message_template_namespace,account_review_status',
            access_token: accessToken,
          },
          timeout: 60000,
          httpsAgent,
        }
      );

      if (response.data.error) {
        throw new WABAServiceError(
          WABAErrorCode.RESOURCE_DISCOVERY_FAILED,
          `Failed to fetch WABA details: ${response.data.error.message}`,
          response.data.error
        );
      }

      console.log('WABA details fetched:', response.data.name);
      return response.data;
    } catch (error) {
      if (error instanceof WABAServiceError) {
        throw error;
      }

      throw new WABAServiceError(
        WABAErrorCode.RESOURCE_DISCOVERY_FAILED,
        `Failed to fetch WABA details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { wabaId }
      );
    }
  }
}

// Export singleton instance
export const wabaResources = new WABAResourceDiscovery(wabaSettings);
