/**
 * REFUND SERVICE
 * 
 * Business logic layer for product refund operations.
 * Handles refund request creation, eligibility validation, refund amount calculation,
 * Stripe refund processing, and seller earnings adjustments.
 * 
 * Spec: customer-order-management-enhancements
 * Requirements: 3.3, 3.4, 3.6, 3.7, 4.3, 4.4, 4.6, 4.7, 12.2, 12.4, 12.6, 12.7
 */

const supabase = require('../../config/supabase');
const stripe = require('../../config/stripe');

/**
 * Validate refund eligibility for a product in an order
 * Checks: order status (delivered), 30-day window, category restrictions, 
 * previous refunds/replacements
 * 
 * @param {String} orderId - Order UUID
 * @param {String} productId - Product UUID
 * @returns {Promise<Object>} { eligible: boolean, reason?: string, details?: Object }
 * 
 * Requirements: 3.4, 3.7, 12.2, 12.4, 12.6, 12.7
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
    
    // 2. Check order status - must be "delivered" (Requirement 12.2)
    if (order.status !== 'delivered') {
      return {
        eligible: false,
        reason: 'Order must be delivered before requesting refund',
        code: 'ORDER_NOT_DELIVERED',
        details: {
          currentStatus: order.status,
          requiredStatus: 'delivered'
        }
      };
    }
    
    // 3. Check 30-day window from delivery (Requirements 3.4, 12.4)
    const deliveryDate = new Date(order.delivered_at || order.created_at);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now - deliveryDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 30) {
      return {
        eligible: false,
        reason: 'Refund request window has expired (30 days from delivery)',
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
          is_refundable
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
    
    // 5. Check if product category is marked as non-refundable (Requirement 12.6)
    if (product.categories && product.categories.is_refundable === false) {
      return {
        eligible: false,
        reason: 'This product category is not eligible for refund',
        code: 'CATEGORY_NOT_REFUNDABLE',
        details: {
          categoryName: product.categories.name
        }
      };
    }
    
    // Also check the product-level is_returnable flag
    if (product.is_returnable === false) {
      return {
        eligible: false,
        reason: 'This product is marked as final sale and cannot be refunded',
        code: 'PRODUCT_NOT_REFUNDABLE'
      };
    }
    
    // 6. Check for previous refund requests (Requirements 3.7, 12.7)
    const { data: existingRefund, error: refundError } = await supabase
      .from('refund_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();
    
    if (existingRefund && !refundError) {
      return {
        eligible: false,
        reason: 'A refund request already exists for this product',
        code: 'DUPLICATE_REFUND_REQUEST',
        details: {
          existingRequestId: existingRefund.id,
          existingRequestStatus: existingRefund.status
        }
      };
    }
    
    // 7. Check for previous replacement requests (Requirement 12.7)
    const { data: existingReplacement, error: replacementError } = await supabase
      .from('replacement_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();
    
    if (existingReplacement && !replacementError) {
      return {
        eligible: false,
        reason: 'This product has already been replaced and cannot be refunded',
        code: 'PRODUCT_ALREADY_REPLACED',
        details: {
          replacementRequestId: existingReplacement.id,
          replacementStatus: existingReplacement.status
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
    console.error('Error validating refund eligibility:', error);
    throw new Error(`Failed to validate refund eligibility: ${error.message}`);
  }
}

/**
 * Calculate refund amount (product price + proportional shipping cost)
 * 
 * @param {String} orderId - Order UUID
 * @param {String} productId - Product UUID
 * @returns {Promise<Object>} { productPrice, shippingCost, refundAmount }
 * 
 * Requirement: 3.6
 */
