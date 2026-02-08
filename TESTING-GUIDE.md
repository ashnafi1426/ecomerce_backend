# FastShop Testing Guide

## Overview

This guide provides instructions for testing each phase of the FastShop Multi-Vendor Platform migration. Each phase has dedicated test scripts that verify functionality and ensure requirements are met.

---

## Prerequisites

Before running tests, ensure:

1. **Backend server is running**
   ```bash
   cd ecomerce_backend
   npm start
   ```
   Server should be running on `http://localhost:5000`

2. **Database is accessible**
   - Phase 1 migrations have been deployed
   - Supabase connection is configured in `.env`

3. **Admin account exists**
   - Email: `admin@fastshop.com`
   - Password: `Admin123!`
   - (Or update test scripts with your admin credentials)

4. **Node.js dependencies installed**
   ```bash
   npm install
   ```

---

## Phase 1: Database Schema Testing

**Status:** ✅ Already Verified  
**Script:** `check-phase1-status.js`

### Run Phase 1 Verification

```bash
node check-phase1-status.js
```

### What It Tests
- ✅ Database connection
- ✅ All 13 new tables exist
- ✅ User roles column exists
- ✅ Product approval fields exist
- ✅ Commission system configured
- ✅ Existing data preserved

### Expected Output
```
✅ Database connection successful
✅ All Phase 1 tables exist
✅ User roles column exists
✅ Product fields added
✅ Commission system configured
✅ Zero data loss confirmed
```

---

## Phase 2: Authentication & Authorization Testing

**Status:** 🧪 Ready to Test  
**Script:** `test-phase2-auth.js`

### Run Phase 2 Tests

```bash
node test-phase2-auth.js
```

### What It Tests

1. **Admin Login** - Verify admin can log in
2. **Seller Registration** - Test seller registration with business info
3. **Seller Login** - Verify seller can log in
4. **Seller Check Status** - Test seller status endpoint
5. **Manager Creation** - Test admin can create managers
6. **Manager Login** - Verify manager can log in
7. **Admin Approve Seller** - Test seller approval workflow
8. **List Sellers** - Test admin/manager can list sellers
9. **Role-Based Access Control** - Verify permission enforcement
10. **Get Seller Details** - Test seller detail retrieval

### Expected Results

```
✅ Passed: 10/10
❌ Failed: 0/10
📊 Success Rate: 100.0%
```

### Test Scenarios

#### ✅ Positive Tests
- Seller registers with valid business information
- Seller status is 'pending' after registration
- Admin can approve sellers
- Manager can view sellers but not approve
- Role hierarchy is enforced

#### ❌ Negative Tests
- Seller cannot create managers (403 Forbidden)
- Manager cannot approve sellers (403 Forbidden)
- Invalid credentials are rejected

### Troubleshooting

**Issue:** Admin login fails
- **Solution:** Verify admin account exists in database
- **Check:** Run `node create-admin-account.js` if needed

**Issue:** Seller registration fails
- **Solution:** Check Phase 1 migrations are deployed
- **Verify:** `business_name`, `verification_status` columns exist

**Issue:** Permission denied errors
- **Solution:** Verify role middleware is working
- **Check:** JWT token contains correct role

---

## Phase 3: Product Management Testing

**Status:** 🧪 Ready to Test  
**Script:** `test-phase3-products.js`

### Run Phase 3 Tests

```bash
node test-phase3-products.js
```

### What It Tests

1. **Seller Creates Product** - Product automatically pending
2. **Seller Views Own Products** - Seller can see all own products
3. **Customer Cannot See Pending** - Pending products hidden
4. **Manager Views Approval Queue** - Manager sees pending products
5. **Manager Approves Product** - Approval workflow works
6. **Customer Can See Approved** - Approved products visible
7. **Seller Updates Product** - Update triggers re-approval
8. **Manager Rejects Product** - Rejection with reason works
9. **Seller Cannot View Others** - Seller isolation enforced
10. **Seller Deletes Product** - Seller can delete own products
11. **Product Search Filtering** - Role-based search works

