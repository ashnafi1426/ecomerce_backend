/**
 * Set Products to Pending Status
 * This script sets some products back to pending status for testing the approval workflow
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setProductsToPending() {
  console.log('\n========================================');
  console.log('SET PRODUCTS TO PENDING STATUS');
  console.log('========================================\n');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get all approved products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, title, approval_status, seller_id')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10); // Only update the 10 most recent products

    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError.message);
      return;
    }

    console.log(`Found ${products.length} approved products`);
    console.log('\nSetting these products to PENDING status:\n');

    for (const product of products) {
      console.log(`  - ${product.title} (ID: ${product.id})`);
    }

    // Update products to pending
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        approval_status: 'pending',
        approved_by: null,
        approved_at: null
      })
      .in('id', products.map(p => p.id))
      .select();

    if (updateError) {
      console.error('\n❌ Error updating products:', updateError.message);
      return;
    }

    console.log(`\n✅ Successfully set ${updated.length} products to PENDING status`);
    console.log('\nThese products will now:');
    console.log('  ❌ NOT appear on the homepage');
    console.log('  ✅ Appear in Manager\'s approval queue');
    console.log('  ✅ Only show on homepage after manager approval');

    console.log('\n========================================');
    console.log('COMPLETE');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
  }
}

setProductsToPending();
