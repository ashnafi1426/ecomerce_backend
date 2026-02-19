const supabase = require('../../config/supabase');

// Get all images for a product
const getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;

    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Get product images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product images',
      error: error.message
    });
  }
};

// Upload product image
const uploadProductImage = async (req, res) => {
  try {
    const { productId } = req.params;
    const { image_url, alt_text, is_primary = false } = req.body;

    // Validate required fields
    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // If setting as primary, unset other primary images
    if (is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
    }

    // Get next display order
    const { data: existingImages } = await supabase
      .from('product_images')
      .select('display_order')
      .eq('product_id', productId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existingImages && existingImages.length > 0 
      ? existingImages[0].display_order + 1 
      : 1;

    // Insert new image
    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url,
        alt_text: alt_text || '',
        is_primary,
        display_order: nextOrder
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

// Update product image
const updateProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const { image_url, alt_text, is_primary, display_order } = req.body;

    const updates = {};
    if (image_url !== undefined) updates.image_url = image_url;
    if (alt_text !== undefined) updates.alt_text = alt_text;
    if (display_order !== undefined) updates.display_order = display_order;
    
    // If setting as primary, unset other primary images
    if (is_primary === true) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
      updates.is_primary = true;
    } else if (is_primary === false) {
      updates.is_primary = false;
    }

    const { data, error } = await supabase
      .from('product_images')
      .update(updates)
      .eq('id', imageId)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Image updated successfully',
      data
    });
  } catch (error) {
    console.error('Update product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update image',
      error: error.message
    });
  }
};

// Delete product image
const deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', productId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

// Reorder product images
const reorderProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const { imageOrders } = req.body; // Array of { id, display_order }

    if (!Array.isArray(imageOrders)) {
      return res.status(400).json({
        success: false,
        message: 'imageOrders must be an array'
      });
    }

    // Update each image's display order
    const updatePromises = imageOrders.map(({ id, display_order }) =>
      supabase
        .from('product_images')
        .update({ display_order })
        .eq('id', id)
        .eq('product_id', productId)
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Images reordered successfully'
    });
  } catch (error) {
    console.error('Reorder product images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder images',
      error: error.message
    });
  }
};

module.exports = {
  getProductImages,
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
  reorderProductImages
};
