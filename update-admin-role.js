const supabase = require('./config/supabase');

async function updateAdminRole() {
  console.log('\n🔧 Updating testadmin@fastshop.com to admin role');
  console.log('='.repeat(50));
  
  try {
    // Update the user role
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'testadmin@fastshop.com')
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Successfully updated user role');
    console.log('\n📋 Updated User Details:');
    console.log('   Email:', data.email);
    console.log('   Role:', data.role);
    console.log('   ID:', data.id);
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: testadmin@fastshop.com');
    console.log('   Password: Admin@123');
    console.log('   Role: admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateAdminRole();