async function calculateRefundAmount(orderId, productId) {
  try {
    // 1. Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, amount, basket, shipping_cost')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      throw new Error('Order not found');
    }
    
    // 2. Find the product in the order basket
    let productPrice = 0;
    let productQuantity = 0;
    
    if (order.basket && Array.isArray(order.basket)) {
      const basketItem = order.basket.find(item => item.product_id === productId);
      
      if (basketItem) {
        productPrice = parseFloat(basketItem.price || 0);
        productQuantity = parseInt(basketItem.quantity || 1);
      }
    }
    
    if (productPrice === 0) {
      // Fallback: get product price from products table
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('price')
        .eq('id', productId)
        .single();
      
      if (!productError && product) {
        productPrice = parseFloat(product.price || 0);
        productQuantity = 1;
      }
    }
    
    // 3. Calculate proportional shipping cost
    // Shipping cost is divided proportionally based on the number of items in the order
    const totalItems = order.basket ? order.basket.reduce((sum, item) => sum + (item.quantity || 1), 0) : 1;
    const shippingCost = order.shipping_cost ? parseFloat(order.shipping_cost) : 0;
    const proportionalShipping = (shippingCost / totalItems) * productQuantity;
    
    // 4. Calculate total refund amount
    const totalProductPrice = productPrice * productQuantity;
    const refundAmount = totalProductPrice + proportionalShipping;
    
    return {
      productPrice: totalProductPrice,
      shippingCost: proportionalShipping,
      refundAmount: parseFloat(refundAmount.toFixed(2))
    };
    
  } catch (error) {
    console.error('Error calculating refund amount:', error);
    throw new Error(`Failed to calculate refund amount: ${error.message}`);
  }
}

/**
 * Create a new refund request
 * Validates eligibility, calculates refund amount, and creates the request record
 * 
 * @param {Object} requestData - Request data
 * @param {String} requestData.orderId - Order UUID
 * @param {String} requestData.productId - Product UUID
 * @param {String} requestData.customerId - Customer UUID
 * @param {String} requestData.reason - Reason for refund
 * @param {String} requestData.description - Detailed description
 * @param {Array<String>} requestData.photoUrls - Array of photo URLs (optional)
 * @returns {Promise<Object>} Created refund request
 * 
 * Requirement: 3.3
 */
async function createRequest(requestData) {
  try {
    const { orderId, productId, customerId, reason, description, photoUrls = [] } = requestData;
    
    // 1. Validate required fields
    if (!orderId || !productId || !customerId) {
      throw new Error('Order ID, Product ID, and Customer ID are required');
    }
    
    if (!reason || !description) {
      throw new Error('Reason and description are required');
    }
    
    // Validate reason
    const validReasons = ['not_as_described', 'quality_issue', 'changed_mind', 'found_better_price', 'other'];
    if (!validReasons.includes(reason)) {
      throw new Error(`Invalid reason. Must be one of: ${validReasons.join(', ')}`);
    }
    
    // 2. Validate eligibility
    const eligibility = await validateEligibility(orderId, productId);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Product is not eligible for refund');
    }
    
    // 3. Get order and product details for seller_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, status, payment_intent_id')
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
    
    // 4. Calculate refund amount (Requirement 3.6)
    const refundCalculation = await calculateRefundAmount(orderId, productId);
    
    // 5. Create refund request record (Requirement 3.3)
    const { data: refundRequest, error: createError } = await supabase
      .from('refund_requests')
      .insert([{
        order_id: orderId,
        product_id: productId,
        customer_id: customerId,
        seller_id: sellerId,
        reason,
        description,
        photo_urls: photoUrls,
        product_price: refundCalculation.productPrice,
        shipping_cost: refundCalculation.shippingCost,
        refund_amount: refundCalculation.refundAmount,
        status: 'pending',
        delivered_at: eligibility.details.deliveryDate
      }])
      .select(`
        *,
        product:products(id, title, image_url, price)
      `)
      .single();
    
    if (createError) {
      console.error('Error creating refund request:', createError);
      throw new Error(`Failed to create refund request: ${createError.message}`);
    }
    
    // 6. Send notifications to customer, seller, and manager (Requirements 3.5, 4.1)
    // Note: Notification integration will be implemented in task 12
    
    return refundRequest;
    
  } catch (error) {
    console.error('Error in createRequest:', error);
    throw error;
  }
}

