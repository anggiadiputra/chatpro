/**
 * Payment Routes
 * 
 * API endpoints for payment transactions using Duitku payment gateway.
 * Handles payment creation, status checking, history, and cancellation.
 * 
 * Requirements: 2.1, 2.3, 2.6, 4.5, 5.1-5.5, 8.1-8.5, 9.1-9.3, 10.4
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { paymentService, isValidDurationMonths } from '../services/payment-service.js';
import { adminSubscriptionPlansService } from '../services/admin/subscription-plans-service.js';
import { logger } from '../utils/logger.js';

const app = new Hono();

// =============================================================================
// POST /api/v1/payment/create
// Create new payment transaction
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
// =============================================================================

app.post('/create', async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({
        error: { code: 'Unauthorized', message: 'Authentication required' },
      }, 401);
    }

    const body = await c.req.json();
    const { targetTier, durationMonths = 1 } = body;

    // Validate target tier
    if (!targetTier || !['LITE', 'PRO'].includes(targetTier)) {
      return c.json({
        error: { code: 'InvalidRequest', message: 'Invalid target tier. Must be LITE or PRO' },
      }, 400);
    }

    // Validate durationMonths (must be 1, 3, 6, or 12)
    if (!isValidDurationMonths(durationMonths)) {
      return c.json({
        error: { code: 'InvalidRequest', message: 'Invalid duration. Must be 1, 3, 6, or 12 months' },
      }, 400);
    }

    const result = await paymentService.createPayment({
      userId: c.user.id,
      targetTier,
      durationMonths,
    });

    if (!result.success) {
      return c.json({
        error: { code: result.errorCode || 'PaymentError', message: result.error },
      }, 400);
    }

    return c.json({
      success: true,
      data: {
        orderId: result.orderId,
        qrString: result.qrString,
        qrUrl: result.qrUrl,
        amount: result.amount,
        expiresAt: result.expiresAt?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Payment create error:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return c.json({
      error: { code: 'InternalError', message: 'Failed to create payment' },
    }, 500);
  }
});

// =============================================================================
// GET /api/v1/payment/status/:orderId
// Get transaction status for polling
// Requirements: 9.1, 9.2, 9.3
// =============================================================================

app.get('/status/:orderId', async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({
        error: { code: 'Unauthorized', message: 'Authentication required' },
      }, 401);
    }

    const orderId = c.req.param('orderId');

    if (!orderId) {
      return c.json({
        error: { code: 'InvalidRequest', message: 'Order ID is required' },
      }, 400);
    }

    const status = await paymentService.getTransactionStatus(orderId, c.user.id);

    if (!status) {
      return c.json({
        error: { code: 'NotFound', message: 'Transaction not found' },
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        status: status.status,
        paidAt: status.paidAt?.toISOString() || null,
        amount: status.amount,
        targetTier: status.targetTier,
      },
    });
  } catch (error) {
    logger.error('Payment status error:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return c.json({
      error: { code: 'InternalError', message: 'Failed to get payment status' },
    }, 500);
  }
});

// =============================================================================
// GET /api/v1/payment/history
// Get payment history with pagination
// Requirements: 8.1, 8.2, 8.3, 8.4
// =============================================================================

app.get('/history', async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({
        error: { code: 'Unauthorized', message: 'Authentication required' },
      }, 401);
    }

    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);

    // Validate pagination params
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 50); // Max 50 per page

    const result = await paymentService.getPaymentHistory(c.user.id, validPage, validLimit);

    return c.json({
      success: true,
      data: {
        transactions: result.transactions.map((tx) => ({
          id: tx.id,
          orderId: tx.orderId,
          amount: tx.amount,
          paymentMethod: tx.paymentMethod,
          targetTier: tx.targetTier,
          status: tx.status,
          createdAt: tx.createdAt.toISOString(),
          paidAt: tx.paidAt?.toISOString() || null,
        })),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      },
    });
  } catch (error) {
    logger.error('Payment history error:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return c.json({
      error: { code: 'InternalError', message: 'Failed to get payment history' },
    }, 500);
  }
});

// =============================================================================
// POST /api/v1/payment/cancel/:orderId
// Cancel pending transaction
// Requirements: 4.5
// =============================================================================

app.post('/cancel/:orderId', async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({
        error: { code: 'Unauthorized', message: 'Authentication required' },
      }, 401);
    }

    const orderId = c.req.param('orderId');

    if (!orderId) {
      return c.json({
        error: { code: 'InvalidRequest', message: 'Order ID is required' },
      }, 400);
    }

    const result = await paymentService.cancelTransaction(orderId, c.user.id);

    if (!result.success) {
      return c.json({
        error: { code: 'CancelError', message: result.message },
      }, 400);
    }

    return c.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Payment cancel error:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return c.json({
      error: { code: 'InternalError', message: 'Failed to cancel payment' },
    }, 500);
  }
});

// =============================================================================
// GET /api/v1/payment/pricing
// Get subscription pricing with all duration options
// Requirements: 1.2, 1.3, 1.5, 2.1, 2.3, 2.6
// =============================================================================

app.get('/pricing', async (c: Context) => {
  try {
    if (!c.user) {
      return c.json({
        error: { code: 'Unauthorized', message: 'Authentication required' },
      }, 401);
    }

    // Get pricing with all duration options from subscription plans service
    const { lite, pro } = await adminSubscriptionPlansService.getAllPlansPricing();

    return c.json({
      success: true,
      data: {
        lite: {
          tier: 'LITE',
          name: lite.name,
          basePrice: lite.basePrice,
          currency: 'IDR',
          features: lite.features,
          durations: lite.durations.filter(d => d.enabled).map(d => ({
            months: d.months,
            days: d.days,
            discountPercent: d.discountPercent,
            totalPrice: d.totalPrice,
            effectiveMonthlyPrice: d.effectiveMonthlyPrice,
            savings: d.savings,
            label: d.label,
            recommended: d.recommended,
          })),
        },
        pro: {
          tier: 'PRO',
          name: pro.name,
          basePrice: pro.basePrice,
          currency: 'IDR',
          features: pro.features,
          durations: pro.durations.filter(d => d.enabled).map(d => ({
            months: d.months,
            days: d.days,
            discountPercent: d.discountPercent,
            totalPrice: d.totalPrice,
            effectiveMonthlyPrice: d.effectiveMonthlyPrice,
            savings: d.savings,
            label: d.label,
            recommended: d.recommended,
          })),
        },
      },
    });
  } catch (error) {
    logger.error('Payment pricing error:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return c.json({
      error: { code: 'InternalError', message: 'Failed to get pricing' },
    }, 500);
  }
});

export default app;
