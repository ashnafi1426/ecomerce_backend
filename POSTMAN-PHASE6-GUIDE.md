# Phase 6 Postman Collection - Complete Testing Guide

## Overview

This guide explains how to use the **PHASE6-Complete-API.postman_collection.json** to test all Phase 6 backend features with automatic token management and base URL configuration.

## Features

✅ **Auto-Save Tokens** - Automatically saves authentication tokens  
✅ **Auto-Save IDs** - Automatically saves created resource IDs  
✅ **Base URL Management** - Centralized base URL configuration  
✅ **Role-Based Testing** - Separate tokens for Customer, Seller, Manager  
✅ **56 API Endpoints** - Complete coverage of all Phase 6 features  
✅ **Pre-configured Requests** - Ready-to-use request bodies  

---

## Quick Start

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button
3. Select `PHASE6-Complete-API.postman_collection.json`
4. Collection will appear in your workspace

### Step 2: Create Environment (Optional but Recommended)

1. Click **Environments** in left sidebar
2. Click **+** to create new environment
3. Name it: `Phase 6 Local`
4. Add variables:
   - `base_url`: `http://localhost:5000`
   - `token`: (leave empty - auto-filled)
   - `seller_token`: (leave empty - auto-filled)
   - `manager_token`: (leave empty - auto-filled)
5. Click **Save**
6. Select this environment from dropdown

### Step 3: Start Backend Server

```bash
cd ecomerce_backend
npm start
```

Server should be running on `http://localhost:5000`

---

## Testing Workflow

### Phase 1: Authentication (Required First)

**Test these in order:**

1. **Register Customer** (if needed)
   - Creates new customer account
   - ✅ Auto-saves `token` and `customer_id`

2. **Login Customer**
   - Logs in existing customer
   - ✅ Auto-saves `token` and `customer_id`

3. **Login Seller**
   - Logs in seller account
   - ✅ Auto-saves `seller_token` and `seller_id`

4. **Login Manager**
   - Logs in manager account
   - ✅ Auto-saves `manager_token` and `manager_id`

**Important:** After logging in, all subsequent requests will automatically use the saved tokens!

---

### Phase 2: Product Variants Testing

**Prerequisites:** 
- Seller must be logged in
- Need a `product_id` (create product first or use existing)

**Test Sequence:**

1. **Create Variant (Seller)**
   - Uses `seller_token` automatically
   - ✅ Auto-saves `variant_id`
   - Update `product_id` in request body

2. **Get Product Variants**
   - Public endpoint (no auth needed)
   - View all variants for a product

3. **Get Variant Details**
   - View specific variant details

4. **Update Variant (Seller)**
   - Modify variant price or availability

5. **Get Variant Inventory (Seller)**
   - Check inventory levels

6. **Update Variant Inventory (Seller)**
   - Set inventory quantity

**Expected Results:**
- ✅ Variant created with unique SKU
- ✅ Inventory tracked separately
- ✅ Only seller can modify their variants

---

### Phase 3: Coupon Testing

**Prerequisites:**
- Manager must be logged in

**Test Sequence:**

1. **Create Coupon (Manager)**
   - Uses `manager_token` automatically
   - ✅ Auto-saves `coupon_id` and `coupon_code`
   - Creates percentage discount coupon

2. **Validate Coupon (Customer)**
   - Test coupon validation logic
   - Check discount calculation

3. **Apply Coupon (Customer)**
   - Apply coupon to order
   - Need valid `order_id`

4. **Get Active Coupons**
   - View all active coupons

5. **Get Coupon Analytics (Manager)**
   - View usage statistics

6. **Deactivate Coupon (Manager)**
   - Disable coupon

**Expected Results:**
- ✅ Coupon validates correctly
- ✅ Discount calculated properly
- ✅ Usage limits enforced
- ✅ Only managers can create/manage coupons

---

### Phase 4: Promotion Testing

**Prerequisites:**
- Manager must be logged in
- Need a `product_id`

**Test Sequence:**

1. **Create Promotion (Manager)**
   - Uses `manager_token` automatically
   - ✅ Auto-saves `promotion_id`
   - Set promotional price

2. **Get Active Promotions**
   - View all active promotions

3. **Get Promotion Details**
   - View specific promotion

4. **Update Promotion (Manager)**
   - Modify promotional price

5. **Get Promotion Analytics (Manager)**
   - View promotion performance

