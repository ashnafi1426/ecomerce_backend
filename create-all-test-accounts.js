/**
 * CREATE ALL TEST ACCOUNTS
 * Creates test accounts for all roles with the exact credentials provided
 */

const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ACCOUNTS = [
  {
    email: 'customer@test.com',
    password: 'Test123!@#',
    role: 'customer',
    displayName: 'Test Customer'
  },
  {
    email: 'seller@test.com',
    password: 'Test123!@#',
    role: 'seller',
    displayName: 'Test Seller'
  },
  {
    email: 'manager@fastshop.com',
    password: 'Manager123!@#',
    role: 'manager',
    displayName: 'Test Manager'
  },
  {
    email: 'admin@fastshop.com',
    password: 'Admin123!@#',
    role: 'admin',
    displayName: 'Test Admin'
  }
];

async function createTestAccount(account) {
  try {
    console.log(`\n🔐 Creating ${account.role} account: ${account.email}`);

    // Hash the password
    const passwordHash = await bcrypt.hash(account.password, 10);

    // Check if account already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', account.email)
      .single();

    if (existingUser) {
      console.log(`   ⚠️ Account already exists`);
      
      // Update role if different
      if (existingUser.role !== account.role) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            role: account.role,
            password_hash: passwordHash,
            display_name: account.displayName,
            is_active: true,
            email_verified: true
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error(`   ❌ Error updating account:`, updateError.message);
          return false;
        } else {
          console.log(`   ✅ Updated role to ${account.role}`);
        }
      }
      return true;
    }

    // Create new account
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: account.email,
        password_hash: passwordHash,
        role: account.role,
        display_name: account.displayName,
        is_active: true,
        email_verified: true,
        status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error(`   ❌ Error creating account:`, insertError.message);
      return false;
    }

    console.log(`   ✅ Account created successfully (ID: ${newUser.id})`);
    return true;

  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function createAllTestAccounts() {
  console.log('🚀 Creating all test accounts...\n');

  let successCount = 0;
  
  for (const account of TEST_ACCOUNTS) {
    const success = await createTestAccount(account);
    if (success) successCount++;
  }

  console.log(`\n📊 Summary: ${successCount}/${TEST_ACCOUNTS.length} accounts created/updated successfully`);
  
  if (successCount === TEST_ACCOUNTS.length) {
    console.log('\n✅ ALL TEST ACCOUNTS READY!');
    console.log('\n📝 Login Credentials:');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ Role     │ Email                    │ Password      │ Redirect │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ Customer │ customer@test.com        │ Test123!@#    │ /        │');
    console.log('│ Seller   │ seller@test.com          │ Test123!@#    │ /seller  │');
    console.log('│ Manager  │ manager@fastshop.com     │ Manager123!@# │ /manager │');
    console.log('│ Admin    │ admin@fastshop.com       │ Admin123!@#   │ /admin   │');
    console.log('└─────────────────────────────────────────────────────────────┘');
    
    console.log('\n🌐 Test at: http://localhost:5173/login');
    console.log('\n🔍 Next Steps:');
    console.log('   1. Start backend: cd ecomerce_backend && npm start');
    console.log('   2. Start frontend: cd ecommerce_client && npm run dev');
    console.log('   3. Test each login at http://localhost:5173/login');
    console.log('   4. Verify each redirects to correct dashboard');
  } else {
    console.log('\n❌ Some accounts failed to create. Check errors above.');
    process.exit(1);
  }
}

// Run the script
createAllTestAccounts().catch(console.error);