# User Accounts Guide

## Available User Roles

Your e-commerce platform has 4 user roles:

1. **Customer** - Can register themselves
2. **Seller** - Can register themselves (requires admin approval)
3. **Manager** - Must be created by admin
4. **Admin** - Must be created manually or by another admin

## How to Create Each Role

### 1. Customer (Self-Registration)

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "email": "customer@test.com",
  "password": "Test123!@#",
  "displayName": "Test Customer"
}
```

**Login:**
```json
{
  "email": "customer@test.com",
  "password": "Test123!@#"
}
```

### 2. Seller (Self-Registration)

**Endpoint:** `POST /api/auth/register/seller`

**Body:**
```json
{
  "email": "seller@test.com",
  "password": "Test123!@#",
  "displayName": "Test Seller",
  "businessName": "My Business",
  "phone": "+1234567890",
  "businessInfo": {
    "description": "Business description",
    "email": "business@test.com",
    "phone": "+1234567890",
    "address": "123 Business St",
    "taxId": "TAX123"
  }
}
```

**Login:**
```json
{
  "email": "seller@test.com",
  "password": "Test123!@#"
}
```

**Note:** Sellers are created with `verification_status: 'pending'` and need admin approval.

### 3. Manager (Created by Admin)

**Cannot self-register!** Run this script:

```bash
node create-manager-account.js
```

This creates a manager with:
- **Email:** `manager@test.com`
- **Password:** `Manager123!@#`

**Login:**
```json
{
  "email": "manager@test.com",
  "password": "Manager123!@#"
}
```

### 4. Admin (Created Manually)

**Cannot self-register!** Run this script:

```bash
node create-admin-account.js
```

Or check existing admins in `ADMIN-CREDENTIALS.md`

**Login:**
```json
{
  "email": "admin@test.com",
  "password": "Admin123!@#"
}
```

## Current Test Accounts

After running the setup scripts, you'll have:

| Role | Email | Password | Status |
|------|-------|----------|--------|
| Customer | customer@test.com | Test123!@# | Active |
| Seller | seller@test.com | Test123!@# | Pending Approval |
| Manager | manager@test.com | Manager123!@# | Active |
| Admin | admin@test.com | Admin123!@# | Active |

## Login Endpoint (All Roles)

**All roles use the same login endpoint:**

```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@test.com",
  "password": "password"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@test.com",
    "role": "manager",
    "displayName": "User Name"
  }
}
```

## Why Manager Login Failed

The error `"Invalid email or password"` occurred because:

1. ❌ No manager account existed in the database
2. ❌ Managers cannot self-register
3. ✅ Managers must be created by admins

## Quick Setup Commands

### Create All Test Accounts

```bash
# Create manager account
node create-manager-account.js

# Create admin account (if needed)
node create-admin-account.js

# Check what accounts exist
node check-manager-accounts.js
```

### Test Login for Each Role

```bash
# Test customer login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"Test123!@#"}'

# Test seller login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@test.com","password":"Test123!@#"}'

# Test manager login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"Manager123!@#"}'

# Test admin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!@#"}'
```

## Role Permissions

### Customer
- Browse products
- Add to cart
- Place orders
- View order history
- Request returns
- Leave reviews

### Seller
- Create products (requires manager approval)
- Manage inventory
- View sales
- Process orders
- View earnings
- Respond to reviews

### Manager
- Approve/reject products
- Approve/reject sellers
- Manage disputes
- View all orders
- Generate reports
- Moderate reviews

### Admin
- Full system access
- Create managers
- Manage all users
- System configuration
- View analytics
- Manage categories

## Troubleshooting

### "Invalid email or password"

**Possible causes:**

1. **Account doesn't exist**
   - Run: `node check-manager-accounts.js`
   - Create account if needed

2. **Wrong password**
   - Check password is correct
   - Password is case-sensitive
   - Must be at least 8 characters

3. **Account not active**
   - Check user status in database
   - Status must be 'active'

4. **Wrong email**
   - Check email is correct
   - Email is case-sensitive

### Create Missing Accounts

```bash
# Create manager
node create-manager-account.js

# Create admin
node create-admin-account.js

# Check all users
node test-login-debug.js
```

## Summary

✅ **Manager account created successfully!**

**Login credentials:**
- Email: `manager@test.com`
- Password: `Manager123!@#`

**Use in Postman:**
```json
POST http://localhost:5000/api/auth/login

{
  "email": "manager@test.com",
  "password": "Manager123!@#"
}
```

**You should now be able to login as a manager!**
