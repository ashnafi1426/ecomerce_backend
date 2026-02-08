# 🔑 TOKEN FLOW IN POSTMAN - COMPLETE EXPLANATION

## 📖 How the Token System Works

### 🎯 Overview

The admin collection is **already configured** to automatically handle tokens for you! Here's how it works:

---

## 🔄 Step-by-Step Token Flow

### Step 1: Login Request 🔐

When you run the **"Login Admin"** request:

```http
POST http://localhost:5004/api/auth/login
Content-Type: application/json

{
  "email": "admin@ecommerce.com",
  "password": "Admin123!@#"
}
```

**Server Response**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwNzMxMjAwMCwiZXhwIjoxNzA3OTE2ODAwfQ.abc123xyz",
  "user": {
    "id": "12345",
    "email": "admin@ecommerce.com",
    "role": "admin"
  }
}
```

### Step 2: Auto-Save Token 💾

The collection has a **Test Script** that automatically saves the token:

```javascript
// This script runs AFTER the login request
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.collectionVariables.set('adminToken', jsonData.token);
  console.log('Admin token saved!');
}
```

**What happens**:
- ✅ Token is extracted from response
- ✅ Saved to `{{adminToken}}` variable
- ✅ Available for all other requests

### Step 3: Use Token in Other Requests 🚀

All other admin requests are **pre-configured** with this header:

```
Authorization: Bearer {{adminToken}}
```

**Example - Get All Users Request**:
```http
GET http://localhost:5004/api/users
Authorization: Bearer {{adminToken}}
```

**What Postman does**:
1. Sees `{{adminToken}}` placeholder
2. Replaces it with actual token value
3. Sends request with real token

**Actual request sent**:
```http
GET http://localhost:5004/api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwNzMxMjAwMCwiZXhwIjoxNzA3OTE2ODAwfQ.abc123xyz
```

---

## 🎨 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: LOGIN                                              │
├─────────────────────────────────────────────────────────────┤
│  You: Click "Send" on "Login Admin"                        │
│  ↓                                                           │
│  Postman: Sends email + password to server                 │
│  ↓                                                           │
│  Server: Validates credentials                              │
│  ↓                                                           │
│  Server: Returns JWT token                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: AUTO-SAVE TOKEN                                    │
├─────────────────────────────────────────────────────────────┤
│  Postman Test Script: Runs automatically                    │
│  ↓                                                           │
│  Extracts: token from response                              │
│  ↓                                                           │
│  Saves: pm.collectionVariables.set('adminToken', token)    │
│  ↓                                                           │
│  Result: {{adminToken}} = "eyJhbGci..."                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: USE TOKEN IN OTHER REQUESTS                        │
├─────────────────────────────────────────────────────────────┤
│  You: Click any admin request (e.g., "Get All Users")      │
│  ↓                                                           │
│  Request Header: Authorization: Bearer {{adminToken}}       │
│  ↓                                                           │
│  Postman: Replaces {{adminToken}} with actual token        │
│  ↓                                                           │
│  Sends: Authorization: Bearer eyJhbGci...                   │
│  ↓                                                           │
│  Server: Validates token → Allows access                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Where to See the Token

### Method 1: Collection Variables Tab

1. Click on the **collection name** (E-Commerce Admin API - Complete)
2. Click **"Variables"** tab
3. Look for `adminToken` variable
4. You'll see the token value in the "Current Value" column

```
┌──────────────┬─────────────────────────────────────┬──────────────┐
│ Variable     │ Initial Value                       │ Current Value│
├──────────────┼─────────────────────────────────────┼──────────────┤
│ baseUrl      │ http://localhost:5004               │ (same)       │
│ adminToken   │ (empty)                             │ eyJhbGci...  │
│ userId       │ (empty)                             │ (empty)      │
└──────────────┴─────────────────────────────────────┴──────────────┘
```

### Method 2: Postman Console

1. Open Postman Console: **View → Show Postman Console**
2. Run "Login Admin" request
3. See log: `Admin token saved!`
4. See the token value in console

### Method 3: Hover Over Variable

1. Open any admin request
2. In the Headers tab, hover over `{{adminToken}}`
3. Postman shows a tooltip with the actual value

---

## 📝 How Headers Work in Each Request

### Example 1: Get All Users

**What you see in Postman**:
```
Headers:
  Key: Authorization
  Value: Bearer {{adminToken}}
```

**What actually gets sent**:
```
Headers:
  Key: Authorization
  Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInJvbGUiOiJhZG1pbiJ9.abc123
