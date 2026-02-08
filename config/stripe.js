/**
 * STRIPE CONFIGURATION
 * 
 * Production-grade Stripe payment gateway configuration.
 * 
 * SECURITY RULES:
 * - All keys loaded from environment variables
 * - Never hardcode Stripe keys
 * - Never accept raw card data in backend
 * - Use Stripe Payment Intents API
 * - Webhooks are the single source of truth
 */

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required in environment variables');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('⚠️  STRIPE_WEBHOOK_SECRET not configured - webhook signature verification will be skipped in development');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent
 * @param {Number} amount - Amount in cents (e.g., $29.99 = 2999)
 * @param {String} currency - Currency code (default: 'usd')
 * @param {Object} metadata - Optional metadata to attach to payment intent
 * @returns {Promise<Object>} Stripe PaymentIntent object
 */
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure integer
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: metadata, // Attach order ID and other metadata
      // Automatic payment methods for future expansion
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never' // Only card payments for now
      }
    });
    
    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    throw error;
  }
};

/**
 * Retrieve a payment intent
 * @param {String} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Stripe PaymentIntent object
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent retrieval failed:', error);
    throw error;
  }
};

/**
 * Create a refund
 * @param {String} paymentIntentId - Stripe payment intent ID
 * @param {Number} amount - Amount to refund in cents (optional, defaults to full refund)
 * @param {String} reason - Refund reason
 * @returns {Promise<Object>} Stripe Refund object
 */
const createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundData = { 
      payment_intent: paymentIntentId,
      reason: reason
    };
    
    if (amount) {
      refundData.amount = Math.round(amount);
    }
    
    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Stripe refund creation failed:', error);
    throw error;
  }
};

/**
 * Verify Stripe webhook signature
 * @param {String} payload - Raw request body
 * @param {String} signature - Stripe signature header
 * @returns {Object} Verified Stripe event
 */
const verifyWebhookSignature = (payload, signature) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret || webhookSecret === 'whsec_your_webhook_secret') {
      console.warn('⚠️  Webhook signature verification skipped (development mode)');
      return JSON.parse(payload);
    }
    
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
};

module.exports = {
  stripe,
  createPaymentIntent,
  retrievePaymentIntent,
  createRefund,
  verifyWebhookSignature
};
