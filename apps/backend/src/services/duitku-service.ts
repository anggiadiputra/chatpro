/**
 * DuitkuService
 * 
 * Handles integration with Duitku Legacy API for QRIS payments.
 * Uses MD5 signature for authentication.
 * 
 * Requirements: 1.3, 5.3, 5.4, 5.5, 6.2, 6.3, 9.1, 9.2, 10.1
 */

import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger.js';
import { adminSettingsService } from './admin/settings-service.js';
import type { DuitkuSettings } from '../types/admin-settings.js';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  environment: 'sandbox' | 'production';
  enabled: boolean;
}

export interface CreateQRPaymentParams {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  productDetails: string;
  returnUrl: string;
  expiryMinutes?: number;
}

export interface CreateQRPaymentResponse {
  success: boolean;
  referenceNo?: string;
  qrString?: string;
  qrUrl?: string;
  paymentUrl?: string;
  expiresAt?: Date;
  error?: string;
  errorCode?: string;
}

export interface CheckTransactionResponse {
  success: boolean;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  amount?: number;
  paidAt?: Date;
  error?: string;
}

export interface DuitkuCallbackPayload {
  // Legacy API format (form-urlencoded)
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  productDetail?: string;      // Product details
  additionalParam?: string;    // Additional parameter from merchant
  paymentCode: string;         // Payment method code (e.g., 'SP' for ShopeePay QRIS)
  resultCode: string;          // '00' = success, '01' = pending, '02' = failed
  merchantUserId?: string;     // Customer's username/email on merchant site
  reference: string;           // Duitku reference number
  signature: string;           // MD5(merchantCode + amount + merchantOrderId + apiKey)
  publisherOrderId?: string;   // Publisher order ID
  spUserHash?: string;         // ShopeePay user hash
  settlementDate?: string;     // Settlement date (YYYY-MM-DD)
  issuerCode?: string;         // QRIS issuer code
  // SNAP format compatibility
  partnerReferenceNo?: string;
  referenceNo?: string;
  responseCode?: string;
  additionalInfo?: {
    transactionStatus?: string;
    paidAt?: string;
  };
}

// API endpoints
const ENDPOINTS = {
  sandbox: 'https://sandbox.duitku.com/webapi/api/merchant',
  production: 'https://passport.duitku.com/webapi/api/merchant',
} as const;

// QRIS payment code for ShopeePay QRIS
const PAYMENT_CODE = 'SP';

// =============================================================================
// DuitkuService Class
// =============================================================================

export class DuitkuService {
  private config: DuitkuConfig | null = null;

  // ===========================================================================
  // Configuration Methods
  // ===========================================================================

