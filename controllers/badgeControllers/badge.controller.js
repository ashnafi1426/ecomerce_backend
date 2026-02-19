const supabase = require('../../config/supabase');

// Get active badges for a product
const getProductBadges = async (req, res) => {
  try {
    const { productId } = req.params;

    const { data, error } = await supabase
      .from('product_badges')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Get product badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch badges',
      error: error.message
    });
  }
};

// Assign badge to product (admin only)
const assignBadge = async (req, res) => {
  try {
    const { productId } = req.params;
    const { badge_type, badge_text, start_date, end_date } = req.body;

    const validBadgeTypes = ['best_seller', 'amazons_choice', 'deal_of_day', 'lightning_deal', 'new_arrival', 'limited_time'];
    
    if (!validBadgeTypes.includes(badge_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid badge type'
      });
    }

    const { data, error } = await supabase
      .from('product_badges')
      .insert({
        product_id: productId,
        badge_type,
        badge_text: badge_text || badge_type.replace('_', ' ').toUpperCase(),
        start_date: start_date || new Date().toISOString(),
        end_date: end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Badge assigned successfully',
      data
    });
  } catch (error) {
    console.error('Assign badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign badge',
      error: error.message
    });
  }
};

// Remove badge
const removeBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;

    const { error } = await supabase
      .from('product_badges')
      .delete()
      .eq('id', badgeId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Badge removed successfully'
    });
  } catch (error) {
    console.error('Remove badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove badge',
      error: error.message
    });
  }
};

module.exports = {
  getProductBadges,
  assignBadge,
  removeBadge
};