/**
 * Process Stripe refund for a refund request
 * Integrates with Stripe Refunds API, uses idempotency keys, handles errors with retry logic
 * 
 * @param {String} requestId - Refund request UUID
 * @returns {Promise<Object>} Stripe refund object
 * 
 * Requirements: 4.3, 4.4
 */
async function processStripeRefund(requestId) {
  try {
    // 1. Get refund request details
    const { data: refundRequest, error: requestError } = await supabase
      .from('refund_requests')
      .select(`
        id,
        order_id,
        refund_amount,
        stripe_refund_id,
        orders:order_id (
          id,
          payment_intent_id
        )
      `)
      .eq('id', requestId)
      .single();
    
    if (requestError || !refundRequest) {
      throw new Error('Refund request not found');
    }
    
    // 2. Check if refund already processed
    if (refundRequest.stripe_refund_id) {
      console.log(`Refund already processed for request ${requestId}`);
      return {
        id: refundRequest.stripe_refund_id,
        status: 'succeeded',
        alreadyProcessed: true
      };
    }
    
    // 3. Validate payment intent exists
    if (!refundRequest.orders || !refundRequest.orders.payment_intent_id) {
      throw new Error('No payment intent found for this order');
    }
    
    const paymentIntentId = refundRequest.orders.payment_intent_id;
    
    // 4. Convert refund amount to cents (Stripe uses smallest currency unit)
    const refundAmountCents = Math.round(refundRequest.refund_amount * 100);
    
    // 5. Process Stripe refund with idempotency key and retry logic
    const idempotencyKey = `refund_${requestId}`;
    let stripeRefund = null;
    let lastError = null;
    const maxRetries = 3;
    const retryDelays = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempting Stripe refund (attempt ${attempt + 1}/${maxRetries}) for request ${requestId}`);
        
        stripeRefund = await stripe.refunds.create(
          {
            payment_intent: paymentIntentId,
            amount: refundAmountCents,
            reason: 'requested_by_customer',
            metadata: {
              refund_request_id: requestId,
              order_id: refundRequest.order_id
            }
          },
          {
            idempotencyKey: idempotencyKey
          }
        );
        
        console.log(`Stripe refund successful: ${stripeRefund.id}`);
        break; // Success, exit retry loop
        
      } catch (stripeError) {
        lastError = stripeError;
        console.error(`Stripe refund attempt ${attempt + 1} failed:`, stripeError.message);
        
        // Check if error is retryable
        const isRetryable = 
          stripeError.type === 'StripeConnectionError' ||
          stripeError.type === 'StripeAPIError' ||
          (stripeError.statusCode && stripeError.statusCode >= 500);
        
        if (!isRetryable || attempt === maxRetries - 1) {
          // Non-retryable error or last attempt, throw error
          throw stripeError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
      }
    }
    
    if (!stripeRefund) {
      throw lastError || new Error('Failed to process Stripe refund after retries');
    }
    
    // 6. Update refund request with Stripe refund details
    const { error: updateError } = await supabase
      .from('refund_requests')
      .update({
        stripe_refund_id: stripeRefund.id,
        stripe_refund_status: stripeRefund.status,
        refund_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (updateError) {
      console.error('Error updating refund request with Stripe details:', updateError);
      // Don't throw - refund was successful, just log the error
    }
    
    return stripeRefund;
    
  } catch (error) {
    console.error('Error processing Stripe refund:', error);
    
    // Update refund request status to failed
    await supabase
      .from('refund_requests')
      .update({
        status: 'failed',
        stripe_refund_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    throw new Error(`Failed to process Stripe refund: ${error.message}`);
  }
}

/**
 * Adjust seller earnings by deducting refund amount from pending earnings
 * 
 * @param {String} sellerId - Seller UUID
 * @param {Number} amount - Refund amount to deduct
 * @param {String} orderId - Order UUID (for tracking)
 * @param {String} refundRequestId - Refund request UUID (for tracking)
 * @returns {Promise<Object>} Updated seller earnings
 * 
 * Requirement: 4.6
 */
async function adjustSellerEarnings(sellerId, amount, orderId, refundRequestId) {
  try {
    // 1. Validate inputs
    if (!sellerId || !amount || amount <= 0) {
      throw new Error('Invalid seller ID or refund amount');
    }
    
    // 2. Find the seller earnings record for this order
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('parent_order_id', orderId)
      .in('status', ['pending', 'processing', 'available'])
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (earningsError) {
      console.error('Error fetching seller earnings:', earningsError);
      throw new Error(`Failed to fetch seller earnings: ${earningsError.message}`);
    }
    
    if (!earnings || earnings.length === 0) {
      console.warn(`No pending earnings found for seller ${sellerId} and order ${orderId}`);
      // This might be okay if earnings were already paid out
      return {
        adjusted: false,
        reason: 'No pending earnings found'
      };
    }
    
    const earningRecord = earnings[0];
    
    // 3. Convert amount to cents (database stores in cents)
    const refundAmountCents = Math.round(amount * 100);
    
    // 4. Calculate new net amount
    const currentNetAmount = earningRecord.net_amount || 0;
    const newNetAmount = Math.max(0, currentNetAmount - refundAmountCents);
    
    // 5. Update seller earnings record
    const { data: updatedEarnings, error: updateError } = await supabase
      .from('seller_earnings')
      .update({
        net_amount: newNetAmount,
        status: newNetAmount === 0 ? 'refunded' : earningRecord.status,
        hold_reason: `Refund processed: ${refundRequestId}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', earningRecord.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating seller earnings:', updateError);
      throw new Error(`Failed to update seller earnings: ${updateError.message}`);
    }
    
    console.log(`Adjusted seller earnings for seller ${sellerId}: deducted $${amount} (${refundAmountCents} cents)`);
    
    return {
      adjusted: true,
      earningsId: updatedEarnings.id,
      previousAmount: currentNetAmount,
      newAmount: newNetAmount,
      deductedAmount: refundAmountCents
    };
    
  } catch (error) {
    console.error('Error adjusting seller earnings:', error);
    throw error;
  }
}

