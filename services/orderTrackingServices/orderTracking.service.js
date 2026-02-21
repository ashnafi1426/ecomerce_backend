/**
 * ORDER TRACKING SERVICE
 * 
 * Business logic layer for order tracking operations.
 * Handles order timeline building, estimated delivery calculation,
 * sub-order tracking, status updates, and tracking information management.
 */

const supabase = require('../../config/supabase');
const notificationService = require('../notificationServices/notification.service');

/**
 * Build order timeline from status history
 * Aggregates all status changes for an order into a chronological timeline
 * 
 * @param {String} orderId - Order UUID
 * @returns {Promise<Array>} Array of timeline events with status, timestamp, and details
 * @throws {Error} If database query fails
 * 
 * Requirements: 7.2
 */
const buildOrderTimeline = async (orderId) => {
  try {
    // Fetch order status history
    const { data: history, error } = await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform history into timeline events
    const timeline = (history || []).map(event => ({
      id: event.id,
      status: event.new_status,
      previousStatus: event.previous_status,
      timestamp: event.created_at,
      changedBy: event.changed_by,
      reason: event.change_reason,
      notes: event.notes,
      trackingNumber: event.tracking_number,
      carrier: event.carrier,
      metadata: event.metadata || {}
    }));

    return timeline;
  } catch (error) {
    console.error('Error building order timeline:', error);
    throw new Error('Failed to build order timeline');
  }
};

/**
 * Calculate estimated delivery date based on shipping method and current status
 * 
 * @param {String} orderId - Order UUID
 * @returns {Promise<Date|null>} Estimated delivery date or null if cannot be calculated
 * @throws {Error} If database query fails
 * 
 * Requirements: 7.3
 */
const calculateEstimatedDelivery = async (orderId) => {
  try {
    // Fetch order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('status, shipping_address, created_at, shipped_at')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    if (!order) return null;

    // If already delivered, return null (no estimation needed)
    if (order.status === 'delivered') {
      return null;
    }

    // Shipping method delivery time estimates (in days)
    const deliveryTimeEstimates = {
      'standard': 7,
      'express': 3,
      'overnight': 1,
      'two_day': 2,
      'economy': 10
    };

    // Get base date for calculation
    let baseDate;
    if (order.shipped_at) {
      // If shipped, calculate from ship date
      baseDate = new Date(order.shipped_at);
    } else {
      // If not shipped, calculate from order date + 2 days processing
      baseDate = new Date(order.created_at);
      baseDate.setDate(baseDate.getDate() + 2); // Add processing time
    }

    // Get delivery time for shipping method (default to standard if not specified)
    const shippingMethod = order.shipping_address?.method || 'standard';
    const deliveryDays = deliveryTimeEstimates[shippingMethod] || deliveryTimeEstimates['standard'];

    // Calculate estimated delivery date
    const estimatedDelivery = new Date(baseDate);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    return estimatedDelivery;
  } catch (error) {
    console.error('Error calculating estimated delivery:', error);
    throw new Error('Failed to calculate estimated delivery date');
  }
};

/**
 * Get sub-order tracking information for multi-seller orders
 * Returns tracking details for each seller's portion of the order
 * 
 * @param {String} orderId - Order UUID
 * @returns {Promise<Array>} Array of sub-order tracking information
 * @throws {Error} If database query fails
 * 
 * Requirements: 7.7
 */
