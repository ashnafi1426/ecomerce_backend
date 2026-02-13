const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSimpleTestEarnings() {
  try {
    console.log('🧪 CREATING SIMPLE TEST EARNINGS DATA');
    console.log('====================================\n');

    // Step 1: Get seller ID
    console.log('1. 🔐 Getting seller information...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ashu@gmail.com',
      password: '14263208@Aa'
    });

    if (authError) {
      console.log('   ❌ Authentication failed:', authError.message);
      return;
    }

    const sellerId = authData.user.id;
    console.log('   ✅ Seller ID:', sellerId);

    // Step 2: Create test earnings records directly
    console.log('\n2. 💵 Creating test earnings records...');
    
    const testEarnings = [
      {
        seller_id: sellerId,
        gross_amount: 99900, // $999
        commission_amount: 9990, // 10%
        processing_fee: 3227, // 2.9% + $0.30
        net_amount: 86683, // $866.83
        status: 'available',
        available_date: new Date().toISOString().split('T')[0]
      },
      {
        seller_id: sellerId,
        gross_amount: 49900, // $499
        commission_amount: 4990, // 10%
        processing_fee: 1477, // 2.9% + $0.30
        net_amount: 43433, // $434.33
        status: 'available',
        available_date: new Date().toISOString().split('T')[0]
      },
      {
        seller_id: sellerId,
        gross_amount: 29900, // $299
        commission_amount: 2990, // 10%
        processing_fee: 897, // 2.9% + $0.30
        net_amount: 26013, // $260.13
        status: 'available',
        available_date: new Date().toISOString().split('T')[0]
      }
    ];

    let totalNetEarnings = 0;
    let createdCount = 0;

    for (const earning of testEarnings) {
      const { data: earningsRecord, error: earningsError } = await supabase
        .from('seller_earnings')
        .insert(earning)
        .select()
        .single();

      if (earningsError) {
        console.log(`   ❌ Earnings creation error:`, earningsError.message);
        continue;
      }

      totalNetEarnings += earning.net_amount;
      createdCount++;
      
      console.log(`   ✅ Created earnings record ${earningsRecord.id}:`);
      console.log(`     - Gross: $${(earning.gross_amount / 100).toFixed(2)}`);
      console.log(`     - Commission: $${(earning.commission_amount / 100).toFixed(2)}`);
      console.log(`     - Net: $${(earning.net_amount / 100).toFixed(2)}`);
    }

    // Step 3: Test the seller earnings API
    console.log('\n3. 🧪 Testing seller earnings API...');
    
    const { data: user } = await supabase.auth.getUser();
    const token = user.session?.access_token;
    
    if (token) {
      try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:5000/api/seller/earnings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('   ✅ API Response:');
        console.log('     - Total earnings:', response.data.stats?.total_earnings || 0);
        console.log('     - Available balance:', response.data.stats?.available_balance || 0);
        console.log('     - Total orders:', response.data.stats?.total_orders || 0);
        
      } catch (apiError) {
        console.log('   ❌ API test error:', apiError.response?.data?.error || apiError.message);
      }
    }

    console.log('\n🎉 SIMPLE TEST EARNINGS CREATION COMPLETED!');
    console.log('===========================================');
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   ✅ Created ${createdCount} earnings records`);
    console.log(`   💰 Total available earnings: $${(totalNetEarnings / 100).toFixed(2)}`);
    console.log('   ✅ All earnings set to "available" status');
    console.log('');
    console.log('🚀 READY FOR PAYOUT TESTING!');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   1. Test payout request with available balance');
    console.log('   2. Test admin payout approval');
    console.log('   3. Test complete payout workflow');

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('💥 SIMPLE TEST EARNINGS CREATION FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the script
createSimpleTestEarnings();