/**
 * Process manager approval of a refund request
 * Updates status to "processing", calls processStripeRefund, on success updates to "completed",
 * calls adjustSellerEarnings, updates original order status to "refunded"
 * 
 * @param {String} requestId - Refund request UUID
 * @param {String} managerId - Manager UUID who approved
 * @returns {Promise<Object>} Updated refund request
 * 
 * Requirements: 4.3, 4.4, 4.6, 4.7
 */
async function processApproval(requestId, managerId) {
  try {
    // 1. Validate inputs
    if (!requestId || !managerId) {
      throw new Error('Request ID and Manager ID are required');
    }
    
    // 2. Get refund request details
    const { data: refundRequest, error: requestError } = await supabase
      .from('refund_requests')
      .select(`
        id,
        order_id,
        product_id,
        customer_id,
        seller_id,
        refund_amount,
        status
      `)
      .eq('id', requestId)
      .single();
    
    if (requestError || !refundRequest) {
      throw new Error('Refund request not found');
    }
    
    // 3. Validate current status
    if (refundRequest.status !== 'pending') {
      throw new Error(`Cannot approve refund request with status: ${refundRequest.status}`);
    }
    
    // 4. Update status to "processing" (Requirement 4.3)
    const { error: processingError } = await supabase
      .from('refund_requests')
      .update({
        status: 'processing',
        reviewed_by: managerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (processingError) {
      console.error('Error updating refund request to processing:', processingError);
      throw new Error(`Failed to update refund request: ${processingError.message}`);
    }
    
    // 5. Process Stripe refund (Requirement 4.3, 4.4)
    let stripeRefund;
    try {
      stripeRefund = await processStripeRefund(requestId);
      console.log(`Stripe refund processed successfully: ${stripeRefund.id}`);
    } catch (stripeError) {
      console.error('Stripe refund failed:', stripeError);
      
      // Update status to failed
      await supabase
        .from('refund_requests')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
      
      throw new Error(`Stripe refund failed: ${stripeError.message}`);
    }
    
    // 6. On success, update status to "completed" (Requirement 4.4)
    const { error: completedError } = await supabase
      .from('refund_requests')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (completedError) {
      console.error('Error updating refund request to completed:', completedError);
      // Don't throw - refund was successful
    }
    
    // 7. Adjust seller earnings (Requirement 4.6)
    try {
      await adjustSellerEarnings(
        refundRequest.seller_id,
        refundRequest.refund_amount,
        refundRequest.order_id,
        requestId
      );
      console.log(`Seller earnings adjusted for seller ${refundRequest.seller_id}`);
    } catch (earningsError) {
      console.error('Error adjusting seller earnings:', earningsError);
      // Don't throw - refund was successful, log the error
    }
    
    // 8. Update original order status to "refunded" (Requirement 4.7)
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString()
      })
      .eq('id', refundRequest.order_id);
    
    if (orderError) {
      console.error('Error updating order status to refunded:', orderError);
      // Don't throw - refund was successful
    }
    
    // 9. Get updated refund request with all details
    const { data: updatedRequest, error: fetchError } = await supabase
      .from('refund_requests')
      .select(`
        *,
        product:products(id, title, image_url, price),
        customer:users!refund_requests_customer_id_fkey(id, email, first_name, last_name),
        seller:users!refund_requests_seller_id_fkey(id, email, first_name, last_name),
        reviewer:users!refund_requests_reviewed_by_fkey(id, email, first_name, last_name)
      `)
      .eq('id', requestId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching updated refund request:', fetchError);
      // Return basic data if fetch fails
      return {
        id: requestId,
        status: 'completed',
        stripe_refund_id: stripeRefund.id
      };
    }
    
    // 10. Send notifications to customer (Requirements 4.4, 14.3, 14.4)
    // Note: Notification integration will be implemented in task 12
    
    return updatedRequest;
    
  } catch (error) {
    console.error('Error in processApproval:', error);
    throw error;
  }
}