const getSubOrderTracking = async (orderId) => {
  try {
    // Fetch sub-orders for this order
    const { data: subOrders, error } = await supabase
      .from('sub_orders')
      .select(`
        *,
        seller:users!sub_orders_seller_id_fkey(id, display_name, email)
      `)
      .eq('parent_order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // For each sub-order, get its status history
    const subOrderTracking = await Promise.all((subOrders || []).map(async (subOrder) => {
      const { data: history, error: historyError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', subOrder.id)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error(`Error fetching history for sub-order ${subOrder.id}:`, historyError);
      }

      return {
        subOrderId: subOrder.id,
        sellerId: subOrder.seller_id,
        sellerName: subOrder.seller?.display_name || 'Unknown Seller',
        sellerEmail: subOrder.seller?.email,
        status: subOrder.status,
        amount: subOrder.amount,
        trackingNumber: subOrder.tracking_number,
        carrier: subOrder.carrier,
        shippedAt: subOrder.shipped_at,
        deliveredAt: subOrder.delivered_at,
        timeline: (history || []).map(event => ({
          status: event.new_status,
          timestamp: event.created_at,
          notes: event.notes
        })),
        items: subOrder.items || []
      };
    }));

    return subOrderTracking;
  } catch (error) {
    console.error('Error getting sub-order tracking:', error);
    throw new Error('Failed to get sub-order tracking information');
  }
};

/**
 * Update order status and create history record
 * Emits WebSocket event for real-time updates
 * 
 * @param {String} orderId - Order UUID
 * @param {String} newStatus - New status value
 * @param {String} userId - User ID making the change
 * @param {Object} options - Additional options (reason, notes, metadata)
 * @returns {Promise<Object>} Updated order object
 * @throws {Error} If database query fails or validation fails
 * 
 * Requirements: 8.1, 8.4
 */
const updateStatus = async (orderId, newStatus, userId, options = {}) => {
  try {
    // Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) throw fetchError;
    if (!order) throw new Error('Order not found');

    const previousStatus = order.status;

    // Validate status transition (basic validation)
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create status history record
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by: userId,
        change_reason: options.reason || null,
        notes: options.notes || null,
        metadata: options.metadata || {},
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error creating status history:', historyError);
      // Don't throw - status was updated successfully
    }

    // Emit WebSocket event for real-time updates
    try {
      // Get io instance from server
      const { getIOInstance } = require('./websocket-instance');
      const io = getIOInstance();
      
      if (io) {
        const { emitStatusUpdate } = require('../socket/order-tracking.handler');
        
        const eventData = {
          orderId,
          status: newStatus,
          previousStatus,
          timestamp: new Date().toISOString(),
          message: options.notes || `Order status updated to ${newStatus}`,
          changedBy: userId,
          notes: options.notes
        };
        
        emitStatusUpdate(io, orderId, eventData);
      }
    } catch (wsError) {
      console.error('Error emitting WebSocket event:', wsError);
      // Don't throw - status update was successful
    }

    // Create notification for customer on status change (Requirement 14.1)
    try {
      // Get customer ID from order
      const customerId = order.user_id;
      
      if (customerId) {
        // Determine notification title and message based on status
        let title = 'Order Status Updated';
        let message = `Your order status has been updated to ${newStatus}`;
        let priority = 'medium';
        
        // Customize message based on status
        switch (newStatus) {
          case 'confirmed':
            title = 'Order Confirmed';
            message = 'Your order has been confirmed and is being prepared for shipment.';
            priority = 'high';
            break;
          case 'processing':
            title = 'Order Processing';
            message = 'Your order is being processed and will be shipped soon.';
            break;
          case 'shipped':
            title = 'Order Shipped';
            message = 'Great news! Your order has been shipped and is on its way.';
            priority = 'high';
            break;
          case 'out_for_delivery':
            title = 'Out for Delivery';
            message = 'Your order is out for delivery and will arrive soon!';
            priority = 'high';
            break;
          case 'delivered':
            title = 'Order Delivered';
            message = 'Your order has been delivered. We hope you enjoy your purchase!';
            priority = 'high';
            break;
          case 'cancelled':
            title = 'Order Cancelled';
            message = 'Your order has been cancelled.';
            priority = 'high';
            break;
          case 'refunded':
            title = 'Order Refunded';
            message = 'Your order has been refunded. The amount will be credited to your account.';
            priority = 'high';
            break;
        }
        
        // Determine if email should be sent (Requirement 14.6)
        // Send email for major status changes: shipped, out_for_delivery, delivered
        const majorStatuses = ['shipped', 'out_for_delivery', 'delivered'];
        const channels = majorStatuses.includes(newStatus) ? ['in_app', 'email'] : ['in_app'];
        
        // Create notification
        await notificationService.createNotification({
          user_id: customerId,
          type: 'order_status_update',
          title,
          message,
          priority,
          metadata: {
            order_id: orderId,
            previous_status: previousStatus,
            new_status: newStatus,
            tracking_number: updatedOrder.tracking_number,
            carrier: updatedOrder.carrier
          },
          action_url: `/orders/${orderId}`,
          action_text: 'View Order',
          channels
        });
        
        console.log(`[OrderTracking] ✅ Created notification for customer ${customerId} - Order ${orderId} status: ${newStatus}`);
      }
    } catch (notificationError) {
      console.error('[OrderTracking] ⚠️ Failed to create notification (non-critical):', notificationError.message);
      // Don't throw - status update was successful
    }

    return updatedOrder;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Add tracking number and carrier information to an order
 * Emits WebSocket event for tracking updates
 * 
 * @param {String} orderId - Order UUID
 * @param {String} trackingNumber - Tracking number from carrier
 * @param {String} carrier - Carrier name (e.g., 'UPS', 'FedEx', 'USPS')
 * @param {String} userId - User ID adding the tracking info
 * @returns {Promise<Object>} Updated order object
 * @throws {Error} If database query fails or validation fails
 * 
 * Requirements: 7.4, 8.5
 */
const addTracking = async (orderId, trackingNumber, carrier, userId) => {
  try {
    // Validate inputs
    if (!trackingNumber || !carrier) {
      throw new Error('Tracking number and carrier are required');
    }

    // Update order with tracking information
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        tracking_number: trackingNumber,
        carrier: carrier,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;
    if (!updatedOrder) throw new Error('Order not found');

    // Add tracking info to status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        previous_status: updatedOrder.status,
        new_status: updatedOrder.status,
        changed_by: userId,
        notes: `Tracking information added: ${carrier} - ${trackingNumber}`,
        tracking_number: trackingNumber,
        carrier: carrier,
        metadata: { action: 'tracking_added' },
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error creating tracking history:', historyError);
      // Don't throw - tracking was added successfully
    }

    // Emit WebSocket event for tracking updates
    try {
      // Get io instance from server
      const { getIOInstance } = require('./websocket-instance');
      const io = getIOInstance();
      
      if (io) {
        const { emitTrackingUpdate } = require('../socket/order-tracking.handler');
        
        const eventData = {
          orderId,
          trackingNumber,
          carrier,
          timestamp: new Date().toISOString(),
          message: `Tracking information added: ${carrier} - ${trackingNumber}`
        };
        
        emitTrackingUpdate(io, orderId, eventData);
      }
    } catch (wsError) {
      console.error('Error emitting WebSocket tracking event:', wsError);
      // Don't throw - tracking update was successful
    }

    // Create notification for customer about tracking information
    try {
      // Get customer ID from order
      const customerId = updatedOrder.user_id;
      
      if (customerId) {
        await notificationService.createNotification({
          user_id: customerId,
          type: 'order_tracking_added',
          title: 'Tracking Information Available',
          message: `Tracking information has been added to your order. Carrier: ${carrier}, Tracking Number: ${trackingNumber}`,
          priority: 'medium',
          metadata: {
            order_id: orderId,
            tracking_number: trackingNumber,
            carrier: carrier
          },
          action_url: `/orders/${orderId}`,
          action_text: 'Track Order',
          channels: ['in_app']
        });
        
        console.log(`[OrderTracking] ✅ Created tracking notification for customer ${customerId} - Order ${orderId}`);
      }
    } catch (notificationError) {
      console.error('[OrderTracking] ⚠️ Failed to create tracking notification (non-critical):', notificationError.message);
      // Don't throw - tracking update was successful
    }

    return updatedOrder;
  } catch (error) {
    console.error('Error adding tracking information:', error);
    throw error;
  }
};

module.exports = {
  buildOrderTimeline,
  calculateEstimatedDelivery,
  getSubOrderTracking,
  updateStatus,
  addTracking
};
