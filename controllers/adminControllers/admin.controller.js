/**
 * ADMIN CONTROLLER
 * 
 * Handles admin-only operations (product management, order management, etc.).
 */

const productService = require('../../services/productServices/product.service');
const orderService = require('../../services/orderServices/order.service');
const userService = require('../../services/userServices/user.service');
const paymentService = require('../../services/paymentServices/payment.service');
const { createRefund } = require('../../config/stripe');

// ============================================
// PRODUCT MANAGEMENT
// ============================================

/**
 * Create new product
 * POST /api/admin/products
 */
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, imageUrl, categoryId, initialQuantity, lowStockThreshold } = req.body;

    // Validation
    if (!title || !price) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Title and price are required' 
      });
    }

    if (price < 0) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Price must be non-negative' 
      });
    }

    const product = await productService.create({
      title,
      description,
      price,
      imageUrl,
      categoryId,
      initialQuantity: initialQuantity || 0,
      lowStockThreshold: lowStockThreshold || 10,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product
 * PUT /api/admin/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await productService.update(id, updates);

    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    await productService.deleteProduct(id);

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product inventory
 * PUT /api/admin/products/:id/inventory
 */
const updateInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Valid quantity is required' 
      });
    }

    const inventory = await productService.updateInventory(id, quantity);

    res.json({
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products
 * GET /api/admin/products/low-stock
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await productService.getLowStock();

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * Get all orders
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

    res.json({
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * PUT /api/admin/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending_payment', 'paid', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid status' 
      });
    }

    const order = await orderService.updateStatus(id, status, req.user.id);

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 * GET /api/admin/orders/statistics
 */
const getOrderStatistics = async (req, res, next) => {
  try {
    const stats = await orderService.getStatistics();

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get all users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, limit, offset } = req.query;

    const users = await userService.findAll({
      role,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status
 * PUT /api/admin/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'blocked', 'deleted'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Invalid status' 
      });
    }

    const user = await userService.updateStatus(id, status);

    res.json({
      message: 'User status updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PAYMENT MANAGEMENT
// ============================================

/**
 * Get all payments
 * GET /api/admin/payments
 */
const getAllPayments = async (req, res, next) => {
  try {
    const { status, userId, limit, offset } = req.query;

    const payments = await paymentService.findAll({
      status,
      userId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      count: payments.length,
      payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund
 * POST /api/admin/payments/:id/refund
 */
const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const payment = await paymentService.findById(id);

    if (!payment) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Payment not found' 
      });
    }

    if (payment.status !== 'succeeded') {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Can only refund successful payments' 
      });
    }

    // Create refund in Stripe
    await createRefund(payment.payment_intent_id, amount);

    // Update payment status
    await paymentService.updateStatus(id, 'refunded');

    // Update order status
    await orderService.updateStatus(payment.order_id, 'cancelled');

    res.json({
      message: 'Refund processed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment statistics
 * GET /api/admin/payments/statistics
 */
const getPaymentStatistics = async (req, res, next) => {
  try {
    const stats = await paymentService.getStatistics();

    res.json(stats);
  } catch (error) {
    next(error);
  }
};

// ============================================
// DASHBOARD
// ============================================

/**
 * Get dashboard overview
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const [orderStats, paymentStats, recentOrders, lowStockProducts] = await Promise.all([
      orderService.getStatistics(),
      paymentService.getStatistics(),
      orderService.getRecent(5),
      productService.getLowStock()
    ]);

    res.json({
      orders: orderStats,
      payments: paymentStats,
      recentOrders,
      lowStockProducts: lowStockProducts.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Products
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  getLowStockProducts,
  
  // Orders
  getAllOrders,
  updateOrderStatus,
  getOrderStatistics,
  
  // Users
  getAllUsers,
  updateUserStatus,
  
  // Payments
  getAllPayments,
  processRefund,
  getPaymentStatistics,
  
  // Dashboard
  getDashboard
};

