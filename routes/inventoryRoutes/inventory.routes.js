const express = require('express');
const {
  reserveInventory,
  releaseReservation,
  checkAvailability,
  getInventoryStatus,
  expireOldReservations,
  getActiveReservations
} = require('../../controllers/inventoryControllers/inventory.controller.js');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware.js');
const { requireRole, requireAnyRole } = require('../../middlewares/role.middleware.js');

const router = express.Router();

/**
 * Public Routes
 */

// Check product availability (public)
router.get('/check/:productId', checkAvailability);

/**
 * Authenticated Routes (Customer)
 */

// Reserve inventory during checkout (requires authentication)
router.post('/reserve', authenticate, reserveInventory);

// Release reservation (requires authentication)
router.post('/release/:reservationId', authenticate, releaseReservation);

/**
 * Admin/Manager Routes
 */

// Get inventory status
router.get('/status', authenticate, requireAnyRole(['admin', 'manager']), getInventoryStatus);

// Get active reservations
router.get('/reservations', authenticate, requireAnyRole(['admin', 'manager']), getActiveReservations);

// Expire old reservations (cron job endpoint)
router.post('/expire-reservations', authenticate, requireRole('admin'), expireOldReservations);

module.exports = router;
