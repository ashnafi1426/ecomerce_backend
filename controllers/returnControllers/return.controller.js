/**
 * RETURN CONTROLLER
 *
 * Handles HTTP requests for return/refund operations — Amazon-style full workflow.
 */

const returnService = require('../../services/returnServices/return.service');

/** GET /api/returns — Admin: all returns with customer info */
const getAllReturns = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const returns = await returnService.findAll({
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json(returns);
  } catch (error) {
    next(error);
  }
};

/** GET /api/returns/:id */
const getReturnById = async (req, res, next) => {
  try {
    const returnRequest = await returnService.findById(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({ error: 'Not Found', message: 'Return request not found' });
    }

    // Users can only view their own returns
    if (req.user.role !== 'admin' && req.user.role !== 'manager' &&
        returnRequest.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    res.json(returnRequest);
  } catch (error) {
    next(error);
  }
};

/** GET /api/returns/user/me — Customer: their returns */
const getMyReturns = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    const returns = await returnService.findByUserId(req.user.id, {
      status,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({ success: true, returns });
  } catch (error) {
    next(error);
  }
};

/** GET /api/returns/order/:orderId */
const getReturnsByOrder = async (req, res, next) => {
  try {
    const returns = await returnService.findByOrderId(req.params.orderId);

    if (req.user.role !== 'admin' && req.user.role !== 'manager' &&
        returns.length > 0 && returns[0].customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    res.json(returns);
  } catch (error) {
    next(error);
  }
};

/** GET /api/returns/recent — Admin */
const getRecentReturns = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const returns = await returnService.getRecent(limit ? parseInt(limit) : 10);
    res.json(returns);
  } catch (error) {
    next(error);
  }
};

/** GET /api/returns/stats/pending-count — Admin */
const getPendingCount = async (req, res, next) => {
  try {
    const count = await returnService.getPendingCount();
    res.json({ pendingCount: count });
  } catch (error) {
    next(error);
  }
};

/** GET /api/returns/stats — Admin */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await returnService.getStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/** POST /api/returns — Create return request */
const createReturn = async (req, res, next) => {
  try {
    const { orderId, reason, refundAmount, returnType, detailedDescription, productId, images } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Order ID and reason are required'
      });
    }

    const returnRequest = await returnService.create({
      orderId,
      userId: req.user.id,
      reason,
      refundAmount,
      returnType: returnType || 'other',
      detailedDescription,
      productId,
      images
    });

    res.status(201).json({
      message: 'Return request created successfully',
      return: returnRequest
    });
  } catch (error) {
    console.error('createReturn error:', error.message);
    next(error);
  }
};

/** PATCH /api/returns/:id/status — Admin: generic status update */
const updateReturnStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Validation Error', message: 'Status is required' });
    }

    const returnRequest = await returnService.updateStatus(req.params.id, status, req.user.id);
    res.json({ message: 'Return status updated successfully', return: returnRequest });
  } catch (error) {
    next(error);
  }
};

/** POST /api/returns/:id/approve — Admin: approve + set refund amount */
const approveReturn = async (req, res, next) => {
  try {
    const { refundAmount } = req.body;

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid refund amount is required'
      });
    }

    const returnRequest = await returnService.approve(req.params.id, req.user.id, refundAmount);
    res.json({ message: 'Return approved successfully', return: returnRequest });
  } catch (error) {
    next(error);
  }
};

/** POST /api/returns/:id/reject — Admin: reject with optional reason */
const rejectReturn = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const returnRequest = await returnService.reject(req.params.id, req.user.id, rejectionReason);
    res.json({ message: 'Return rejected successfully', return: returnRequest });
  } catch (error) {
    next(error);
  }
};

/** POST /api/returns/:id/mark-received — Admin: item arrived at warehouse */
const markReturnReceived = async (req, res, next) => {
  try {
    const returnRequest = await returnService.markReceived(req.params.id, req.user.id);
    res.json({ message: 'Return marked as received', return: returnRequest });
  } catch (error) {
    next(error);
  }
};

/** POST /api/returns/:id/mark-inspecting — Admin: start inspection */
const markReturnInspecting = async (req, res, next) => {
  try {
    const returnRequest = await returnService.markInspecting(req.params.id, req.user.id);
    res.json({ message: 'Return marked as inspecting', return: returnRequest });
  } catch (error) {
    next(error);
  }
};

/** POST /api/returns/:id/mark-inspected — Admin: save inspection result */
const markReturnInspected = async (req, res, next) => {
  try {
    const { inspectionNotes, inspectionPassed } = req.body;
    const returnRequest = await returnService.markInspected(
      req.params.id, req.user.id, inspectionNotes, inspectionPassed
    );
    res.json({ message: 'Inspection recorded', return: returnRequest });
  } catch (error) {
    next(error);
  }
};

/** POST /api/returns/:id/complete — Admin: finalise + refund */
const completeReturn = async (req, res, next) => {
  try {
    const { refundTransactionId } = req.body;
    const returnRequest = await returnService.complete(
      req.params.id, req.user.id, refundTransactionId || null
    );
    res.json({ message: 'Return completed and refund processed', return: returnRequest });
  } catch (error) {
    next(error);
  }
};

/** POST /api/returns/:id/cancel — Customer: cancel pending return */
const cancelReturn = async (req, res, next) => {
  try {
    const returnRequest = await returnService.cancel(req.params.id, req.user.id);
    res.json({ message: 'Return cancelled successfully', return: returnRequest });
  } catch (error) {
    if (error.message === 'Only pending returns can be cancelled') {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Forbidden', message: error.message });
    }
    next(error);
  }
};

// ── Customer: shipping & images ──────────────────────────────────────────────

