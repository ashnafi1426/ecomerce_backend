# 📮 POSTMAN TESTING GUIDE

## 🎯 Complete API Testing with Postman

This guide will help you test all 100+ API endpoints using the provided Postman collection.

---

## 📥 STEP 1: Import the Collection

### Option 1: Import the Generated File
1. Open Postman
2. Click "Import" button (top left)
3. Select the file: `E-Commerce-API-Complete.postman_collection.json`
4. Click "Import"

### Option 2: Generate Fresh Collection
```bash
cd ecomerce_backend
node generate-postman-collection.js
```
Then import the generated `E-Commerce-API-Complete.postman_collection.json`

---

## 🚀 STEP 2: Start the Server

Make sure your backend server is running:

```bash
cd ecomerce_backend
npm start
```

Server should be running on: `http://localhost:5004`

---

## 🔧 STEP 3: Configure Collection Variables

The collection uses variables that are automatically set during testing:

### Pre-configured Variables:
- `baseUrl`: http://localhost:5004 (change if using different port)
- `customerToken`: Auto-set after customer login
- `adminToken`: Auto-set after admin login
- `productId`: Auto-set after creating product
- `orderId`: Auto-set after creating order
- `categoryId`: Auto-set after creating category
- `cartItemId`: Auto-set after adding to cart
- `reviewId`: Auto-set after creating review

### To View/Edit Variables:
1. Click on the collection name
2. Go to "Variables" tab
3. Edit values if needed

---

## 📋 STEP 4: Testing Workflow

### Recommended Testing Order:

#### 1. **Health Check** ✅
- Run: `0. Health Check > Health Check`
- Expected: 200 OK with server status

#### 2. **Authentication** 🔐
Run in order:
1. `Register Customer` - Creates customer account, saves token
2. `Register Admin` - Creates admin account, saves token
3. `Login Customer` - Login and get fresh token
4. `Login Admin` - Login and get fresh token
5. `Get Current User` - Verify authentication works

**Note**: Tokens are automatically saved to collection variables!

#### 3. **Categories** 📁
1. `Create Category (Admin)` - Creates category, saves ID
2. `Get All Categories` - View all categories
3. `Get Category by ID` - View specific category
4. `Update Category (Admin)` - Update category details

#### 4. **Products** 📦
1. `Create Product (Admin)` - Creates product, saves ID
2. `Get All Products` - View all products
3. `Get Product by ID` - View specific product
4. `Update Product (Admin)` - Update product details
5. `Search Products` - Search for products

#### 5. **Inventory** 📊
1. `Create Inventory` - Add inventory for product
2. `Get All Inventory` - View all inventory
3. `Update Inventory` - Update stock levels
4. `Get Low Stock Products` - View low stock alerts

#### 6. **Shopping Cart** 🛒
1. `Add to Cart` - Add product to cart, saves cart item ID
2. `Get Cart` - View cart contents
3. `Update Cart Item` - Change quantity
4. `Remove from Cart` - Remove specific item
5. `Clear Cart` - Empty entire cart

#### 7. **Orders** 📋
1. `Create Order from Cart` - Place order, saves order ID
2. `Get My Orders` - View customer orders
3. `Get Order by ID` - View specific order
4. `Update Order Status (Admin)` - Change order status
5. `Get All Orders (Admin)` - View all orders

#### 8. **Payments** 💳
1. `Create Payment Intent` - Create Stripe payment intent
2. `Get Payment by ID` - View payment details

#### 9. **Reviews** ⭐
1. `Create Review` - Submit product review, saves review ID
2. `Get Product Reviews` - View product reviews
3. `Get My Reviews` - View customer's reviews
4. `Approve Review (Admin)` - Approve pending review
5. `Get Pending Reviews (Admin)` - View all pending reviews

#### 10. **Analytics** 📈
1. `Dashboard` - Comprehensive analytics dashboard
2. `Sales Overview` - Sales metrics
3. `Revenue Overview` - Revenue metrics
4. `Customer Statistics` - Customer analytics
5. `Inventory Overview` - Inventory metrics

---

## 🎯 STEP 5: Run Complete Test Suite

### Option 1: Run Entire Collection
1. Click on collection name
2. Click "Run" button
3. Select all requests
4. Click "Run E-Commerce Backend API"
5. View results

### Option 2: Run Individual Folders
1. Right-click on any folder (e.g., "2. Authentication")
2. Click "Run folder"
3. View results

### Option 3: Run Individual Requests
1. Click on any request
2. Click "Send" button
3. View response

---

## 📊 Expected Results

### Success Responses:

#### Authentication
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "customer@test.com",
    "role": "customer"
  }
}
```

#### Products
```json
{
  "message": "Product created successfully",
  "product": {
    "id": "uuid",
    "title": "iPhone 15 Pro",
    "price": 999.99,
    "status": "active"
  }
}
```

#### Cart
```json
{
  "message": "Item added to cart",
  "cartItem": {
    "id": "uuid",
    "product_id": "uuid",
    "quantity": 2
  }
}
```

#### Orders
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "uuid",
    "amount": 199998,
    "status": "pending_payment"
  }
}
```

---

## 🔍 Testing Scenarios

### Scenario 1: Complete Customer Journey
1. Register Customer
2. Login Customer
3. Browse Products (Get All Products)
4. Add Product to Cart
5. View Cart
6. Create Order from Cart
7. Create Payment Intent
8. View My Orders
9. Create Review for Product

