const express = require('express');
const router = express.Router();
const commissionController = require('../../controllers/commissionControllers/commission.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/role.middleware');

// All commission rate endpoints are admin-only

// Get all commission rates
router.get('/api/admin/commission-rates', authenticate, requireAdmin, commissionController.getAllRates);

// Get commission rate by ID
router.get('/api/admin/commission-rates/:id', authenticate, requireAdmin, commissionController.getRateById);

// Create new commission rate
router.post('/api/admin/commission-rates', authenticate, requireAdmin, commissionController.createRate);

// Update commission rate
router.put('/api/admin/commission-rates/:id', authenticate, requireAdmin, commissionController.updateRate);

// Delete commission rate
router.delete('/api/admin/commission-rates/:id', authenticate, requireAdmin, commissionController.deleteRate);

module.exports = router;
