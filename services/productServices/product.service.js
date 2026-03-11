/**
 * PRODUCT SERVICE
 * 
 * Business logic layer for product operations.
 * Phase 3: Multi-vendor product management with approval workflow
 */

const supabase = require('../../config/supabase');
const { processQuery, scoreProduct } = require('../../utils/searchQueryProcessor');

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
      inventory(quantity, reserved_quantity),
      seller:users!products_seller_id_fkey(id, display_name, business_name, email),
      approved_by_user:users!products_approved_by_fkey(id, display_name, email)
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
 * Get all products with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of product objects
 */
const findAll = async (filters = {}) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      inventory(quantity, reserved_quantity),
      seller:users!products_seller_id_fkey(id, display_name, business_name, email)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.approvalStatus) {
    query = query.eq('approval_status', filters.approvalStatus);
  }

  if (filters.sellerId) {
    query = query.eq('seller_id', filters.sellerId);
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
 * Semantic search — understands meaning, synonyms, typos and intent.
 *
 * Pipeline:
 *  1. processQuery()  → expand tokens with synonyms, detect intent / brand
 *  2. Supabase fetch  → broad OR filter on expanded terms + hard filters
 *  3. scoreProduct()  → multi-factor relevance ranking in JS
 *  4. Sort override   → applies price/quality/new intent on final list
 *
 * @param {Object} filters - Search filters from controller
 * @returns {Promise<Array>} Ranked array of product objects
 */
const search = async (filters) => {
  const rawSearchTerm = (filters.searchTerm || '').trim();

  // ── 1. Query Understanding ────────────────────────────────────────────────
  const queryInfo = processQuery(rawSearchTerm);
  const { expandedTerms, tokens, sortOverride, brandHints } = queryInfo;

  // Use intent-based sort if caller didn't specify an explicit sort
  const effectiveSort = (filters.sort && filters.sort !== 'featured')
    ? filters.sort
    : (sortOverride || filters.sort || 'featured');

  // ── 2. Build base Supabase query ─────────────────────────────────────────
  const selectClause = `
    *,
    category:categories(id, name),
    inventory(quantity, reserved_quantity),
    seller:users!products_seller_id_fkey(id, display_name, business_name)
  `;

  let query = supabase.from('products').select(selectClause);

  // Hard filters (always applied regardless of search term)
  if (filters.approvalStatus) query = query.eq('approval_status', filters.approvalStatus);
  if (filters.sellerId)       query = query.eq('seller_id', filters.sellerId);
  if (filters.status)         query = query.eq('status', filters.status);
  if (filters.categoryId)     query = query.eq('category_id', filters.categoryId);
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
  if (filters.minRating !== undefined) query = query.gte('average_rating', filters.minRating);

  // ── 3. Build expanded OR text filter ─────────────────────────────────────
  // Use at most 20 most relevant expanded terms to keep the query manageable
  if (rawSearchTerm && expandedTerms.length > 0) {
    const termsToSearch = expandedTerms.slice(0, 20);

    const orParts = termsToSearch.flatMap(term => [
      `title.ilike.%${term}%`,
      `brand.ilike.%${term}%`,
      `description.ilike.%${term}%`,
    ]);

    query = query.or(orParts.join(','));
  }

  // Fetch a generous pool for JS-side re-ranking
  query = query.limit(500);

  const { data, error } = await query;
  if (error) throw error;

  let results = data || [];

  // ── 4. Supplement: fetch by category name match ───────────────────────────
  // Supabase OR doesn't traverse joined tables; do a separate pass
  if (rawSearchTerm && results.length < 500) {
    const catOrParts = expandedTerms.slice(0, 10).map(t => `name.ilike.%${t}%`);
    const { data: catMatches } = await supabase
      .from('categories')
      .select('id')
      .or(catOrParts.join(','));

    if (catMatches && catMatches.length > 0) {
      const catIds = catMatches.map(c => c.id);
      const existingIds = new Set(results.map(r => r.id));

      let catQ = supabase.from('products').select(selectClause).in('category_id', catIds);
      if (filters.approvalStatus) catQ = catQ.eq('approval_status', filters.approvalStatus);
      if (filters.sellerId)       catQ = catQ.eq('seller_id', filters.sellerId);
      if (filters.status)         catQ = catQ.eq('status', filters.status);
      if (filters.minPrice !== undefined) catQ = catQ.gte('price', filters.minPrice);
      if (filters.maxPrice !== undefined) catQ = catQ.lte('price', filters.maxPrice);
      catQ = catQ.limit(200);

      const { data: catProds } = await catQ;
      if (catProds) {
        for (const p of catProds) {
          if (!existingIds.has(p.id)) results.push(p);
        }
      }
    }
  }

  // ── 5. Semantic scoring & ranking ─────────────────────────────────────────
  if (rawSearchTerm) {
    results = results
      .map(product => ({
        ...product,
        _score: scoreProduct(product, queryInfo),
      }))
      .filter(p => p._score > 0)    // drop zero-score results (irrelevant)
      .sort((a, b) => b._score - a._score)
      .map(({ _score, ...product }) => product);
  }

  // ── 6. Apply sort (after semantic ranking for non-relevance sorts) ─────────
  // Only apply non-relevance sorts when user explicitly requested them
  // OR when query intent implies a sort (cheap → price_asc, etc.)
  if (rawSearchTerm && effectiveSort !== 'featured') {
    switch (effectiveSort) {
      case 'price_asc':
        results.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        results.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'rating':
        results.sort((a, b) => (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0));
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
    }
  } else if (!rawSearchTerm) {
    // No search term — apply DB-level sort semantics in JS
    switch (effectiveSort) {
      case 'price_asc':
        results.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        results.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'rating':
        results.sort((a, b) => (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0));
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      default:
        results.sort((a, b) => {
          const fa = b.is_featured ? 1 : 0;
          const fb = a.is_featured ? 1 : 0;
          if (fa !== fb) return fa - fb;
          return (Number(b.total_sales) || 0) - (Number(a.total_sales) || 0);
        });
    }
  }

  // ── 7. Apply limit ────────────────────────────────────────────────────────
  const limit = filters.limit || 50;
  return results.slice(0, limit);
};

/**
 * Create new product
 * @param {Object} productData - Product data
 * @returns {Promise<Object>} Created product object
 */
const create = async (productData) => {
  try {
    console.log('📦 Creating product with data:', JSON.stringify(productData, null, 2));
    
    // Validate required fields
    if (!productData.title || !productData.description || !productData.price || !productData.sellerId) {
      throw new Error('Missing required fields: title, description, price, and sellerId are required');
    }
    
    // Ensure price is a valid number
    const price = parseFloat(productData.price);
    if (isNaN(price) || price <= 0) {
      throw new Error('Price must be a valid positive number');
    }
    
    // Prepare product data with safe defaults
    const insertData = {
      title: productData.title.trim(),
      description: productData.description.trim(),
      price: price,
      image_url: productData.imageUrl || 'https://via.placeholder.com/400x400/667eea/ffffff?text=Product',
      category_id: productData.categoryId || null,
      seller_id: productData.sellerId,
      status: productData.status || 'active',
      approval_status: productData.approvalStatus || 'pending',
      created_by: productData.sellerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📦 Inserting product data:', JSON.stringify(insertData, null, 2));
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([insertData])
      .select(`
        *,
        category:categories(id, name),
        seller:users!products_seller_id_fkey(id, display_name, business_name, email)
      `)
      .single();
    
    if (productError) {
      console.error('❌ Product creation error:', productError);
      console.error('❌ Error details:', {
        message: productError.message,
        details: productError.details,
        hint: productError.hint,
        code: productError.code
      });
      throw new Error(`Product creation failed: ${productError.message}`);
    }

    console.log('✅ Product created successfully:', product.id);

    // Create inventory record with error handling
    try {
      const inventoryData = {
        product_id: product.id,
        quantity: parseInt(productData.initialQuantity) || 0,
        low_stock_threshold: parseInt(productData.lowStockThreshold) || 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📦 Creating inventory with data:', JSON.stringify(inventoryData, null, 2));
      
      const { error: inventoryError } = await supabase
        .from('inventory')
        .insert([inventoryData]);
      
      if (inventoryError) {
        console.error('❌ Inventory creation error:', inventoryError);
        console.error('❌ Inventory error details:', {
          message: inventoryError.message,
          details: inventoryError.details,
          hint: inventoryError.hint,
          code: inventoryError.code
        });
        
        // Don't fail the entire operation if inventory creation fails
        // The product was created successfully
        console.log('⚠️ Product created but inventory creation failed. Continuing...');
      } else {
        console.log('✅ Inventory created for product:', product.id);
      }
    } catch (invError) {
      console.error('❌ Inventory creation exception:', invError.message);
      console.log('⚠️ Product created but inventory creation failed. Continuing...');
    }
    
    return product;
  } catch (error) {
    console.error('❌ Error in product.service.create:', error);
    console.error('❌ Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
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
  if (updates.approval_status !== undefined) updateData.approval_status = updates.approval_status;
  if (updates.approved_by !== undefined) updateData.approved_by = updates.approved_by;
  if (updates.approved_at !== undefined) updateData.approved_at = updates.approved_at;
  if (updates.rejection_reason !== undefined) updateData.rejection_reason = updates.rejection_reason;
  
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      category:categories(id, name),
      seller:users!products_seller_id_fkey(id, display_name, business_name, email),
      approved_by_user:users!products_approved_by_fkey(id, display_name, email)
    `)
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Approve product (Manager/Admin)
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager/Admin UUID
 * @returns {Promise<Object>} Updated product object
 */
const approveProduct = async (productId, managerId) => {
  return await update(productId, {
    approval_status: 'approved',
    approved_by: managerId,
    approved_at: new Date().toISOString(),
    rejection_reason: null
  });
};

/**
 * Reject product (Manager/Admin)
 * @param {String} productId - Product UUID
 * @param {String} managerId - Manager/Admin UUID
 * @param {String} reason - Rejection reason
 * @returns {Promise<Object>} Updated product object
 */
const rejectProduct = async (productId, managerId, reason) => {
  return await update(productId, {
    approval_status: 'rejected',
    approved_by: managerId,
    approved_at: new Date().toISOString(),
    rejection_reason: reason
  });
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
 * Get low stock products (seller-specific or all)
 * @param {String} sellerId - Optional seller ID filter
 * @returns {Promise<Array>} Array of low stock products
 */
const getLowStock = async (sellerId = null) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      inventory(quantity, low_stock_threshold),
      seller:users!products_seller_id_fkey(id, display_name, business_name)
    `)
    .eq('status', 'active');

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const lowStockProducts = (data || []).filter(product => {
    // Handle both array and object inventory
    const inv = Array.isArray(product.inventory) 
      ? product.inventory[0] 
      : product.inventory;
    
    if (!inv || typeof inv.quantity === 'undefined') return false;
    return inv.quantity <= (inv.low_stock_threshold || 10);
  });
  
  return lowStockProducts;
};

module.exports = {
  findById,
  findAll,
  search,
  create,
  update,
  approveProduct,
  rejectProduct,
  deleteProduct,
  updateInventory,
  getLowStock
};
