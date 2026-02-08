# Quick Migration Guide - Critical Features

## TL;DR - Fast Deployment

**Time Required:** ~10 minutes

### Step 1: Backup (2 minutes)
1. Go to https://app.supabase.com → Your Project → Database → Backups
2. Click "Create Backup"
3. Wait for completion

### Step 2: Run Migrations (5 minutes)
Open Supabase SQL Editor and run these files **in order**:

1. **Product Variants** → `create-product-variants.sql`
2. **Discounts** → `create-discount-promotion-tables-v2.sql`
3. **Delivery Ratings** → `create-delivery-rating-tables.sql`
4. **Replacements** → `create-replacement-process-tables.sql`
5. **Refunds** → `create-enhanced-refund-tables.sql`

### Step 3: Verify (3 minutes)
```bash
node verify-all-critical-migrations.js
```

✅ **Done!** If verification passes, migrations are complete.

---

## Migration Files Location

All migration files are in:
```
ecomerce_backend/database/migrations/
```

## What Gets Created

### New Tables (10 total)
1. `product_variants` - Product options (size, color, etc.)
2. `variant_inventory` - Inventory per variant
3. `coupons` - Discount codes
4. `coupon_usage` - Coupon usage tracking
5. `promotional_pricing` - Time-based promotions
6. `delivery_ratings` - Delivery feedback
7. `replacement_requests` - Product replacements
8. `replacement_shipments` - Replacement tracking
9. `refund_details` - Enhanced refunds
10. `refund_images` - Refund evidence

### Updated Tables (4 total)
- `cart_items` - Added `variant_id`
- `orders` - Added discount, delivery, refund columns
- `products` - Added returnable, replacement, refund tracking
- `inventory` - Added `reserved_quantity` (if exists)

### Helper Functions (15+ total)
- Variant pricing and availability
- Coupon validation and discounts
- Delivery rating aggregation
- Replacement eligibility and analytics
- Refund validation and analytics

## Quick Verification Queries

### Check All Tables Exist
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'product_variants', 'variant_inventory', 
  'coupons', 'coupon_usage', 'promotional_pricing',
  'delivery_ratings', 
  'replacement_requests', 'replacement_shipments',
  'refund_details', 'refund_images'
);
-- Should return: 10
```

### Check Helper Functions
```sql
SELECT COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
  routine_name LIKE '%variant%' OR
  routine_name LIKE '%coupon%' OR
  routine_name LIKE '%delivery%' OR
  routine_name LIKE '%replacement%' OR
  routine_name LIKE '%refund%'
);
-- Should return: 15+
```

### Test Basic Access
```sql
-- Should all return without errors
SELECT COUNT(*) FROM product_variants;
SELECT COUNT(*) FROM coupons;
SELECT COUNT(*) FROM delivery_ratings;
SELECT COUNT(*) FROM replacement_requests;
SELECT COUNT(*) FROM refund_details;
```

## Common Issues & Solutions

### Issue: "relation already exists"
**Solution:** Migration was partially run. Safe to continue - migrations use `IF NOT EXISTS`.

### Issue: "column already exists"
**Solution:** Column was added before. Safe to continue - migrations check for existing columns.

### Issue: "permission denied"
**Solution:** Ensure you're using the service role key or database owner account.

### Issue: Verification script fails
**Solution:** 
1. Check Supabase logs for errors
2. Re-run failed migration
3. Run verification again

## Rollback

If something goes wrong:

### Quick Rollback
```sql
-- WARNING: This deletes all new tables and data!
DROP TABLE IF EXISTS refund_images CASCADE;
DROP TABLE IF EXISTS refund_details CASCADE;
DROP TABLE IF EXISTS replacement_shipments CASCADE;
DROP TABLE IF EXISTS replacement_requests CASCADE;
DROP TABLE IF EXISTS delivery_ratings CASCADE;
DROP TABLE IF EXISTS promotional_pricing CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS variant_inventory CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
```

### Or Restore from Backup
1. Supabase Dashboard → Database → Backups
2. Select pre-migration backup
3. Click Restore

## Next Steps After Migration

1. **Refresh Schema Cache**
   ```bash
   node refresh-schema-cache.js
   ```

2. **Test Basic Operations**
   ```bash
   node test-variant-creation.js
   node test-coupon-validation.js
   ```

3. **Implement Services**
   - Start with Task 2.1: Variant Manager Service
   - Follow tasks in order from tasks.md

4. **Update API Documentation**
   - Document new endpoints
   - Update Postman collection

## Support

- **Full Guide:** `MIGRATION-DEPLOYMENT-GUIDE.md`
- **Checklist:** `DEPLOYMENT-CHECKLIST.md`
- **Requirements:** `.kiro/specs/critical-features-implementation/requirements.md`
- **Design:** `.kiro/specs/critical-features-implementation/design.md`

## Migration Summary

| Feature | Tables | Functions | Time |
|---------|--------|-----------|------|
| Product Variants | 2 | 3 | ~1 min |
| Discounts | 3 | 3 | ~1 min |
| Delivery Ratings | 1 | 4 | ~1 min |
| Replacements | 2 | 5 | ~1 min |
| Refunds | 2 | 8 | ~1 min |
| **Total** | **10** | **23** | **~5 min** |

---

**Ready to deploy?** Follow the 3 steps at the top! 🚀
