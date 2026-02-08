-- Fix Refund Trigger - Manual SQL Execution
-- Run this in Supabase SQL Editor

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_validate_cumulative_refunds ON refund_details;
DROP FUNCTION IF EXISTS validate_cumulative_refunds();

-- Recreate function with correct column name
CREATE OR REPLACE FUNCTION validate_cumulative_refunds()
RETURNS TRIGGER AS $$
DECLARE
    v_cumulative_refunds DECIMAL(10, 2);
    v_order_total DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(refund_amount), 0) INTO v_cumulative_refunds
    FROM refund_details
    WHERE order_id = NEW.order_id
    AND status IN ('approved', 'processing', 'completed')
    AND (TG_OP = 'INSERT' OR id != NEW.id);

    -- FIXED: using 'amount' instead of 'total_amount'
    SELECT amount INTO v_order_total
    FROM orders
    WHERE id = NEW.order_id;

    IF (v_cumulative_refunds + NEW.refund_amount) > v_order_total THEN
        RAISE EXCEPTION 'Cumulative refunds exceed order total';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER trigger_validate_cumulative_refunds
    BEFORE INSERT OR UPDATE OF refund_amount, status ON refund_details
    FOR EACH ROW
    WHEN (NEW.status IN ('approved', 'processing', 'completed'))
    EXECUTE FUNCTION validate_cumulative_refunds();
