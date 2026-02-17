/**
 * Complete Category Fix Script
 * This script will guide you through fixing the category slug issue
 */

const supabase = require('./config/supabase');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixCategories() {
  console.log('🔧 FastShop Category Fix Tool\n');
  console.log('='.repeat(60));
  console.log('This tool will fix the category slug issue in 2 steps:\n');
  console.log('Step 1: Add slug column to categories table (manual SQL)');
  console.log('Step 2: Populate slugs for all categories (automatic)\n');
  console.log('='.repeat(60));

  try {
    // Check if slug column exists
    console.log('\n📊 Checking current database state...\n');
    
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(1);

    let slugColumnExists = false;

    if (fetchError) {
      if (fetchError.message.includes('slug')) {
        console.log('❌ Slug column does NOT exist in categories table\n');
        slugColumnExists = false;
      } else {
        console.error('❌ Error checking database:', fetchError.message);
        rl.close();
        return;
      }
    } else {
      console.log('✅ Slug column EXISTS in categories table\n');
      slugColumnExists = true;
    }

    // Step 1: Add slug column (if needed)
    if (!slugColumnExists) {
      console.log('📝 STEP 1: Add Slug Column to Database\n');
      console.log('You need to run this SQL in your Supabase SQL Editor:\n');
      console.log('─'.repeat(60));
      console.log('ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(100);');
      console.log('ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);');
      console.log('CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);');
      console.log('─'.repeat(60));
      console.log('\nHow to run:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Click "New Query"');
      console.log('4. Copy and paste the SQL above');
      console.log('5. Click "Run" or press Ctrl+Enter\n');
      
      const answer = await question('Have you run the SQL? (yes/no): ');
      
      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\n⚠️  Please run the SQL first, then run this script again.');
        rl.close();
        return;
      }

      console.log('\n✅ Great! Continuing to Step 2...\n');
    } else {
      console.log('✅ Slug column already exists. Skipping Step 1.\n');
    }

    // Step 2: Populate slugs
    console.log('📝 STEP 2: Populate Category Slugs\n');

    // Define category slug mappings
    const categoryMappings = [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets' },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing and fashion items' },
      { name: 'Clothing', slug: 'clothing', description: 'Clothing and apparel' },
      { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home and kitchen products' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home and garden products' },
      { name: 'Books', slug: 'books', description: 'Books and reading materials' },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Sports and outdoor equipment' },
      { name: 'Toys & Games', slug: 'toys-games', description: 'Toys and games for all ages' },
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Beauty and personal care products' },
      { name: 'Automotive', slug: 'automotive', description: 'Automotive parts and accessories' },
      { name: 'Gold', slug: 'gold', description: 'Gold and jewelry products' }
    ];

    // Get all existing categories
    const { data: existingCategories, error: fetchError2 } = await supabase
      .from('categories')
      .select('id, name, slug');

    if (fetchError2) {
      console.error('❌ Error fetching categories:', fetchError2.message);
      rl.close();
      return;
    }

    console.log(`📂 Found ${existingCategories?.length || 0} existing categories\n`);

    let updated = 0;
    let created = 0;
    let failed = 0;

    // Update/create each category
    for (const mapping of categoryMappings) {
      const existingCategory = existingCategories?.find(c => c.name === mapping.name);
      
      if (existingCategory) {
        // Update existing category
        const { error: updateError } = await supabase
          .from('categories')
          .update({ slug: mapping.slug, description: mapping.description })
          .eq('id', existingCategory.id);

        if (updateError) {
          console.log(`❌ Failed to update "${mapping.name}":`, updateError.message);
          failed++;
        } else {
          console.log(`✅ Updated "${mapping.name}" → slug: "${mapping.slug}"`);
          updated++;
        }
      } else {
        // Create new category
        const { error: insertError } = await supabase
          .from('categories')
          .insert({
            name: mapping.name,
            slug: mapping.slug,
            description: mapping.description
          });

        if (insertError) {
          console.log(`❌ Failed to create "${mapping.name}":`, insertError.message);
          failed++;
        } else {
          console.log(`✅ Created "${mapping.name}" → slug: "${mapping.slug}"`);
          created++;
        }
      }
    }

    // Update any remaining categories without slugs
    const { data: categoriesWithoutSlugs } = await supabase
      .from('categories')
      .select('id, name, slug')
      .is('slug', null);

    if (categoriesWithoutSlugs && categoriesWithoutSlugs.length > 0) {
      console.log(`\n📝 Updating ${categoriesWithoutSlugs.length} other categories...\n`);
      
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
          failed++;
        } else {
          console.log(`✅ Updated "${category.name}" → slug: "${slug}"`);
          updated++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary\n');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ➕ Created: ${created}`);
    console.log(`   ❌ Failed: ${failed}`);

    // Verify all categories
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Verifying all categories...\n');

    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');

    if (allCategories && allCategories.length > 0) {
      allCategories.forEach(cat => {
        const status = cat.slug ? '✅' : '❌';
        console.log(`  ${status} ${cat.name.padEnd(25)} → ${cat.slug || 'NO SLUG'}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Category fix complete!\n');
    console.log('📝 Next Steps:\n');
    console.log('1. Test the API:');
    console.log('   node test-category-slugs.js\n');
    console.log('2. Test in browser:');
    console.log('   - Start backend: npm start');
    console.log('   - Start frontend: cd ../Ecomerce_client/ecommerce_client && npm run dev');
    console.log('   - Open http://localhost:3001');
    console.log('   - Click "All" dropdown and select a category\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
  }
}

fixCategories();
