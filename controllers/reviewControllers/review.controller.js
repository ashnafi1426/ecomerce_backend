/**
 * REVIEW CONTROLLER
 * 
 * Handles HTTP requests for product reviews and ratings.
 */

const reviewService = require('../../services/reviewServices/review.service');

/**
 * REQUIREMENT 1: Create review for purchased product
 * POST /api/reviews
 */
const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product ID and rating are required'
      });
    }

    const review = await reviewService.createReview(req.user.id, {
      productId,
      rating,
      title,
      comment
    });

    res.status(201).json({
      message: 'Review submitted successfully. It will be visible after admin approval.',
      review
    });
  } catch (error) {
    if (error.message.includes('already reviewed')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
    if (error.message.includes('Rating must be')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Update review
 * PUT /api/reviews/:id
 */
const updateReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await reviewService.updateReview(
      req.params.id,
      req.user.id,
      { rating, title, comment }
    );

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }
    if (error.message.includes('Rating must be')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Delete review
 * DELETE /api/reviews/:id
 */
const deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview(req.params.id, req.user.id);

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get reviews for a product
 * GET /api/products/:productId/reviews
 */
const getProductReviews = async (req, res, next) => {
  try {
    const { rating, verifiedOnly, limit } = req.query;

    const reviews = await reviewService.getProductReviews(req.params.productId, {
      rating,
      verifiedOnly: verifiedOnly === 'true',
      limit
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

/**
 * REQUIREMENT 3: Get product rating statistics
 * GET /api/products/:productId/rating-stats
 */
const getProductRatingStats = async (req, res, next) => {
  try {
    const stats = await reviewService.getProductRatingStats(req.params.productId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's reviews
 * GET /api/reviews/my-reviews
 */
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getUserReviews(req.user.id);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

/**
 * Get review by ID
 * GET /api/reviews/:id
 */
const getReviewById = async (req, res, next) => {
  try {
    const review = await reviewService.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Review not found'
      });
    }

    res.json(review);
  } catch (error) {
    next(error);
  }
};

/**
 * REQUIREMENT 4: Get pending reviews (Admin only)
 * GET /api/admin/reviews/pending
 */
const getPendingReviews = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const reviews = await reviewService.getPendingReviews({ limit });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

/**
 * REQUIREMENT 4: Approve review (Admin only)
 * POST /api/admin/reviews/:id/approve
 */
const approveReview = async (req, res, next) => {
  try {
    const review = await reviewService.approveReview(req.params.id, req.user.id);

    res.json({
      message: 'Review approved successfully',
      review
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * REQUIREMENT 4: Reject review (Admin only)
 * POST /api/admin/reviews/:id/reject
 */
const rejectReview = async (req, res, next) => {
  try {
    const review = await reviewService.rejectReview(req.params.id, req.user.id);

    res.json({
      message: 'Review rejected successfully',
      review
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get all reviews (Admin only)
 * GET /api/admin/reviews
 */
const getAllReviews = async (req, res, next) => {
  try {
    const { status, productId, limit, offset } = req.query;

    const reviews = await reviewService.getAllReviews({
      status,
      productId,
      limit,
      offset
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

/**
 * Get review statistics (Admin only)
 * GET /api/admin/reviews/statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await reviewService.getReviewStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getProductRatingStats,
  getMyReviews,
  getReviewById,
  getPendingReviews,
  approveReview,
  rejectReview,
  getAllReviews,
  getStatistics
};
