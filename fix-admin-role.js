/**
 * Fix Admin Role
 * Updates the user role to admin
 */

const supabase = require('./config/supabase');

async function fixAdminRole() {
  console.log('🔧 Fixing admin role...\n');

  try {
    // Update user role to admin
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', 'admin@fastshop.com')
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      console.log('✅ Admin role updated successfully!');
      console.log('   Email:', data[0].email);
      console.log('   Role:', data[0].role);
      console.log('\n🎉 You can now run tests!');
    } else {
      console.log('⚠️  User not found. Creating admin account...');
      
      // If user doesn't exist, try with admin@test.com
      const { data: data2, error: error2 } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', 'admin@test.com')
        .select();

      if (error2) throw error2;

      if (data2 && data2.length > 0) {
        console.log('✅ Admin role updated successfully!');
        console.log('   Email:', data2[0].email);
        console.log('   Role:', data2[0].role);
        console.log('\n🎉 You can now run tests!');
      } else {
        console.log('❌ No admin user found. Please create one first.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminRole();
