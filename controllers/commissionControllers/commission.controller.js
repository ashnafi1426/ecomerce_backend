/**
 * COMMISSION CONTROLLER
 * 
 * Admin-only endpoints for managing commission rates.
 */

const commissionService = require('../../services/commissionServices/commission.service');

/**
 * Get all commission rates
 * GET /api/admin/commission-rates
 */
const getAllRates = async (req, res, next) => {
  try {
    const { rateType, isActive } = req.query;

    const rates = await commissionService.getAllRates({
      rateType,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    });

    res.json({
      rates,
      count: rates.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get commission rate by ID
 * GET /api/admin/commission-rates/:id
 */
const getRateById = async (req, res, next) => {
  try {
    const rate = await commissionService.findById(req.params.id);

    if (!rate) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Commission rate not found'
      });
    }

    res.json(rate);
  } catch (error) {
    next(error);
  }
};

/**
 * Create new commission rate
 * POST /api/admin/commission-rates
 */
const createRate = async (req, res, next) => {
  try {
    const { rateType, commissionPercentage, sellerId, categoryId, isActive } = req.body;

    // Validation
    if (!rateType || commissionPercentage === undefined) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Rate type and commission percentage are required'
      });
    }

    const rate = await commissionService.createRate({
      rateType,
      commissionPercentage,
      sellerId,
      categoryId,
      isActive
    });

    res.status(201).json({
      message: 'Commission rate created successfully',
      rate
    });
  } catch (error) {
    if (error.message.includes('Invalid rate type') || 
        error.message.includes('must be between') ||
        error.message.includes('is required')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Update commission rate
 * PUT /api/admin/commission-rates/:id
 */
const updateRate = async (req, res, next) => {
  try {
    const { commissionPercentage, isActive } = req.body;

    const rate = await commissionService.updateRate(req.params.id, {
      commissionPercentage,
      isActive
    });

    res.json({
      message: 'Commission rate updated successfully',
      rate
    });
  } catch (error) {
    if (error.message.includes('must be between')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Delete commission rate
 * DELETE /api/admin/commission-rates/:id
 */
const deleteRate = async (req, res, next) => {
  try {
    await commissionService.deleteRate(req.params.id);

    res.json({
      message: 'Commission rate deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRates,
  getRateById,
  createRate,
  updateRate,
  deleteRate
};
