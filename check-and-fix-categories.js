/**
 * Check existing categories and add/update slugs
 */

const supabase = require('./config/supabase');

async function checkAndFixCategories() {
  try {
    console.log('🔍 Checking existing categories...\n');

    // Get all categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error fetching categories:', error);
      return;
    }

    console.log(`📂 Found ${categories?.length || 0} categories:\n`);
    
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        console.log(`  - ID: ${cat.id}, Name: "${cat.name}", Slug: "${cat.slug || 'NULL'}"`);
      });
    } else {
      console.log('  No categories found in database!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Creating/Updating categories with proper slugs...\n');

    // Define categories with slugs
    const categoriesToUpsert = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing and fashion items' },
      { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home and kitchen products' },
      { name: 'Books', slug: 'books', description: 'Books and reading materials' },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Sports and outdoor equipment' },
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Beauty and personal care products' },
      { name: 'Toys & Games', slug: 'toys-games', description: 'Toys and games for all ages' },
      { name: 'Automotive', slug: 'automotive', description: 'Automotive parts and accessories' }
    ];

    for (const category of categoriesToUpsert) {
      // Check if category exists
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('name', category.name)
        .single();

      if (existing) {
        // Update existing category with slug
        const { error: updateError } = await supabase
          .from('categories')
          .update({ 
            slug: category.slug,
            description: category.description 
          })
          .eq('id', existing.id);

        if (updateError) {
          console.log(`❌ Failed to update "${category.name}":`, updateError.message);
        } else {
          console.log(`✅ Updated "${category.name}" with slug "${category.slug}"`);
        }
      } else {
        // Insert new category
        const { error: insertError } = await supabase
          .from('categories')
          .insert({
            name: category.name,
            slug: category.slug,
            description: category.description
          });

        if (insertError) {
          console.log(`❌ Failed to create "${category.name}":`, insertError.message);
        } else {
          console.log(`✅ Created "${category.name}" with slug "${category.slug}"`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Verifying categories...\n');

    // Verify all categories now have slugs
    const { data: updatedCategories } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (updatedCategories && updatedCategories.length > 0) {
      updatedCategories.forEach(cat => {
        const status = cat.slug ? '✅' : '❌';
        console.log(`  ${status} ID: ${cat.id}, Name: "${cat.name}", Slug: "${cat.slug || 'NULL'}"`);
      });
    }

    console.log('\n✨ Category check and fix complete!');
    console.log('\n📝 Test the API:');
    console.log('   curl http://localhost:5000/api/categories/electronics/products');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndFixCategories();
