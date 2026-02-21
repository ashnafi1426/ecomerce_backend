const express = require('express');
const router = express.Router();
const discountController = require('../../controllers/discountControllers/discount.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

/**
 * Discount Routes
 * Handles discount rule management and application
 */

// Admin routes - Discount rule management
router.post(
  '/rules',
  authenticate,
  requireRole('admin'),
  discountController.createDiscountRule
);

router.put(
  '/rules/:id',
  authenticate,
  requireRole('admin'),
  discountController.updateDiscountRule
);

router.delete(
  '/rules/:id',
  authenticate,
  requireRole('admin'),
  discountController.deleteDiscountRule
);

router.get(
  '/rules',
  authenticate,
  requireRole('admin'),
  discountController.getAllDiscountRules
);

// Public routes - Active discounts
router.get('/active', discountController.getActiveDiscountRules);

// Customer routes - Apply discounts
router.post(
  '/apply-to-cart',
  authenticate,
  discountController.applyDiscountsToCart
);

// Admin analytics routes
router.get(
  '/analytics',
  authenticate,
  requireRole('admin'),
  discountController.getDiscountAnalytics
);

router.get(
  '/analytics/export',
  authenticate,
  requireRole('admin'),
  discountController.exportDiscountAnalytics
);

module.exports = router;
