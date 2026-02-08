# 🛒 CUSTOMER QUICK START GUIDE

## ⚡ Get Started in 3 Minutes!

### Step 1: Import Collection (30 seconds)
1. Open Postman
2. Click **Import**
3. Select `E-Commerce-Customer-Complete.postman_collection.json`
4. Done! ✅

### Step 2: Register Account (30 seconds)
1. Open **"1. Customer Authentication"**
2. Click **"Register Customer"**
3. Click **Send**
4. Token auto-saves! ✅

### Step 3: Start Shopping! (2 minutes)
Now test any endpoint - you're ready to go! 🚀

---

## 🎯 Quick Test Flow

### 1. Browse Products
```
GET /api/products
```
No token needed - browse freely!

### 2. Add to Cart
```
POST /api/cart/items
Body: { "product_id": "uuid", "quantity": 2 }
```
Token required ✅

### 3. Create Order
```
POST /api/orders
Body: { "shipping_address_id": "uuid" }
```
Token required ✅

---

## 🔑 Default Credentials

**Email**: `customer@test.com`  
**Password**: `Customer123!`

Change these in the "Register Customer" request!

---

## 📊 Collection Overview

**56 Total Requests**:
- 🔐 Authentication (4)
- 🛍️ Shopping (8)
- 🛒 Cart (6)
- 📍 Addresses (6)
- 📦 Orders (7)
- 💳 Payments (4)
- ⭐ Reviews (6)
- 🔄 Returns (5)
- ❤️ Wishlist (4)
- 📈 Dashboard (5)

---

## ✅ What's Auto-Configured?

- ✅ Token auto-saves after login
- ✅ All headers pre-configured
- ✅ Variables auto-populate
- ✅ Request bodies ready to use
- ✅ No manual setup needed!

---

## 🚀 You're Ready!

**Import → Register → Shop** 

That's it! 🎉

---

**Need help?** See `CUSTOMER-POSTMAN-GUIDE.md` for detailed documentation.
