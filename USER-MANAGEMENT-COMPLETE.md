# USER MANAGEMENT MODULE - COMPLETE ✅

## Overview
Complete user management system with RBAC (Role-Based Access Control). Customers can manage their own profiles, while admins can manage all users.

## Architecture

### Components
```
ecomerce_backend/
├── controllers/
│   └── userControllers/
│       └── user.controller.js       # ✅ User operations
├── services/
│   └── userServices/
│       └── user.service.js          # ✅ User business logic
├── routes/
│   └── userRoutes/
│       └── user.routes.js           # ✅ User routes with RBAC
└── middlewares/
    ├── auth.middleware.js           # ✅ JWT verification
    └── role.middleware.js           # ✅ Role checking
```

## Features Implemented

### ✅ Customer Features (Own Profile)
- Get own profile
- Update own profile (name, phone)
- Get own statistics (orders, spending)
- Delete own account (soft delete)

### ✅ Admin Features (All Users)
- View all users (with filters)
- Search users by email/name
- Get user by ID
- Create new user
- Update user profile
- Update user status (active/blocked/deleted)
- Block/unblock users
- Assign roles (customer/admin)
- Delete users (soft delete)
- View user statistics

### ✅ Security Features
- RBAC enforcement
- Customers can only access their own data
- Admins can access all user data
- Password hashing for new users
- Input validation
- Status-based access control

## API Endpoints

### Customer Endpoints (Authenticated Users)

#### Get Own Profile
```http
GET /api/users/me
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

#### Update Own Profile
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Jane Doe",
  "phone": "+0987654321"
}

Response 200:
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "displayName": "Jane Doe",
    "phone": "+0987654321"
  }
}
```

#### Get Own Statistics
```http
GET /api/users/me/statistics
Authorization: Bearer <token>

Response 200:
{
  "total_orders": 15,
  "completed_orders": 12,
  "total_spent": 1250.50,
  "average_order_value": 83.37,
  "total_returns": 2
}
```

#### Delete Own Account
```http
DELETE /api/users/me
Authorization: Bearer <token>

Response 200:
{
  "message": "Account deleted successfully"
}
```

### Admin Endpoints (Admin Only)

#### Get All Users
```http
GET /api/users?role=customer&status=active&limit=20&offset=0
Authorization: Bearer <admin-token>

Response 200:
{
  "count": 20,
  "users": [
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
  ]
}
```

#### Search Users
```http
GET /api/users/search?q=john&limit=10
Authorization: Bearer <admin-token>

Response 200:
{
  "count": 3,
  "users": [...]
}
```

#### Get User by ID
```http
GET /api/users/:id
Authorization: Bearer <admin-token>

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

#### Create User
```http
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "role": "customer",
  "displayName": "New User"
}

Response 201:
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "role": "customer",
    "displayName": "New User",
    "status": "active"
  }
}
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "displayName": "Updated Name",
  "phone": "+1234567890",
  "role": "admin"
}

Response 200:
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin",
    "displayName": "Updated Name",
    "phone": "+1234567890",
    "status": "active"
  }
}
```

#### Update User Status
```http
PATCH /api/users/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "blocked"
}

Response 200:
{
  "message": "User status updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "blocked"
  }
}
```

#### Block User
```http
POST /api/users/:id/block
Authorization: Bearer <admin-token>

Response 200:
{
  "message": "User blocked successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "blocked"
  }
}
```

#### Unblock User
```http
POST /api/users/:id/unblock
Authorization: Bearer <admin-token>

Response 200:
{
  "message": "User unblocked successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "active"
  }
}
```

#### Assign Role
```http
PATCH /api/users/:id/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "admin"
}

