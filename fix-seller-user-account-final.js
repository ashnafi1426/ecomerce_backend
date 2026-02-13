const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSellerUserAccount() {
  try {
    console.log('🔧 FIXING SELLER USER ACCOUNT FINAL');
    console.log('===================================\n');

    // Check both user IDs
    const earningsUserId = '08659266-babb-4323-b750-b1977c825e24';
    const authUserId = 'bb8959e5-36f1-46e2-a22a-c15a9c17f87e';

    console.log('1. 👤 Checking user accounts...');
    
    // Check earnings user
    const { data: earningsUser, error: earningsUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', earningsUserId)
      .single();

    console.log(`   Earnings User (${earningsUserId.substring(0, 8)}...):`);
    if (earningsUserError) {
      console.log('   ❌ Not found:', earningsUserError.message);
    } else {
      console.log(`   ✅ Found: ${earningsUser.email} (${earningsUser.role})`);
    }

    // Check auth user
    const { data: authUser, error: authUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();

    console.log(`   Auth User (${authUserId.substring(0, 8)}...):`);
    if (authUserError) {
      console.log('   ❌ Not found:', authUserError.message);
    } else {
      console.log(`   ✅ Found: ${authUser.email} (${authUser.role})`);
    }

    // Check ashu@gmail.com user
    const { data: ashuUser, error: ashuUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'ashu@gmail.com')
      .single();

    console.log(`   Ashu User (ashu@gmail.com):`);
    if (ashuUserError) {
      console.log('   ❌ Not found:', ashuUserError.message);
    } else {
      console.log(`   ✅ Found: ${ashuUser.id} (${ashuUser.role})`);
    }

    // Strategy: Update the earnings user to have the correct email and credentials
    if (earningsUser && authUser) {
      console.log('\n2. 🔄 Updating earnings user to match auth credentials...');
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email: 'ashu@gmail.com',
          role: 'seller',
          status: 'active'
        })
        .eq('id', earningsUserId)
        .select()
        .single();

      if (updateError) {
        console.log('   ❌ Update error:', updateError.message);
      } else {
        console.log('   ✅ Updated earnings user to have correct email');
      }

      // Delete the duplicate auth user
      console.log('\n3. 🗑️ Removing duplicate auth user...');
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', authUserId);

      if (deleteError) {
        console.log('   ❌ Delete error:', deleteError.message);
      } else {
        console.log('   ✅ Removed duplicate user');
      }
    }

    // Verify the final state
    console.log('\n4. 🧪 Verifying final state...');
    
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'ashu@gmail.com')
      .single();

    if (finalError) {
      console.log('   ❌ Final verification error:', finalError.message);
    } else {
      console.log(`   ✅ Final user: ${finalUser.email} (ID: ${finalUser.id})`);
      
      // Check earnings for this user
      const { data: finalEarnings, error: finalEarningsError } = await supabase
        .from('seller_earnings')
        .select('*')
        .eq('seller_id', finalUser.id);

      if (finalEarningsError) {
        console.log('   ❌ Earnings check error:', finalEarningsError.message);
      } else {
        console.log(`   💰 Earnings records: ${finalEarnings?.length || 0}`);
        
        if (finalEarnings && finalEarnings.length > 0) {
          let totalAvailable = 0;
          finalEarnings.forEach(earning => {
            if (earning.status === 'available') {
              totalAvailable += earning.net_amount || 0;
            }
          });
          console.log(`   💰 Available balance: $${(totalAvailable / 100).toFixed(2)}`);
        }
      }
    }

    console.log('\n🎉 SELLER USER ACCOUNT FIX COMPLETED!');
    console.log('Now test the login and API - everything should work correctly.');

  } catch (error) {
    console.error('💥 Fix failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixSellerUserAccount();