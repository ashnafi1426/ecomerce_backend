/**
 * PAYMENT SERVICE
 * 
 * Business logic layer for payment operations.
 * Database operations using Supabase.
 */

const supabase = require('../../config/supabase');

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
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      order_id: paymentData.orderId,
      payment_intent_id: paymentData.paymentIntentId,
      amount: paymentData.amount,
      payment_method: paymentData.paymentMethod || 'card',
      status: paymentData.status
    }])
    .select()
    .single();
  
  if (error) throw error;
  
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
    .update({ status })
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
    if (payment.status === 'SUCCESS') {
      stats.successful++;
      stats.successful_amount += payment.amount;
    } else if (payment.status === 'PENDING') {
      stats.pending++;
    } else if (payment.status === 'FAILED') {
      stats.failed++;
    } else if (payment.status === 'REFUNDED') {
      stats.refunded++;
    }
    
    stats.total_amount += payment.amount;
  });
  
  return stats;
};

module.exports = {
  findById,
  findByOrderId,
  findByPaymentIntentId,
  create,
  updateStatus,
  findAll,
  getStatistics
};
