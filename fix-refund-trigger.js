/**
 * Fix Refund Trigger - Update orders.total_amount to orders.amount
 * Fixes the validate_cumulative_refunds trigger in enhanced refund migration
 */

const supabase = require('./config/supabase');

async function fixRefundTrigger() {
  console.log('\n=== Fixing Refund Trigger ===\n');

  try {
    // Drop and recreate the trigger function with the correct column name
    const fixSQL = `
      -- Drop existing trigger and function
      DROP TRIGGER IF EXISTS trigger_validate_cumulative_refunds ON refund_details;
      DROP FUNCTION IF EXISTS validate_cumulative_refunds();

      -- Recreate function with correct column name (amount instead of total_amount)
      CREATE OR REPLACE FUNCTION validate_cumulative_refunds()
      RETURNS TRIGGER AS $func$
      DECLARE
          v_cumulative_refunds DECIMAL(10, 2);
          v_order_total DECIMAL(10, 2);
      BEGIN
          -- Get cumulative refunds for this order (excluding current if update)
          SELECT COALESCE(SUM(refund_amount), 0) INTO v_cumulative_refunds
          FROM refund_details
          WHERE order_id = NEW.order_id 
          AND status IN ('approved', 'processing', 'completed')
          AND (TG_OP = 'INSERT' OR id != NEW.id);
          
          -- Get order total (FIXED: using 'amount' instead of 'total_amount')
          SELECT amount INTO v_order_total
          FROM orders
          WHERE id = NEW.order_id;
          
          -- Check if cumulative refunds + new refund exceed order total
          IF (v_cumulative_refunds + NEW.refund_amount) > v_order_total THEN
              RAISE EXCEPTION 'Cumulative refunds (% + %) exceed order total (%)', 
                  v_cumulative_refunds, NEW.refund_amount, v_order_total;
          END IF;
          
          RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;

      -- Recreate trigger
      CREATE TRIGGER trigger_validate_cumulative_refunds
          BEFORE INSERT OR UPDATE OF refund_amount, status ON refund_details
          FOR EACH ROW
          WHEN (NEW.status IN ('approved', 'processing', 'completed'))
          EXECUTE FUNCTION validate_cumulative_refunds();
    `;

    console.log('Applying trigger fix...');
    
    const { error } = await supabase.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('RPC method failed, trying direct execution...');
      
      // Split and execute each statement
      const statements = fixSQL.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase.rpc('exec', { 
            query: statement.trim() + ';' 
          });
          
          if (execError) {
            console.error('Error executing statement:', execError);
            throw execError;
          }
        }
      }
    }

    console.log('✓ Trigger fix applied successfully\n');
    console.log('Summary:');
    console.log('- Dropped old trigger and function');
    console.log('- Created new function with correct column name (amount)');
    console.log('- Recreated trigger on refund_details table');
    console.log('\nThe refund system should now work correctly!\n');

  } catch (error) {
    console.error('\n❌ Error fixing trigger:', error.message);
    console.error('\nManual fix required:');
    console.log('Run this SQL in your Supabase SQL editor:');
    console.log(`
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
    `);
    process.exit(1);
  }
}

// Run the fix
fixRefundTrigger()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
