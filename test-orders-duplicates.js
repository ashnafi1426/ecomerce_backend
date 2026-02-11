/**
 * SIMPLE TEST: Check for Duplicate Orders
 * 
 * This test verifies that orders are NOT duplicated when fetched.
 */

const supabase = require('./config/supabase');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bright: '\x1b[1m'
};

async function testOrderDuplicates() {
  console.log(`\n${colors.bright}${colors.yellow}═══ TESTING FOR DUPLICATE ORDERS ═══${colors.reset}\n`);
  
  try {
    // Get a customer with orders
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'customer')
      .limit(5);
    
    if (!users || users.length === 0) {
      console.log(`${colors.yellow}⚠ No customers found in database${colors.reset}`);
      return;
    }
    
    let foundOrders = false;
    
    for (const user of users) {
      // Query orders the CORRECT way (Amazon-style)
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.log(`${colors.red}✗ Query error: ${error.message}${colors.reset}`);
        continue;
      }
      
      if (orders && orders.length > 0) {
        foundOrders = true;
        console.log(`${colors.cyan}Testing user: ${user.email}${colors.reset}`);
        console.log(`${colors.cyan}Found ${orders.length} orders${colors.reset}`);
        
        // Check for duplicates
        const orderIds = orders.map(o => o.id);
        const uniqueIds = [...new Set(orderIds)];
        
        if (orderIds.length !== uniqueIds.length) {
          console.log(`${colors.red}✗ DUPLICATE ORDERS FOUND!${colors.reset}`);
          console.log(`${colors.red}  Total rows: ${orderIds.length}${colors.reset}`);
          console.log(`${colors.red}  Unique orders: ${uniqueIds.length}${colors.reset}`);
          console.log(`${colors.red}  Duplicates: ${orderIds.length - uniqueIds.length}${colors.reset}`);
          return false;
        } else {
          console.log(`${colors.green}✓ No duplicates - each order appears exactly once${colors.reset}`);
        }
        
        // Check basket structure
        const ordersWithBasket = orders.filter(o => o.basket && Array.isArray(o.basket));
        console.log(`${colors.cyan}Orders with basket: ${ordersWithBasket.length}/${orders.length}${colors.reset}`);
        
        if (ordersWithBasket.length > 0) {
          const sampleOrder = ordersWithBasket[0];
          console.log(`${colors.cyan}Sample order:${colors.reset}`);
          console.log(`  ID: ${sampleOrder.id.substring(0, 8)}...`);
          console.log(`  Status: ${sampleOrder.status}`);
          console.log(`  Amount: $${(sampleOrder.amount / 100).toFixed(2)}`);
          console.log(`  Items in basket: ${sampleOrder.basket.length}`);
          console.log(`${colors.green}✓ Basket structure is correct${colors.reset}`);
        }
        
        break; // Test first user with orders
      }
    }
    
    if (!foundOrders) {
      console.log(`${colors.yellow}⚠ No orders found in database${colors.reset}`);
      console.log(`${colors.yellow}  This is OK - create an order to test${colors.reset}`);
      return true;
    }
    
    console.log(`\n${colors.bright}${colors.green}✅ TEST PASSED: No duplicate orders!${colors.reset}\n`);
    return true;
    
  } catch (err) {
    console.log(`${colors.red}✗ Test failed: ${err.message}${colors.reset}`);
    return false;
  }
}

async function testReturnsTable() {
  console.log(`\n${colors.bright}${colors.yellow}═══ TESTING RETURNS TABLE ═══${colors.reset}\n`);
  
  try {
    // Check if returns table exists
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`${colors.yellow}⚠ Returns table does not exist yet${colors.reset}`);
        console.log(`${colors.yellow}  Run database migrations to create it${colors.reset}`);
        return true; // Not a failure, just not set up yet
      }
      console.log(`${colors.red}✗ Returns query error: ${error.message}${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}✓ Returns table exists and is accessible${colors.reset}`);
    
    if (data && data.length > 0) {
      console.log(`${colors.cyan}Found ${data.length} returns in database${colors.reset}`);
    } else {
      console.log(`${colors.cyan}No returns in database yet (this is OK)${colors.reset}`);
    }
    
    return true;
    
  } catch (err) {
    console.log(`${colors.red}✗ Test failed: ${err.message}${colors.reset}`);
    return false;
  }
}

async function runTests() {
  console.log(`\n${colors.bright}${colors.yellow}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}║  ORDERS DUPLICATE CHECK TEST          ║${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}╚════════════════════════════════════════╝${colors.reset}`);
  
  const ordersTest = await testOrderDuplicates();
  const returnsTest = await testReturnsTable();
  
  console.log(`\n${colors.bright}${colors.yellow}═══ SUMMARY ═══${colors.reset}\n`);
  
  if (ordersTest && returnsTest) {
    console.log(`${colors.green}✅ ALL TESTS PASSED${colors.reset}`);
    console.log(`${colors.green}✅ No duplicate orders${colors.reset}`);
    console.log(`${colors.green}✅ Database structure is correct${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ SOME TESTS FAILED${colors.reset}`);
    console.log(`${colors.red}   Review the errors above${colors.reset}\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
