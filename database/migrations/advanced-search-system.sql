-- ============================================================
-- ADVANCED SEARCH & FILTERING SYSTEM - DATABASE MIGRATION
-- ============================================================
-- This migration adds support for Amazon-style advanced search
-- and filtering capabilities including full-text search,
-- brands, search history, and optimized indexes.
-- ============================================================

-- ============================================================
-- STEP 1: Create Brands Table
-- ============================================================

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE brands IS 'Product brands for filtering and organization';

-- ============================================================
-- STEP 2: Add brand_id to Products Table
-- ============================================================

-- Add brand_id column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN products.brand_id IS 'Reference to the product brand';

-- ============================================================
-- STEP 3: Create Search History Table
-- ============================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  filters_applied JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for search history
CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON search_history(user_id);
CREATE INDEX IF NOT EXISTS search_history_created_at_idx ON search_history(created_at DESC);

-- Add comment
COMMENT ON TABLE search_history IS 'Tracks user search queries for analytics and suggestions';

-- ============================================================
-- STEP 4: Create Full-Text Search Index
-- ============================================================

-- Create full-text search index on products
CREATE INDEX IF NOT EXISTS products_search_idx 
ON products USING GIN (
  to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(brand, '')
  )
);

-- Add comment
COMMENT ON INDEX products_search_idx IS 'Full-text search index for product title, description, and brand';

-- ============================================================
-- STEP 5: Create Performance Indexes
-- ============================================================

-- Price range filtering
CREATE INDEX IF NOT EXISTS products_price_idx ON products(price) WHERE status = 'active' AND approval_status = 'approved';

-- Rating filtering
CREATE INDEX IF NOT EXISTS products_rating_idx ON products(average_rating) WHERE status = 'active' AND approval_status = 'approved';

-- Category filtering
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id) WHERE status = 'active' AND approval_status = 'approved';

-- Brand filtering
CREATE INDEX IF NOT EXISTS products_brand_idx ON products(brand_id) WHERE status = 'active' AND approval_status = 'approved';

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS products_active_approved_idx 
ON products(status, approval_status, created_at DESC) 
WHERE status = 'active' AND approval_status = 'approved';

-- ============================================================
-- STEP 6: Seed Sample Brands
-- ============================================================

INSERT INTO brands (name, slug, description, is_active) VALUES
  ('Apple', 'apple', 'Premium electronics and technology products', TRUE),
  ('Samsung', 'samsung', 'Electronics, smartphones, and home appliances', TRUE),
  ('Sony', 'sony', 'Electronics, gaming, and entertainment products', TRUE),
  ('Dell', 'dell', 'Computers, laptops, and IT solutions', TRUE),
  ('HP', 'hp', 'Computers, printers, and technology solutions', TRUE),
  ('Nike', 'nike', 'Sports apparel, footwear, and equipment', TRUE),
  ('Adidas', 'adidas', 'Sports and lifestyle products', TRUE),
  ('Puma', 'puma', 'Athletic and casual footwear and apparel', TRUE),
  ('Levi''s', 'levis', 'Denim and casual wear', TRUE),
  ('Zara', 'zara', 'Fashion and lifestyle clothing', TRUE),
  ('H&M', 'hm', 'Fashion and quality at the best price', TRUE),
  ('Uniqlo', 'uniqlo', 'Simple, quality clothing', TRUE),
  ('Generic', 'generic', 'Generic or unbranded products', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STEP 7: Update Existing Products with Random Brands
-- ============================================================

-- Update products without brands to have random brands
UPDATE products 
SET brand_id = (
  SELECT id FROM brands 
  WHERE is_active = TRUE 
  ORDER BY RANDOM() 
  LIMIT 1
)
WHERE brand_id IS NULL 
AND status = 'active';

-- ============================================================
-- STEP 8: Create Search Function for Better Performance
-- ============================================================

-- Function to perform full-text search with ranking
CREATE OR REPLACE FUNCTION search_products(
  search_term TEXT,
  category_filter UUID DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  min_rating NUMERIC DEFAULT NULL,
  brand_filters UUID[] DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  page_limit INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  price NUMERIC,
  image_url TEXT,
  category_id UUID,
  brand_id UUID,
  average_rating NUMERIC,
  total_reviews INTEGER,
  status VARCHAR,
  approval_status VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.price,
    p.image_url,
    p.category_id,
    p.brand_id,
    p.average_rating,
    p.total_reviews,
    p.status,
    p.approval_status,
    p.created_at,
    CASE 
      WHEN search_term IS NOT NULL AND search_term != '' THEN
        ts_rank(
          to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.brand, '')),
          plainto_tsquery('english', search_term)
        )
      ELSE 0
    END AS search_rank
  FROM products p
  WHERE 
    p.status = 'active'
    AND p.approval_status = 'approved'
    AND (
      search_term IS NULL 
      OR search_term = '' 
      OR to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.brand, '')) 
         @@ plainto_tsquery('english', search_term)
    )
    AND (category_filter IS NULL OR p.category_id = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_rating IS NULL OR p.average_rating >= min_rating)
    AND (brand_filters IS NULL OR p.brand_id = ANY(brand_filters))
  ORDER BY
    CASE 
      WHEN sort_by = 'relevance' THEN search_rank
      WHEN sort_by = 'price-low' THEN -p.price
      WHEN sort_by = 'price-high' THEN p.price
      WHEN sort_by = 'rating' THEN -p.average_rating
      WHEN sort_by = 'newest' THEN EXTRACT(EPOCH FROM p.created_at)
      ELSE search_rank
    END DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION search_products IS 'Advanced product search with filtering and sorting';

-- ============================================================
-- STEP 9: Create Trigger to Update search_history
-- ============================================================

-- Function to clean old search history (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM search_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM search_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS cleanup_search_history_trigger ON search_history;
CREATE TRIGGER cleanup_search_history_trigger
AFTER INSERT ON search_history
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_search_history();

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify brands table
SELECT COUNT(*) as brand_count FROM brands;

-- Verify products with brands
SELECT COUNT(*) as products_with_brands FROM products WHERE brand_id IS NOT NULL;

-- Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('products', 'brands', 'search_history')
ORDER BY tablename, indexname;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================

SELECT 'Advanced Search System Migration Complete!' as status;
