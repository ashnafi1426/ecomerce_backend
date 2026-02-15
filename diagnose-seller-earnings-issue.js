const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function diagnoseSellerEarnings() {
  console.log('🔍 DIAGNOSING SELLER EARNINGS ISSUE');
  console.log('=====================================\n');

  try {
    // Step 1: Get seller info
    console.log('1. 📧 Finding seller: ashu@gmail.com');
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
    console.log('      Role:', seller.role);

    // Step 2: Check seller's products
    console.log('\n2. 📦 Checking seller products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', seller.id);

    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
    } else {
      console.log(`   ✅ Found ${products?.length || 0} products`);
      if (products && products.length > 0) {
        products.forEach((product, index) => {
          console.log(`      ${index + 1}. ${product.name}`);
          console.log(`         - ID: ${product.id}`);
          console.log(`         - Price: $${product.price}`);
          console.log(`         - Status: ${product.status}`);
          console.log(`         - Approval: ${product.approval_status}`);
        });
      }
    }

    // Step 3: Check orders containing seller's products
    console.log('\n3. 🛒 Checking orders with seller products...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            seller_id
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.log('❌ Error fetching orders:', ordersError.message);
    } else {
      // Filter orders that contain seller's products
      const sellerOrders = orders?.filter(order => 
        order.order_items?.some(item => item.products?.seller_id === seller.id)
      ) || [];

      console.log(`   ✅ Found ${sellerOrders.length} orders with seller products`);
      
      if (sellerOrders.length > 0) {
        sellerOrders.forEach((order, index) => {
          console.log(`\n      Order ${index + 1}:`);
          console.log(`         - Order ID: ${order.id}`);
          console.log(`         - Status: ${order.status}`);
          console.log(`         - Payment Status: ${order.payment_status}`);
          console.log(`         - Total: $${order.total_amount}`);
          console.log(`         - Created: ${new Date(order.created_at).toLocaleString()}`);
          
          const sellerItems = order.order_items?.filter(item => item.products?.seller_id === seller.id) || [];
          console.log(`         - Seller Items: ${sellerItems.length}`);
          sellerItems.forEach((item, idx) => {
            console.log(`            ${idx + 1}. ${item.products?.name} - $${item.price} x ${item.quantity}`);
          });
        });
      }
    }

    // Step 4: Check seller_earnings table
    console.log('\n4. 💰 Checking seller_earnings table...');
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', seller.id);

    if (earningsError) {
      console.log('❌ Error fetching earnings:', earningsError.message);
    } else {
      console.log(`   ✅ Found ${earnings?.length || 0} earnings records`);
      if (earnings && earnings.length > 0) {
        earnings.forEach((earning, index) => {
          console.log(`\n      Earning ${index + 1}:`);
          console.log(`         - ID: ${earning.id}`);
          console.log(`         - Order ID: ${earning.order_id}`);
          console.log(`         - Gross Amount: $${(earning.gross_amount / 100).toFixed(2)}`);
          console.log(`         - Commission: $${(earning.commission_amount / 100).toFixed(2)}`);
          console.log(`         - Net Amount: $${(earning.net_amount / 100).toFixed(2)}`);
          console.log(`         - Status: ${earning.status}`);
          console.log(`         - Created: ${new Date(earning.created_at).toLocaleString()}`);
        });
      } else {
        console.log('   ⚠️  NO EARNINGS RECORDS FOUND!');
        console.log('   This is the problem - earnings are not being created when orders are placed.');
      }
    }

    // Step 5: Check sub_orders table
    console.log('\n5. 📋 Checking sub_orders table...');
    const { data: subOrders, error: subOrdersError } = await supabase
      .from('sub_orders')
      .select('*')
      .eq('seller_id', seller.id);

    if (subOrdersError) {
      console.log('❌ Error fetching sub_orders:', subOrdersError.message);
    } else {
      console.log(`   ✅ Found ${subOrders?.length || 0} sub-orders`);
      if (subOrders && subOrders.length > 0) {
        subOrders.forEach((subOrder, index) => {
          console.log(`\n      Sub-Order ${index + 1}:`);
          console.log(`         - ID: ${subOrder.id}`);
          console.log(`         - Order ID: ${subOrder.order_id}`);
          console.log(`         - Subtotal: $${subOrder.subtotal}`);
          console.log(`         - Status: ${subOrder.status}`);
          console.log(`         - Created: ${new Date(subOrder.created_at).toLocaleString()}`);
        });
      }
    }

    // Step 6: Check payment_transactions table
    console.log('\n6. 💳 Checking payment_transactions table...');
    const { data: transactions, error: transactionsError } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.log('❌ Error fetching transactions:', transactionsError.message);
    } else {
      console.log(`   ✅ Found ${transactions?.length || 0} recent transactions`);
      if (transactions && transactions.length > 0) {
        transactions.forEach((txn, index) => {
          console.log(`\n      Transaction ${index + 1}:`);
          console.log(`         - ID: ${txn.id}`);
          console.log(`         - Order ID: ${txn.order_id}`);
          console.log(`         - Amount: $${(txn.amount / 100).toFixed(2)}`);
          console.log(`         - Status: ${txn.status}`);
          console.log(`         - Created: ${new Date(txn.created_at).toLocaleString()}`);
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Seller: ${seller.email} (${seller.id})`);
    console.log(`Products: ${products?.length || 0}`);
    console.log(`Orders with seller products: ${orders?.filter(o => o.order_items?.some(i => i.products?.seller_id === seller.id)).length || 0}`);
    console.log(`Earnings records: ${earnings?.length || 0}`);
    console.log(`Sub-orders: ${subOrders?.length || 0}`);
    
    console.log('\n🔍 ISSUE IDENTIFIED:');
    if (!earnings || earnings.length === 0) {
      console.log('❌ NO EARNINGS RECORDS EXIST');
      console.log('   The order creation process is NOT creating seller_earnings records.');
      console.log('   This needs to be fixed in the order creation/payment flow.');
    } else {
      console.log('✅ Earnings records exist');
      console.log('   Check if they have the correct status and amounts.');
    }

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error.message);
    console.error(error);
  }
}

diagnoseSellerEarnings();
