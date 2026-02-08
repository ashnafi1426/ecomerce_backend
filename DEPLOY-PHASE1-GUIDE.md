# 🚀 Phase 1 Deployment Guide

## Quick Start

Follow these steps to deploy Phase 1 database migrations to your Supabase instance.

---

## ⚠️ CRITICAL: Backup First!

**Before running ANY migrations, create a backup of your database!**

### Option 1: Supabase Dashboard Backup
1. Go to [Supabase Dashboard](https://app.supabase.com/project/yqigycicloyhasoqlcpn)
2. Click **Database** → **Backups**
3. Click **Create Backup**
4. Wait for backup to complete

### Option 2: Command Line Backup (if you have PostgreSQL client)
```bash
# Install PostgreSQL client first if needed
# Windows: Download from https://www.postgresql.org/download/windows/

# Create backup
pg_dump -h db.yqigycicloyhasoqlcpn.supabase.co -U postgres -d postgres > backup_phase1_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📋 Pre-Deployment Checklist

Run the deployment helper script to check your environment:

```bash
cd ecomerce_backend
node deploy-phase1.js
```

This will:
- ✅ Test database connection
- ✅ Check for existing Phase 1 tables
- ✅ Display deployment instructions

---

## 🎯 Deployment Method: Supabase SQL Editor (Recommended)

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com/project/yqigycicloyhasoqlcpn/sql
2. You should see the SQL Editor interface

### Step 2: Run Migrations in Order

**IMPORTANT: Run these migrations in EXACT order!**

#### Migration 1: User Roles and Seller Fields
```
File: database/migrations/phase1-01-add-roles-and-seller-fields.sql
```

1. Click **"New Query"** button
2. Open `ecomerce_backend/database/migrations/phase1-01-add-roles-and-seller-fields.sql`
3. Copy ALL contents (Ctrl+A, Ctrl+C)
4. Paste into SQL Editor
5. Click **"Run"** button (or press F5)
6. Wait for **"Success"** message
7. ✅ Verify: You should see "Query executed successfully"

#### Migration 2: Multi-Vendor Products
```
File: database/migrations/phase1-02-multi-vendor-products.sql
```

1. Click **"New Query"** button (create a fresh query)
2. Open `ecomerce_backend/database/migrations/phase1-02-multi-vendor-products.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for **"Success"**
7. ✅ Verify: Check for success message

#### Migration 3: Commission and Financial Tables
```
File: database/migrations/phase1-03-commission-and-financial-tables.sql
```

1. Click **"New Query"**
2. Open `ecomerce_backend/database/migrations/phase1-03-commission-and-financial-tables.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for **"Success"**
7. ✅ Verify: Check for success message

#### Migration 4: Disputes and Enhanced Returns
```
File: database/migrations/phase1-04-disputes-and-enhanced-returns.sql
```

1. Click **"New Query"**
2. Open `ecomerce_backend/database/migrations/phase1-04-disputes-and-enhanced-returns.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for **"Success"**
7. ✅ Verify: Check for success message

#### Migration 5: Notifications and Audit Enhancement
```
File: database/migrations/phase1-05-notifications-and-audit-enhancement.sql
```

1. Click **"New Query"**
2. Open `ecomerce_backend/database/migrations/phase1-05-notifications-and-audit-enhancement.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for **"Success"**
7. ✅ Verify: Check for success message

---

## 🎯 Alternative: Master Migration Script (All-in-One)

If you prefer to run all migrations at once:

1. Click **"New Query"** in Supabase SQL Editor
2. Open `ecomerce_backend/database/migrations/PHASE1-MASTER-MIGRATION.sql`
3. Copy ALL contents (this file is large - ~2000+ lines)
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for completion (may take 1-2 minutes)
7. ✅ Verify: Check for success message

**Note:** This runs all 5 migrations sequentially. If any migration fails, the entire transaction rolls back.

---

## ✅ Post-Deployment Verification

### Step 1: Run Automated Verification

```bash
cd ecomerce_backend
node deploy-phase1.js --verify
```

This will check:
- ✅ New tables created
- ✅ User roles column exists
- ✅ Database connection working

### Step 2: Manual Verification Queries

Run these queries in Supabase SQL Editor to verify:

#### Check New Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'commission_rates', 
    'seller_balances', 
    'seller_payouts',
    'payment_transactions', 
    'sub_orders', 
    'disputes', 
    'dispute_messages', 
    'returns', 
    'return_messages',
    'notifications', 
    'notification_preferences',
    'security_events', 
    'system_logs'
  )
ORDER BY table_name;
```
**Expected Result:** 13 tables

#### Check User Roles
```sql
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
```
**Expected Result:** Shows admin, customer (minimum)

#### Check Products Have Seller Fields
```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(seller_id) as products_with_seller,
  COUNT(approval_status) as products_with_approval
FROM products;
```
**Expected Result:** All three counts should be equal

#### Check Commission Rates
```sql
SELECT rate_type, commission_percentage, is_active
FROM commission_rates
ORDER BY rate_type;
```
**Expected Result:** Shows global rate (10%) and tier rates

#### Check Views Created
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN (
    'seller_statistics', 
    'approved_products', 
    'pending_product_approvals', 
    'open_disputes',
    'pending_returns', 
    'unread_notifications'
  )
ORDER BY table_name;
```
**Expected Result:** 6+ views

### Step 3: Test Database Connection from Backend

```bash
cd ecomerce_backend
node test-connection.js
```

**Expected Output:**
```
✅ Database connection successful!
✅ Users table accessible
✅ Products table accessible
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"

**Cause:** Table already exists from previous migration attempt

**Solution:**
1. Check if Phase 1 was already deployed
2. If partial deployment, review which tables exist
3. Either skip that migration or drop the table first:
   ```sql
   DROP TABLE IF EXISTS table_name CASCADE;
   ```

### Error: "column already exists"

**Cause:** Column was added in a previous run

**Solution:** Safe to ignore if the column exists with correct type. Or use:
```sql
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name TYPE;
```

### Error: "foreign key constraint"

**Cause:** Referenced table doesn't exist yet

**Solution:** Ensure migrations are run in correct order (01 → 05)

### Error: "permission denied"

**Cause:** Using wrong API key

**Solution:** Ensure you're using the SERVICE_ROLE_KEY from `.env`, not the anon key

### Migration Hangs or Times Out

**Cause:** Large migration or slow connection

**Solution:**
1. Check your internet connection
2. Try running migrations individually instead of master script
3. Check Supabase dashboard for any ongoing operations

---

## 🔄 Rollback (If Needed)

### Option 1: Restore from Backup (Recommended)

1. Go to Supabase Dashboard → Database → Backups
2. Find your pre-migration backup
3. Click **"Restore"**
4. Confirm restoration
5. Wait for completion

### Option 2: Manual Cleanup (Not Recommended)

Only use if you don't have a backup and need to undo changes:

```sql
-- Drop new tables in reverse order
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS return_messages CASCADE;
DROP TABLE IF EXISTS dispute_messages CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS sub_orders CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS seller_payouts CASCADE;
DROP TABLE IF EXISTS seller_balances CASCADE;
DROP TABLE IF EXISTS commission_rates CASCADE;

-- Note: Reverting column changes is complex
-- Full backup restoration is strongly recommended
```

---

## 📊 Expected Results

After successful Phase 1 deployment:

| Metric | Before | After |
|--------|--------|-------|
| **Tables** | 12 | 25+ |
| **User Roles** | 2 | 4 |
| **Views** | 3 | 15+ |
| **Functions** | 5 | 15+ |

### New Capabilities Enabled:
- ✅ Multi-vendor support (sellers can register)
- ✅ Product approval workflow (manager approval required)
- ✅ Commission system (platform fees)
- ✅ Seller payouts (automated payment distribution)
- ✅ Dispute resolution (customer-seller disputes)
- ✅ Enhanced returns (detailed return workflow)
- ✅ Notification system (multi-channel notifications)
- ✅ Security audit (comprehensive logging)

---

## ⏱️ Estimated Time

- **Small database** (<1000 records): 2-5 minutes
- **Medium database** (1000-10000 records): 5-15 minutes
- **Large database** (>10000 records): 15-30 minutes

---

## ✨ Next Steps After Successful Deployment

1. ✅ Verify all checks pass
2. ✅ Test database connectivity: `node test-connection.js`
3. ✅ Review Phase 2 requirements
4. ✅ Proceed to Phase 2: Authentication & Authorization

---

## 📞 Need Help?

1. Check `PHASE1-DATABASE-MIGRATION-COMPLETE.md` for detailed documentation
2. Review `RUN-PHASE1-MIGRATION.md` for quick reference
3. Check error messages in SQL Editor output
4. Verify Supabase connection in `.env` file

---

## 🎉 Success Criteria

Phase 1 is successfully deployed when:

- ✅ All 5 migrations run without errors
- ✅ 13 new tables created
- ✅ User roles expanded to 4 (admin, manager, seller, customer)
- ✅ All verification queries return expected results
- ✅ Backend can connect to database
- ✅ No breaking changes to existing functionality

---

**Ready to deploy?** Start with the backup, then follow the Supabase SQL Editor method!

**Document Version:** 1.0  
**Created:** February 8, 2026  
**Status:** Ready for Deployment
