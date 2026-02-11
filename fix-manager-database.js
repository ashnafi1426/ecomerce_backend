/**
 * FIX MANAGER PORTAL DATABASE
 * 
 * Adds missing columns needed for manager portal
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDatabase() {
  console.log('🔧 Fixing Manager Portal Database...\n');

  const fixes = [
    {
      name: 'Products - approval_status',
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'`
    },
    {
      name: 'Products - approved_at',
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`
    },
    {
      name: 'Products - approved_by',
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_by UUID`
    },
    {
      name: 'Disputes - escalated_at',
      sql: `ALTER TABLE disputes ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP`
    },
    {
      name: 'Disputes - escalated_to',
      sql: `ALTER TABLE disputes ADD COLUMN IF NOT EXISTS escalated_to UUID`
    },
    {
      name: 'Disputes - is_escalated',
      sql: `ALTER TABLE disputes ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE`
    },
    {
      name: 'Reviews - is_flagged',
      sql: `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE`
    },
    {
      name: 'Reviews - flagged_at',
      sql: `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP`
    },
    {
      name: 'Reviews - moderation_status',
      sql: `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved'`
    },
    {
      name: 'Returns - user_id',
      sql: `ALTER TABLE returns ADD COLUMN IF NOT EXISTS user_id UUID`
    },
    {
      name: 'Returns - seller_id',
      sql: `ALTER TABLE returns ADD COLUMN IF NOT EXISTS seller_id UUID`
    }
  ];

  let successCount = 0;
  let skipCount = 0;

  for (const fix of fixes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: fix.sql });
      
      if (error) {
        // Column might already exist
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⏭️  ${fix.name} - Already exists`);
          skipCount++;
        } else {
          console.log(`⚠️  ${fix.name} - ${error.message}`);
        }
      } else {
        console.log(`✅ ${fix.name} - Added`);
        successCount++;
      }
    } catch (err) {
      console.log(`⚠️  ${fix.name} - ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Added: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   📝 Total: ${fixes.length}`);

  console.log('\n🎉 Database fixes applied!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: node test-manager-portal-complete.js');
  console.log('   2. Expected: More tests passing');
}

fixDatabase().catch(error => {
  console.error('❌ Error:', error.message);
  console.error('\n💡 Manual fix required:');
  console.error('   Go to Supabase Dashboard > SQL Editor');
  console.error('   Run the SQL from: database/migrations/manager-portal-fixes.sql');
  process.exit(1);
});
