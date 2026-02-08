# Stripe Production Deployment Guide

## Overview

This guide covers deploying the production-grade Stripe payment system with proper security, webhook configuration, and testing procedures.

## Security Principles

Our Stripe integration follows these critical security rules:

1. **Never hardcode Stripe keys** - All keys loaded from environment variables
2. **Never accept raw card data** - Frontend uses Stripe.js, backend never sees card numbers
3. **Use Payment Intents API** - Modern, secure payment flow
4. **Webhooks are single source of truth** - Never trust frontend payment status
5. **Verify webhook signatures** - Prevent webhook spoofing
6. **Calculate amounts server-side** - Never trust frontend amounts
7. **Use HTTPS in production** - Required for PCI compliance

## Environment Configuration

### Development Environment

```env
# .env (Development)
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NODE_ENV=development
```

### Production Environment

```env
# .env (Production)
STRIPE_SECRET_KEY=sk_live_51xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
NODE_ENV=production
```

**CRITICAL**: Never commit `.env` files to version control!

## Stripe Dashboard Setup

### 1. Get Your API Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers > API keys**
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Add to your `.env` file

### 2. Configure Webhooks

#### Development (Local Testing)

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe
# Linux: Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/payments/webhook

# Copy the webhook signing secret (starts with whsec_)
# Add to .env as STRIPE_WEBHOOK_SECRET
```

#### Production

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/payments/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to production `.env` as `STRIPE_WEBHOOK_SECRET`

## Payment Flow

### Customer Payment Flow

```
1. Customer adds items to cart
   ↓
2. Customer creates order (POST /api/orders)
   ↓
3. Backend calculates total amount (server-side)
   ↓
4. Customer requests payment intent (POST /api/payments/create-intent)
   ↓
5. Backend creates Stripe PaymentIntent
   ↓
6. Backend returns client_secret to frontend
   ↓
7. Frontend uses Stripe.js to collect card details
   ↓
8. Stripe processes payment
   ↓
9. Stripe sends webhook to backend
   ↓
10. Backend verifies webhook signature
    ↓
11. Backend updates payment and order status
    ↓
12. Customer sees confirmation
```

### Security Checkpoints

- ✅ Amount calculated server-side (Step 3)
- ✅ Card data never touches backend (Step 7)
- ✅ Webhook signature verified (Step 10)
- ✅ Payment status from webhook, not frontend (Step 11)

## API Endpoints

### Customer Endpoints

#### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer {customer_token}
Content-Type: application/json

{
  "orderId": "uuid"
}

Response:
{
  "message": "Payment intent created successfully",
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "payment": {
    "id": "uuid",
    "amount": 2999,
    "status": "pending"
  }
}
```

#### Get Payment by Order
```http
GET /api/payments/order/:orderId
Authorization: Bearer {customer_token}

Response:
{
  "id": "uuid",
  "order_id": "uuid",
  "payment_intent_id": "pi_xxx",
  "amount": 2999,
  "status": "succeeded",
  "created_at": "2026-02-08T..."
}
```

### Admin Endpoints

#### Get All Payments
```http
GET /api/admin/payments?status=succeeded&limit=50&offset=0
Authorization: Bearer {admin_token}

Response:
[
  {
    "id": "uuid",
    "order_id": "uuid",
    "amount": 2999,
    "status": "succeeded",
    ...
  }
]
```

#### Get Payment Statistics
```http
GET /api/admin/payments/statistics
Authorization: Bearer {admin_token}

Response:
{
  "total_payments": 150,
  "successful": 140,
  "pending": 5,
  "failed": 3,
  "refunded": 2,
  "total_amount": 449850,
  "successful_amount": 419800
}
```

#### Process Refund
```http
POST /api/admin/payments/:id/refund
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "amount": 2999,  // Optional, full refund if omitted
  "reason": "requested_by_customer"
}

Response:
{
  "message": "Refund processed successfully",
  "refund": {
    "id": "re_xxx",
    "amount": 2999,
    "status": "succeeded"
  },
  "payment": {
    "id": "uuid",
    "status": "refunded"
  }
}
```

