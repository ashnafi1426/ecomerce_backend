# Seller Endpoints Testing Guide

## Quick Test Commands

### Prerequisites
1. Backend server running on port 5000
2. Valid seller JWT token (login as seller first)

### Get Seller Token
```bash
# Login as seller
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "your_password"
  }'

# Copy the token from response
```

### Test All Fixed Endpoints

Replace `YOUR_TOKEN` with actual JWT token from login.

#### 1. Test Inventory (Fixed)
```bash
curl -X GET http://localhost:5000/api/seller/inventory \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with products array containing `title`, `sku`, `price`, `inventory` with calculated `available_quantity`

#### 2. Test Returns (Fixed)
```bash
curl -X GET http://localhost:5000/api/seller/returns \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with returns array containing order details and user info

#### 3. Test Disputes (Fixed)
```bash
curl -X GET http://localhost:5000/api/seller/disputes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with disputes array containing order and customer info

#### 4. Test Reviews (Fixed)
```bash
curl -X GET http://localhost:5000/api/seller/reviews \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with reviews array containing product and user info

#### 5. Test Settings (Fixed)
```bash
curl -X GET http://localhost:5000/api/seller/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with settings object containing `business_name`, `business_address`, `tax_id`, etc.

#### 6. Test Messages (Placeholder)
```bash
curl -X GET http://localhost:5000/api/seller/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with empty messages array and note

#### 7. Test Invoices (Placeholder)
```bash
curl -X GET http://localhost:5000/api/seller/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with empty invoices array and note

#### 8. Test Analytics Revenue (Placeholder)
```bash
curl -X GET "http://localhost:5000/api/seller/analytics/revenue?period=last-3-months" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with placeholder data and note

#### 9. Test Analytics Sales (Placeholder)
```bash
curl -X GET "http://localhost:5000/api/seller/analytics/sales?period=last-3-months" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with placeholder data and note

#### 10. Test Payout Balance (New)
```bash
curl -X GET http://localhost:5000/api/seller/payouts/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with balance object containing `available_balance`, `pending_balance`, etc.

#### 11. Test Dashboard
```bash
curl -X GET http://localhost:5000/api/seller/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with stats object containing performance, balance, productCount, pendingOrders

#### 12. Test Performance
```bash
curl -X GET http://localhost:5000/api/seller/performance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 200 OK with performance metrics

## Common Errors and Solutions

### Error: "Invalid token" or "No token provided"
**Solution**: Make sure you're including the Bearer token in Authorization header

### Error: "Forbidden" or "Access denied"
**Solution**: Make sure you're logged in as a seller (role: 'seller')

### Error: 404 Not Found
**Solution**: 
1. Check if backend server is running
2. Verify the endpoint URL is correct
3. Make sure seller.routes.js is properly loaded

### Error: 500 Internal Server Error
**Solution**: 
1. Check backend console for detailed error
2. Verify database connection
3. Check if all required tables exist

## Frontend Testing

### Test in Browser
1. Login as seller at `http://localhost:5173/login`
2. Navigate to seller dashboard at `http://localhost:5173/seller`
3. Check browser console for any API errors
4. Verify all pages load without errors

### Expected Behavior
- All pages should load without 404 or 500 errors
- Placeholder pages show "No data available" messages
- Real data pages display actual data from database
- Loading states work correctly
- Error states show retry buttons

## Success Criteria

✅ All endpoints return 200 status
✅ No 404 errors in backend logs
✅ No 500 errors in backend logs
✅ Frontend pages load without errors
✅ Data displays correctly or shows appropriate empty states
✅ Rate limiter warnings are non-critical (can be ignored)

## Next Steps After Testing

1. If all tests pass → Proceed to implement placeholder features
2. If any test fails → Check error logs and fix specific endpoint
3. Test with real seller account and actual data
4. Test edge cases (empty data, large datasets, etc.)
