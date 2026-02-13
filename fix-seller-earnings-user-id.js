const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSellerEarningsUserId() {
  try {
    console.log('🔧 FIXING SELLER EARNINGS USER ID MISMATCH');
    console.log('==========================================\n');

    const oldSellerId = '08659266-babb-4323-b750-b1977c825e24';
    const newSellerId = 'bb8959e5-36f1-46e2-a22a-c15a9c17f87e';

    console.log('🔄 Updating seller_earnings records...');
    console.log(`   From: ${oldSellerId}`);
    console.log(`   To:   ${newSellerId}`);

    // Update all seller_earnings records
    const { data: updatedEarnings, error: updateError } = await supabase
      .from('seller_earnings')
      .update({ seller_id: newSellerId })
      .eq('seller_id', oldSellerId)
      .select();

    if (updateError) {
      console.log('   ❌ Update error:', updateError.message);
      return;
    }

    console.log(`   ✅ Updated ${updatedEarnings?.length || 0} earnings records`);

    // Also update any orders if they exist
    console.log('\n🔄 Updating orders records...');
    const { data: updatedOrders, error: ordersError } = await supabase
      .from('orders')
      .update({ user_id: newSellerId })
      .eq('user_id', oldSellerId)
      .select();

    if (ordersError) {
      console.log('   ❌ Orders update error:', ordersError.message);
    } else {
      console.log(`   ✅ Updated ${updatedOrders?.length || 0} order records`);
    }

    // Update sub_orders if they exist
    console.log('\n🔄 Updating sub_orders records...');
    const { data: updatedSubOrders, error: subOrdersError } = await supabase
      .from('sub_orders')
      .update({ seller_id: newSellerId })
      .eq('seller_id', oldSellerId)
      .select();

    if (subOrdersError) {
      console.log('   ❌ Sub-orders update error:', subOrdersError.message);
    } else {
      console.log(`   ✅ Updated ${updatedSubOrders?.length || 0} sub-order records`);
    }

    // Verify the fix
    console.log('\n🧪 Verifying the fix...');
    const { data: verifyEarnings, error: verifyError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', newSellerId);

    if (verifyError) {
      console.log('   ❌ Verification error:', verifyError.message);
    } else {
      console.log(`   ✅ Found ${verifyEarnings?.length || 0} earnings for correct seller ID`);
      
      if (verifyEarnings && verifyEarnings.length > 0) {
        let totalAvailable = 0;
        verifyEarnings.forEach(earning => {
          if (earning.status === 'available') {
            totalAvailable += earning.net_amount || 0;
          }
        });
        console.log(`   💰 Total available balance: $${(totalAvailable / 100).toFixed(2)}`);
      }
    }

    console.log('\n🎉 SELLER ID FIX COMPLETED!');
    console.log('Now test the API again - it should show the correct balance.');

  } catch (error) {
    console.error('💥 Fix failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixSellerEarningsUserId();