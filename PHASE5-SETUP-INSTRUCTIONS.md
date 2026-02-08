# 🚀 Phase 5 Setup Instructions

**Current Issue**: Phase 5 tables don't exist in your database  
**Solution**: Run the Phase 5 migration SQL in Supabase  
**Time Required**: 2 minutes

---

## ✅ Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project: `yqigycicloyhasoqlcpn`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

---

### Step 2: Copy the Phase 5 Migration SQL

1. Open the file: `ecomerce_backend/database/migrations/phase5-multi-vendor-features.sql`
2. Select ALL content (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

---

### Step 3: Run the SQL

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** button (or press Ctrl+Enter)
3. Wait for execution to complete (~5-10 seconds)
4. You should see: "Success. No rows returned"

---

### Step 4: Verify Tables Created

Run this query in the SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'seller_documents',
  'seller_earnings',
  'product_approvals',
  'seller_performance',
  'manager_actions',
  'notifications',
  'payout_requests'
)
ORDER BY table_name;
```

**Expected Result**: 7 tables listed

---

### Step 5: Refresh Schema Cache

Run this in the SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

---

### Step 6: Run Tests

Back in your terminal:

```bash
cd ecomerce_backend
node test-phase5-comprehensive.js
```

**Expected Result**: All 15 tests should pass ✅

---

## 🎯 What Gets Created

### New Tables (7):
1. **seller_documents** - Seller verification documents
2. **seller_earnings** - Earnings tracking per order
3. **product_approvals** - Product approval history
4. **seller_performance** - Performance metrics
5. **manager_actions** - Manager activity log
6. **notifications** - In-app notifications
7. **payout_requests** - Seller payout requests

### Updated Tables (2):
1. **users** - Added seller verification fields
2. **products** - Added approval workflow fields

### Functions & Triggers:
- `update_seller_performance()` - Auto-update metrics
- `create_notification()` - Helper for notifications
- Auto-update triggers on all tables

---

## 🐛 Troubleshooting

### Problem: "relation already exists"
**Solution**: Tables already exist. Skip to Step 5 (Refresh Schema Cache)

### Problem: "permission denied"
**Solution**: Make sure you're using the Supabase SQL Editor with your service role key

### Problem: Tests still failing after running SQL
**Solution**: 
1. Wait 10 seconds for cache to refresh
2. Run: `node refresh-schema-cache.js`
3. Run tests again

### Problem: "Could not find table in schema cache"
**Solution**: 
1. Go to Supabase Dashboard > Project Settings > API
2. Click "Reload schema cache" button
3. Wait 10 seconds
4. Run tests again

---

## 📊 Expected Test Results

After running the migration:

```
📊 Test Summary:
   Total Tests: 15
   ✅ Passed: 15
   ❌ Failed: 0
   Success Rate: 100.0%

🎉 ALL PHASE 5 TESTS PASSED! 🎉
```

---

## 🚀 Quick Commands

```bash
# Verify tables exist
node verify-phase5-tables.js

# Refresh schema cache
node refresh-schema-cache.js

# Run comprehensive tests
node test-phase5-comprehensive.js

# Check server status
curl http://localhost:5000/health
```

---

## 📁 Important Files

- **Migration SQL**: `database/migrations/phase5-multi-vendor-features.sql`
- **Test Suite**: `test-phase5-comprehensive.js`
- **Verification**: `verify-phase5-tables.js`
- **Cache Refresh**: `refresh-schema-cache.js`

---

**Status**: ⏳ Waiting for Phase 5 migration  
**Action Required**: Run SQL in Supabase Dashboard  
**Estimated Time**: 2 minutes

---

**Created**: February 8, 2026  
**Last Updated**: February 8, 2026
