# Product Variants Migration - Complete Instructions

## ✅ Task 1.1 Status: COMPLETE

The product variants tables migration has been created and is ready to deploy.

## 📋 What Was Created

### Migration Files

1. **`database/migrations/create-product-variants.sql`**
   - Complete migration for new installations
   - Creates product_variants and variant_inventory tables
   - Includes all indexes, constraints, and helper functions

2. **`database/migrations/update-product-variants-schema.sql`**
   - Update migration for existing installations
   - Migrates from old schema to new design specifications
   - Safe to run multiple times (idempotent)

### Utility Scripts

3. **`verify-variant-migration.js`**
   - Verifies migration was applied correctly
   - Checks tables, columns, indexes, and constraints

4. **`run-variant-schema-update.js`**
   - Helper script with instructions for running the update

5. **`TASK-1.1-VARIANT-MIGRATION-COMPLETE.md`**
   - Detailed documentation of the migration
   - Schema diagrams and compliance checklist

## 🚀 How to Deploy

### For Existing Installations (RECOMMENDED)

Since the tables already exist with the old schema, use the update migration:

```bash
# Step 1: Review the update migration
cat database/migrations/update-product-variants-schema.sql

# Step 2: Apply via Supabase Dashboard
# - Go to Supabase Dashboard → SQL Editor
# - Copy contents of update-product-variants-schema.sql
# - Paste and click "Run"

# Step 3: Verify the migration
node verify-variant-migration.js
```

### For New Installations

If starting fresh, use the complete migration:

```bash
# Apply via Supabase Dashboard
# - Go to Supabase Dashboard → SQL Editor
# - Copy contents of create-product-variants.sql
# - Paste and click "Run"

# Verify
node verify-variant-migration.js
```

## 📊 Schema Overview

### product_variants Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| product_id | UUID | FK, NOT NULL | Reference to products table |
| sku | VARCHAR(100) | UNIQUE, NOT NULL | Stock Keeping Unit |
| variant_name | VARCHAR(255) | NOT NULL | Human-readable name |
| price | DECIMAL(10,2) | NOT NULL, >= 0 | Variant-specific price |
| compare_at_price | DECIMAL(10,2) | NULL | Original price for display |
| attributes | JSONB | NOT NULL | Variant attributes (size, color, etc.) |
| images | JSONB | DEFAULT '[]' | Array of image URLs |
| is_available | BOOLEAN | DEFAULT TRUE | Availability status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Unique Constraints:**
- `sku` - Each SKU must be unique
- `(product_id, attributes)` - Prevents duplicate attribute combinations

**Indexes:**
- `idx_product_variants_product_id` - Fast product lookups
- `idx_product_variants_sku` - Fast SKU lookups
- `idx_product_variants_is_available` - Filter available variants
- `idx_product_variants_attributes` (GIN) - Fast JSONB queries

### variant_inventory Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| variant_id | UUID | FK, UNIQUE, NOT NULL | Reference to product_variants |
| quantity | INTEGER | NOT NULL, >= 0 | Total quantity available |
| reserved_quantity | INTEGER | NOT NULL, >= 0 | Quantity in carts/pending |
| low_stock_threshold | INTEGER | DEFAULT 10, >= 0 | Alert threshold |
| last_restocked_at | TIMESTAMP | NULL | Last restock timestamp |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Check Constraints:**
- `quantity >= 0`
- `reserved_quantity >= 0`
- `reserved_quantity <= quantity`

**Indexes:**
- `idx_variant_inventory_variant_id` - Fast variant lookups
- `idx_variant_inventory_quantity` - Inventory queries

## 🔍 Verification

After running the migration, verify it with:

```bash
node verify-variant-migration.js
```

Expected output:
```
✅ All verification checks passed!

Migration Summary:
  ✓ product_variants table created
  ✓ variant_inventory table created
  ✓ All required columns present
  ✓ Indexes created for performance
  ✓ Unique constraints in place
  ✓ cart_items updated with variant_id

✨ Product Variants System is ready to use!
```

## 🧪 Testing the Migration

Test with sample data:

```sql
-- 1. Get a product ID
SELECT id, name FROM products LIMIT 1;

-- 2. Create a variant
INSERT INTO product_variants (
  product_id, 
  variant_name, 
  sku, 
  price, 
  attributes,
  images
) VALUES (
  'your-product-id-here',
  'Size: Large, Color: Blue',
  'TEST-SKU-LG-BLUE',
  29.99,
  '{"size": "L", "color": "Blue"}'::jsonb,
  '["https://example.com/image1.jpg"]'::jsonb
) RETURNING *;

-- 3. Create inventory
INSERT INTO variant_inventory (
  variant_id,
  quantity,
  low_stock_threshold
) VALUES (
  'variant-id-from-above',
  100,
  10
) RETURNING *;

-- 4. Test helper functions
SELECT get_variant_price('variant-id-here');
SELECT check_variant_availability('variant-id-here', 5);
SELECT get_variant_available_quantity('variant-id-here');

-- 5. Query variants with attributes
SELECT * FROM product_variants 
WHERE attributes @> '{"size": "L"}'::jsonb;
```

## 📝 Design Compliance Checklist

✅ **Requirements Met:**
- [x] Requirement 1.1: Variant creation with unique SKU
- [x] Requirement 1.2: At least one distinguishing attribute (NOT NULL on attributes)
- [x] Requirement 1.6: SKU generation support (via helper function)

✅ **Design Specifications:**
- [x] `price` field (not price_adjustment)
- [x] `compare_at_price` for display
- [x] `images` JSONB array
- [x] `is_available` status field
- [x] `attributes` JSONB with GIN index
- [x] `last_restocked_at` timestamp
- [x] Unique constraint on `(product_id, attributes)`
- [x] All required indexes
- [x] All check constraints
- [x] Helper functions
- [x] RLS policies
- [x] cart_items integration

## 🔄 Migration Changes Summary

### From Old Schema → New Schema

**product_variants:**
- ❌ `price_adjustment` → ✅ `price` (actual price, not adjustment)
- ❌ `is_active` → ✅ `is_available` (renamed for clarity)
- ➕ Added `compare_at_price` (for showing discounts)
- ➕ Added `images` JSONB (variant-specific images)
- ➕ Added unique constraint on `(product_id, attributes)`

**variant_inventory:**
- ➕ Added `last_restocked_at` (track restock history)

**Helper Functions:**
- 🔄 Updated `get_variant_price()` to use `price` instead of calculating from adjustment

## 🎯 Next Steps

With Task 1.1 complete, proceed to:

1. ✅ **Task 1.1** - Create product variants tables migration (COMPLETE)
2. ⏭️ **Task 2.1** - Implement Variant Manager Service
3. ⏭️ **Task 2.2** - Write property tests for Variant Manager Service
4. ⏭️ **Task 2.3** - Implement Variant Inventory Service

## 📚 Additional Resources

- Design Document: `.kiro/specs/critical-features-implementation/design.md`
- Requirements: `.kiro/specs/critical-features-implementation/requirements.md`
- Tasks: `.kiro/specs/critical-features-implementation/tasks.md`
- Complete Documentation: `TASK-1.1-VARIANT-MIGRATION-COMPLETE.md`

## ⚠️ Important Notes

1. **Idempotent**: The update migration can be run multiple times safely
2. **Data Migration**: Existing `price_adjustment` data will be migrated to `price`
3. **Backward Compatibility**: Old code using `price_adjustment` will need updates
4. **Testing**: Always test in development before applying to production
5. **Backup**: Take a database backup before running migrations

## 🆘 Troubleshooting

### Issue: "Column price does not exist"
**Solution:** Run the update migration: `update-product-variants-schema.sql`

### Issue: "Constraint already exists"
**Solution:** This is normal - the migration handles existing constraints

### Issue: "Cannot add NOT NULL column"
**Solution:** The migration handles this by adding the column first, then setting NOT NULL

### Issue: Verification fails
**Solution:** 
1. Check Supabase Dashboard → SQL Editor for errors
2. Review the migration output
3. Run: `node verify-variant-migration.js` for detailed status

## ✨ Success Criteria

Migration is successful when:
- ✅ Both tables exist
- ✅ All columns present with correct types
- ✅ All indexes created
- ✅ All constraints in place
- ✅ Helper functions work
- ✅ Verification script passes
- ✅ Sample data can be inserted and queried

---

**Status:** ✅ READY TO DEPLOY
**Last Updated:** 2024
**Task:** 1.1 Create product variants tables migration
