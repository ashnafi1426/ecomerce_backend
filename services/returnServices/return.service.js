/**
 * RETURN SERVICE — Amazon-Style Full Workflow
 *
 * Business logic layer for return/refund operations.
 * Supports: 30-day window validation, image evidence, Stripe refunds,
 * seller returns, shipping tracking, inspection workflow.
 */

const supabase = require('../../config/supabase');

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_STATUSES = [
  'pending', 'approved', 'rejected', 'return_shipped',
  'return_received', 'inspecting', 'completed', 'cancelled'
];

const RETURN_WINDOW_DAYS = 30;

// ── Read ──────────────────────────────────────────────────────────────────────

/** Find return by ID (with customer + order info) */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      customer:users!customer_id(id, email, display_name),
      order:orders(id, amount, status, created_at, delivered_at, payment_intent_id)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

/** Find returns by user ID — full order details */
const findByUserId = async (userId, filters = {}) => {
  let query = supabase
    .from('returns')
    .select(`
      *,
      order:orders(id, amount, status, created_at, delivered_at)
    `)
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) {
    console.error('Returns query error:', error.message);
    return [];
  }
  return data || [];
};

/** Find returns by order ID */
const findByOrderId = async (orderId) => {
  const { data, error } = await supabase
    .from('returns')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/** Find returns by seller ID — for seller dashboard */
const findBySellerId = async (sellerId, filters = {}) => {
  let query = supabase
    .from('returns')
    .select(`
      *,
      customer:users!customer_id(id, email, display_name),
      order:orders(id, amount, status, created_at)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) {
    console.error('Seller returns query error:', error.message);
    return [];
  }
  return data || [];
};

/** Get all returns (admin) — includes customer + order info */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('returns')
    .select(`
      *,
      customer:users!customer_id(id, email, display_name),
      order:orders(id, amount, status, payment_intent_id)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.limit) query = query.limit(filters.limit);
  if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create return request with 30-day window validation
 */
const create = async (returnData) => {
  // 1. Validate that the order exists and belongs to this user
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('id, user_id, status, amount, delivered_at, updated_at, payment_intent_id, basket, seller_id')
    .eq('id', returnData.orderId)
    .single();

  if (orderErr || !order) {
    throw new Error('Order not found');
  }

  // Allow admin to bypass ownership check
  if (order.user_id !== returnData.userId) {
    throw new Error('This order does not belong to you');
  }

  // 2. Check order is delivered/completed
  if (!['delivered', 'completed'].includes(order.status?.toLowerCase())) {
    throw new Error('Only delivered orders are eligible for return');
  }

  // 3. Enforce 30-day return window
  const deliveredAt = new Date(order.delivered_at || order.updated_at);
  const daysSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
    throw new Error(`Return window expired. Returns must be requested within ${RETURN_WINDOW_DAYS} days of delivery.`);
  }

  // 4. Check for duplicate pending return on same order
  const { data: existing } = await supabase
    .from('returns')
    .select('id')
    .eq('order_id', returnData.orderId)
    .in('status', ['pending', 'approved', 'return_shipped', 'return_received', 'inspecting'])
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error('An active return request already exists for this order');
  }

  // 5. Extract seller_id from order, basket, or product lookup
  let sellerId = order.seller_id || null;
  if (!sellerId && Array.isArray(order.basket) && order.basket.length > 0) {
    // If a specific product was specified, find its seller from basket
    const targetProduct = returnData.productId
      ? order.basket.find(item => item.product_id === returnData.productId)
      : order.basket[0];
    if (targetProduct && targetProduct.seller_id) {
      sellerId = targetProduct.seller_id;
    }
    // Fallback: look up seller from products table
    if (!sellerId && targetProduct && targetProduct.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('seller_id')
        .eq('id', targetProduct.product_id)
        .single();
      if (product && product.seller_id) {
        sellerId = product.seller_id;
      }
    }
  }
  // Final fallback: look up from productId directly
  if (!sellerId && returnData.productId) {
    const { data: product } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', returnData.productId)
      .single();
    if (product && product.seller_id) {
      sellerId = product.seller_id;
    }
  }

  // 6. Build payload
  const insertPayload = {
    order_id: returnData.orderId,
    customer_id: returnData.userId,
    seller_id: sellerId,
    return_type: returnData.returnType || 'other',
    items: returnData.items || [],
    reason: returnData.reason,
    detailed_description: returnData.detailedDescription || null,
    images: returnData.images || null,
    status: 'pending',
    refund_amount: returnData.refundAmount || null,
    refund_method: returnData.refundMethod || 'original_payment_method'
  };

  const { data, error } = await supabase
    .from('returns')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    console.error('Return create error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw error;
  }

  return data;
};

// ── Status Updates ────────────────────────────────────────────────────────────

/**
 * Generic status update (supports all 8 statuses with timestamps)
 */
