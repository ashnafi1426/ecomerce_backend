# 🔐 ADMIN CREDENTIALS

## ✅ Admin Account Ready

Your admin account has been created and is ready to use!

---

## 🔑 Login Credentials

```
Email:    admin@ecommerce.com
Password: Admin123!@#
Role:     admin
```

---

## 🚀 How to Login in Postman

### Step 1: Import Collection
```
File: E-Commerce-Admin-Complete.postman_collection.json
```

### Step 2: Login
1. Open the collection
2. Go to **"1. Admin Authentication"**
3. Click **"Login Admin"**
4. Click **"Send"**

### Step 3: Verify
The request body is already set:
```json
{
  "email": "admin@ecommerce.com",
  "password": "Admin123!@#"
}
```

### Step 4: Success!
You should get a response like:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@ecommerce.com",
    "role": "admin",
    "displayName": "Admin User"
  }
}
```

The token will be automatically saved to `{{adminToken}}` variable!

---

## 🧪 Test the Login

### Using curl:
```bash
curl -X POST http://localhost:5004/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecommerce.com",
    "password": "Admin123!@#"
  }'
```

### Using Postman:
```
POST http://localhost:5004/api/auth/login

Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "email": "admin@ecommerce.com",
  "password": "Admin123!@#"
}
```

---

## ✅ Account Details

| Field | Value |
|-------|-------|
| **Email** | admin@ecommerce.com |
| **Password** | Admin123!@# |
| **Role** | admin |
| **Display Name** | Admin User |
| **Status** | active |

---

## 🔒 Security Notes

### Password Requirements
- Minimum 8 characters ✅
- Contains uppercase ✅
- Contains lowercase ✅
- Contains numbers ✅
- Contains special characters ✅

### Change Password (Optional)
If you want to change the password, you can:

1. Login with current credentials
2. Use the "Update Profile" endpoint
3. Or update directly in database:
```sql
UPDATE users 
SET password_hash = 'new_bcrypt_hash_here'
WHERE email = 'admin@ecommerce.com';
```

---

## 🐛 Troubleshooting

### Issue: "Invalid email or password"

**Possible Causes**:
1. Typo in email or password
2. Account doesn't exist
3. Account is not active

**Solution**:
1. Double-check credentials (copy-paste from above)
2. Run `node create-admin-account.js` to verify/create account
3. Check account status in database:
```sql
SELECT email, role, status FROM users WHERE email = 'admin@ecommerce.com';
```

### Issue: "Account is not active"

**Solution**:
```sql
UPDATE users 
SET status = 'active' 
WHERE email = 'admin@ecommerce.com';
```

### Issue: "Forbidden" after login

**Cause**: Role is not 'admin'

**Solution**:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@ecommerce.com';
```

---

## 📝 Quick Reference

### Login Request
```http
POST /api/auth/login HTTP/1.1
Host: localhost:5004
Content-Type: application/json

{
  "email": "admin@ecommerce.com",
  "password": "Admin123!@#"
}
```

### Expected Response (200 OK)
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@ecommerce.com",
    "role": "admin",
    "displayName": "Admin User"
  }
}
```

---

## 🎯 Next Steps

After successful login:

1. ✅ Token is saved automatically
2. ✅ Test "Get Admin Profile" endpoint
3. ✅ Try any admin endpoint
4. ✅ Manage users, products, orders, etc.

---

## 📞 Support

If you still can't login:

1. Check server is running: `npm start`
2. Verify database connection
3. Run: `node create-admin-account.js`
4. Check server logs for errors
5. Test with curl to isolate Postman issues

---

## ✅ Summary

**Email**: `admin@ecommerce.com`  
**Password**: `Admin123!@#`  
**Status**: ✅ **READY TO USE**

**Login in Postman and start managing your e-commerce platform!** 🚀

---

**Created**: February 7, 2026  
**Account Status**: Active  
**Role**: Admin  
**Access**: Full admin privileges
