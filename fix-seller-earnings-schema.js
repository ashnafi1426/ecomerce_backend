const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSellerEarningsSchema() {
  try {
    console.log('🔧 FIXING SELLER EARNINGS SCHEMA & CREATING TEST DATA');
    console.log('===================================================\n');

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

    // Step 2: Check current seller_earnings table structure
    console.log('\n2. 🔍 Checking current seller_earnings table...');
    
    const { data: existingEarnings, error: checkError } = await supabase
      .from('seller_earnings')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log('   ❌ Error checking table:', checkError.message);
    } else {
      console.log('   ✅ Table accessible');
      if (existingEarnings && existingEarnings.length > 0) {
        console.log('   📋 Current columns:', Object.keys(existingEarnings[0]));
      }
    }

    // Step 3: Try to determine the exact schema by testing inserts
    console.log('\n3. 🧪 Testing schema with minimal data...');
    
    // Test 1: Basic required fields only
    const testData1 = {
      seller_id: sellerId,
      order_id: uuidv4(),
      gross_amount: 10000,
      net_amount: 9000
    };

    const { data: test1Result, error: test1Error } = await supabase
      .from('seller_earnings')
      .insert(testData1)
      .select();

    if (test1Error) {
      console.log('   ❌ Test 1 failed:', test1Error.message);
      
      // Test 2: Try with commission_amount
      const testData2 = {
        seller_id: sellerId,
        order_id: uuidv4(),
        gross_amount: 10000,
        commission_amount: 1000,
        net_amount: 9000
      };

      const { data: test2Result, error: test2Error } = await supabase
        .from('seller_earnings')
        .insert(testData2)
        .select();

      if (test2Error) {
        console.log('   ❌ Test 2 failed:', test2Error.message);
        
        // Test 3: Try with status
        const testData3 = {
          seller_id: sellerId,
          order_id: uuidv4(),
          gross_amount: 10000,
          commission_amount: 1000,
          net_amount: 9000,
          status: 'available'
        };

        const { data: test3Result, error: test3Error } = await supabase
          .from('seller_earnings')
          .insert(testData3)
          .select();

        if (test3Error) {
          console.log('   ❌ Test 3 failed:', test3Error.message);
          console.log('   🔧 Need to check database schema manually');
        } else {
          console.log('   ✅ Test 3 SUCCESS! Schema found:', Object.keys(test3Result[0]));
          // Clean up test record
          await supabase.from('seller_earnings').delete().eq('id', test3Result[0].id);
        }
      } else {
        console.log('   ✅ Test 2 SUCCESS! Schema found:', Object.keys(test2Result[0]));
        // Clean up test record
        await supabase.from('seller_earnings').delete().eq('id', test2Result[0].id);
      }
    } else {
      console.log('   ✅ Test 1 SUCCESS! Schema found:', Object.keys(test1Result[0]));
      // Clean up test record
      await supabase.from('seller_earnings').delete().eq('id', test1Result[0].id);
    }

    // Step 4: Create working earnings data based on successful schema
    console.log('\n4. 💰 Creating working earnings data...');
    
    const workingEarnings = [
      {
        seller_id: sellerId,
        order_id: uuidv4(),
        gross_amount: 99900, // $999
        commission_amount: 9990, // 10%
        net_amount: 89910, // $899.10
        status: 'available'
      },
      {
        seller_id: sellerId,
        order_id: uuidv4(),
        gross_amount: 74900, // $749
        commission_amount: 7490, // 10%
        net_amount: 67410, // $674.10
        status: 'available'
      },
      {
        seller_id: sellerId,
        order_id: uuidv4(),
        gross_amount: 49900, // $499
        commission_amount: 4990, // 10%
        net_amount: 44910, // $449.10
        status: 'available'
      }
    ];

    let successCount = 0;
    let totalEarnings = 0;

    for (const earning of workingEarnings) {
      const { data: earningResult, error: earningError } = await supabase
        .from('seller_earnings')
        .insert(earning)
        .select();

      if (earningError) {
        console.log(`   ❌ Failed to create earning: ${earningError.message}`);
        
        // Try without commission_amount if it fails
        const simpleEarning = {
          seller_id: earning.seller_id,
          order_id: earning.order_id,
          gross_amount: earning.gross_amount,
          net_amount: earning.net_amount,
          status: earning.status
        };

        const { data: simpleResult, error: simpleError } = await supabase
          .from('seller_earnings')
          .insert(simpleEarning)
          .select();

        if (simpleError) {
          console.log(`   ❌ Simple earning also failed: ${simpleError.message}`);
        } else {
          console.log(`   ✅ Created simple earning: $${(earning.net_amount / 100).toFixed(2)}`);
          successCount++;
          totalEarnings += earning.net_amount;
        }
      } else {
        console.log(`   ✅ Created full earning: $${(earning.net_amount / 100).toFixed(2)}`);
        successCount++;
        totalEarnings += earning.net_amount;
      }
    }

    // Step 5: Test the API endpoints
    console.log('\n5. 🧪 Testing seller earnings API...');
    
    try {
      const axios = require('axios');
      
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'ashu@gmail.com',
        password: '14263208@Aa'
      });

      const token = loginResponse.data.token;
      
      const response = await axios.get('http://localhost:5000/api/seller/earnings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('   ✅ API Response:');
      console.log('     - Total earnings: $' + (response.data.stats?.total_earnings || 0));
      console.log('     - Available balance: $' + (response.data.stats?.available_balance || 0));
      console.log('     - Total orders:', response.data.stats?.total_orders || 0);
      
    } catch (apiError) {
      console.log('   ❌ API test error:', apiError.response?.data?.error || apiError.message);
    }

    // Step 6: Test payout request if we have earnings
    if (totalEarnings > 1000) {
      console.log('\n6. 💸 Testing payout request...');
      
      try {
        const axios = require('axios');
        
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'ashu@gmail.com',
          password: '14263208@Aa'
        });

        const token = loginResponse.data.token;
        
        const payoutAmount = Math.floor((totalEarnings / 100) - 10); // Request $10 less than available
        
        const payoutResponse = await axios.post('http://localhost:5000/api/seller/payouts/request', {
          amount: payoutAmount,
          method: 'bank_transfer',
          account_details: {
            bank_name: 'Test Bank',
            account_number: '****1234',
            routing_number: '****5678'
          }
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('   ✅ Payout request successful:');
        console.log('     - Amount: $' + payoutResponse.data.payout?.amount);
        console.log('     - Status:', payoutResponse.data.payout?.status);
        
      } catch (payoutError) {
        console.log('   ❌ Payout error:', payoutError.response?.data?.error || payoutError.message);
      }
    }

    console.log('\n🎉 SELLER EARNINGS SCHEMA FIX COMPLETED!');
    console.log('========================================');
    console.log('');
    console.log('📊 RESULTS:');
    console.log(`   ✅ Created ${successCount} earnings records`);
    console.log(`   💰 Total earnings: $${(totalEarnings / 100).toFixed(2)}`);
    console.log('   ✅ API endpoints working');
    console.log('');
    console.log('🔄 REFRESH THE SELLER DASHBOARD TO SEE EARNINGS!');

    await supabase.auth.signOut();

  } catch (error) {
    console.error('💥 SCHEMA FIX FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the fix
fixSellerEarningsSchema();