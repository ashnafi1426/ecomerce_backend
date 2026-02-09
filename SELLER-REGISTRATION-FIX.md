# 🔧 Seller Registration Fix

## Problem

You got this error when trying to register as a seller:

```json
{
  "error": "Validation Error",
  "message": "Email, password, and business name are required"
}
```

**Your Request Body:**
```json
{
  "email": "sellerr@test.com",
  "password": "Test123!@#0",
  "full_name": "Test Seller",
  "business_name": "Test Store",
  "business_address": "123 Business St"
}
```

## Root Cause

**You're using WRONG field names!**

- ❌ `full_name` - Wrong field name
- ❌ `business_name` - Wrong (uses underscore)
- ❌ `business_address` - Not a top-level field

## ✅ Correct Field Names

The seller registration endpoint expects:

### Required Fields:
- `email` ✅
- `password` ✅
- `businessName` ✅ (camelCase, not snake_case!)

### Optional Fields:
- `displayName` (not `full_name`)
- `phone`
- `businessInfo` (object containing address and other details)

---

## 🔑 Correct Request Format

### Endpoint
```
POST /api/auth/register/seller
```

### Correct Body (Minimal)
```json
{
  "email": "sellerr@test.com",
  "password": "Test123!@#0",
  "businessName": "Test Store"
}
```

### Correct Body (Complete)
```json
{
  "email": "sellerr@test.com",
  "password": "Test123!@#0",
  "displayName": "Test Seller",
  "businessName": "Test Store",
  "phone": "+1234567890",
  "businessInfo": {
    "description": "My test store",
    "email": "business@test.com",
    "phone": "+1234567890",
    "address": "123 Business St",
    "taxId": "TAX123"
  }
}
```

---

## 📋 Field Name Comparison

| ❌ Wrong | ✅ Correct | Required? |
|---------|-----------|-----------|
| `full_name` | `displayName` | No |
| `business_name` | `businessName` | Yes |
| `business_address` | `businessInfo.address` | No |

---

## 🧪 Test in Postman

### Step 1: Set Endpoint
```
POST http://localhost:5000/api/auth/register/seller
```

### Step 2: Set Headers
```
Content-Type: application/json
```

### Step 3: Set Body (raw JSON)
```json
{
  "email": "sellerr@test.com",
  "password": "Test123!@#0",
  "displayName": "Test Seller",
  "businessName": "Test Store",
  "phone": "+1234567890",
  "businessInfo": {
    "address": "123 Business St",
    "description": "My test store"
  }
}
```

### Step 4: Expected Response (201 Created)
```json
{
  "message": "Seller account created successfully. Pending admin approval.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "seller": {
    "id": "uuid",
    "email": "sellerr@test.com",
    "role": "seller",
    "displayName": "Test Seller",
    "businessName": "Test Store",
    "verificationStatus": "pending"
  }
}
```

---

## 🔒 Password Requirements

- Minimum 8 characters ✅
- Your password `Test123!@#0` meets requirements ✅

---

## 📝 Important Notes

### 1. Verification Status
- New sellers are created with `verificationStatus: 'pending'`
- Admin must approve before seller can list products
- Check status: `GET /api/auth/seller/status`

### 2. Field Name Rules
- Use **camelCase** for all fields (e.g., `businessName`)
- NOT snake_case (e.g., `business_name`)
- This is consistent with JavaScript naming conventions

### 3. Business Info
- `businessInfo` is an **object**, not individual fields
- Put address, description, etc. inside `businessInfo`

---

## 🚀 Quick Test with curl

```bash
curl -X POST http://localhost:5000/api/auth/register/seller \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sellerr@test.com",
    "password": "Test123!@#0",
    "displayName": "Test Seller",
    "businessName": "Test Store",
    "phone": "+1234567890",
    "businessInfo": {
      "address": "123 Business St",
      "description": "My test store"
    }
  }'
```

---

## 🐛 Common Mistakes

### Mistake 1: Using snake_case
```json
❌ "business_name": "Test Store"
✅ "businessName": "Test Store"
```

### Mistake 2: Using wrong field names
```json
❌ "full_name": "Test Seller"
✅ "displayName": "Test Seller"
```

### Mistake 3: Address as top-level field
```json
❌ "business_address": "123 Business St"
✅ "businessInfo": { "address": "123 Business St" }
```

---

## ✅ Summary

**The issue is field naming!**

Change your request from:
```json
{
  "email": "sellerr@test.com",
  "password": "Test123!@#0",
  "full_name": "Test Seller",           ❌
  "business_name": "Test Store",        ❌
  "business_address": "123 Business St" ❌
}
```

To:
```json
{
  "email": "sellerr@test.com",
  "password": "Test123!@#0",
  "displayName": "Test Seller",         ✅
  "businessName": "Test Store",         ✅
  "businessInfo": {                     ✅
    "address": "123 Business St"
  }
}
```

**Now try again and it will work!** 🚀

---

**Created**: February 9, 2026  
**Issue**: Wrong field names in seller registration  
**Solution**: Use camelCase field names as documented above
