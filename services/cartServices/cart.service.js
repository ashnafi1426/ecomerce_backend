/**
 * SHOPPING CART SERVICE
 * 
 * Business logic layer for shopping cart operations.
 * Handles cart items, persistence, and inventory validation.
 */

const supabase = require('../../config/supabase');
const inventoryService = require('../inventoryServices/inventory.service');

/**
 * Get user's cart
 * @param {String} userId - User UUID
 * @returns {Promise<Array>} Array of cart items with product details
 */
const getCart = async (userId) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(
        id,
        title,
        description,
        price,
        image_url,
        status
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get cart item by product
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @returns {Promise<Object|null>} Cart item or null
 */
const getCartItem = async (userId, productId) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data;
};

/**
 * Add item to cart
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @param {Number} quantity - Quantity to add
 * @returns {Promise<Object>} Cart item
 */
const addItem = async (userId, productId, quantity = 1) => {
  // Check if product exists and is active
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, price, status')
    .eq('id', productId)
    .single();
  
  if (productError || !product) {
    throw new Error('Product not found');
  }

  if (product.status !== 'active') {
    throw new Error('Product is not available');
  }

  // Check inventory availability
  const hasStock = await inventoryService.hasStock(productId, quantity);
  if (!hasStock) {
    throw new Error('Insufficient stock available');
  }

  // Check if item already in cart
  const existingItem = await getCartItem(userId, productId);

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + quantity;
    
    // Validate new quantity against inventory
    const hasStockForNew = await inventoryService.hasStock(productId, newQuantity);
    if (!hasStockForNew) {
      throw new Error('Insufficient stock for requested quantity');
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingItem.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Create new cart item
    const { data, error } = await supabase
      .from('cart_items')
      .insert([{
        user_id: userId,
        product_id: productId,
        quantity
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

/**
 * Update cart item quantity
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @param {Number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart item
 */
const updateQuantity = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  // Check inventory availability
  const hasStock = await inventoryService.hasStock(productId, quantity);
  if (!hasStock) {
    throw new Error('Insufficient stock for requested quantity');
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ 
      quantity,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('product_id', productId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Remove item from cart
 * @param {String} userId - User UUID
 * @param {String} productId - Product UUID
 * @returns {Promise<void>}
 */
const removeItem = async (userId, productId) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
  
  if (error) throw error;
};

/**
 * Clear entire cart
 * @param {String} userId - User UUID
 * @returns {Promise<void>}
 */
const clearCart = async (userId) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
};

/**
 * Get cart summary (total items, total price)
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} Cart summary
 */
const getCartSummary = async (userId) => {
  const cartItems = await getCart(userId);
  
  let totalItems = 0;
  let totalPrice = 0;

  cartItems.forEach(item => {
    if (item.product && item.product.status === 'active') {
      totalItems += item.quantity;
      totalPrice += item.quantity * item.product.price;
    }
  });

  return {
    totalItems,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    itemCount: cartItems.length
  };
};

/**
 * Validate cart before checkout
 * Checks inventory availability for all items
 * @param {String} userId - User UUID
 * @returns {Promise<Object>} Validation result
 */
const validateCart = async (userId) => {
  const cartItems = await getCart(userId);
  
  if (cartItems.length === 0) {
    return {
      valid: false,
      errors: ['Cart is empty']
    };
  }

  const errors = [];
  const validItems = [];

  for (const item of cartItems) {
    // Check if product exists and is active
    if (!item.product) {
      errors.push(`Product ${item.product_id} not found`);
      continue;
    }

    if (item.product.status !== 'active') {
      errors.push(`${item.product.title} is no longer available`);
      continue;
    }

    // Check inventory
    const hasStock = await inventoryService.hasStock(item.product_id, item.quantity);
    if (!hasStock) {
      const available = await inventoryService.getAvailable(item.product_id);
      errors.push(`${item.product.title}: Only ${available} available (requested ${item.quantity})`);
      continue;
    }

    validItems.push(item);
  }

  return {
    valid: errors.length === 0,
    errors,
    validItems,
    invalidCount: errors.length
  };
};

/**
 * Get cart item count
 * @param {String} userId - User UUID
 * @returns {Promise<Number>} Total items in cart
 */
const getCartCount = async (userId) => {
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  if (error) throw error;
  
  return count || 0;
};

module.exports = {
  getCart,
  getCartItem,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  getCartSummary,
  validateCart,
  getCartCount
};
