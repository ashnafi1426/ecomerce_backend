/**
 * ORDER TRACKING WEBSOCKET HANDLER
 * 
 * Handles WebSocket connections for real-time order tracking updates.
 * Provides authentication, order ownership verification, and event emission
 * for status updates and tracking information changes.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

const supabase = require('../config/supabase');
const { createAuthenticationMiddleware } = require('./socket.config');

// Store active connections by order ID
// Structure: { orderId: Set<socketId> }
const orderConnections = new Map();

// Store connection timeouts
// Structure: { socketId: timeoutId }
const connectionTimeouts = new Map();

// Connection timeout duration (1 hour of inactivity)
const CONNECTION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

/**
 * Initialize order tracking WebSocket handlers
 * Sets up event listeners for order tracking connections
 * 
 * @param {Object} io - Socket.IO server instance
 * Requirements: 8.2
 */
function initializeOrderTrackingHandlers(io) {
  // Create a namespace for order tracking
  const orderTrackingNamespace = io.of('/order-tracking');

  // Apply authentication middleware to the namespace
  orderTrackingNamespace.use(createAuthenticationMiddleware());

  orderTrackingNamespace.on('connection', async (socket) => {
    // Connection logging removed to prevent console spam

    // Handle order subscription
    socket.on('subscribe_order', async (data) => {
      try {
        const { orderId } = data;

        if (!orderId) {
          socket.emit('error', {
            type: 'validation_error',
            message: 'Order ID is required'
          });
          return;
        }

        // Verify order ownership
        const hasAccess = await verifyOrderOwnership(orderId, socket.userId, socket.userRole);

        if (!hasAccess) {
          socket.emit('error', {
            type: 'authorization_error',
            message: 'You do not have permission to track this order'
          });
          return;
        }

        // Join the order room
        socket.join(`order:${orderId}`);

        // Track this connection
        if (!orderConnections.has(orderId)) {
          orderConnections.set(orderId, new Set());
        }
        orderConnections.get(orderId).add(socket.id);

        // Set up inactivity timeout
        resetConnectionTimeout(socket.id);

        // Subscription logging removed to prevent console spam

        // Send confirmation
        socket.emit('subscribed', {
          orderId,
          timestamp: new Date().toISOString(),
          message: 'Successfully subscribed to order updates'
        });

        // Send current order status
        const orderStatus = await getCurrentOrderStatus(orderId);
        if (orderStatus) {
          socket.emit('initial_status', orderStatus);
        }
      } catch (error) {
        console.error('[Order Tracking] Error subscribing to order:', error);
        socket.emit('error', {
          type: 'subscription_error',
          message: 'Failed to subscribe to order updates'
        });
      }
    });

    // Handle order unsubscription
    socket.on('unsubscribe_order', (data) => {
      try {
        const { orderId } = data;

        if (!orderId) {
          return;
        }

        // Leave the order room
        socket.leave(`order:${orderId}`);

        // Remove from tracking
        if (orderConnections.has(orderId)) {
          orderConnections.get(orderId).delete(socket.id);
          if (orderConnections.get(orderId).size === 0) {
            orderConnections.delete(orderId);
          }
        }

        // Unsubscription logging removed to prevent console spam

        socket.emit('unsubscribed', {
          orderId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[Order Tracking] Error unsubscribing from order:', error);
      }
    });

    // Handle ping to reset timeout
    socket.on('ping', () => {
      resetConnectionTimeout(socket.id);
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Disconnection logging removed to prevent console spam

      // Clear timeout
      clearConnectionTimeout(socket.id);

      // Remove from all order rooms
      for (const [orderId, sockets] of orderConnections.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            orderConnections.delete(orderId);
          }
        }
      }
    });
  });

  console.log('[Order Tracking] WebSocket handlers initialized');
  return orderTrackingNamespace;
}

/**
 * Verify that a user has permission to track an order
 * Checks if user is the customer who placed the order, the seller fulfilling it, or an admin
 * 
 * @param {String} orderId - Order UUID
 * @param {String} userId - User UUID
 * @param {String} userRole - User role (customer, seller, admin)
 * @returns {Promise<Boolean>} True if user has access, false otherwise
 * Requirements: 8.3
 */
