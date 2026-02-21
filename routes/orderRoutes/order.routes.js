/**
 * ORDER ROUTES
 * 
 * Routes for order creation and management.
 * Includes order tracking endpoints for enhanced order visibility.
 */

const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/orderControllers/order.controller');
const orderTrackingController = require('../../controllers/orderTrackingControllers/orderTracking.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireCustomer, requireAdmin, requireAnyRole } = require('../../middlewares/role.middleware');

// ============================================
// CUSTOMER ROUTES
// ============================================

// Create order from cart
router.post('/orders', authenticate, requireCustomer, orderController.createOrder);

// Get customer's orders with filters (enhanced with order tracking)
// Query params: status, search, page, limit
// Requirements: 9.1, 9.3, 9.4
router.get('/orders', authenticate, requireAnyRole(['customer', 'admin']), orderTrackingController.getOrdersWithFilters);

// Get order by ID (enhanced with timeline and tracking info)
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7
router.get('/orders/:id', authenticate, requireAnyRole(['customer', 'seller', 'admin']), orderTrackingController.getOrderDetails);

// Get order timeline
// Requirements: 7.2
router.get('/orders/:id/timeline', authenticate, requireAnyRole(['customer', 'seller', 'admin']), orderTrackingController.getOrderTimeline);

// Cancel order
router.post('/orders/:id/cancel', authenticate, requireCustomer, orderController.cancelOrder);

// Get invoice
router.get('/orders/:id/invoice', authenticate, orderController.getInvoice);

// Get order refund history
router.get('/orders/:id/refunds', authenticate, orderController.getOrderRefunds);

// Get order with refund details
router.get('/orders/:id/with-refunds', authenticate, orderController.getOrderWithRefunds);

// Check refund eligibility
router.get('/orders/:id/refund-eligibility', authenticate, orderController.checkRefundEligibility);

// ============================================
// SELLER/ADMIN ROUTES - Order Management
// ============================================

// Update order status
// Requirements: 8.1, 8.4
router.patch('/orders/:id/status', authenticate, requireAnyRole(['seller', 'admin']), orderTrackingController.updateOrderStatus);

// Add tracking information
// Requirements: 7.4, 8.5
router.patch('/orders/:id/tracking', authenticate, requireAnyRole(['seller', 'admin']), orderTrackingController.addTrackingInfo);

// NOTE: Admin order routes are now in adminRoutes/admin.routes.js
// This prevents route conflicts and keeps admin routes centralized

module.exports = router;
