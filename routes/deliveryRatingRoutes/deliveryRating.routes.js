/**
 * DELIVERY RATING ROUTES
 * 
 * API routes for delivery rating operations.
 * Handles rating submission, retrieval, and analytics with role-based access control.
 * 
 * Requirements: 3.1, 3.6, 3.9, 3.12
 */

const express = require('express');
const router = express.Router();
const deliveryRatingController = require('../../controllers/deliveryRatingControllers/deliveryRating.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

// Submit delivery rating (Customer only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Customer']),
  deliveryRatingController.submitDeliveryRating
);

// Get delivery rating for order (Authenticated users)
router.get(
  '/orders/:orderId',
  authMiddleware,
  deliveryRatingController.getOrderDeliveryRating
);

// Get seller delivery metrics (Public - visible to all)
router.get(
  '/sellers/:sellerId/metrics',
  deliveryRatingController.getSellerDeliveryMetrics
);

// Get seller rating distribution (Public - visible to all)
router.get(
  '/sellers/:sellerId/distribution',
  deliveryRatingController.getSellerRatingDistribution
);

// Get delivery rating analytics (Manager and Admin only)
router.get(
  '/analytics',
  authMiddleware,
  roleMiddleware(['Manager', 'Admin']),
  deliveryRatingController.getDeliveryRatingAnalytics
);

// Get flagged ratings (Manager and Admin only)
router.get(
  '/flagged',
  authMiddleware,
  roleMiddleware(['Manager', 'Admin']),
  deliveryRatingController.getFlaggedRatings
);

// Flag a rating for review (Manager and Admin only)
router.put(
  '/:ratingId/flag',
  authMiddleware,
  roleMiddleware(['Manager', 'Admin']),
  deliveryRatingController.flagRating
);

module.exports = router;