async function verifyOrderOwnership(orderId, userId, userRole) {
  try {
    // Admins can access all orders
    if (userRole === 'admin') {
      return true;
    }

    // Fetch order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('[Order Tracking] Order not found:', orderId);
      return false;
    }

    // Check if user is the customer who placed the order
    if (order.user_id === userId) {
      return true;
    }

    // Check if user is a seller for this order (check sub_orders)
    if (userRole === 'seller') {
      const { data: subOrders, error: subOrderError } = await supabase
        .from('sub_orders')
        .select('id')
        .eq('order_id', orderId)
        .eq('seller_id', userId)
        .limit(1);

      if (!subOrderError && subOrders && subOrders.length > 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('[Order Tracking] Error verifying order ownership:', error);
    return false;
  }
}

/**
 * Get current order status and tracking information
 * 
 * @param {String} orderId - Order UUID
 * @returns {Promise<Object|null>} Order status object or null
 */
async function getCurrentOrderStatus(orderId) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, tracking_number, carrier, created_at, updated_at')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return null;
    }

    return {
      orderId: order.id,
      status: order.status,
      trackingNumber: order.tracking_number,
      carrier: order.carrier,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Order Tracking] Error getting current order status:', error);
    return null;
  }
}

/**
 * Reset connection timeout for a socket
 * Clears existing timeout and sets a new one
 * 
 * @param {String} socketId - Socket ID
 * Requirements: 8.6
 */
function resetConnectionTimeout(socketId) {
  // Clear existing timeout
  clearConnectionTimeout(socketId);

  // Set new timeout
  const timeoutId = setTimeout(() => {
    console.log(`[Order Tracking] Connection timeout for socket ${socketId}`);
    // The socket will be disconnected by Socket.IO's built-in timeout mechanism
    // We just need to clean up our tracking
    clearConnectionTimeout(socketId);
  }, CONNECTION_TIMEOUT_MS);

  connectionTimeouts.set(socketId, timeoutId);
}

/**
 * Clear connection timeout for a socket
 * 
 * @param {String} socketId - Socket ID
 */
function clearConnectionTimeout(socketId) {
  const timeoutId = connectionTimeouts.get(socketId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    connectionTimeouts.delete(socketId);
  }
}

/**
 * Emit status update event to all clients subscribed to an order
 * Called when order status changes
 * 
 * @param {Object} io - Socket.IO server instance
 * @param {String} orderId - Order UUID
 * @param {Object} statusUpdate - Status update data
 * Requirements: 8.1, 8.4
 */
function emitStatusUpdate(io, orderId, statusUpdate) {
  try {
    const orderTrackingNamespace = io.of('/order-tracking');
    
    const eventData = {
      orderId,
      status: statusUpdate.status,
      previousStatus: statusUpdate.previousStatus,
      timestamp: statusUpdate.timestamp || new Date().toISOString(),
      message: statusUpdate.message || `Order status updated to ${statusUpdate.status}`,
      changedBy: statusUpdate.changedBy,
      notes: statusUpdate.notes
    };

    // Emit to all clients in the order room
    orderTrackingNamespace.to(`order:${orderId}`).emit('status_update', eventData);

    console.log(`[Order Tracking] Status update emitted for order ${orderId}:`, eventData.status);
  } catch (error) {
    console.error('[Order Tracking] Error emitting status update:', error);
  }
}

/**
 * Emit tracking update event to all clients subscribed to an order
 * Called when tracking number is added or updated
 * 
 * @param {Object} io - Socket.IO server instance
 * @param {String} orderId - Order UUID
 * @param {Object} trackingUpdate - Tracking update data
 * Requirements: 8.5
 */
function emitTrackingUpdate(io, orderId, trackingUpdate) {
  try {
    const orderTrackingNamespace = io.of('/order-tracking');
    
    const eventData = {
      orderId,
      trackingNumber: trackingUpdate.trackingNumber,
      carrier: trackingUpdate.carrier,
      timestamp: trackingUpdate.timestamp || new Date().toISOString(),
      message: trackingUpdate.message || `Tracking information added: ${trackingUpdate.carrier} - ${trackingUpdate.trackingNumber}`
    };

    // Emit to all clients in the order room
    orderTrackingNamespace.to(`order:${orderId}`).emit('tracking_update', eventData);

    console.log(`[Order Tracking] Tracking update emitted for order ${orderId}`);
  } catch (error) {
    console.error('[Order Tracking] Error emitting tracking update:', error);
  }
}

/**
 * Get connection statistics
 * Returns information about active connections
 * 
 * @returns {Object} Connection statistics
 */
function getConnectionStats() {
  const stats = {
    totalOrders: orderConnections.size,
    totalConnections: 0,
    orders: []
  };

  for (const [orderId, sockets] of orderConnections.entries()) {
    stats.totalConnections += sockets.size;
    stats.orders.push({
      orderId,
      connections: sockets.size
    });
  }

  return stats;
}

module.exports = {
  initializeOrderTrackingHandlers,
  verifyOrderOwnership,
  emitStatusUpdate,
  emitTrackingUpdate,
  getConnectionStats
};
