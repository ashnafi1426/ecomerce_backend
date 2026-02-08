/**
 * USER SERVICE
 * 
 * Business logic layer for user operations.
 * Database operations using Supabase.
 */

const supabase = require('../../config/supabase');

/**
 * Find user by ID
 * @param {String} id - User UUID
 * @returns {Promise<Object|null>} User object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, password_hash, role, display_name, phone, created_at, last_login_at, status')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Find user by email
 * @param {String} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
const findByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user object
 */
const create = async ({ email, passwordHash, role = 'customer', displayName = null }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password_hash: passwordHash,
      role,
      display_name: displayName
    }])
    .select('id, email, role, display_name, created_at, status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update last login timestamp
 * @param {String} id - User UUID
 * @returns {Promise<void>}
 */
const updateLastLogin = async (id) => {
  const { error } = await supabase
    .from('users')
    .update({ 
      last_login_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Update user profile
 * @param {String} id - User UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated user object
 */
const update = async (id, updates) => {
  const { data, error} = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, role, display_name, phone, created_at, status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update user status
 * @param {String} id - User UUID
 * @param {String} status - New status
 * @returns {Promise<Object>} Updated user object
 */
const updateStatus = async (id, status) => {
  return await update(id, { status });
};

/**
 * Get all users (admin only)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of user objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select('id, email, role, display_name, phone, created_at, last_login_at, status')
    .order('created_at', { ascending: false });

  if (filters.role) {
    query = query.eq('role', filters.role);
  }

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
 * Delete user (soft delete by setting status)
 * @param {String} id - User UUID
 * @returns {Promise<void>}
 */
const deleteUser = async (id) => {
  await updateStatus(id, 'deleted');
};

/**
 * Get user statistics
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} User statistics
 */
const getStatistics = async (userId) => {
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('amount, status')
    .eq('user_id', userId);
  
  if (orderError) throw orderError;

  const { count: returnCount, error: returnError } = await supabase
    .from('returns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (returnError) throw returnError;

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.amount, 0);

  return {
    total_orders: totalOrders,
    completed_orders: completedOrders,
    total_spent: totalSpent,
    average_order_value: totalOrders > 0 ? totalSpent / totalOrders : 0,
    total_returns: returnCount || 0
  };
};

/**
 * Search users by email or name
 * @param {String} searchTerm - Search term
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} Array of user objects
 */
const search = async (searchTerm, limit = 20) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, role, status, created_at')
    .or(`email.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
    .limit(limit);
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Create seller account
 * @param {Object} sellerData - Seller registration data
 * @returns {Promise<Object>} Created seller object
 */
const createSeller = async ({ email, passwordHash, displayName, businessName, businessInfo, phone }) => {
  const insertData = {
    email,
    password_hash: passwordHash,
    role: 'seller',
    display_name: displayName,
    business_name: businessName,
    phone,
    verification_status: 'pending', // Requires admin approval
    status: 'active'
  };

  // Handle businessInfo object - map to individual columns
  if (businessInfo) {
    if (businessInfo.description) insertData.business_description = businessInfo.description;
    if (businessInfo.email) insertData.business_email = businessInfo.email;
    if (businessInfo.phone) insertData.business_phone = businessInfo.phone;
    if (businessInfo.address) insertData.business_address = businessInfo.address;
    if (businessInfo.taxId) insertData.tax_id = businessInfo.taxId;
  }

  const { data, error } = await supabase
    .from('users')
    .insert([insertData])
    .select('id, email, role, display_name, business_name, verification_status, created_at, status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Create manager account (Admin only)
 * @param {Object} managerData - Manager data
 * @returns {Promise<Object>} Created manager object
 */
const createManager = async ({ email, passwordHash, displayName, phone = null }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password_hash: passwordHash,
      role: 'manager',
      display_name: displayName,
      phone,
      status: 'active'
    }])
    .select('id, email, role, display_name, phone, created_at, status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Update seller verification status
 * @param {String} sellerId - Seller UUID
 * @param {String} status - Verification status ('pending', 'verified', 'rejected')
 * @returns {Promise<Object>} Updated seller object
 */
const updateSellerStatus = async (sellerId, status) => {
  const { data, error } = await supabase
    .from('users')
    .update({ verification_status: status })
    .eq('id', sellerId)
    .eq('role', 'seller')
    .select('id, email, display_name, business_name, verification_status')
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get all sellers
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of seller objects
 */
const findAllSellers = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select('id, email, display_name, business_name, business_description, business_email, business_phone, business_address, tax_id, phone, verification_status, seller_tier, created_at, status')
    .eq('role', 'seller')
    .order('created_at', { ascending: false });

  if (filters.verificationStatus) {
    query = query.eq('verification_status', filters.verificationStatus);
  }

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
 * Get all managers
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of manager objects
 */
const findAllManagers = async (filters = {}) => {
  let query = supabase
    .from('users')
    .select('id, email, display_name, phone, created_at, last_login_at, status')
    .eq('role', 'manager')
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
 * Get seller by ID with full details
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object|null>} Seller object or null
 */
const findSellerById = async (sellerId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, display_name, business_name, business_description, business_email, business_phone, business_address, tax_id, phone, verification_status, seller_tier, average_rating, total_reviews, total_sales, total_orders, created_at, last_login_at, status')
    .eq('id', sellerId)
    .eq('role', 'seller')
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

module.exports = {
  findById,
  findByEmail,
  create,
  updateLastLogin,
  update,
  updateStatus,
  findAll,
  deleteUser,
  getStatistics,
  search,
  // Phase 2: Seller & Manager functions
  createSeller,
  createManager,
  updateSellerStatus,
  findAllSellers,
  findAllManagers,
  findSellerById
};
