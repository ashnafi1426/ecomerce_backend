/**
 * FIX ORDERS STATUS COLUMN
 * 
 * This script verifies and fixes the orders table status column issue
 */

const supabase = require('./config/supabase');

async function fixOrdersStatusColumn() {
  console.log('🔧 FIXING ORDERS TABLE STATUS COLUMN\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Check if orders table exists by trying to query it
    console.log('\n📋 Step 1: Checking orders table...');
    const { data: testQuery, error: tableError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
      console.error('❌ Orders table does not exist!');
      return;
    }
    
    console.log('✅ Orders table exists');
    
    // Step 2: Check table columns by getting a sample row
    console.log('\n📋 Step 2: Checking table columns...');
    const { data: sampleOrder, error: sampleError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error:', sampleError.message);
      console.log('\n💡 The error suggests there might be an issue with the table structure.');
      
      // Check if it's specifically about the status column
      if (sampleError.message.includes('status') && sampleError.message.includes('does not exist')) {
        console.log('\n❌ CONFIRMED: Status column does not exist in orders table');
        console.log('\n💡 SOLUTION: Run the migration SQL file:');
        console.log('   File: database/migrations/fix-orders-status-column.sql');
      }
      return;
    }
    
    if (sampleOrder && sampleOrder.length > 0) {
      console.log('✅ Sample order retrieved');
      const columnNames = Object.keys(sampleOrder[0]);
      console.log('📊 Available columns:', columnNames.join(', '));
      
      if (!columnNames.includes('status')) {
        console.log('\n❌ STATUS COLUMN IS MISSING!');
        console.log('   This needs to be fixed in the database.');
        console.log('\n💡 SOLUTION: Run the migration SQL file:');
        console.log('   File: database/migrations/fix-orders-status-column.sql');
      } else {
        console.log('\n✅ Status column exists');
        console.log('   Sample status value:', sampleOrder[0].status);
      }
    } else {
      console.log('⚠️  No orders in table yet');
      console.log('   Will test with empty table...');
    }
    
    // Step 3: Test status query
    console.log('\n📋 Step 3: Testing status query...');
    try {
      const { data: ordersWithStatus, error: statusError } = await supabase
        .from('orders')
        .select('id, status')
        .limit(5);
      
      if (statusError) {
        console.error('❌ Error querying status:', statusError.message);
        console.log('\n🔍 ERROR DETAILS:');
        console.log('   Code:', statusError.code);
        console.log('   Details:', statusError.details);
        console.log('   Hint:', statusError.hint);
        
        if (statusError.message.includes('column') && statusError.message.includes('does not exist')) {
          console.log('\n❌ CONFIRMED: Status column does not exist in orders table');
          console.log('\n💡 SOLUTION: Run the following SQL in your Supabase SQL Editor:');
          console.log('\n' + '='.repeat(60));
          console.log(`
-- Add status column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_payment';

-- Add check constraint for valid statuses
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending_payment', 
  'paid', 
  'confirmed', 
  'packed', 
  'shipped', 
  'delivered', 
  'cancelled', 
  'refunded',
  'partially_refunded'
));

-- Update any NULL status values
UPDATE orders 
SET status = 'pending_payment' 
WHERE status IS NULL;

-- Verify the fix
SELECT id, status, created_at 
FROM orders 
LIMIT 5;
          `);
          console.log('='.repeat(60));
        }
      } else {
        console.log('✅ Status query successful');
        if (ordersWithStatus && ordersWithStatus.length > 0) {
          console.log('📊 Sample statuses:');
          ordersWithStatus.forEach(order => {
            console.log(`   - Order ${order.id.slice(0, 8)}: ${order.status}`);
          });
        } else {
          console.log('   No orders found in table');
        }
      }
    } catch (queryError) {
      console.error('❌ Query error:', queryError.message);
    }
    
    // Step 4: Check order service compatibility
    console.log('\n📋 Step 4: Checking order service compatibility...');
    const validStatuses = [
      'pending_payment',
      'paid',
      'confirmed',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'partially_refunded'
    ];
    
    console.log('✅ Valid order statuses in system:');
    validStatuses.forEach(status => {
      console.log(`   - ${status}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the fix
fixOrdersStatusColumn()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
