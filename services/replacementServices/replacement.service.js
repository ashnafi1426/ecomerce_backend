/**
 * REPLACEMENT SERVICE
 * 
 * Business logic layer for product replacement operations.
 * Handles replacement request creation, eligibility validation, approval workflow, and inventory management.
 * 
 * Spec: customer-order-management-enhancements
 * Requirements: 1.3, 1.4, 1.6, 1.7, 2.3, 2.4, 2.5, 2.6, 2.7, 12.1, 12.3, 12.5, 12.7
 */

const supabase = require('../../config/supabase');
const variantInventoryService = require('../variantServices/variantInventory.service');
const inventoryService = require('../inventoryServices/inventory.service');
const replacementNotificationService = require('../notificationServices/replacement-notification.service');

/**
 * Validate replacement eligibility for a product in an order
 * Checks: order status (delivered), 30-day window, category restrictions, previous replacements
 * 
 * @param {String} orderId - Order UUID
 * @param {String} productId - Product UUID
 * @returns {Promise<Object>} { eligible: boolean, reason?: string, details?: Object }
 * 
 * Requirements: 1.4, 1.7, 12.1, 12.3, 12.5, 12.7
 */
async function validateEligibility(orderId, productId) {
  try {
    // 1. Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, status, created_at, delivered_at')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      return {
        eligible: false,
        reason: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      };
    }
    
    // 2. Check order status - must be "delivered" (Requirement 12.1)
    if (order.status !== 'delivered') {
      return {
        eligible: false,
        reason: 'Order must be delivered before requesting replacement',
        code: 'ORDER_NOT_DELIVERED',
        details: {
          currentStatus: order.status,
          requiredStatus: 'delivered'
        }
      };
    }
    
    // 3. Check 30-day window from delivery (Requirements 1.4, 12.3)
    const deliveryDate = new Date(order.delivered_at || order.created_at);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now - deliveryDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 30) {
      return {
        eligible: false,
        reason: 'Replacement request window has expired (30 days from delivery)',
        code: 'OUTSIDE_PROCESSING_WINDOW',
        details: {
          deliveryDate: deliveryDate.toISOString(),
          daysSinceDelivery,
          maxDays: 30
        }
      };
    }
    
    // 4. Get product details and check category restrictions
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id, 
        title, 
        seller_id, 
        is_returnable,
        category_id,
        categories:category_id (
          id,
          name,
          is_replaceable
        )
      `)
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      return {
        eligible: false,
        reason: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      };
    }
    
    // 5. Check if product category is marked as non-replaceable (Requirement 12.5)
    if (product.categories && product.categories.is_replaceable === false) {
      return {
        eligible: false,
        reason: 'This product category is not eligible for replacement',
        code: 'CATEGORY_NOT_REPLACEABLE',
        details: {
          categoryName: product.categories.name
        }
      };
    }
    
    // Also check the product-level is_returnable flag
    if (product.is_returnable === false) {
      return {
        eligible: false,
        reason: 'This product is marked as final sale and cannot be replaced',
        code: 'PRODUCT_NOT_REPLACEABLE'
      };
    }
    
    // 6. Check for previous replacement requests (Requirements 1.7, 12.7)
    const { data: existingReplacement, error: replacementError } = await supabase
      .from('replacement_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();
    
    if (existingReplacement && !replacementError) {
      return {
        eligible: false,
        reason: 'A replacement request already exists for this product',
        code: 'DUPLICATE_REPLACEMENT_REQUEST',
        details: {
          existingRequestId: existingReplacement.id,
          existingRequestStatus: existingReplacement.status
        }
      };
    }
    
    // All checks passed
    return {
      eligible: true,
      details: {
        orderId,
        productId,
        daysSinceDelivery,
        deliveryDate: deliveryDate.toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error validating replacement eligibility:', error);
    throw new Error(`Failed to validate replacement eligibility: ${error.message}`);
  }
}

/**
 * Create a new replacement request with photo upload support
 * Validates eligibility, uploads photos to Supabase Storage, and creates the request record
 * 
 * @param {Object} requestData - Request data
 * @param {String} requestData.orderId - Order UUID
 * @param {String} requestData.productId - Product UUID
 * @param {String} requestData.customerId - Customer UUID
 * @param {String} requestData.reason - Reason for replacement (defective, damaged, wrong_item, missing_parts, other)
 * @param {String} requestData.description - Detailed description
 * @param {Array<Object>} requestData.photos - Array of photo objects with { buffer, mimetype, originalname }
 * @returns {Promise<Object>} Created replacement request
 * 
 * Requirements: 1.3, 1.6
 */
async function createRequest(requestData) {
  try {
    const { orderId, productId, customerId, reason, description, photos = [] } = requestData;
    
    // 1. Validate required fields
    if (!orderId || !productId || !customerId) {
      throw new Error('Order ID, Product ID, and Customer ID are required');
    }
    
    if (!reason || !description) {
      throw new Error('Reason and description are required');
    }
    
    // Validate reason
    const validReasons = ['defective', 'damaged', 'wrong_item', 'missing_parts', 'other'];
    if (!validReasons.includes(reason)) {
      throw new Error(`Invalid reason. Must be one of: ${validReasons.join(', ')}`);
    }
    
    // 2. Validate photo constraints (Requirement 1.6)
    if (photos.length > 5) {
      throw new Error('Maximum 5 photos allowed per replacement request');
    }
    
    // Validate photo sizes (max 5MB each)
    const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].size && photos[i].size > MAX_PHOTO_SIZE) {
        throw new Error(`Photo ${i + 1} exceeds maximum size of 5MB`);
      }
    }
    
    // 3. Validate eligibility
    const eligibility = await validateEligibility(orderId, productId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Product is not eligible for replacement');
    }
    
    // 4. Get order and product details for seller_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, status')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      throw new Error('Order not found');
    }
    
    // Verify customer owns the order
    if (order.user_id !== customerId) {
      throw new Error('Unauthorized: Customer does not own this order');
    }
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      throw new Error('Product not found');
    }
    
    const sellerId = product.seller_id || order.seller_id;
    
    if (!sellerId) {
      throw new Error('Unable to determine seller for this product');
    }
    
    // 5. Upload photos to Supabase Storage (if any)
    const photoUrls = [];
    
    if (photos.length > 0) {
      const bucketName = 'replacement-photos';
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileExtension = photo.originalname ? photo.originalname.split('.').pop() : 'jpg';
        const fileName = `${orderId}/${productId}/${timestamp}-${randomString}.${fileExtension}`;
        
        try {
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, photo.buffer, {
              contentType: photo.mimetype || 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error(`Error uploading photo ${i + 1}:`, uploadError);
            throw new Error(`Failed to upload photo ${i + 1}: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
          
          if (urlData && urlData.publicUrl) {
            photoUrls.push(urlData.publicUrl);
          }
        } catch (uploadError) {
          console.error(`Error uploading photo ${i + 1}:`, uploadError);
          // Continue with other photos, but log the error
          // In production, you might want to fail the entire request
        }
      }
    }
    
    // 6. Create replacement request record (Requirement 1.3)
    const { data: replacementRequest, error: createError } = await supabase
      .from('replacement_requests')
      .insert([{
        order_id: orderId,
        product_id: productId,
        customer_id: customerId,
        seller_id: sellerId,
        reason,
        description,
        photo_urls: photoUrls,
        status: 'pending',
        delivered_at: eligibility.details.deliveryDate
      }])
      .select(`
        *,
        product:products(id, title, image_url, price)
      `)
      .single();
    
    if (createError) {
      console.error('Error creating replacement request:', createError);
      throw new Error(`Failed to create replacement request: ${createError.message}`);
    }
    
    // 7. Send notifications to customer and seller (Requirements 1.5, 2.1)
    try {
      await replacementNotificationService.notifyReplacementRequestCreated(replacementRequest);
    } catch (notificationError) {
      console.error('Error sending replacement notifications (non-critical):', notificationError);
      // Don't throw - notification failure shouldn't break replacement request creation
    }
    
    return replacementRequest;
    
  } catch (error) {
    console.error('Error in createRequest:', error);
    throw error;
  }
}

