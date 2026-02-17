/**
 * Add slug column to categories and update existing categories
 * This script manually updates the categories table using Supabase client
 */

const supabase = require('./config/supabase');

async function addSlugColumn() {
  try {
    console.log('🚀 Adding slug column to categories...\n');

    // Define category slug mappings
    const categoryMappings = [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Fashion', slug: 'fashion' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Home & Kitchen', slug: 'home-kitchen' },
      { name: 'Home & Garden', slug: 'home-garden' },
      { name: 'Books', slug: 'books' },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
      { name: 'Toys & Games', slug: 'toys-games' },
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
      { name: 'Automotive', slug: 'automotive' },
      { name: 'Gold', slug: 'gold' }
    ];

    console.log('📝 Note: You need to add the slug column manually in Supabase SQL Editor first:\n');
    console.log('ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(100);');
    console.log('ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);');
    console.log('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);\n');
    console.log('After running the above SQL, press Enter to continue...\n');
    console.log('Or, if the column already exists, we will update the slugs now.\n');

    // Get all existing categories
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, slug');

    if (fetchError) {
      console.error('❌ Error fetching categories:', fetchError.message);
      console.log('\n⚠️  The slug column might not exist yet. Please run the SQL commands above in Supabase SQL Editor.');
      return;
    }

    console.log(`📂 Found ${existingCategories?.length || 0} existing categories\n`);

    // Update each category with its slug
    for (const mapping of categoryMappings) {
      const existingCategory = existingCategories?.find(c => c.name === mapping.name);
      
      if (existingCategory) {
        // Update existing category
        const { error: updateError } = await supabase
          .from('categories')
          .update({ slug: mapping.slug })
          .eq('id', existingCategory.id);

        if (updateError) {
          console.log(`❌ Failed to update "${mapping.name}":`, updateError.message);
        } else {
          console.log(`✅ Updated "${mapping.name}" → slug: "${mapping.slug}"`);
        }
      } else {
        // Create new category
        const { error: insertError } = await supabase
          .from('categories')
          .insert({
            name: mapping.name,
            slug: mapping.slug,
            description: `${mapping.name} products`
          });

        if (insertError) {
          console.log(`❌ Failed to create "${mapping.name}":`, insertError.message);
        } else {
          console.log(`✅ Created "${mapping.name}" → slug: "${mapping.slug}"`);
        }
      }
    }

    // Update any remaining categories without slugs
    const { data: categoriesWithoutSlugs } = await supabase
      .from('categories')
      .select('id, name, slug')
      .is('slug', null);

    if (categoriesWithoutSlugs && categoriesWithoutSlugs.length > 0) {
      console.log(`\n📝 Updating ${categoriesWithoutSlugs.length} categories without slugs...\n`);
      
      for (const category of categoriesWithoutSlugs) {
        const slug = category.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9-]/g, '');

        const { error } = await supabase
          .from('categories')
          .update({ slug })
          .eq('id', category.id);

        if (error) {
          console.log(`❌ Failed to update "${category.name}":`, error.message);
        } else {
          console.log(`✅ Updated "${category.name}" → slug: "${slug}"`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Verifying categories...\n');

    // Verify all categories now have slugs
    const { data: updatedCategories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');

    if (updatedCategories && updatedCategories.length > 0) {
      updatedCategories.forEach(cat => {
        const status = cat.slug ? '✅' : '❌';
        console.log(`  ${status} ${cat.name} → ${cat.slug || 'NO SLUG'}`);
      });
    }

    console.log('\n✨ Category slug update complete!');
    console.log('\n📝 Test the API:');
    console.log('   curl http://localhost:5000/api/categories/electronics/products');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addSlugColumn();
