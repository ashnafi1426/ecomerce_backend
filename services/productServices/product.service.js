/**
 * PRODUCT SERVICE
 * 
 * Business logic layer for product operations.
 * Database operations using Supabase.
 */

const supabase = require('../../config/supabase');

/**
 * Find product by ID
 * @param {String} id - Product UUID
 * @returns {Promise<Object|null>} Product object or null
 */
const findById = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      inventory(quantity, reserved_quantity)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Get all products
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of product objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      inventory(quantity, reserved_quantity)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Search products by title
 * @param {String} searchTerm - Search term
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} Array of product objects
 */
const search = async (searchTerm, limit = 20) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      inventory(quantity)
    `)
    .eq('status', 'active')
    .ilike('title', `%${searchTerm}%`)
    .limit(limit);
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Create new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product object
 */
const create = async (productData) => {
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([{
      title: productData.title,
      description: productData.description,
      price: productData.price,
      image_url: productData.imageUrl,
      category_id: productData.categoryId || null,
      status: productData.status || 'active',
      created_by: productData.createdBy
    }])
    .select()
    .single();
  
  if (productError) throw productError;

  const { error: inventoryError } = await supabase
    .from('inventory')
    .insert([{
      product_id: product.id,
      quantity: productData.initialQuantity || 0,
      low_stock_threshold: productData.lowStockThreshold || 10
    }]);
  
  if (inventoryError) throw inventoryError;
  
  return product;
};

/**
 * Update product
 * @param {String} id - Product UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated product object
 */
const update = async (id, updates) => {
  const updateData = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
  if (updates.category_id !== undefined) updateData.category_id = updates.category_id;
  if (updates.status !== undefined) updateData.status = updates.status;
  
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Delete product
 * @param {String} id - Product UUID
 * @returns {Promise<void>}
 */
const deleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

/**
 * Update product inventory
 * @param {String} productId - Product UUID
 * @param {Number} quantity - New quantity
 * @returns {Promise<Object>} Updated inventory object
 */
const updateInventory = async (productId, quantity) => {
  const { data, error } = await supabase
    .from('inventory')
    .update({ 
      quantity,
      updated_at: new Date().toISOString()
    })
    .eq('product_id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Get low stock products
 * @returns {Promise<Array>} Array of low stock products
 */
const getLowStock = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      inventory(quantity, low_stock_threshold)
    `)
    .eq('status', 'active')
    .order('inventory.quantity', { ascending: true });
  
  if (error) throw error;
  
  const lowStockProducts = (data || []).filter(product => {
    if (!product.inventory || product.inventory.length === 0) return false;
    const inv = product.inventory[0];
    return inv.quantity <= inv.low_stock_threshold;
  });
  
  return lowStockProducts;
};

module.exports = {
  findById,
  findAll,
  search,
  create,
  update,
  deleteProduct,
  updateInventory,
  getLowStock
};
