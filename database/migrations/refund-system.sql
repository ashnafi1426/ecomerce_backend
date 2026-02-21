-- =====================================================
-- Refund System Database Schema Migration
-- =====================================================
-- This migration creates the database schema for the refund system
-- including the refund_requests table with all required columns,
-- indexes, constraints, and triggers.
--
-- Requirements: 3.3, 3.4, 3.6, 3.7, 4.3, 4.6
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: refund_requests
-- =====================================================
-- Stores customer refund requests with approval workflow
-- and Stripe refund integration
-- =====================================================

CREATE TABLE IF NOT EXISTS refund_requests (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign keys
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request details
  reason VARCHAR(100) NOT NULL CHECK (reason IN (
    'not_as_described', 
    'quality_issue', 
    'changed_mind', 
    'found_better_price', 
    'other'
  )),
  description TEXT NOT NULL,
  photo_urls JSONB DEFAULT '[]'::jsonb, -- Optional photos (array of URLs)
  
  -- Refund calculation
  product_price DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) NOT NULL,
  refund_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Initial state when customer submits request
    'approved',     -- Manager approved the refund
    'rejected',     -- Manager rejected the refund
    'processing',   -- Stripe refund is being processed
    'completed',    -- Refund successfully completed
    'failed',       -- Stripe refund failed
    'cancelled'     -- Request was cancelled
  )),
  
  -- Approval workflow
  reviewed_by UUID REFERENCES users(id), -- Manager who reviewed the request
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Stripe refund integration
  stripe_refund_id VARCHAR(255),
  stripe_refund_status VARCHAR(50),
  refund_processed_at TIMESTAMP,
  
  -- Seller comments
  seller_comments TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_product_refund UNIQUE (order_id, product_id),
  CONSTRAINT valid_refund_amount CHECK (refund_amount > 0)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Index on order_id for quick lookup of refunds by order
CREATE INDEX IF NOT EXISTS idx_refund_requests_order 
ON refund_requests(order_id);

-- Index on customer_id for customer's refund history
CREATE INDEX IF NOT EXISTS idx_refund_requests_customer 
ON refund_requests(customer_id);

-- Index on seller_id for seller's refund requests
CREATE INDEX IF NOT EXISTS idx_refund_requests_seller 
ON refund_requests(seller_id);

-- Index on status for filtering by status
CREATE INDEX IF NOT EXISTS idx_refund_requests_status 
ON refund_requests(status);

-- Index on created_at for sorting by date (descending)
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at 
ON refund_requests(created_at DESC);

-- Index on reviewed_by for manager's review history
CREATE INDEX IF NOT EXISTS idx_refund_requests_reviewed_by 
ON refund_requests(reviewed_by);

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_refund_requests_updated_at ON refund_requests;
CREATE TRIGGER trigger_update_refund_requests_updated_at
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_refund_requests_updated_at();

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE refund_requests IS 'Stores customer refund requests with manager approval workflow and Stripe integration';
COMMENT ON COLUMN refund_requests.id IS 'Unique identifier for the refund request';
COMMENT ON COLUMN refund_requests.order_id IS 'Reference to the original order';
COMMENT ON COLUMN refund_requests.product_id IS 'Reference to the product being refunded';
COMMENT ON COLUMN refund_requests.customer_id IS 'Reference to the customer who requested the refund';
COMMENT ON COLUMN refund_requests.seller_id IS 'Reference to the seller of the product';
COMMENT ON COLUMN refund_requests.reason IS 'Reason for the refund request';
COMMENT ON COLUMN refund_requests.description IS 'Detailed description of why the refund is requested';
COMMENT ON COLUMN refund_requests.photo_urls IS 'Optional array of photo URLs as evidence';
COMMENT ON COLUMN refund_requests.product_price IS 'Original product price';
COMMENT ON COLUMN refund_requests.shipping_cost IS 'Proportional shipping cost to be refunded';
COMMENT ON COLUMN refund_requests.refund_amount IS 'Total refund amount (product_price + shipping_cost)';
COMMENT ON COLUMN refund_requests.status IS 'Current status of the refund request';
COMMENT ON COLUMN refund_requests.reviewed_by IS 'Manager who reviewed the request';
COMMENT ON COLUMN refund_requests.reviewed_at IS 'Timestamp when the request was reviewed';
COMMENT ON COLUMN refund_requests.rejection_reason IS 'Reason for rejection if status is rejected';
COMMENT ON COLUMN refund_requests.stripe_refund_id IS 'Stripe refund transaction ID';
COMMENT ON COLUMN refund_requests.stripe_refund_status IS 'Status from Stripe API';
COMMENT ON COLUMN refund_requests.refund_processed_at IS 'Timestamp when Stripe refund was processed';
COMMENT ON COLUMN refund_requests.seller_comments IS 'Comments from the seller about the refund';
COMMENT ON COLUMN refund_requests.created_at IS 'Timestamp when the request was created';
COMMENT ON COLUMN refund_requests.updated_at IS 'Timestamp when the request was last updated';

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verify the table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'refund_requests'
  ) THEN
    RAISE NOTICE 'SUCCESS: refund_requests table created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: refund_requests table was not created';
  END IF;
END $$;
