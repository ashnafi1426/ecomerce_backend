# Critical Features Migration - Deployment Checklist

## Pre-Deployment

- [ ] **Backup Database**
  - Go to Supabase Dashboard → Database → Backups
  - Create a new backup
  - Wait for backup completion
  - Note backup ID for potential rollback

- [ ] **Review Migration Files**
  - [ ] `create-product-variants.sql` (Migration 1)
  - [ ] `create-discount-promotion-tables-v2.sql` (Migration 2)
  - [ ] `create-delivery-rating-tables.sql` (Migration 3)
  - [ ] `create-replacement-process-tables.sql` (Migration 4)
  - [ ] `create-enhanced-refund-tables.sql` (Migration 5)

- [ ] **Verify Environment**
  - [ ] Supabase URL configured in `.env`
  - [ ] Service role key configured in `.env`
  - [ ] Node.js dependencies installed (`npm install`)
  - [ ] Access to Supabase SQL Editor

## Deployment (Run in Order)

### Migration 1: Product Variants System
- [ ] Open `create-product-variants.sql` in Supabase SQL Editor
- [ ] Run migration
- [ ] Verify completion message appears
- [ ] Check tables created: `product_variants`, `variant_inventory`
- [ ] Verify `cart_items` table updated with `variant_id` column

### Migration 2: Discount & Promotion System
- [ ] Open `create-discount-promotion-tables-v2.sql` in Supabase SQL Editor
- [ ] Run migration
- [ ] Verify completion message appears
- [ ] Check tables created: `coupons`, `coupon_usage`, `promotional_pricing`
- [ ] Verify `orders` table updated with discount columns

### Migration 3: Delivery Rating System
- [ ] Open `create-delivery-rating-tables.sql` in Supabase SQL Editor
- [ ] Run migration
- [ ] Verify completion message appears
- [ ] Check table created: `delivery_ratings`
- [ ] Verify `orders` table updated with delivery columns

### Migration 4: Replacement Process System
- [ ] Open `create-replacement-process-tables.sql` in Supabase SQL Editor
- [ ] Run migration
- [ ] Verify completion message appears
- [ ] Check tables created: `replacement_requests`, `replacement_shipments`
- [ ] Verify `products` table updated with replacement columns

### Migration 5: Enhanced Refund System
- [ ] Open `create-enhanced-refund-tables.sql` in Supabase SQL Editor
- [ ] Run migration
- [ ] Verify completion message appears
- [ ] Check tables created: `refund_details`, `refund_images`
- [ ] Verify `orders` and `products` tables updated with refund columns

## Post-Deployment Verification

### Automated Verification
- [ ] Run verification script: `node verify-all-critical-migrations.js`
- [ ] Review verification output
- [ ] All critical checks pass (tables and basic operations)
- [ ] Note any warnings for manual verification

### Manual Verification (in Supabase SQL Editor)

#### Check All Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'product_variants', 'variant_inventory', 
  'coupons', 'coupon_usage', 'promotional_pricing',
  'delivery_ratings', 
  'replacement_requests', 'replacement_shipments',
  'refund_details', 'refund_images'
)
ORDER BY table_name;
```
- [ ] All 10 tables listed

#### Check Indexes
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
  'product_variants', 'variant_inventory', 
  'coupons', 'coupon_usage', 'promotional_pricing',
  'delivery_ratings', 
  'replacement_requests', 'replacement_shipments',
  'refund_details', 'refund_images'
)
ORDER BY tablename, indexname;
```
- [ ] 40+ indexes listed

#### Check Constraints
```sql
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
AND tc.table_name IN (
  'product_variants', 'variant_inventory', 
  'coupons', 'coupon_usage', 'promotional_pricing',
  'delivery_ratings', 
  'replacement_requests', 'replacement_shipments',
  'refund_details', 'refund_images'
)
ORDER BY tc.table_name, tc.constraint_type;
```
- [ ] CHECK constraints present
- [ ] UNIQUE constraints present
- [ ] FOREIGN KEY constraints present

#### Check Helper Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%variant%'
   OR routine_name LIKE '%coupon%'
   OR routine_name LIKE '%delivery%'
   OR routine_name LIKE '%replacement%'
   OR routine_name LIKE '%refund%'
