/**
 * ADMIN ROUTES
 * 
 * Routes for admin-only operations (product management, order management, etc.).
 * All routes require authentication and admin role.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminControllers/admin.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// All admin routes require authentication and admin role
// Dashboard
router.get('/api/admin/dashboard', authenticate, requireAdmin, adminController.getDashboard);

// Product Management
router.post('/api/admin/products', authenticate, requireAdmin, adminController.createProduct);
router.put('/api/admin/products/:id', authenticate, requireAdmin, adminController.updateProduct);
router.delete('/api/admin/products/:id', authenticate, requireAdmin, adminController.deleteProduct);
router.put('/api/admin/products/:id/inventory', authenticate, requireAdmin, adminController.updateInventory);
router.get('/api/admin/products/low-stock', authenticate, requireAdmin, adminController.getLowStockProducts);

// Order Management
router.get('/api/admin/orders', authenticate, requireAdmin, adminController.getAllOrders);
router.put('/api/admin/orders/:id/status', authenticate, requireAdmin, adminController.updateOrderStatus);
router.get('/api/admin/orders/statistics', authenticate, requireAdmin, adminController.getOrderStatistics);

// User Management
router.get('/api/admin/users', authenticate, requireAdmin, adminController.getAllUsers);
router.put('/api/admin/users/:id/status', authenticate, requireAdmin, adminController.updateUserStatus);

// Payment Management
router.get('/api/admin/payments', authenticate, requireAdmin, adminController.getAllPayments);
router.post('/api/admin/payments/:id/refund', authenticate, requireAdmin, adminController.processRefund);
router.get('/api/admin/payments/statistics', authenticate, requireAdmin, adminController.getPaymentStatistics);

module.exports = router;
