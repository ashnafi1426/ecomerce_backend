const supabase = require('../../config/supabase');

// Get all specifications for a product
const getProductSpecifications = async (req, res) => {
  try {
    const { productId } = req.params;

    const { data, error } = await supabase
      .from('product_specifications')
      .select('*')
      .eq('product_id', productId)
      .order('spec_group', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Group specifications by spec_group
    const grouped = {};
    (data || []).forEach(spec => {
      const group = spec.spec_group || 'General';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(spec);
    });

    res.status(200).json({
      success: true,
      data: {
        specifications: data || [],
        grouped
      }
    });
  } catch (error) {
    console.error('Get product specifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch specifications',
      error: error.message
    });
  }
};

// Add product specification
const addProductSpecification = async (req, res) => {
  try {
    const { productId } = req.params;
    const { spec_name, spec_value, spec_group = 'General' } = req.body;

    if (!spec_name || !spec_value) {
      return res.status(400).json({
        success: false,
        message: 'Specification name and value are required'
      });
    }

    // Get next display order for this group
    const { data: existingSpecs } = await supabase
      .from('product_specifications')
      .select('display_order')
      .eq('product_id', productId)
      .eq('spec_group', spec_group)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existingSpecs && existingSpecs.length > 0 
      ? existingSpecs[0].display_order + 1 
      : 1;

    const { data, error } = await supabase
      .from('product_specifications')
      .insert({
        product_id: productId,
        spec_name: spec_name.trim(),
        spec_value: spec_value.trim(),
        spec_group: spec_group.trim(),
        display_order: nextOrder
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Specification added successfully',
      data
    });
  } catch (error) {
    console.error('Add product specification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add specification',
      error: error.message
    });
  }
};

// Update product specification
const updateProductSpecification = async (req, res) => {
  try {
    const { productId, specId } = req.params;
    const { spec_name, spec_value, spec_group, display_order } = req.body;

    const updates = {};
    if (spec_name !== undefined) updates.spec_name = spec_name.trim();
    if (spec_value !== undefined) updates.spec_value = spec_value.trim();
    if (spec_group !== undefined) updates.spec_group = spec_group.trim();
    if (display_order !== undefined) updates.display_order = display_order;

    const { data, error } = await supabase
      .from('product_specifications')
      .update(updates)
      .eq('id', specId)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Specification updated successfully',
      data
    });
  } catch (error) {
    console.error('Update product specification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update specification',
      error: error.message
    });
  }
};

// Delete product specification
const deleteProductSpecification = async (req, res) => {
  try {
    const { productId, specId } = req.params;

    const { error } = await supabase
      .from('product_specifications')
      .delete()
      .eq('id', specId)
      .eq('product_id', productId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Specification deleted successfully'
    });
  } catch (error) {
    console.error('Delete product specification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete specification',
      error: error.message
    });
  }
};

// Bulk add specifications
const bulkAddSpecifications = async (req, res) => {
  try {
    const { productId } = req.params;
    const { specifications } = req.body; // Array of { spec_name, spec_value, spec_group }

    if (!Array.isArray(specifications) || specifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'specifications must be a non-empty array'
      });
    }

    const specsToInsert = specifications.map((spec, index) => ({
      product_id: productId,
      spec_name: spec.spec_name.trim(),
      spec_value: spec.spec_value.trim(),
      spec_group: (spec.spec_group || 'General').trim(),
      display_order: index + 1
    }));

    const { data, error } = await supabase
      .from('product_specifications')
      .insert(specsToInsert)
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: `${data.length} specifications added successfully`,
      data
    });
  } catch (error) {
    console.error('Bulk add specifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add specifications',
      error: error.message
    });
  }
};

module.exports = {
  getProductSpecifications,
  addProductSpecification,
  updateProductSpecification,
  deleteProductSpecification,
  bulkAddSpecifications
};
