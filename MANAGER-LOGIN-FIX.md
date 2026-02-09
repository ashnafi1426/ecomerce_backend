# Manager Login Fix

## Problem

You got this error when trying to login as a manager:

```json
{
  "error": "Authentication Failed",
  "message": "Invalid email or password"
}
```

## Root Cause

**Manager accounts don't exist by default!**

- ❌ Managers cannot self-register
- ❌ No manager accounts were created during setup
- ✅ Managers must be created by admins

## Solution

I've created a manager account for you!

### Manager Credentials

```
Email: manager@test.com
Password: Manager123!@#
```

### Login in Postman

**Endpoint:** `POST http://localhost:5000/api/auth/login`

**Body:**
```json
{
  "email": "manager@test.com",
  "password": "Manager123!@#"
}
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "de2f6601-0b04-4c7a-9ca1-bca6a8c94822",
    "email": "manager@test.com",
    "role": "manager",
    "displayName": "Test Manager"
  }
}
```

## All Test Accounts

| Role | Email | Password | Can Self-Register? |
|------|-------|----------|-------------------|
| Customer | customer@test.com | Test123!@# | ✅ Yes |
| Seller | seller@test.com | Test123!@# | ✅ Yes |
| Manager | manager@test.com | Manager123!@# | ❌ No |
| Admin | admin@test.com | Admin123!@# | ❌ No |

## Create More Accounts

### Create Another Manager

```bash
node create-manager-account.js
```

### Create Admin

```bash
node create-admin-account.js
```

### Check Existing Accounts

```bash
node check-manager-accounts.js
```

## Why This Happened

1. **Customers** can register themselves via `/api/auth/register`
2. **Sellers** can register themselves via `/api/auth/register/seller`
3. **Managers** must be created by admins (no self-registration)
4. **Admins** must be created manually or by other admins

This is by design for security - you don't want anyone to be able to create manager or admin accounts!

## Quick Test

```bash
# Test manager login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"Manager123!@#"}'
```

## Summary

✅ **Manager account created**  
✅ **You can now login as a manager**  
✅ **Use the credentials above**

**The manager login will now work!**
