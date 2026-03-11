/**
 * RETURN ROUTES — Amazon-Style Full Workflow
 *
 * IMPORTANT: Static routes MUST come before parameterized routes
 */

const express = require('express');
const router = express.Router();
const rc = require('../../controllers/returnControllers/return.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin, requireSeller } = require('../../middlewares/role.middleware');

// ============================================
// STATIC ROUTES (before /:id)
// ============================================

// Customer: my returns
router.get('/api/returns/user/me', authenticate, rc.getMyReturns);

// Seller: returns for their products
router.get('/api/seller/returns/stats', authenticate, requireSeller, rc.getSellerReturnStats);
router.get('/api/seller/returns',       authenticate, requireSeller, rc.getSellerReturns);

// Seller: action routes (Amazon Seller Central style)
router.post('/api/seller/returns/:id/authorize',    authenticate, requireSeller, rc.sellerAuthorizeReturn);
router.post('/api/seller/returns/:id/close',        authenticate, requireSeller, rc.sellerCloseReturn);
router.post('/api/seller/returns/:id/receive',      authenticate, requireSeller, rc.sellerMarkReceived);
router.post('/api/seller/returns/:id/inspect',      authenticate, requireSeller, rc.sellerInspectReturn);
router.post('/api/seller/returns/:id/issue-refund', authenticate, requireSeller, rc.sellerIssueRefund);
router.post('/api/seller/returns/:id/retry-refund', authenticate, requireSeller, rc.sellerRetryRefund);

// Admin: recent, stats, all
router.get('/api/returns/recent',             authenticate, requireAdmin, rc.getRecentReturns);
router.get('/api/returns/stats/pending-count', authenticate, requireAdmin, rc.getPendingCount);
router.get('/api/returns/stats',              authenticate, requireAdmin, rc.getStatistics);
router.get('/api/returns',                    authenticate, requireAdmin, rc.getAllReturns);

// Create return request (authenticated customer)
router.post('/api/returns', authenticate, rc.createReturn);

// ============================================
// PARAMETERIZED — ORDER ID
// ============================================

router.get('/api/returns/order/:orderId', authenticate, rc.getReturnsByOrder);

// ============================================
// PARAMETERIZED — RETURN ID
// ============================================

// Read
router.get('/api/returns/:id', authenticate, rc.getReturnById);

// Customer: shipping info + images
router.post('/api/returns/:id/shipping', authenticate, rc.updateShippingInfo);
router.put('/api/returns/:id/images',    authenticate, rc.updateImages);

// Admin: status workflow
router.patch('/api/returns/:id/status',         authenticate, requireAdmin, rc.updateReturnStatus);
router.post('/api/returns/:id/approve',         authenticate, requireAdmin, rc.approveReturn);
router.post('/api/returns/:id/reject',          authenticate, requireAdmin, rc.rejectReturn);
router.post('/api/returns/:id/mark-received',   authenticate, requireAdmin, rc.markReturnReceived);
router.post('/api/returns/:id/mark-inspecting', authenticate, requireAdmin, rc.markReturnInspecting);
router.post('/api/returns/:id/mark-inspected',  authenticate, requireAdmin, rc.markReturnInspected);
router.post('/api/returns/:id/complete',        authenticate, requireAdmin, rc.completeReturn);
router.post('/api/returns/:id/retry-refund',    authenticate, requireAdmin, rc.adminRetryRefund);

// Customer: cancel their own pending return
router.post('/api/returns/:id/cancel', authenticate, rc.cancelReturn);

module.exports = router;
