/**
 * ORDER SERVICE
 * 
 * Business logic layer for order operations.
 * Database operations using Supabase.
 */

const supabase = require('../../config/supabase');

/**
 * Find order by ID
 * @param {String} id - Order UUID
 * @returns {Promise<Object|null>} Order object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(email, display_name),
      payment:payments(status)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  if (data) {
    data.customer_email = data.user?.email;
    data.customer_name = data.user?.display_name;
    data.payment_status = data.payment?.[0]?.status;
    delete data.user;
    delete data.payment;
  }
  
  return data;
};

/**
 * Find orders by user ID
 * @param {String} userId - User UUID
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of order objects
 */
const findByUserId = async (userId, filters = {}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      payment:payments(status)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return (data || []).map(order => ({
    ...order,
    payment_status: order.payment?.[0]?.status,
    payment: undefined
  }));
};

/**
 * Get all orders (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of order objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      user:users(email, display_name),
      payment:payments(status)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return (data || []).map(order => ({
    ...order,
    customer_email: order.user?.email,
    customer_name: order.user?.display_name,
    payment_status: order.payment?.[0]?.status,
    user: undefined,
    payment: undefined
  }));
};

/**
 * Create new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order object
 */
const create = async (orderData) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      user_id: orderData.userId,
      payment_intent_id: orderData.paymentIntentId,
      amount: orderData.amount,
      basket: orderData.basket,
      shipping_address: orderData.shippingAddress,
      status: orderData.status || 'pending_payment'
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update order status
 * @param {String} id - Order UUID
 * @param {String} status - New status
 * @param {String} adminId - Admin user ID (optional)
 * @returns {Promise<Object>} Updated order object
 */
const updateStatus = async (id, status, adminId = null) => {
  const updateData = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'shipped' || status === 'delivered') {
    updateData.fulfilled_at = new Date().toISOString();
    if (adminId) {
      updateData.fulfilled_by = adminId;
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get order statistics (admin only)
 * @returns {Promise<Object>} Order statistics
 */
const getStatistics = async () => {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('status, amount');
  
  if (error) throw error;
  
  const stats = {
    total_orders: orders.length,
    pending_payment: 0,
    paid: 0,
    confirmed: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total_revenue: 0
  };

  orders.forEach(order => {
    if (order.status === 'pending_payment') stats.pending_payment++;
    else if (order.status === 'paid') stats.paid++;
    else if (order.status === 'confirmed') stats.confirmed++;
    else if (order.status === 'packed') stats.packed++;
    else if (order.status === 'shipped') stats.shipped++;
    else if (order.status === 'delivered') stats.delivered++;
    else if (order.status === 'cancelled') stats.cancelled++;
    
    if (order.status !== 'cancelled') {
      stats.total_revenue += order.amount;
    }
  });
  
  return stats;
};

/**
 * Get recent orders
 * @param {Number} limit - Number of orders to retrieve
 * @returns {Promise<Array>} Array of recent orders
 */
const getRecent = async (limit = 10) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      user:users(email, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return (data || []).map(order => ({
    ...order,
    customer_email: order.user?.email,
    customer_name: order.user?.display_name,
    user: undefined
  }));
};

module.exports = {
  findById,
  findByUserId,
  findAll,
  create,
  updateStatus,
  getStatistics,
  getRecent
};
