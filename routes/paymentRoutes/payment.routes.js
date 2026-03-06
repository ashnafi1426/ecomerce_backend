const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');
const paymentController = require('../../controllers/paymentControllers/payment.controller.js');

// ============================================
// CUSTOMER/GUEST PAYMENT ROUTES
// ============================================

// Create payment intent (can be guest or authenticated)
router.post('/create-intent', optionalAuthenticate, paymentController.createPaymentIntent);

// Create order after payment success (no webhooks)
router.post('/create-order', optionalAuthenticate, paymentController.createOrderAfterPayment);

// ============================================
// ADMIN PAYMENT ROUTES (must come BEFORE parameterized routes)
// ============================================

// Get all payments (admin only)
router.get('/admin/payments', authenticate, requireAdmin, paymentController.getAllPayments);

// Get payment statistics (admin only)
router.get('/admin/payments/statistics', authenticate, requireAdmin, paymentController.getPaymentStatistics);

// Process refund (admin only)
router.post('/admin/payments/:id/refund', authenticate, requireAdmin, paymentController.processRefund);

// ============================================
// PARAMETERIZED ROUTES (must come AFTER static routes)
// ============================================

// Get payment status
router.get('/:paymentIntentId', paymentController.getPaymentStatus);

// Cancel payment (requires authentication)
router.post('/:paymentIntentId/cancel', authenticate, paymentController.cancelPayment);

module.exports = router;
