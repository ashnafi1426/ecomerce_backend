/**
 * INVENTORY ROUTES
 * 
 * Routes for inventory/stock management operations.
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../../controllers/inventoryControllers/inventory.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// PUBLIC ROUTES (Read-only)
// ============================================

// Get available quantity for product
router.get('/api/inventory/product/:productId/available', inventoryController.getAvailableQuantity);

// Check if product has sufficient stock
router.get('/api/inventory/product/:productId/check', inventoryController.checkStock);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all inventory records
router.get('/api/inventory', authenticate, requireAdmin, inventoryController.getAllInventory);

// Get inventory by product ID
router.get('/api/inventory/product/:productId', authenticate, requireAdmin, inventoryController.getInventoryByProduct);

// Get low stock products
router.get('/api/inventory/low-stock', authenticate, requireAdmin, inventoryController.getLowStock);

// Get out of stock products
router.get('/api/inventory/out-of-stock', authenticate, requireAdmin, inventoryController.getOutOfStock);

// Create inventory record
router.post('/api/inventory', authenticate, requireAdmin, inventoryController.createInventory);

// Update inventory quantity
router.put('/api/inventory/product/:productId/quantity', authenticate, requireAdmin, inventoryController.updateQuantity);

// Adjust inventory quantity (add/subtract)
router.patch('/api/inventory/product/:productId/adjust', authenticate, requireAdmin, inventoryController.adjustQuantity);

// Update low stock threshold
router.patch('/api/inventory/product/:productId/threshold', authenticate, requireAdmin, inventoryController.updateThreshold);

// ============================================
// INTERNAL ROUTES (Admin only - for order processing)
// ============================================

// Reserve inventory
router.post('/api/inventory/product/:productId/reserve', authenticate, requireAdmin, inventoryController.reserveInventory);

// Release reserved inventory
router.post('/api/inventory/product/:productId/release', authenticate, requireAdmin, inventoryController.releaseInventory);

// Fulfill reserved inventory
router.post('/api/inventory/product/:productId/fulfill', authenticate, requireAdmin, inventoryController.fulfillInventory);

module.exports = router;
