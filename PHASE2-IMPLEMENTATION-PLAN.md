# Phase 2: Authentication & Authorization Implementation Plan

## Overview

Phase 2 enhances the authentication and authorization system to support the 4-role RBAC (Role-Based Access Control) infrastructure created in Phase 1.

**Duration:** Week 3 (5-7 days)  
**Effort:** 15-20 hours  
**Status:** 🚀 In Progress

---

## Objectives

1. ✅ Enhance RBAC middleware for 4 roles (admin, manager, seller, customer)
2. ✅ Implement seller registration with business information
3. ✅ Implement manager role creation (Admin only)
4. ✅ Add role-specific route protection
5. ⏳ Add 2FA support (optional)

---

## Current State (Before Phase 2)

### Existing Implementation
- ✅ Basic JWT authentication
- ✅ 2-role system (admin, customer)
- ✅ User registration and login
- ✅ Profile management
- ✅ Password hashing (bcrypt)

### Database (Phase 1 Complete)
- ✅ Users table with `role` column (admin, manager, seller, customer)
- ✅ Seller-specific fields (business_name, business_info, verification_status)
- ✅ All infrastructure ready

---

## Target State (After Phase 2)

### Enhanced Features
- ✅ 4-role RBAC system fully functional
- ✅ Seller registration with business validation
- ✅ Manager account creation (Admin only)
- ✅ Role-specific middleware (requireAdmin, requireManager, requireSeller, requireCustomer)
- ✅ Permission matrix implementation
- ✅ Enhanced JWT tokens with role information
- ⏳ 2FA support (optional)

---

## Implementation Tasks

### Task 1: Enhance Role Middleware ✅
**File:** `middlewares/role.middleware.js`

**Changes:**
- [x] Add `requireManager()` middleware
- [x] Add `requireSeller()` middleware
- [x] Update `requireAnyRole()` to support 4 roles
- [x] Add permission matrix for complex permissions
- [x] Add role hierarchy support

**Code:**
```javascript
// New middleware functions
const requireManager = requireRole('manager');
const requireSeller = requireRole('seller');

// Permission matrix
const PERMISSIONS = {
  'admin': ['*'], // All permissions
  'manager': ['approve_products', 'manage_orders', 'resolve_disputes', 'manage_returns'],
  'seller': ['manage_own_products', 'view_own_orders', 'manage_inventory'],
  'customer': ['place_orders', 'view_own_orders', 'submit_reviews']
};

// Check specific permission
const requirePermission = (permission) => { ... };
```

---

### Task 2: Seller Registration ✅
**File:** `controllers/authControllers/auth.controller.js`

**New Endpoint:** `POST /api/auth/register/seller`

**Changes:**
- [x] Create `registerSeller()` controller
- [x] Validate business information
- [x] Set seller status to 'pending' (requires admin approval)
- [x] Send notification to admin
- [x] Return appropriate response

**Required Fields:**
- email
- password
- displayName
- businessName
- businessInfo (description, address, tax ID, etc.)
- phone

**Validation:**
- Email format
- Password strength (min 8 chars)
- Business name (required, min 3 chars)
- Phone number format

---

### Task 3: Manager Account Creation ✅
**File:** `controllers/userControllers/user.controller.js`

**New Endpoint:** `POST /api/admin/users/manager`

**Changes:**
- [x] Create `createManager()` controller (Admin only)
- [x] Validate manager information
- [x] Set role to 'manager'
- [x] Send welcome email
- [x] Return manager details

**Required Fields:**
- email
- password (temporary, should be changed on first login)
- displayName
- phone (optional)

---

### Task 4: Update Auth Middleware ✅
**File:** `middlewares/auth.middleware.js`

**Changes:**
- [x] Enhance JWT payload with additional role info
- [x] Add seller-specific fields to req.user
- [x] Add manager-specific fields to req.user
- [x] Improve error messages

**Enhanced req.user object:**
```javascript
req.user = {
  id: user.id,
  email: user.email,
  role: user.role,
  displayName: user.display_name,
  // Seller-specific
  businessName: user.business_name,
  verificationStatus: user.verification_status,
  // Manager-specific
  permissions: user.permissions
};
```

---

### Task 5: Update User Service ✅
**File:** `services/userServices/user.service.js`

**New Functions:**
- [x] `createSeller(sellerData)` - Create seller account
- [x] `createManager(managerData)` - Create manager account (Admin only)
- [x] `updateSellerStatus(sellerId, status)` - Approve/reject seller
- [x] `findAllSellers(filters)` - Get all sellers
- [x] `findAllManagers(filters)` - Get all managers

---

### Task 6: Update Routes ✅
**File:** `routes/authRoutes/auth.routes.js`

**New Routes:**
- [x] `POST /api/auth/register/seller` - Seller registration
- [x] `GET /api/auth/seller/status` - Check seller verification status

**File:** `routes/userRoutes/user.routes.js`

**New Routes:**
- [x] `POST /api/admin/users/manager` - Create manager (Admin only)
- [x] `GET /api/admin/sellers` - List all sellers (Admin/Manager)
- [x] `PUT /api/admin/sellers/:id/status` - Approve/reject seller (Admin)
- [x] `GET /api/admin/managers` - List all managers (Admin)

