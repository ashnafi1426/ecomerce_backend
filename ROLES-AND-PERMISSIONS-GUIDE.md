# 🔐 Roles and Permissions Guide - FastShop Backend

## Overview

The FastShop e-commerce platform implements a **4-tier Role-Based Access Control (RBAC)** system with strict data isolation and permission management. This document explains each role, their permissions, and access levels.

---

## 📊 Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN (Level 4)                      │
│  Full System Access - Configuration & Management        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   MANAGER (Level 3)                     │
│  Operational Control - Approvals & Oversight            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   SELLER (Level 2)                      │
│  Vendor Access - Own Products & Orders                  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  CUSTOMER (Level 1)                     │
│  Buyer Access - Browse & Purchase                       │
└─────────────────────────────────────────────────────────┘
```

---

## 1. 👤 CUSTOMER Role

### Role Definition
- **Role Code:** `customer`
- **Authority Level:** READ + TRANSACTION PERMISSIONS
- **Access Scope:** Public Products + Own Transaction Data
- **Primary Purpose:** Browse and purchase products

### Key Responsibilities
1. Browse and search products
2. Add products to cart
3. Complete purchases
4. Track orders
5. Leave reviews and ratings
6. Request returns and refunds
7. Manage personal account

### Permissions

#### ✅ CAN DO:
- **Product Access:**
  - Browse all approved products
  - Search and filter products
  - View product details and images
  - View seller public profiles
  - Read product reviews

- **Shopping:**
  - Add items to cart
  - Apply coupons and discounts
  - Complete checkout
  - Make payments
  - Track order status

- **Account Management:**
  - Create and manage account
  - Update profile information
  - Manage addresses
  - View order history
  - View payment history

- **Post-Purchase:**
  - Leave product reviews
  - Submit delivery ratings
  - Request replacements
  - Request refunds
  - Create disputes
  - Contact sellers (through platform)

#### ❌ CANNOT DO:
- Access other customers' data
- View seller financial information
- Access seller dashboard
- Modify product prices
- Access admin functions
- View unapproved products
- Access system configuration

### Authentication
```javascript
// Registration
POST /api/auth/register
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "role": "customer"  // Default role
}

// Login
POST /api/auth/login
{
  "email": "customer@example.com",
  "password": "SecurePass123!"
}
```

### Default Credentials (Testing)
```
Email: customer@test.com
Password: Test123!@#
```

---

## 2. 🏪 SELLER Role

### Role Definition
- **Role Code:** `seller`
- **Authority Level:** OWN DATA ONLY
- **Access Scope:** Own Products, Orders, and Financial Data
- **Primary Purpose:** Sell products on the marketplace

### Key Responsibilities
1. Create and manage product listings
2. Manage inventory
3. Fulfill customer orders
4. Handle shipping and tracking
5. Respond to customer inquiries
6. Monitor sales performance
7. Manage payouts and earnings

### Permissions

#### ✅ CAN DO:
- **Product Management:**
  - Create new products (requires Manager approval)
  - Edit own products
  - Delete own products
  - Create product variants
  - Manage product inventory
  - Upload product images

- **Order Management:**
  - View orders containing own products
  - Update order status
  - Update shipping information
  - Mark orders as shipped/delivered
  - View sub-orders

- **Financial:**
  - View own earnings
  - View commission deductions
  - View payout history
  - Request payouts
  - View seller balance

- **Performance:**
  - View own sales analytics
  - View delivery ratings
  - View product reviews
  - View performance metrics

- **Customer Interaction:**
  - Respond to customer reviews
  - View customer information (for own orders only)
  - Update replacement shipments

#### ❌ CANNOT DO:
- Access other sellers' data
- View other sellers' products
- Modify commission rates
- Process refunds (Manager handles this)
- Approve own products
- Access customer data beyond own orders
- View platform-wide statistics
- Access admin functions

### Data Isolation
**CRITICAL:** Sellers can ONLY see their own data. The system enforces strict data isolation:

```javascript
// Example: Seller can only query their own products
SELECT * FROM products WHERE seller_id = :current_seller_id

// Example: Seller can only see orders with their products
SELECT * FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE p.seller_id = :current_seller_id
```

### Authentication
```javascript
// Seller Registration
POST /api/auth/register/seller
{
  "email": "seller@example.com",
  "password": "SecurePass123!",
  "full_name": "Jane Smith",
  "business_name": "Smith's Store",
  "business_address": "123 Business St"
}

// Login (same as customer)
POST /api/auth/login
{
  "email": "seller@example.com",
  "password": "SecurePass123!"
}
```

### Seller Verification Status
- **Pending:** Account created, awaiting verification
- **Verified:** Approved by Manager/Admin, can sell
- **Rejected:** Application denied
- **Suspended:** Temporarily blocked from selling

### Default Credentials (Testing)
```
Email: seller@test.com
Password: Test123!@#
```

---

## 3. 👔 MANAGER Role

### Role Definition
- **Role Code:** `manager`
- **Authority Level:** OPERATIONAL CONTROL
- **Access Scope:** Operational Data and Functions
- **Primary Purpose:** Oversee marketplace operations

### Key Responsibilities
1. Approve/reject seller products
2. Monitor order fulfillment
3. Resolve customer disputes
4. Process refunds and returns
5. Verify seller accounts
6. Monitor seller performance
7. Generate operational reports

### Permissions

#### ✅ CAN DO:
- **Product Management:**
  - View all pending products
  - Approve products
  - Reject products
  - Request product changes
  - View product approval queue

- **Order Management:**
  - View all orders (across all sellers)
  - Monitor order fulfillment
  - Intervene in problematic orders
  - Update order status (if needed)

- **Seller Management:**
  - View all sellers
  - Verify seller accounts
  - Approve/reject seller applications
  - Monitor seller performance
  - Suspend sellers (temporarily)

- **Customer Service:**
  - Resolve disputes
  - Process refunds (full and partial)
  - Approve replacement requests
  - Handle customer complaints
  - Issue goodwill refunds

- **Financial Oversight:**
  - View payment transactions
  - Monitor refund requests
  - View commission reports
  - Approve payout requests

- **Promotions:**
  - Create coupons
  - Create promotions
  - Manage discount campaigns
  - View coupon analytics

- **Analytics:**
  - View operational reports
  - View seller performance metrics
  - View delivery rating analytics
  - View refund analytics
  - View replacement analytics

#### ❌ CANNOT DO:
- Modify system configuration
- Change commission rates
- Configure payment gateways
- Delete user accounts permanently
- Access database directly
- Modify security settings
- Create/delete admin accounts
- Access financial configuration

### Manager vs Admin
| Function | Manager | Admin |
|----------|---------|-------|
| Approve Products | ✅ | ✅ |
| Configure Approval Rules | ❌ | ✅ |
| Process Refunds | ✅ | ✅ |
| Configure Refund Policies | ❌ | ✅ |
| View Transactions | ✅ | ✅ |
| Configure Payment Gateway | ❌ | ✅ |
| Suspend Sellers | ✅ (Temp) | ✅ (Permanent) |
| System Configuration | ❌ | ✅ |

### Authentication
```javascript
// Manager accounts are created by Admin
// Login (same endpoint as other roles)
POST /api/auth/login
{
  "email": "manager@example.com",
  "password": "SecurePass123!"
}
```

### Default Credentials (Testing)
```
Email: manager@test.com
Password: Test123!@#
```

---

## 4. 👨‍💼 ADMIN Role

### Role Definition
- **Role Code:** `admin`
- **Authority Level:** FULL SYSTEM ACCESS
- **Access Scope:** Everything
- **Primary Purpose:** System administration and configuration

### Key Responsibilities
1. System configuration
2. User management (all roles)
3. Commission rate management
4. Payment gateway configuration
5. Security policy management
6. Database management
7. Platform-wide analytics
8. Final decision authority

### Permissions

#### ✅ CAN DO (Everything):
- **User Management:**
  - Create/edit/delete all user accounts
  - Assign roles and permissions
  - Manage managers
  - Permanently suspend/delete accounts
  - Reset passwords

- **System Configuration:**
  - Configure commission rates
  - Configure tax rules
  - Configure payment gateways
  - Configure shipping providers
  - Configure email templates
  - Configure security policies

- **Financial Management:**
  - View all financial data
  - Configure commission structure
  - Manage payout schedules
  - View platform revenue
  - Generate financial reports

- **Product Management:**
  - Approve/reject products
  - Configure approval rules
  - Manage categories
  - Configure product policies

- **Order Management:**
  - View all orders
  - Override order status
  - Cancel any order
  - Process any refund

- **Analytics:**
  - View all reports
  - Platform-wide analytics
  - Financial reports
  - Performance metrics
  - Audit logs

- **Security:**
  - View audit logs
  - Configure security settings
  - Manage API access
  - Configure rate limiting
  - Monitor security incidents

#### ❌ CANNOT DO:
- Nothing - Admin has full access

### Authentication
```javascript
// Admin accounts are created manually or by other admins
// Login (same endpoint)
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

