-- Add created_at column to inventory table
-- This fixes the PGRST204 error when creating products

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'inventory' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE inventory 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Added created_at column to inventory table';
  ELSE
    RAISE NOTICE 'created_at column already exists in inventory table';
  END IF;
END $$;

-- Update existing records to have created_at value
UPDATE inventory 
SET created_at = updated_at 
WHERE created_at IS NULL;

-- Add comment
COMMENT ON COLUMN inventory.created_at IS 'Timestamp when the inventory record was created';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name = 'created_at';