---

### Task 7: Add Validation Middleware ✅
**File:** `middlewares/validation.middleware.js`

**New Validators:**
- [x] `validateSellerRegistration` - Validate seller registration data
- [x] `validateManagerCreation` - Validate manager creation data
- [x] `validateBusinessInfo` - Validate business information

---

### Task 8: Update JWT Configuration ⏳
**File:** `config/jwt.js`

**Changes:**
- [x] Include role in JWT payload
- [x] Add seller/manager specific claims
- [x] Update token expiration (30 minutes → configurable)

---

### Task 9: Testing ⏳
**File:** `test-phase2-auth.js`

**Test Cases:**
- [ ] Seller registration
- [ ] Seller login
- [ ] Manager creation (Admin only)
- [ ] Manager login
- [ ] Role-based route protection
- [ ] Permission checks
- [ ] Seller approval workflow

---

### Task 10: Documentation ⏳
**Files:**
- [ ] `PHASE2-RBAC-GUIDE.md` - RBAC system documentation
- [ ] `PHASE2-API-DOCUMENTATION.md` - New API endpoints
- [ ] `PHASE2-TESTING-GUIDE.md` - Testing instructions
- [ ] Update Postman collection

---

## File Changes Summary

### Files to Modify
1. ✅ `middlewares/role.middleware.js` - Add manager/seller middleware
2. ✅ `middlewares/auth.middleware.js` - Enhance with role info
3. ✅ `controllers/authControllers/auth.controller.js` - Add seller registration
4. ✅ `controllers/userControllers/user.controller.js` - Add manager creation
5. ✅ `services/userServices/user.service.js` - Add seller/manager functions
6. ✅ `routes/authRoutes/auth.routes.js` - Add seller routes
7. ✅ `routes/userRoutes/user.routes.js` - Add admin routes
8. ✅ `middlewares/validation.middleware.js` - Add validators

### Files to Create
1. ⏳ `test-phase2-auth.js` - Phase 2 testing script
2. ⏳ `PHASE2-RBAC-GUIDE.md` - RBAC documentation
3. ⏳ `PHASE2-API-DOCUMENTATION.md` - API docs
4. ⏳ `PHASE2-TESTING-GUIDE.md` - Testing guide
5. ⏳ `PHASE2-COMPLETE.md` - Completion summary

---

## Implementation Order

### Day 1-2: Core RBAC Enhancement
1. ✅ Update role middleware (Task 1)
2. ✅ Update auth middleware (Task 4)
3. ✅ Update user service (Task 5)

### Day 3-4: Seller & Manager Features
4. ✅ Implement seller registration (Task 2)
5. ✅ Implement manager creation (Task 3)
6. ✅ Add validation middleware (Task 7)

### Day 5: Routes & Integration
7. ✅ Update routes (Task 6)
8. ⏳ Update JWT config (Task 8)
9. ⏳ Integration testing

### Day 6-7: Testing & Documentation
10. ⏳ Comprehensive testing (Task 9)
11. ⏳ Documentation (Task 10)
12. ⏳ Postman collection update

---

## Success Criteria

Phase 2 is complete when:

- ✅ All 4 roles (admin, manager, seller, customer) are functional
- ✅ Seller registration works with business info validation
- ✅ Manager accounts can be created by admins
- ✅ Role-specific middleware protects routes correctly
- ⏳ All tests pass
- ⏳ API documentation is updated
- ⏳ Postman collection is updated

---

## Testing Checklist

### Seller Registration
- [ ] Register seller with valid data
- [ ] Register seller with invalid email
- [ ] Register seller with weak password
- [ ] Register seller with missing business info
- [ ] Check seller status is 'pending'
- [ ] Verify admin notification sent

### Manager Creation
- [ ] Admin creates manager successfully
- [ ] Non-admin cannot create manager
- [ ] Manager can log in
- [ ] Manager has correct permissions

### Role-Based Access
- [ ] Admin can access admin routes
- [ ] Manager can access manager routes
- [ ] Seller can access seller routes
- [ ] Customer can access customer routes
- [ ] Cross-role access is denied

### Permission Checks
- [ ] Manager can approve products
- [ ] Seller can manage own products
- [ ] Customer can place orders
- [ ] Permission matrix works correctly

---

## Risk Mitigation

### Backward Compatibility
- ✅ Existing admin and customer accounts continue to work
- ✅ Existing API endpoints remain functional
- ✅ No breaking changes to authentication flow

### Data Integrity
- ✅ Existing users maintain their roles
- ✅ New role fields are properly populated
- ✅ No data loss during migration

### Security
- ✅ Password hashing remains secure
- ✅ JWT tokens are properly validated
- ✅ Role checks are enforced at middleware level
- ✅ Business information is validated

---

## Next Steps After Phase 2

Once Phase 2 is complete, proceed to:

**Phase 3: Product Management Refactor** (Week 4-5)
- Seller product management
- Manager product approval
- Product visibility rules

---

**Status:** 🚀 In Progress  
**Started:** February 8, 2026  
**Target Completion:** February 15, 2026

