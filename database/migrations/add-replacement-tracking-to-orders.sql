/**
 * Migration: Add Replacement Tracking to Orders Table
 * 
 * Adds columns to track replacement orders and link original orders to their replacements
 * 
 * Spec: customer-order-management-enhancements
 * Requirements: 2.7 (bidirectional linking between original and replacement orders)
 */

-- Add has_replacement flag to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'has_replacement'
    ) THEN
        ALTER TABLE orders ADD COLUMN has_replacement BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column: orders.has_replacement';
    ELSE
        RAISE NOTICE 'Column already exists: orders.has_replacement';
    END IF;
END $$;

-- Add replacement_order_id to track the replacement order created for this order
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'replacement_order_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN replacement_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added column: orders.replacement_order_id';
    ELSE
        RAISE NOTICE 'Column already exists: orders.replacement_order_id';
    END IF;
END $$;

-- Add is_replacement_order flag to identify replacement orders
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'is_replacement_order'
    ) THEN
        ALTER TABLE orders ADD COLUMN is_replacement_order BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added column: orders.is_replacement_order';
    ELSE
        RAISE NOTICE 'Column already exists: orders.is_replacement_order';
    END IF;
END $$;

-- Add original_order_id to link replacement orders back to their original orders
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'original_order_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN original_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added column: orders.original_order_id';
    ELSE
        RAISE NOTICE 'Column already exists: orders.original_order_id';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_has_replacement ON orders(has_replacement);
CREATE INDEX IF NOT EXISTS idx_orders_replacement_order_id ON orders(replacement_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_replacement_order ON orders(is_replacement_order);
CREATE INDEX IF NOT EXISTS idx_orders_original_order_id ON orders(original_order_id);

-- Add comments
COMMENT ON COLUMN orders.has_replacement IS 'Flag indicating if this order has an associated replacement order';
COMMENT ON COLUMN orders.replacement_order_id IS 'ID of the replacement order created for this order';
COMMENT ON COLUMN orders.is_replacement_order IS 'Flag indicating if this is a replacement order (zero cost)';
COMMENT ON COLUMN orders.original_order_id IS 'ID of the original order that this replacement order is for';
