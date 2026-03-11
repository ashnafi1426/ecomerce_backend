/**
 * REPLACEMENT SERVICE
 * 
 * Business logic layer for product replacement operations.
 * Handles replacement request creation, approval workflow, shipment tracking, and analytics.
 * 
 * Actual DB columns on replacement_requests:
 *   id, order_id, sub_order_id, product_id, customer_id, seller_id,
 *   reason, description, photo_urls, status, rejection_reason,
 *   replacement_order_id, created_at, updated_at, delivered_at
 */

const supabase = require('../../config/supabase');
const variantInventoryService = require('../variantServices/variantInventory.service');
const inventoryService = require('../inventoryServices/inventory.service');

/**
 * Create replacement request
 */
async function createReplacementRequest(orderId, customerId, requestData) {
  if (!requestData.product_id) {
    throw new Error('Product ID is required');
  }
  
  const reasonCategory = requestData.reason_category || requestData.reason;
  const reasonDescription = requestData.reason_description || requestData.description;

  if (!reasonCategory) {
    throw new Error('Reason category is required');
  }
  
  if (!reasonDescription) {
    throw new Error('Reason description is required');
  }

  const validReasons = ['defective_product', 'wrong_item', 'damaged_shipping', 'missing_parts', 'other'];
  if (!validReasons.includes(reasonCategory)) {
    throw new Error('Invalid reason category');
  }
  
  const images = requestData.images || requestData.photo_urls || [];
  if (images.length > 5) {
    throw new Error('Maximum 5 images allowed');
  }
  
  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, seller_id, status, created_at, basket')
    .eq('id', orderId)
    .single();
  
  if (orderError || !order) {
    throw new Error('Order not found');
  }

  if (order.user_id !== customerId) {
    throw new Error('Unauthorized to create replacement request for this order');
  }

  if (order.status !== 'delivered') {
    throw new Error('Can only request replacement for delivered orders');
  }

  const orderDate = new Date(order.created_at);
  const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceOrder > 30) {
    throw new Error('Replacement request window has expired (30 days from delivery)');
  }
  
  // Get product details
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, seller_id, is_returnable')
    .eq('id', requestData.product_id)
    .single();
  
  if (productError || !product) {
    throw new Error('Product not found');
  }

  if (product.is_returnable === false) {
    throw new Error('This product is marked as final sale and cannot be replaced');
  }
  
  const sellerId = product.seller_id || order.seller_id;
  
  // Insert using actual DB columns: reason, description, photo_urls
  const { data: replacement, error: replacementError } = await supabase
    .from('replacement_requests')
    .insert([{
      order_id: orderId,
      customer_id: customerId,
      seller_id: sellerId,
      product_id: requestData.product_id,
      reason: reasonCategory,
      description: reasonDescription,
      photo_urls: images,
      status: 'pending'
    }])
    .select('*')
    .single();
  
  if (replacementError) throw replacementError;
  
  // Enrich with related data
  const [productRes, customerRes, sellerRes] = await Promise.all([
    replacement.product_id ? supabase.from('products').select('id, title, image_url').eq('id', replacement.product_id).single() : { data: null },
    replacement.customer_id ? supabase.from('users').select('id, full_name, email').eq('id', replacement.customer_id).single() : { data: null },
    replacement.seller_id ? supabase.from('users').select('id, full_name, email').eq('id', replacement.seller_id).single() : { data: null }
  ]);

  return normalizeReplacement({
    ...replacement,
    product: productRes.data || null,
    customer: customerRes.data || null,
    seller: sellerRes.data || null
  });
}

/**
 * Normalize DB row to the field names the rest of the app expects
 */
function normalizeReplacement(row) {
  if (!row) return null;
  return {
    ...row,
    reason_category: row.reason || row.reason_category,
    reason_description: row.description || row.reason_description,
    images: row.photo_urls || row.images || [],
  };
}

/**
 * Get replacement request by ID
 */
