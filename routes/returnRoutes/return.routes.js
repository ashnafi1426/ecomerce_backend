/**
 * RETURN ROUTES
 *
 * Routes for return/refund operations.
 *
 * IMPORTANT: Static routes MUST come before parameterized routes
 */

const express = require('express');
const router = express.Router();
const returnController = require('../../controllers/returnControllers/return.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// STATIC ROUTES (must come BEFORE /:id)
// ============================================

// Get user's returns
router.get('/api/returns/user/me', authenticate, returnController.getMyReturns);

// Get recent returns (admin only)
router.get('/api/returns/recent', authenticate, requireAdmin, returnController.getRecentReturns);

// Get pending returns count (admin only)
router.get('/api/returns/stats/pending-count', authenticate, requireAdmin, returnController.getPendingCount);

// Get return statistics (admin only)
router.get('/api/returns/stats', authenticate, requireAdmin, returnController.getStatistics);

// Create return request
router.post('/api/returns', authenticate, returnController.createReturn);

// Get all returns (admin only)
router.get('/api/returns', authenticate, requireAdmin, returnController.getAllReturns);

// ============================================
// PARAMETERIZED ROUTES (must come AFTER static routes)
// ============================================

// Get returns by order ID
router.get('/api/returns/order/:orderId', authenticate, returnController.getReturnsByOrder);

// Get return by ID
router.get('/api/returns/:id', authenticate, returnController.getReturnById);

// Update return status (admin only)
router.patch('/api/returns/:id/status', authenticate, requireAdmin, returnController.updateReturnStatus);

// Approve return (admin only)
router.post('/api/returns/:id/approve', authenticate, requireAdmin, returnController.approveReturn);

// Reject return (admin only)
router.post('/api/returns/:id/reject', authenticate, requireAdmin, returnController.rejectReturn);

// Complete return (admin only)
router.post('/api/returns/:id/complete', authenticate, requireAdmin, returnController.completeReturn);

module.exports = router;
