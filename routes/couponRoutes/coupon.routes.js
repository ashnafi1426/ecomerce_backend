const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/couponControllers/coupon.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

/**
 * Coupon Routes
 * Implements Requirements 2.1, 2.7, 2.11, 2.17
 */

// Public routes (require authentication)
router.use(authMiddleware.protect);

/**
 * @route   POST /api/v1/coupons/validate
 * @desc    Validate a coupon code
 * @access  Customer
 */
router.post('/validate', couponController.validateCoupon);

/**
 * @route   POST /api/v1/coupons/apply
 * @desc    Apply a coupon to an order
 * @access  Customer
 */
router.post('/apply', couponController.applyCoupon);

/**
 * @route   GET /api/v1/coupons/active
 * @desc    Get all active coupons
 * @access  Customer
 */
router.get('/active', couponController.getActiveCoupons);

/**
 * @route   GET /api/v1/coupons/available
 * @desc    Get available coupons for current user
 * @access  Customer
 */
router.get('/available', couponController.getUserAvailableCoupons);

/**
 * @route   GET /api/v1/coupons/code/:code
 * @desc    Get coupon by code
 * @access  Customer
 */
router.get('/code/:code', couponController.getCouponByCode);

// Manager-only routes
/**
 * @route   POST /api/v1/coupons
 * @desc    Create a new coupon
 * @access  Manager
 */
router.post(
  '/',
  roleMiddleware.checkRole(['manager', 'admin']),
  couponController.createCoupon
);

/**
 * @route   GET /api/v1/coupons
 * @desc    Get all coupons (paginated)
 * @access  Manager
 */
router.get(
  '/',
  roleMiddleware.checkRole(['manager', 'admin']),
  couponController.getAllCoupons
);

/**
 * @route   GET /api/v1/coupons/analytics
 * @desc    Get overall coupon analytics
 * @access  Manager
 */
router.get(
  '/analytics',
  roleMiddleware.checkRole(['manager', 'admin']),
  couponController.getOverallCouponAnalytics
);

/**
 * @route   GET /api/v1/coupons/:id
 * @desc    Get coupon by ID
 * @access  Manager
 */
router.get(
  '/:id',
  roleMiddleware.checkRole(['manager', 'admin']),
  couponController.getCouponById
);

/**
 * @route   GET /api/v1/coupons/:id/analytics
 * @desc    Get coupon analytics
 * @access  Manager
 */
router.get(
  '/:id/analytics',
  roleMiddleware.checkRole(['manager', 'admin']),
  couponController.getCouponAnalytics
);

/**
 * @route   PUT /api/v1/coupons/:id
 * @desc    Update a coupon
 * @access  Manager
 */
router.put(
  '/:id',
  roleMiddleware.checkRole(['manager', 'admin']),
  couponController.updateCoupon
);

/**
 * @route   PUT /api/v1/coupons/:id/deactivate
 * @desc    Deactivate a coupon
 * @access  Manager
 */
router.put(
  '/:id/deactivate',
  roleMiddleware.checkRole(['manager', 'admin']),
  couponController.deactivateCoupon
);

/**
 * @route   DELETE /api/v1/coupons/:id
 * @desc    Delete a coupon
 * @access  Manager
 */
router.delete(
  '/:id',
  roleMiddleware.checkRole(['manager', 'admin']),
  couponController.deleteCoupon
);

module.exports = router;
