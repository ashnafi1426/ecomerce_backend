const express = require('express');
const router = express.Router();
const replacementController = require('../../controllers/replacementControllers/replacement.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
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
  authMiddleware.protect,
  roleMiddleware.checkRole(['customer']),
  replacementController.createReplacementRequest
);

/**
 * @route   GET /api/v1/replacements
 * @desc    Get all replacement requests (filtered by role)
 * @access  Customer/Seller/Manager
 */
router.get(
  '/',
  authMiddleware.protect,
  replacementController.getReplacementRequests
);

/**
 * @route   GET /api/v1/replacements/analytics
 * @desc    Get replacement analytics
 * @access  Manager
 */
router.get(
  '/analytics',
  authMiddleware.protect,
  roleMiddleware.checkRole(['manager', 'admin']),
  replacementController.getReplacementAnalytics
);

/**
 * @route   GET /api/v1/replacements/:id
 * @desc    Get replacement request by ID
 * @access  Customer/Seller/Manager
 */
router.get(
  '/:id',
  authMiddleware.protect,
  replacementController.getReplacementRequest
);

/**
 * @route   PUT /api/v1/replacements/:id/approve
 * @desc    Approve replacement request
 * @access  Manager
 */
router.put(
  '/:id/approve',
  authMiddleware.protect,
  roleMiddleware.checkRole(['manager', 'admin']),
  replacementController.approveReplacement
);

/**
 * @route   PUT /api/v1/replacements/:id/reject
 * @desc    Reject replacement request
 * @access  Manager
 */
router.put(
  '/:id/reject',
  authMiddleware.protect,
  roleMiddleware.checkRole(['manager', 'admin']),
  replacementController.rejectReplacement
);

/**
 * @route   PUT /api/v1/replacements/:id/shipment
 * @desc    Update replacement shipment tracking
 * @access  Seller
 */
router.put(
  '/:id/shipment',
  authMiddleware.protect,
  roleMiddleware.checkRole(['seller']),
  replacementController.updateReplacementShipment
);

/**
 * @route   PUT /api/v1/replacements/:id/return-tracking
 * @desc    Update return tracking number
 * @access  Customer
 */
router.put(
  '/:id/return-tracking',
  authMiddleware.protect,
  roleMiddleware.checkRole(['customer']),
  replacementController.updateReturnTracking
);

/**
 * @route   PUT /api/v1/replacements/:id/confirm-return
 * @desc    Confirm return received
 * @access  Seller
 */
router.put(
  '/:id/confirm-return',
  authMiddleware.protect,
  roleMiddleware.checkRole(['seller']),
  replacementController.confirmReturnReceived
);

module.exports = router;