**Expected Results:**
- ✅ Promotion created successfully
- ✅ Time-based activation works
- ✅ Promotional pricing displayed
- ✅ Only managers can manage promotions

---

### Phase 5: Delivery Rating Testing

**Prerequisites:**
- Customer must be logged in
- Need a delivered `order_id`

**Test Sequence:**

1. **Submit Delivery Rating (Customer)**
   - Uses `token` automatically
   - ✅ Auto-saves `rating_id`
   - Rate delivery experience

2. **Get Order Delivery Rating**
   - View rating for specific order

3. **Get Seller Delivery Metrics**
   - View seller's delivery performance

4. **Get Seller Rating Distribution**
   - View rating breakdown by stars

5. **Get Delivery Rating Analytics (Manager)**
   - View comprehensive analytics

**Expected Results:**
- ✅ Rating submitted successfully
- ✅ Duplicate ratings prevented
- ✅ Metrics calculated correctly
- ✅ Low ratings flagged automatically

---

### Phase 6: Replacement Testing

**Prerequisites:**
- Customer must be logged in
- Need a delivered `order_id`

**Test Sequence:**

1. **Create Replacement Request (Customer)**
   - Uses `token` automatically
   - ✅ Auto-saves `replacement_id`
   - Request product replacement

2. **Get Replacement Request**
   - View replacement details

3. **Get All Replacements (Customer)**
   - View all customer's replacements

4. **Approve Replacement (Manager)**
   - Uses `manager_token` automatically
   - Approve the request

5. **Reject Replacement (Manager)**
   - Reject with reason

6. **Update Replacement Shipment (Seller)**
   - Uses `seller_token` automatically
   - Add tracking information

7. **Get Replacement Analytics (Manager)**
   - View replacement statistics

**Expected Results:**
- ✅ Replacement request created
- ✅ Manager approval workflow works
- ✅ Shipment tracking updated
- ✅ Analytics show replacement rates

---

### Phase 7: Refund Testing

**Prerequisites:**
- Customer must be logged in
- Need a delivered `order_id`

**Test Sequence:**

1. **Create Refund Request (Customer)**
   - Uses `token` automatically
   - ✅ Auto-saves `refund_id`
   - Request partial or full refund

2. **Get Refund Request**
   - View refund details

3. **Get All Refunds (Customer)**
   - View all customer's refunds

4. **Process Partial Refund (Manager)**
   - Uses `manager_token` automatically
   - Process partial refund

5. **Process Full Refund (Manager)**
   - Process full refund

6. **Issue Goodwill Refund (Manager)**
   - Issue compensation refund

7. **Get Refund Analytics (Manager)**
   - View refund statistics

**Expected Results:**
- ✅ Refund request created
- ✅ Partial refunds calculated correctly
- ✅ Commission adjustments applied
- ✅ Cumulative refund limits enforced

---

### Phase 8: Analytics Testing

**Prerequisites:**
- Manager must be logged in

**Test Sequence:**

1. **Get Coupon Analytics (Manager)**
   - View coupon usage and revenue impact

2. **Get Delivery Rating Analytics (Manager)**
   - View seller performance trends

3. **Get Comprehensive Dashboard (Manager)**
   - View all analytics in one place

**Expected Results:**
- ✅ Analytics data aggregated correctly
- ✅ Date range filtering works
- ✅ All metrics calculated properly

---

## Auto-Save Features

### Tokens Auto-Saved

When you login, these tokens are automatically saved:

- `token` - Customer token (from Login Customer)
- `seller_token` - Seller token (from Login Seller)
- `manager_token` - Manager token (from Login Manager)

### IDs Auto-Saved

When you create resources, these IDs are automatically saved:

- `customer_id` - Customer user ID
- `seller_id` - Seller user ID
- `manager_id` - Manager user ID
- `product_id` - Product ID (manual)
- `variant_id` - Variant ID
- `coupon_id` - Coupon ID
- `coupon_code` - Coupon code
- `promotion_id` - Promotion ID
- `order_id` - Order ID (manual)
- `rating_id` - Rating ID
- `replacement_id` - Replacement ID
- `refund_id` - Refund ID

### How It Works

Each request has a **Test** script that runs after the response:

```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    if (response.variant && response.variant.id) {
        pm.environment.set('variant_id', response.variant.id);
        console.log('Variant ID saved:', response.variant.id);
    }
}
```