  async getConfig(): Promise<DuitkuConfig> {
    try {
      const settings = await adminSettingsService.getDecryptedSettings<DuitkuSettings>('duitku');
      
      this.config = {
        merchantCode: settings.merchantCode || '',
        apiKey: settings.apiKey || '',
        environment: settings.environment || 'sandbox',
        enabled: settings.enabled ?? false,
      };

      return this.config;
    } catch (error) {
      logger.error('Failed to get Duitku config', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Failed to load Duitku configuration');
    }
  }

  getBaseUrl(environment: 'sandbox' | 'production'): string {
    return ENDPOINTS[environment];
  }

  /**
   * Generate MD5 signature for Duitku Legacy API
   * Format: MD5(merchantCode + merchantOrderId + amount + apiKey)
   */
  generateSignature(merchantCode: string, orderId: string, amount: number, apiKey: string): string {
    const stringToSign = `${merchantCode}${orderId}${amount}${apiKey}`;
    return crypto.createHash('md5').update(stringToSign).digest('hex');
  }

  /**
   * Generate callback signature for validation
   * Format: MD5(merchantCode + amount + merchantOrderId + apiKey)
   */
  generateCallbackSignature(merchantCode: string, amount: string, orderId: string, apiKey: string): string {
    const stringToSign = `${merchantCode}${amount}${orderId}${apiKey}`;
    return crypto.createHash('md5').update(stringToSign).digest('hex');
  }

  // ===========================================================================
  // QR Payment Methods
  // ===========================================================================

  async createQRPayment(params: CreateQRPaymentParams): Promise<CreateQRPaymentResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeCreateQRPayment(params);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        logger.warn('Duitku createQRPayment attempt failed', {
          attempt,
          maxRetries,
          orderId: params.orderId,
          error: lastError.message,
        });

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await this.sleep(delay);
        }
      }
    }

    logger.error('Duitku createQRPayment failed after all retries', {
      orderId: params.orderId,
      error: lastError?.message,
    });

    return {
      success: false,
      error: lastError?.message || 'Failed to create payment after multiple attempts',
      errorCode: 'DUITKU_ERROR',
    };
  }

  private async executeCreateQRPayment(params: CreateQRPaymentParams): Promise<CreateQRPaymentResponse> {
    const config = await this.getConfig();
    
    if (!config.enabled) {
      return {
        success: false,
        error: 'Payment gateway is disabled',
        errorCode: 'PAYMENT_DISABLED',
      };
    }

    if (!config.merchantCode || !config.apiKey) {
      return {
        success: false,
        error: 'Payment gateway not configured',
        errorCode: 'PAYMENT_NOT_CONFIGURED',
      };
    }

    const baseUrl = this.getBaseUrl(config.environment);
    const expiryMinutes = params.expiryMinutes || 15;
    
    // Generate signature
    const signature = this.generateSignature(
      config.merchantCode,
      params.orderId,
      params.amount,
      config.apiKey
    );

    // Build request body for Duitku Legacy API
    const requestBody = {
      merchantCode: config.merchantCode,
      paymentAmount: params.amount,
      paymentMethod: PAYMENT_CODE,
      merchantOrderId: params.orderId,
      productDetails: params.productDetails,
      customerVaName: params.customerName,
      email: params.customerEmail,
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:3005'}/api/v1/webhooks/duitku/callback`,
      returnUrl: params.returnUrl,
      expiryPeriod: expiryMinutes,
      signature,
    };

    try {
      logger.info('Creating Duitku payment', {
        orderId: params.orderId,
        amount: params.amount,
        environment: config.environment,
      });

      const response = await axios.post(
        `${baseUrl}/v2/inquiry`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const data = response.data;

      // Check for success
      if (data.statusCode === '00' || data.reference) {
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        logger.info('Duitku QR payment created successfully', {
          orderId: params.orderId,
          reference: data.reference,
        });

        return {
          success: true,
          referenceNo: data.reference,
          qrString: data.qrString,
          qrUrl: data.qrUrl,
          paymentUrl: data.paymentUrl,
          expiresAt,
        };
      }

      // Handle error response
      logger.error('Duitku QR payment creation failed', {
        orderId: params.orderId,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
      });

      return {
        success: false,
        error: data.statusMessage || 'Failed to create QR payment',
        errorCode: data.statusCode,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as Record<string, unknown> | undefined;
      
      logger.error('Duitku API request failed', {
        orderId: params.orderId,
        status: axiosError.response?.status,
        error: errorData?.statusMessage || axiosError.message,
        data: errorData,
      });

      throw new Error(
        (errorData?.statusMessage as string) || axiosError.message || 'Duitku API request failed'
      );
    }
  }

  // ===========================================================================
  // Transaction Status Methods
  // ===========================================================================

  /**
   * Generate signature for transaction status check
   * Format: MD5(merchantCode + merchantOrderId + apiKey)
   */
  generateStatusSignature(merchantCode: string, orderId: string, apiKey: string): string {
    const stringToSign = `${merchantCode}${orderId}${apiKey}`;
    return crypto.createHash('md5').update(stringToSign).digest('hex');
  }

  async checkTransaction(orderId: string): Promise<CheckTransactionResponse> {
    try {
      const config = await this.getConfig();
      
      if (!config.enabled) {
        return {
          success: false,
          status: 'FAILED',
          error: 'Payment gateway is disabled',
        };
      }

      const baseUrl = this.getBaseUrl(config.environment);
      // Use correct signature format for transactionStatus endpoint
      const signature = this.generateStatusSignature(config.merchantCode, orderId, config.apiKey);

      const requestBody = {
        merchantCode: config.merchantCode,
        merchantOrderId: orderId,
        signature,
      };

      logger.info('Checking Duitku transaction status', {
        orderId,
        url: `${baseUrl}/transactionStatus`,
      });

      const response = await axios.post(
        `${baseUrl}/transactionStatus`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const data = response.data;

      logger.info('Duitku transactionStatus response', {
        orderId,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
        reference: data.reference,
      });

      // Map Duitku status to our status
      const statusMap: Record<string, 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED'> = {
        '00': 'SUCCESS',
        '01': 'PENDING',
        '02': 'FAILED',
      };

      const status = statusMap[data.statusCode] || 'PENDING';

      logger.info('Duitku transaction status checked', {
        orderId,
        status,
        statusCode: data.statusCode,
      });

      return {
        success: true,
        status,
        amount: data.amount ? parseInt(data.amount, 10) : undefined,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorData = axiosError.response?.data as Record<string, unknown> | undefined;
      
      logger.error('Failed to check Duitku transaction status', {
        orderId,
        status: axiosError.response?.status,
        error: axiosError.message,
        responseData: errorData,
      });

      return {
        success: false,
        status: 'PENDING',
        error: axiosError.message || 'Failed to check transaction status',
      };
    }
  }

  // ===========================================================================
  // Callback Validation Methods
  // ===========================================================================

  validateCallbackSignature(
    payload: DuitkuCallbackPayload,
    _signature?: string,
    _timestamp?: string
  ): boolean {
    try {
      const config = this.config;
      
      if (!config) {
        logger.error('Duitku config not loaded for callback validation');
        return false;
      }

      // Legacy callback format
      if (payload.merchantCode && payload.merchantOrderId && payload.amount) {
        if (payload.merchantCode !== config.merchantCode || !payload.signature) {
          return false;
        }

        const expectedSignature = this.generateCallbackSignature(
          payload.merchantCode,
          payload.amount,
          payload.merchantOrderId,
          config.apiKey
        );

        const provided = Buffer.from(payload.signature.toLowerCase());
        const expected = Buffer.from(expectedSignature.toLowerCase());
        if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) {
          return true;
        }
      }

      // SNAP callbacks require their own asymmetric signature verification.
      // Until that verifier is configured, fail closed instead of trusting
      // attacker-controlled structure such as partnerReferenceNo.
      if (payload.partnerReferenceNo) {
        logger.warn('Unsigned SNAP callback rejected', {
          orderId: payload.partnerReferenceNo,
        });
        return false;
      }

      logger.warn('Duitku callback signature validation failed', {
        orderId: payload.merchantOrderId || payload.partnerReferenceNo,
      });

      return false;
    } catch (error) {
      logger.error('Error validating Duitku callback signature', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  parseCallback(payload: unknown): DuitkuCallbackPayload | null {
    try {
      const data = payload as DuitkuCallbackPayload;
      
      // Legacy format
      if (data.merchantOrderId) {
        return data;
      }

      // SNAP format
      if (data.partnerReferenceNo) {
        return {
          ...data,
          merchantOrderId: data.partnerReferenceNo,
          merchantCode: '',
          amount: data.additionalInfo?.transactionStatus || '0',
          paymentCode: '',
          resultCode: data.responseCode || '',
          reference: data.referenceNo || '',
          signature: '',
        };
      }

      logger.error('Invalid Duitku callback: missing order ID');
      return null;
    } catch (error) {
      logger.error('Failed to parse Duitku callback', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async isConfigured(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return config.enabled && !!config.merchantCode && !!config.apiKey;
    } catch {
      return false;
    }
  }

  getChannelId(): string {
    return PAYMENT_CODE;
  }
}

// Export singleton instance
export const duitkuService = new DuitkuService();