/** POST /api/returns/:id/shipping — Customer provides tracking after approval */
const updateShippingInfo = async (req, res, next) => {
  try {
    const { trackingNumber, carrier } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Tracking number is required'
      });
    }

    const returnRequest = await returnService.updateShippingInfo(
      req.params.id, req.user.id, trackingNumber, carrier || null
    );
    res.json({ message: 'Shipping info updated', return: returnRequest });
  } catch (error) {
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Forbidden', message: error.message });
    }
    if (error.message === 'Can only add shipping info to approved returns') {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    next(error);
  }
};

/** PUT /api/returns/:id/images — Customer updates evidence images */
const updateImages = async (req, res, next) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Images array is required'
      });
    }

    const returnRequest = await returnService.updateImages(
      req.params.id, req.user.id, images
    );
    res.json({ message: 'Images updated', return: returnRequest });
  } catch (error) {
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Forbidden', message: error.message });
    }
    if (error.message === 'Can only update images on pending or approved returns') {
      return res.status(400).json({ error: 'Bad Request', message: error.message });
    }
    next(error);
  }
};

// ── Seller endpoints ─────────────────────────────────────────────────────────

/** GET /api/seller/returns — Seller: returns for their products */
const getSellerReturns = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    const returns = await returnService.findBySellerId(req.user.id, {
      status,
      limit: limit ? parseInt(limit) : undefined
    });
    res.json({ success: true, count: returns.length, returns });
  } catch (error) {
    next(error);
  }
};

/** GET /api/seller/returns/stats — Seller: return statistics */
const getSellerReturnStats = async (req, res, next) => {
  try {
    const stats = await returnService.getSellerStatistics(req.user.id);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// ── Seller action helpers ────────────────────────────────────────────────────

/** Verify a return belongs to this seller before allowing an action */
const verifySellerOwnership = async (returnId, sellerId) => {
  const ret = await returnService.findById(returnId);
  if (!ret) throw Object.assign(new Error('Return not found'), { status: 404 });
  if (ret.seller_id !== sellerId) throw Object.assign(new Error('This return does not belong to your store'), { status: 403 });
  return ret;
};

/** POST /api/seller/returns/:id/authorize — Seller: approve return + set refund */
const sellerAuthorizeReturn = async (req, res, next) => {
  try {
    await verifySellerOwnership(req.params.id, req.user.id);
    const { refundAmount } = req.body;
    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'Valid refund amount is required' });
    }
    const result = await returnService.approve(req.params.id, req.user.id, refundAmount);
    res.json({ success: true, message: 'Return authorized', return: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

/** POST /api/seller/returns/:id/close — Seller: reject/close return with reason */
const sellerCloseReturn = async (req, res, next) => {
  try {
    await verifySellerOwnership(req.params.id, req.user.id);
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ error: 'Validation Error', message: 'Reason for closing is required' });
    }
    const result = await returnService.reject(req.params.id, req.user.id, rejectionReason);
    res.json({ success: true, message: 'Return request closed', return: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

/** POST /api/seller/returns/:id/receive — Seller: mark returned item as received */
const sellerMarkReceived = async (req, res, next) => {
  try {
    await verifySellerOwnership(req.params.id, req.user.id);
    const result = await returnService.markReceived(req.params.id, req.user.id);
    res.json({ success: true, message: 'Item marked as received', return: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

/** POST /api/seller/returns/:id/inspect — Seller: record inspection result */
const sellerInspectReturn = async (req, res, next) => {
  try {
    await verifySellerOwnership(req.params.id, req.user.id);
    const { inspectionNotes, inspectionPassed } = req.body;
    // Start inspection
    await returnService.markInspecting(req.params.id, req.user.id);
    // Record result
    const result = await returnService.markInspected(req.params.id, req.user.id, inspectionNotes, inspectionPassed);
    res.json({ success: true, message: 'Inspection recorded', return: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

/** POST /api/seller/returns/:id/issue-refund — Seller: complete return + issue refund */
const sellerIssueRefund = async (req, res, next) => {
  try {
    await verifySellerOwnership(req.params.id, req.user.id);
    const result = await returnService.complete(req.params.id, req.user.id, null);
    res.json({ success: true, message: 'Refund issued successfully — money returned to customer via Stripe', return: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    // Stripe refund failure — return completed but money not sent
    if (error.message && error.message.includes('Stripe refund failed')) {
      return res.status(502).json({ success: false, message: error.message, refundFailed: true });
    }
    next(error);
  }
};

/** POST /api/seller/returns/:id/retry-refund — Seller: retry failed Stripe refund */
const sellerRetryRefund = async (req, res, next) => {
  try {
    await verifySellerOwnership(req.params.id, req.user.id);
    const result = await returnService.retryRefund(req.params.id, req.user.id);
    res.json({ success: true, message: 'Stripe refund retried successfully — money returned to customer', return: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    next(error);
  }
};

/** POST /api/returns/:id/retry-refund — Admin: retry failed Stripe refund */
const adminRetryRefund = async (req, res, next) => {
  try {
    const result = await returnService.retryRefund(req.params.id, req.user.id);
    res.json({ success: true, message: 'Stripe refund retried successfully', return: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReturns,
  getReturnById,
  getMyReturns,
  getReturnsByOrder,
  getRecentReturns,
  getPendingCount,
  getStatistics,
  createReturn,
  updateReturnStatus,
  approveReturn,
  rejectReturn,
  markReturnReceived,
  markReturnInspecting,
  markReturnInspected,
  completeReturn,
  cancelReturn,
  updateShippingInfo,
  updateImages,
  getSellerReturns,
  getSellerReturnStats,
  sellerAuthorizeReturn,
  sellerCloseReturn,
  sellerMarkReceived,
  sellerInspectReturn,
  sellerIssueRefund,
  sellerRetryRefund,
  adminRetryRefund
};
