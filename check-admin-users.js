/**
 * Check what admin users exist in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Debug - Environment variables:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking for admin users in database...\n');

    // Get all users with admin role
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id, email, role, status, created_at')
      .eq('role', 'admin');

    if (adminError) {
      console.error('❌ Error fetching admin users:', adminError.message);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️ No admin users found in database');
      
      // Check for any users with admin-like emails
      const { data: possibleAdmins, error: possibleError } = await supabase
        .from('users')
        .select('id, email, role, status')
        .or('email.ilike.%admin%,email.ilike.%ashu%');

      if (!possibleError && possibleAdmins && possibleAdmins.length > 0) {
        console.log('\n📋 Found users with admin-like emails:');
        possibleAdmins.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.status}`);
        });
      }
      
      return;
    }

    console.log(`✅ Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.status} (created: ${user.created_at})`);
    });

    // Also check for manager users (they might have admin-like permissions)
    const { data: managerUsers, error: managerError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('role', 'manager');

    if (!managerError && managerUsers && managerUsers.length > 0) {
      console.log(`\n👔 Found ${managerUsers.length} manager user(s):`);
      managerUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.status}`);
      });
    }

    // Get total user count by role
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('role');

    if (!allError && allUsers) {
      const roleCounts = {};
      allUsers.forEach(user => {
        const role = user.role || 'unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      console.log('\n📊 User counts by role:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminUsers();