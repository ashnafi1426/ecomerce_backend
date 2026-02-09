/**
 * CHECK MANAGER ACCOUNTS
 * Check if any manager accounts exist
 */

const supabase = require('./config/supabase');

async function checkManagers() {
  console.log('\n🔍 Checking Manager Accounts...\n');

  try {
    // Check for managers
    const { data: managers, error } = await supabase
      .from('users')
      .select('id, email, role, display_name, status, created_at')
      .eq('role', 'manager');
    
    if (error) {
      console.log('❌ Error querying managers:', error.message);
      return;
    }
    
    if (managers.length === 0) {
      console.log('⚠️  No manager accounts found in database\n');
      console.log('Managers must be created by admins.');
      console.log('Run: node create-manager-account.js\n');
    } else {
      console.log(`✅ Found ${managers.length} manager account(s):\n`);
      managers.forEach(manager => {
        console.log(`   Email: ${manager.email}`);
        console.log(`   Name: ${manager.display_name || 'N/A'}`);
        console.log(`   Status: ${manager.status}`);
        console.log(`   Created: ${new Date(manager.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }

    // Check for admins
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, email, role, display_name, status')
      .eq('role', 'admin');
    
    if (!adminError && admins.length > 0) {
      console.log(`\n✅ Found ${admins.length} admin account(s):`);
      admins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.status})`);
      });
    } else {
      console.log('\n⚠️  No admin accounts found');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkManagers();
