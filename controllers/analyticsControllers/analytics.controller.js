/**
 * ANALYTICS CONTROLLER
 * 
 * Handles HTTP requests for reports and analytics.
 * All endpoints are admin-only (enforced at route level).
 */

const analyticsService = require('../../services/analyticsServices/analytics.service');

/**
 * REQUIREMENT 1: Sales Reports
 */

/**
 * Get sales overview
 * GET /api/admin/analytics/sales/overview
 */
const getSalesOverview = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;

    const data = await analyticsService.getSalesOverview({
      startDate,
      endDate,
      status
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales by date
 * GET /api/admin/analytics/sales/by-date
 */
const getSalesByDate = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const data = await analyticsService.getSalesByDate({
      startDate,
      endDate,
      groupBy
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get top selling products
 * GET /api/admin/analytics/sales/top-products
 */
const getTopSellingProducts = async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;

    const data = await analyticsService.getTopSellingProducts({
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : 10
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * REQUIREMENT 2: Revenue Reports
 */

/**
 * Get revenue overview
 * GET /api/admin/analytics/revenue/overview
 */
const getRevenueOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await analyticsService.getRevenueOverview({
      startDate,
      endDate
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue by category
 * GET /api/admin/analytics/revenue/by-category
 */
const getRevenueByCategory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await analyticsService.getRevenueByCategory({
      startDate,
      endDate
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue trends
 * GET /api/admin/analytics/revenue/trends
 */
const getRevenueTrends = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await analyticsService.getRevenueTrends({
      startDate,
      endDate
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * REQUIREMENT 3: Customer Behavior Analytics
 */

/**
 * Get customer statistics
 * GET /api/admin/analytics/customers/statistics
 */
const getCustomerStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await analyticsService.getCustomerStatistics({
      startDate,
      endDate
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer segmentation
 * GET /api/admin/analytics/customers/segmentation
 */
const getCustomerSegmentation = async (req, res, next) => {
  try {
    const data = await analyticsService.getCustomerSegmentation();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer retention
 * GET /api/admin/analytics/customers/retention
 */
const getCustomerRetention = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await analyticsService.getCustomerRetention({
      startDate,
      endDate
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * REQUIREMENT 4: Inventory Reports
 */

/**
 * Get inventory overview
 * GET /api/admin/analytics/inventory/overview
 */
const getInventoryOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getInventoryOverview();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock products
 * GET /api/admin/analytics/inventory/low-stock
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const { limit } = req.query;

    const data = await analyticsService.getLowStockProducts(
      limit ? parseInt(limit) : 20
    );

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory turnover
 * GET /api/admin/analytics/inventory/turnover
 */
const getInventoryTurnover = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await analyticsService.getInventoryTurnover({
      startDate,
      endDate
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * Get comprehensive dashboard data
 * GET /api/admin/analytics/dashboard
 */
const getDashboardData = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await analyticsService.getDashboardData({
      startDate,
      endDate
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Sales Reports
  getSalesOverview,
  getSalesByDate,
  getTopSellingProducts,
  
  // Revenue Reports
  getRevenueOverview,
  getRevenueByCategory,
  getRevenueTrends,
  
  // Customer Behavior
  getCustomerStatistics,
  getCustomerSegmentation,
  getCustomerRetention,
  
  // Inventory Reports
  getInventoryOverview,
  getLowStockProducts,
  getInventoryTurnover,
  
  // Dashboard
  getDashboardData
};
