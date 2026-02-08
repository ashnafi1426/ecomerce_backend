# Stripe Payment System - Quick Reference Card

## 🚀 Quick Start

```bash
# Test Stripe integration
npm run test:stripe

# Start server
npm start

# Test webhooks locally
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## 🔑 Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NODE_ENV=development
```

---

## 📡 API Endpoints

### Customer
```http
POST /api/payments/create-intent
GET  /api/payments/order/:orderId
GET  /api/payments/:id
```

### Admin
```http
GET  /api/admin/payments
GET  /api/admin/payments/statistics
POST /api/admin/payments/:id/refund
POST /api/admin/payments/:paymentIntentId/sync
```

### Webhook
```http
POST /api/payments/webhook
```

---

## 💳 Test Cards

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Declined |
| 4000 0025 0000 3155 | 3D Secure |

---

## 🔒 Security Rules

1. ✅ Never accept raw card data
2. ✅ Verify webhook signatures
3. ✅ Calculate amounts server-side
4. ✅ Use HTTPS in production
5. ✅ Never trust frontend amounts

---

## 🧪 Testing

```bash
# Test Stripe integration
npm run test:stripe

# Test payment endpoints
npm run test:payments

# Trigger test webhook
stripe trigger payment_intent.succeeded
```

---

## 📊 Payment Flow

```
Cart → Order → Payment Intent → Stripe.js → Webhook → Status Update
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Invalid webhook signature | Update STRIPE_WEBHOOK_SECRET |
| Payment not found | Check order has valid payment |
| Can't refund | Payment must be succeeded |
| Card declined | Use different card |

---

## 📚 Documentation

- `STRIPE-PRODUCTION-GUIDE.md` - Complete guide
- `STRIPE-IMPLEMENTATION-COMPLETE.md` - Technical details
- `test-stripe-webhook.js` - Test script

---

## 🎯 Production Checklist

- [ ] Switch to live keys
- [ ] Configure webhook
- [ ] Enable HTTPS
- [ ] Test webhooks
- [ ] Set up monitoring

---

**Quick Help**: See `STRIPE-PRODUCTION-GUIDE.md` for detailed instructions
