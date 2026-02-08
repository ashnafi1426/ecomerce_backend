/**
 * SELLER ROUTES
 * 
 * Routes for seller-specific operations.
 */

const express = require('express');
const router = express.Router();
const sellerController = require('../../controllers/sellerControllers/seller.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { requireSeller, requireAnyRole } = require('../../middlewares/role.middleware');

// Seller registration (authenticated users can upgrade to seller)
router.post('/api/seller/register', authenticate, sellerController.registerSeller);

// Seller profile and dashboard (seller only)
router.get('/api/seller/profile', authenticate, requireSeller, sellerController.getProfile);
router.get('/api/seller/dashboard', authenticate, requireSeller, sellerController.getDashboardStats);

// Seller documents (seller only)
router.post('/api/seller/documents', authenticate, requireSeller, sellerController.uploadDocument);
router.get('/api/seller/documents', authenticate, requireSeller, sellerController.getDocuments);

// Seller performance (seller only)
router.get('/api/seller/performance', authenticate, requireSeller, sellerController.getPerformance);

// Seller earnings and payouts (seller only)
router.get('/api/seller/earnings', authenticate, requireSeller, sellerController.getEarnings);
router.post('/api/seller/payout', authenticate, requireSeller, sellerController.requestPayout);
router.get('/api/seller/payouts', authenticate, requireSeller, sellerController.getPayoutRequests);

// Admin/Manager routes for seller management
router.get('/api/sellers', authenticate, requireAnyRole(['admin', 'manager']), sellerController.getAllSellers);
router.post('/api/sellers/:sellerId/verify', authenticate, requireAnyRole(['admin', 'manager']), sellerController.verifySeller);
router.post('/api/sellers/documents/:documentId/verify', authenticate, requireAnyRole(['admin', 'manager']), sellerController.verifyDocument);

module.exports = router;
