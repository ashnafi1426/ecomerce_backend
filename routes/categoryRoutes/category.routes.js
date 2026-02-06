/**
 * CATEGORY ROUTES
 * 
 * Routes for category operations.
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/categoryControllers/category.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get all categories
router.get('/api/categories', categoryController.getAllCategories);

// Get category hierarchy (tree structure)
router.get('/api/categories/hierarchy', categoryController.getCategoryHierarchy);

// Get root categories
router.get('/api/categories/root', categoryController.getRootCategories);

// Get category by ID
router.get('/api/categories/:id', categoryController.getCategoryById);

// Get subcategories of a category
router.get('/api/categories/:id/subcategories', categoryController.getSubcategories);

// Get products in category
router.get('/api/categories/:id/products', categoryController.getCategoryProducts);

// ============================================
// ADMIN ROUTES
// ============================================

// Create new category
router.post('/api/categories', authenticate, requireAdmin, categoryController.createCategory);

// Update category
router.put('/api/categories/:id', authenticate, requireAdmin, categoryController.updateCategory);

// Delete category
router.delete('/api/categories/:id', authenticate, requireAdmin, categoryController.deleteCategory);

module.exports = router;
