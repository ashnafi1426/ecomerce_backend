# 🚀 Quick Start: Run Phase 1 Migration

## ⚠️ CRITICAL: Backup First!

```bash
# Create backup before running migration
pg_dump -h your-supabase-host -U postgres -d postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🎯 Option 1: Run via Supabase SQL Editor (Recommended)

### Step-by-Step:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Click "SQL Editor" in left sidebar

2. **Run Each Migration in Order:**

   **Migration 1: Roles and Seller Fields**
   - Click "New Query"
   - Copy contents of `database/migrations/phase1-01-add-roles-and-seller-fields.sql`
   - Paste and click "Run"
   - Wait for "Success" message

   **Migration 2: Multi-Vendor Products**
   - New Query
   - Copy contents of `database/migrations/phase1-02-multi-vendor-products.sql`
   - Paste and Run

   **Migration 3: Commission and Financial**
   - New Query
   - Copy contents of `database/migrations/phase1-03-commission-and-financial-tables.sql`
   - Paste and Run

   **Migration 4: Disputes and Returns**
   - New Query
   - Copy contents of `database/migrations/phase1-04-disputes-and-enhanced-returns.sql`
   - Paste and Run

   **Migration 5: Notifications and Audit**
   - New Query
   - Copy contents of `database/migrations/phase1-05-notifications-and-audit-enhancement.sql`
   - Paste and Run

3. **Verify Success**
   ```sql
   -- Run this query to verify
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name IN (
       'commission_rates', 'seller_balances', 'seller_payouts',
       'disputes', 'notifications'
     );
   ```

## 🎯 Option 2: Run via Command Line

### Prerequisites:
```bash
# Install PostgreSQL client if not installed
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Get Supabase Connection String:
1. Go to Supabase Dashboard → Settings → Database
2. Copy "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password

### Run Migration:
```bash
cd ecomerce_backend/database/migrations

# Set your connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Run master migration script
psql $DATABASE_URL -f PHASE1-MASTER-MIGRATION.sql
```

## ✅ Verification

After migration, run these checks:

### 1. Check Tables Created
```sql
SELECT COUNT(*) as new_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'commission_rates', 'seller_balances', 'seller_payouts',
    'payment_transactions', 'sub_orders', 'disputes', 
    'dispute_messages', 'returns', 'return_messages',
    'notifications', 'notification_preferences',
    'security_events', 'system_logs'
  );
-- Should return: 13
```

### 2. Check User Roles
```sql
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;
-- Should show: admin, customer (and possibly manager, seller)
```

### 3. Check Products Have Seller
```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(seller_id) as products_with_seller,
  COUNT(approval_status) as products_with_approval
FROM products;
-- All counts should be equal
```

### 4. Check Commission Rates
```sql
SELECT rate_type, commission_percentage, is_active
FROM commission_rates
ORDER BY rate_type;
-- Should show: global (10%), and tier rates
```

### 5. Check Views Created
```sql
SELECT COUNT(*) as view_count
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name IN (
    'seller_statistics', 'approved_products', 
    'pending_product_approvals', 'open_disputes',
    'pending_returns', 'unread_notifications'
  );
-- Should return: 6 or more
```

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solution**: Some tables already exist. Either:
- Skip that migration file, or
- Drop the table first: `DROP TABLE IF EXISTS table_name CASCADE;`

### Error: "column already exists"
**Solution**: Column was added in a previous run. Safe to ignore or use:
```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TYPE;
```

### Error: "foreign key constraint"
**Solution**: Check that referenced tables exist. Run migrations in order.

### Error: "permission denied"
**Solution**: Ensure you're using the service role key, not anon key.

## 🔄 Rollback (If Needed)

### Option 1: Restore from Backup
```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### Option 2: Manual Cleanup (Not Recommended)
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
-- Restore from backup is recommended
```

## 📊 Expected Results

After successful migration:

- ✅ 13 new tables created
- ✅ 8 existing tables enhanced
- ✅ 12+ views created
- ✅ 10+ functions created
- ✅ All existing data preserved
- ✅ User roles expanded to 4
- ✅ Products linked to sellers
- ✅ Commission system configured
- ✅ Notification system ready
- ✅ Audit logging enhanced

## ⏱️ Estimated Time

- **Small database** (<1000 records): 2-5 minutes
- **Medium database** (1000-10000 records): 5-15 minutes
- **Large database** (>10000 records): 15-30 minutes

## 📞 Need Help?

1. Check `PHASE1-DATABASE-MIGRATION-COMPLETE.md` for detailed documentation
2. Review error messages in migration output
3. Verify all prerequisites are met
4. Ensure database connection is stable

## ✨ Next Steps

After successful migration:

1. ✅ Verify all checks pass
2. ✅ Test database connectivity from app
3. ✅ Review `FASTSHOP-MIGRATION-PLAN.md` for Phase 2
4. ✅ Update backend code for new schema
5. ✅ Proceed to Phase 2: Authentication & Authorization

---

**Ready to migrate?** Start with Option 1 (Supabase SQL Editor) for the safest approach!
