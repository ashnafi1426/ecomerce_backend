# Authentication Troubleshooting Guide

## Common Issues and Solutions

### Issue: Email and Password Not Working

If you're experiencing login issues, follow these steps:

## 1. Start the Server

First, make sure the backend server is running:

```bash
cd ecomerce_backend
npm start
```

Or:

```bash
node server.js
```

The server should start on `http://localhost:5000`

## 2. Correct Request Format

### Register Customer

**Endpoint:** `POST /api/auth/register`

**Correct Body:**
```json
{
  "email": "customer@test.com",
  "password": "Test123!@#",
  "displayName": "Test Customer"
}
```

**❌ WRONG - Don't use these fields:**
```json
{
  "email": "customer@test.com",
  "password": "Test123!@#",
  "full_name": "Test Customer",  // ❌ Wrong field name
  "role": "customer"              // ❌ Not accepted in register
}
```

### Login (All Roles)

**Endpoint:** `POST /api/auth/login`

**Correct Body:**
```json
{
  "email": "customer@test.com",
  "password": "Test123!@#"
}
```

### Register Seller

**Endpoint:** `POST /api/auth/register/seller`

**Correct Body:**
```json
{
  "email": "seller@test.com",
  "password": "Test123!@#",
  "displayName": "Seller Name",
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

### Login Manager

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "manager@test.com",
  "password": "Manager123!@#"
}
```

Note: Managers must be created by admins, not through registration.

### Login Admin

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "admin@test.com",
  "password": "Admin123!@#"
}
```

Note: Admins must be created directly in the database or by another admin.

## 3. Common Mistakes

### Mistake 1: Using Wrong Field Names

❌ **Wrong:**
```json
{
  "full_name": "John Doe"  // Wrong field name
}
```

✅ **Correct:**
```json
{
  "displayName": "John Doe"  // Correct field name
}
```

### Mistake 2: Including Role in Customer Registration

❌ **Wrong:**
```json
{
  "email": "user@test.com",
  "password": "password",
  "role": "customer"  // Not accepted
}
```

✅ **Correct:**
```json
{
  "email": "user@test.com",
  "password": "password"
  // Role is automatically set to "customer"
}
```

### Mistake 3: Password Too Short

❌ **Wrong:**
```json
{
  "password": "test123"  // Only 7 characters
}
```

✅ **Correct:**
```json
{
  "password": "Test123!@#"  // At least 8 characters
}
```

### Mistake 4: Invalid Email Format

❌ **Wrong:**
```json
{
  "email": "invalid-email"  // Missing @ and domain
}
```

✅ **Correct:**
```json
{
  "email": "user@example.com"  // Valid email format
}
```

## 4. Testing with Postman

### Step 1: Set Base URL

In Postman, create an environment variable:
- Variable: `base_url`
- Value: `http://localhost:5000`

### Step 2: Register a Customer

1. Create a new POST request
2. URL: `{{base_url}}/api/auth/register`
3. Headers:
   - `Content-Type`: `application/json`
4. Body (raw JSON):
```json
{
  "email": "customer@test.com",
  "password": "Test123!@#",
  "displayName": "Test Customer"
}
```
5. Send the request
6. Save the `token` from the response

### Step 3: Login

1. Create a new POST request
2. URL: `{{base_url}}/api/auth/login`
3. Headers:
   - `Content-Type`: `application/json`
4. Body (raw JSON):
```json
{
  "email": "customer@test.com",
  "password": "Test123!@#"
}
```
5. Send the request
6. Save the `token` from the response

### Step 4: Use Token for Protected Routes

1. In Postman, go to the Authorization tab
2. Type: Bearer Token
3. Token: Paste the token from login response
4. Or use `{{token}}` if you saved it as an environment variable

## 5. Debugging Steps

### Check if Server is Running

```bash
curl http://localhost:5000/api/health
```

Or open in browser: `http://localhost:5000/api/health`

### Check Database Connection

Run the debug script:

```bash
node test-login-debug.js
```

This will:
- Test database connection
- List existing users
- Create a test user and try to login
- Check for common issues

### Test API Endpoints

Run the API test script:

```bash
node test-api-login.js
```

This will:
- Test registration
- Test login
- Test wrong password
- Test non-existent email
- Test getting profile with token

## 6. Response Codes

### Success Responses

- `200 OK` - Login successful
- `201 Created` - Registration successful

### Error Responses

- `400 Bad Request` - Invalid input (missing fields, invalid email, password too short)
- `401 Unauthorized` - Invalid email or password
- `403 Forbidden` - Account not active
- `409 Conflict` - Email already registered

## 7. Example Success Response

### Registration Success

```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "customer@test.com",
    "role": "customer",
    "displayName": "Test Customer"
  }
}
```

### Login Success

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "customer@test.com",
    "role": "customer",
    "displayName": "Test Customer"
  }
}
```

## 8. Example Error Responses

### Invalid Email or Password

```json
{
  "error": "Authentication Failed",
  "message": "Invalid email or password"
}
```

### Email Already Registered

```json
{
  "error": "Conflict",
  "message": "Email already registered"
}
```

### Password Too Short

```json
{
  "error": "Validation Error",
  "message": "Password must be at least 8 characters"
}
```

### Missing Required Fields

```json
{
  "error": "Validation Error",
  "message": "Email and password are required"
}
```

## 9. Quick Test Commands

### Using curl

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","displayName":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

**Get Profile:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 10. Still Having Issues?

If you're still experiencing problems:

1. **Check the server logs** - Look for error messages in the terminal where the server is running

2. **Verify environment variables** - Make sure `.env` file has:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   JWT_SECRET=your_jwt_secret
   ```

3. **Check database** - Run `node test-connection.js` to verify database connection

4. **Clear Postman cache** - Sometimes Postman caches old responses

5. **Try a different email** - The email might already be registered

6. **Check password requirements** - Must be at least 8 characters

## Summary

The most common issues are:

1. ✅ Server not running - Start with `npm start`
2. ✅ Wrong field names - Use `displayName` not `full_name`
3. ✅ Including `role` in registration - Don't include it
4. ✅ Password too short - Must be 8+ characters
5. ✅ Invalid email format - Must be valid email
6. ✅ Email already registered - Use a different email
7. ✅ Wrong endpoint - Use `/api/auth/login` not `/login`

**The authentication system is working correctly. The issue is usually with the request format or server not running.**
