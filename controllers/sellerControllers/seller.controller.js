/**
 * SELLER CONTROLLER
 * 
 * Handles HTTP requests for seller operations.
 */

const sellerService = require('../../services/sellerServices/seller.service');

/**
 * Register as seller
 */
const registerSeller = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { businessName, businessAddress, taxId } = req.body;
    
    if (!businessName || !businessAddress) {
      return res.status(400).json({
        success: false,
        message: 'Business name and address are required'
      });
    }
    
    const seller = await sellerService.registerSeller(userId, {
      businessName,
      businessAddress,
      taxId
    });
    
    res.status(200).json({
      success: true,
      message: 'Seller registration submitted. Awaiting verification.',
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller profile
 */
const getProfile = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const profile = await sellerService.getSellerProfile(sellerId);
    
    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload seller document
 */
const uploadDocument = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { documentType, documentUrl, documentName, fileSize, mimeType } = req.body;
    
    if (!documentType || !documentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Document type and URL are required'
      });
    }
    
    const document = await sellerService.uploadDocument(sellerId, {
      documentType,
      documentUrl,
      documentName,
      fileSize,
      mimeType
    });
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller documents
 */
const getDocuments = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const documents = await sellerService.getDocuments(sellerId);
    
    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller performance metrics
 */
const getPerformance = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const performance = await sellerService.getPerformanceMetrics(sellerId);
    
    res.status(200).json({
      success: true,
      performance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller earnings
 */
const getEarnings = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { payoutStatus, limit } = req.query;
    
    const filters = {};
    if (payoutStatus) filters.payoutStatus = payoutStatus;
    if (limit) filters.limit = parseInt(limit);
    
    const earnings = await sellerService.getEarnings(sellerId, filters);
    
    res.status(200).json({
      success: true,
      count: earnings.length,
      earnings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request payout
 */
const requestPayout = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const { amount, paymentMethod, paymentDetails } = req.body;
    
    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment method are required'
      });
    }
    
    const payoutRequest = await sellerService.requestPayout(sellerId, {
      amount,
      paymentMethod,
      paymentDetails
    });
    
    res.status(201).json({
      success: true,
      message: 'Payout request submitted',
      payoutRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payout requests
 */
const getPayoutRequests = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const payoutRequests = await sellerService.getPayoutRequests(sellerId);
    
    res.status(200).json({
      success: true,
      count: payoutRequests.length,
      payoutRequests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get seller dashboard stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    
    const stats = await sellerService.getDashboardStats(sellerId);
    
    // Return data directly (not wrapped in stats object)
    // API interceptor will extract response.data
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all sellers (admin/manager only)
 */
const getAllSellers = async (req, res, next) => {
  try {
    const { verificationStatus, limit } = req.query;
    
    const filters = {};
    if (verificationStatus) filters.verificationStatus = verificationStatus;
    if (limit) filters.limit = parseInt(limit);
    
    const sellers = await sellerService.getAllSellers(filters);
    
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
 * Verify seller (manager/admin only)
 */
const verifySeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;
    const { status, reason } = req.body;
    const verifiedBy = req.user.id;
    
    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (verified or rejected) is required'
      });
    }
    
    if (status === 'rejected' && !reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    const seller = await sellerService.verifySeller(sellerId, verifiedBy, status, reason);
    
    res.status(200).json({
      success: true,
      message: `Seller ${status} successfully`,
      seller
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify seller document (manager/admin only)
 */
const verifyDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { status, reason } = req.body;
    const verifiedBy = req.user.id;
    
    if (!status || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (verified or rejected) is required'
      });
    }
    
    const document = await sellerService.verifyDocument(documentId, verifiedBy, status, reason);
    
    res.status(200).json({
      success: true,
      message: `Document ${status} successfully`,
      document
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerSeller,
  getProfile,
  uploadDocument,
  getDocuments,
  getPerformance,
  getEarnings,
  requestPayout,
  getPayoutRequests,
  getDashboardStats,
  getAllSellers,
  verifySeller,
  verifyDocument
};
