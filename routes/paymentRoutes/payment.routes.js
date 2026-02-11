const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');

// Import payment controller functions
// Note: These are ES6 modules, so we need to use dynamic import
let paymentController;

// Load the ES6 module controller
(async () => {
  paymentController = await import('../../controllers/paymentControllers/payment.controller.js');
})();

// Create payment intent (can be guest or authenticated)
// Use optionalAuthenticate to attach user if logged in, but allow guests
router.post('/api/payments/create-intent', optionalAuthenticate, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.createPaymentIntent(req, res);
});

// Create order after payment success (no webhooks)
// Use optionalAuthenticate to attach user if logged in, but allow guests
router.post('/api/payments/create-order', optionalAuthenticate, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.createOrderAfterPayment(req, res);
});

// Get payment status
router.get('/api/payments/:paymentIntentId', async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.getPaymentStatus(req, res);
});

// Cancel payment (requires authentication)
router.post('/api/payments/:paymentIntentId/cancel', authenticate, async (req, res) => {
  if (!paymentController) {
    return res.status(503).json({ error: 'Service initializing, please try again' });
  }
  return paymentController.cancelPayment(req, res);
});

module.exports = router;
