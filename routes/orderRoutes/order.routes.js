/**
 * ORDER ROUTES
 * 
 * Routes for order creation and management (customer-facing).
 */

const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/orderControllers/order.controller');
const authenticate = require('../../middlewares/auth.middleware');

// All order routes require authentication
router.post('/api/orders', authenticate, orderController.createOrder);
router.get('/api/orders/my', authenticate, orderController.getMyOrders);
router.get('/api/orders/:id', authenticate, orderController.getOrderById);
router.post('/api/orders/:id/confirm', authenticate, orderController.confirmPayment);

module.exports = router;