### Webhook Endpoint

```http
POST /api/payments/webhook
Stripe-Signature: t=xxx,v1=xxx
Content-Type: application/json

{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 2999,
      "status": "succeeded"
    }
  }
}

Response:
{
  "received": true,
  "eventType": "payment_intent.succeeded",
  "result": {
    "payment": {...},
    "orderStatus": "paid"
  }
}
```

## Frontend Integration

### Install Stripe.js

```bash
npm install @stripe/stripe-js
```

### Payment Component Example

```javascript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe (use your publishable key)
const stripePromise = loadStripe('pk_test_your_publishable_key');

function CheckoutForm({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    // 1. Create payment intent on backend
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId })
    });

    const { clientSecret } = await response.json();

    // 2. Confirm payment with Stripe
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: 'Customer Name'
        }
      }
    });

    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else {
      // Payment succeeded!
      // Webhook will update order status
      window.location.href = '/order-confirmation';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
      {error && <div>{error}</div>}
    </form>
  );
}

function Checkout({ orderId }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm orderId={orderId} />
    </Elements>
  );
}
```

## Testing

### Test Cards

Use these test cards in development:

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Declined payment |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

**Expiry**: Any future date  
**CVC**: Any 3 digits  
**ZIP**: Any 5 digits

### Testing Webhooks Locally

```bash
# Terminal 1: Start your server
npm start

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:5000/api/payments/webhook

# Terminal 3: Trigger test webhook
stripe trigger payment_intent.succeeded
```

### Testing Refunds

```bash
# Create a test payment first, then:
stripe refunds create --payment-intent=pi_xxx
```

## Monitoring & Logging

### Stripe Dashboard

Monitor payments in real-time:
- **Payments**: View all transactions
- **Logs**: See webhook delivery attempts
- **Events**: Track all Stripe events

### Backend Logging

All payment operations are logged:

```javascript
// Successful payment
console.log('✅ Payment succeeded:', paymentIntentId);

// Failed payment
console.error('❌ Payment failed:', error.message);

// Webhook received
console.log('📨 Webhook received:', event.type);

// Webhook verification failed
console.error('⚠️  Webhook signature verification failed');
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid webhook signature` | Wrong webhook secret | Update `STRIPE_WEBHOOK_SECRET` |
| `Payment intent not found` | Invalid payment intent ID | Check order has valid payment |
| `Can only refund successful payments` | Payment not succeeded | Wait for payment to succeed |
| `Insufficient funds` | Customer card declined | Ask customer to use different card |

### Error Response Format

```json
{
  "error": "Webhook Error",
  "message": "Webhook signature verification failed: ..."
}
```

## Production Checklist

Before going live:

- [ ] Switch to live Stripe keys (`sk_live_...`)
- [ ] Configure production webhook endpoint
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production secret
- [ ] Enable HTTPS on your domain
- [ ] Test webhook delivery in production
- [ ] Set up monitoring and alerts
- [ ] Review Stripe Dashboard settings
- [ ] Test refund process
- [ ] Document customer support procedures
- [ ] Set up backup payment method (optional)

## PCI Compliance

Our implementation is PCI-compliant because:

1. ✅ Card data never touches our servers
2. ✅ Stripe.js handles card collection
3. ✅ We only store Stripe payment intent IDs
4. ✅ All communication over HTTPS
5. ✅ No card data in logs or database

## Support & Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check server is accessible from internet
4. Review Stripe Dashboard webhook logs
5. Test with Stripe CLI locally

### Payment Intent Creation Fails

1. Verify Stripe secret key is correct
2. Check order exists and is in `pending_payment` status
3. Verify amount is valid (> 0)
4. Check Stripe Dashboard for errors

### Refund Fails

1. Verify payment status is `succeeded`
2. Check refund amount doesn't exceed payment amount
3. Verify Stripe account has sufficient balance
4. Check Stripe Dashboard for refund status

---

**Last Updated**: February 8, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
