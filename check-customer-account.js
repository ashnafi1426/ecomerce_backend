/**
 * CHECK CUSTOMER ACCOUNT
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCustomerAccount() {
  console.log('🔍 CHECKING CUSTOMER ACCOUNT\n');

  try {
    // Check for the customer email
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'ashenafisileshi7@gmail.com');

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Customer account NOT FOUND');
      console.log('   Email: ashenafisileshi7@gmail.com\n');
      console.log('📝 Creating customer account...\n');

      // Create the customer account
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('14263208@Aa', 10);

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'ashenafisileshi7@gmail.com',
          password_hash: hashedPassword,
          display_name: 'Ashenafi Customer',
          role: 'customer',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating account:', createError.message);
        return;
      }

      console.log('✅ Customer account created!');
      console.log('   ID:', newUser.id);
      console.log('   Email:', newUser.email);
      console.log('   Role:', newUser.role);
      console.log('   Status:', newUser.status);
    } else {
      console.log('✅ Customer account found!');
      console.log('   ID:', users[0].id);
      console.log('   Email:', users[0].email);
      console.log('   Role:', users[0].role);
      console.log('   Status:', users[0].status);
      console.log('   Display Name:', users[0].display_name);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCustomerAccount();
