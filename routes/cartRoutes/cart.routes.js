/**
 * SHOPPING CART ROUTES
 * 
 * Routes for shopping cart operations.
 * All routes require authentication (customer only).
 */

const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/cartControllers/cart.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireCustomer } = require('../../middlewares/role.middleware');

// ============================================
// CUSTOMER ROUTES (Authentication Required)
// ============================================

// Get user's cart
router.get('/api/cart', authenticate, requireCustomer, cartController.getCart);

// Get cart summary (total items, total price)
router.get('/api/cart/summary', authenticate, requireCustomer, cartController.getCartSummary);

// Get cart item count
router.get('/api/cart/count', authenticate, requireCustomer, cartController.getCartCount);

// Add item to cart
router.post('/api/cart/items', authenticate, requireCustomer, cartController.addItem);

// Update cart item quantity
router.put('/api/cart/items/:productId', authenticate, requireCustomer, cartController.updateQuantity);

// Remove item from cart
router.delete('/api/cart/items/:productId', authenticate, requireCustomer, cartController.removeItem);

// Clear entire cart
router.delete('/api/cart', authenticate, requireCustomer, cartController.clearCart);

// Validate cart before checkout
router.post('/api/cart/validate', authenticate, requireCustomer, cartController.validateCart);

module.exports = router;
