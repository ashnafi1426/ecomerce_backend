-- =====================================================
-- REPLACEMENT SYSTEM DATABASE SCHEMA
-- =====================================================
-- This migration creates the replacement_requests table
-- for handling product replacement requests in FastShop
-- =====================================================

-- Create replacement_requests table
CREATE TABLE IF NOT EXISTS replacement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  sub_order_id UUID,
  product_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  
  -- Request details
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  
  -- Replacement order tracking
  replacement_order_id UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Foreign key constraints
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_order FOREIGN KEY (sub_order_id) REFERENCES sub_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_replacement_order FOREIGN KEY (replacement_order_id) REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Business rule constraints
  CONSTRAINT valid_photo_count CHECK (array_length(photo_urls, 1) IS NULL OR array_length(photo_urls, 1) <= 5),
  CONSTRAINT unique_product_replacement UNIQUE (order_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_replacement_requests_order_id ON replacement_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_customer_id ON replacement_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_seller_id ON replacement_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_status ON replacement_requests(status);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_created_at ON replacement_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_replacement_requests_product_id ON replacement_requests(product_id);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_replacement_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_replacement_requests_updated_at
  BEFORE UPDATE ON replacement_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_replacement_requests_updated_at();

-- Add comment to table
COMMENT ON TABLE replacement_requests IS 'Stores customer requests to replace defective or damaged products';
COMMENT ON COLUMN replacement_requests.reason IS 'Reason for replacement: defective, damaged, wrong_item, not_as_described, other';
COMMENT ON COLUMN replacement_requests.photo_urls IS 'Array of photo URLs (max 5 photos, max 5MB each)';
COMMENT ON COLUMN replacement_requests.status IS 'Request status: pending, approved, rejected, completed';
COMMENT ON COLUMN replacement_requests.replacement_order_id IS 'ID of the zero-cost replacement order created when approved';
COMMENT ON COLUMN replacement_requests.delivered_at IS 'Timestamp when the original order was delivered (for 30-day window validation)';
