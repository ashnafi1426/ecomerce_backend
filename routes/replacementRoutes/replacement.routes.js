const express = require('express');
const router = express.Router();
const replacementController = require('../../controllers/replacementControllers/replacement.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

/**
 * Replacement Routes
 * Implements Requirements 4.1, 4.6, 4.7, 4.8, 4.16, 4.17
 */

/**
 * @route   POST /api/v1/replacements
 * @desc    Create replacement request
 * @access  Customer
 */
router.post(
  '/',
  authenticate,
  roleMiddleware.requireRole('customer'),
  replacementController.createReplacementRequest
);

/**
 * @route   GET /api/v1/replacements/my-requests
 * @desc    Get customer's replacement requests
 * @access  Customer
 * Implements Requirement 1.1
 */
router.get(
  '/my-requests',
  authenticate,
  roleMiddleware.requireRole('customer'),
  replacementController.getMyReplacementRequests
);

/**
 * @route   GET /api/v1/replacements/seller-requests
 * @desc    Get seller's replacement requests
 * @access  Seller
 * Implements Requirement 2.2
 */
router.get(
  '/seller-requests',
  authenticate,
  roleMiddleware.requireRole('seller'),
  replacementController.getSellerReplacementRequests
);

/**
 * @route   GET /api/v1/replacements/admin/all
 * @desc    Get all replacement requests (Admin)
 * @access  Admin
 * Implements Requirements 15.1, 15.3
 */
router.get(
  '/admin/all',
  authenticate,
  roleMiddleware.requireRole('admin'),
  replacementController.getAllReplacementRequestsAdmin
);

/**
 * @route   GET /api/v1/replacements/analytics
 * @desc    Get replacement analytics
 * @access  Manager
 */
router.get(
  '/analytics',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  replacementController.getReplacementAnalytics
);

/**
 * @route   GET /api/v1/replacements/customer
 * @desc    Get customer's replacement requests (standardized alias)
 * @access  Customer
 * Implements Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * Note: Alias for /my-requests to provide consistent RESTful naming
 */
router.get(
  '/customer',
  authenticate,
  roleMiddleware.requireRole('customer'),
  replacementController.getMyReplacementRequests
);

/**
 * @route   GET /api/v1/replacements/seller
 * @desc    Get seller's replacement requests (standardized alias)
 * @access  Seller
 * Implements Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 * Note: Alias for /seller-requests to provide consistent RESTful naming
 */
router.get(
  '/seller',
  authenticate,
  roleMiddleware.requireRole('seller'),
  replacementController.getSellerReplacementRequests
);

/**
 * @route   GET /api/v1/replacements
 * @desc    Get all replacement requests (filtered by role)
 * @access  Customer/Seller/Manager
 */
router.get(
  '/',
  authenticate,
  replacementController.getReplacementRequests
);

/**
 * @route   GET /api/v1/replacements/:id
 * @desc    Get replacement request by ID
 * @access  Customer/Seller/Manager
 */
router.get(
  '/:id',
  authenticate,
  replacementController.getReplacementRequest
);

/**
 * @route   PATCH /api/replacements/:id/approve
 * @desc    Approve replacement request (Seller)
 * @access  Seller
 * Implements Requirement 2.3
 */
router.patch(
  '/:id/approve',
  authenticate,
  roleMiddleware.requireRole('seller'),
  replacementController.approveReplacementBySeller
);

/**
 * @route   PATCH /api/replacements/:id/reject
 * @desc    Reject replacement request (Seller)
 * @access  Seller
 * Implements Requirement 2.4
 */
router.patch(
  '/:id/reject',
  authenticate,
  roleMiddleware.requireRole('seller'),
  replacementController.rejectReplacementBySeller
);

/**
 * @route   PUT /api/v1/replacements/:id/approve
 * @desc    Approve replacement request
 * @access  Manager
 */
router.put(
  '/:id/approve',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  replacementController.approveReplacement
);

/**
 * @route   PUT /api/v1/replacements/:id/reject
 * @desc    Reject replacement request
 * @access  Manager
 */
router.put(
  '/:id/reject',
  authenticate,
  roleMiddleware.requireAnyRole(['manager', 'admin']),
  replacementController.rejectReplacement
);

/**
 * @route   PUT /api/v1/replacements/:id/shipment
 * @desc    Update replacement shipment tracking
 * @access  Seller
 */
router.put(
  '/:id/shipment',
  authenticate,
  roleMiddleware.requireRole('seller'),
  replacementController.updateReplacementShipment
);

/**
 * @route   PUT /api/v1/replacements/:id/return-tracking
 * @desc    Update return tracking number
 * @access  Customer
 */
router.put(
  '/:id/return-tracking',
  authenticate,
  roleMiddleware.requireRole('customer'),
  replacementController.updateReturnTracking
);

/**
 * @route   PUT /api/v1/replacements/:id/confirm-return
 * @desc    Confirm return received
 * @access  Seller
 */
router.put(
  '/:id/confirm-return',
  authenticate,
  roleMiddleware.requireRole('seller'),
  replacementController.confirmReturnReceived
);

module.exports = router;