/**
 * Process manager rejection of a refund request
 * Updates status to "rejected", stores rejection reason
 * 
 * @param {String} requestId - Refund request UUID
 * @param {String} managerId - Manager UUID who rejected
 * @param {String} reason - Rejection reason
 * @returns {Promise<Object>} Updated refund request
 * 
 * Requirement: 4.5
 */
async function processRejection(requestId, managerId, reason) {
  try {
    // 1. Validate inputs
    if (!requestId || !managerId) {
      throw new Error('Request ID and Manager ID are required');
    }
    
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }
    
    // 2. Get refund request details
    const { data: refundRequest, error: requestError } = await supabase
      .from('refund_requests')
      .select('id, status')
      .eq('id', requestId)
      .single();
    
    if (requestError || !refundRequest) {
      throw new Error('Refund request not found');
    }
    
    // 3. Validate current status
    if (refundRequest.status !== 'pending') {
      throw new Error(`Cannot reject refund request with status: ${refundRequest.status}`);
    }
    
    // 4. Update status to "rejected" and store rejection reason (Requirement 4.5)
    const { data: updatedRequest, error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: 'rejected',
        reviewed_by: managerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select(`
        *,
        product:products(id, title, image_url, price),
        customer:users!refund_requests_customer_id_fkey(id, email, first_name, last_name),
        seller:users!refund_requests_seller_id_fkey(id, email, first_name, last_name),
        reviewer:users!refund_requests_reviewed_by_fkey(id, email, first_name, last_name)
      `)
      .single();
    
    if (updateError) {
      console.error('Error updating refund request to rejected:', updateError);
      throw new Error(`Failed to reject refund request: ${updateError.message}`);
    }
    
    // 5. Send notification to customer with rejection reason (Requirements 4.5, 14.3)
    // Note: Notification integration will be implemented in task 12
    
    console.log(`Refund request ${requestId} rejected by manager ${managerId}`);
    
    return updatedRequest;
    
  } catch (error) {
    console.error('Error in processRejection:', error);
    throw error;
  }
}

