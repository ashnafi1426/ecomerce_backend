-- ============================================
-- PHASE 4: ORDER TRACKING SYSTEM
-- Database schema for order tracking functionality
-- Requirements: 7.2, 7.3, 7.4, 8.1, 14.1
-- ============================================

-- Step 1: Create order_status_history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create indexes for order_status_history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status_history_new_status ON order_status_history(new_status);

-- Step 2: Add tracking columns to orders table if they don't exist
DO $$
BEGIN
  -- Add tracking_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(255);
    RAISE NOTICE '✅ Added tracking_number column to orders';
  END IF;

  -- Add carrier column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'carrier'
  ) THEN
    ALTER TABLE orders ADD COLUMN carrier VARCHAR(100);
    RAISE NOTICE '✅ Added carrier column to orders';
  END IF;

  -- Add estimated_delivery_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'estimated_delivery_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN estimated_delivery_date TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Added estimated_delivery_date column to orders';
  END IF;

  -- Add shipped_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipped_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Added shipped_at column to orders';
  END IF;

  -- Add delivered_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Added delivered_at column to orders';
  END IF;
END $$;

-- Step 3: Create trigger to automatically log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.updated_by, -- Assuming there's an updated_by column, otherwise NULL
      'Status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Step 4: Create indexes on orders table for tracking queries
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_carrier ON orders(carrier) WHERE carrier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery ON orders(estimated_delivery_date) WHERE estimated_delivery_date IS NOT NULL;

-- Step 5: Verify the migration
DO $$
DECLARE
  history_count INTEGER;
  orders_with_tracking INTEGER;
BEGIN
  -- Check order_status_history table
  SELECT COUNT(*) INTO history_count FROM order_status_history;
  RAISE NOTICE '✅ order_status_history table created (% records)', history_count;
  
  -- Check orders with tracking
  SELECT COUNT(*) INTO orders_with_tracking 
  FROM orders 
  WHERE tracking_number IS NOT NULL;
  
  RAISE NOTICE '✅ Orders table updated (% orders with tracking)', orders_with_tracking;
  RAISE NOTICE '✅ Phase 4 Order Tracking migration complete!';
END $$;
