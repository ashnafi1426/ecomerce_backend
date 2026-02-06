/**
 * PRODUCT CONTROLLER
 * 
 * Handles product-related operations (read-only for customers).
 */

const productService = require('../../services/productServices/product.service');

/**
 * Get all products
 * GET /api/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { status = 'active', categoryId, limit, offset } = req.query;

    const products = await productService.findAll({
      status,
      categoryId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await productService.findById(id);

    if (!product) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Product not found' 
      });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * Search products
 * GET /api/products/search?q=laptop
 */
const searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Search query is required' 
      });
    }

    const products = await productService.search(q, parseInt(limit));

    res.json({
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts
};

