/**
 * TEST SCRIPT: Verify Seller Earnings Creation
 * 
 * This script tests that seller earnings are being created correctly
 * when orders are placed.
 */

const supabase = require('./config/supabase');

async function testEarningsCreation() {
  try {
    console.log('🧪 Testing Seller Earnings Creation\n');
    console.log('='.repeat(60));

    // Step 1: Get seller info
    console.log('\n1. 📧 Finding seller: ashu@gmail.com');
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'ashu@gmail.com')
      .single();

    if (sellerError || !seller) {
      console.log('❌ Seller not found:', sellerError?.message);
      return;
    }

    console.log('   ✅ Seller found:');
    console.log('      ID:', seller.id);
    console.log('      Email:', seller.email);

    // Step 2: Get recent orders with seller's products
    console.log('\n2. 🛒 Checking recent orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.log('❌ Error fetching orders:', ordersError.message);
      return;
    }

    // Filter orders that contain seller's products
    const sellerOrders = orders?.filter(order => {
      if (!order.basket || !Array.isArray(order.basket)) return false;
      return order.basket.some(item => item.seller_id === seller.id);
    }) || [];

    console.log(`   ✅ Found ${sellerOrders.length} orders with seller products`);

    if (sellerOrders.length === 0) {
      console.log('   ⚠️  No orders found with seller products');
      console.log('   💡 Create a test order first by purchasing a product from this seller');
      return;
    }

    // Step 3: Check earnings for each order
    console.log('\n3. 💰 Checking seller_earnings records...');
    
    let ordersWithEarnings = 0;
    let ordersWithoutEarnings = 0;

    for (const order of sellerOrders) {
      const { data: earnings, error: earningsError } = await supabase
        .from('seller_earnings')
        .select('*')
        .eq('order_id', order.id)
        .eq('seller_id', seller.id);

      if (earningsError) {
        console.log(`   ❌ Error checking earnings for order ${order.id}:`, earningsError.message);
        continue;
      }

      if (earnings && earnings.length > 0) {
        ordersWithEarnings++;
        console.log(`   ✅ Order ${order.id.substring(0, 8)}... HAS earnings:`);
        earnings.forEach(earning => {
          console.log(`      - Gross: $${(earning.gross_amount / 100).toFixed(2)}`);
          console.log(`      - Commission: $${(earning.commission_amount / 100).toFixed(2)} (${earning.commission_rate}%)`);
          console.log(`      - Net: $${(earning.net_amount / 100).toFixed(2)}`);
          console.log(`      - Status: ${earning.status}`);
          console.log(`      - Available: ${new Date(earning.available_date).toLocaleDateString()}`);
        });
      } else {
        ordersWithoutEarnings++;
        console.log(`   ❌ Order ${order.id.substring(0, 8)}... MISSING earnings`);
        console.log(`      - Status: ${order.status}`);
        console.log(`      - Created: ${new Date(order.created_at).toLocaleString()}`);
      }
    }

    // Step 4: Get total earnings
    console.log('\n4. 📊 Total Earnings Summary');
    const { data: allEarnings, error: allEarningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', seller.id);

    if (allEarningsError) {
      console.log('   ❌ Error fetching all earnings:', allEarningsError.message);
    } else {
      const totalGross = allEarnings.reduce((sum, e) => sum + e.gross_amount, 0);
      const totalCommission = allEarnings.reduce((sum, e) => sum + e.commission_amount, 0);
      const totalNet = allEarnings.reduce((sum, e) => sum + e.net_amount, 0);
      const availableEarnings = allEarnings.filter(e => e.status === 'available');
      const pendingEarnings = allEarnings.filter(e => e.status === 'pending');

      console.log(`   Total Earnings Records: ${allEarnings.length}`);
      console.log(`   Available: ${availableEarnings.length}`);
      console.log(`   Pending: ${pendingEarnings.length}`);
      console.log(`   Total Gross: $${(totalGross / 100).toFixed(2)}`);
      console.log(`   Total Commission: $${(totalCommission / 100).toFixed(2)}`);
      console.log(`   Total Net: $${(totalNet / 100).toFixed(2)}`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Orders with seller products: ${sellerOrders.length}`);
    console.log(`Orders WITH earnings: ${ordersWithEarnings}`);
    console.log(`Orders WITHOUT earnings: ${ordersWithoutEarnings}`);
    
    if (ordersWithoutEarnings > 0) {
      console.log('\n⚠️  ISSUE DETECTED:');
      console.log(`   ${ordersWithoutEarnings} orders are missing earnings records`);
      console.log('   Run fix-missing-earnings.js to create them');
    } else if (ordersWithEarnings > 0) {
      console.log('\n✅ SUCCESS:');
      console.log('   All orders have earnings records!');
      console.log('   Seller earnings creation is working correctly');
    } else {
      console.log('\n💡 INFO:');
      console.log('   No orders found to test');
      console.log('   Create a test order to verify earnings creation');
    }

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error(error);
  }
}

// Run the test
testEarningsCreation()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
