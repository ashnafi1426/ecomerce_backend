/**
 * PRODUCT CONTROLLER
 * 
 * Handles product-related operations for all roles.
 * Phase 3: Multi-vendor product management with approval workflow
 */

const productService = require('../../services/productServices/product.service');

/**
 * Get all products (role-based visibility)
 * GET /api/products
 * 
 * Visibility rules:
 * - Customers: Only approved products
 * - Sellers: Only their own products (all statuses)
 * - Managers/Admins: All products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { status, categoryId, limit, offset, approvalStatus } = req.query;
    const user = req.user; // May be undefined for public access

    const filters = {
      categoryId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    // Apply role-based visibility
    if (!user) {
      // Public access - only approved products
      filters.approvalStatus = 'approved';
      filters.status = 'active';
    } else if (user.role === 'customer') {
      // Customers - only approved products
      filters.approvalStatus = 'approved';
      filters.status = status || 'active';
    } else if (user.role === 'seller') {
      // Sellers - only their own products (all statuses)
      filters.sellerId = user.id;
      if (status) filters.status = status;
      if (approvalStatus) filters.approvalStatus = approvalStatus;
    } else if (user.role === 'manager' || user.role === 'admin') {
      // Managers/Admins - all products
      if (status) filters.status = status;
      if (approvalStatus) filters.approvalStatus = approvalStatus;
    }

    const products = await productService.findAll(filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID (role-based visibility)
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const product = await productService.findById(id);

    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    // Apply visibility rules
    if (!user || user.role === 'customer') {
      // Public/Customer - only approved products
      if (product.approval_status !== 'approved') {
        return res.status(404).json({ 
          error: 'Not Found',
          message: 'Product not found' 
        });
      }
    } else if (user.role === 'seller') {
      // Sellers - only their own products
      if (product.seller_id !== user.id) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only view your own products' 
        });
      }
    }
    // Managers/Admins can view all products

    res.json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * Search products (role-based visibility)
 * GET /api/products/search?q=laptop
 */
const searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    const user = req.user;

    if (!q) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Search query is required' 
      });
    }

    const filters = {
      searchTerm: q,
      limit: parseInt(limit)
    };

    // Apply role-based visibility
    if (!user || user.role === 'customer') {
      filters.approvalStatus = 'approved';
    } else if (user.role === 'seller') {
      filters.sellerId = user.id;
    }
    // Managers/Admins can search all products

    const products = await productService.search(filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create product (Seller only)
 * POST /api/seller/products
 */
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, imageUrl, categoryId, initialQuantity, lowStockThreshold } = req.body;
    const sellerId = req.user.id;

    // Validation
    if (!title || !description || !price) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Title, description, and price are required' 
      });
    }

    if (price <= 0) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Price must be greater than 0' 
      });
    }

    const productData = {
      title,
      description,
      price,
      imageUrl,
      categoryId,
      sellerId,
      initialQuantity: initialQuantity || 0,
      lowStockThreshold: lowStockThreshold || 10,
      status: 'active',
      approvalStatus: 'pending' // New products require approval
    };

    const product = await productService.create(productData);

    res.status(201).json({
      message: 'Product created successfully. Pending manager approval.',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product (Seller only - own products)
 * PUT /api/seller/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, imageUrl, categoryId, status } = req.body;
    const sellerId = req.user.id;

    // Check if product exists and belongs to seller
    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only update your own products' 
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({ 
          error: 'Validation Error',
          message: 'Price must be greater than 0' 
        });
      }
      updates.price = price;
    }
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    if (categoryId !== undefined) updates.category_id = categoryId;
    if (status !== undefined) updates.status = status;

    // If product was approved and seller makes changes, reset to pending
    if (product.approval_status === 'approved' && Object.keys(updates).length > 0) {
      updates.approval_status = 'pending';
      updates.approved_by = null;
      updates.approved_at = null;
    }

    const updatedProduct = await productService.update(id, updates);

    const message = updates.approval_status === 'pending' 
      ? 'Product updated successfully. Pending manager re-approval.'
      : 'Product updated successfully.';

    res.json({
      message,
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product (Seller only - own products)
 * DELETE /api/seller/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Check if product exists and belongs to seller
    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only delete your own products' 
      });
    }

    await productService.deleteProduct(id);

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller's own products
 * GET /api/seller/products
 */
const getSellerProducts = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { status, approvalStatus, limit, offset } = req.query;

    const filters = {
      sellerId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    if (status) filters.status = status;
    if (approvalStatus) filters.approvalStatus = approvalStatus;

    const products = await productService.findAll(filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product approval queue (Manager/Admin only)
 * GET /api/manager/products/pending
 */
const getApprovalQueue = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;

    const filters = {
      approvalStatus: 'pending',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    const products = await productService.findAll(filters);

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve product (Manager/Admin only)
 * POST /api/manager/products/:id/approve
 */
const approveProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;

    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    if (product.approval_status === 'approved') {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Product is already approved' 
      });
    }

    const updatedProduct = await productService.approveProduct(id, managerId);

    // TODO: Send notification to seller
    // await notificationService.notifySellerProductApproved(product.seller_id, id);

    res.json({
      message: 'Product approved successfully',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject product (Manager/Admin only)
 * POST /api/manager/products/:id/reject
 */
const rejectProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;

    if (!reason) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Rejection reason is required' 
      });
    }

    const product = await productService.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    if (product.approval_status === 'rejected') {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Product is already rejected' 
      });
    }

    const updatedProduct = await productService.rejectProduct(id, managerId, reason);

    // TODO: Send notification to seller
    // await notificationService.notifySellerProductRejected(product.seller_id, id, reason);

    res.json({
      message: 'Product rejected',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getApprovalQueue,
  approveProduct,
  rejectProduct
};