```

### Example 2: Create Product

**What you see in Postman**:
```
Headers:
  Key: Authorization
  Value: Bearer {{adminToken}}
  Key: Content-Type
  Value: application/json
```

**What actually gets sent**:
```
Headers:
  Key: Authorization
  Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInJvbGUiOiJhZG1pbiJ9.abc123
  Key: Content-Type
  Value: application/json
```

---

## ✅ Is the Token Already Implemented?

### YES! ✅ The token is already implemented in ALL requests!

Every admin request in the collection has this header pre-configured:

```
Authorization: Bearer {{adminToken}}
```

**You don't need to**:
- ❌ Copy/paste the token manually
- ❌ Edit each request
- ❌ Add headers yourself

**You only need to**:
- ✅ Run "Login Admin" once
- ✅ Token auto-saves
- ✅ All other requests work automatically

---

## 🧪 Testing the Token Flow

### Test 1: Login and Check Variable

```bash
1. Run "Login Admin" request
2. Click collection name → Variables tab
3. See adminToken has a value
4. ✅ Token is saved!
```

### Test 2: Use Token in Another Request

```bash
1. Run "Login Admin" request
2. Run "Get Admin Profile" request
3. Check response - you get your profile data
4. ✅ Token is working!
```

### Test 3: Check Headers

```bash
1. Open "Get All Users" request
2. Go to Headers tab
3. Hover over {{adminToken}}
4. See the actual token value
5. ✅ Token is being used!
```

---

## 🔧 Manual Token Usage (If Needed)

If you want to use the token manually in a new request:

### Option 1: Use Variable (Recommended)
```
Authorization: Bearer {{adminToken}}
```

### Option 2: Copy Token Manually
1. Get token from Variables tab
2. Copy the value
3. In your request header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Common Scenarios

### Scenario 1: First Time Using Collection

```
Step 1: Import collection ✅
Step 2: Run "Login Admin" ✅
Step 3: Token auto-saves ✅
Step 4: Run any admin request ✅
Step 5: It works! ✅
```

### Scenario 2: Token Expired

```
Problem: Requests return "Token expired"
Solution:
  1. Run "Login Admin" again
  2. New token auto-saves
  3. Continue testing
```

### Scenario 3: Testing Multiple Roles

```
For Admin:
  1. Login as admin
  2. Token saved to {{adminToken}}
  3. Use admin endpoints

For Customer:
  1. Login as customer
  2. Token saved to {{customerToken}}
  3. Use customer endpoints
```

---

## 📊 Token Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│  TOKEN LIFECYCLE                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. LOGIN                                               │
│     ↓                                                    │
│  2. SERVER GENERATES TOKEN (Valid for 7 days)          │
│     ↓                                                    │
│  3. POSTMAN SAVES TOKEN                                 │
│     ↓                                                    │
│  4. TOKEN USED IN ALL REQUESTS                          │
│     ↓                                                    │
│  5. TOKEN EXPIRES AFTER 7 DAYS                          │
│     ↓                                                    │
│  6. LOGIN AGAIN TO GET NEW TOKEN                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error

**Cause**: Token not set or invalid

**Check**:
```
1. Collection Variables → adminToken has value?
2. If empty → Run "Login Admin"
3. If has value → Token might be expired → Login again
```

### Issue: Token Not Saving

**Cause**: Test script not running

**Solution**:
```
1. Open "Login Admin" request
2. Go to "Tests" tab
3. Verify script exists:
   if (pm.response.code === 200) {
     pm.collectionVariables.set('adminToken', pm.response.json().token);
   }
4. If missing → Re-import collection
```

### Issue: {{adminToken}} Shows as Text

**Cause**: Variable not defined

**Solution**:
```
1. Check collection variables
2. Run "Login Admin" to set it
3. Refresh Postman if needed
```

---

## ✅ Summary

### How It Works:
1. **Login** → Server returns token
2. **Auto-Save** → Postman saves to `{{adminToken}}`
3. **Auto-Use** → All requests use `Bearer {{adminToken}}`
4. **Auto-Replace** → Postman replaces with actual token

### What You Do:
1. ✅ Import collection
2. ✅ Run "Login Admin"
3. ✅ Test any endpoint
4. ✅ Done!

### What's Already Done:
- ✅ All headers configured
- ✅ Token variable set up
- ✅ Auto-save script added
- ✅ All 59 requests ready

---

## 🎉 You're Ready!

**The token system is fully automated!**

Just:
1. Login once
2. Test everything
3. Login again when token expires (7 days)

**No manual token management needed!** 🚀

---

**File**: TOKEN-FLOW-EXPLAINED.md  
**Status**: Complete explanation  
**Token Management**: ✅ Fully automated
