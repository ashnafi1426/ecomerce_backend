# 🚀 Postman Collection - Quick Start Guide

## 📦 What You Got

✅ **Complete-Backend-API.postman_collection.json** - 153 KB, 150+ endpoints  
✅ **23 sections** covering all phases (1-6)  
✅ **Auto-save** for tokens and all resource IDs  
✅ **4 roles** - Customer, Seller, Manager, Admin  

---

## ⚡ 3-Step Quick Start

### Step 1: Import (30 seconds)
```
1. Open Postman
2. Click "Import" button
3. Drag "Complete-Backend-API.postman_collection.json"
4. Done! ✅
```

### Step 2: Start Backend (if not running)
```bash
cd ecomerce_backend
npm start
```

### Step 3: Test (2 minutes)
```
1. Open collection in Postman
2. Expand "0. Authentication (All Roles)"
3. Click "Login Admin"
4. Click "Send"
5. Token auto-saves! ✅
6. Test other endpoints
```

---

## 🔑 Default Login Credentials

### Admin
```
Email: admin@test.com
Password: Test123!@#
```

### Manager
```
Email: manager@test.com
Password: Test123!@#
```

### Seller
```
Email: seller@test.com
Password: Test123!@#
```

### Customer
```
Email: customer@test.com
Password: Test123!@#
```

---

## 📋 Testing Workflow

### Quick Test (5 minutes)
```
1. Login Admin
2. Create Category
3. Login Seller
4. Create Product
5. Login Manager
6. Approve Product
7. Login Customer
8. Add to Cart
9. Create Order
10. Done! ✅
```

### Complete Test (30 minutes)
```
Follow the collection order:
0. Authentication → 1. Categories → 2. Products → 
3. Variants → 4. Cart → 5. Coupons → 6. Payments → 
7. Orders → 8. Ratings → 9. Replacements → 
10. Refunds → ... → 22. Audit Logs
```

---

## 🎯 What Auto-Saves

### Tokens (5 variables)
- `token` - Current active token
- `admin_token` - Admin token
- `manager_token` - Manager token
- `seller_token` - Seller token
- `customer_token` - Customer token

### IDs (17+ variables)
- `product_id`, `order_id`, `category_id`
- `variant_id`, `coupon_id`, `promotion_id`
- `rating_id`, `replacement_id`, `refund_id`
- `review_id`, `address_id`, `payment_intent_id`
- `user_id`, `seller_id`, `notification_id`, `dispute_id`
- And more...

### Base URL
- `base_url` - Default: `http://localhost:5000`

---

## 💡 Pro Tips

### Tip 1: Check Saved Variables
```
1. Click "Environments" in Postman
2. Select your environment
3. See all auto-saved tokens and IDs
```

### Tip 2: Use Collection Runner
```
1. Right-click collection
2. Click "Run collection"
3. Select requests to run
4. Click "Run"
5. Watch magic happen! ✨
```

### Tip 3: Switch Roles Easily
```
1. Login with different role
2. Token auto-saves with role prefix
3. Use {{admin_token}}, {{seller_token}}, etc.
```

### Tip 4: Test in Order
```
Follow the numbered sections:
0 → 1 → 2 → 3 → ... → 22
```

---

## 🐛 Common Issues

### "Unauthorized" Error
```
Solution: Login first!
1. Go to "0. Authentication"
2. Run "Login Admin" (or appropriate role)
3. Retry your request
```

### "Not Found" Error
```
Solution: Create resource first!
1. Check if resource exists
2. Create it using POST endpoint
3. ID auto-saves
4. Retry your request
```

### "Forbidden" Error
```
Solution: Use correct role!
1. Check endpoint requirements
2. Login with correct role
3. Use role-specific token
```

### Base URL Wrong
```
Solution: Update base_url!
1. Click "Environments"
2. Update base_url variable
3. Save and retry
```

---

## 📖 Full Documentation

For detailed information, see:

- **COMPLETE-POSTMAN-GUIDE.md** - Complete usage guide
- **PHASE6-API-DOCUMENTATION.md** - API documentation
- **POSTMAN-COLLECTION-COMPLETE.md** - Implementation summary

---

## 🎯 What's Included

### All Phases
- ✅ Phase 1: Core Features (Auth, Products, Cart, Orders)
- ✅ Phase 2: Admin Features (Users, Inventory, Analytics)
- ✅ Phase 3: Product Management (Seller, Approval)
- ✅ Phase 4: Multi-Vendor (Payments, Commissions, Sub-Orders)
- ✅ Phase 5: Advanced (Sellers, Notifications, Disputes)
- ✅ Phase 6: Critical (Variants, Coupons, Ratings, Replacements, Refunds)

### All Roles
- ✅ Customer (50+ endpoints)
- ✅ Seller (40+ endpoints)
- ✅ Manager (35+ endpoints)
- ✅ Admin (45+ endpoints)

### All Features
- ✅ Authentication & Authorization
- ✅ Product Management & Variants
- ✅ Shopping Cart & Checkout
- ✅ Payment Processing
- ✅ Order Management
- ✅ Coupons & Promotions
- ✅ Delivery Ratings
- ✅ Replacements & Refunds
- ✅ Reviews & Ratings
- ✅ Notifications & Disputes
- ✅ Analytics & Reports
- ✅ And much more...

---

## ✅ Success Checklist

- [ ] Collection imported into Postman
- [ ] Backend server running
- [ ] Logged in as Admin
- [ ] Logged in as Manager
- [ ] Logged in as Seller
- [ ] Logged in as Customer
- [ ] Tokens auto-saved
- [ ] Created test category
- [ ] Created test product
- [ ] Created test order
- [ ] All tests passing

---

## 🎉 You're Ready!

Your complete backend API testing suite is ready to use!

**File:** `Complete-Backend-API.postman_collection.json`  
**Endpoints:** 150+  
**Sections:** 23  
**Roles:** 4  
**Auto-Save:** ✅  

**Happy Testing! 🚀**

---

## 📞 Need Help?

1. Check **COMPLETE-POSTMAN-GUIDE.md** for detailed guide
2. Check **PHASE6-API-DOCUMENTATION.md** for API docs
3. Check backend logs for errors
4. Verify database connection
5. Ensure migrations are run

---

**Version:** 6.0.0  
**Date:** February 9, 2026  
**Status:** ✅ Ready to Use
