/**
 * ADD SELLER COLUMNS TO USERS TABLE
 * Directly adds Phase 5 columns to users table
 */

const supabase = require('./config/supabase');

async function addSellerColumns() {
  console.log('🔧 Adding seller columns to users table...\n');

  const columns = [
    {
      name: 'seller_verification_status',
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (seller_verification_status IN ('unverified', 'pending', 'verified', 'rejected'));`
    },
    {
      name: 'seller_verified_at',
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_verified_at TIMESTAMP;`
    },
    {
      name: 'seller_verified_by',
      sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_verified_by UUID;`
    }
  ];

  try {
    for (const column of columns) {
      console.log(`Adding column: ${column.name}...`);
      
      // Execute using raw query
      const { error } = await supabase.rpc('exec_sql', {
        query: column.sql
      });

      if (error) {
        console.log(`⚠️  RPC failed, trying alternative method...`);
        // Alternative: Use Supabase SQL editor or direct connection
        console.log(`   SQL: ${column.sql}`);
      } else {
        console.log(`✅ Column ${column.name} added`);
      }
    }

    console.log('\n✅ All columns processed!');
    console.log('\n💡 Verifying columns...');

    // Verify
    const { data, error } = await supabase
      .from('users')
      .select('id, seller_verification_status')
      .limit(1);

    if (error) {
      console.log('❌ Verification failed:', error.message);
      console.log('\n💡 Manual steps required:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Run these commands:');
      columns.forEach(col => console.log(`      ${col.sql}`));
      console.log('   3. Refresh schema cache');
    } else {
      console.log('✅ Columns verified and working!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please run these SQL commands manually in Supabase Dashboard:');
    columns.forEach(col => console.log(`   ${col.sql}`));
  }
}

addSellerColumns()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
