/**
 * Setup test users for replacement system E2E tests
 */

const supabase = require('./config/supabase');
const bcrypt = require('bcrypt');

async function setupTestUsers() {
  console.log('🔧 Setting up test users for replacement system tests...\n');
  
  try {
    // Test user credentials
    const testUsers = [
      {
        email: 'customer@test.com',
        password: 'password123',
        full_name: 'Test Customer',
        role: 'customer'
      },
      {
        email: 'seller@test.com',
        password: 'password123',
        full_name: 'Test Seller',
        business_name: 'Test Seller Store',
        role: 'seller'
      }
    ];
    
    for (const user of testUsers) {
      // Check if user exists
      const { data: existing } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', user.email)
        .single();
      
      if (existing) {
        console.log(`✅ User already exists: ${user.email} (${existing.role})`);
        console.log(`   ID: ${existing.id}`);
        
        // Update role if needed
        if (existing.role !== user.role) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: user.role })
            .eq('id', existing.id);
          
          if (updateError) {
            console.error(`   ⚠️  Failed to update role: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated role to: ${user.role}`);
          }
        }
        continue;
      }
      
      // Create new user
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: user.email,
          password: hashedPassword,
          full_name: user.full_name,
          display_name: user.full_name,
          business_name: user.business_name || null,
          role: user.role,
          status: 'active',
          email_verified: true
        }])
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
        continue;
      }
      
      console.log(`✅ Created user: ${user.email} (${user.role})`);
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Name: ${newUser.full_name}`);
    }
    
    console.log('\n✅ Test users setup complete!');
    console.log('\nYou can now run the replacement system E2E tests:');
    console.log('   node test-replacement-system-e2e.js');
    
  } catch (error) {
    console.error('❌ Error setting up test users:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

setupTestUsers();
