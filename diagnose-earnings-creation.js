const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * DIAGNOSE EARNINGS CREATION ISSUE
 * =================================
 * This script checks why seller earnings aren't being created after purchase
 */

async function diagnoseEarningsIssue() {
  console.log('🔍 DIAGNOSING SELLER EARNINGS CREATION ISSUE\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check if seller_earnings table exists
    console.log('\n1️⃣ Checking if seller_earnings table exists...');
    const { data: tables, error: tablesError } = await supabase
      .from('seller_earnings')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.error('❌ seller_earnings table error:', tablesError.message);
      console.log('\n💡 SOLUTION: Run the phase-1-payment-system-tables.sql migration');
      return;
    }
    console.log('✅ seller_earnings table exists');

    // 2. Check recent orders
    console.log('\n2️⃣ Checking recent orders...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError.message);
      return;
    }

    console.log(`Found ${orders?.length || 0} recent orders`);
    if (orders && orders.length > 0) {
      orders.forEach((order, i) => {
        console.log(`\n   Order ${i + 1}:`);
        console.log(`   - ID: ${order.id}`);
        console.log(`   - User ID: ${order.user_id || 'guest'}`);
        console.log(`   - Amount: $${(order.amount / 100).toFixed(2)}`);
        console.log(`   - Status: ${order.status}`);
        console.log(`   - Payment Intent: ${order.payment_intent_id || 'N/A'}`);
        console.log(`   - Created: ${order.created_at}`);
      });
    }

    // 3. Check sub_orders for recent orders
    console.log('\n3️⃣ Checking sub_orders (seller order splits)...');
    const { data: subOrders, error: subOrdersError } = await supabase
      .from('sub_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (subOrdersError) {
      console.error('❌ Error fetching sub_orders:', subOrdersError.message);
    } else {
      console.log(`Found ${subOrders?.length || 0} sub-orders`);
      if (subOrders && subOrders.length > 0) {
        subOrders.forEach((subOrder, i) => {
          console.log(`\n   Sub-Order ${i + 1}:`);
          console.log(`   - ID: ${subOrder.id}`);
          console.log(`   - Parent Order: ${subOrder.parent_order_id}`);
          console.log(`   - Seller ID: ${subOrder.seller_id}`);
          console.log(`   - Subtotal: $${(subOrder.subtotal / 100).toFixed(2)}`);
          console.log(`   - Commission: ${subOrder.commission_rate}%`);
          console.log(`   - Seller Payout: $${(subOrder.seller_payout / 100).toFixed(2)}`);
          console.log(`   - Status: ${subOrder.status}`);
        });
      } else {
        console.log('⚠️  No sub-orders found - orders are not being split by sellers!');
      }
    }

    // 4. Check seller_earnings
    console.log('\n4️⃣ Checking seller_earnings records...');
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (earningsError) {
      console.error('❌ Error fetching earnings:', earningsError.message);
    } else {
      console.log(`Found ${earnings?.length || 0} earnings records`);
      if (earnings && earnings.length > 0) {
        earnings.forEach((earning, i) => {
          console.log(`\n   Earning ${i + 1}:`);
          console.log(`   - ID: ${earning.id}`);
          console.log(`   - Seller ID: ${earning.seller_id}`);
          console.log(`   - Order ID: ${earning.order_id}`);
          console.log(`   - Sub-Order ID: ${earning.sub_order_id}`);
          console.log(`   - Gross: $${(earning.gross_amount / 100).toFixed(2)}`);
          console.log(`   - Commission: $${(earning.commission_amount / 100).toFixed(2)}`);
          console.log(`   - Net: $${(earning.net_amount / 100).toFixed(2)}`);
          console.log(`   - Status: ${earning.status}`);
          console.log(`   - Available Date: ${earning.available_date}`);
        });
      } else {
        console.log('⚠️  No earnings records found!');
      }
    }

    // 5. Check products and their seller_id
    console.log('\n5️⃣ Checking products with seller_id...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, price, seller_id, approval_status')
      .eq('approval_status', 'approved')
      .limit(5);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
    } else {
      console.log(`Found ${products?.length || 0} approved products`);
      if (products && products.length > 0) {
        products.forEach((product, i) => {
          console.log(`\n   Product ${i + 1}:`);
          console.log(`   - ID: ${product.id}`);
          console.log(`   - Title: ${product.title}`);
          console.log(`   - Price: $${product.price}`);
          console.log(`   - Seller ID: ${product.seller_id || 'NULL ⚠️'}`);
          console.log(`   - Status: ${product.approval_status}`);
        });

        const productsWithoutSeller = products.filter(p => !p.seller_id);
        if (productsWithoutSeller.length > 0) {
          console.log(`\n⚠️  ${productsWithoutSeller.length} products have NULL seller_id!`);
        }
      }
    }

    // 6. Check payments table
    console.log('\n6️⃣ Checking payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError.message);
    } else {
      console.log(`Found ${payments?.length || 0} payment records`);
      if (payments && payments.length > 0) {
        payments.forEach((payment, i) => {
          console.log(`\n   Payment ${i + 1}:`);
          console.log(`   - ID: ${payment.id}`);
          console.log(`   - Order ID: ${payment.order_id || 'NULL'}`);
          console.log(`   - Amount: $${(payment.amount / 100).toFixed(2)}`);
          console.log(`   - Status: ${payment.status}`);
          console.log(`   - Stripe Intent: ${payment.stripe_payment_intent_id}`);
        });
      }
    }

    // 7. Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📋 DIAGNOSIS SUMMARY\n');

    const issues = [];
    const solutions = [];

    if (!subOrders || subOrders.length === 0) {
      issues.push('❌ No sub-orders found - order splitting is not working');
      solutions.push('Check if createOrderAfterPayment is being called');
      solutions.push('Check if splitOrderBySellers function is executing');
      solutions.push('Add console.log statements to track execution');
    }

    if (!earnings || earnings.length === 0) {
      issues.push('❌ No earnings records found - earnings creation is failing');
      solutions.push('Check if seller_earnings INSERT is executing in splitOrderBySellers');
      solutions.push('Check for database errors in the backend logs');
      solutions.push('Verify seller_id is valid UUID format');
    }

    if (products && products.some(p => !p.seller_id)) {
      issues.push('⚠️  Some products have NULL seller_id');
      solutions.push('Update products to have valid seller_id');
      solutions.push('Run: UPDATE products SET seller_id = [valid-seller-uuid] WHERE seller_id IS NULL');
    }

    if (issues.length > 0) {
      console.log('ISSUES FOUND:');
      issues.forEach(issue => console.log(`  ${issue}`));
      console.log('\nRECOMMENDED SOLUTIONS:');
      solutions.forEach((solution, i) => console.log(`  ${i + 1}. ${solution}`));
    } else {
      console.log('✅ All checks passed! System appears to be working correctly.');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Diagnostic error:', error.message);
    console.error(error.stack);
  }
}

// Run diagnosis
diagnoseEarningsIssue()
  .then(() => {
    console.log('\n✅ Diagnosis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
