-- =============================================
-- STRIPE CONNECT MIGRATION
-- Adds columns needed for Stripe Connect integration
-- =============================================

-- 1. Add Stripe Connect columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Add transfer tracking to seller_earnings
ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS stripe_transfer_id VARCHAR(255);

-- 3. Add discount tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_breakdown JSONB;

-- 4. Add transfer tracking to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_transfers JSONB;

-- 5. Index on stripe_account_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- 6. Index on stripe_transfer_id for refund reversal lookups
CREATE INDEX IF NOT EXISTS idx_seller_earnings_stripe_transfer_id ON seller_earnings(stripe_transfer_id) WHERE stripe_transfer_id IS NOT NULL;
