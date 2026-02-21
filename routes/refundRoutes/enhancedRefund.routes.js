const express = require('express');
const router = express.Router();
const enhancedRefundController = require('../../controllers/refundControllers/enhancedRefund.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole, requireAnyRole } = require('../../middlewares/role.middleware');

/**
 * Enhanced Refund Routes
 * Implements Requirements 5.1, 5.2, 5.10, 5.16, 5.20
 */

// Import the basic refund controller for calculate endpoint
const refundController = require('../../controllers/refundControllers/refund.controller');

// =====================================================
// PUBLIC ROUTES (Authenticated users)
// =====================================================

/**
 * @route   POST /api/refunds/calculate
 * @desc    Calculate refund amount for a product
 * @access  Customer
 * @implements Requirement 3.6
 */
router.post(
  '/calculate',
  authenticate,
  refundController.calculateRefundAmount
);

/**
 * @route   POST /api/refunds
 * @desc    Create refund request
 * @access  Customer
 * @implements Requirement 5.1
 */
router.post(
  '/',
  authenticate,
  requireRole('customer'),
  enhancedRefundController.createRefundRequest
);

/**
 * @route   GET /api/v1/refunds/:id
 * @desc    Get refund request by ID
 * @access  Customer (own), Seller (own), Manager, Admin
 */
router.get(
  '/:id',
  authenticate,
  enhancedRefundController.getRefundRequest
);

/**
 * @route   GET /api/v1/refunds
 * @desc    Get all refunds (filtered by role)
 * @access  Customer (own), Seller (own), Manager (all), Admin (all)
 * @implements Requirement 5.20
 */
router.get(
  '/',
  authenticate,
  enhancedRefundController.getAllRefunds
);

// =====================================================
// MANAGER ROUTES
// =====================================================

/**
 * @route   POST /api/v1/refunds/:id/process-partial
 * @desc    Process partial refund
 * @access  Manager, Admin
 * @implements Requirement 5.2
 */
router.post(
  '/:id/process-partial',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  enhancedRefundController.processPartialRefund
);

/**
 * @route   POST /api/v1/refunds/:id/process-full
 * @desc    Process full refund
 * @access  Manager, Admin
 * @implements Requirement 5.2
 */
router.post(
  '/:id/process-full',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  enhancedRefundController.processFullRefund
);

/**
 * @route   POST /api/v1/refunds/:id/reject
 * @desc    Reject refund request
 * @access  Manager, Admin
 */
router.post(
  '/:id/reject',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  enhancedRefundController.rejectRefund
);

/**
 * @route   GET /api/v1/refunds/analytics
 * @desc    Get refund analytics
 * @access  Manager, Admin
 * @implements Requirement 5.10
 */
router.get(
  '/analytics',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  enhancedRefundController.getRefundAnalytics
);

/**
 * @route   POST /api/v1/refunds/goodwill
 * @desc    Issue goodwill refund
 * @access  Manager, Admin
 * @implements Requirement 5.16
 */
router.post(
  '/goodwill',
  authenticate,
  requireAnyRole(['manager', 'admin']),
  enhancedRefundController.issueGoodwillRefund
);

module.exports = router;
