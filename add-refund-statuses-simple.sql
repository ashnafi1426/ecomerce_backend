-- Add refund statuses to orders table
-- Run this in Supabase SQL Editor

-- Drop existing constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with refund statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded',
  'completed',
  'failed'
));
