/**
 * STRIPE CONFIGURATION
 * 
 * Stripe payment gateway configuration.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent
 * @param {Number} amount - Amount in cents (e.g., $29.99 = 2999)
 * @param {String} currency - Currency code (default: 'usd')
 * @returns {Promise<Object>} Stripe PaymentIntent object
 */
const createPaymentIntent = async (amount, currency = 'usd') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure integer
      currency: currency,
      payment_method_types: ['card'],
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
 * @returns {Promise<Object>} Stripe Refund object
 */
const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refundData = { payment_intent: paymentIntentId };
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

module.exports = {
  stripe,
  createPaymentIntent,
  retrievePaymentIntent,
  createRefund
};
