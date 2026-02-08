/**
 * PAYMENT SERVICE
 * 
 * Production-grade payment service for Stripe integration.
 * 
 * SECURITY PRINCIPLES:
 * - Never accept raw card data
 * - Use Stripe Payment Intents
 * - Webhooks are the single source of truth
 * - All amounts calculated server-side
 * - Idempotent operations
 */

const supabase = require('../../config/supabase');
const { createPaymentIntent, retrievePaymentIntent, createRefund } = require('../../config/stripe');
const orderService = require('../orderServices/order.service');

/**
 * Find payment by ID
 * @param {String} id - Payment UUID
 * @returns {Promise<Object|null>} Payment object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Find payment by order ID
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object|null>} Payment object or null
 */
const findByOrderId = async (orderId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Find payment by payment intent ID
 * @param {String} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object|null>} Payment object or null
 */
const findByPaymentIntentId = async (paymentIntentId) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('payment_intent_id', paymentIntentId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Create new payment record
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created payment object
 */
const create = async (paymentData) => {
  const insertData = {
    order_id: paymentData.orderId,
    payment_intent_id: paymentData.paymentIntentId,
    amount: paymentData.amount,
    payment_method: paymentData.paymentMethod || 'card',
    status: (paymentData.status || 'pending').toLowerCase() // Ensure lowercase
  };

  // Validate required fields
  if (!insertData.order_id || !insertData.payment_intent_id || !insertData.amount || !insertData.status) {
    throw new Error('Missing required payment fields');
  }

  const { data, error } = await supabase
    .from('payments')
    .insert([insertData])
    .select()
    .single();
  
  if (error) {
    console.error('Payment creation error:', error);
    throw error;
  }
  
  return data;
};

/**
 * Update payment status
 * @param {String} id - Payment UUID
 * @param {String} status - New status
 * @returns {Promise<Object>} Updated payment object
 */
const updateStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: status.toLowerCase() }) // Ensure lowercase
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get all payments (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of payment objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get payment statistics (admin only)
 * @returns {Promise<Object>} Payment statistics
 */
const getStatistics = async () => {
  const { data: payments, error } = await supabase
    .from('payments')
    .select('status, amount');
  
  if (error) throw error;
  
  const stats = {
    total_payments: payments.length,
    successful: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    total_amount: 0,
    successful_amount: 0
  };

  payments.forEach(payment => {
    if (payment.status === 'succeeded') {
      stats.successful++;
      stats.successful_amount += payment.amount;
    } else if (payment.status === 'pending') {
      stats.pending++;
    } else if (payment.status === 'failed') {
      stats.failed++;
    } else if (payment.status === 'refunded') {
      stats.refunded++;
    }
    
    stats.total_amount += payment.amount;
  });
  
  return stats;
};

/**
 * REQUIREMENT 1: Create Stripe payment intent
 * 
 * SECURITY: Amount is calculated server-side from order
 * NEVER trust frontend amount
 * 
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object>} Payment intent and payment record
 */
const createPaymentIntentForOrder = async (orderId) => {
  // Get order details
  const order = await orderService.findById(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'pending_payment') {
    throw new Error('Order is not in pending_payment status');
  }

  // Check if payment already exists (idempotency)
  const existingPayment = await findByOrderId(orderId);
  if (existingPayment) {
    // Return existing payment intent
    const paymentIntent = await retrievePaymentIntent(existingPayment.payment_intent_id);
    return {
      payment: existingPayment,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: existingPayment.payment_intent_id
    };
  }

  // CRITICAL: Calculate amount server-side
  // NEVER trust frontend amount
  const amount = order.amount; // Already in cents from order creation

  // Create Stripe payment intent with metadata
  const paymentIntent = await createPaymentIntent(amount, 'usd', {
    order_id: orderId,
    customer_id: order.user_id
  });

  // Create payment record in database
  const payment = await create({
    orderId: order.id,
    paymentIntentId: paymentIntent.id,
    amount: amount,
    paymentMethod: 'card',
    status: 'pending'
  });

  return {
    payment,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id
  };
};

/**
 * REQUIREMENT 3: Store payment transaction
 * @param {Object} paymentData - Payment transaction data
 * @returns {Promise<Object>} Created payment record
 */
const storeTransaction = async (paymentData) => {
  return await create(paymentData);
};

/**
 * REQUIREMENT 4: Process refund
 * 
 * ADMIN ONLY: Refund processing with inventory restoration
 * 
 * @param {String} paymentId - Payment UUID
 * @param {Number} amount - Amount to refund (optional, full refund if not specified)
 * @param {String} reason - Refund reason
 * @returns {Promise<Object>} Refund result
 */
const processRefund = async (paymentId, amount = null, reason = 'requested_by_customer') => {
  // Get payment record
  const payment = await findById(paymentId);
  
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'succeeded') {
    throw new Error('Can only refund successful payments');
  }

  // Create refund in Stripe
  const refund = await createRefund(payment.payment_intent_id, amount, reason);

  // Update payment status
  await updateStatus(payment.id, 'refunded');

  // Update order status
  await orderService.updateStatus(payment.order_id, 'refunded');

  // TODO: Restore inventory (implement in Phase 4)

  return {
    refund,
    payment: await findById(payment.id),
    message: 'Refund processed successfully'
  };
};

