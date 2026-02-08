const express = require('express');
const router = express.Router();
const promotionController = require('../../controllers/promotionControllers/promotion.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

/**
 * Promotion Routes
 * Implements Requirements 2.11, 2.12
 */

// Public routes (require authentication)
router.use(authMiddleware.protect);

/**
 * @route   GET /api/v1/promotions/active
 * @desc    Get active promotions for a product/variant
 * @access  Public (authenticated)
 * @query   productId or variantId
 */
router.get('/active', promotionController.getActivePromotions);

/**
 * @route   GET /api/v1/promotions/price
 * @desc    Get promotional price for a product/variant
 * @access  Public (authenticated)
 * @query   productId or variantId, originalPrice
 */
router.get('/price', promotionController.getPromotionalPrice);

/**
 * @route   GET /api/v1/promotions/products-with-promotions
 * @desc    Get products with active promotions
 * @access  Public (authenticated)
 */
router.get('/products-with-promotions', promotionController.getProductsWithPromotions);

/**
 * @route   GET /api/v1/promotions/product/:productId
 * @desc    Get all promotions for a product
 * @access  Public (authenticated)
 */
router.get('/product/:productId', promotionController.getPromotionsByProduct);

// Manager-only routes
/**
 * @route   POST /api/v1/promotions
 * @desc    Create a new promotion
 * @access  Manager
 */
router.post(
  '/',
  roleMiddleware.checkRole(['manager', 'admin']),
  promotionController.createPromotion
);

/**
 * @route   POST /api/v1/promotions/bulk
 * @desc    Bulk create promotions
 * @access  Manager
 */
router.post(
  '/bulk',
  roleMiddleware.checkRole(['manager', 'admin']),
  promotionController.bulkCreatePromotions
);

/**
 * @route   POST /api/v1/promotions/process-scheduled
 * @desc    Process scheduled promotions (activate/deactivate)
 * @access  Manager
 */
router.post(
  '/process-scheduled',
  roleMiddleware.checkRole(['manager', 'admin']),
  promotionController.processScheduledPromotions
);

/**
 * @route   GET /api/v1/promotions
 * @desc    Get all promotions (paginated)
 * @access  Manager
 */
router.get(
  '/',
  roleMiddleware.checkRole(['manager', 'admin']),
  promotionController.getAllPromotions
);

/**
 * @route   GET /api/v1/promotions/:id
 * @desc    Get promotion by ID
 * @access  Manager
 */
router.get(
  '/:id',
  roleMiddleware.checkRole(['manager', 'admin']),
  promotionController.getPromotionById
);

/**
 * @route   GET /api/v1/promotions/:id/analytics
 * @desc    Get promotion analytics
 * @access  Manager
 */
router.get(
  '/:id/analytics',
  roleMiddleware.checkRole(['manager', 'admin']),
  promotionController.getPromotionAnalytics
);

/**
 * @route   PUT /api/v1/promotions/:id
 * @desc    Update a promotion
 * @access  Manager
 */
router.put(
  '/:id',
  roleMiddleware.checkRole(['manager', 'admin']),
  promotionController.updatePromotion
);

/**
 * @route   DELETE /api/v1/promotions/:id
 * @desc    Delete a promotion
 * @access  Manager
 */
router.delete(
  '/:id',
  roleMiddleware.checkRole(['manager', 'admin']),
  promotionController.deletePromotion
);

module.exports = router;
