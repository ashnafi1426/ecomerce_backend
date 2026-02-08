# ⚡ ADMIN COLLECTION - QUICK START

## 📦 File to Import
```
E-Commerce-Admin-Complete.postman_collection.json
```

## 🚀 3-Step Setup

### 1. Import Collection
- Open Postman
- Click "Import"
- Select the JSON file
- Done!

### 2. Create Admin Account
Run in Supabase SQL Editor:
```sql
-- First, register normally, then update role:
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@ecommerce.com';
```

### 3. Login
- Run "Login Admin" request
- Token auto-saves to `{{adminToken}}`
- Start testing!

---

## 🔑 Admin Credentials

```
Email: admin@ecommerce.com
Password: Admin123!@#
Role: admin (set in database)
```

---

## 📋 What's Included

**59 Admin Requests** across 10 categories:

1. ✅ Health Check (1)
2. ✅ Authentication (3)
3. ✅ User Management (11)
4. ✅ Categories (5)
5. ✅ Products (6)
6. ✅ Inventory (6)
7. ✅ Orders (5)
8. ✅ Payments (4)
9. ✅ Reviews (5)
10. ✅ Analytics (13)

---

## 🧪 Quick Test Flow

```
1. Login Admin → Get token
2. Create Category → Electronics
3. Create Product → iPhone
4. Create Inventory → 100 units
5. View Dashboard → See analytics
```

---

## 🐛 Troubleshooting

**"Unauthorized"?**
→ Run "Login Admin" first

**"Forbidden"?**
→ Check role is 'admin' in database

**Token not saving?**
→ Check collection variables tab

---

## ✅ You're Ready!

Import the collection and start managing your e-commerce platform as admin!

**File**: `E-Commerce-Admin-Complete.postman_collection.json`  
**Guide**: `ADMIN-POSTMAN-GUIDE.md`

🚀 **Happy Admin Testing!**
