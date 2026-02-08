/**
 * MANAGER ROUTES
 * 
 * Routes for manager-specific operations.
 */

const express = require('express');
const router = express.Router();
const managerController = require('../../controllers/managerControllers/manager.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { requireAnyRole } = require('../../middlewares/role.middleware');

// Manager dashboard
router.get('/api/manager/dashboard', authenticate, requireAnyRole(['admin', 'manager']), managerController.getDashboardStats);

// Product approval workflow
router.get('/api/manager/products/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingProducts);
router.post('/api/manager/products/:productId/approve', authenticate, requireAnyRole(['admin', 'manager']), managerController.approveProduct);
router.post('/api/manager/products/:productId/reject', authenticate, requireAnyRole(['admin', 'manager']), managerController.rejectProduct);
router.post('/api/manager/products/:productId/revision', authenticate, requireAnyRole(['admin', 'manager']), managerController.requestProductRevision);

// Seller verification
router.get('/api/manager/sellers/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingSellers);

// Order oversight
router.get('/api/manager/orders', authenticate, requireAnyRole(['admin', 'manager']), managerController.getAllOrders);

// Dispute management
router.get('/api/manager/disputes/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingDisputes);
router.post('/api/manager/disputes/:disputeId/resolve', authenticate, requireAnyRole(['admin', 'manager']), managerController.resolveDispute);

// Return management
router.get('/api/manager/returns/pending', authenticate, requireAnyRole(['admin', 'manager']), managerController.getPendingReturns);
router.post('/api/manager/returns/:returnId/approve', authenticate, requireAnyRole(['admin', 'manager']), managerController.approveReturn);
router.post('/api/manager/returns/:returnId/reject', authenticate, requireAnyRole(['admin', 'manager']), managerController.rejectReturn);

// Activity log
router.get('/api/manager/activity', authenticate, requireAnyRole(['admin', 'manager']), managerController.getActivityLog);

module.exports = router;
