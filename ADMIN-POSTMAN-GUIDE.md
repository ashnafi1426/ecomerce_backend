# 🔐 ADMIN POSTMAN COLLECTION GUIDE

## 📦 File Generated

**File**: `E-Commerce-Admin-Complete.postman_collection.json`  
**Total Requests**: 59 admin endpoints  
**Status**: ✅ Ready to import

---

## 🚀 Quick Start

### Step 1: Import Collection
1. Open Postman
2. Click **"Import"**
3. Select: `E-Commerce-Admin-Complete.postman_collection.json`
4. Click **"Import"**

### Step 2: Create Admin Account

**IMPORTANT**: You need to create an admin account first!

#### Option 1: Register then Update Role in Database
1. Use "Login Admin" request with these credentials:
   ```json
   {
     "email": "admin@ecommerce.com",
     "password": "Admin123!@#"
   }
   ```
2. If account doesn't exist, register first using customer registration
3. Then manually update the role in your Supabase database:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin@ecommerce.com';
   ```

#### Option 2: Direct Database Insert
Run this in your Supabase SQL Editor:
```sql
INSERT INTO users (email, password_hash, role, display_name, status)
VALUES (
  'admin@ecommerce.com',
  '$2b$10$YourHashedPasswordHere',  -- Use bcrypt to hash "Admin123!@#"
  'admin',
  'Admin User',
  'active'
);
```

### Step 3: Login as Admin
1. Run the **"Login Admin"** request
2. Token will be automatically saved to `{{adminToken}}` variable
3. All other requests will use this token

### Step 4: Test Admin Operations
Now you can test all admin endpoints!

---

## 📋 Collection Structure

### 0. Health Check (1 request)
- ✅ Health Check - Verify server is running

### 1. Admin Authentication (3 requests)
- ✅ Login Admin - Get JWT token
- ✅ Get Admin Profile - View your profile
- ✅ Update Profile - Update display name and phone

### 2. User Management (11 requests)
- ✅ Get All Users - List all users
- ✅ Search Users - Search by email/name
- ✅ Get User by ID - View specific user
- ✅ Create User - Create new user account
- ✅ Update User - Update user details
- ✅ Get User Statistics - View user stats
- ✅ Update User Status - Change user status
- ✅ Block User - Block a user
- ✅ Unblock User - Unblock a user
- ✅ Assign Role - Change user role
- ✅ Delete User - Delete user account

### 3. Category Management (5 requests)
- ✅ Get All Categories - List all categories
- ✅ Create Category - Add new category
- ✅ Get Category by ID - View specific category
- ✅ Update Category - Update category details
- ✅ Delete Category - Remove category

### 4. Product Management (6 requests)
- ✅ Get All Products - List all products
- ✅ Search Products - Search products
- ✅ Create Product - Add new product
- ✅ Get Product by ID - View specific product
- ✅ Update Product - Update product details
- ✅ Delete Product - Remove product

### 5. Inventory Management (6 requests)
- ✅ Get All Inventory - View all inventory
- ✅ Create Inventory - Add inventory for product
- ✅ Get Inventory by Product - View product inventory
- ✅ Update Inventory - Update stock levels
- ✅ Get Low Stock Products - View low stock alerts
- ✅ Get Inventory Reports - View inventory reports

### 6. Order Management (5 requests)
- ✅ Get All Orders - List all orders
- ✅ Get Order by ID - View specific order
- ✅ Update Order Status - Change order status
- ✅ Get Orders by Status - Filter by status
- ✅ Get Recent Orders - View recent orders

### 7. Payment Management (4 requests)
- ✅ Get All Payments - List all payments
- ✅ Get Payment Statistics - View payment stats
- ✅ Process Refund - Refund a payment
- ✅ Sync Payment Status - Sync with Stripe

### 8. Review Management (5 requests)
- ✅ Get All Reviews - List all reviews
- ✅ Get Pending Reviews - View pending reviews
- ✅ Get Review Statistics - View review stats
- ✅ Approve Review - Approve a review
- ✅ Reject Review - Reject a review

### 9. Analytics & Reports (13 requests)
- ✅ Dashboard - Comprehensive dashboard
- ✅ Sales Overview - Sales metrics
- ✅ Sales by Date - Sales in date range
- ✅ Top Products - Best selling products
- ✅ Revenue Overview - Revenue metrics
- ✅ Revenue by Category - Revenue per category
- ✅ Revenue Trends - Revenue over time
- ✅ Customer Statistics - Customer metrics
- ✅ Customer Segmentation - Customer groups
- ✅ Customer Retention - Retention metrics
- ✅ Inventory Overview - Inventory metrics
- ✅ Low Stock Report - Low stock items
- ✅ Inventory Turnover - Turnover metrics

---

## 🔑 Collection Variables

The collection uses these variables (auto-managed):

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `baseUrl` | API base URL | Manual (default: http://localhost:5004) |
| `adminToken` | Admin JWT token | ✅ After login |
| `userId` | User ID | ✅ After creating user |
| `productId` | Product ID | ✅ After creating product |
| `categoryId` | Category ID | ✅ After creating category |
| `orderId` | Order ID | ✅ From order operations |
| `reviewId` | Review ID | ✅ From review operations |
| `returnId` | Return ID | ✅ From return operations |
| `paymentId` | Payment ID | ✅ From payment operations |

---

## 🧪 Testing Workflow

### Complete Admin Test Flow:

1. **Login** → Get admin token
2. **Create Category** → Electronics
3. **Create Product** → iPhone 15 Pro
4. **Create Inventory** → Add 100 units
5. **View Analytics** → Check dashboard
6. **Manage Users** → View/update users
7. **Manage Orders** → Update order statuses
8. **Manage Reviews** → Approve/reject reviews
9. **View Reports** → Sales, revenue, inventory

---

## 📊 Expected Responses

### Login Admin (200 OK)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@ecommerce.com",
    "role": "admin",
    "displayName": "Admin User"
  }
}
```

