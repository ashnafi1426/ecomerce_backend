/**
 * Create Admin Account for Testing
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  console.log('🔧 Creating Admin Account...\n');
  
  const email = 'admin@fastshop.com';
  const password = 'Admin@123';
  
  // Check if admin exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (existing) {
    console.log('✅ Admin account already exists');
    console.log('   Email:', existing.email);
    console.log('   Role:', existing.role);
    
    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      })
      .eq('id', existing.id);
    
    if (error) {
      console.log('❌ Failed to update password:', error.message);
    } else {
      console.log('✅ Password updated');
    }
    
    return existing;
  }
  
  // Create new admin
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const { data: admin, error } = await supabase
    .from('users')
    .insert({
      email: email,
      password: hashedPassword,
      display_name: 'Admin User',
      role: 'admin',
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Failed to create admin:', error.message);
    return null;
  }
  
  console.log('✅ Admin account created');
  console.log('   Email:', admin.email);
  console.log('   Role:', admin.role);
  console.log('   ID:', admin.id);
  
  return admin;
}

createAdmin()
  .then(() => {
    console.log('\n✅ Done!');
    console.log('\nCredentials:');
    console.log('   Email: admin@fastshop.com');
    console.log('   Password: Admin@123');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