This automatically extracts and saves IDs for use in subsequent requests!

---

## Manual Variables to Set

Some variables need to be set manually before testing:

### Required Manual Variables

1. **product_id**
   - Get from existing product or create new one
   - Used in: Variant creation, Promotion creation

2. **order_id**
   - Get from existing order or create new one
   - Used in: Ratings, Replacements, Refunds

### How to Set Manual Variables

**Method 1: In Environment**
1. Click Environments
2. Select your environment
3. Add variable: `product_id` = `your-product-uuid`
4. Save

**Method 2: In Request Body**
1. Open request
2. Replace `{{product_id}}` with actual UUID
3. Send request

---

## Testing Tips

### 1. Test in Order

Follow the phases in order:
1. Authentication first
2. Then test each feature sequentially

### 2. Check Console

Open Postman Console (View → Show Postman Console) to see:
- Auto-saved variables
- Request/response details
- Error messages

### 3. Use Environment Variables

Always use `{{variable_name}}` instead of hardcoding values:
- ✅ Good: `{{base_url}}/api/variants`
- ❌ Bad: `http://localhost:5000/api/variants`

### 4. Role-Based Testing

Remember which token to use:
- Customer: `{{token}}`
- Seller: `{{seller_token}}`
- Manager: `{{manager_token}}`

The collection handles this automatically!

### 5. Check Response Status

Expected status codes:
- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token)
- `403` - Forbidden (wrong role)
- `404` - Not Found

---

## Troubleshooting

### Problem: "Unauthorized" Error

**Solution:**
1. Make sure you logged in first
2. Check token is saved: `{{token}}`
3. Token might be expired - login again

### Problem: "Product not found"

**Solution:**
1. Set `product_id` variable
2. Create a product first
3. Use existing product UUID

### Problem: "Order not found"

**Solution:**
1. Set `order_id` variable
2. Create an order first
3. Use existing order UUID

### Problem: Base URL not working

**Solution:**
1. Check server is running: `npm start`
2. Verify base URL: `http://localhost:5000`
3. No trailing slash in base URL

### Problem: Variables not saving

**Solution:**
1. Check Test script in request
2. Verify response status is 200/201
3. Check Postman Console for errors

---

## Advanced Usage

### Testing Different Environments

Create multiple environments:

**Local Development**
- `base_url`: `http://localhost:5000`

**Staging**
- `base_url`: `https://staging.yourapp.com`

**Production**
- `base_url`: `https://api.yourapp.com`

Switch between environments using the dropdown!

### Running Collection

Run entire collection automatically:

1. Click collection name
2. Click **Run** button
3. Select requests to run
4. Click **Run Phase 6 - Critical Features**

This will test all endpoints in sequence!

### Exporting Results

After running collection:
1. Click **Export Results**
2. Save as JSON or HTML
3. Share with team

---

## Complete Testing Checklist

### ✅ Authentication
- [ ] Register Customer
- [ ] Login Customer
- [ ] Login Seller
- [ ] Login Manager

### ✅ Product Variants
- [ ] Create Variant
- [ ] Get Variants
- [ ] Update Variant
- [ ] Manage Inventory

### ✅ Coupons
- [ ] Create Coupon
- [ ] Validate Coupon
- [ ] Apply Coupon
- [ ] View Analytics

### ✅ Promotions
- [ ] Create Promotion
- [ ] Get Active Promotions
- [ ] Update Promotion
- [ ] View Analytics

### ✅ Delivery Ratings
- [ ] Submit Rating
- [ ] Get Order Rating
- [ ] View Seller Metrics
- [ ] View Analytics

### ✅ Replacements
- [ ] Create Request
- [ ] Approve Request
- [ ] Update Shipment
- [ ] View Analytics

### ✅ Refunds
- [ ] Create Request
- [ ] Process Partial Refund
- [ ] Process Full Refund
- [ ] View Analytics

### ✅ Analytics
- [ ] Coupon Analytics
- [ ] Rating Analytics
- [ ] Comprehensive Dashboard

---

## Support

### Documentation
- API Documentation: `PHASE6-API-DOCUMENTATION.md`
- Backend Complete: `PHASE6-BACKEND-COMPLETE.md`

### Need Help?
1. Check console logs
2. Review API documentation
3. Verify server is running
4. Check environment variables

---

**🎉 Happy Testing! 🎉**

All 56 Phase 6 endpoints are ready to test with automatic token management!
