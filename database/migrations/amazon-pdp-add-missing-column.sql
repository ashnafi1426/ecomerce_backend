-- ============================================
-- Amazon PDP - Add Missing Column Fix
-- Run this BEFORE Step 2
-- ============================================

-- Add the missing is_active column to product_badges
ALTER TABLE product_badges 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Verify the column was added
SELECT 'Missing column added successfully!' as status;
