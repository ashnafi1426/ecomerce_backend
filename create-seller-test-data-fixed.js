const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSellerTestData() {
  try {
    console.log('📦 CREATING SELLER TEST DATA');
    console.log('============================\n');

    // Get seller ID
    const { data: sellerData } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'ashu@gmail.com')
      .single();

    if (!sellerData) {
      console.log('❌ Seller not found');
      return;
    }

    const sellerId = sellerData.id;
    console.log('🆔 Seller ID:', sellerId);

    // Create parent orders first
    console.log('\n1. 📋 Creating parent orders...');
    const parentOrders = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '22222222-2222-2222-2222-222222222222', // Customer ID
        amount: 99900,
        status: 'paid',
        basket: [{ product_name: 'Test Laptop', price: 99900, quantity: 1 }],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        created_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        user_id: '22222222-2222-2222-2222-222222222222', // Customer ID
        amount: 2900,
        status: 'paid',
        basket: [{ product_name: 'Test Mouse', price: 2900, quantity: 1 }],
        shipping_address: { name: 'John Doe', address: '123 Main St' },
        created_at: new Date().toISOString()
      }
    ];

    for (const order of parentOrders) {
      const { error: orderError } = await supabase
        .from('orders')
        .upsert(order);

      if (orderError) {
        console.log(`   ❌ Failed to create parent order ${order.id}:`, orderError.message);
      } else {
        console.log(`   ✅ Created parent order: ${order.id}`);
      }
    }

    // Create sub-orders
    console.log('\n2. 📦 Creating sub-orders...');
    const subOrders = [
      {
        id: '44444444-4444-4444-4444-444444444444',
        parent_order_id: '11111111-1111-1111-1111-111111111111',
        seller_id: sellerId,
        items: [{ product_name: 'Test Laptop', price: 99900, quantity: 1 }],
        subtotal: 99900,
        total_amount: 99900,
        commission_rate: 15.00,
        commission_amount: 14985,
        seller_payout_amount: 84915,
        fulfillment_status: 'pending',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        parent_order_id: '33333333-3333-3333-3333-333333333333',
        seller_id: sellerId,
        items: [{ product_name: 'Test Mouse', price: 2900, quantity: 1 }],
        subtotal: 2900,
        total_amount: 2900,
        commission_rate: 15.00,
        commission_amount: 435,
        seller_payout_amount: 2465,
        fulfillment_status: 'shipped',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    for (const order of subOrders) {
      const { error: orderError } = await supabase
        .from('sub_orders')
        .upsert(order);

      if (orderError) {
        console.log(`   ❌ Failed to create sub-order ${order.id}:`, orderError.message);
      } else {
        console.log(`   ✅ Created sub-order: ${order.items[0].product_name}`);
      }
    }

    // Create products (check schema first)
    console.log('\n3. 🛍️ Creating products...');
    
    // Check products table schema
    const { data: productsSchema, error: schemaError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.log('   ❌ Products table error:', schemaError.message);
    } else {
      console.log('   ✅ Products table accessible');
      
      const testProducts = [
        {
          id: '66666666-6666-6666-6666-666666666666',
          seller_id: sellerId,
          title: 'Test Laptop Pro',
          price: 99900,
          approval_status: 'approved',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: '77777777-7777-7777-7777-777777777777',
          seller_id: sellerId,
          title: 'Test Wireless Mouse',
          price: 2900,
          approval_status: 'pending',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ];

      for (const product of testProducts) {
        const { error: productError } = await supabase
          .from('products')
          .upsert(product);

        if (productError) {
          console.log(`   ❌ Failed to create product ${product.title}:`, productError.message);
        } else {
          console.log(`   ✅ Created product: ${product.title}`);
        }
      }
    }

    // Create seller earnings records
    console.log('\n4. 💰 Creating seller earnings...');
    const earnings = [
      {
        id: '88888888-8888-8888-8888-888888888888',
        seller_id: sellerId,
        sub_order_id: '44444444-4444-4444-4444-444444444444',
        parent_order_id: '11111111-1111-1111-1111-111111111111',
        gross_amount: 99900,
        commission_amount: 14985,
        net_amount: 84915,
        status: 'pending',
        available_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString()
      },
      {
        id: '99999999-9999-9999-9999-999999999999',
        seller_id: sellerId,
        sub_order_id: '55555555-5555-5555-5555-555555555555',
        parent_order_id: '33333333-3333-3333-3333-333333333333',
        gross_amount: 2900,
        commission_amount: 435,
        net_amount: 2465,
        status: 'available',
        available_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      }
    ];

    for (const earning of earnings) {
      const { error: earningError } = await supabase
        .from('seller_earnings')
        .upsert(earning);

      if (earningError) {
        console.log(`   ❌ Failed to create earning record:`, earningError.message);
      } else {
        console.log(`   ✅ Created earning: $${(earning.net_amount / 100).toFixed(2)}`);
      }
    }

    console.log('\n🎉 SELLER TEST DATA CREATED!');
    console.log('============================');
    console.log('');
    console.log('📊 DATA SUMMARY:');
    console.log('   📦 2 parent orders created');
    console.log('   📋 2 sub-orders created');
    console.log('   🛍️ 2 products created');
    console.log('   💰 2 earnings records created');
    console.log('   💵 Total earnings: $874.80');
    console.log('');
    console.log('🚀 READY FOR DASHBOARD TESTING!');

  } catch (error) {
    console.error('💥 FAILED TO CREATE TEST DATA:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the setup
createSellerTestData();