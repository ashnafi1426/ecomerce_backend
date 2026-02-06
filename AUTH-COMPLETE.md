# AUTHENTICATION & AUTHORIZATION - COMPLETE ✅

## Overview
Production-ready authentication and authorization system using JWT, bcrypt, and role-based access control (RBAC).

## Architecture

### Components
```
ecomerce_backend/
├── controllers/
│   └── auth.controller.js          # ✅ Auth endpoints
├── middlewares/
│   ├── auth.middleware.js          # ✅ JWT verification
│   └── role.middleware.js          # ✅ RBAC
├── routes/
│   └── authRoutes/
│       └── auth.routes.js          # ✅ Auth routes
├── services/
│   └── user.service.js             # ✅ User operations
├── config/
│   └── jwt.js                      # ✅ JWT utilities
└── utils/
    └── hash.js                     # ✅ Password hashing
```

## Features Implemented

### ✅ User Registration
- Email validation
- Password strength validation (min 8 characters)
- Duplicate email check
- Password hashing with bcrypt
- Automatic JWT token generation
- Default role assignment (customer)

### ✅ User Login
- Email/password authentication
- Account status check
- Password verification
- Last login tracking
- JWT token generation

### ✅ JWT Authentication
- Token generation with expiration
- Token verification
- User extraction from token
- Token expiration handling
- Invalid token handling

### ✅ Password Security
- bcrypt hashing (10 salt rounds)
- Secure password comparison
- Never stores plain text passwords
- Resistant to brute force attacks

### ✅ Role-Based Access Control (RBAC)
- Two roles: `admin` and `customer`
- Role verification middleware
- Flexible role requirements
- Multiple role support

### ✅ Profile Management
- Get user profile
- Update profile (name, phone)
- Protected by authentication

## API Endpoints

### Public Endpoints (No Auth Required)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "displayName": "John Doe"
}

Response 201:
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "displayName": "John Doe"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response 200:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "displayName": "John Doe"
  }
}
```

### Protected Endpoints (Auth Required)

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "customer",
  "displayName": "John Doe",
  "phone": "+1234567890",
  "createdAt": "2026-02-06T...",
  "lastLoginAt": "2026-02-06T...",
  "status": "active"
}
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Jane Doe",
  "phone": "+1234567890"
}

Response 200:
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "displayName": "Jane Doe",
    "phone": "+1234567890"
  }
}
```

## Middleware Usage

### Authentication Middleware
Verifies JWT token and attaches user to request.

```javascript
const authenticate = require('./middlewares/auth.middleware');

// Protect a route
router.get('/protected', authenticate, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});
```

### Role Middleware
Checks if user has required role.

```javascript
const { requireAdmin, requireCustomer, requireAnyRole } = require('./middlewares/role.middleware');

// Admin only
router.get('/admin/users', authenticate, requireAdmin, controller.getUsers);

// Customer only
router.get('/orders', authenticate, requireCustomer, controller.getOrders);

// Multiple roles
router.get('/dashboard', authenticate, requireAnyRole(['admin', 'customer']), controller.getDashboard);
```

## Security Features

### Password Security
- **Bcrypt hashing**: Industry-standard password hashing
- **Salt rounds**: 10 rounds (configurable)
- **Slow by design**: Prevents brute force attacks
- **One-way hashing**: Cannot reverse to get original password

### JWT Security
- **Secret key**: Stored in environment variable
- **Expiration**: 7 days (configurable)
- **Signed tokens**: Prevents tampering
- **Stateless**: No server-side session storage

### Input Validation
- **Email format**: Regex validation
- **Password length**: Minimum 8 characters
- **Required fields**: Email and password
- **Duplicate check**: Prevents duplicate emails

### Account Security
- **Status check**: Only active accounts can login
- **Last login tracking**: Monitors account activity
- **Login count**: Tracks number of logins
- **Failed attempts**: Tracked in database (ready for lockout)

## Error Handling

### Registration Errors
- `400` - Validation error (missing/invalid fields)
- `409` - Email already registered

### Login Errors
- `400` - Validation error (missing fields)
- `401` - Invalid credentials
- `403` - Account not active

### Authentication Errors
- `401` - No token provided
- `401` - Invalid token
- `401` - Token expired
- `401` - User not found
- `403` - Account not active

### Authorization Errors
- `401` - Authentication required
- `403` - Insufficient permissions (wrong role)

## Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### JWT Configuration
```javascript
// config/jwt.js
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
```

### Bcrypt Configuration
```javascript
// utils/hash.js
const SALT_ROUNDS = 10; // Higher = more secure but slower
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  display_name VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  login_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  mfa_enabled BOOLEAN DEFAULT FALSE
);
```

## Testing

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "displayName": "Test User"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Best Practices Implemented

### ✅ Security
- Passwords never stored in plain text
- JWT tokens expire after 7 days
- Tokens signed with secret key
- Account status checked on login
- Role-based access control

### ✅ Validation
- Email format validation
- Password strength requirements
- Required field validation
- Duplicate email prevention

### ✅ Error Handling
- Descriptive error messages
- Appropriate HTTP status codes
- Error logging
- Graceful failure

### ✅ Code Organization
- Separation of concerns
- Reusable middleware
- Clean controller logic
- Service layer for business logic

## Future Enhancements

### Recommended
1. **Password Reset**: Email-based password reset
2. **Email Verification**: Verify email on registration
3. **Refresh Tokens**: Long-lived refresh tokens
4. **Account Lockout**: Lock after N failed attempts
5. **2FA/MFA**: Two-factor authentication
6. **Password History**: Prevent password reuse
7. **Session Management**: Track active sessions
8. **Rate Limiting**: Limit login attempts per IP
9. **OAuth**: Social login (Google, Facebook)
10. **Audit Logging**: Log all auth events

### Optional
- Password complexity rules
- Password expiration
- IP whitelisting
- Device fingerprinting
- Suspicious activity detection

## Common Issues & Solutions

### Issue: "No token provided"
**Solution**: Include Authorization header with Bearer token
```javascript
headers: {
  'Authorization': 'Bearer ' + token
}
```

### Issue: "Token expired"
**Solution**: Login again to get new token or implement refresh tokens

### Issue: "Invalid token"
**Solution**: Check token format and ensure it's not corrupted

### Issue: "Account is not active"
**Solution**: Contact admin to activate account

### Issue: "Access denied"
**Solution**: User doesn't have required role (admin/customer)

## Summary

✅ **Complete Authentication System**
- User registration with validation
- Secure login with bcrypt
- JWT token generation and verification
- Profile management

✅ **Complete Authorization System**
- Role-based access control (RBAC)
- Admin and customer roles
- Flexible middleware
- Protected routes

✅ **Production-Ready Security**
- Password hashing with bcrypt
- JWT with expiration
- Input validation
- Error handling
- Account status checks

✅ **Clean Architecture**
- Controllers for HTTP logic
- Services for business logic
- Middleware for cross-cutting concerns
- Utilities for common functions
- Configuration for settings

The authentication and authorization system is fully implemented and ready for production use!
