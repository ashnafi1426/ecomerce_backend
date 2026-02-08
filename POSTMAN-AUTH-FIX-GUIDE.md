# 🔧 POSTMAN AUTHENTICATION FIX GUIDE

## ❌ Problem Identified

The authentication verification in the original Postman collection had issues with:
1. Token not being properly saved after login
2. "Get Current User" endpoint not working correctly
3. Missing proper authorization headers

## ✅ Solution - Fixed Collection

A new, corrected Postman collection has been generated: **`E-Commerce-API-Fixed.postman_collection.json`**

---

## 📥 How to Use the Fixed Collection

### Step 1: Import the Fixed Collection

1. Open Postman
2. Click **"Import"** button (top left)
3. Select file: `E-Commerce-API-Fixed.postman_collection.json`
4. Click **"Import"**

### Step 2: Start Your Server

```bash
cd ecomerce_backend
npm start
```

Server should be running on: `http://localhost:5004`

### Step 3: Test Authentication (In Order)

#### 1. Register Customer ✅
- **Endpoint**: `POST /api/auth/register`
- **Body**:
```json
{
  "email": "customer@test.com",
  "password": "Customer123!",
  "displayName": "Test Customer"
}
```
- **Expected Response** (201):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "customer@test.com",
    "role": "customer",
    "displayName": "Test Customer"
  }
}
```
- **Auto-saves**: `customerToken` variable

#### 2. Login Customer ✅
- **Endpoint**: `POST /api/auth/login`
- **Body**:
```json
{
  "email": "customer@test.com",
  "password": "Customer123!"
}
```
- **Expected Response** (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "customer@test.com",
    "role": "customer",
    "displayName": "Test Customer"
  }
}
```
- **Auto-saves**: `customerToken` variable

#### 3. Get Current User Profile ✅ (FIXED!)
- **Endpoint**: `GET /api/auth/me`
- **Headers**: 
  - `Authorization: Bearer {{customerToken}}`
- **Expected Response** (200):
```json
{
  "id": "uuid",
  "email": "customer@test.com",
  "role": "customer",
  "displayName": "Test Customer",
  "phone": null,
  "createdAt": "2026-02-07T...",
  "lastLoginAt": "2026-02-07T...",
  "status": "active"
}
```

#### 4. Update Profile ✅ (NEW!)
- **Endpoint**: `PUT /api/auth/profile`
- **Headers**: 
  - `Authorization: Bearer {{customerToken}}`
- **Body**:
```json
{
  "displayName": "Updated Name",
  "phone": "+1234567890"
}
```
- **Expected Response** (200):
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "customer@test.com",
    "role": "customer",
    "displayName": "Updated Name",
    "phone": "+1234567890"
  }
}
```

---

## 🔑 Key Fixes in the New Collection

### 1. Correct Endpoints
```
✅ POST   /api/auth/register
✅ POST   /api/auth/login
✅ GET    /api/auth/me          (FIXED!)
✅ PUT    /api/auth/profile     (NEW!)
```

### 2. Proper Token Handling
The collection now includes test scripts that automatically save tokens:

```javascript
if (pm.response.code === 201 || pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.collectionVariables.set('customerToken', jsonData.token);
  console.log('Token saved successfully');
}
```

### 3. Correct Authorization Headers
All protected endpoints now use:
```
Authorization: Bearer {{customerToken}}
```

---

## 🧪 Testing Workflow

### Complete Authentication Test:

1. **Register** → Creates account + saves token
2. **Login** → Gets fresh token
3. **Get Profile** → Verifies token works
4. **Update Profile** → Tests authenticated update

### Expected Results:
- ✅ All 4 requests should return 200/201 status
- ✅ Token should be visible in collection variables
- ✅ Profile data should be returned correctly
- ✅ Updates should persist

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error on /api/auth/me

**Possible Causes**:
1. Token not saved after login
2. Token expired
3. Wrong authorization header format

**Solutions**:
1. Check collection variables (click collection → Variables tab)
2. Verify `customerToken` has a value
3. Re-run the "Login Customer" request
4. Check Authorization header: `Bearer {{customerToken}}`

### Issue: "Invalid token" Error

**Solution**:
- Token might be expired (default: 7 days)
- Run "Login Customer" again to get fresh token

### Issue: Token not auto-saving

**Solution**:
1. Check the "Tests" tab in the request
2. Verify the test script is present
3. Check Postman console (View → Show Postman Console)

---

## 📊 Collection Variables

The fixed collection uses these variables:

| Variable | Description | Auto-Set By |
|----------|-------------|-------------|
| `baseUrl` | API base URL | Manual (default: http://localhost:5004) |
| `customerToken` | Customer JWT token | Register/Login Customer |
| `adminToken` | Admin JWT token | Register/Login Admin |
| `productId` | Created product ID | Create Product |
| `categoryId` | Created category ID | Create Category |
| `cartItemId` | Cart item ID | Add to Cart |
| `orderId` | Order ID | Create Order |
| `reviewId` | Review ID | Create Review |

---

## 🎯 What's Different from Original Collection?

### Original Collection Issues:
- ❌ Authentication endpoints might have been incorrect
- ❌ Token handling was not reliable
- ❌ "Get Current User" endpoint had issues
- ❌ Missing "Update Profile" endpoint

### Fixed Collection:
- ✅ All authentication endpoints verified and working
- ✅ Reliable token auto-save with test scripts
- ✅ "Get Current User" endpoint fixed
- ✅ Added "Update Profile" endpoint
- ✅ Better error handling
- ✅ Console logging for debugging

---

## 📝 API Endpoints Reference

### Authentication Endpoints

```
POST   /api/auth/register
Body: { email, password, displayName }
Response: { message, token, user }

POST   /api/auth/login
Body: { email, password }
Response: { message, token, user }

GET    /api/auth/me
Headers: Authorization: Bearer <token>
Response: { id, email, role, displayName, phone, createdAt, lastLoginAt, status }

PUT    /api/auth/profile
Headers: Authorization: Bearer <token>
Body: { displayName?, phone? }
Response: { message, user }
```

---

## 🚀 Next Steps

After authentication works:

1. **Test Categories** → Create and manage categories
2. **Test Products** → Create products with categories
3. **Test Cart** → Add products to cart
4. **Test Orders** → Create orders from cart
5. **Test Payments** → Process payments
6. **Test Reviews** → Submit and manage reviews
7. **Test Analytics** → View admin analytics

---

## 💡 Pro Tips

1. **Check Variables**: Always verify tokens are saved in collection variables
2. **Use Console**: Open Postman Console to see debug logs
3. **Test in Order**: Follow the numbered folders for best results
4. **Save Responses**: Use "Save Response" for documentation
5. **Create Environments**: Set up Dev/Staging/Prod environments

---

## 📞 Support

If you still have issues:

1. Check server is running (`npm start`)
2. Verify database is connected
3. Check `.env` file has correct values
4. Review server logs for errors
5. Test with curl/httpie to isolate Postman issues

---

## ✅ Success Criteria

After using the fixed collection, you should be able to:

- ✅ Register new users successfully
- ✅ Login and receive JWT token
- ✅ Get user profile with token
- ✅ Update user profile
- ✅ Use token for all protected endpoints
- ✅ See token auto-saved in variables

---

**Status**: ✅ **AUTHENTICATION FIXED AND WORKING**

**File**: `E-Commerce-API-Fixed.postman_collection.json`  
**Generated**: February 7, 2026  
**Version**: 2.0.0

---

**Happy Testing! 🚀**
