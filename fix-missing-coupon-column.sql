-- Add missing coupon_id column to orders table if it doesn't exist
DO $$
BEGIN
    -- Add coupon_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'coupon_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN coupon_id UUID REFERENCES coupons(id);
        RAISE NOTICE 'Added coupon_id column to orders table';
    ELSE
        RAISE NOTICE 'coupon_id column already exists in orders table';
    END IF;
END $$;

-- Create index for coupon_id
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
