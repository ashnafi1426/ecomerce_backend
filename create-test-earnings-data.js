const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestEarningsData() {
  try {
    console.log('🧪 CREATING TEST EARNINGS DATA FOR SELLER');
    console.log('==========================================\n');

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

    // Step 2: Create test commission settings
    console.log('\n2. ⚙️ Setting up commission settings...');
    
    const commissionSettings = {
      default_rate: 15.00,
      category_rates: {
        'electronics': 12.00,
        'fashion': 18.00,
        'books': 10.00
      },
      seller_custom_rates: {
        [sellerId]: 10.00 // VIP seller gets lower rate
      },
      transaction_fee: 30, // $0.30
      is_active: true,
      effective_date: new Date().toISOString().split('T')[0]
    };

    const { data: commissionData, error: commissionError } = await supabase
      .from('commission_settings')
      .upsert(commissionSettings, { onConflict: 'is_active' })
      .select()
      .single();

    if (commissionError) {
      console.log('   ❌ Commission settings error:', commissionError.message);
    } else {
      console.log('   ✅ Commission settings configured');
      console.log('     - Default rate:', commissionData.default_rate + '%');
      console.log('     - Seller custom rate:', commissionData.seller_custom_rates[sellerId] + '%');
    }

    // Step 3: Create test payout settings
    console.log('\n3. 💰 Setting up payout settings...');
    
    const payoutSettings = {
      holding_period_days: 1, // Short holding period for testing
      minimum_payout_amount: 1000, // $10 minimum
      maximum_payout_amount: 10000000, // $100k
      auto_payout_enabled: false,
      require_manual_approval: true,
      auto_approve_threshold: 50000, // $500
      is_active: true
    };

    const { data: payoutData, error: payoutError } = await supabase
      .from('payout_settings')
      .upsert(payoutSettings, { onConflict: 'is_active' })
      .select()
      .single();

    if (payoutError) {
      console.log('   ❌ Payout settings error:', payoutError.message);
    } else {
      console.log('   ✅ Payout settings configured');
      console.log('     - Holding period:', payoutData.holding_period_days + ' days');
      console.log('     - Minimum payout: $' + (payoutData.minimum_payout_amount / 100).toFixed(2));
    }

    // Step 4: Create test orders and earnings
    console.log('\n4. 📦 Creating test orders and earnings...');
    
    const testOrders = [
      {
        id: 'test-order-1-' + Date.now(),
        user_id: 'customer-test-id-1',
        payment_intent_id: 'pi_test_1_' + Date.now(),
        amount: 99900, // $999
        status: 'paid',
        basket: [{ product_name: 'Test Laptop', price: 99900, quantity: 1 }],
        shipping_address: { name: 'Test Customer 1', address: '123 Test St' }
      },
      {
        id: 'test-order-2-' + Date.now(),
        user_id: 'customer-test-id-2',
        payment_intent_id: 'pi_test_2_' + Date.now(),
        amount: 49900, // $499
        status: 'paid',
        basket: [{ product_name: 'Test Phone', price: 49900, quantity: 1 }],
        shipping_address: { name: 'Test Customer 2', address: '456 Test Ave' }
      },
      {
        id: 'test-order-3-' + Date.now(),
        user_id: 'customer-test-id-3',
        payment_intent_id: 'pi_test_3_' + Date.now(),
        amount: 29900, // $299
        status: 'paid',
        basket: [{ product_name: 'Test Tablet', price: 29900, quantity: 1 }],
        shipping_address: { name: 'Test Customer 3', address: '789 Test Blvd' }
      }
    ];

    const createdOrders = [];
    
    for (const order of testOrders) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .upsert(order)
        .select()
        .single();

      if (orderError) {
        console.log(`   ❌ Order creation error for ${order.id}:`, orderError.message);
        continue;
      }

      createdOrders.push(orderData);
      console.log(`   ✅ Created order ${orderData.id}: $${(orderData.amount / 100).toFixed(2)}`);
    }

    // Step 5: Create seller earnings for each order
    console.log('\n5. 💵 Creating seller earnings records...');
    
    let totalEarnings = 0;
    const commissionRate = 10.00; // VIP seller rate
    
    for (const order of createdOrders) {
      const grossAmount = order.amount;
      const commissionAmount = Math.round(grossAmount * (commissionRate / 100));
      const processingFee = Math.round(grossAmount * 0.029) + 30; // Stripe fee
      const netAmount = grossAmount - commissionAmount - processingFee;

      const earningsData = {
        id: 'earnings-' + order.id,
        seller_id: sellerId,
        parent_order_id: order.id,
        gross_amount: grossAmount,
        commission_amount: commissionAmount,
        processing_fee: processingFee,
        net_amount: netAmount,
        status: 'available', // Make available for payout testing
        available_date: new Date().toISOString().split('T')[0] // Available today
      };

      const { data: earningsRecord, error: earningsError } = await supabase
        .from('seller_earnings')
        .upsert(earningsData)
        .select()
        .single();

      if (earningsError) {
        console.log(`   ❌ Earnings creation error for ${order.id}:`, earningsError.message);
        continue;
      }

      totalEarnings += netAmount;
      console.log(`   ✅ Created earnings for order ${order.id}:`);
      console.log(`     - Gross: $${(grossAmount / 100).toFixed(2)}`);
      console.log(`     - Commission (${commissionRate}%): $${(commissionAmount / 100).toFixed(2)}`);
      console.log(`     - Processing fee: $${(processingFee / 100).toFixed(2)}`);
      console.log(`     - Net earnings: $${(netAmount / 100).toFixed(2)}`);
    }

    // Step 6: Create seller bank account for payout testing
    console.log('\n6. 🏦 Setting up seller bank account...');
    
    const bankAccountData = {
      seller_id: sellerId,
      bank_name: 'Test Bank',
      account_holder_name: 'Test Seller',
      account_number_encrypted: 'encrypted_1234567890',
      account_number_last4: '7890',
      routing_number: '123456789',
      account_type: 'business_checking',
      verified: true,
      is_default: true
    };

    const { data: bankAccount, error: bankError } = await supabase
      .from('seller_bank_accounts')
      .upsert(bankAccountData, { onConflict: 'seller_id,is_default' })
      .select()
      .single();

    if (bankError) {
      console.log('   ❌ Bank account setup error:', bankError.message);
    } else {
      console.log('   ✅ Bank account configured');
      console.log('     - Bank:', bankAccount.bank_name);
      console.log('     - Account ending in:', bankAccount.account_number_last4);
    }

    console.log('\n🎉 TEST EARNINGS DATA CREATION COMPLETED!');
    console.log('=========================================');
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   ✅ Created ${createdOrders.length} test orders`);
    console.log(`   ✅ Created ${createdOrders.length} earnings records`);
    console.log(`   💰 Total available earnings: $${(totalEarnings / 100).toFixed(2)}`);
    console.log('   ✅ Commission settings configured (10% for this seller)');
    console.log('   ✅ Payout settings configured (1 day holding, $10 minimum)');
    console.log('   ✅ Bank account set up for payouts');
    console.log('');
    console.log('🚀 READY FOR PAYOUT TESTING!');
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('   1. Test seller earnings API endpoint');
    console.log('   2. Test payout request with available balance');
    console.log('   3. Test admin payout approval workflow');
    console.log('   4. Test complete payout process');

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('💥 TEST EARNINGS DATA CREATION FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the script
createTestEarningsData();