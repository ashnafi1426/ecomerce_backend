const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSellerAuthentication() {
  try {
    console.log('🔐 TESTING SELLER AUTHENTICATION');
    console.log('================================\n');

    // Test credentials provided by user
    const testCredentials = [
      { email: 'ashu@gmail.com', password: '14263208@Aa' },
      { email: 'seller@test.com', password: 'password123' },
      { email: 'seller1@test.com', password: 'password123' }
    ];

    // First, let's try to create/reset the ashu@gmail.com account with the correct password
    console.log('🔧 Ensuring ashu@gmail.com account exists with correct password...');
    try {
      // Try to create the user (will fail if exists, but that's ok)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'ashu@gmail.com',
        password: '14263208@Aa',
        email_confirm: true
      });

      if (createError && !createError.message.includes('already registered')) {
        console.log('   ⚠️ Create user error:', createError.message);
      } else if (!createError) {
        console.log('   ✅ New user created:', newUser.user.email);
        
        // Update user role to seller
        const { error: updateError } = await supabase
          .from('users')
          .upsert({ 
            id: newUser.user.id, 
            email: newUser.user.email,
            role: 'seller' 
          });

        if (updateError) {
          console.log('   ⚠️ Role update error:', updateError.message);
        } else {
          console.log('   ✅ User role set to seller');
        }
      }
    } catch (err) {
      console.log('   ⚠️ Account setup error:', err.message);
    }

    for (const creds of testCredentials) {
      console.log(`🧪 Testing: ${creds.email} with password: ${creds.password}`);
      
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: creds.email,
          password: creds.password
        });

        if (authError) {
          console.log(`   ❌ Authentication failed: ${authError.message}`);
        } else {
          console.log(`   ✅ Authentication successful!`);
          console.log(`   📧 User: ${authData.user.email}`);
          console.log(`   🆔 User ID: ${authData.user.id}`);
          
          // Check user role
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', authData.user.id)
            .single();

          if (!userError && userData) {
            console.log(`   👤 Role: ${userData.role}`);
          }

          // Test dashboard data for this seller
          await testDashboardData(authData.user.id);
          
          // Sign out
          await supabase.auth.signOut();
          break; // Stop testing once we find working credentials
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('💥 TEST FAILED:', error.message);
  }
}

async function testDashboardData(sellerId) {
  console.log('\n📊 Testing dashboard data for seller:', sellerId);
  
  // Test orders
  const { data: orders, error: ordersError } = await supabase
    .from('sub_orders')
    .select(`
      id,
      parent_order_id,
      total_amount,
      fulfillment_status,
      created_at,
      items
    `)
    .eq('seller_id', sellerId)
    .limit(5);

  if (ordersError) {
    console.log('   ❌ Orders error:', ordersError.message);
  } else {
    console.log(`   📦 Orders found: ${orders.length}`);
    if (orders.length > 0) {
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100;
      console.log(`   💰 Total revenue: $${totalRevenue.toFixed(2)}`);
      
      console.log('   📋 Recent orders:');
      orders.forEach((order, index) => {
        console.log(`     ${index + 1}. Order ${order.id} - $${(order.total_amount / 100).toFixed(2)} - ${order.fulfillment_status}`);
      });
    }
  }

  // Test products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, name, price, approval_status, status')
    .eq('seller_id', sellerId)
    .limit(5);

  if (productsError) {
    console.log('   ❌ Products error:', productsError.message);
  } else {
    console.log(`   🛍️ Products found: ${products.length}`);
    if (products.length > 0) {
      const activeProducts = products.filter(p => p.approval_status === 'approved' || p.status === 'active').length;
      console.log(`   ✅ Active products: ${activeProducts}`);
      
      console.log('   📋 Products:');
      products.forEach((product, index) => {
        console.log(`     ${index + 1}. ${product.title || product.name} - $${product.price} - ${product.approval_status || product.status}`);
      });
    }
  }
}

// Run the test
testSellerAuthentication();