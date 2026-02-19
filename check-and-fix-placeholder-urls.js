/**
 * Check and Fix Placeholder URLs
 * Finds and updates any via.placeholder.com URLs in the database
 */

const supabase = require('./config/supabase');

// Inline SVG placeholder (400x400, gray background, "Product" text)
const INLINE_SVG_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3EProduct%3C/text%3E%3C/svg%3E';

async function checkAndFixPlaceholders() {
  try {
    console.log('🔍 Checking for placeholder URLs in database...\n');
    
    // Check for via.placeholder.com URLs
    const { data: viaPlaceholder, error: viaError } = await supabase
      .from('products')
      .select('id, title, image_url')
      .ilike('image_url', '%via.placeholder.com%');
    
    if (viaError) throw viaError;
    
    console.log(`📊 Products with via.placeholder.com: ${viaPlaceholder?.length || 0}`);
    
    if (viaPlaceholder && viaPlaceholder.length > 0) {
      console.log('\n📦 Found products with via.placeholder.com URLs:');
      viaPlaceholder.forEach((p, i) => {
        console.log(`${i + 1}. ${p.title}`);
        console.log(`   URL: ${p.image_url.substring(0, 80)}...`);
      });
      
      console.log('\n🔧 Updating to inline SVG...');
      
      const { data: updated, error: updateError } = await supabase
        .from('products')
        .update({ image_url: INLINE_SVG_PLACEHOLDER })
        .ilike('image_url', '%via.placeholder.com%')
        .select('id, title');
      
      if (updateError) throw updateError;
      
      console.log(`✅ Updated ${updated.length} products`);
    } else {
      console.log('✅ No via.placeholder.com URLs found');
    }
    
    // Check for placehold.co URLs (alternative service)
    const { data: placehold, error: placeholdError } = await supabase
      .from('products')
      .select('id, title, image_url')
      .ilike('image_url', '%placehold.co%');
    
    if (placeholdError) throw placeholdError;
    
    console.log(`\n📊 Products with placehold.co: ${placehold?.length || 0}`);
    
    if (placehold && placehold.length > 0) {
      console.log('ℹ️  placehold.co URLs are OK (alternative service)');
    }
    
    // Check for inline SVG (good)
    const { data: inlineSvg, error: svgError } = await supabase
      .from('products')
      .select('id, title')
      .ilike('image_url', 'data:image/svg+xml%');
    
    if (svgError) throw svgError;
    
    console.log(`📊 Products with inline SVG: ${inlineSvg?.length || 0}`);
    
    // Check for real image URLs (http/https)
    const { data: realImages, error: realError } = await supabase
      .from('products')
      .select('id, title')
      .or('image_url.ilike.%http://%.not.ilike.%placeholder%,image_url.ilike.%https://%.not.ilike.%placeholder%');
    
    if (realError) {
      console.log('ℹ️  Could not check real image URLs (complex query)');
    } else {
      console.log(`📊 Products with real image URLs: ${realImages?.length || 0}`);
    }
    
    console.log('\n✅ Check complete!');
    console.log('\n📝 Summary:');
    console.log(`   - via.placeholder.com: ${viaPlaceholder?.length || 0} (should be 0)`);
    console.log(`   - placehold.co: ${placehold?.length || 0} (OK)`);
    console.log(`   - Inline SVG: ${inlineSvg?.length || 0} (best)`);
    
    if (viaPlaceholder && viaPlaceholder.length === 0) {
      console.log('\n🎉 All good! No via.placeholder.com URLs found.');
      console.log('   The ERR_NAME_NOT_RESOLVED errors should be gone.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

checkAndFixPlaceholders();
