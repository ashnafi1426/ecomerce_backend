/**
 * INVENTORY CONTROLLER
 * 
 * Handles HTTP requests for inventory/stock management operations.
 */

const inventoryService = require('../../services/inventoryServices/inventory.service');

/**
 * Get all inventory records
 * GET /api/inventory
 */
const getAllInventory = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const inventory = await inventoryService.findAll({
      limit: limit ? parseInt(limit) : undefined
    });
    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory by product ID
 * GET /api/inventory/product/:productId
 */
const getInventoryByProduct = async (req, res, next) => {
  try {
    const inventory = await inventoryService.findByProductId(req.params.productId);
    
    if (!inventory) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inventory not found for this product'
      });
    }
    
    res.json(inventory);
  } catch (error) {
    next(error);
  }
};

/**
 * Get available quantity for product
 * GET /api/inventory/product/:productId/available
 */
const getAvailableQuantity = async (req, res, next) => {
  try {
    const available = await inventoryService.getAvailable(req.params.productId);
    res.json({ 
      productId: req.params.productId,
      available 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if product has sufficient stock
 * GET /api/inventory/product/:productId/check?quantity=10
 */
const checkStock = async (req, res, next) => {
  try {
    const { quantity } = req.query;
    
    if (!quantity) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quantity parameter is required'
      });
    }

    const hasStock = await inventoryService.hasStock(
      req.params.productId, 
      parseInt(quantity)
    );
    
    res.json({ 
      productId: req.params.productId,
      requiredQuantity: parseInt(quantity),
      hasStock 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products (Admin only)
 * GET /api/inventory/low-stock
 */
const getLowStock = async (req, res, next) => {
  try {
    const lowStock = await inventoryService.getLowStock();
    res.json(lowStock);
  } catch (error) {
    next(error);
  }
};

/**
 * Get out of stock products (Admin only)
 * GET /api/inventory/out-of-stock
 */
const getOutOfStock = async (req, res, next) => {
  try {
    const outOfStock = await inventoryService.getOutOfStock();
    res.json(outOfStock);
  } catch (error) {
    next(error);
  }
};

/**
 * Create inventory record (Admin only)
 * POST /api/inventory
 */
const createInventory = async (req, res, next) => {
  try {
    const { productId, quantity, lowStockThreshold } = req.body;

    if (!productId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product ID is required'
      });
    }

    // Check if inventory already exists
    const existing = await inventoryService.findByProductId(productId);
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Inventory already exists for this product'
      });
    }

    const inventory = await inventoryService.create({
      productId,
      quantity,
      lowStockThreshold
    });

    res.status(201).json({
      message: 'Inventory created successfully',
      inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update inventory quantity (Admin only)
 * PUT /api/inventory/product/:productId/quantity
 */
const updateQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid quantity is required'
      });
    }

    const inventory = await inventoryService.updateQuantity(
      req.params.productId,
      quantity
    );

    res.json({
      message: 'Inventory quantity updated successfully',
      inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust inventory quantity (Admin only)
 * PATCH /api/inventory/product/:productId/adjust
 */
const adjustQuantity = async (req, res, next) => {
  try {
    const { adjustment } = req.body;

    if (adjustment === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Adjustment value is required'
      });
    }

    const inventory = await inventoryService.adjustQuantity(
      req.params.productId,
      adjustment
    );

    res.json({
      message: 'Inventory adjusted successfully',
      inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reserve inventory (Internal use)
 * POST /api/inventory/product/:productId/reserve
 */
const reserveInventory = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid quantity is required'
      });
    }

    const inventory = await inventoryService.reserve(
      req.params.productId,
      quantity
    );

    res.json({
      message: 'Inventory reserved successfully',
      inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Release reserved inventory (Internal use)
 * POST /api/inventory/product/:productId/release
 */
const releaseInventory = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid quantity is required'
      });
    }

    const inventory = await inventoryService.release(
      req.params.productId,
      quantity
    );

    res.json({
      message: 'Inventory released successfully',
      inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fulfill reserved inventory (Internal use)
 * POST /api/inventory/product/:productId/fulfill
 */
const fulfillInventory = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid quantity is required'
      });
    }

    const inventory = await inventoryService.fulfill(
      req.params.productId,
      quantity
    );

    res.json({
      message: 'Inventory fulfilled successfully',
      inventory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update low stock threshold (Admin only)
 * PATCH /api/inventory/product/:productId/threshold
 */
const updateThreshold = async (req, res, next) => {
  try {
    const { threshold } = req.body;

    if (threshold === undefined || threshold < 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid threshold is required'
      });
    }

    const inventory = await inventoryService.updateThreshold(
      req.params.productId,
      threshold
    );

    res.json({
      message: 'Low stock threshold updated successfully',
      inventory
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllInventory,
  getInventoryByProduct,
  getAvailableQuantity,
  checkStock,
  getLowStock,
  getOutOfStock,
  createInventory,
  updateQuantity,
  adjustQuantity,
  reserveInventory,
  releaseInventory,
  fulfillInventory,
  updateThreshold
};

