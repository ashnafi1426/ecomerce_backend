# Quick Authentication Fix

## The Problem

Your Postman collection is using **WRONG field names**. The authentication is working fine, but the requests are incorrect.

## The Solution

### ❌ WRONG (What you're probably using)

```json
{
  "email": "customer@test.com",
  "password": "Test123!@#",
  "full_name": "Test Customer",  // ❌ WRONG FIELD NAME
  "role": "customer"              // ❌ NOT ACCEPTED
}
```

### ✅ CORRECT (What you should use)

```json
{
  "email": "customer@test.com",
  "password": "Test123!@#",
  "displayName": "Test Customer"  // ✅ CORRECT FIELD NAME
}
```

## Quick Steps to Fix

### 1. Start the Server

```bash
cd ecomerce_backend
npm start
```

### 2. Import Corrected Postman Collection

Import this file into Postman:
- `CORRECTED-AUTH-POSTMAN.json`

### 3. Test Registration

**POST** `http://localhost:5000/api/auth/register`

**Body:**
```json
{
  "email": "newuser@test.com",
  "password": "Test123!@#",
  "displayName": "New User"
}
```

### 4. Test Login

**POST** `http://localhost:5000/api/auth/login`

**Body:**
```json
{
  "email": "newuser@test.com",
  "password": "Test123!@#"
}
```

## All Endpoints

### Customer Registration
```
POST /api/auth/register
Body: { "email", "password", "displayName" }
```

### Seller Registration
```
POST /api/auth/register/seller
Body: { "email", "password", "displayName", "businessName", "phone", "businessInfo" }
```

### Login (All Roles)
```
POST /api/auth/login
Body: { "email", "password" }
```

### Get Profile
```
GET /api/auth/me
Header: Authorization: Bearer <token>
```

### Update Profile
```
PUT /api/auth/profile
Header: Authorization: Bearer <token>
Body: { "displayName", "phone" }
```

## Field Name Reference

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| `full_name` | `displayName` |
| `name` | `displayName` |
| `role` (in register) | Not needed (auto-set) |
| `username` | `email` |

## Password Requirements

- ✅ Minimum 8 characters
- ✅ Can include letters, numbers, special characters
- ❌ Cannot be empty
- ❌ Cannot be less than 8 characters

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Email and password are required" | Missing fields | Include both email and password |
| "Invalid email format" | Bad email | Use valid email format |
| "Password must be at least 8 characters" | Short password | Use 8+ characters |
| "Email already registered" | Duplicate email | Use different email |
| "Invalid email or password" | Wrong credentials | Check email and password |
| "Account is not active" | Inactive account | Contact admin |

## Test with curl

### Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","displayName":"Test User"}'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

## Still Not Working?

1. Check server is running: `http://localhost:5000/api/health`
2. Check database connection: `node test-connection.js`
3. Run debug script: `node test-login-debug.js`
4. Read full guide: `AUTH-TROUBLESHOOTING-GUIDE.md`

## Summary

**The authentication system works perfectly. You just need to use the correct field names:**

- Use `displayName` instead of `full_name`
- Don't include `role` in registration
- Make sure password is 8+ characters
- Use valid email format

**Import `CORRECTED-AUTH-POSTMAN.json` and you're good to go!**
