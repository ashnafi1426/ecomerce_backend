/**
 * Update passwords for test users
 */

const supabase = require('./config/supabase');
const bcrypt = require('bcrypt');

async function updatePasswords() {
  console.log('🔧 Updating test user passwords...\n');
  
  try {
    const testUsers = [
      { email: 'customer@test.com', password: 'password123' },
      { email: 'seller@test.com', password: 'password123' }
    ];
    
    for (const user of testUsers) {
      // Get user
      const { data: existing, error: fetchError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', user.email)
        .single();
      
      if (fetchError || !existing) {
        console.log(`❌ User not found: ${user.email}`);
        continue;
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error(`❌ Failed to update ${user.email}:`, updateError.message);
        continue;
      }
      
      console.log(`✅ Updated password for: ${user.email}`);
      console.log(`   ID: ${existing.id}`);
    }
    
    console.log('\n✅ Password update complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

updatePasswords();