### Get All Users (200 OK)
```json
[
  {
    "id": "uuid",
    "email": "user@test.com",
    "role": "customer",
    "displayName": "Test User",
    "status": "active",
    "created_at": "2026-02-07T..."
  }
]
```

### Dashboard (200 OK)
```json
{
  "sales": {
    "total_orders": 150,
    "total_revenue": 45000,
    "average_order_value": 300
  },
  "customers": {
    "total_customers": 500,
    "new_customers_this_month": 50
  },
  "inventory": {
    "total_products": 200,
    "low_stock_products": 15
  }
}
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error

**Cause**: No token or invalid token

**Solution**:
1. Run "Login Admin" request first
2. Check `adminToken` variable is set
3. Verify you're using admin account (not customer)

### Issue: "Forbidden" Error

**Cause**: User is not admin

**Solution**:
1. Check user role in database:
   ```sql
   SELECT email, role FROM users WHERE email = 'admin@ecommerce.com';
   ```
2. Update role if needed:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@ecommerce.com';
   ```

### Issue: "User not found"

**Cause**: Admin account doesn't exist

**Solution**:
1. Register account first
2. Update role to 'admin' in database
3. Login again

---

## 🔒 Security Notes

### Admin Credentials
- **Email**: `admin@ecommerce.com`
- **Password**: `Admin123!@#`
- **Role**: `admin` (must be set in database)

### Token Management
- Token expires in 7 days (default)
- Token is automatically saved after login
- All admin requests require valid token

### RBAC (Role-Based Access Control)
- All endpoints require `admin` role
- Customer tokens will be rejected
- Unauthorized access returns 403 Forbidden

---

## 📝 API Endpoints Reference

### Base URL
```
http://localhost:5004
```

### Authentication Header
```
Authorization: Bearer {{adminToken}}
```

### Common Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - No/invalid token
- `403 Forbidden` - Not admin
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 💡 Pro Tips

1. **Login First**: Always run "Login Admin" before other requests
2. **Check Variables**: Verify variables are set in collection variables tab
3. **Use Console**: Open Postman Console to see debug logs
4. **Save Responses**: Use "Save Response" for documentation
5. **Test in Order**: Follow the numbered folders for best results
6. **Create Test Data**: Use create endpoints to generate test data
7. **Monitor Analytics**: Check dashboard regularly

---

## 🎯 Common Admin Tasks

### Task 1: Create Complete Product
1. Create Category
2. Create Product (use categoryId)
3. Create Inventory (use productId)
4. Verify in "Get All Products"

### Task 2: Manage Orders
1. Get All Orders
2. Filter by status
3. Update order status
4. View analytics

### Task 3: Moderate Reviews
1. Get Pending Reviews
2. Approve or Reject
3. Check Review Statistics

### Task 4: View Analytics
1. Open Dashboard
2. Check Sales Overview
3. View Revenue Reports
4. Monitor Inventory

---

## ✅ Success Checklist

After importing and testing, you should be able to:

- [x] Login as admin
- [x] View all users
- [x] Create/update/delete categories
- [x] Create/update/delete products
- [x] Manage inventory
- [x] View and update orders
- [x] Process refunds
- [x] Moderate reviews
- [x] View comprehensive analytics
- [x] Generate reports

---

## 📞 Support

If you encounter issues:

1. Check server is running (`npm start`)
2. Verify admin role in database
3. Check token is saved in variables
4. Review server logs for errors
5. Test with curl to isolate Postman issues

---

## 🎉 Summary

**File**: `E-Commerce-Admin-Complete.postman_collection.json`  
**Total Requests**: 59 admin endpoints  
**Categories**: 10 sections  
**Status**: ✅ **READY TO USE**

**Import the collection and start managing your e-commerce platform!** 🚀

---

**Generated**: February 7, 2026  
**Version**: 1.0.0  
**For**: E-Commerce Backend API

**Happy Admin Testing! 👨‍💼**
