/**
 * REVIEW ROUTES
 * 
 * Routes for product reviews and ratings.
 */

const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/reviewControllers/review.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireCustomer, requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Get reviews for a product
router.get('/api/products/:productId/reviews', reviewController.getProductReviews);

// Get product rating statistics
router.get('/api/products/:productId/rating-stats', reviewController.getProductRatingStats);

// ============================================
// CUSTOMER ROUTES
// ============================================

// Create review
router.post('/api/reviews', authenticate, requireCustomer, reviewController.createReview);

// Get my reviews
router.get('/api/reviews/my-reviews', authenticate, requireCustomer, reviewController.getMyReviews);

// Get review by ID
router.get('/api/reviews/:id', authenticate, reviewController.getReviewById);

// Update review
router.put('/api/reviews/:id', authenticate, requireCustomer, reviewController.updateReview);

// Delete review
router.delete('/api/reviews/:id', authenticate, requireCustomer, reviewController.deleteReview);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all reviews
router.get('/api/admin/reviews', authenticate, requireAdmin, reviewController.getAllReviews);

// Get pending reviews
router.get('/api/admin/reviews/pending', authenticate, requireAdmin, reviewController.getPendingReviews);

// Get review statistics
router.get('/api/admin/reviews/statistics', authenticate, requireAdmin, reviewController.getStatistics);

// Approve review
router.post('/api/admin/reviews/:id/approve', authenticate, requireAdmin, reviewController.approveReview);

// Reject review
router.post('/api/admin/reviews/:id/reject', authenticate, requireAdmin, reviewController.rejectReview);

module.exports = router;
