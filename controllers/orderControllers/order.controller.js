/**
 * ORDER CONTROLLER
 * 
 * Handles order creation and retrieval for customers.
 */

const orderService = require('../../services/orderServices/order.service');
const paymentService = require('../../services/paymentServices/payment.service');
const { createPaymentIntent } = require('../../config/stripe');

/**
 * Create new order and payment intent
 * POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const { basket, shippingAddress } = req.body;

    // Validation
    if (!basket || !Array.isArray(basket) || basket.length === 0) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Basket is required and must contain items' 
      });
    }

    // Calculate total amount (in cents)
    const amount = basket.reduce((total, item) => {
      return total + (item.price * item.quantity * 100);
    }, 0);

    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Order amount must be greater than 0' 
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(amount);

    // Create order in database
    const order = await orderService.create({
      userId: req.user.id,
      paymentIntentId: paymentIntent.id,
      amount: Math.round(amount),
      basket,
      shippingAddress: shippingAddress || null,
      status: 'pending_payment'
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        amount: order.amount,
        status: order.status,
        createdAt: order.created_at
      },
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders
 * GET /api/orders/my
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { status, limit } = req.query;

    const orders = await orderService.findByUserId(req.user.id, {
      status,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID (user can only access their own orders)
 * GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await orderService.findById(id);

    if (!order) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Order not found' 
      });
    }

    // Check if order belongs to user (unless admin)
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Access denied' 
      });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment (webhook handler)
 * POST /api/orders/:id/confirm
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentIntentId } = req.body;

    const order = await orderService.findById(id);

    if (!order) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Order not found' 
      });
    }

    // Verify payment intent matches
    if (order.payment_intent_id !== paymentIntentId) {
      return res.status(400).json({ 
        error: 'Validation Error',
        message: 'Payment intent mismatch' 
      });
    }

    // Update order status
    await orderService.updateStatus(id, 'paid');

    // Create payment record
    await paymentService.create({
      orderId: id,
      paymentIntentId,
      amount: order.amount,
      paymentMethod: 'card',
      status: 'succeeded'
    });

    res.json({
      message: 'Payment confirmed successfully',
      orderId: id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  confirmPayment
};

