/**
 * Check Test Accounts for Notification Testing
 */

const supabase = require('./config/supabase');
const bcrypt = require('bcrypt');
const axios = require('axios');

const TEST_ACCOUNTS = [
  {
    email: 'ashenafisileshi7@gmail.com',
    password: '14263208@aA',
    role: 'customer',
    display_name: 'Ashenafi Sileshi'
  },
  {
    email: 'ashu@gmail.com',
    password: '14263208@aA',
    role: 'seller',
    display_name: 'Ashu Seller'
  }
];

async function checkAndCreateAccounts() {
  console.log('🔍 CHECKING TEST ACCOUNTS');
  console.log('=' .repeat(80));
  
  for (const account of TEST_ACCOUNTS) {
    console.log(`\n📧 ${account.email} (${account.role})`);
    
    // Check if exists
    const { data: existing, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', account.email)
      .single();
    
    if (existing) {
      console.log(`✅ Account exists - ID: ${existing.id}`);
      console.log(`   Status: ${existing.status}`);
      
      // Test login
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: account.email,
          password: account.password
        });
        console.log(`✅ Login works - Token received`);
      } catch (err) {
        console.log(`❌ Login failed: ${err.response?.data?.message || err.message}`);
        console.log(`   This might be a password mismatch`);
      }
    } else {
      console.log(`❌ Account does not exist`);
      console.log(`   Creating account...`);
      
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: account.email,
          password_hash: hashedPassword,
          role: account.role,
          display_name: account.display_name,
          status: 'active',
          email_verified: true
        })
        .select()
        .single();
      
      if (createError) {
        console.log(`❌ Failed to create: ${createError.message}`);
      } else {
        console.log(`✅ Account created - ID: ${newUser.id}`);
        
        // Create store for seller
        if (account.role === 'seller') {
          const { error: storeError } = await supabase
            .from('stores')
            .insert({
              seller_id: newUser.id,
              store_name: `${account.display_name}'s Store`,
              status: 'active'
            });
          
          if (!storeError) {
            console.log(`✅ Store created`);
          }
        }
        
        // Test login
        await new Promise(r => setTimeout(r, 1000));
        try {
          const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: account.email,
            password: account.password
          });
          console.log(`✅ Login works - Token received`);
        } catch (err) {
          console.log(`❌ Login failed: ${err.response?.data?.message || err.message}`);
        }
      }
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('✅ CHECK COMPLETE');
  console.log('\nRun notification test:');
  console.log('  node ../../../../../test-complete-notification-flow-e2e.js');
  console.log('=' .repeat(80));
}

checkAndCreateAccounts().catch(console.error);
