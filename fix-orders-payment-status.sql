-- Fix Orders Payment Status for Analytics
-- This script updates existing orders to have payment_status = 'paid'
-- so they will show up in the Admin Analytics page

-- 1. Check current payment_status distribution
SELECT 
  payment_status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM orders
GROUP BY payment_status;

-- 2. Update all orders that don't have payment_status set to 'paid'
-- (You can modify the WHERE clause based on your business logic)
UPDATE orders
SET payment_status = 'paid'
WHERE payment_status IS NULL 
   OR payment_status = ''
   OR payment_status = 'pending';

-- 3. Verify the update
SELECT 
  payment_status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM orders
GROUP BY payment_status;

-- 4. Show sample of updated orders
SELECT 
  id,
  amount,
  status,
  payment_status,
  created_at
FROM orders
WHERE payment_status = 'paid'
LIMIT 10;
