# Complete Backend API - Postman Collection Guide

## Overview

This guide explains how to use the **Complete-Backend-API.postman_collection.json** file to test all backend endpoints across all phases (1-6) for the FastShop e-commerce platform.

## Features

✅ **150+ Endpoints** - Complete coverage of all backend APIs  
✅ **Auto-Save Base URL** - Automatically sets to `http://localhost:5000`  
✅ **Auto-Save Tokens** - Saves tokens for all roles (Customer, Seller, Manager, Admin)  
✅ **Auto-Save IDs** - Automatically saves all resource IDs (product_id, order_id, etc.)  
✅ **All Phases Included** - Phases 1-6 with all critical features  
✅ **Role-Based Testing** - Separate authentication for each role  

---

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `Complete-Backend-API.postman_collection.json`
4. Collection will appear in your workspace

### 2. Setup Environment (Optional)

The collection auto-creates variables, but you can create an environment:

1. Click **Environments** in Postman
2. Create new environment: "FastShop Backend"
3. Add variable: `base_url` = `http://localhost:5000`
4. Save and select the environment

### 3. Start Testing

1. Expand **"0. Authentication (All Roles)"** folder
2. Run **"Login Admin"** to get admin token
3. Token automatically saves as `admin_token` and `token`
4. Continue testing other endpoints

---

## Collection Structure

### 0. Authentication (All Roles)
- Register Customer
- Login Customer
- Register Seller
- Login Seller
- Login Manager
- Login Admin
- Get Current User Profile
- Update Profile
- Get Seller Status

### 1. Categories
- Get All Categories
- Get Category by ID
- Create Category (Admin)
- Update Category (Admin)
- Delete Category (Admin)

### 2. Products
- Get All Products (Public)
- Search Products
- Get Product by ID
- Get Seller Products
- Create Product (Seller)
- Update Product (Seller)
- Delete Product (Seller)
- Get Approval Queue (Manager)
- Approve Product (Manager)
- Reject Product (Manager)

### 3. Product Variants (Phase 6)
- Create Variant (Seller)
- Get Product Variants
- Get Variant by ID
- Update Variant (Seller)
- Delete Variant (Seller)
- Get Variant Inventory
- Update Variant Inventory
- Bulk Update Variants

### 4. Shopping Cart
- Get Cart
- Get Cart Summary
- Get Cart Count
- Add Item to Cart
- Update Cart Item Quantity
- Remove Item from Cart
- Clear Cart
- Validate Cart

### 5. Coupons & Promotions (Phase 6)
- Create Coupon (Manager)
- Get All Coupons (Manager)
- Get Coupon by ID
- Validate Coupon (Customer)
- Apply Coupon (Customer)
- Update Coupon (Manager)
- Deactivate Coupon (Manager)
- Get Coupon Analytics (Manager)
- Create Promotion (Manager)
- Get Active Promotions
- Get Promotion by ID
- Update Promotion (Manager)
- Delete Promotion (Manager)
- Get Promotion Analytics (Manager)

### 6. Payments
- Create Payment Intent
- Get Payment by ID
- Get All Payments (Admin)
- Get Payment Statistics (Admin)

### 7. Orders
- Create Order from Cart
- Get My Orders
- Get Order by ID
- Cancel Order
- Get Invoice
- Get Order Refunds
- Get Order with Refund Details
- Check Refund Eligibility
- Get All Orders (Admin)
- Get Order Statistics (Admin)
- Get Recent Orders (Admin)
- Update Order Status (Admin)

### 8. Delivery Ratings (Phase 6)
- Submit Delivery Rating (Customer)
- Get Order Delivery Rating
- Get Seller Delivery Metrics
- Get Seller Rating Distribution
- Get Delivery Rating Analytics (Manager)
- Get Flagged Ratings (Manager)

### 9. Replacements (Phase 6)
- Create Replacement Request (Customer)
- Get My Replacement Requests (Customer)
- Get Replacement by ID
- Get All Replacements (Manager)
- Approve Replacement (Manager)
- Reject Replacement (Manager)
- Update Replacement Shipment (Seller)
- Mark Replacement Delivered (Seller)
- Get Replacement Analytics (Manager)

