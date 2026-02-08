/**
 * ORDER CONTROLLER
 * 
 * Handles HTTP requests for order operations.
 */

const orderService = require('../../services/orderServices/order.service');

/**
 * Create order from cart
 * POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const { paymentIntentId, shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Shipping address is required'
      });
    }

    const order = await orderService.createFromCart(req.user.id, {
      paymentIntentId,
      shippingAddress
    });

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    if (error.message.includes('Cart') || error.message.includes('validation')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get customer's orders
 * GET /api/orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    
    const orders = await orderService.findByUserId(req.user.id, {
      status,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    // Check if user owns this order (customers can only see their own orders)
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this order'
      });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 * POST /api/orders/:id/cancel
 */
const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user.id);

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('Unauthorized') || error.message.includes('Cannot cancel')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get invoice for order
 * GET /api/orders/:id/invoice
 */
const getInvoice = async (req, res, next) => {
  try {
    const order = await orderService.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view this invoice'
      });
    }

    const invoice = await orderService.generateInvoice(req.params.id);

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders (Admin only)
 * GET /api/admin/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, userId, limit, offset } = req.query;

    const orders = await orderService.findAll({
      status,
      userId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status (Admin only)
 * PATCH /api/admin/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Status is required'
      });
    }

    const validStatuses = [
      'pending_payment',
      'paid',
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await orderService.updateStatus(
      req.params.id,
      status,
      req.user.id
    );

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('Cannot transition')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get order statistics (Admin only)
 * GET /api/admin/orders/statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await orderService.getStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent orders (Admin only)
 * GET /api/admin/orders/recent
 */
const getRecentOrders = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const orders = await orderService.getRecent(limit ? parseInt(limit) : 10);
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getInvoice,
  getAllOrders,
  updateOrderStatus,
  getStatistics,
  getRecentOrders
};
