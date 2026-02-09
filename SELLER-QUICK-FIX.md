# ⚡ Seller Registration - Quick Fix

## The Problem
```json
❌ WRONG - This will fail:
{
  "email": "sellerr@test.com",
  "password": "Test123!@#0",
  "full_name": "Test Seller",
  "business_name": "Test Store",
  "business_address": "123 Business St"
}
```

## The Solution
```json
✅ CORRECT - This will work:
{
  "email": "sellerr@test.com",
  "password": "Test123!@#0",
  "displayName": "Test Seller",
  "businessName": "Test Store",
  "businessInfo": {
    "address": "123 Business St"
  }
}
```

## Key Changes

| Wrong | Correct |
|-------|---------|
| `full_name` | `displayName` |
| `business_name` | `businessName` |
| `business_address` | `businessInfo.address` |

## Minimal Working Example
```json
{
  "email": "seller@test.com",
  "password": "Test123!@#",
  "businessName": "My Store"
}
```

That's it! Use **camelCase**, not **snake_case**.