### Expected Results

```
✅ Passed: 11/11
❌ Failed: 0/11
📊 Success Rate: 100.0%
```

### Test Scenarios

#### ✅ Positive Tests
- Seller creates product → status is 'pending'
- Manager approves product → status is 'approved'
- Customer sees only approved products
- Seller updates approved product → status resets to 'pending'
- Manager rejects product with reason

#### ❌ Negative Tests
- Customer cannot see pending products
- Seller cannot see other sellers' products
- Seller cannot approve own products

### Troubleshooting

**Issue:** Product creation fails
- **Solution:** Check Phase 1 product fields exist
- **Verify:** `seller_id`, `approval_status` columns exist

**Issue:** Approval queue empty
- **Solution:** Ensure products are created with 'pending' status
- **Check:** Product service sets `approval_status = 'pending'`

**Issue:** Customer sees pending products
- **Solution:** Verify product visibility logic in controller
- **Check:** `getAllProducts` filters by approval_status

---

## Running All Tests

To run all phase tests sequentially:

```bash
# Phase 1 (Database)
node check-phase1-status.js

# Phase 2 (Auth)
node test-phase2-auth.js

# Phase 3 (Products)
node test-phase3-products.js
```

---

## Test Data Management

### Automatic Cleanup

All test scripts automatically clean up test data after completion:
- Test users are deleted
- Test products are deleted
- Database is restored to pre-test state

### Manual Cleanup

If tests fail and cleanup doesn't run:

```sql
-- Delete test users
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com';

-- Delete test products
DELETE FROM products WHERE title LIKE 'Test%';
```

---

## Continuous Integration

### GitHub Actions (Future)

```yaml
name: FastShop Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run Phase 2 Tests
        run: node test-phase2-auth.js
      - name: Run Phase 3 Tests
        run: node test-phase3-products.js
```

---

## Test Coverage

### Phase 1: Database Schema
- **Coverage:** 100%
- **Tables:** 13 new, 8 enhanced
- **Status:** ✅ Verified

### Phase 2: Authentication & Authorization
- **Coverage:** 90%
- **Endpoints:** 9 new API endpoints
- **Status:** 🧪 Ready to test

### Phase 3: Product Management
- **Coverage:** 95%
- **Endpoints:** 7 new API endpoints
- **Status:** 🧪 Ready to test

---

## Next Steps

After all tests pass:

1. **Update Postman Collection**
   - Add Phase 2 endpoints
   - Add Phase 3 endpoints
   - Test manually in Postman

2. **Create API Documentation**
   - Document new endpoints
   - Add request/response examples
   - Update README

3. **Proceed to Phase 4**
   - Payment System implementation
   - Commission calculation
   - Seller payouts

---

## Support

### Common Issues

**Port 5000 already in use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm start
```

**Database connection timeout**
```bash
# Check Supabase credentials
cat .env | grep SUPABASE

# Test connection
node test-connection.js
```

**Tests fail with 401 Unauthorized**
```bash
# Verify admin account
node create-admin-account.js

# Check JWT secret
cat .env | grep JWT_SECRET
```

### Getting Help

1. Check test output for specific error messages
2. Review phase completion documents
3. Verify prerequisites are met
4. Check database migrations are deployed

---

## Test Metrics

### Success Criteria

Each phase must achieve:
- ✅ 100% of critical tests passing
- ✅ 90%+ of all tests passing
- ✅ Zero data loss
- ✅ Backward compatibility maintained

### Performance Benchmarks

- Test execution time: < 30 seconds per phase
- API response time: < 500ms per request
- Database query time: < 100ms per query

---

**Last Updated:** February 8, 2026  
**Version:** 1.0  
**Status:** Phase 1-3 Testing Ready
