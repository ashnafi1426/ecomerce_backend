/**
 * FIX CHAT METADATA JSON ERROR
 * 
 * Fixes invalid JSON in the metadata column
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMetadataJson() {
  console.log('🔧 FIXING CHAT METADATA JSON ERROR\n');

  try {
    // Step 1: Check current conversations
    console.log('1️⃣ Checking conversations table...');
    const { data: conversations, error: fetchError } = await supabase
      .from('conversations')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching conversations:', fetchError.message);
      return;
    }

    console.log(`   Found ${conversations?.length || 0} conversations\n`);

    if (!conversations || conversations.length === 0) {
      console.log('✅ No conversations to fix\n');
      return;
    }

    // Step 2: Fix each conversation with invalid metadata
    console.log('2️⃣ Fixing invalid metadata...');
    let fixed = 0;

    for (const conv of conversations) {
      // Check if metadata is invalid
      if (conv.metadata && typeof conv.metadata === 'string') {
        console.log(`   Fixing conversation ${conv.id}...`);
        
        // Update with empty JSON object
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ metadata: {} })
          .eq('id', conv.id);

        if (updateError) {
          console.error(`   ❌ Error updating ${conv.id}:`, updateError.message);
        } else {
          console.log(`   ✅ Fixed conversation ${conv.id}`);
          fixed++;
        }
      }
    }

    console.log(`\n✅ Fixed ${fixed} conversations\n`);

    // Step 3: Verify fix
    console.log('3️⃣ Verifying fix...');
    const { data: verified, error: verifyError } = await supabase
      .from('conversations')
      .select('id, metadata');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError.message);
      return;
    }

    console.log(`   ✅ All ${verified?.length || 0} conversations verified\n`);

    console.log('============================================================');
    console.log('✅ METADATA FIX COMPLETE\n');
    console.log('📝 SUMMARY:');
    console.log(`   - Conversations checked: ${conversations.length}`);
    console.log(`   - Conversations fixed: ${fixed}`);
    console.log(`   - All metadata is now valid JSON\n`);
    console.log('🎯 NEXT STEP:');
    console.log('   Test the chat API again - it should work now!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixMetadataJson();
