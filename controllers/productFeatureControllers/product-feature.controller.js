const supabase = require('../../config/supabase');

// Get all features for a product
const getProductFeatures = async (req, res) => {
  try {
    const { productId } = req.params;

    const { data, error } = await supabase
      .from('product_features')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Get product features error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product features',
      error: error.message
    });
  }
};

// Add product feature
const addProductFeature = async (req, res) => {
  try {
    const { productId } = req.params;
    const { feature_text } = req.body;

    if (!feature_text || feature_text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Feature text is required'
      });
    }

    // Get next display order
    const { data: existingFeatures } = await supabase
      .from('product_features')
      .select('display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existingFeatures && existingFeatures.length > 0 
      ? existingFeatures[0].display_order + 1 
      : 1;

    const { data, error } = await supabase
      .from('product_features')
      .insert({
        product_id: productId,
        feature_text: feature_text.trim(),
        display_order: nextOrder
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Feature added successfully',
      data
    });
  } catch (error) {
    console.error('Add product feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add feature',
      error: error.message
    });
  }
};

// Update product feature
const updateProductFeature = async (req, res) => {
  try {
    const { productId, featureId } = req.params;
    const { feature_text, display_order } = req.body;

    const updates = {};
    if (feature_text !== undefined) updates.feature_text = feature_text.trim();
    if (display_order !== undefined) updates.display_order = display_order;

    const { data, error } = await supabase
      .from('product_features')
      .update(updates)
      .eq('id', featureId)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Feature updated successfully',
      data
    });
  } catch (error) {
    console.error('Update product feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feature',
      error: error.message
    });
  }
};

// Delete product feature
const deleteProductFeature = async (req, res) => {
  try {
    const { productId, featureId } = req.params;

    const { error } = await supabase
      .from('product_features')
      .delete()
      .eq('id', featureId)
      .eq('product_id', productId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Feature deleted successfully'
    });
  } catch (error) {
    console.error('Delete product feature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feature',
      error: error.message
    });
  }
};

// Reorder features
const reorderFeatures = async (req, res) => {
  try {
    const { productId } = req.params;
    const { featureOrders } = req.body; // Array of { id, display_order }

    if (!Array.isArray(featureOrders)) {
      return res.status(400).json({
        success: false,
        message: 'featureOrders must be an array'
      });
    }

    const updatePromises = featureOrders.map(({ id, display_order }) =>
      supabase
        .from('product_features')
        .update({ display_order })
        .eq('id', id)
        .eq('product_id', productId)
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Features reordered successfully'
    });
  } catch (error) {
    console.error('Reorder features error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder features',
      error: error.message
    });
  }
};

module.exports = {
  getProductFeatures,
  addProductFeature,
  updateProductFeature,
  deleteProductFeature,
  reorderFeatures
};
