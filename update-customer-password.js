/**
 * Update Customer Password
 */

const supabase = require('./config/supabase');
const bcrypt = require('bcrypt');

async function updatePassword() {
  const email = 'ashenafisileshi7@gmail.com';
  const newPassword = '14263208@aA';
  
  console.log(`🔐 Updating password for ${email}...`);
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  const { data, error } = await supabase
    .from('users')
    .update({ password_hash: hashedPassword })
    .eq('email', email)
    .select();
  
  if (error) {
    console.log(`❌ Failed: ${error.message}`);
  } else {
    console.log(`✅ Password updated successfully`);
    console.log(`   Email: ${email}`);
    console.log(`   New password: ${newPassword}`);
  }
}

updatePassword().catch(console.error);