### Scenario 2: Admin Management
1. Register Admin
2. Login Admin
3. Create Category
4. Create Product
5. Create Inventory
6. View All Orders
7. Update Order Status
8. Approve Reviews
9. View Analytics Dashboard

### Scenario 3: Security Testing
1. Try accessing admin endpoints with customer token (should fail)
2. Try accessing protected endpoints without token (should fail)
3. Try creating duplicate reviews (should fail)
4. Try ordering out-of-stock products (should fail)

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error
**Solution**: 
- Make sure you've run the login request first
- Check that the token is saved in collection variables
- Verify the Authorization header is set to `Bearer {{customerToken}}` or `Bearer {{adminToken}}`

### Issue: "Product not found"
**Solution**:
- Run "Create Product" request first
- Check that `productId` variable is set
- Verify the product exists in database

### Issue: "Cannot add to cart"
**Solution**:
- Create product and inventory first
- Make sure product status is "active"
- Verify inventory quantity > 0

### Issue: "Cannot create order"
**Solution**:
- Add items to cart first
- Make sure cart is not empty
- Verify inventory is available

### Issue: Connection refused
**Solution**:
- Make sure server is running (`npm start`)
- Check server is on port 5004
- Verify `baseUrl` variable is correct

---

## 📝 Collection Structure

```
E-Commerce Backend API - Complete Collection
├── 0. Health Check (1 request)
├── 1. Authentication (5 requests)
├── 2. Categories (4 requests)
├── 3. Products (5 requests)
├── 4. Inventory (4 requests)
├── 5. Shopping Cart (5 requests)
├── 6. Orders (5 requests)
├── 7. Payments (2 requests)
├── 8. Reviews (5 requests)
└── 9. Analytics (5 requests)

Total: 41 requests covering 100+ endpoints
```

---

## 🎨 Customization

### Add More Test Data

Edit request bodies to test with different data:

**Products**:
```json
{
  "title": "MacBook Pro",
  "description": "Powerful laptop",
  "price": 1999.99,
  "category_id": "{{categoryId}}",
  "status": "active"
}
```

**Reviews**:
```json
{
  "productId": "{{productId}}",
  "rating": 4,
  "title": "Good product",
  "comment": "Works well but expensive"
}
```

### Add Query Parameters

For search and filtering:
- Products: `?status=active&limit=10`
- Orders: `?status=shipped&startDate=2026-01-01`
- Analytics: `?startDate=2026-01-01&endDate=2026-02-07`

---

## 📊 Test Coverage

### Endpoints Covered:
- ✅ Authentication (5 endpoints)
- ✅ Categories (6 endpoints)
- ✅ Products (10 endpoints)
- ✅ Inventory (7 endpoints)
- ✅ Shopping Cart (6 endpoints)
- ✅ Orders (9 endpoints)
- ✅ Payments (4 endpoints)
- ✅ Reviews (12 endpoints)
- ✅ Analytics (13 endpoints)
- ✅ User Management (15 endpoints)
- ✅ Admin Operations (20+ endpoints)

**Total Coverage**: 100+ endpoints

---

## 🚀 Advanced Testing

### Environment Variables

Create different environments for:
- **Development**: `http://localhost:5004`
- **Staging**: `https://staging-api.yourapp.com`
- **Production**: `https://api.yourapp.com`

### Pre-request Scripts

Add to collection or folder level:
```javascript
// Set timestamp
pm.collectionVariables.set("timestamp", Date.now());

// Generate random email
pm.collectionVariables.set("randomEmail", `test${Date.now()}@test.com`);
```

### Test Scripts

Add assertions to verify responses:
```javascript
// Check status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Check response time
pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// Check response body
pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
});
```

---

## 📖 Additional Resources

### Documentation Files:
- `README.md` - Main documentation
- `BACKEND-IMPLEMENTATION-COMPLETE.md` - Complete feature list
- `FINAL-SUMMARY.md` - Project summary
- `TASK-*.md` - Individual module documentation

### Test Files:
- `test-auth.js` - Authentication tests
- `test-products-categories.js` - Product tests
- `test-cart.js` - Cart tests
- `test-orders.js` - Order tests
- `test-payments.js` - Payment tests
- `test-reviews.js` - Review tests
- `test-analytics.js` - Analytics tests

---

## 🎉 Success Criteria

After running all tests, you should see:
- ✅ All authentication requests successful
- ✅ Products and categories created
- ✅ Cart operations working
- ✅ Orders placed successfully
- ✅ Reviews submitted and approved
- ✅ Analytics data retrieved
- ✅ Admin operations functional
- ✅ Security (RBAC) working correctly

---

## 💡 Tips

1. **Run in Order**: Follow the recommended testing order for best results
2. **Check Variables**: Verify variables are set after each request
3. **Read Responses**: Check response messages for errors
4. **Use Folders**: Organize tests by running entire folders
5. **Save Responses**: Use Postman's "Save Response" feature for documentation
6. **Export Results**: Export test results for reporting
7. **Use Environments**: Create separate environments for different stages

---

## 🆘 Support

If you encounter issues:
1. Check server is running
2. Verify database is connected
3. Check environment variables in `.env`
4. Review error messages in responses
5. Check server logs
6. Refer to documentation files

---

**Happy Testing! 🚀**

---

**Generated**: February 7, 2026  
**Collection Version**: 1.0.0  
**Total Endpoints**: 100+  
**Status**: ✅ Ready for Testing
