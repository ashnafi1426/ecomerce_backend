const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSellerAccounts() {
  try {
    console.log('🔍 CHECKING SELLER ACCOUNTS');
    console.log('===========================\n');

    // Get all seller accounts
    const { data: sellers, error: sellersError } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .eq('role', 'seller')
      .order('created_at', { ascending: false });

    if (sellersError) {
      console.log('❌ Error fetching sellers:', sellersError.message);
      return;
    }

    console.log('📊 SELLER ACCOUNTS FOUND:', sellers.length);
    console.log('');

    if (sellers.length > 0) {
      console.log('📋 SELLER LIST:');
      sellers.forEach((seller, index) => {
        console.log(`   ${index + 1}. ${seller.email}`);
        console.log(`      - ID: ${seller.id}`);
        console.log(`      - Role: ${seller.role}`);
        console.log(`      - Created: ${new Date(seller.created_at).toLocaleDateString()}`);
        console.log('');
      });

      // Test with the first seller
      const testSeller = sellers[0];
      console.log('🧪 TESTING WITH FIRST SELLER:', testSeller.email);
      
      // Check if this seller has orders
      const { data: orders, error: ordersError } = await supabase
        .from('sub_orders')
        .select('id, total_amount, fulfillment_status, created_at')
        .eq('seller_id', testSeller.id)
        .limit(5);

      if (!ordersError) {
        console.log('   📦 Orders found:', orders.length);
        if (orders.length > 0) {
          console.log('   💰 Total revenue:', orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 100, 'dollars');
        }
      }

      // Check if this seller has products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, approval_status')
        .eq('seller_id', testSeller.id)
        .limit(5);

      if (!productsError) {
        console.log('   🛍️ Products found:', products.length);
        if (products.length > 0) {
          const activeProducts = products.filter(p => p.approval_status === 'approved').length;
          console.log('   ✅ Active products:', activeProducts);
        }
      }

    } else {
      console.log('⚠️ No seller accounts found');
      console.log('');
      console.log('🔧 CREATING TEST SELLER ACCOUNT...');
      
      // Create a test seller account
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'test-seller@example.com',
        password: 'TestPassword123!',
        email_confirm: true
      });

      if (createError) {
        console.log('❌ Failed to create test seller:', createError.message);
        return;
      }

      // Update user role to seller
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'seller' })
        .eq('id', newUser.user.id);

      if (updateError) {
        console.log('❌ Failed to update user role:', updateError.message);
        return;
      }

      console.log('✅ Test seller created:');
      console.log('   📧 Email: test-seller@example.com');
      console.log('   🔑 Password: TestPassword123!');
      console.log('   🆔 ID:', newUser.user.id);
    }

    console.log('\n🎉 SELLER ACCOUNT CHECK COMPLETED!');

  } catch (error) {
    console.error('💥 ERROR:', error.message);
  }
}

// Run the check
checkSellerAccounts();