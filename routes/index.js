/**
 * Central router that imports and combines all route modules.
 * This follows the organized folder structure pattern.
 */
const express = require('express');
const router = express.Router();

// Import routes from organized folders
const authRouter = require('./authRoutes/auth.routes');
const userRouter = require('./userRoutes/user.routes');
const productRouter = require('./productRoutes/product.routes');
const orderRouter = require('./orderRoutes/order.routes');
const adminRouter = require('./adminRoutes/admin.routes');
const categoryRouter = require('./categoryRoutes/category.routes');
const inventoryRouter = require('./inventoryRoutes/inventory.routes');
const returnRouter = require('./returnRoutes/return.routes');
const addressRouter = require('./addressRoutes/address.routes');
const auditLogRouter = require('./auditLogRoutes/auditLog.routes');
const cartRouter = require('./cartRoutes/cart.routes');
const paymentRouter = require('./paymentRoutes/payment.routes');
const reviewRouter = require('./reviewRoutes/review.routes');
const analyticsRouter = require('./analyticsRoutes/analytics.routes');
const commissionRouter = require('./commissionRoutes/commission.routes');
const sellerBalanceRouter = require('./sellerBalanceRoutes/sellerBalance.routes');
const subOrderRouter = require('./subOrderRoutes/subOrder.routes');

// Phase 5: Multi-vendor feature routes
const sellerRouter = require('./sellerRoutes/seller.routes');
const managerRouter = require('./managerRoutes/manager.routes');
const notificationRouter = require('./notificationRoutes/notification.routes');
const disputeRouter = require('./disputeRoutes/dispute.routes');

// Phase 6: Product Variants System
const variantRouter = require('./variantRoutes/variant.routes');

// Discount and Promotion System
const couponRouter = require('./couponRoutes/coupon.routes');
const promotionRouter = require('./promotionRoutes/promotion.routes');

// Delivery Rating System
const deliveryRatingRouter = require('./deliveryRatingRoutes/deliveryRating.routes');

// Replacement Process System
const replacementRouter = require('./replacementRoutes/replacement.routes');

// Enhanced Refund Process System
const refundRouter = require('./refundRoutes/enhancedRefund.routes');

// Add routes to the main router
router.use(authRouter);
router.use(userRouter);
router.use(productRouter);
router.use(orderRouter);
router.use(adminRouter);
router.use(categoryRouter);
router.use(inventoryRouter);
router.use(returnRouter);
router.use(addressRouter);
router.use(auditLogRouter);
router.use(cartRouter);
router.use(paymentRouter);
router.use(reviewRouter);
router.use(analyticsRouter);
router.use(commissionRouter);
router.use(sellerBalanceRouter);
router.use(subOrderRouter);

// Phase 5: Multi-vendor feature routes
router.use(sellerRouter);
router.use(managerRouter);
router.use(notificationRouter);
router.use(disputeRouter);

// Phase 6: Product Variants System
router.use(variantRouter);

// Discount and Promotion System
router.use('/api/coupons', couponRouter);
router.use('/api/promotions', promotionRouter);

// Delivery Rating System
router.use('/api/delivery-ratings', deliveryRatingRouter);

// Replacement Process System
router.use('/api/replacements', replacementRouter);

// Enhanced Refund Process System
router.use('/api/refunds', refundRouter);

// Export the router
module.exports = router;
