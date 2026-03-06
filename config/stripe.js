const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
});

// Stripe configuration
const stripeConfig = {
  currency: 'usd',
  paymentMethodTypes: ['card'],
  captureMethod: 'automatic', // Charge immediately on confirmation
};

module.exports = { stripe, stripeConfig };
