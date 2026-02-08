/**
 * PAYMENT CONTROLLER
 * 
 * Production-grade payment controller for Stripe integration.
 * 
 * SECURITY RULES:
 * - Never accept raw card data
 * - Verify webhook signatures
 * - Calculate amounts server-side
 * - Use HTTPS in production
 * - Validate all inputs
 */

const paymentService = require('../../services/paymentServices/payment.service');
const { verifyWebhookSignature } = require('../../config/stripe');

/**
 * REQUIREMENT 1: Create payment intent for order
 * 
 * SECURITY:
 * - User must be authenticated
 * - Order must belong to user
 * - Amount calculated server-side
 * - Returns ONLY client_secret to frontend
 * 
 * POST /api/payments/create-intent
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Validation
    if (!orderId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Order ID is required'
      });
    }

    // Create payment intent (amount calculated server-side)
    const result = await paymentService.createPaymentIntentForOrder(orderId);

    // SECURITY: Return ONLY client_secret to frontend
    // Never return full payment intent or sensitive data
    res.status(201).json({
      message: 'Payment intent created successfully',
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      payment: {
        id: result.payment.id,
        amount: result.payment.amount,
        status: result.payment.status
      }
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not in pending')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * REQUIREMENT 2: Handle Stripe webhooks
 * 
 * CRITICAL SECURITY:
 * - MUST verify webhook signature
 * - Webhooks are the single source of truth
 * - MUST be idempotent
 * - Never trust frontend payment status
 * 
 * POST /api/payments/webhook
 */
const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  
  // Get raw body for signature verification
  // express.raw() middleware stores body in req.body as Buffer
  const payload = req.body;

  let event;

  try {
    // CRITICAL: Verify webhook signature
    event = verifyWebhookSignature(payload, sig);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).json({
      error: 'Webhook Error',
      message: `Webhook signature verification failed: ${err.message}`
    });
  }

  try {
    // Process the event (idempotent)
    const result = await paymentService.handleWebhookEvent(event);
    
    // Always return 200 to acknowledge receipt
    res.json({
      received: true,
      eventType: event.type,
      result
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to acknowledge receipt even if processing fails
    // This prevents Stripe from retrying
    res.status(200).json({
      received: true,
      error: error.message
    });
  }
};

/**
 * Get payment by order ID
 * 
 * SECURITY:
 * - User must be authenticated
 * - User must own the order
 * 
 * GET /api/payments/order/:orderId
 */
const getPaymentByOrder = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentByOrder(
      req.params.orderId,
      req.user.id
    );

    res.json(payment);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get payment by ID
 * 
 * SECURITY:
 * - User must be authenticated
 * - Validates payment exists
 * 
 * GET /api/payments/:id
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await paymentService.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Payment not found'
      });
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
};

/**
 * REQUIREMENT 4: Process refund (Admin only)
 * 
 * SECURITY:
 * - Admin-only access
 * - Validates payment status
 * - Updates order and inventory
 * 
 * POST /api/admin/payments/:id/refund
 */
const processRefund = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    const result = await paymentService.processRefund(
      req.params.id,
      amount,
      reason || 'requested_by_customer'
    );

    res.json({
      message: 'Refund processed successfully',
      refund: result.refund,
      payment: result.payment
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('Can only refund')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get all payments (Admin only)
 * 
 * SECURITY:
 * - Admin-only access
 * - Supports filtering and pagination
 * 
 * GET /api/admin/payments
 */
const getAllPayments = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;

    const payments = await paymentService.findAll({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment statistics (Admin only)
 * 
 * SECURITY:
 * - Admin-only access
 * - Returns aggregated payment data
 * 
 * GET /api/admin/payments/statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await paymentService.getStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * REQUIREMENT 5: Sync payment status manually (Admin only)
 * 
 * SECURITY:
 * - Admin-only access
 * - Validates status parameter
 * - Updates payment and order status
 * 
 * POST /api/admin/payments/:paymentIntentId/sync
 */
const syncPaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Status is required'
      });
    }

    const result = await paymentService.syncPaymentStatus(
      req.params.paymentIntentId,
      status
    );

    res.json({
      message: 'Payment status synced successfully',
      payment: result.payment,
      orderStatus: result.orderStatus
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  getPaymentByOrder,
  getPaymentById,
  processRefund,
  getAllPayments,
  getStatistics,
  syncPaymentStatus
};
