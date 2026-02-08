# Critical Features Migration Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying all critical features database migrations to your Supabase database. These migrations implement five major features:

1. **Product Variants System** - Multiple product options (size, color, etc.)
2. **Discount and Promotion System** - Coupons and promotional pricing
3. **Delivery Rating System** - Multi-dimensional delivery feedback
4. **Replacement Process** - Product replacement workflow
5. **Enhanced Refund Process** - Partial refunds and detailed tracking

## Prerequisites

- Access to Supabase Dashboard (https://app.supabase.com)
- Your project's Supabase SQL Editor
- Database backup (recommended before running migrations)

## Migration Order

**IMPORTANT:** Migrations must be run in this exact order due to table dependencies:

1. `create-product-variants.sql` - Creates variant tables
2. `create-discount-promotion-tables-v2.sql` - Creates discount/coupon tables
3. `create-delivery-rating-tables.sql` - Creates delivery rating tables
4. `create-replacement-process-tables.sql` - Creates replacement workflow tables
5. `create-enhanced-refund-tables.sql` - Creates enhanced refund tables

## Deployment Steps

### Step 1: Backup Your Database

Before running any migrations, create a backup:

1. Go to Supabase Dashboard → Your Project
2. Navigate to **Database** → **Backups**
3. Click **Create Backup** and wait for completion

### Step 2: Open SQL Editor

1. In Supabase Dashboard, navigate to **SQL Editor**
2. Click **New Query** to create a new SQL script

### Step 3: Run Migrations in Order

#### Migration 1: Product Variants System

1. Open `ecomerce_backend/database/migrations/create-product-variants.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for completion message: "Product Variants System Migration Complete!"

**Expected Tables Created:**
- `product_variants` - Stores variant definitions
- `variant_inventory` - Tracks inventory per variant
- Updates `cart_items` table with `variant_id` column

**Verification:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('product_variants', 'variant_inventory');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('product_variants', 'variant_inventory');
```

#### Migration 2: Discount and Promotion System

1. Open `ecomerce_backend/database/migrations/create-discount-promotion-tables-v2.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for completion message: "Discount and Promotion System V2 Migration Complete!"

**Expected Tables Created:**
- `coupons` - Stores coupon definitions
- `coupon_usage` - Tracks coupon usage history
- `promotional_pricing` - Stores time-based promotions
- Updates `orders` table with discount columns

**Verification:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('coupons', 'coupon_usage', 'promotional_pricing');

-- Check helper functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('validate_coupon_eligibility', 'get_active_promotional_price');
```

#### Migration 3: Delivery Rating System

1. Open `ecomerce_backend/database/migrations/create-delivery-rating-tables.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for completion message: "Delivery Rating System Migration Complete!"

**Expected Tables Created:**
- `delivery_ratings` - Stores multi-dimensional delivery ratings
- Updates `orders` table with `delivered_at` and `delivery_rated` columns

**Verification:**
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'delivery_ratings';

-- Check helper functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_seller_delivery_metrics', 'can_submit_delivery_rating');
```

#### Migration 4: Replacement Process System

1. Open `ecomerce_backend/database/migrations/create-replacement-process-tables.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for completion message: "Replacement Process System Migration Complete!"

**Expected Tables Created:**
- `replacement_requests` - Stores replacement requests
- `replacement_shipments` - Tracks replacement shipments
- Updates `products` table with `is_returnable` and `replacement_count` columns

**Verification:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('replacement_requests', 'replacement_shipments');

-- Check helper functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('can_create_replacement_request', 'reserve_replacement_inventory');
```

#### Migration 5: Enhanced Refund Process System

1. Open `ecomerce_backend/database/migrations/create-enhanced-refund-tables.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Wait for completion message: "Enhanced Refund Process System Migration Complete!"

**Expected Tables Created:**
- `refund_details` - Stores refund requests with partial refund support
- `refund_images` - Stores refund evidence images
- Updates `orders` table with `refund_status` and `total_refunded` columns
- Updates `products` table with `refund_count` and `is_flagged_high_refund` columns

**Verification:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('refund_details', 'refund_images');

-- Check helper functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('can_create_refund_request', 'get_refund_analytics');
```

### Step 4: Run Complete Verification

After all migrations are complete, run the comprehensive verification script:

```bash
node ecomerce_backend/verify-all-critical-migrations.js
```

This will check:
- All tables exist
- All indexes are in place
- All constraints are active
- All helper functions are available
- All triggers are working

## Post-Deployment Tasks

### 1. Refresh Schema Cache

If using Supabase client libraries, refresh the schema cache:

```bash
node ecomerce_backend/refresh-schema-cache.js
```

### 2. Test Basic Operations

Run basic tests to ensure migrations work:

```bash
# Test variant creation
node ecomerce_backend/test-variant-creation.js

# Test coupon validation
node ecomerce_backend/test-coupon-validation.js

# Test delivery rating submission
node ecomerce_backend/test-delivery-rating.js
```

### 3. Update API Documentation

Update your API documentation to include new endpoints:
- Variant management endpoints
- Coupon and promotion endpoints
- Delivery rating endpoints
- Replacement request endpoints
- Enhanced refund endpoints

## Rollback Procedure

If you need to rollback the migrations:

### Option 1: Restore from Backup

1. Go to Supabase Dashboard → Database → Backups
2. Select the backup created before migration
3. Click **Restore**

### Option 2: Run Rollback Script

A rollback script is available at:
`ecomerce_backend/database/migrations/rollback-critical-features.sql`

**WARNING:** This will delete all data in the new tables!

```sql
-- Run this in Supabase SQL Editor
-- This will drop all tables created by critical features migrations
\i ecomerce_backend/database/migrations/rollback-critical-features.sql
```

## Troubleshooting

### Error: "relation already exists"

**Cause:** Migration was partially run before.

**Solution:** 
1. Check which tables exist using verification queries
2. Either drop existing tables or skip that migration
3. Continue with remaining migrations

### Error: "column already exists"

**Cause:** Column was added in a previous migration attempt.

**Solution:**
The migrations use `IF NOT EXISTS` and `DO $` blocks to handle this. The migration should continue successfully.

### Error: "function already exists"

**Cause:** Helper function was created in a previous attempt.

**Solution:**
The migrations use `CREATE OR REPLACE FUNCTION` which will update existing functions. No action needed.

### Error: "permission denied"

**Cause:** Insufficient database permissions.

**Solution:**
1. Ensure you're logged in as the database owner
2. Check RLS policies are not blocking the operation
3. Run migrations using the service role key if needed

## Verification Checklist

After deployment, verify:

- [ ] All 10 new tables created successfully
- [ ] All indexes created (check with `\di` in psql or verification script)
- [ ] All constraints active (check with verification script)
- [ ] All helper functions available (15+ functions)
- [ ] All triggers working (test with sample data)
- [ ] RLS policies enabled on all tables
- [ ] Existing tables updated with new columns
- [ ] No errors in Supabase logs
- [ ] API can connect to new tables
- [ ] Sample data can be inserted and queried

## Migration Summary

### Tables Created (10 total)

1. `product_variants` - Product variant definitions
2. `variant_inventory` - Variant inventory tracking
3. `coupons` - Coupon definitions
4. `coupon_usage` - Coupon usage history
5. `promotional_pricing` - Time-based promotions
6. `delivery_ratings` - Delivery feedback
7. `replacement_requests` - Replacement requests
8. `replacement_shipments` - Replacement tracking
9. `refund_details` - Enhanced refund tracking
10. `refund_images` - Refund evidence images

### Tables Updated (4 total)

1. `cart_items` - Added `variant_id` column
2. `orders` - Added discount, delivery, and refund columns
3. `products` - Added returnable, replacement, and refund tracking columns
4. `inventory` - Added `reserved_quantity` column (if table exists)

### Helper Functions Created (15+ total)

- Variant pricing and availability functions
- Coupon validation and discount calculation functions
- Delivery rating aggregation functions
- Replacement eligibility and analytics functions
- Refund validation and analytics functions

### Indexes Created (40+ total)

- Performance indexes for all new tables
- Composite indexes for common query patterns
- Partial indexes for filtered queries
- GIN indexes for JSONB columns

## Next Steps

After successful deployment:

1. **Implement Services** - Create service layer for each feature
2. **Implement Controllers** - Create API endpoints
3. **Write Tests** - Property-based and unit tests
4. **Update Frontend** - Integrate new features in UI
5. **Monitor Performance** - Check query performance and optimize if needed

## Support

If you encounter issues:

1. Check Supabase logs for detailed error messages
2. Review the verification script output
3. Consult the design document for expected behavior
4. Check the requirements document for feature specifications

## References

- Requirements: `.kiro/specs/critical-features-implementation/requirements.md`
- Design: `.kiro/specs/critical-features-implementation/design.md`
- Tasks: `.kiro/specs/critical-features-implementation/tasks.md`
- Migration Files: `ecomerce_backend/database/migrations/`

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Ready for Production Deployment
