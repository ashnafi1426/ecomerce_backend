-- Seed Categories for FastShop
-- Run this in Supabase SQL Editor

-- First, ensure slug column exists
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Insert categories with valid UUIDs (skip if already exists)
INSERT INTO categories (id, name, slug, description) VALUES
('b9d6556f-e14e-4756-baba-4142152bf791', 'Electronics', 'electronics', 'Electronic devices and gadgets'),
('c8e7667a-f25f-5867-caca-5253263ca892', 'Fashion', 'fashion', 'Clothing and accessories'),
('d9f8778b-a36a-6978-dada-6364374db903', 'Books', 'books', 'Books and publications'),
('e0a9889c-b47b-7089-eaea-7475485ec014', 'Home & Garden', 'home-garden', 'Home and garden items'),
('f1b0990d-c58c-8190-fbfb-8586596fd125', 'Sports', 'sports', 'Sports and outdoor equipment'),
('a2c1001e-d69d-9201-acac-9697607ae236', 'Toys', 'toys', 'Toys and games'),
('b3d2112f-e70e-0312-bdbd-0708718bf347', 'Beauty', 'beauty', 'Beauty and personal care'),
('c4e3223a-f81f-1423-cece-1819829ca458', 'Automotive', 'automotive', 'Automotive parts and accessories')
ON CONFLICT (id) DO NOTHING;

-- Update existing products with categories based on their titles
UPDATE products 
SET category_id = 'b9d6556f-e14e-4756-baba-4142152bf791'
WHERE (title ILIKE '%computer%' OR title ILIKE '%phone%' OR title ILIKE '%laptop%' OR title ILIKE '%electronic%' OR title ILIKE '%earphone%')
AND category_id IS NULL;

UPDATE products 
SET category_id = 'c8e7667g-f25f-5867-caca-5253263cg892'
WHERE (title ILIKE '%shoe%' OR title ILIKE '%cloth%' OR title ILIKE '%fashion%' OR title ILIKE '%coat%')
AND category_id IS NULL;

UPDATE products 
SET category_id = 'd9f8778h-g36g-6978-dada-6364374dh903'
WHERE title ILIKE '%book%'
AND category_id IS NULL;

UPDATE products 
SET category_id = 'c4e3223a-f81f-1423-cece-1819829ca458'
WHERE (title ILIKE '%car%' OR title ILIKE '%garage%' OR title ILIKE '%auto%')
AND category_id IS NULL;

UPDATE products 
SET category_id = 'f1b0990d-c58c-8190-fbfb-8586596fd125'
WHERE title ILIKE '%sport%'
AND category_id IS NULL;

-- Verify categories
SELECT id, name, slug, description FROM categories ORDER BY name;

-- Verify products have categories
SELECT 
  c.name as category,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