module.exports = {
  validateEligibility,
  calculateRefundAmount,
  createRequest,
  processStripeRefund,
  adjustSellerEarnings,
  processApproval,
  processRejection
};


/**
 * Get customer's refund requests with pagination and filtering
 * 
 * @param {Object} filters - Filter options
 * @param {String} filters.customerId - Customer UUID
 * @param {String} filters.status - Filter by status (optional)
 * @param {Number} filters.page - Page number
 * @param {Number} filters.limit - Items per page
 * @returns {Promise<Object>} { requests, total, totalPages }
 */
async function getCustomerRefunds(filters) {
  try {
    const { customerId, status, page = 1, limit = 20 } = filters;
    
    // Build query
    let query = supabase
      .from('refund_requests')
      .select(`
        *,
        product:products(id, title, image_url, price),
        order:orders(id, order_number, created_at)
      `, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: requests, error, count } = await query;
    
    if (error) {
      console.error('Error fetching customer refunds:', error);
      throw new Error(`Failed to fetch customer refunds: ${error.message}`);
    }
    
    return {
      requests: requests || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
    
  } catch (error) {
    console.error('Error in getCustomerRefunds:', error);
    throw error;
  }
}

/**
 * Get refund requests for manager review with pagination and filtering
 * 
 * @param {Object} filters - Filter options
 * @param {String} filters.status - Filter by status (optional)
 * @param {String} filters.sellerId - Filter by seller (optional)
 * @param {Number} filters.page - Page number
 * @param {Number} filters.limit - Items per page
 * @returns {Promise<Object>} { requests, total, totalPages }
 */
async function getManagerRefunds(filters) {
  try {
    const { status, sellerId, page = 1, limit = 20 } = filters;
    
    // Build query
    let query = supabase
      .from('refund_requests')
      .select(`
        *,
        product:products(id, title, image_url, price),
        customer:users!refund_requests_customer_id_fkey(id, email, first_name, last_name),
        seller:users!refund_requests_seller_id_fkey(id, email, first_name, last_name),
        order:orders(id, order_number, created_at)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply seller filter if provided
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: requests, error, count } = await query;
    
    if (error) {
      console.error('Error fetching manager refunds:', error);
      throw new Error(`Failed to fetch manager refunds: ${error.message}`);
    }
    
    return {
      requests: requests || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
    
  } catch (error) {
    console.error('Error in getManagerRefunds:', error);
    throw error;
  }
}

/**
 * Get all refund requests with pagination and filtering (Admin)
 * 
 * @param {Object} filters - Filter options
 * @param {String} filters.status - Filter by status (optional)
 * @param {String} filters.sellerId - Filter by seller (optional)
 * @param {String} filters.startDate - Filter by start date (optional)
 * @param {String} filters.endDate - Filter by end date (optional)
 * @param {Number} filters.page - Page number
 * @param {Number} filters.limit - Items per page
 * @returns {Promise<Object>} { requests, total, totalPages }
 */
async function getAllRefunds(filters) {
  try {
    const { status, sellerId, startDate, endDate, page = 1, limit = 20 } = filters;
    
    // Build query
    let query = supabase
      .from('refund_requests')
      .select(`
        *,
        product:products(id, title, image_url, price),
        customer:users!refund_requests_customer_id_fkey(id, email, first_name, last_name),
        seller:users!refund_requests_seller_id_fkey(id, email, first_name, last_name),
        reviewer:users!refund_requests_reviewed_by_fkey(id, email, first_name, last_name),
        order:orders(id, order_number, created_at)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply seller filter if provided
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }
    
    // Apply date range filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data: requests, error, count } = await query;
    
    if (error) {
      console.error('Error fetching all refunds:', error);
      throw new Error(`Failed to fetch all refunds: ${error.message}`);
    }
    
    return {
      requests: requests || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
    
  } catch (error) {
    console.error('Error in getAllRefunds:', error);
    throw error;
  }
}

/**
 * Get refund analytics and metrics
 * 
 * @param {Object} filters - Filter options
 * @param {String} filters.startDate - Start date for analytics (optional)
 * @param {String} filters.endDate - End date for analytics (optional)
 * @param {String} filters.sellerId - Filter by seller (optional)
 * @param {String} filters.status - Filter by status (optional)
 * @returns {Promise<Object>} Analytics data
 */
async function getRefundAnalytics(filters) {
  try {
    const { startDate, endDate, sellerId, status } = filters;
    
    // Build base query
    let query = supabase
      .from('refund_requests')
      .select('id, status, refund_amount, reason, created_at, reviewed_at');
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data: refunds, error } = await query;
    
    if (error) {
      console.error('Error fetching refund analytics:', error);
      throw new Error(`Failed to fetch refund analytics: ${error.message}`);
    }
    
    // Calculate metrics
    const totalRequests = refunds.length;
    const pendingCount = refunds.filter(r => r.status === 'pending').length;
    const processingCount = refunds.filter(r => r.status === 'processing').length;
    const completedCount = refunds.filter(r => r.status === 'completed').length;
    const rejectedCount = refunds.filter(r => r.status === 'rejected').length;
    const failedCount = refunds.filter(r => r.status === 'failed').length;
    const approvedCount = completedCount + processingCount;
    
    const totalAmount = refunds
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + parseFloat(r.refund_amount || 0), 0);
    
    const approvalRate = totalRequests > 0 
      ? ((approvedCount / totalRequests) * 100).toFixed(2)
      : '0.00';
    
    const rejectionRate = totalRequests > 0
      ? ((rejectedCount / totalRequests) * 100).toFixed(2)
      : '0.00';
    
    // Calculate average processing time (in hours)
    const processedRefunds = refunds.filter(r => r.reviewed_at && r.created_at);
    const avgProcessingTime = processedRefunds.length > 0
      ? (processedRefunds.reduce((sum, r) => {
          const created = new Date(r.created_at);
          const reviewed = new Date(r.reviewed_at);
          const hours = (reviewed - created) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / processedRefunds.length).toFixed(2)
      : '0.00';
    
    // Count common reasons
    const reasonCounts = {};
    refunds.forEach(r => {
      if (r.reason) {
        reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
      }
    });
    
    // Create timeline data (group by date)
    const timeline = {};
    refunds.forEach(r => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = { date, count: 0, amount: 0 };
      }
      timeline[date].count++;
      if (r.status === 'completed') {
        timeline[date].amount += parseFloat(r.refund_amount || 0);
      }
    });
    
    return {
      total_requests: totalRequests,
      total_amount: parseFloat(totalAmount.toFixed(2)),
      pending_count: pendingCount,
      processing_count: processingCount,
      completed_count: completedCount,
      rejected_count: rejectedCount,
      failed_count: failedCount,
      approval_rate: approvalRate,
      rejection_rate: rejectionRate,
      avg_processing_time: avgProcessingTime,
      common_reasons: reasonCounts,
      timeline: Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date))
    };
    
  } catch (error) {
    console.error('Error in getRefundAnalytics:', error);
    throw error;
  }
}

module.exports = {
  validateEligibility,
  calculateRefundAmount,
  createRequest,
  processStripeRefund,
  adjustSellerEarnings,
  processApproval,
  processRejection,
  getCustomerRefunds,
  getManagerRefunds,
  getAllRefunds,
  getRefundAnalytics
};
