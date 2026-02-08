
const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/paymentControllers/payment.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { requireCustomer, requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// WEBHOOK ROUTE (Must be BEFORE other routes - uses raw body)
// ============================================

// Stripe webhook endpoint (No authentication - Stripe signature verification)
// Note: This route needs raw body, handled in app.js
router.post('/api/payments/webhook', paymentController.handleWebhook);

// ============================================
// CUSTOMER ROUTES
// ============================================

// Create payment intent for order
router.post('/api/payments/create-intent', authenticate, requireCustomer, paymentController.createPaymentIntent);

// Get payment by order ID
router.get('/api/payments/order/:orderId', authenticate, requireCustomer, paymentController.getPaymentByOrder);

// Get payment by ID
router.get('/api/payments/:id', authenticate, paymentController.getPaymentById);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all payments
router.get('/api/admin/payments', authenticate, requireAdmin, paymentController.getAllPayments);

// Get payment statistics
router.get('/api/admin/payments/statistics', authenticate, requireAdmin, paymentController.getStatistics);

// Process refund
router.post('/api/admin/payments/:id/refund', authenticate, requireAdmin, paymentController.processRefund);

// Sync payment status manually
router.post('/api/admin/payments/:paymentIntentId/sync', authenticate, requireAdmin, paymentController.syncPaymentStatus);

module.exports = router;
