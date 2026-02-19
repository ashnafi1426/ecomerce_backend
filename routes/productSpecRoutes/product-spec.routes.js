const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAnyRole } = require('../../middlewares/role.middleware');
const {
  getProductSpecifications,
  addProductSpecification,
  updateProductSpecification,
  deleteProductSpecification,
  bulkAddSpecifications
} = require('../../controllers/productSpecControllers/product-spec.controller');

// Public routes
router.get('/:productId/specifications', getProductSpecifications);

// Protected routes (seller/admin only)
router.post('/:productId/specifications', authenticate, requireAnyRole(['seller', 'admin']), addProductSpecification);
router.post('/:productId/specifications/bulk', authenticate, requireAnyRole(['seller', 'admin']), bulkAddSpecifications);
router.put('/:productId/specifications/:specId', authenticate, requireAnyRole(['seller', 'admin']), updateProductSpecification);
router.delete('/:productId/specifications/:specId', authenticate, requireAnyRole(['seller', 'admin']), deleteProductSpecification);

module.exports = router;