async function getReplacementRequest(requestId) {
  const { data, error } = await supabase
    .from('replacement_requests')
    .select(`
      *,
      product:products(id, title, image_url, price),
      shipment:replacement_shipments(*)
    `)
    .eq('id', requestId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const [customerRes, sellerRes] = await Promise.all([
    data.customer_id ? supabase.from('users').select('id, full_name, email').eq('id', data.customer_id).single() : { data: null },
    data.seller_id ? supabase.from('users').select('id, full_name, email').eq('id', data.seller_id).single() : { data: null }
  ]);

  return normalizeReplacement({
    ...data,
    customer: customerRes.data || null,
    seller: sellerRes.data || null
  });
}

/**
 * Approve replacement request (Manager)
 */
async function approveReplacement(requestId, managerId) {
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) throw new Error('Replacement request not found');
  if (replacement.status !== 'pending') throw new Error(`Cannot approve replacement with status: ${replacement.status}`);

  try {
    await reserveReplacementInventory(requestId);
  } catch (error) {
    throw new Error(`Cannot approve replacement: ${error.message}`);
  }
  
  // DB has no reviewed_by/reviewed_at columns — just update status
  const { data, error } = await supabase
    .from('replacement_requests')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select('*')
    .single();
  
  if (error) throw error;

  const [productRes, customerRes, sellerRes] = await Promise.all([
    data.product_id ? supabase.from('products').select('id, title, image_url').eq('id', data.product_id).single() : { data: null },
    data.customer_id ? supabase.from('users').select('id, full_name, email').eq('id', data.customer_id).single() : { data: null },
    data.seller_id ? supabase.from('users').select('id, full_name, email').eq('id', data.seller_id).single() : { data: null }
  ]);

  return normalizeReplacement({
    ...data,
    product: productRes.data || null,
    customer: customerRes.data || null,
    seller: sellerRes.data || null
  });
}

/**
 * Reject replacement request (Manager)
 */
async function rejectReplacement(requestId, managerId, reason) {
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) throw new Error('Replacement request not found');
  if (replacement.status !== 'pending') throw new Error(`Cannot reject replacement with status: ${replacement.status}`);
  if (!reason) throw new Error('Rejection reason is required');

  const { data, error } = await supabase
    .from('replacement_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select('*')
    .single();
  
  if (error) throw error;

  const [productRes, customerRes, sellerRes] = await Promise.all([
    data.product_id ? supabase.from('products').select('id, title, image_url').eq('id', data.product_id).single() : { data: null },
    data.customer_id ? supabase.from('users').select('id, full_name, email').eq('id', data.customer_id).single() : { data: null },
    data.seller_id ? supabase.from('users').select('id, full_name, email').eq('id', data.seller_id).single() : { data: null }
  ]);

  return normalizeReplacement({
    ...data,
    product: productRes.data || null,
    customer: customerRes.data || null,
    seller: sellerRes.data || null
  });
}

/**
 * Update replacement shipment tracking
 * @param {String} requestId - Request UUID
 * @param {Object} shipmentData - Tracking info
 * @returns {Promise<Object>} Updated shipment object
 */
