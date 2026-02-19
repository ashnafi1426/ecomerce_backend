const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAnyRole } = require('../../middlewares/role.middleware');
const {
  getProductBadges,
  assignBadge,
  removeBadge
} = require('../../controllers/badgeControllers/badge.controller');

// Public routes
router.get('/:productId/badges', getProductBadges);

// Admin only routes
router.post('/:productId/badges', authenticate, requireAnyRole(['admin']), assignBadge);
router.delete('/badges/:badgeId', authenticate, requireAnyRole(['admin']), removeBadge);

module.exports = router;
