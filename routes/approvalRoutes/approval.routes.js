/**
 * APPROVAL ROUTES
 *
 * Routes for Amazon-style product approval workflow.
 *
 * IMPORTANT: Static routes MUST come before parameterized routes
 */

const express = require('express');
const router = express.Router();
const approvalController = require('../../controllers/approvalControllers/approval.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

// =====================================================
// STATIC ROUTES (must come BEFORE /:productId)
// =====================================================

/**
 * Get manager's approval queue
 * GET /api/approvals/queue
 */
router.get(
  '/queue',
  authenticate,
  requireRole(['manager', 'admin']),
  approvalController.getApprovalQueue
);

/**
 * Get manager approval statistics
 * GET /api/approvals/stats
 */
router.get(
  '/stats',
  authenticate,
  requireRole(['manager', 'admin']),
  approvalController.getApprovalStats
);

/**
 * Admin: Get all pending products across all stores
 * GET /api/approvals/all-pending
 */
router.get(
  '/all-pending',
  authenticate,
  requireRole(['admin']),
  approvalController.getAllPendingProducts
);

/**
 * Get pending products for approval
 * GET /api/approvals/products/pending
 */
router.get(
  '/products/pending',
  authenticate,
  requireRole(['manager', 'admin']),
  approvalController.getApprovalQueue
);

/**
 * Get pending sellers for approval
 * GET /api/approvals/sellers/pending
 */
router.get(
  '/sellers/pending',
  authenticate,
  requireRole(['manager', 'admin']),
  async (req, res, next) => {
    try {
      const supabase = require('../../config/supabase');

      const { data: sellers, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'seller')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        success: true,
        count: sellers?.length || 0,
        sellers: sellers || []
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// PARAMETERIZED ROUTES (must come AFTER static routes)
// =====================================================

/**
 * Approve product
 * POST /api/approvals/:productId/approve
 */
router.post(
  '/:productId/approve',
  authenticate,
  requireRole(['manager', 'admin']),
  approvalController.approveProduct
);

/**
 * Reject product
 * POST /api/approvals/:productId/reject
 */
router.post(
  '/:productId/reject',
  authenticate,
  requireRole(['manager', 'admin']),
  approvalController.rejectProduct
);

/**
 * Request changes on product
 * POST /api/approvals/:productId/request-changes
 */
router.post(
  '/:productId/request-changes',
  authenticate,
  requireRole(['manager', 'admin']),
  approvalController.requestChanges
);

/**
 * Get approval history for a product
 * GET /api/approvals/:productId/history
 */
router.get(
  '/:productId/history',
  authenticate,
  requireRole(['manager', 'admin']),
  approvalController.getApprovalHistory
);

module.exports = router;
