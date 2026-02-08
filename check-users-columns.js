/**
 * CHECK USERS TABLE COLUMNS
 * Verify that Phase 5 columns exist in the users table
 */

const supabase = require('./config/supabase');

async function checkUsersColumns() {
  console.log('🔍 Checking users table columns...\n');

  try {
    // Query using raw SQL to bypass PostgREST cache
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name IN ('seller_verification_status', 'seller_verified_at', 'seller_verified_by')
        ORDER BY column_name;
      `
    });

    if (error) {
      // Try alternative method
      console.log('⚠️  RPC method not available, trying direct query...\n');
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role, seller_verification_status')
        .limit(1);

      if (userError) {
        console.error('❌ Error:', userError.message);
        console.log('\n💡 The column might not exist yet. Run the migration:');
        console.log('   node run-phase5-migration.js');
        return false;
      }

      console.log('✅ seller_verification_status column exists!');
      console.log('   Sample data:', userData);
      return true;
    }

    if (data && data.length > 0) {
      console.log('✅ Phase 5 columns found in users table:');
      data.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      return true;
    } else {
      console.log('❌ Phase 5 columns not found in users table');
      console.log('\n💡 Run the migration:');
      console.log('   node run-phase5-migration.js');
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

checkUsersColumns()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
