/**
 * PRODUCT ROUTES
 * 
 * Routes for product browsing, seller management, and manager approval.
 * Phase 3: Multi-vendor product management
 */

const express = require('express');
const router = express.Router();
const productController = require('../../controllers/productControllers/product.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { requireSeller, requireManager, requireMinRole } = require('../../middlewares/role.middleware');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Browse products (only approved products visible)
router.get('/api/products', optionalAuthenticate, productController.getAllProducts);

// Search products (role-based visibility with optional auth)
router.get('/api/products/search', optionalAuthenticate, productController.searchProducts);

// Get product details (only approved products visible)
router.get('/api/products/:id', optionalAuthenticate, productController.getProductById);

// ============================================
// SELLER ROUTES (Seller authentication required)
// ============================================

// Get seller's own products
router.get('/api/seller/products', authenticate, requireSeller, productController.getSellerProducts);

// Create new product (pending approval)
router.post('/api/seller/products', authenticate, requireSeller, productController.createProduct);

// Update own product (triggers re-approval if approved)
router.put('/api/seller/products/:id', authenticate, requireSeller, productController.updateProduct);

// Delete own product
router.delete('/api/seller/products/:id', authenticate, requireSeller, productController.deleteProduct);

// ============================================
// MANAGER ROUTES (Manager/Admin authentication required)
// ============================================

// Get product approval queue (pending products)
router.get('/api/manager/products/pending', authenticate, requireMinRole('manager'), productController.getApprovalQueue);

// Approve product
router.post('/api/manager/products/:id/approve', authenticate, requireMinRole('manager'), productController.approveProduct);

// Reject product
router.post('/api/manager/products/:id/reject', authenticate, requireMinRole('manager'), productController.rejectProduct);

module.exports = router;
