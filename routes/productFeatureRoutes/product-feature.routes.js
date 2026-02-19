const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAnyRole } = require('../../middlewares/role.middleware');
const {
  getProductFeatures,
  addProductFeature,
  updateProductFeature,
  deleteProductFeature,
  reorderFeatures
} = require('../../controllers/productFeatureControllers/product-feature.controller');

// Public routes
router.get('/:productId/features', getProductFeatures);

// Protected routes (seller/admin only)
router.post('/:productId/features', authenticate, requireAnyRole(['seller', 'admin']), addProductFeature);
router.put('/:productId/features/:featureId', authenticate, requireAnyRole(['seller', 'admin']), updateProductFeature);
router.delete('/:productId/features/:featureId', authenticate, requireAnyRole(['seller', 'admin']), deleteProductFeature);
router.put('/:productId/features/reorder', authenticate, requireAnyRole(['seller', 'admin']), reorderFeatures);

module.exports = router;