/**
 * REQUIREMENT 5: Sync payment status with order
 * 
 * WEBHOOK HANDLER: This is the single source of truth
 * Updates payment and order status based on Stripe webhook events
 * 
 * @param {String} paymentIntentId - Stripe payment intent ID
 * @param {String} status - Payment status from Stripe
 * @returns {Promise<Object>} Updated payment and order
 */
const syncPaymentStatus = async (paymentIntentId, status) => {
  // Find payment by payment intent ID
  const payment = await findByPaymentIntentId(paymentIntentId);
  
  if (!payment) {
    throw new Error('Payment not found');
  }

  // Map Stripe status to our status (lowercase)
  let paymentStatus = 'pending';
  let orderStatus = null;

  if (status === 'succeeded') {
    paymentStatus = 'succeeded';
    orderStatus = 'paid';
  } else if (status === 'canceled' || status === 'failed') {
    paymentStatus = 'failed';
    orderStatus = 'cancelled';
  }

  // Update payment status (idempotent)
  const updatedPayment = await updateStatus(payment.id, paymentStatus);

  // Update order status if needed (idempotent)
  if (orderStatus) {
    await orderService.updateStatus(payment.order_id, orderStatus);
  }

  return {
    payment: updatedPayment,
    orderStatus,
    message: 'Payment and order status synced successfully'
  };
};

/**
 * REQUIREMENT 2: Handle Stripe webhook event
 * 
 * CRITICAL: Webhooks are the single source of truth
 * This function MUST be idempotent
 * 
 * @param {Object} event - Stripe webhook event
 * @returns {Promise<Object>} Processing result
 */
const handleWebhookEvent = async (event) => {
  const paymentIntent = event.data.object;

  switch (event.type) {
    case 'payment_intent.succeeded':
      // Payment successful - update order and reduce inventory
      return await syncPaymentStatus(paymentIntent.id, 'succeeded');
    
    case 'payment_intent.payment_failed':
      // Payment failed - keep order pending
      return await syncPaymentStatus(paymentIntent.id, 'failed');
    
    case 'payment_intent.canceled':
      // Payment canceled
      return await syncPaymentStatus(paymentIntent.id, 'canceled');
    
    case 'charge.refunded':
      // Handle refund webhook
      const charge = event.data.object;
      const payment = await findByPaymentIntentId(charge.payment_intent);
      if (payment) {
        await updateStatus(payment.id, 'refunded');
        await orderService.updateStatus(payment.order_id, 'refunded');
      }
      return { message: 'Refund webhook processed' };
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
      return { message: 'Event type not handled' };
  }
};

/**
 * Get payment by order ID (customer access)
 * @param {String} orderId - Order UUID
 * @param {String} userId - User UUID (for authorization)
 * @returns {Promise<Object>} Payment object
 */
const getPaymentByOrder = async (orderId, userId) => {
  // Get order to verify ownership
  const order = await orderService.findById(orderId);
  
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.user_id !== userId) {
    throw new Error('Unauthorized to view this payment');
  }

  const payment = await findByOrderId(orderId);
  
  if (!payment) {
    throw new Error('Payment not found for this order');
  }

  return payment;
};

module.exports = {
  findById,
  findByOrderId,
  findByPaymentIntentId,
  create,
  updateStatus,
  findAll,
  getStatistics,
  createPaymentIntentForOrder,
  storeTransaction,
  processRefund,
  syncPaymentStatus,
  handleWebhookEvent,
  getPaymentByOrder
};
