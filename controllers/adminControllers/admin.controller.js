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
 * Get all products
 * GET /api/admin/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { status, category, limit, offset } = req.query;

    const products = await productService.findAll({
      status,
      category,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending products for approval
 * GET /api/admin/products/pending
 */
const getPendingProducts = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!seller_id(id, email)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      count: products?.length || 0,
      data: products || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve product
 * POST /api/admin/products/:id/approve
 */
const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const supabase = require('../../config/supabase');

    const { data: product, error } = await supabase
      .from('products')
      .update({
        approval_status: 'approved',
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: req.user.id,
        approval_comments: comments
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Product approved successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject product
 * POST /api/admin/products/:id/reject
 */
const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const supabase = require('../../config/supabase');

    const { data: product, error } = await supabase
      .from('products')
      .update({
        approval_status: 'rejected',
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: req.user.id,
        rejection_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Product rejected',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

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
    // Fetch all data with individual error handling
    let orderStats = { total: 0, pending: 0, completed: 0, cancelled: 0 };
    let paymentStats = { totalRevenue: 0, successfulPayments: 0, pendingPayments: 0 };
    let recentOrders = [];
    let lowStockProducts = [];
    let pendingApprovals = [];
    let recentActivity = [];

    try {
      orderStats = await orderService.getStatistics();
    } catch (err) {
      console.error('Error fetching order stats:', err.message);
    }

    try {
      paymentStats = await paymentService.getStatistics();
    } catch (err) {
      console.error('Error fetching payment stats:', err.message);
    }

    try {
      recentOrders = await orderService.getRecent(5);
    } catch (err) {
      console.error('Error fetching recent orders:', err.message);
    }

    try {
      lowStockProducts = await productService.getLowStock();
      lowStockProducts = lowStockProducts.slice(0, 5);
    } catch (err) {
      console.error('Error fetching low stock products:', err.message);
    }

    // Calculate dashboard stats
    const stats = {
      totalRevenue: paymentStats.totalRevenue || 0,
      totalOrders: orderStats.total || 0,
      activeSellers: 0, // TODO: Implement seller count
      totalCustomers: 0 // TODO: Implement customer count
    };

    res.json({
      success: true,
      stats,
      pendingApprovals,
      recentActivity,
      orders: orderStats,
      payments: paymentStats,
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    next(error);
  }
};

// ============================================
// SELLER MANAGEMENT
// ============================================

/**
 * Get all sellers
 * GET /api/admin/sellers
 */
const getAllSellers = async (req, res, next) => {
  try {
    req.query.role = 'seller';
    return getAllUsers(req, res, next);
  } catch (error) {
    next(error);
  }
};

// ============================================
// MANAGER MANAGEMENT
// ============================================

/**
 * Get all managers
 * GET /api/admin/managers
 */
const getAllManagers = async (req, res, next) => {
  try {
    req.query.role = 'manager';
    return getAllUsers(req, res, next);
  } catch (error) {
    next(error);
  }
};

// ============================================
// CUSTOMER MANAGEMENT
// ============================================

/**
 * Get all customers
 * GET /api/admin/customers
 */
const getAllCustomers = async (req, res, next) => {
  try {
    req.query.role = 'customer';
    return getAllUsers(req, res, next);
  } catch (error) {
    next(error);
  }
};

// ============================================
// CATEGORY MANAGEMENT
// ============================================

/**
 * Get all categories
 * GET /api/admin/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    res.json({
      success: true,
      count: categories?.length || 0,
      data: categories || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create category
 * POST /api/admin/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, parent_id } = req.body;
    const supabase = require('../../config/supabase');

    const { data: category, error } = await supabase
      .from('categories')
      .insert([{ name, description, parent_id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * PUT /api/admin/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const supabase = require('../../config/supabase');

    const { data: category, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * DELETE /api/admin/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supabase = require('../../config/supabase');

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// AUDIT LOGS
// ============================================

/**
 * Get audit logs
 * GET /api/admin/logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { limit = 50, offset = 0 } = req.query;

    try {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json({
        success: true,
        count: logs?.length || 0,
        data: logs || []
      });
    } catch (dbError) {
      // If table doesn't exist, return empty array
      console.log('Audit logs table not found, returning empty array');
      res.json({
        success: true,
        count: 0,
        data: [],
        message: 'Audit logs table not yet created'
      });
    }
  } catch (error) {
    next(error);
  }
};

// ============================================
// REFUND MANAGEMENT
// ============================================

/**
 * Get all refunds
 * GET /api/admin/refunds
 */
const getAllRefunds = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    const { status } = req.query;

    let query = supabase
      .from('returns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: refunds, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: refunds?.length || 0,
      data: refunds || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve refund
 * POST /api/admin/refunds/:id/approve
 */
const approveRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supabase = require('../../config/supabase');

    const { data: refund, error } = await supabase
      .from('returns')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: req.user.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Refund approved successfully',
      data: refund
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject refund
 * POST /api/admin/refunds/:id/reject
 */
const rejectRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const supabase = require('../../config/supabase');

    const { data: refund, error } = await supabase
      .from('returns')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: req.user.id,
        rejection_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Refund rejected',
      data: refund
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// REVENUE ANALYTICS
// ============================================

/**
 * Get revenue analytics
 * GET /api/admin/revenue
 */
const getRevenueAnalytics = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    
    // Get total revenue from orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('amount, created_at, status')
      .in('status', ['completed', 'delivered']);
    
    if (error) throw error;
    
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        period: req.query.period || 'all-time'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get system settings
 * GET /api/admin/settings
 */
const getSettings = async (req, res, next) => {
  try {
    const supabase = require('../../config/supabase');
    
    try {
      const { data: settings, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      
      res.json({
        success: true,
        data: settings || []
      });
    } catch (dbError) {
      // If table doesn't exist, return empty array
      console.log('Settings table not found, returning empty array');
      res.json({
        success: true,
        data: [],
        message: 'Settings table not yet created'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update system settings
 * PUT /api/admin/settings
 */
const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;
    const supabase = require('../../config/supabase');
    
    // Update settings one by one
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ key, value: JSON.stringify(value) })
        .select()
        .single();
      
      if (error) throw error;
      results.push(data);
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Products
  getAllProducts,
  getPendingProducts,
  approveProduct,
  rejectProduct,
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
  getAllSellers,
  getAllManagers,
  getAllCustomers,
  
  // Categories
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Audit Logs
  getAuditLogs,
  
  // Refunds
  getAllRefunds,
  approveRefund,
  rejectRefund,
  
  // Payments
  getAllPayments,
  processRefund,
  getPaymentStatistics,
  
  // Revenue
  getRevenueAnalytics,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Dashboard
  getDashboard
};

