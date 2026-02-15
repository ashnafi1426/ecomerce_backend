/**
 * Check Products Table Schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  try {
    console.log('🔍 Checking products table schema...\n');

    // Get one product to see the structure
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (products && products.length > 0) {
      console.log('✅ Products table columns:');
      console.log(Object.keys(products[0]).join(', '));
      console.log('\n📋 Sample product:');
      console.log(JSON.stringify(products[0], null, 2));
    } else {
      console.log('⚠️  No products found in database');
    }

    // Get all active products
    const { data: activeProducts, error: activeError } = await supabase
      .from('products')
      .select('id, title, price, status')
      .eq('status', 'active')
      .limit(5);

    if (!activeError && activeProducts) {
      console.log(`\n✅ Found ${activeProducts.length} active product(s):`);
      activeProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title} - $${p.price} (${p.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
