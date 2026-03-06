/**
 * DISPUTE ROUTES
 *
 * Routes for dispute operations.
 *
 * IMPORTANT: Static routes MUST come before parameterized routes
 */

const express = require('express');
const router = express.Router();
const disputeController = require('../../controllers/disputeControllers/dispute.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// ============================================
// STATIC ROUTES (must come BEFORE /:disputeId)
// ============================================

// Get dispute statistics (admin)
router.get('/api/disputes/stats', authenticate, requireAdmin, disputeController.getStatistics);

// Create dispute
router.post('/api/disputes', authenticate, disputeController.createDispute);

// Get user's disputes
router.get('/api/disputes', authenticate, disputeController.getUserDisputes);

// ============================================
// PARAMETERIZED ROUTES (must come AFTER static routes)
// ============================================

// Get dispute by ID
router.get('/api/disputes/:disputeId', authenticate, disputeController.getDisputeById);

// Add comment to dispute
router.post('/api/disputes/:disputeId/comment', authenticate, disputeController.addComment);

module.exports = router;