### 10. Enhanced Refunds (Phase 6)
- Create Refund Request (Customer)
- Get My Refund Requests (Customer)
- Get Refund by ID
- Get All Refunds (Manager)
- Process Partial Refund (Manager)
- Process Full Refund (Manager)
- Issue Goodwill Refund (Manager)
- Get Refund Analytics (Manager)
- Get Refund Trends (Manager)

### 11. Reviews
- Create Review (Customer)
- Get Product Reviews
- Get My Reviews (Customer)
- Update Review (Customer)
- Delete Review (Customer)
- Get Pending Reviews (Admin)
- Approve Review (Admin)
- Reject Review (Admin)

### 12. Addresses
- Create Address
- Get My Addresses
- Get Address by ID
- Update Address
- Delete Address
- Set Default Address

### 13. Inventory (Admin)
- Get All Inventory
- Get Product Inventory
- Update Inventory
- Get Low Stock Products
- Get Inventory History

### 14. Analytics (Admin/Manager)
- Get Dashboard Analytics
- Get Sales Overview
- Get Revenue Analytics
- Get Product Performance
- Get Customer Analytics
- Get Feature Analytics (Manager)

### 15. Users (Admin)
- Get All Users
- Get User by ID
- Update User Role
- Deactivate User
- Activate User
- Delete User

### 16. Sellers (Phase 5)
- Get All Sellers (Manager)
- Get Seller by ID
- Get Pending Sellers (Manager)
- Verify Seller (Manager)
- Reject Seller (Manager)
- Get Seller Performance

### 17. Notifications (Phase 5)
- Get My Notifications
- Get Unread Notifications
- Mark Notification as Read
- Mark All as Read
- Delete Notification

### 18. Disputes (Phase 5)
- Create Dispute (Customer)
- Get My Disputes (Customer)
- Get Dispute by ID
- Get All Disputes (Manager)
- Resolve Dispute (Manager)
- Add Dispute Message

### 19. Commissions (Phase 4)
- Get Commission Settings (Admin)
- Update Commission Settings (Admin)
- Get Seller Commissions
- Get Commission Report (Admin)

### 20. Seller Balance (Phase 4)
- Get My Balance (Seller)
- Get Balance History (Seller)
- Request Payout (Seller)
- Get Payout Requests (Admin)
- Process Payout (Admin)

### 21. Sub-Orders (Phase 4)
- Get Order Sub-Orders
- Get Seller Sub-Orders
- Update Sub-Order Status (Seller)

### 22. Audit Logs (Admin)
- Get Audit Logs
- Get User Audit Logs
- Get Entity Audit Logs

---

## Auto-Save Variables

The collection automatically saves these variables:

