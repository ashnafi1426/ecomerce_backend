-- =====================================================
-- Setup Multi-Vendor Test Data for Phase 3
-- =====================================================
-- This ensures we have products from multiple sellers
-- for testing order splitting functionality
-- =====================================================

-- First, ensure we have at least 2 sellers
DO $$
DECLARE
  seller1_id UUID;
  seller2_id UUID;
  electronics_cat_id UUID;
  fashion_cat_id UUID;
BEGIN
  -- Get or create seller 1
  SELECT id INTO seller1_id FROM users WHERE email = 'seller1@fastshop.com' AND role = 'seller';
  IF seller1_id IS NULL THEN
    INSERT INTO users (email, password_hash, role, display_name, business_name, seller_verification_status, status)
    VALUES ('seller1@fastshop.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'seller', 'TechStore Pro', 'TechStore Pro LLC', 'verified', 'active')
    RETURNING id INTO seller1_id;
  END IF;

  -- Get or create seller 2
  SELECT id INTO seller2_id FROM users WHERE email = 'seller2@fastshop.com' AND role = 'seller';
  IF seller2_id IS NULL THEN
    INSERT INTO users (email, password_hash, role, display_name, business_name, seller_verification_status, status)
    VALUES ('seller2@fastshop.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'seller', 'Fashion Hub', 'Fashion Hub Inc', 'verified', 'active')
    RETURNING id INTO seller2_id;
  END IF;

  -- Get categories
  SELECT id INTO electronics_cat_id FROM categories WHERE name = 'Electronics' LIMIT 1;
  SELECT id INTO fashion_cat_id FROM categories WHERE name = 'Fashion' LIMIT 1;

  -- Update some existing products to have seller1_id
  UPDATE products 
  SET seller_id = seller1_id
  WHERE id IN (
    SELECT id FROM products
    WHERE category_id = electronics_cat_id 
      AND status = 'active'
      AND seller_id IS NOT NULL
    LIMIT 5
  );

  -- Update some existing products to have seller2_id
  UPDATE products 
  SET seller_id = seller2_id
  WHERE id IN (
    SELECT id FROM products
    WHERE category_id = fashion_cat_id 
      AND status = 'active'
      AND seller_id IS NOT NULL
    LIMIT 5
  );

  RAISE NOTICE 'Multi-vendor test data setup complete';
  RAISE NOTICE 'Seller 1 ID: %', seller1_id;
  RAISE NOTICE 'Seller 2 ID: %', seller2_id;
END $$;

-- Verify setup
SELECT 
  u.id as seller_id,
  u.display_name,
  u.business_name,
  COUNT(p.id) as product_count
FROM users u
LEFT JOIN products p ON p.seller_id = u.id AND p.status = 'active'
WHERE u.role = 'seller'
GROUP BY u.id, u.display_name, u.business_name
ORDER BY product_count DESC;
