const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSellerEarnings() {
  try {
    console.log('🔍 DEBUGGING SELLER EARNINGS DATABASE');
    console.log('====================================\n');

    // Check all seller_earnings records
    console.log('1. 📊 Checking all seller_earnings records...');
    const { data: allEarnings, error: allError } = await supabase
      .from('seller_earnings')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log('   ❌ Error fetching all earnings:', allError.message);
      return;
    }

    console.log(`   ✅ Found ${allEarnings?.length || 0} total earnings records`);
    
    if (allEarnings && allEarnings.length > 0) {
      console.log('\n   📋 All earnings records:');
      allEarnings.forEach((earning, index) => {
        console.log(`     ${index + 1}. Seller: ${earning.seller_id?.substring(0, 8)}...`);
        console.log(`        Net Amount: $${(earning.net_amount / 100).toFixed(2)}`);
        console.log(`        Status: ${earning.status}`);
        console.log(`        Order ID: ${earning.order_id?.substring(0, 8)}...`);
        console.log('');
      });
    }

    // Check specific seller
    const testSellerId = '08659266-babb-4323-b750-b1977c825e24';
    console.log(`2. 🎯 Checking earnings for seller: ${testSellerId}`);
    
    const { data: sellerEarnings, error: sellerError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', testSellerId);

    if (sellerError) {
      console.log('   ❌ Error fetching seller earnings:', sellerError.message);
      return;
    }

    console.log(`   ✅ Found ${sellerEarnings?.length || 0} earnings for this seller`);
    
    if (sellerEarnings && sellerEarnings.length > 0) {
      let totalAvailable = 0;
      let totalPending = 0;
      let totalPaid = 0;
      let totalCommission = 0;

      console.log('\n   📋 Seller earnings breakdown:');
      sellerEarnings.forEach((earning, index) => {
        const netAmount = earning.net_amount || 0;
        const commission = earning.commission_amount || 0;
        
        console.log(`     ${index + 1}. $${(netAmount / 100).toFixed(2)} (${earning.status})`);
        console.log(`        Commission: $${(commission / 100).toFixed(2)}`);
        console.log(`        Order: ${earning.order_id?.substring(0, 8)}...`);
        
        totalCommission += commission;
        
        if (earning.status === 'available') {
          totalAvailable += netAmount;
        } else if (earning.status === 'pending') {
          totalPending += netAmount;
        } else if (earning.status === 'paid') {
          totalPaid += netAmount;
        }
        console.log('');
      });

      console.log('   💰 Totals:');
      console.log(`     - Available: $${(totalAvailable / 100).toFixed(2)}`);
      console.log(`     - Pending: $${(totalPending / 100).toFixed(2)}`);
      console.log(`     - Paid: $${(totalPaid / 100).toFixed(2)}`);
      console.log(`     - Commission: $${(totalCommission / 100).toFixed(2)}`);
    }

    // Test the exact query from the controller
    console.log('\n3. 🧪 Testing exact controller query...');
    const { data: controllerQuery, error: controllerError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', testSellerId)
      .order('created_at', { ascending: false });

    if (controllerError) {
      console.log('   ❌ Controller query error:', controllerError.message);
    } else {
      console.log(`   ✅ Controller query returned ${controllerQuery?.length || 0} records`);
      
      if (controllerQuery && controllerQuery.length > 0) {
        // Simulate the controller logic
        const stats = {
          total_earnings: 0,
          available_balance: 0,
          pending_balance: 0,
          paid_balance: 0,
          total_orders: controllerQuery.length,
          commission_paid: 0
        };

        controllerQuery.forEach(earning => {
          const amount = earning.net_amount || 0;
          const commission = earning.commission_amount || 0;
          
          stats.total_earnings += amount;
          stats.commission_paid += commission;
          
          if (earning.status === 'available') {
            stats.available_balance += amount;
          } else if (earning.status === 'pending' || earning.status === 'processing') {
            stats.pending_balance += amount;
          } else if (earning.status === 'paid') {
            stats.paid_balance += amount;
          }
        });

        console.log('   📊 Simulated controller response:');
        console.log(`     - Total earnings: $${(stats.total_earnings / 100).toFixed(2)}`);
        console.log(`     - Available balance: $${(stats.available_balance / 100).toFixed(2)}`);
        console.log(`     - Pending balance: $${(stats.pending_balance / 100).toFixed(2)}`);
        console.log(`     - Total orders: ${stats.total_orders}`);
        console.log(`     - Commission paid: $${(stats.commission_paid / 100).toFixed(2)}`);
      }
    }

    console.log('\n🎉 DATABASE DEBUG COMPLETED!');

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugSellerEarnings();