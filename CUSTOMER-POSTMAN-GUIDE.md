# 🛒 CUSTOMER POSTMAN COLLECTION GUIDE

## 📦 File Generated

**File**: `E-Commerce-Customer-Complete.postman_collection.json`  
**Total Requests**: 56 customer endpoints  
**Status**: ✅ Ready to import

---

## 🚀 Quick Start

### Step 1: Import Collection
1. Open Postman
2. Click **"Import"**
3. Select: `E-Commerce-Customer-Complete.postman_collection.json`
4. Click **"Import"**

### Step 2: Register as Customer
1. Open the collection
2. Go to **"1. Customer Authentication"**
3. Click **"Register Customer"**
4. Click **"Send"**

The request body is already set:
```json
{
  "email": "customer@test.com",
  "password": "Customer123!",
  "displayName": "Test Customer"
}
```

### Step 3: Login as Customer
If you already have an account, use **"Login Customer"** instead:
```json
{
  "email": "customer@test.com",
  "password": "Customer123!"
}
```

### Step 4: Start Shopping!
Token will be automatically saved to `{{customerToken}}` variable.
Now you can test all customer endpoints!

---

## 📋 Collection Structure

### 0. Health Check (1 request)
- ✅ Health Check - Verify server is running

### 1. Customer Authentication (4 requests)
- ✅ Register Customer - Create new account
- ✅ Login Customer - Get JWT token
- ✅ Get My Profile - View your profile
- ✅ Update My Profile - Update display name and phone

### 2. Browse Products & Categories (8 requests)
- ✅ Get All Categories - List all categories
- ✅ Get Category by ID - View specific category
- ✅ Get All Products - List all products
- ✅ Get Product by ID - View product details
- ✅ Search Products - Search by keyword
- ✅ Get Products by Category - Filter by category
- ✅ Get Featured Products - View featured items
- ✅ Get Products with Pagination - Paginated results

### 3. Shopping Cart (6 requests)
- ✅ Get My Cart - View cart contents
- ✅ Add Item to Cart - Add product to cart
- ✅ Update Cart Item Quantity - Change quantity
- ✅ Remove Item from Cart - Remove single item
- ✅ Clear Cart - Empty entire cart
- ✅ Get Cart Summary - View cart totals

### 4. Addresses (6 requests)
- ✅ Get My Addresses - List saved addresses
- ✅ Create Address - Add new address
- ✅ Get Address by ID - View specific address
- ✅ Update Address - Edit address details
- ✅ Set Default Address - Mark as default
- ✅ Delete Address - Remove address

### 5. Orders & Checkout (7 requests)
- ✅ Create Order from Cart - Place order
- ✅ Get My Orders - View order history
- ✅ Get Order by ID - View order details
- ✅ Get Order Details - Full order information
- ✅ Cancel Order - Cancel pending order
- ✅ Get Order History - Complete history
- ✅ Track Order - Track shipment

### 6. Payments (4 requests)
- ✅ Create Payment Intent - Initialize payment
- ✅ Confirm Payment - Complete payment
- ✅ Get Payment by Order - View payment details
- ✅ Get My Payment History - Payment history

### 7. Reviews & Ratings (6 requests)
- ✅ Get Product Reviews - View all reviews
- ✅ Create Review - Write product review
- ✅ Get My Reviews - View your reviews
- ✅ Update My Review - Edit your review
- ✅ Delete My Review - Remove your review
- ✅ Get Review by ID - View specific review

### 8. Returns & Refunds (5 requests)
- ✅ Create Return Request - Request return
- ✅ Get My Returns - View return requests
- ✅ Get Return by ID - View return details
- ✅ Cancel Return Request - Cancel return
- ✅ Get Return Status - Check return status

### 9. Wishlist (4 requests)
- ✅ Get My Wishlist - View saved items
- ✅ Add to Wishlist - Save product
- ✅ Remove from Wishlist - Remove product
- ✅ Clear Wishlist - Empty wishlist

### 10. Customer Dashboard (5 requests)
- ✅ Get Dashboard Summary - Overview stats
- ✅ Get Order Statistics - Order metrics
- ✅ Get Spending Statistics - Spending data
- ✅ Get Recent Activity - Recent actions
- ✅ Get Recommended Products - Personalized recommendations

---

## 🔑 Collection Variables

