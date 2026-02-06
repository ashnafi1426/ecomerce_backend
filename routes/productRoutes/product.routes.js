/**
 * PRODUCT ROUTES
 * 
 * Routes for product browsing and search (customer-facing).
 */

const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productControllers/product.controller');

// Public routes - no authentication required
router.get('/api/products', productController.getAllProducts);
router.get('/api/products/search', productController.searchProducts);
router.get('/api/products/:id', productController.getProductById);

module.exports = router;
