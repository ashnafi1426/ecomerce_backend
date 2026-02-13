const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSellerTestData() {
  try {
    console.log('🏗️ CREATING SELLER TEST DATA');
    console.log('============================\n');

    // Get the seller ID for ashu@gmail.com
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'ashu@gmail.com')
      .single();

    if (sellerError || !seller) {
      console.log('❌ Seller not found:', sellerError?.message);
      return;
    }

    const sellerId = seller.id;
    console.log('👤 Creating test data for seller:', seller.email);
    console.log('🆔 Seller ID:', sellerId);

    // 1. Create test products
    console.log('\n📦 Creating test products...');
    const testProducts = [
      {
        seller_id: sellerId,
        title: 'Test Product 1',
        description: 'A great test product for testing purposes',
        price: 2999, // $29.99
        sku: 'TEST-001',
        category: 'Electronics',
        approval_status: 'approved',
        status: 'active',
        average_rating: 4.5,
        total_reviews: 12
      },
      {
        seller_id: sellerId,
        title: 'Test Product 2',
        description: 'Another excellent test product',
        price: 4999, // $49.99
        sku: 'TEST-002',
        category: 'Fashion',
        approval_status: 'pending',
        status: 'draft',
        average_rating: 0,
        total_reviews: 0
      },
      {
        seller_id: sellerId,
        title: 'Test Product 3',
        description: 'Premium test product',
        price: 7999, // $79.99
        sku: 'TEST-003',
        category: 'Home',
        approval_status: 'approved',
        status: 'active',
        average_rating: 4.8,
        total_reviews: 25
      }
    ];

    for (const product of testProducts) {
      try {
        const { data: insertedProduct, error: productError } = await supabase
          .from('products')
          .insert(product)
          .select()
          .single();

        if (productError) {
          console.log(`   ❌ Failed to create product "${product.title}":`, productError.message);
        } else {
          console.log(`   ✅ Created product: ${insertedProduct.title} - $${(insertedProduct.price / 100).toFixed(2)}`);
          
          // Create inventory for this pr