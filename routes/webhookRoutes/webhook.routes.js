const express = require('express');
const { handleStripeWebhook } = require('../../controllers/webhookControllers/webhook.controller.js');

const router = express.Router();

// Stripe webhook endpoint
// IMPORTANT: This route must use raw body, not JSON parsed body
// Configure in main app.js BEFORE express.json() middleware
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
