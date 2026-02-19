/**
 * Fix Placeholder Image URLs in Database
 * Replaces via.placeholder.com URLs with inline SVG data URLs
 * This fixes ERR_NAME_NOT_RESOLVED errors
 */

const supabase = require('./config/supabase');

// Inline SVG placeholder (400x400, gray background, "Product" text)
const INLINE_SVG_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3EProduct%3C/text%3E%3C/svg%3E';

async function fixPlaceholderImages() {
  try {
    console.log('🔍 Checking for products with via.placeholder.com URLs...\n');
    
    // Find all products with via.placeholder.com URLs
    const { data: products, error: selectError } = await supabase
      .from('products')
      .select('id, title, image_url')
      .ilike('image_url', '%via.placeholder.com%');
    
    if (selectError) {
      throw selectError;
    }
    
    if (!products || products.length === 0) {
      console.log('✅ No products found with via.placeholder.com URLs');
      console.log('✅ All placeholder images are already fixed!');
      return;
    }
    
    console.log(`📦 Found ${products.length} products with via.placeholder.com URLs:\n`);
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   Old URL: ${p.image_url.substring(0, 80)}...`);
    });
    
    console.log('\n🔧 Updating products with inline SVG placeholder...\n');
    
    // Update all products
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ image_url: INLINE_SVG_PLACEHOLDER })
      .ilike('image_url', '%via.placeholder.com%')
      .select('id, title');
    
    if (updateError) {
      throw updateError;
    }
    
    console.log(`✅ Successfully updated ${updated.length} products!\n`);
    
    // Verify fix
    const { data: remaining, error: verifyError } = await supabase
      .from('products')
      .select('id')
      .ilike('image_url', '%via.placeholder.com%');
    
    if (verifyError) {
      throw verifyError;
    }
    
    if (remaining && remaining.length > 0) {
      console.log(`⚠️ Warning: ${remaining.length} products still have via.placeholder.com URLs`);
    } else {
      console.log('✅ Verification complete: No via.placeholder.com URLs remaining');
    }
    
    console.log('\n📊 Summary:');
    console.log(`   - Products updated: ${updated.length}`);
    console.log(`   - New placeholder: Inline SVG (no network requests)`);
    console.log(`   - Benefits: Works offline, instant loading, no DNS errors`);
    console.log('\n✅ Fix complete! Refresh your browser to see the changes.');
    
  } catch (error) {
    console.error('❌ Error fixing placeholder images:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the fix
fixPlaceholderImages();
