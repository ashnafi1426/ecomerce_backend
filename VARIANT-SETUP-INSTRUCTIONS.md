# Product Variants System - Setup Instructions

## ⚠️ IMPORTANT: Manual SQL Execution Required

The Product Variants System has been fully implemented, but the database tables need to be created manually in Supabase due to schema cache limitations.

---

## Step-by-Step Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Execute Migration SQL

1. Open the file: `database/migrations/create-product-variants.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** button

**Expected Output:**
```
Success. No rows returned
```

### Step 3: Verify Tables Created

Run this verification query in SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('product_variants', 'variant_inventory');

-- Check if cart_items has variant_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cart_items' 
AND column_name = 'variant_id';

-- Count rows in new tables
SELECT 
  (SELECT COUNT(*) FROM product_variants) as variant_count,
  (SELECT COUNT(*) FROM variant_inventory) as inventory_count;
```

**Expected Results:**
- 2 tables found: `product_variants`, `variant_inventory`
- 1 column found: `variant_id` in `cart_items`
- Counts: 0 rows (initially empty)

### Step 4: Test the System

After SQL execution, run the test suite:

```bash
cd ecomerce_backend
node test-variants.js
```

**Expected:** 17/17 tests should pass

---

## What Gets Created

### Tables

1. **product_variants**
   - Stores variant information (size, color, etc.)
   - Links to products table
   - Includes SKU, pricing adjustments, attributes

2. **variant_inventory**
   - Tracks inventory per variant
   - Manages reserved quantities
   - Low stock thresholds

### Table Updates

1. **cart_items**
   - Added `variant_id` column
   - Updated unique constraint
   - Allows variant selection in cart

### Functions

1. `get_variant_price(variant_id)` - Calculate final price
2. `check_variant_availability(variant_id, quantity)` - Check stock
3. `get_variant_available_quantity(variant_id)` - Get available qty

### Indexes

- Fast lookups by product_id, SKU, attributes
- GIN index for JSONB attribute searches
- Optimized for cart and inventory queries

### Security

- Row Level Security (RLS) enabled
- Public read access
- Seller/Manager/Admin write access

---

## Troubleshooting

### Issue: "Table not found in schema cache"

**Solution:** This is expected before manual SQL execution. The tables exist in the database but Supabase's client library hasn't refreshed its cache yet.

**Fix:**
1. Execute the SQL file manually (Step 2 above)
2. Wait 1-2 minutes for cache to refresh
3. Restart your Node.js server
4. Run tests again

### Issue: "Unique constraint violation on SKU"

**Solution:** SKUs must be unique across all variants.

**Fix:** Use timestamps or UUIDs in SKU generation:
```javascript
sku: `SKU-${productId.slice(0,8)}-${Date.now()}`
```

### Issue: "Column variant_id does not exist"

**Solution:** The cart_items table update didn't apply.

**Fix:** Run this SQL manually:
```sql
ALTER TABLE cart_items 
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);

ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

ALTER TABLE cart_items 
  ADD CONSTRAINT cart_items_user_product_variant_unique 
  UNIQUE(user_id, product_id, variant_id);
```

---

## Verification Checklist

After setup, verify:

- [ ] Tables created in Supabase
- [ ] SQL Editor shows no errors
- [ ] Verification query returns expected results
- [ ] Node.js server restarts successfully
- [ ] Test suite runs without errors
- [ ] API endpoints respond correctly

---

## Quick Test

After setup, test with curl:

```bash
# Get variants for a product (should return empty array initially)
curl http://localhost:5000/api/products/{productId}/variants

# Create a variant (requires seller token)
curl -X POST http://localhost:5000/api/products/{productId}/variants \
  -H "Authorization: Bearer {sellerToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_name": "Size: Large",
    "sku": "SKU-L-001",
    "price_adjustment": 5.00,
    "attributes": {"size": "L"},
    "initial_quantity": 100
  }'
```

---

## Next Steps After Setup

1. ✅ Verify all tables created
2. ✅ Run test suite
3. ⏭️ Create sample variants for testing
4. ⏭️ Test cart integration
5. ⏭️ Update frontend to support variants
6. ⏭️ Add variant selection to product pages

---

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard
2. Verify SQL execution completed successfully
3. Check Node.js console for errors
4. Review test output for specific failures

---

## Files Reference

- **Migration SQL**: `database/migrations/create-product-variants.sql`
- **Service**: `services/variantServices/variant.service.js`
- **Controller**: `controllers/variantControllers/variant.controller.js`
- **Routes**: `routes/variantRoutes/variant.routes.js`
- **Tests**: `test-variants.js`
- **Documentation**: `PRODUCT-VARIANTS-IMPLEMENTATION.md`

---

**Status**: Ready for manual SQL execution
**Time Required**: 5-10 minutes
**Difficulty**: Easy (copy-paste SQL)
