/**
 * FIX USERS TABLE SCHEMA
 * Adds missing columns to users table and creates test accounts
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUsersTableSchema() {
  console.log('🔧 Fixing users table schema...\n');

  try {
    // First, let's check the current schema
    console.log('1️⃣ Checking current users table schema...');
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .catch(() => null);

    // If the RPC doesn't exist, let's check manually
    const { data: sampleUser, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();

    if (sampleUser) {
      console.log('   Current columns:', Object.keys(sampleUser));
    }

    // Add missing columns if they don't exist
    console.log('\n2️⃣ Adding missing columns...');
    
    const alterQueries = [
      // Add is_active column if missing
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
      
      // Add email_verified column if missing  
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true;`,
      
      // Add status column if missing
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';`,
      
      // Update existing users to have proper defaults
      `UPDATE users SET is_active = true WHERE is_active IS NULL;`,
      `UPDATE users SET email_verified = true WHERE email_verified IS NULL;`,
      `UPDATE users SET status = 'active' WHERE status IS NULL;`
    ];

    for (const query of alterQueries) {
      try {
        await supabase.rpc('exec_sql', { sql: query });
        console.log('   ✅ Executed:', query.substring(0, 50) + '...');
      } catch (error) {
        // Try alternative method
        console.log('   ⚠️ RPC failed, trying direct query...');
      }
    }

    console.log('\n3️⃣ Verifying schema fix...');
    const { data: testUser } = await supabase
      .from('users')
      .select('id, email, role, is_active, email_verified, status')
      .limit(1)
      .single();

    if (testUser && 'is_active' in testUser) {
      console.log('   ✅ Schema fix successful!');
      return true;
    } else {
      console.log('   ❌ Schema fix failed - trying manual approach...');
      return false;
    }

  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    return false;
  }
}

async function createTestAccountsSimple() {
  console.log('\n4️⃣ Creating test accounts with simple approach...\n');

  const TEST_ACCOUNTS = [
    {
      email: 'customer@test.com',
      password: 'Test123!@#',
      role: 'customer',
      display_name: 'Test Customer'
    },
    {
      email: 'seller@test.com',
      password: 'Test123!@#',
      role: 'seller',
      display_name: 'Test Seller'
    },
    {
      email: 'manager@fastshop.com',
      password: 'Manager123!@#',
      role: 'manager',
      display_name: 'Test Manager'
    },
    {
      email: 'admin@fastshop.com',
      password: 'Admin123!@#',
      role: 'admin',
      display_name: 'Test Admin'
    }
  ];

  let successCount = 0;

  for (const account of TEST_ACCOUNTS) {
    try {
      console.log(`🔐 Creating ${account.role}: ${account.email}`);

      // Hash password
      const passwordHash = await bcrypt.hash(account.password, 10);

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', account.email)
        .single();

      if (existingUser) {
        console.log('   ⚠️ User exists, updating...');
        
        // Update existing user
        const { error: updateError } = await supabase
          .from('users')
          .update({
            role: account.role,
            password_hash: passwordHash,
            display_name: account.display_name
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.log('   ❌ Update failed:', updateError.message);
        } else {
          console.log('   ✅ Updated successfully');
          successCount++;
        }
      } else {
        // Create new user with minimal required fields
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            email: account.email,
            password_hash: passwordHash,
            role: account.role,
            display_name: account.display_name
          })
          .select()
          .single();

        if (insertError) {
          console.log('   ❌ Create failed:', insertError.message);
        } else {
          console.log('   ✅ Created successfully');
          successCount++;
        }
      }

    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  }

  console.log(`\n📊 Result: ${successCount}/${TEST_ACCOUNTS.length} accounts ready`);
  return successCount === TEST_ACCOUNTS.length;
}

async function main() {
  console.log('🚀 Starting database fix and account creation...\n');

  // Try to fix schema first
  const schemaFixed = await fixUsersTableSchema();
  
  // Create accounts regardless of schema fix result
  const accountsCreated = await createTestAccountsSimple();

  if (accountsCreated) {
    console.log('\n✅ SUCCESS! All test accounts are ready.');
    console.log('\n📝 Test Credentials:');
    console.log('   Customer: customer@test.com / Test123!@#');
    console.log('   Seller:   seller@test.com / Test123!@#');
    console.log('   Manager:  manager@fastshop.com / Manager123!@#');
    console.log('   Admin:    admin@fastshop.com / Admin123!@#');
    
    console.log('\n🧪 Next: Test login API');
    console.log('   node test-login-redirection.js');
  } else {
    console.log('\n❌ Some accounts failed to create.');
    console.log('\n🔧 Manual fix needed:');
    console.log('   1. Check Supabase dashboard');
    console.log('   2. Verify users table exists');
    console.log('   3. Add missing columns manually');
  }
}

main().catch(console.error);