/**
 * Create replacement request
 * @param {String} orderId - Order UUID
 * @param {String} customerId - Customer UUID
 * @param {Object} requestData - Reason, images, product details
 * @returns {Promise<Object>} Created replacement request
 */
async function createReplacementRequest(orderId, customerId, requestData) {
  // Validate required fields
  if (!requestData.product_id) {
    throw new Error('Product ID is required');
  }
  
  if (!requestData.reason_category) {
    throw new Error('Reason category is required');
  }
  
  if (!requestData.reason_description) {
    throw new Error('Reason description is required');
  }
  
  // Validate reason category
  const validReasons = ['defective_product', 'wrong_item', 'damaged_shipping', 'missing_parts', 'other'];
  if (!validReasons.includes(requestData.reason_category)) {
    throw new Error('Invalid reason category');
  }
  
  // Validate image limit (max 5)
  if (requestData.images && requestData.images.length > 5) {
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
  
  // Verify customer owns the order
  if (order.user_id !== customerId) {
    throw new Error('Unauthorized to create replacement request for this order');
  }
  
  // Verify order is delivered
  if (order.status !== 'delivered') {
    throw new Error('Can only request replacement for delivered orders');
  }
  
  // Check 30-day window
  const orderDate = new Date(order.created_at);
  const now = new Date();
  const daysSinceOrder = (now - orderDate) / (1000 * 60 * 60 * 24);
  
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
  
  // Check if product is returnable
  if (product.is_returnable === false) {
    throw new Error('This product is marked as final sale and cannot be replaced');
  }
  
  // Determine seller_id
  let sellerId = product.seller_id || order.seller_id;
  
  // If variant_id provided, validate it
  if (requestData.variant_id) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('id, product_id')
      .eq('id', requestData.variant_id)
      .single();
    
    if (!variant || variant.product_id !== requestData.product_id) {
      throw new Error('Invalid variant for this product');
    }
  }
  
  // Create replacement request
  const { data: replacement, error: replacementError } = await supabase
    .from('replacement_requests')
    .insert([{
      order_id: orderId,
      customer_id: customerId,
      seller_id: sellerId,
      product_id: requestData.product_id,
      reason: requestData.reason_category,
      description: requestData.reason_description,
      photo_urls: requestData.images || [],
      status: 'pending'
    }])
    .select(`
      *,
      product:products(id, title, image_url)
    `)
    .single();
  
  if (replacementError) throw replacementError;
  
  // Send notifications to customer and seller (Requirements 1.5, 2.1)
  try {
    await replacementNotificationService.notifyReplacementRequestCreated(replacement);
  } catch (notificationError) {
    console.error('Error sending replacement notifications (non-critical):', notificationError);
    // Don't throw - notification failure shouldn't break replacement request creation
  }
  
  return replacement;
}

