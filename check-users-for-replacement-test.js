/**
 * Check available users for replacement test
 */

const supabase = require('./config/supabase');

async function checkUsers() {
  console.log('Checking available users...\n');

  // Check sellers
  const { data: sellers, error: sellerError } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('role', 'seller')
    .limit(5);

  console.log('Sellers:');
  if (sellers && sellers.length > 0) {
    sellers.forEach(s => console.log(`  - ${s.full_name || s.email} (${s.id})`));
  } else {
    console.log('  No sellers found');
  }

  // Check customers
  const { data: customers, error: customerError } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('role', 'customer')
    .limit(5);

  console.log('\nCustomers:');
  if (customers && customers.length > 0) {
    customers.forEach(c => console.log(`  - ${c.full_name || c.email} (${c.id})`));
  } else {
    console.log('  No customers found');
  }

  // Check all users
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .limit(10);

  console.log('\nAll users (first 10):');
  if (allUsers && allUsers.length > 0) {
    allUsers.forEach(u => console.log(`  - ${u.full_name || u.email} (${u.role}) - ${u.id}`));
  } else {
    console.log('  No users found');
  }
}

checkUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
