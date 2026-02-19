const supabase = require('../../config/supabase');

// Get reviews for a product with filters
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { 
      rating, 
      verified_only, 
      with_images, 
      sort_by = 'helpful', 
      page = 1, 
      limit = 10 
    } = req.query;

    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        users:user_id (
          id,
          first_name,
          last_name,
          email
        ),
        review_images (
          id,
          image_url
        )
      `)
      .eq('product_id', productId)
      .eq('is_approved', true);

    // Apply filters
    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    if (verified_only === 'true') {
      query = query.eq('verified_purchase', true);
    }

    if (with_images === 'true') {
      query = query.not('review_images', 'is', null);
    }

    // Apply sorting
    switch (sort_by) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'recent':
        query = query.order('created_at', { ascending: false });
        break;
      case 'rating_high':
        query = query.order('rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('rating', { ascending: true });
        break;
      default:
        query = query.order('helpful_count', { ascending: false });
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Get review summary
    const { data: summary } = await supabase
      .from('product_rating_summary')
      .select('*')
      .eq('product_id', productId)
      .single();

    res.status(200).json({
      success: true,
      data: data || [],
      summary: summary || {
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
        verified_purchases: 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Submit a review
const submitReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const { rating, title, review_text, images = [] } = req.body;

    // Validate required fields
    if (!rating || !title || !review_text) {
      return res.status(400).json({
        success: false,
        message: 'Rating, title, and review text are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if user already reviewed this product
    const { data: existingReview } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Check if user purchased this product (verified purchase)
    const { data: purchase } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .eq('order_id', supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'delivered')
      )
      .limit(1)
      .single();

    const isVerifiedPurchase = !!purchase;

    // Insert review
    const { data: review, error: reviewError } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: userId,
        rating,
        title,
        review_text,
        verified_purchase: isVerifiedPurchase,
        is_approved: true // Auto-approve for now
      })
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Insert review images if provided
    if (images.length > 0) {
      const imageInserts = images.map((imageUrl) => ({
        review_id: review.id,
        image_url: imageUrl
      }));

      await supabase
        .from('review_images')
        .insert(imageInserts);
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// Vote on review (helpful/not helpful)
const voteOnReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { vote_type } = req.body; // 'helpful' or 'not_helpful'

    if (!['helpful', 'not_helpful'].includes(vote_type)) {
      return res.status(400).json({
        success: false,
        message: 'vote_type must be "helpful" or "not_helpful"'
      });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('review_votes')
      .select('id, vote_type')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // Update existing vote if different
      if (existingVote.vote_type !== vote_type) {
        await supabase
          .from('review_votes')
          .update({ vote_type })
          .eq('id', existingVote.id);

        return res.status(200).json({
          success: true,
          message: 'Vote updated successfully'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'You have already voted this way'
        });
      }
    }

    // Insert new vote (trigger will auto-update counts)
    const { error } = await supabase
      .from('review_votes')
      .insert({
        review_id: reviewId,
        user_id: userId,
        vote_type
      });

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    console.error('Vote on review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote',
      error: error.message
    });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, title, review_text } = req.body;

    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (title !== undefined) updates.title = title;
    if (review_text !== undefined) updates.review_text = review_text;

    const { data, error } = await supabase
      .from('product_reviews')
      .update(updates)
      .eq('id', reviewId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to update it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// Get review summary
const getReviewSummary = async (req, res) => {
  try {
    const { productId } = req.params;

    const { data, error } = await supabase
      .from('product_rating_summary')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.status(200).json({
      success: true,
      data: data || {
        product_id: productId,
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
        verified_purchases: 0
      }
    });
  } catch (error) {
    console.error('Get review summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review summary',
      error: error.message
    });
  }
};

// Check if user can review product
const canReviewProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if user has already reviewed
    const { data: existingReview } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .single();

    const hasReviewed = !!existingReview;

    // Check if user has purchased this product
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        order_items!inner(product_id)
      `)
      .eq('user_id', userId)
      .eq('order_items.product_id', productId)
      .eq('status', 'delivered');

    const hasPurchased = orders && orders.length > 0;

    res.status(200).json({
      success: true,
      canReview: !hasReviewed,
      hasPurchased,
      hasReviewed
    });
  } catch (error) {
    console.error('Check review eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check review eligibility',
      error: error.message
    });
  }
};

module.exports = {
  getProductReviews,
  submitReview,
  voteOnReview,
  updateReview,
  deleteReview,
  getReviewSummary,
  canReviewProduct
};