### Base Configuration
- `base_url` - API base URL (default: http://localhost:5000)

### Authentication Tokens
- `token` - Current active token
- `admin_token` - Admin user token
- `manager_token` - Manager user token
- `seller_token` - Seller user token
- `customer_token` - Customer user token

### Resource IDs
- `product_id` - Product ID
- `order_id` - Order ID
- `category_id` - Category ID
- `variant_id` - Variant ID
- `coupon_id` - Coupon ID
- `promotion_id` - Promotion ID
- `rating_id` - Delivery Rating ID
- `replacement_id` - Replacement Request ID
- `refund_id` - Refund Request ID
- `review_id` - Review ID
- `address_id` - Address ID
- `payment_intent_id` - Payment Intent ID
- `user_id` - User ID
- `seller_id` - Seller ID
- `notification_id` - Notification ID
- `dispute_id` - Dispute ID

---

## Testing Workflow

### Complete Testing Flow

1. **Authentication**
   ```
   Login Admin → Login Manager → Login Seller → Login Customer
   ```

2. **Setup Data**
   ```
   Create Category → Create Product (Seller) → Approve Product (Manager)
   ```

3. **Product Variants**
   ```
   Create Variant → Update Variant Inventory
   ```

4. **Discounts**
   ```
   Create Coupon → Create Promotion
   ```

5. **Shopping Flow**
   ```
   Add to Cart → Validate Cart → Create Payment Intent → Create Order
   ```

6. **Post-Purchase**
   ```
   Submit Delivery Rating → Create Review
   ```

7. **Customer Service**
   ```
   Create Replacement Request → Create Refund Request
   ```

8. **Management**
   ```
   Approve Replacement → Process Refund → View Analytics
   ```

### Role-Specific Testing

#### Customer Testing
1. Login Customer
2. Browse Products
3. Add to Cart
4. Create Order
5. Submit Rating
6. Create Review
7. Request Replacement/Refund

#### Seller Testing
1. Login Seller
2. Create Product
3. Create Variants
4. Update Inventory
5. View Orders
6. Update Shipment Status

#### Manager Testing
1. Login Manager
2. Approve Products
3. Create Coupons/Promotions
4. Approve Replacements
5. Process Refunds
6. View Analytics

#### Admin Testing
1. Login Admin
2. Manage Categories
3. Manage Users
4. View All Orders
5. View Analytics
6. Manage Inventory

---

## Tips & Best Practices

### 1. Token Management
- Always login first to get tokens
- Tokens auto-save for each role
- Use role-specific tokens for testing permissions

### 2. ID Management
- IDs auto-save after creation
- Use saved IDs in subsequent requests
- Check environment variables to see saved IDs

### 3. Testing Order
- Follow the collection order for best results
- Create dependencies first (categories before products)
- Test authentication before protected endpoints

### 4. Error Handling
- 401 = Not authenticated (login first)
- 403 = Insufficient permissions (use correct role)
- 404 = Resource not found (check ID)
- 400 = Validation error (check request body)

### 5. Data Cleanup
- Delete test data after testing
- Use admin endpoints to clean up
- Reset database if needed

---

## Common Issues & Solutions

### Issue: "Unauthorized" Error
**Solution:** Login first and ensure token is saved
```
1. Run "Login Admin" (or appropriate role)
2. Check that token is saved in environment
3. Retry the request
```

### Issue: "Resource Not Found"
**Solution:** Ensure resource was created and ID is saved
```
1. Check environment variables for the ID
2. Create the resource if it doesn't exist
3. Use the correct ID format (UUID)
```

### Issue: "Forbidden" Error
**Solution:** Use correct role token
```
1. Check endpoint requirements (Admin/Manager/Seller/Customer)
2. Login with correct role
3. Use role-specific token
```

### Issue: Base URL Not Working
**Solution:** Update base URL
```
1. Check if backend is running on port 5000
2. Update base_url variable if using different port
3. Ensure no trailing slash in base_url
```

---

## Advanced Features

### 1. Bulk Testing
Use Postman's Collection Runner:
1. Click on collection
2. Click "Run"
3. Select requests to run
4. Set iterations and delay
5. Run collection

### 2. Environment Variables
Create multiple environments:
- Development (localhost:5000)
- Staging (staging-url)
- Production (production-url)

### 3. Pre-request Scripts
Collection includes auto-setup scripts:
- Auto-set base URL
- Token validation
- Request logging

### 4. Test Scripts
Collection includes auto-save scripts:
- Token extraction
- ID extraction
- Response validation

---

## API Documentation Reference

For detailed API documentation, see:
- `PHASE6-API-DOCUMENTATION.md` - Phase 6 features
- `PHASE6-BACKEND-COMPLETE.md` - Complete backend summary
- `README.md` - General backend documentation

---

## Support

### Backend Issues
- Check backend logs: `ecomerce_backend/logs/`
- Verify database connection
- Ensure all migrations are run

### Postman Issues
- Update Postman to latest version
- Clear Postman cache
- Re-import collection

### Testing Issues
- Check request body format
- Verify authentication token
- Ensure correct role permissions

---

## Version History

### Version 6.0.0 (Current)
- Complete Phase 6 critical features
- 150+ endpoints
- Auto-save for all resources
- All roles supported

### Previous Versions
- Phase 5: Multi-vendor features
- Phase 4: Payment system
- Phase 3: Product management
- Phase 2: Admin features
- Phase 1: Core features

---

## Next Steps

1. **Import Collection** - Import into Postman
2. **Start Backend** - Ensure backend is running
3. **Login** - Get authentication tokens
4. **Test Endpoints** - Follow testing workflow
5. **Review Results** - Check responses and logs

---

## Quick Reference

### Default Credentials

**Admin:**
```
Email: admin@test.com
Password: Test123!@#
```

**Manager:**
```
Email: manager@test.com
Password: Test123!@#
```

**Seller:**
```
Email: seller@test.com
Password: Test123!@#
```

**Customer:**
```
Email: customer@test.com
Password: Test123!@#
```

### Base URL
```
http://localhost:5000
```

### Collection File
```
Complete-Backend-API.postman_collection.json
```

---

**Happy Testing! 🚀**