### Default Credentials (Testing)
```
Email: admin@test.com
Password: Test123!@#
```

---

## 🔒 Permission Matrix

### Complete Permission Comparison

| Permission | Customer | Seller | Manager | Admin |
|------------|----------|--------|---------|-------|
| **Products** |
| Browse Products | ✅ | ✅ | ✅ | ✅ |
| Create Products | ❌ | ✅ | ❌ | ✅ |
| Approve Products | ❌ | ❌ | ✅ | ✅ |
| Delete Any Product | ❌ | Own Only | ❌ | ✅ |
| **Orders** |
| Place Orders | ✅ | ❌ | ❌ | ✅ |
| View Own Orders | ✅ | ✅ | ✅ | ✅ |
| View All Orders | ❌ | ❌ | ✅ | ✅ |
| Cancel Orders | Own Only | Own Only | ✅ | ✅ |
| **Payments** |
| Make Payments | ✅ | ❌ | ❌ | ✅ |
| View Own Payments | ✅ | ✅ | ❌ | ✅ |
| View All Payments | ❌ | ❌ | ✅ | ✅ |
| Configure Gateway | ❌ | ❌ | ❌ | ✅ |
| **Refunds** |
| Request Refund | ✅ | ❌ | ❌ | ✅ |
| Process Refund | ❌ | ❌ | ✅ | ✅ |
| Configure Policy | ❌ | ❌ | ❌ | ✅ |
| **Users** |
| Manage Own Account | ✅ | ✅ | ✅ | ✅ |
| View Other Users | ❌ | ❌ | Limited | ✅ |
| Delete Users | ❌ | ❌ | ❌ | ✅ |
| Assign Roles | ❌ | ❌ | ❌ | ✅ |
| **System** |
| View Analytics | Own Only | Own Only | Operational | All |
| Configure System | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ✅ |
| Manage API | ❌ | ❌ | ❌ | ✅ |

---

## 🛡️ Security Implementation

### Role Middleware
```javascript
// Require specific role
const { requireAdmin, requireManager, requireSeller, requireCustomer } = require('./middlewares/role.middleware');

// Admin only
router.get('/admin/users', authenticate, requireAdmin, controller.getUsers);

// Manager or Admin
router.post('/manager/products/:id/approve', authenticate, requireMinRole('manager'), controller.approveProduct);

// Seller only
router.post('/seller/products', authenticate, requireSeller, controller.createProduct);

// Customer only
router.post('/cart/items', authenticate, requireCustomer, controller.addToCart);
```

