-- =====================================================
-- Discount System Database Schema
-- =====================================================
-- This migration creates the complete discount system schema including:
-- 1. discount_rules table - stores promotional discount configurations
-- 2. applied_discounts table - audit trail of discounts applied to orders
-- 3. discount_usage_tracking table - analytics and usage tracking
-- 4. Indexes for performance optimization
-- 5. Triggers for automatic timestamp updates
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table 1: discount_rules
-- Stores discount rule configurations created by admins
-- =====================================================
CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Rule identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Discount type and value
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN (
    'percentage', 'fixed_amount', 'buy_x_get_y'
  )),
  discount_value DECIMAL(10, 2) NOT NULL,
  
  -- For percentage discounts (5-90%)
  percentage_value DECIMAL(5, 2) CHECK (
    discount_type != 'percentage' OR 
    (percentage_value >= 5 AND percentage_value <= 90)
  ),
  
  -- For buy-X-get-Y discounts
  buy_quantity INTEGER,
  get_quantity INTEGER,
  
  -- Applicability
  applicable_to VARCHAR(50) NOT NULL CHECK (applicable_to IN (
    'all_products', 'specific_categories', 'specific_products'
  )),
  category_ids JSONB DEFAULT '[]'::jsonb, -- Array of category UUIDs
  product_ids JSONB DEFAULT '[]'::jsonb, -- Array of product UUIDs
  
  -- Schedule
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'active', 'expired', 'disabled'
  )),
  
  -- Stacking rules
  allow_stacking BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0, -- Higher priority applied first
  
  -- Usage limits
  max_uses_per_customer INTEGER,
  max_total_uses INTEGER,
  current_total_uses INTEGER DEFAULT 0,
  
  -- Minimum purchase requirements
  min_purchase_amount DECIMAL(10, 2),
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (start_date < end_date),
  CONSTRAINT valid_buy_x_get_y CHECK (
    discount_type != 'buy_x_get_y' OR 
    (buy_quantity > 0 AND get_quantity > 0)
  )
);

-- Indexes for discount_rules
CREATE INDEX IF NOT EXISTS idx_discount_rules_status ON discount_rules(status);
CREATE INDEX IF NOT EXISTS idx_discount_rules_dates ON discount_rules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_discount_rules_applicable_to ON discount_rules(applicable_to);
CREATE INDEX IF NOT EXISTS idx_discount_rules_priority ON discount_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_discount_rules_created_by ON discount_rules(created_by);

-- Comments for discount_rules
COMMENT ON TABLE discount_rules IS 'Stores promotional discount rule configurations';
COMMENT ON COLUMN discount_rules.discount_type IS 'Type of discount: percentage, fixed_amount, or buy_x_get_y';
COMMENT ON COLUMN discount_rules.percentage_value IS 'Percentage value for percentage discounts (5-90%)';
COMMENT ON COLUMN discount_rules.applicable_to IS 'Scope of discount application';
COMMENT ON COLUMN discount_rules.allow_stacking IS 'Whether this discount can be combined with others';
COMMENT ON COLUMN discount_rules.priority IS 'Higher priority discounts are applied first when stacking';


-- =====================================================
-- Table 2: applied_discounts
-- Audit trail of discounts applied to orders
-- =====================================================
CREATE TABLE IF NOT EXISTS applied_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_rule_id UUID NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
  
  -- Discount details at time of application
  discount_type VARCHAR(50) NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NOT NULL,
  discounted_price DECIMAL(10, 2) NOT NULL,
  savings_amount DECIMAL(10, 2) NOT NULL,
  
  -- Metadata
  applied_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_discount_calculation CHECK (
    discounted_price = original_price - savings_amount AND
    discounted_price >= 0
  )
);

-- Indexes for applied_discounts
CREATE INDEX IF NOT EXISTS idx_applied_discounts_order ON applied_discounts(order_id);
CREATE INDEX IF NOT EXISTS idx_applied_discounts_product ON applied_discounts(product_id);
CREATE INDEX IF NOT EXISTS idx_applied_discounts_rule ON applied_discounts(discount_rule_id);
CREATE INDEX IF NOT EXISTS idx_applied_discounts_applied_at ON applied_discounts(applied_at DESC);

-- Comments for applied_discounts
COMMENT ON TABLE applied_discounts IS 'Audit trail of discounts applied to orders';
COMMENT ON COLUMN applied_discounts.discount_type IS 'Snapshot of discount type at time of application';
COMMENT ON COLUMN applied_discounts.savings_amount IS 'Amount saved by customer';


-- =====================================================
-- Table 3: discount_usage_tracking
-- Tracks discount usage for analytics and limits
-- =====================================================
CREATE TABLE IF NOT EXISTS discount_usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_rule_id UUID NOT NULL REFERENCES discount_rules(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Usage details
  usage_count INTEGER DEFAULT 1,
  total_savings DECIMAL(10, 2) NOT NULL,
  
  -- Timestamp
  used_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_customer_order_discount UNIQUE (discount_rule_id, customer_id, order_id)
);

-- Indexes for discount_usage_tracking
CREATE INDEX IF NOT EXISTS idx_discount_usage_rule ON discount_usage_tracking(discount_rule_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_customer ON discount_usage_tracking(customer_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_order ON discount_usage_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_used_at ON discount_usage_tracking(used_at DESC);

-- Comments for discount_usage_tracking
COMMENT ON TABLE discount_usage_tracking IS 'Tracks discount usage for analytics and per-customer limits';
COMMENT ON COLUMN discount_usage_tracking.usage_count IS 'Number of times customer used this discount';
COMMENT ON COLUMN discount_usage_tracking.total_savings IS 'Total amount saved by customer with this discount';


-- =====================================================
-- Trigger: Update discount_rules.updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_discount_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discount_rules_updated_at ON discount_rules;
CREATE TRIGGER trigger_update_discount_rules_updated_at
  BEFORE UPDATE ON discount_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_rules_updated_at();


-- =====================================================
-- Function: Automatically update discount status based on dates
-- =====================================================
CREATE OR REPLACE FUNCTION update_discount_status()
RETURNS void AS $$
BEGIN
  -- Mark as active if start_date has passed and end_date hasn't
  UPDATE discount_rules
  SET status = 'active'
  WHERE status = 'scheduled'
    AND start_date <= NOW()
    AND end_date > NOW();
  
  -- Mark as expired if end_date has passed
  UPDATE discount_rules
  SET status = 'expired'
  WHERE status IN ('scheduled', 'active')
    AND end_date <= NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_discount_status() IS 'Updates discount rule status based on current date/time';


-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Discount system schema created successfully';
  RAISE NOTICE '   - discount_rules table created';
  RAISE NOTICE '   - applied_discounts table created';
  RAISE NOTICE '   - discount_usage_tracking table created';
  RAISE NOTICE '   - Indexes and triggers configured';
  RAISE NOTICE '   - Ready for discount service implementation';
END $$;
