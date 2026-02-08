/**
 * Cleanup Test Users
 * Manually delete test users from Phase 3 tests
 */

require('dotenv').config();
const supabase = require('./config/supabase');

const TEST_EMAILS = [
  'productseller@example.com',
  'productmanager@example.com',
  'customer@example.com',
];

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...\n');

  // First, delete all products created by test sellers
  console.log('Deleting test products...');
  for (const email of TEST_EMAILS) {
    try {
      // Get user ID
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (user) {
        // Delete products created by this user
        const { data: products, error: prodError } = await supabase
          .from('products')
          .delete()
          .eq('created_by', user.id)
          .select();

        if (prodError) {
          console.log(`  ⚠️  Error deleting products for ${email}:`, prodError.message);
        } else if (products && products.length > 0) {
          console.log(`  ✅ Deleted ${products.length} product(s) for ${email}`);
        }
      }
    } catch (err) {
      // Ignore errors
    }
  }

  // Now delete users
  console.log('\nDeleting test users...');
  for (const email of TEST_EMAILS) {
    try {
      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('email', email)
        .select();

      if (error) {
        console.log(`  ❌ Error deleting ${email}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`  ✅ Deleted user: ${email}`);
      } else {
        console.log(`  ⚠️  User not found: ${email}`);
      }
    } catch (err) {
      console.log(`  ❌ Exception deleting ${email}:`, err.message);
    }
  }

  console.log('\n✅ Cleanup complete');
}

cleanupTestUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
