/**
 * MANAGER CONTROLLER
 * 
 * Handles HTTP requests for manager operations.
 */

const managerService = require('../../services/managerServices/manager.service');

/**
 * Get manager dashboard stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await managerService.getDashboardStats();
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending products for approval
 */
const getPendingProducts = async (req, res, next) => {
  try {
    const { limit } = req.query;
    
    const filters = {};
    if (limit) filters.limit = parseInt(limit);
    
    const products = await managerService.getPendingProducts(filters);
    
    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve product
 */
const approveProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { comments } = req.body;
    const managerId = req.user.id;
    
    const product = await managerService.approveProduct(productId, managerId, comments);
    
    res.status(200).json({
      success: true,
      message: 'Product approved successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject product
 */
const rejectProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const product = await managerService.rejectProduct(productId, managerId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Product rejected',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request product revision
 */
const requestProductRevision = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { comments } = req.body;
    const managerId = req.user.id;
    
    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'Revision comments are required'
      });
    }
    
    const product = await managerService.requestProductRevision(productId, managerId, comments);
    
    res.status(200).json({
      success: true,
      message: 'Revision requested',
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending sellers
 */
const getPendingSellers = async (req, res, next) => {
  try {
    const sellers = await managerService.getPendingSellers();
    
    res.status(200).json({
      success: true,
      count: sellers.length,
      sellers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);
    
    const orders = await managerService.getAllOrders(filters);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending disputes
 */
const getPendingDisputes = async (req, res, next) => {
  try {
    const disputes = await managerService.getPendingDisputes();
    
    res.status(200).json({
      success: true,
      count: disputes.length,
      disputes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve dispute
 */
const resolveDispute = async (req, res, next) => {
  try {
    const { disputeId } = req.params;
    const { resolution, comments } = req.body;
    const managerId = req.user.id;
    
    if (!resolution || !comments) {
      return res.status(400).json({
        success: false,
        message: 'Resolution and comments are required'
      });
    }
    
    const dispute = await managerService.resolveDispute(disputeId, managerId, resolution, comments);
    
    res.status(200).json({
      success: true,
      message: 'Dispute resolved',
      dispute
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending returns
 */
const getPendingReturns = async (req, res, next) => {
  try {
    const returns = await managerService.getPendingReturns();
    
    res.status(200).json({
      success: true,
      count: returns.length,
      returns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve return
 */
const approveReturn = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const { comments } = req.body;
    const managerId = req.user.id;
    
    const returnData = await managerService.approveReturn(returnId, managerId, comments);
    
    res.status(200).json({
      success: true,
      message: 'Return approved',
      return: returnData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject return
 */
const rejectReturn = async (req, res, next) => {
  try {
    const { returnId } = req.params;
    const { reason } = req.body;
    const managerId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const returnData = await managerService.rejectReturn(returnId, managerId, reason);
    
    res.status(200).json({
      success: true,
      message: 'Return rejected',
      return: returnData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activity log
 */
const getActivityLog = async (req, res, next) => {
  try {
    const managerId = req.user.id;
    const { limit } = req.query;
    
    const activities = await managerService.getActivityLog(managerId, limit ? parseInt(limit) : 50);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  requestProductRevision,
  getPendingSellers,
  getAllOrders,
  getPendingDisputes,
  resolveDispute,
  getPendingReturns,
  approveReturn,
  rejectReturn,
  getActivityLog
};
