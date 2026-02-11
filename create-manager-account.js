/**
 * CREATE MANAGER TEST ACCOUNT
 * 
 * Creates a manager account for testing the manager portal
 */

const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createManagerAccount() {
  try {
    console.log('🔐 Creating manager test account...\n');

    // Manager credentials
    const email = 'manager@fastshop.com';
    const password = 'Manager123!@#';
    const displayName = 'Test Manager';

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed');

    // Check if manager already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log(`\n⚠️ Manager account already exists:`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   ID: ${existingUser.id}`);

      // Update to manager role if not already
      if (existingUser.role !== 'manager') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'manager' })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('❌ Error updating role:', updateError.message);
        } else {
          console.log('✅ Updated role to manager');
        }
      }

      console.log(`\n✅ Manager account ready!`);
      console.log(`\n📝 Login Credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      return;
    }

    // Create new manager account
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        role: 'manager',
        display_name: displayName,
        is_active: true,
        email_verified: true
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log(`\n✅ Manager account created successfully!`);
    console.log(`\n📝 Account Details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Display Name: ${displayName}`);
    console.log(`   Role: manager`);
    console.log(`   ID: ${newUser.id}`);

    console.log(`\n🚀 You can now login at:`);
    console.log(`   http://localhost:5173/login`);
    console.log(`\n   After login, you'll be redirected to:`);
    console.log(`   http://localhost:5173/manager/dashboard`);

  } catch (error) {
    console.error('❌ Error creating manager account:', error.message);
    process.exit(1);
  }
}

// Run the script
createManagerAccount();