Response 200:
{
  "message": "Role assigned successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <admin-token>

Response 200:
{
  "message": "User deleted successfully"
}
```

#### Get User Statistics
```http
GET /api/users/:id/statistics
Authorization: Bearer <admin-token>

Response 200:
{
  "total_orders": 15,
  "completed_orders": 12,
  "total_spent": 1250.50,
  "average_order_value": 83.37,
  "total_returns": 2
}
```

## RBAC Implementation

### Customer Access
```javascript
// Customers can only access their own profile
router.get('/api/users/me', authenticate, userController.getMyProfile);
router.put('/api/users/me', authenticate, userController.updateMyProfile);
router.delete('/api/users/me', authenticate, userController.deleteMyAccount);
```

### Admin Access
```javascript
// Admins can access all users
router.get('/api/users', authenticate, requireAdmin, userController.getAllUsers);
router.get('/api/users/:id', authenticate, requireAdmin, userController.getUserById);
router.put('/api/users/:id', authenticate, requireAdmin, userController.updateUser);
router.delete('/api/users/:id', authenticate, requireAdmin, userController.deleteUser);
```

## Validation Rules

### Create User
- ✅ Email required and valid format
- ✅ Password required (min 8 characters)
- ✅ Role must be 'customer' or 'admin'
- ✅ Email must be unique

### Update User
- ✅ At least one field required
- ✅ Role must be 'customer' or 'admin' (if provided)
- ✅ Display name max 255 characters
- ✅ Phone max 20 characters

### Update Status
- ✅ Status must be 'active', 'blocked', or 'deleted'

### Assign Role
- ✅ Role must be 'customer' or 'admin'

## User Statuses

### Active
- User can login and use the system
- Default status for new users

### Blocked
- User cannot login
- Admin action required to unblock
- Used for temporary suspension

### Deleted
- Soft delete - data retained
- User cannot login
- Can be reactivated by admin

## Error Handling

### Common Errors

#### 400 - Validation Error
```json
{
  "error": "Validation Error",
  "message": "Email and password are required"
}
```

#### 401 - Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "No token provided"
}
```

#### 403 - Forbidden
```json
{
  "error": "Forbidden",
  "message": "Access denied. admin role required."
}
```

#### 404 - Not Found
```json
{
  "error": "Not Found",
  "message": "User not found"
}
```

#### 409 - Conflict
```json
{
  "error": "Conflict",
  "message": "Email already registered"
}
```

## Service Layer Methods

### User Service (user.service.js)
```javascript
// Find operations
findById(id)                    // Find user by ID
findByEmail(email)              // Find user by email
findAll(filters)                // Get all users with filters
search(searchTerm, limit)       // Search users by email/name

// Create/Update operations
create(userData)                // Create new user
update(id, updates)             // Update user profile
updateStatus(id, status)        // Update user status
updateLastLogin(id)             // Update last login timestamp

// Delete operations
deleteUser(id)                  // Soft delete user

// Statistics
getStatistics(userId)           // Get user statistics
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
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'deleted')),
  mfa_enabled BOOLEAN DEFAULT FALSE
);
```

## Testing Examples

### Customer Operations

#### Get Own Profile
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <customer-token>"
```

#### Update Own Profile
```bash
curl -X PUT http://localhost:5000/api/users/me \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Jane Doe",
    "phone": "+1234567890"
  }'
```

### Admin Operations

#### Get All Users
```bash
curl -X GET "http://localhost:5000/api/users?role=customer&limit=10" \
  -H "Authorization: Bearer <admin-token>"
```

#### Block User
```bash
curl -X POST http://localhost:5000/api/users/<user-id>/block \
  -H "Authorization: Bearer <admin-token>"
```

#### Assign Admin Role
```bash
curl -X PATCH http://localhost:5000/api/users/<user-id>/role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

## Security Best Practices

### ✅ Implemented
- RBAC enforcement at route level
- JWT token verification
- Password hashing for new users
- Input validation
- Status-based access control
- Soft delete (data retention)
- No password hash in responses

### ✅ Access Control
- Customers: Own profile only
- Admins: All users
- Blocked users: Cannot login
- Deleted users: Cannot login

## Integration with Other Modules

### Authentication Module
- Uses same user service
- Shares JWT middleware
- Consistent role checking

### Admin Module
- Admin controller has user management
- User routes provide dedicated endpoints
- Both can coexist

### Order Module
- User statistics include order data
- User deletion affects order history

## File Structure

```
ecomerce_backend/
├── controllers/
│   └── userControllers/
│       └── user.controller.js       # 15 endpoints
├── services/
│   └── userServices/
│       └── user.service.js          # 11 methods
├── routes/
│   └── userRoutes/
│       └── user.routes.js           # 15 routes
└── middlewares/
    ├── auth.middleware.js           # JWT verification
    └── role.middleware.js           # RBAC
```

## Summary

### ✅ Complete Features
- Customer profile CRUD
- Admin view all users
- Block/unblock users
- Assign roles
- Search users
- User statistics
- Soft delete

### ✅ RBAC Enforcement
- Customers: Own profile only
- Admins: All users
- Route-level protection
- Middleware-based

### ✅ Validation & Error Handling
- Input validation
- Email format check
- Role validation
- Status validation
- Descriptive error messages
- Proper HTTP status codes

## Status: ✅ COMPLETE

User management module is fully implemented with comprehensive CRUD operations, RBAC enforcement, and proper validation!
