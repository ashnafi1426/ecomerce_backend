/**
 * CATEGORY CONTROLLER
 * 
 * Handles HTTP requests for category operations.
 */

const categoryService = require('../../services/categoryServices/category.service');

/**
 * Get all categories
 * GET /api/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.findAll();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get category hierarchy (tree structure)
 * GET /api/categories/hierarchy
 */
const getCategoryHierarchy = async (req, res, next) => {
  try {
    const hierarchy = await categoryService.getHierarchy();
    res.json(hierarchy);
  } catch (error) {
    next(error);
  }
};

/**
 * Get root categories
 * GET /api/categories/root
 */
const getRootCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getRootCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoryService.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Category not found'
      });
    }
    
    res.json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategories of a category
 * GET /api/categories/:id/subcategories
 */
const getSubcategories = async (req, res, next) => {
  try {
    const subcategories = await categoryService.getSubcategories(req.params.id);
    res.json(subcategories);
  } catch (error) {
    next(error);
  }
};

/**
 * Get products in category
 * GET /api/categories/:id/products
 */
const getCategoryProducts = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const products = await categoryService.getProducts(req.params.id, {
      limit: limit ? parseInt(limit) : undefined
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category (Admin only)
 * POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existing = await categoryService.findByName(name);
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Category with this name already exists'
      });
    }

    const category = await categoryService.create({
      name,
      description,
      parentId
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category (Admin only)
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, description, parentId } = req.body;

    const category = await categoryService.update(req.params.id, {
      name,
      description,
      parentId
    });

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category (Admin only)
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryHierarchy,
  getRootCategories,
  getCategoryById,
  getSubcategories,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory
};