const updateStatus = async (id, status, adminId = null, extra = {}) => {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const updateData = { status };

  if (adminId) updateData.processed_by = adminId;

  if (status === 'approved') {
    updateData.approved_at = new Date().toISOString();
    if (adminId) updateData.approved_by = adminId;
  } else if (status === 'return_shipped') {
    updateData.return_shipped_at = new Date().toISOString();
  } else if (status === 'return_received') {
    updateData.return_received_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    updateData.refund_status = 'completed';
    updateData.refund_processed_at = new Date().toISOString();
  }

  Object.assign(updateData, extra);

  const { data, error } = await supabase
    .from('returns')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Approve return — admin sets refund amount */
const approve = async (id, adminId, refundAmount) => {
  const { data, error } = await supabase
    .from('returns')
    .update({
      status: 'approved',
      refund_amount: refundAmount,
      approved_at: new Date().toISOString(),
      approved_by: adminId,
      processed_by: adminId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Reject return */
const reject = async (id, adminId, rejectionReason = null) => {
  return await updateStatus(id, 'rejected', adminId, {
    rejection_reason: rejectionReason
  });
};

/** Mark return as received at warehouse */
const markReceived = async (id, adminId) => {
  return await updateStatus(id, 'return_received', adminId);
};

/** Mark return as being inspected */
const markInspecting = async (id, adminId) => {
  return await updateStatus(id, 'inspecting', adminId);
};

/** Record inspection result */
const markInspected = async (id, adminId, inspectionNotes, inspectionPassed) => {
  const { data, error } = await supabase
    .from('returns')
    .update({
      inspection_notes: inspectionNotes || null,
      inspection_passed: inspectionPassed !== false,
      inspected_by: adminId,
      inspected_at: new Date().toISOString(),
      processed_by: adminId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Complete return — processes Stripe refund if payment_intent exists.
 * Only calls Stripe for real payment intents (starting with "pi_").
 * Test/manual payment intents are marked as manual refunds.
 */
const complete = async (id, adminId, refundTransactionId = null) => {
  const returnReq = await findById(id);
  if (!returnReq) throw new Error('Return not found');

  let stripeRefundId = refundTransactionId;
  const paymentIntentId = returnReq.order?.payment_intent_id;
  const isRealStripePI = paymentIntentId && paymentIntentId.startsWith('pi_');

  // Auto-process Stripe refund only for real Stripe payment intents
  if (!stripeRefundId && isRealStripePI && returnReq.refund_amount) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const refundAmountCents = Math.round(Number(returnReq.refund_amount) * 100);

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmountCents,
        reason: 'requested_by_customer',
        metadata: {
          return_id: id,
          admin_id: adminId,
          order_id: returnReq.order_id
        }
      });

      stripeRefundId = refund.id;
      console.log('✅ Stripe refund processed:', refund.id, `$${returnReq.refund_amount}`);
    } catch (stripeErr) {
      // If the PaymentIntent was never charged, there's nothing to refund — just complete
      if (stripeErr.message && stripeErr.message.includes('does not have a successful charge')) {
        console.log(`ℹ️ Return ${id} — PaymentIntent was never charged, completing without Stripe refund`);
      } else {
        console.error('❌ Stripe refund failed:', stripeErr.message);
        await updateStatus(id, 'completed', adminId, {
          refund_status: 'failed',
          inspection_notes: `Stripe refund failed: ${stripeErr.message}`
        });
        throw new Error(`Return completed but Stripe refund failed: ${stripeErr.message}. The refund can be retried.`);
      }
    }
  }

  // Non-Stripe payment (test, manual, cash) — mark completed with manual refund status
  if (!stripeRefundId) {
    console.log(`ℹ️ Return ${id} completed — non-Stripe payment (${paymentIntentId || 'none'}), marked as manual refund`);
    return await updateStatus(id, 'completed', adminId, {
      refund_status: 'completed',
      refund_processed_at: new Date().toISOString()
    });
  }

  // Success — Stripe refund processed
  return await updateStatus(id, 'completed', adminId, {
    refund_transaction_id: stripeRefundId,
    refund_status: 'completed',
    refund_processed_at: new Date().toISOString()
  });
};

/**
 * Retry a failed Stripe refund for a completed return.
 * If the PaymentIntent was never charged, marks refund as completed (nothing to refund).
 */
const retryRefund = async (id, adminId) => {
  const returnReq = await findById(id);
  if (!returnReq) throw new Error('Return not found');
  if (returnReq.status !== 'completed') throw new Error('Return must be completed to retry refund');
  if (returnReq.refund_status === 'completed') throw new Error('Refund already completed');
  if (!returnReq.order?.payment_intent_id) throw new Error('No payment intent found for this order');
  if (!returnReq.refund_amount) throw new Error('No refund amount set');

  const paymentIntentId = returnReq.order.payment_intent_id;
  const isRealStripePI = paymentIntentId.startsWith('pi_');

  // Non-Stripe payment — just mark as completed
  if (!isRealStripePI) {
    console.log(`ℹ️ Return ${id} — non-Stripe payment (${paymentIntentId}), marking refund as completed`);
    const { data, error } = await supabase
      .from('returns')
      .update({ refund_status: 'completed', refund_processed_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // Real Stripe PI — attempt refund
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const refundAmountCents = Math.round(Number(returnReq.refund_amount) * 100);

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmountCents,
      reason: 'requested_by_customer',
      metadata: { return_id: id, admin_id: adminId, order_id: returnReq.order_id, retry: 'true' }
    });

    console.log('✅ Stripe refund retry succeeded:', refund.id, `$${returnReq.refund_amount}`);

    const { data, error } = await supabase
      .from('returns')
      .update({ refund_transaction_id: refund.id, refund_status: 'completed', refund_processed_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  } catch (stripeErr) {
    // If the PaymentIntent was never charged, there's nothing to refund — mark as completed
    if (stripeErr.message && stripeErr.message.includes('does not have a successful charge')) {
      console.log(`ℹ️ Return ${id} — PaymentIntent was never charged, marking refund as completed (no charge to refund)`);
      const { data, error } = await supabase
        .from('returns')
        .update({ refund_status: 'completed', refund_processed_at: new Date().toISOString() })
        .eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
    throw stripeErr;
  }
};

// ── Customer Actions ──────────────────────────────────────────────────────────

/** Cancel return (customer, only when pending) */
const cancel = async (id, userId) => {
  const { data: existing, error: fetchError } = await supabase
    .from('returns')
    .select('id, status, customer_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) throw new Error('Return not found');
  if (existing.customer_id !== userId) throw new Error('Access denied');
  if (existing.status !== 'pending') throw new Error('Only pending returns can be cancelled');

  const { data, error } = await supabase
    .from('returns')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update shipping info — customer provides tracking after approval
 */
const updateShippingInfo = async (id, userId, trackingNumber, carrier) => {
  // Verify ownership + status
  const { data: existing, error: fetchError } = await supabase
    .from('returns')
    .select('id, status, customer_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) throw new Error('Return not found');
  if (existing.customer_id !== userId) throw new Error('Access denied');
  if (existing.status !== 'approved') throw new Error('Can only add shipping info to approved returns');

  const { data, error } = await supabase
    .from('returns')
    .update({
      status: 'return_shipped',
      return_tracking_number: trackingNumber,
      return_carrier: carrier || null,
      return_shipped_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/** Update images on a return (customer can add evidence) */
const updateImages = async (id, userId, images) => {
  const { data: existing, error: fetchError } = await supabase
    .from('returns')
    .select('id, customer_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !existing) throw new Error('Return not found');
  if (existing.customer_id !== userId) throw new Error('Access denied');
  if (!['pending', 'approved'].includes(existing.status)) {
    throw new Error('Can only update images on pending or approved returns');
  }

  const { data, error } = await supabase
    .from('returns')
    .update({ images })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ── Statistics ─────────────────────────────────────────────────────────────────

/** Get pending returns count */
const getPendingCount = async () => {
  const { count, error } = await supabase
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) throw error;
  return count || 0;
};

/** Get return statistics */
const getStatistics = async () => {
  const { data: returns, error } = await supabase
    .from('returns')
    .select('status, refund_amount, refund_status');

  if (error) throw error;

  const stats = {
    total_returns: returns.length,
    pending: 0,
    approved: 0,
    return_shipped: 0,
    return_received: 0,
    inspecting: 0,
    completed: 0,
    rejected: 0,
    cancelled: 0,
    total_refund_amount: 0
  };

  returns.forEach(ret => {
    if (stats[ret.status] !== undefined) stats[ret.status]++;
    if (ret.refund_amount && ret.refund_status === 'completed') {
      stats.total_refund_amount += Number(ret.refund_amount);
    }
  });

  return stats;
};

/** Get seller-specific return stats */
const getSellerStatistics = async (sellerId) => {
  const { data: returns, error } = await supabase
    .from('returns')
    .select('status, refund_amount, refund_status, created_at')
    .eq('seller_id', sellerId);

  if (error) throw error;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    total: returns.length,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    this_month: 0,
    total_refunded: 0
  };

  returns.forEach(ret => {
    if (ret.status === 'pending') stats.pending++;
    else if (ret.status === 'approved' || ret.status === 'return_shipped' || ret.status === 'return_received' || ret.status === 'inspecting') stats.approved++;
    else if (ret.status === 'completed') stats.completed++;
    else if (ret.status === 'rejected') stats.rejected++;

    if (new Date(ret.created_at) >= thirtyDaysAgo) stats.this_month++;
    if (ret.refund_amount && ret.refund_status === 'completed') {
      stats.total_refunded += Number(ret.refund_amount);
    }
  });

  return stats;
};

/** Get recent returns (admin dashboard widget) */
const getRecent = async (limit = 10) => {
  const { data, error } = await supabase
    .from('returns')
    .select(`
      *,
      customer:users!customer_id(id, email, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

module.exports = {
  findById,
  findByUserId,
  findByOrderId,
  findBySellerId,
  findAll,
  create,
  updateStatus,
  approve,
  reject,
  markReceived,
  markInspecting,
  markInspected,
  complete,
  retryRefund,
  cancel,
  updateShippingInfo,
  updateImages,
  getPendingCount,
  getStatistics,
  getSellerStatistics,
  getRecent
};
