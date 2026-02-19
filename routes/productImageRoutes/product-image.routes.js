const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAnyRole } = require('../../middlewares/role.middleware');
const {
  getProductImages,
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
  reorderProductImages
} = require('../../controllers/productImageControllers/product-image.controller');

// Public routes
router.get('/:productId/images', getProductImages);

// Protected routes (seller/admin only)
router.post('/:productId/images', authenticate, requireAnyRole(['seller', 'admin']), uploadProductImage);
router.put('/:productId/images/:imageId', authenticate, requireAnyRole(['seller', 'admin']), updateProductImage);
router.delete('/:productId/images/:imageId', authenticate, requireAnyRole(['seller', 'admin']), deleteProductImage);
router.put('/:productId/images/reorder', authenticate, requireAnyRole(['seller', 'admin']), reorderProductImages);

module.exports = router;
