# How to Run the Complete Phase 5 SQL

**File**: `database/PHASE5-COMPLETE-ALL-IN-ONE.sql`

This single SQL file contains **EVERYTHING** for Phase 5:
- ✅ All 7 new tables
- ✅ All indexes
- ✅ Updates to existing tables (users, products)
- ✅ Functions and triggers
- ✅ RLS policies for API access
- ✅ Default data seeding
- ✅ Schema cache refresh command

---

## 🚀 Method 1: Run via Supabase Dashboard (RECOMMENDED)

### Step 1: Open SQL Editor
Go to: https://supabase.com/dashboard/project/yqigycicloyhasoqlcpn/sql/new

### Step 2: Copy the SQL File
1. Open `ecomerce_backend/database/PHASE5-COMPLETE-ALL-IN-ONE.sql`
2. Copy ALL the content (Ctrl+A, Ctrl+C)

### Step 3: Paste and Run
1. Paste into the SQL Editor
2. Click "Run" button (or press Ctrl+Enter)

### Step 4: Wait for Completion
You'll see messages like:
```
✅ Phase 5 Tables Created: 7 out of 7
🎉 ALL PHASE 5 TABLES CREATED SUCCESSFULLY!
✅ 7 New Tables Created
✅ Indexes Created
✅ Functions & Triggers Created
✅ RLS Policies Enabled
✅ Default Data Seeded
✅ Schema Cache Refreshed
🚀 Phase 5 is Ready!
```

### Step 5: Test
```bash
cd ecomerce_backend
node test-phase5-comprehensive.js
```

**Expected**: 15/15 tests passing (100%)

---

## 🚀 Method 2: Run via Node.js Script

### Step 1: Create Run Script
Already exists: `run-phase5-migration.js`

### Step 2: Run It
```bash
cd ecomerce_backend
node run-phase5-migration.js
```

### Step 3: Test
```bash
node test-phase5-comprehensive.js
```

---

## 🚀 Method 3: Run via psql Command Line

If you have PostgreSQL client installed:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.yqigycicloyhasoqlcpn.supabase.co:5432/postgres" -f database/PHASE5-COMPLETE-ALL-IN-ONE.sql
```

Replace `[YOUR-PASSWORD]` with your Supabase database password.

---

## ✅ What This SQL Does

### 1. Creates 7 New Tables:
- `seller_documents` - Store seller verification documents
- `seller_earnings` - Track seller earnings and payouts
- `product_approvals` - Product approval workflow history
- `seller_performance` - Seller performance metrics
- `manager_actions` - Manager activity log
- `notifications` - In-app notifications
- `payout_requests` - Seller payout requests

### 2. Updates Existing Tables:
- Adds seller verification fields to `users` table
- Adds approval workflow fields to `products` table

### 3. Creates Functions:
- `update_seller_performance()` - Auto-update seller metrics
- `create_notification()` - Helper to create notifications

### 4. Creates Triggers:
- Auto-update seller performance when orders change

### 5. Enables RLS Policies:
- Allows backend API to access all tables
- Enables Row Level Security for data protection

### 6. Seeds Default Data:
- Creates seller_performance records for existing sellers

### 7. Refreshes Cache:
- Sends `NOTIFY pgrst, 'reload schema'` command
- Forces PostgREST to recognize new tables immediately

---

## 🧪 Verification

### Check Tables Exist
```bash
node verify-phase5-tables.js
```

Should show:
```
✅ seller_documents: Table exists
✅ seller_earnings: Table exists
✅ product_approvals: Table exists
✅ seller_performance: Table exists
✅ manager_actions: Table exists
✅ notifications: Table exists
✅ payout_requests: Table exists
```

### Check API Access
```bash
node enable-phase5-api-access.js
```

Should show:
```
✅ seller_documents: Accessible
✅ seller_earnings: Accessible
✅ product_approvals: Accessible
✅ seller_performance: Accessible
✅ manager_actions: Accessible
✅ notifications: Accessible
✅ payout_requests: Accessible
```

### Run Full Tests
```bash
node test-phase5-comprehensive.js
```

Should show:
```
📊 Test Summary:
   Total Tests: 15
   ✅ Passed: 15
   ❌ Failed: 0
   Success Rate: 100.0%

🎉 ALL PHASE 5 TESTS PASSED! 🎉
```

---

## 🔧 If Tests Still Fail

### Wait 2 Minutes
The schema cache refresh might take a moment to propagate.

### Run Cache Refresh Again
Open SQL Editor and run:
```sql
NOTIFY pgrst, 'reload schema';
```

### Restart Supabase Project
1. Go to: https://supabase.com/dashboard/project/yqigycicloyhasoqlcpn/settings/general
2. Click "Pause project"
3. Wait 30 seconds
4. Click "Resume project"
5. Wait 2 minutes
6. Test again

---

## 📊 What's Included in This SQL

```
Total Lines: ~450
Total Statements: ~80

Breakdown:
- CREATE TABLE: 7 statements
- CREATE INDEX: 20 statements
- ALTER TABLE: 7 statements
- CREATE FUNCTION: 2 statements
- CREATE TRIGGER: 1 statement
- CREATE POLICY: 7 statements
- INSERT: 1 statement
- NOTIFY: 1 statement
- Verification: 2 statements
```

---

## 🎯 Success Criteria

After running this SQL, you should have:

✅ 7 new tables in your database  
✅ All indexes created  
✅ RLS policies enabled  
✅ Functions and triggers working  
✅ Default data seeded  
✅ Schema cache refreshed  
✅ 100% test success rate  

---

## 💡 Important Notes

### Safe to Run Multiple Times
- Uses `IF NOT EXISTS` for tables
- Uses `IF NOT EXISTS` for columns
- Uses `DROP POLICY IF EXISTS` before creating policies
- Won't duplicate data or cause errors

### Idempotent
- Can run this SQL as many times as needed
- Won't break existing data
- Won't create duplicates

### Production Ready
- Includes all necessary constraints
- Includes all necessary indexes
- Includes RLS for security
- Includes proper foreign keys

---

## 🚨 Troubleshooting

### Error: "relation already exists"
**Solution**: This is fine! It means tables already exist. The script will skip them.

### Error: "column already exists"
**Solution**: This is fine! It means columns already exist. The script will skip them.

### Error: "permission denied"
**Solution**: Make sure you're using the Supabase SQL Editor or service role credentials.

### Tests still failing after running SQL
**Solution**: 
1. Wait 2-5 minutes for cache to refresh
2. Run `NOTIFY pgrst, 'reload schema';` again
3. Restart Supabase project if needed

---

## 📞 Quick Commands

```bash
# Run migration
node run-phase5-migration.js

# Verify tables
node verify-phase5-tables.js

# Check API access
node enable-phase5-api-access.js

# Run tests
node test-phase5-comprehensive.js

# Start server
npm start
```

---

**Status**: ✅ **READY TO RUN**  
**File**: `database/PHASE5-COMPLETE-ALL-IN-ONE.sql`  
**Size**: ~450 lines  
**Statements**: ~80 SQL statements  
**Time to Run**: ~5 seconds  

🎉 **Everything you need in ONE file!**
