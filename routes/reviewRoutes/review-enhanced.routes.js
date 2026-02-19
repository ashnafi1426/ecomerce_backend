const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const {
  getProductReviews,
  submitReview,
  voteOnReview,
  updateReview,
  deleteReview,
  getReviewSummary,
  canReviewProduct
} = require('../../controllers/reviewControllers/review-enhanced.controller');

// Public routes
router.get('/:productId/reviews', getProductReviews);
router.get('/:productId/reviews/summary', getReviewSummary);

// Protected routes
router.get('/:productId/reviews/can-review', authenticate, canReviewProduct);
router.post('/:productId/reviews', authenticate, submitReview);
router.post('/reviews/:reviewId/vote', authenticate, voteOnReview);
router.put('/reviews/:reviewId', authenticate, updateReview);
router.delete('/reviews/:reviewId', authenticate, deleteReview);

module.exports = router;