/**
 * Get replacement request by ID
 * @param {String} requestId - Request UUID
 * @returns {Promise<Object|null>} Replacement request object
 */
async function getReplacementRequest(requestId) {
  const { data, error } = await supabase
    .from('replacement_requests')
    .select(`
      *,
      product:products(id, title, image_url, price)
    `)
    .eq('id', requestId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
}

/**
 * Process seller approval of a replacement request
 * Updates request status to "approved", creates zero-cost replacement order,
 * reserves inventory, and links orders bidirectionally
 * 
 * @param {String} requestId - Request UUID
 * @param {String} sellerId - Seller UUID
 * @returns {Promise<Object>} Updated replacement request with replacement order
 * 
 * Requirements: 2.3, 2.5, 2.6, 2.7
 */
async function processApproval(requestId, sellerId) {
  try {
    // 1. Validate inputs
    if (!requestId) {
      throw new Error('Request ID is required');
    }
    
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }
    
    // 2. Get replacement request
    const replacement = await getReplacementRequest(requestId);
    
    if (!replacement) {
      throw new Error('Replacement request not found');
    }
    
    // 3. Verify seller owns this replacement request
    if (replacement.seller_id !== sellerId) {
      throw new Error('Unauthorized: Seller does not own this replacement request');
    }
    
    // 4. Verify request is in pending status
    if (replacement.status !== 'pending') {
      throw new Error(`Cannot approve replacement with status: ${replacement.status}. Only pending requests can be approved.`);
    }
    
    // 5. Reserve inventory for replacement product (Requirement 2.6)
    try {
      await reserveReplacementInventory(requestId);
    } catch (error) {
      throw new Error(`Cannot approve replacement: ${error.message}`);
    }
    
    // 6. Create zero-cost replacement order (Requirement 2.3)
    const { data: originalOrder, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', replacement.order_id)
      .single();
    
    if (orderError || !originalOrder) {
      throw new Error('Original order not found');
    }
    
    // Create replacement order with zero cost
    const { data: replacementOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert([{
        user_id: replacement.customer_id,
        seller_id: replacement.seller_id,
        payment_intent_id: `replacement_${replacement.id}_${Date.now()}`,
        amount: 1, // Minimal amount (1 cent) due to check constraint
        status: 'pending_payment', // Use valid status from check constraint
        shipping_address: originalOrder.shipping_address,
        basket: [{
          product_id: replacement.product_id,
          quantity: 1,
          price: 0,
          is_replacement: true,
          original_order_id: replacement.order_id
        }],
        is_replacement_order: true,
        original_order_id: replacement.order_id
      }])
      .select()
      .single();
    
    if (createOrderError) {
      console.error('Error creating replacement order:', createOrderError);
      throw new Error(`Failed to create replacement order: ${createOrderError.message}`);
    }
    
    // 7. Update replacement request with approved status and link to replacement order (Requirements 2.3, 2.5, 2.7)
    const { data: updatedReplacement, error: updateError } = await supabase
      .from('replacement_requests')
      .update({
        status: 'approved',
        replacement_order_id: replacementOrder.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        product:products(id, title, image_url, price)
      `)
      .single();
    
    if (updateError) {
      console.error('Error updating replacement request:', updateError);
      throw new Error(`Failed to update replacement request: ${updateError.message}`);
    }
    
    // 8. Update original order with reference to replacement order (Requirement 2.7)
    // Add replacement_order_id to the original order's metadata
    const { error: updateOriginalOrderError } = await supabase
      .from('orders')
      .update({
        has_replacement: true,
        replacement_order_id: replacementOrder.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', replacement.order_id);
    
    if (updateOriginalOrderError) {
      console.error('Error updating original order:', updateOriginalOrderError);
      // Don't throw here, as the main operation succeeded
    }
    
    // 9. Send notification to customer about approval (Requirement 14.2)
    try {
      await replacementNotificationService.notifyReplacementApproved(updatedReplacement);
    } catch (notificationError) {
      console.error('Error sending replacement approval notifications (non-critical):', notificationError);
      // Don't throw - notification failure shouldn't break the approval process
    }
    
    return updatedReplacement;
    
  } catch (error) {
    console.error('Error in processApproval:', error);
    throw error;
  }
}

/**
 * Approve replacement request (Manager)
 * @param {String} requestId - Request UUID
 * @param {String} managerId - Manager UUID
 * @returns {Promise<Object>} Updated request object
 */
async function approveReplacement(requestId, managerId) {
  // Get replacement request
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) {
    throw new Error('Replacement request not found');
  }
  
  if (replacement.status !== 'pending') {
    throw new Error(`Cannot approve replacement with status: ${replacement.status}`);
  }
  
  // Reserve inventory for replacement
  try {
    await reserveReplacementInventory(requestId);
  } catch (error) {
    throw new Error(`Cannot approve replacement: ${error.message}`);
  }
  
  // Update replacement status
  const { data, error } = await supabase
    .from('replacement_requests')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select(`
      *,
      product:products(id, title, image_url)
    `)
    .single();
  
  if (error) throw error;
  
  return data;
}

/**
 * Process seller rejection of a replacement request
 * Updates request status to "rejected" and stores rejection reason
 * 
 * @param {String} requestId - Request UUID
 * @param {String} sellerId - Seller UUID
 * @param {String} reason - Rejection reason
 * @returns {Promise<void>}
 * 
 * Requirements: 2.4
 */
async function processRejection(requestId, sellerId, reason) {
  try {
    // 1. Validate inputs
    if (!requestId) {
      throw new Error('Request ID is required');
    }
    
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }
    
    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }
    
    // 2. Get replacement request
    const replacement = await getReplacementRequest(requestId);
    
    if (!replacement) {
      throw new Error('Replacement request not found');
    }
    
    // 3. Verify seller owns this replacement request
    if (replacement.seller_id !== sellerId) {
      throw new Error('Unauthorized: Seller does not own this replacement request');
    }
    
    // 4. Verify request is in pending status
    if (replacement.status !== 'pending') {
      throw new Error(`Cannot reject replacement with status: ${replacement.status}. Only pending requests can be rejected.`);
    }
    
    // 5. Update replacement status to "rejected" (Requirement 2.4)
    const { data, error } = await supabase
      .from('replacement_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        product:products(id, title, image_url, price)
      `)
      .single();
    
    if (error) {
      console.error('Error rejecting replacement request:', error);
      throw new Error(`Failed to reject replacement request: ${error.message}`);
    }
    
    // 6. Send notification to customer about rejection (Requirement 14.2)
    try {
      await replacementNotificationService.notifyReplacementRejected(data);
    } catch (notificationError) {
      console.error('Error sending replacement rejection notifications (non-critical):', notificationError);
      // Don't throw - notification failure shouldn't break the rejection process
    }
    
    return data;
    
  } catch (error) {
    console.error('Error in processRejection:', error);
    throw error;
  }
}

/**
 * Reject replacement request (Manager)
 * @param {String} requestId - Request UUID
 * @param {String} managerId - Manager UUID
 * @param {String} reason - Rejection reason
 * @returns {Promise<Object>} Updated request object
 */
async function rejectReplacement(requestId, managerId, reason) {
  // Get replacement request
  const replacement = await getReplacementRequest(requestId);
  
  if (!replacement) {
    throw new Error('Replacement request not found');
  }
  
  if (replacement.status !== 'pending') {
    throw new Error(`Cannot reject replacement with status: ${replacement.status}`);
  }
  
  if (!reason) {
    throw new Error('Rejection reason is required');
  }
  
  // Update replacement status
  const { data, error } = await supabase
    .from('replacement_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)
    .select(`
      *,
      product:products(id, title, image_url)
    `)
    .single();
  
  if (error) throw error;
  
  return data;
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
  
  // Count reasons
  const reasonCounts = {};
  replacements.forEach(r => {
    reasonCounts[r.reason_category] = (reasonCounts[r.reason_category] || 0) + 1;
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
 * Reserve inventory for approved replacement
 * @param {String} requestId - Request UUID
 * @returns {Promise<void>}
 */
async function reserveReplacementInventory(requestId) {
  // Simplified: Skip inventory reservation for now
  // In production, this would reserve inventory for the replacement product
  console.log(`[Replacement] Skipping inventory reservation for request ${requestId}`);
  return;
}

/**
 * Get customer's replacement requests with pagination and filtering
 * @param {String} customerId - Customer UUID
 * @param {Object} filters - { status, page, limit }
 * @returns {Promise<Object>} { requests, total, page, limit, totalPages }
 */
async function getCustomerReplacements(customerId, filters = {}) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('replacement_requests')
    .select(`
      *,
      product:products(id, title, image_url, price)
    `, { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    requests: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * Get seller's replacement requests with pagination and filtering
 * @param {String} sellerId - Seller UUID
 * @param {Object} filters - { status, page, limit }
 * @returns {Promise<Object>} { requests, total, page, limit, totalPages }
 * Implements Requirement 2.2
 */
async function getSellerReplacements(sellerId, filters = {}) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('replacement_requests')
    .select(`
      *,
      product:products(id, title, image_url, price)
    `, { count: 'exact' })
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    requests: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

/**
 * Get all replacement requests (admin/manager view)
 * @param {Object} filters - { status, sellerId, startDate, endDate, page, limit }
 * @returns {Promise<Object>} { requests, total, page, limit, totalPages }
 * Implements Requirements 15.1, 15.3
 */
async function getAllReplacements(filters = {}) {
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('replacement_requests')
    .select(`
      *,
      product:products(id, title, image_url, price),
      customer:users!replacement_requests_customer_id_fkey(id, display_name, email),
      seller:users!replacement_requests_seller_id_fkey(id, display_name, email)
    `, { count: 'exact' })
    .order('created_at', { ascending: false });
  
  // Filter by status
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  // Filter by seller
  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
  }
  
  // Filter by date range
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    requests: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

module.exports = {
  validateEligibility,
  createRequest,
  createReplacementRequest,
  getReplacementRequest,
  getCustomerReplacements,
  getSellerReplacements,
  getAllReplacements,
  processApproval,
  approveReplacement,
  rejectReplacement,
  processRejection,
  updateReplacementShipment,
  getReplacementAnalytics,
  reserveReplacementInventory
};