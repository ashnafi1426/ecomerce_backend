require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminCredentials() {
  console.log('🔍 Checking admin accounts...\n');

  const { data: admins, error } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .eq('role', 'admin');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (admins && admins.length > 0) {
    console.log('✅ Found admin accounts:');
    admins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Email: ${admin.email}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Created: ${admin.created_at}`);
    });
  } else {
    console.log('⚠️ No admin accounts found');
  }
}

checkAdminCredentials();
