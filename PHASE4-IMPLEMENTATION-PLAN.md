# Phase 4: Comprehensive Payment System - Implementation Plan

## Overview

Phase 4 transforms the basic payment system into a comprehensive multi-vendor payment platform with commission tracking, seller payouts, escrow management, and multi-vendor order splitting.

**Status**: 🚧 IN PROGRESS  
**Priority**: CRITICAL  
**Estimated Duration**: 2-3 weeks

## Current State

### What's Already Implemented ✅
- Basic Stripe payment integration
- Order creation from cart
- Payment intent creation
- Payment status tracking
- Basic refund processing
- Payment webhooks

### What's Missing ❌
- Commission calculation engine
- Seller balance tracking
- Multi-vendor order splitting
- Sub-order management
- Seller payout system
- Escrow balance management
- Payment transaction logging
- Commission reversal on refunds

## Database Schema (Already Created in Phase 1)

The following tables were created in Phase 1 and are ready to use:

1. **commission_rates** - Commission configuration
2. **seller_balances** - Real-time seller balance tracking
3. **seller_payouts** - Payout history
4. **payment_transactions** - Comprehensive transaction log
5. **sub_orders** - Multi-vendor order splitting

## Implementation Tasks

### Task 4.1: Commission Service
**File**: `services/commissionServices/commission.service.js`

**Functions to Implement**:
```javascript
- getApplicableRate(sellerId, categoryId) // Get commission rate
- calculateCommission(amount, rate) // Calculate commission amount
- calculateSellerPayout(amount, commission) // Calculate seller payout
- getAllRates() // Get all commission rates (admin)
- createRate(rateData) // Create new rate (admin)
- updateRate(id, updates) // Update rate (admin)
- deleteRate(id) // Delete rate (admin)
```

### Task 4.2: Seller Balance Service
**File**: `services/sellerBalanceServices/sellerBalance.service.js`

**Functions to Implement**:
```javascript
- getBalance(sellerId) // Get seller balance
- addToEscrow(sellerId, amount, orderId) // Add to escrow on order
- releaseFromEscrow(sellerId, amount, orderId) // Release after delivery
- addToPending(sellerId, amount) // Add to pending
- movePendingToAvailable(sellerId, amount) // Move after hold period
- deductFromAvailable(sellerId, amount) // Deduct for payout
- recordCommission(sellerId, amount) // Track commission paid
- getBalanceHistory(sellerId) // Get balance history
```

### Task 4.3: Sub-Order Service
**File**: `services/subOrderServices/subOrder.service.js`

**Functions to Implement**:
```javascript
- createSubOrders(parentOrderId, cartItems) // Split order by seller
- findByParentOrder(parentOrderId) // Get all sub-orders
- findBySeller(sellerId, filters) // Get seller's sub-orders
- updateFulfillmentStatus(subOrderId, status) // Update status
- updatePayoutStatus(subOrderId, status) // Update payout status
- getSellerSubOrders(sellerId) // Seller's fulfillment queue
```

### Task 4.4: Payout Service
**File**: `services/payoutServices/payout.service.js`

**Functions to Implement**:
```javascript
- requestPayout(sellerId, amount, method) // Seller requests payout
- processPayout(payoutId) // Process payout (admin)
- getPayoutHistory(sellerId) // Get payout history
- getPendingPayouts() // Get all pending (admin)
- cancelPayout(payoutId) // Cancel payout
- retryFailedPayout(payoutId) // Retry failed payout
```

### Task 4.5: Payment Transaction Service
**File**: `services/paymentTransactionServices/paymentTransaction.service.js`

**Functions to Implement**:
```javascript
- logTransaction(transactionData) // Log any transaction
- logCustomerPayment(orderId, amount, commission) // Log payment
- logSellerPayout(payoutId, sellerId, amount) // Log payout
- logRefund(orderId, amount) // Log refund
- logCommission(orderId, sellerId, amount) // Log commission
- getTransactionHistory(filters) // Get transactions
- getSellerTransactions(sellerId) // Seller transactions
```

### Task 4.6: Update Order Service
**File**: `services/orderServices/order.service.js`

**Updates Needed**:
```javascript
- createFromCart() // Add commission calculation
- createFromCart() // Create sub-orders for multi-vendor
- createFromCart() // Add to seller escrow balance
- updateStatus() // Release escrow on delivery
- updateStatus() // Handle commission on status changes
```

### Task 4.7: Update Payment Service
**File**: `services/paymentServices/payment.service.js`

**Updates Needed**:
```javascript
- processRefund() // Reverse commission
- processRefund() // Update seller balance
- syncPaymentStatus() // Update seller balances
```

### Task 4.8: Commission Controller
**File**: `controllers/commissionControllers/commission.controller.js`

**Endpoints**:
```
GET    /api/admin/commission-rates          - Get all rates
POST   /api/admin/commission-rates          - Create rate
PUT    /api/admin/commission-rates/:id      - Update rate
DELETE /api/admin/commission-rates/:id      - Delete rate
GET    /api/admin/commission-rates/:id      - Get rate by ID
```

### Task 4.9: Seller Balance Controller
**File**: `controllers/sellerBalanceControllers/sellerBalance.controller.js`

**Endpoints**:
```
GET    /api/seller/balance                  - Get own balance
GET    /api/seller/balance/history          - Get balance history
GET    /api/admin/seller-balances           - Get all balances (admin)
GET    /api/admin/seller-balances/:sellerId - Get seller balance (admin)
```

### Task 4.10: Payout Controller
**File**: `controllers/payoutControllers/payout.controller.js`

**Endpoints**:
```
POST   /api/seller/payouts/request          - Request payout
GET    /api/seller/payouts                  - Get payout history
GET    /api/seller/payouts/:id              - Get payout details
GET    /api/admin/payouts/pending           - Get pending payouts
POST   /api/admin/payouts/:id/process       - Process payout
POST   /api/admin/payouts/:id/cancel        - Cancel payout
POST   /api/admin/payouts/:id/retry         - Retry failed payout
```

### Task 4.11: Sub-Order Controller
**File**: `controllers/subOrderControllers/subOrder.controller.js`

**Endpoints**:
```
GET    /api/orders/:orderId/sub-orders      - Get sub-orders for order
GET    /api/seller/sub-orders                - Get seller's sub-orders
GET    /api/seller/sub-orders/:id           - Get sub-order details
PATCH  /api/seller/sub-orders/:id/status    - Update fulfillment status
POST   /api/seller/sub-orders/:id/ship      - Mark as shipped
```

### Task 4.12: Payment Transaction Controller
**File**: `controllers/paymentTransactionControllers/paymentTransaction.controller.js`

**Endpoints**:
```
GET    /api/admin/payment-transactions      - Get all transactions
GET    /api/seller/payment-transactions     - Get seller transactions
GET    /api/payment-transactions/:id        - Get transaction details
```

### Task 4.13: Routes
**Files to Create/Update**:
- `routes/commissionRoutes/commission.routes.js`
- `routes/sellerBalanceRoutes/sellerBalance.routes.js`
- `routes/payoutRoutes/payout.routes.js`
- `routes/subOrderRoutes/subOrder.routes.js`
- `routes/paymentTransactionRoutes/paymentTransaction.routes.js`

### Task 4.14: Update Main Routes
**File**: `routes/index.js`

Add new route imports and registrations.

## Testing Strategy

### Unit Tests
- Test commission calculation
- Test balance updates
- Test order splitting logic
- Test payout calculations

### Integration Tests
- Test complete order flow with commission
- Test multi-vendor order splitting
- Test payout processing
- Test refund with commission reversal

### Test Script
Run: `npm run test:phase4`

## Implementation Order

1. **Commission Service** (Foundation)
2. **Seller Balance Service** (Core)
3. **Payment Transaction Service** (Logging)
4. **Update Order Service** (Integration)
5. **Sub-Order Service** (Multi-vendor)
6. **Payout Service** (Seller payments)
7. **Controllers** (API layer)
8. **Routes** (Endpoints)
9. **Testing** (Validation)

## Success Criteria

- ✅ Commission calculated on all orders
- ✅ Seller balances tracked in real-time
- ✅ Multi-vendor orders split correctly
- ✅ Sub-orders created for each seller
- ✅ Seller payouts processed successfully
- ✅ Refunds reverse commission correctly
- ✅ All transactions logged
- ✅ Escrow balances managed properly
- ✅ All tests passing (10/10)

## API Documentation

After implementation, update:
- Postman collection with new endpoints
- API documentation
- Seller dashboard integration guide

## Next Steps After Phase 4

Once Phase 4 is complete:
1. Update comprehensive test suite
2. Document all new endpoints
3. Create seller payout guide
4. Proceed to Phase 5: Multi-Vendor Order Management

---

**Created**: February 8, 2026  
**Status**: Ready for Implementation  
**Estimated Completion**: Week 8-9