async function updateReplacementShipment(requestId, shipmentData) {
  // Get replacement request
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) {
    throw new Error('Replacement request not found');
  }
  
  if (replacement.status !== 'approved' && replacement.status !== 'shipped') {
    throw new Error('Can only update shipment for approved replacements');
  }
  
  // Check if shipment record exists
  const { data: existingShipment } = await supabase
    .from('replacement_shipments')
    .select('id')
    .eq('replacement_request_id', requestId)
    .single();
  
  let shipment;
  
  if (existingShipment) {
    // Update existing shipment
    const { data, error } = await supabase
      .from('replacement_shipments')
      .update({
        tracking_number: shipmentData.tracking_number || null,
        carrier: shipmentData.carrier || null,
        shipped_at: shipmentData.shipped_at || new Date().toISOString(),
        estimated_delivery: shipmentData.estimated_delivery || null,
        delivered_at: shipmentData.delivered_at || null,
        notes: shipmentData.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('replacement_request_id', requestId)
      .select()
      .single();
    
    if (error) throw error;
    shipment = data;
  } else {
    // Create new shipment record
    const { data, error } = await supabase
      .from('replacement_shipments')
      .insert([{
        replacement_request_id: requestId,
        tracking_number: shipmentData.tracking_number || null,
        carrier: shipmentData.carrier || null,
        shipped_at: shipmentData.shipped_at || new Date().toISOString(),
        estimated_delivery: shipmentData.estimated_delivery || null,
        delivered_at: shipmentData.delivered_at || null,
        notes: shipmentData.notes || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    shipment = data;
  }
  
  // Update replacement status to shipped if tracking number provided
  if (shipmentData.tracking_number && replacement.status === 'approved') {
    await supabase
      .from('replacement_requests')
      .update({
        status: 'shipped',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
  }
  
  // Update to completed if delivered
  if (shipmentData.delivered_at) {
    await supabase
      .from('replacement_requests')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
  }
  
  return shipment;
}

/**
 * Get replacement analytics
 * @param {Object} filters - Date range, seller, status
 * @returns {Promise<Object>} Analytics data
 */
async function getReplacementAnalytics(filters = {}) {
  let query = supabase
    .from('replacement_requests')
    .select('*');
  
  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  const { data: replacements, error } = await query;
  
  if (error) throw error;
  
  if (!replacements || replacements.length === 0) {
    return {
      total_requests: 0,
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
      completed_count: 0,
      common_reasons: {}
    };
  }
  
  // Calculate statistics
  const totalRequests = replacements.length;
  const pendingCount = replacements.filter(r => r.status === 'pending').length;
  const approvedCount = replacements.filter(r => r.status === 'approved').length;
  const rejectedCount = replacements.filter(r => r.status === 'rejected').length;
  const completedCount = replacements.filter(r => r.status === 'completed').length;
  
  // Count reasons (DB column is 'reason', not 'reason_category')
  const reasonCounts = {};
  replacements.forEach(r => {
    const key = r.reason || 'unknown';
    reasonCounts[key] = (reasonCounts[key] || 0) + 1;
  });
  
  return {
    total_requests: totalRequests,
    pending_count: pendingCount,
    approved_count: approvedCount,
    rejected_count: rejectedCount,
    completed_count: completedCount,
    approval_rate: ((approvedCount / totalRequests) * 100).toFixed(1),
    rejection_rate: ((rejectedCount / totalRequests) * 100).toFixed(1),
    common_reasons: reasonCounts
  };
}

/**
 * Get seller's replacement requests
 * @param {String} sellerId - Seller UUID
 * @param {Object} filters - Status, page, limit
 * @returns {Promise<Array>} Replacement requests
 */
async function getSellerReplacements(sellerId, filters = {}) {
  let query = supabase
    .from('replacement_requests')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Enrich with product and customer data
  const enriched = await Promise.all((data || []).map(async (item) => {
    const [productRes, customerRes] = await Promise.all([
      item.product_id ? supabase.from('products').select('id, title, image_url, price').eq('id', item.product_id).single() : { data: null },
      item.customer_id ? supabase.from('users').select('id, display_name, email').eq('id', item.customer_id).single() : { data: null }
    ]);
    return normalizeReplacement({
      ...item,
      product: productRes.data || null,
      customer: customerRes.data || null
    });
  }));

  return enriched;
}

/**
 * Get customer's replacement requests
 * @param {String} customerId - Customer UUID
 * @param {Object} filters - Status, page, limit
 * @returns {Promise<Array>} Replacement requests
 */
async function getCustomerReplacements(customerId, filters = {}) {
  let query = supabase
    .from('replacement_requests')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Enrich with product and seller data
  const enriched = await Promise.all((data || []).map(async (item) => {
    const [productRes, sellerRes] = await Promise.all([
      item.product_id ? supabase.from('products').select('id, title, image_url, price').eq('id', item.product_id).single() : { data: null },
      item.seller_id ? supabase.from('users').select('id, display_name, email').eq('id', item.seller_id).single() : { data: null }
    ]);
    return normalizeReplacement({
      ...item,
      product: productRes.data || null,
      seller: sellerRes.data || null
    });
  }));

  return enriched;
}

/**
 * Get all replacement requests (admin/manager)
 * @param {Object} filters - Status, page, limit
 * @returns {Promise<Array>} Replacement requests
 */
async function getAllReplacements(filters = {}) {
  let query = supabase
    .from('replacement_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Enrich with product, customer, and seller data
  const enriched = await Promise.all((data || []).map(async (item) => {
    const [productRes, customerRes, sellerRes] = await Promise.all([
      item.product_id ? supabase.from('products').select('id, title, image_url, price').eq('id', item.product_id).single() : { data: null },
      item.customer_id ? supabase.from('users').select('id, display_name, email').eq('id', item.customer_id).single() : { data: null },
      item.seller_id ? supabase.from('users').select('id, display_name, email').eq('id', item.seller_id).single() : { data: null }
    ]);
    return normalizeReplacement({
      ...item,
      product: productRes.data || null,
      customer: customerRes.data || null,
      seller: sellerRes.data || null
    });
  }));

  return enriched;
}

/**
 * Update return tracking number (Customer sends back original item)
 * @param {String} requestId - Request UUID
 * @param {String} customerId - Customer UUID
 * @param {String} returnTrackingNumber - Return tracking number
 * @returns {Promise<Object>} Updated replacement request
 */
async function updateReturnTracking(requestId, customerId, returnTrackingNumber) {
  const replacement = await getReplacementRequest(requestId);

  if (!replacement) {
    throw new Error('Replacement request not found');
  }

  if (replacement.customer_id !== customerId) {
    throw new Error('Not authorized to update this replacement request');
  }

  if (!['shipped', 'approved'].includes(replacement.status)) {
    throw new Error('Can only add return tracking for shipped/approved replacements');
  }

  // DB has no return_tracking_number column — store in description or just update status
  const { data, error } = await supabase
    .from('replacement_requests')
    .update({
      status: 'return_pending',
      description: (replacement.description || '') + '\nReturn tracking: ' + returnTrackingNumber,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return normalizeReplacement(data);
}

/**
 * Confirm return received by seller
 * @param {String} requestId - Request UUID
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object>} Updated replacement request
 */
async function confirmReturnReceived(requestId, sellerId) {
  const replacement = await getReplacementRequest(requestId);

  if (!replacement) {
    throw new Error('Replacement request not found');
  }

  if (replacement.seller_id !== sellerId) {
    throw new Error('Not authorized to confirm return for this replacement');
  }

  // DB has no return_received_at — use delivered_at for completion timestamp
  const { data, error } = await supabase
    .from('replacement_requests')
    .update({
      status: 'completed',
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return normalizeReplacement(data);
}

/**
 * Reserve inventory for approved replacement
 * @param {String} requestId - Request UUID
 * @returns {Promise<void>}
 */
async function reserveReplacementInventory(requestId) {
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) {
    throw new Error('Replacement request not found');
  }
  
  // DB has no variant_id/quantity columns — reserve 1 unit of the product
  await inventoryService.reserve(replacement.product_id, 1);
}

module.exports = {
  createReplacementRequest,
  getReplacementRequest,
  getSellerReplacements,
  getCustomerReplacements,
  getAllReplacements,
  approveReplacement,
  rejectReplacement,
  updateReplacementShipment,
  updateReturnTracking,
  confirmReturnReceived,
  getReplacementAnalytics,
  reserveReplacementInventory
};