ORDER BY routine_name;
```
- [ ] 15+ helper functions listed

#### Check RLS Policies
```sql
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'product_variants', 'variant_inventory', 
  'coupons', 'coupon_usage', 'promotional_pricing',
  'delivery_ratings', 
  'replacement_requests', 'replacement_shipments',
  'refund_details', 'refund_images'
)
ORDER BY tablename, policyname;
```
- [ ] RLS policies exist for all tables
- [ ] Service role has full access

#### Check Triggers
```sql
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN (
  'product_variants', 'variant_inventory', 
  'coupons', 'coupon_usage', 'promotional_pricing',
  'delivery_ratings', 
  'replacement_requests', 'replacement_shipments',
  'refund_details', 'refund_images'
)
ORDER BY event_object_table, trigger_name;
```
- [ ] Update timestamp triggers present
- [ ] Business logic triggers present

### Test Basic Operations

#### Test Variant Creation
```sql
-- Insert a test variant (replace product_id with actual ID)
INSERT INTO product_variants (
  product_id, 
  variant_name, 
  sku, 
  price, 
  attributes
) VALUES (
  (SELECT id FROM products LIMIT 1),
  'Test Variant - Size: Large',
  'TEST-SKU-001',
  29.99,
  '{"size": "L", "color": "Blue"}'::jsonb
) RETURNING *;
```
- [ ] Variant created successfully
- [ ] Delete test variant after verification

#### Test Coupon Creation
```sql
-- Insert a test coupon
INSERT INTO coupons (
  code,
  discount_type,
  discount_value,
  start_date,
  end_date
) VALUES (
  'TEST10',
  'percentage',
  10.00,
  NOW(),
  NOW() + INTERVAL '30 days'
) RETURNING *;
```
- [ ] Coupon created successfully
- [ ] Delete test coupon after verification

#### Test Delivery Rating
```sql
-- Insert a test delivery rating (replace IDs with actual values)
INSERT INTO delivery_ratings (
  order_id,
  customer_id,
  seller_id,
  overall_rating,
  packaging_quality_rating,
  delivery_speed_rating
) VALUES (
  (SELECT id FROM orders WHERE status = 'delivered' LIMIT 1),
  (SELECT customer_id FROM orders WHERE status = 'delivered' LIMIT 1),
  (SELECT seller_id FROM sub_orders LIMIT 1),
  5,
  5,
  5
) RETURNING *;
```
- [ ] Rating created successfully
- [ ] Delete test rating after verification

## Post-Deployment Tasks

### Schema Cache Refresh
- [ ] Run: `node refresh-schema-cache.js`
- [ ] Verify no errors

### Update API Documentation
- [ ] Document new variant endpoints
- [ ] Document new coupon/promotion endpoints
- [ ] Document new delivery rating endpoints
- [ ] Document new replacement endpoints
- [ ] Document new refund endpoints

### Update Postman Collection
- [ ] Add variant management requests
- [ ] Add coupon validation requests
- [ ] Add delivery rating requests
- [ ] Add replacement workflow requests
- [ ] Add refund processing requests

### Team Communication
- [ ] Notify backend team of new tables
- [ ] Notify frontend team of new API endpoints
- [ ] Share API documentation updates
- [ ] Schedule integration testing session

## Rollback Plan (If Needed)

### Option 1: Restore from Backup
- [ ] Go to Supabase Dashboard → Database → Backups
- [ ] Select pre-migration backup
- [ ] Click Restore
- [ ] Wait for restoration completion
- [ ] Verify database state

### Option 2: Run Rollback Script
- [ ] Open `rollback-critical-features.sql` in SQL Editor
- [ ] Review script (WARNING: Deletes all new tables!)
- [ ] Run script
- [ ] Verify tables removed

## Success Criteria

All items below must be checked for successful deployment:

- [ ] All 5 migrations completed without errors
- [ ] All 10 new tables exist and accessible
- [ ] All indexes created (40+)
- [ ] All constraints active
- [ ] All helper functions available (15+)
- [ ] All triggers working
- [ ] RLS policies enabled
- [ ] Verification script passes
- [ ] Test operations successful
- [ ] Schema cache refreshed
- [ ] No errors in Supabase logs
- [ ] Team notified

## Notes

**Date Deployed:** _______________

**Deployed By:** _______________

**Backup ID:** _______________

**Issues Encountered:**
- 
- 
- 

**Resolution:**
- 
- 
- 

**Additional Notes:**
- 
- 
- 

---

**Status:** [ ] Not Started  [ ] In Progress  [ ] Completed  [ ] Rolled Back

**Sign-off:** _______________  Date: _______________