The collection uses these variables (auto-managed):

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `baseUrl` | API base URL | Manual (default: http://localhost:5004) |
| `customerToken` | Customer JWT token | ✅ After login/register |
| `productId` | Product ID | ✅ From product operations |
| `categoryId` | Category ID | ✅ From category operations |
| `cartItemId` | Cart item ID | ✅ After adding to cart |
| `orderId` | Order ID | ✅ After creating order |
| `addressId` | Address ID | ✅ After creating address |
| `reviewId` | Review ID | ✅ After creating review |
| `returnId` | Return ID | ✅ After creating return |
| `paymentIntentId` | Payment intent ID | ✅ After creating payment |

---

## 🧪 Testing Workflow

### Complete Customer Shopping Flow:

1. **Register/Login** → Get customer token
2. **Browse Products** → View categories and products
3. **Add to Cart** → Add items to shopping cart
4. **Create Address** → Add shipping address
5. **Create Order** → Place order from cart
6. **Make Payment** → Complete payment
7. **Track Order** → Monitor order status
8. **Write Review** → Review purchased product
9. **Request Return** → Return if needed

---

## 📊 Expected Responses

### Register Customer (200 OK)
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "customer@test.com",
    "role": "customer",
    "displayName": "Test Customer"
  }
}
```

### Get My Cart (200 OK)
```json
{
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_title": "iPhone 15 Pro",
      "quantity": 2,
      "price": 999.99,
      "subtotal": 1999.98
    }
  ],
  "total": 1999.98,
  "item_count": 2
}
```

### Create Order (201 Created)
```json
{
  "message": "Order created successfully",
  "orderId": "uuid",
  "order": {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 1999.98,
    "status": "pending_payment",
    "created_at": "2026-02-07T..."
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error

**Cause**: No token or invalid token

**Solution**:
1. Run "Register Customer" or "Login Customer" first
2. Check `customerToken` variable is set
3. Token expires after 7 days - login again if expired

### Issue: "Product not found"

**Cause**: Product ID doesn't exist

**Solution**:
1. Browse products first to get valid product IDs
2. Use "Get All Products" to see available products
3. Copy a valid product ID to `{{productId}}` variable

### Issue: "Cart is empty"

**Cause**: No items in cart

**Solution**:
1. Add items to cart first using "Add Item to Cart"
2. Verify items added with "Get My Cart"
3. Then proceed to create order

---

## 🔒 Security Notes

### Customer Credentials
- **Email**: Any valid email (e.g., `customer@test.com`)
- **Password**: Must meet requirements (min 8 chars, uppercase, lowercase, number, special char)
- **Role**: Automatically set to `customer` on registration

### Token Management
- Token expires in 7 days (default)
- Token is automatically saved after login/register
- All authenticated requests require valid token

### Public vs Protected Endpoints
- **Public** (No token needed):
  - Browse products
  - View categories
  - View product reviews
  - Health check
- **Protected** (Token required):
  - Cart operations
  - Orders
  - Payments
  - Profile management
  - Reviews (create/update/delete)

---

## 📝 API Endpoints Reference

### Base URL
```
http://localhost:5004
```

### Authentication Header
```
Authorization: Bearer {{customerToken}}
```

### Common Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - No/invalid token
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 💡 Pro Tips

1. **Register First**: Create account before testing other endpoints
2. **Check Variables**: Verify variables are set in collection variables tab
3. **Use Console**: Open Postman Console to see debug logs
4. **Test in Order**: Follow the numbered folders for best results
5. **Save Product IDs**: Copy product IDs from browse responses
6. **Create Address**: Add address before creating orders
7. **Complete Orders**: Complete payment to enable reviews

---

## 🎯 Common Customer Tasks

### Task 1: Complete Shopping Flow
1. Register/Login
2. Browse Products
3. Add to Cart
4. Create Address
5. Create Order
6. Make Payment
7. Track Order

### Task 2: Write Product Review
1. Login
2. Get Order History
3. Find completed order
4. Create Review for product
5. View My Reviews

### Task 3: Request Return
1. Login
2. Get My Orders
3. Select order to return
4. Create Return Request
5. Track Return Status

### Task 4: Manage Wishlist
1. Login
2. Browse Products
3. Add to Wishlist
4. View Wishlist
5. Move to Cart when ready

---

## ✅ Success Checklist

After importing and testing, you should be able to:

- [x] Register new customer account
- [x] Login and get token
- [x] Browse products and categories
- [x] Add items to cart
- [x] Manage cart (update, remove)
- [x] Create shipping address
- [x] Place orders
- [x] Make payments
- [x] Track orders
- [x] Write product reviews
- [x] Request returns
- [x] Manage wishlist
- [x] View dashboard statistics

---

## 📞 Support

If you encounter issues:

1. Check server is running (`npm start`)
2. Verify token is saved in variables
3. Check you're using customer account (not admin)
4. Review server logs for errors
5. Test with curl to isolate Postman issues

---

## 🎉 Summary

**File**: `E-Commerce-Customer-Complete.postman_collection.json`  
**Total Requests**: 56 customer endpoints  
**Categories**: 11 sections  
**Status**: ✅ **READY TO USE**

**Import the collection and start shopping!** 🛒

---

**Generated**: February 7, 2026  
**Version**: 1.0.0  
**For**: E-Commerce Backend API

**Happy Shopping! 🛍️**
