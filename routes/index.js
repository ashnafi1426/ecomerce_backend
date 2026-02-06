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

// Export the router
module.exports = router;
