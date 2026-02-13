const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestSellerWithCredentials() {
  try {
    console.log('🔧 CREATING TEST SELLER WITH KNOWN CREDENTIALS');
    console.log('===============================================\n');

    // Test seller credentials
    const testSeller = {
      email: 'ashu@gmail.com',
      password: '14263208@Aa'
    };

    console.log('1. 🔍 Checking if seller already exists...');
    
    // Check if user already exists in auth
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', testSeller.email);

    if (existingUsers && existingUsers.length > 0) {
      console.log('   ✅ Seller already exists in users table');
      console.log('   📧 Email:', existingUsers[0].email);
      console.log('   🆔 ID:', existingUsers[0].id);
      console.log('   👤 Role:', existingUsers[0].role);

      // Try to update password using admin API
      console.log('\n2. 🔑 Updating password for existing user...');
      
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUsers[0].id,
        { password: testSeller.password }
      );

      if (updateError) {
        console.log('   ❌ Failed to update password:', updateError.message);
      } else {
        console.log('   ✅ Password updated successfully');
      }

      // Test authentication
      console.log('\n3. 🧪 Testing authentication...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testSeller.email,
        password: testSeller.password
      });

      if (authError) {
        console.log('   ❌ Authentication failed:', authError.message);
        
        // Try to create new user with same email (will replace existing)
        console.log('\n4. 🔄 Creating new user to replace existing...');
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: testSeller.email,
          password: testSeller.password,
          email_confirm: true
        });

        if (createError) {
          console.log('   ❌ Failed to create new user:', createError.message);
          return;
        }

        console.log('   ✅ New user created');
        console.log('   🆔 New ID:', newUser.user.id);

        // Update role in users table
        const { error: roleError } = await supabase
          .from('users')
          .upsert({
            id: newUser.user.id,
            email: testSeller.email,
            role: 'seller',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (roleError) {
          console.log('   ❌ Failed to update role:', roleError.message);
        } else {
          console.log('   ✅ Role updated to seller');
        }

      } else {
        console.log('   ✅ Authentication successful!');
        console.log('   📧 User:', authData.user.email);
        console.log('   🆔 User ID:', authData.user.id);
        
        await supabase.auth.signOut();
      }

    } else {
      console.log('   ⚠️ Seller does not exist, creating new one...');

      // Create new user
      console.log('\n2. 👤 Creating new seller account...');
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testSeller.email,
        password: testSeller.password,
        email_confirm: true
      });

      if (createError) {
        console.log('   ❌ Failed to create user:', createError.message);
        return;
      }

      console.log('   ✅ User created successfully');
      console.log('   🆔 User ID:', newUser.user.id);

      // Add to users table with seller role
      const { error: roleError } = await supabase
        .from('users')
        .insert({
          id: newUser.user.id,
          email: testSeller.email,
          role: 'seller',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (roleError) {
        console.log('   ❌ Failed to insert into users table:', roleError.message);
      } else {
        console.log('   ✅ Added to users table with seller role');
      }

      // Test authentication
      console.log('\n3. 🧪 Testing authentication...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testSeller.email,
        password: testSeller.password
      });

      if (authError) {
        console.log('   ❌ Authentication failed:', authError.message);
      } else {
        console.log('   ✅ Authentication successful!');
        console.log('   📧 User:', authData.user.email);
        console.log('   🆔 User ID:', authData.user.id);
        
        await supabase.auth.signOut();
      }
    }

    // Create some test data for the seller
    console.log('\n4. 📦 Creating test data for seller...');
    
    const { data: sellerData } = await supabase
      .from('users')
      .select('id')
      .eq('email', testSeller.email)
      .single();

    if (sellerData) {
      // Create test sub_orders
      const testOrders = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          parent_order_id: '22222222-2222-2222-2222-222222222222',
          seller_id: sellerData.id,
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
          id: '33333333-3333-3333-3333-333333333333',
          parent_order_id: '44444444-4444-4444-4444-444444444444',
          seller_id: sellerData.id,
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

      for (const order of testOrders) {
        const { error: orderError } = await supabase
          .from('sub_orders')
          .upsert(order);

        if (orderError) {
          console.log(`   ❌ Failed to create test order ${order.id}:`, orderError.message);
        } else {
          console.log(`   ✅ Created test order: ${order.items[0].product_name}`);
        }
      }

      // Create test products
      const testProducts = [
        {
          id: '55555555-5555-5555-5555-555555555555',
          seller_id: sellerData.id,
          title: 'Test Laptop Pro',
          name: 'Test Laptop Pro',
          price: 99900,
          approval_status: 'approved',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: '66666666-6666-6666-6666-666666666666',
          seller_id: sellerData.id,
          title: 'Test Wireless Mouse',
          name: 'Test Wireless Mouse',
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
          console.log(`   ❌ Failed to create test product ${product.title}:`, productError.message);
        } else {
          console.log(`   ✅ Created test product: ${product.title}`);
        }
      }
    }

    console.log('\n🎉 TEST SELLER SETUP COMPLETED!');
    console.log('================================');
    console.log('');
    console.log('📝 SELLER CREDENTIALS:');
    console.log('   📧 Email: ashu@gmail.com');
    console.log('   🔑 Password: 14263208@Aa');
    console.log('');
    console.log('📊 TEST DATA CREATED:');
    console.log('   📦 2 test orders (1 pending, 1 shipped)');
    console.log('   🛍️ 2 test products (1 approved, 1 pending)');
    console.log('   💰 Total revenue: $1,028.00');
    console.log('');
    console.log('🚀 READY FOR DASHBOARD TESTING!');

  } catch (error) {
    console.error('💥 SETUP FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the setup
createTestSellerWithCredentials();