### Data Isolation
```javascript
// Sellers can only access their own data
const getSellerProducts = async (req, res) => {
  const sellerId = req.user.id; // From JWT token
  
  // Query automatically filters by seller_id
  const products = await Product.findAll({
    where: { seller_id: sellerId }
  });
  
  res.json({ products });
};
```

### JWT Token Structure
```javascript
{
  "userId": "uuid",
  "role": "customer|seller|manager|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 📝 Testing with Postman

### 1. Login as Different Roles

```javascript
// Login as Customer
POST {{base_url}}/api/auth/login
{
  "email": "customer@test.com",
  "password": "Test123!@#"
}
// Token auto-saves as customer_token

// Login as Seller
POST {{base_url}}/api/auth/login
{
  "email": "seller@test.com",
  "password": "Test123!@#"
}
// Token auto-saves as seller_token

// Login as Manager
POST {{base_url}}/api/auth/login
{
  "email": "manager@test.com",
  "password": "Test123!@#"
}
// Token auto-saves as manager_token

// Login as Admin
POST {{base_url}}/api/auth/login
{
  "email": "admin@test.com",
  "password": "Test123!@#"
}
// Token auto-saves as admin_token
```

### 2. Use Role-Specific Tokens

```javascript
// Customer endpoint - use customer_token
GET {{base_url}}/api/cart
Authorization: Bearer {{customer_token}}

// Seller endpoint - use seller_token
GET {{base_url}}/api/seller/products
Authorization: Bearer {{seller_token}}

// Manager endpoint - use manager_token
GET {{base_url}}/api/manager/products/pending
Authorization: Bearer {{manager_token}}

// Admin endpoint - use admin_token
GET {{base_url}}/api/admin/users
Authorization: Bearer {{admin_token}}
```

### 3. Test Permission Boundaries

```javascript
// This should FAIL (403 Forbidden)
// Customer trying to access seller endpoint
GET {{base_url}}/api/seller/products
Authorization: Bearer {{customer_token}}

// This should FAIL (403 Forbidden)
// Seller trying to access admin endpoint
GET {{base_url}}/api/admin/users
Authorization: Bearer {{seller_token}}

// This should SUCCEED
// Manager accessing manager endpoint
GET {{base_url}}/api/manager/products/pending
Authorization: Bearer {{manager_token}}
```

---

## 🎯 Common Use Cases

### Customer Journey
1. Register → Login → Browse Products → Add to Cart → Checkout → Track Order → Leave Review

### Seller Journey
1. Register → Verify Account → Create Products → Wait for Approval → Fulfill Orders → Track Earnings → Request Payout

### Manager Journey
1. Login → Review Pending Products → Approve/Reject → Monitor Orders → Resolve Disputes → Process Refunds

### Admin Journey
1. Login → Configure System → Manage Users → Set Commission Rates → View Analytics → Monitor Platform

---

## 📚 Related Documentation

- **Complete Postman Guide:** `COMPLETE-POSTMAN-GUIDE.md`
- **API Documentation:** `PHASE6-API-DOCUMENTATION.md`
- **Quick Start:** `POSTMAN-QUICK-START.md`
- **Backend Summary:** `PHASE6-BACKEND-COMPLETE.md`

---

## 🔑 Quick Reference

### Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@test.com | Test123!@# |
| Seller | seller@test.com | Test123!@# |
| Manager | manager@test.com | Test123!@# |
| Admin | admin@test.com | Test123!@# |

### Role Codes
- `customer` - Level 1
- `seller` - Level 2
- `manager` - Level 3
- `admin` - Level 4

### Token Variables (Postman)
- `{{customer_token}}` - Customer authentication
- `{{seller_token}}` - Seller authentication
- `{{manager_token}}` - Manager authentication
- `{{admin_token}}` - Admin authentication
- `{{token}}` - Current active token

---

**Last Updated:** February 9, 2026  
**Version:** 6.0.0  
**Status:** Complete
