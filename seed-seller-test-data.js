/**
 * Seed Test Data for Seller Dashboard
 * Run: node seed-seller-test-data.js
 */

const supabase = require('./config/supabase');

async function seedSellerTestData() {
  try {
    console.log('🌱 Starting seller test data seeding...\n');

    // Get the first seller user
    const { data: sellers, error: sellerError } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('role', 'seller')
      .limit(1);

    if (sellerError || !sellers || sellers.length === 0) {
      console.error('❌ No seller found. Please create a seller account first.');
      return;
    }

    const seller = sellers[0];
    console.log(`✅ Found seller: ${seller.email} (${seller.id})`);

    // Check if seller already has products
    const { count: existingProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', seller.id);

    if (existingProducts > 0) {
      console.log(`\n⚠️  Seller already has ${existingProducts} products.`);
      console.log('   Skipping product creation.');
    } else {
      // Create sample products
      console.log('\n📦 Creating sample products...');
      
      const sampleProducts = [
        {
          seller_id: seller.id,
          title: 'Wireless Bluetooth Headphones',
          description: 'Premium noise-cancelling headphones with 30-hour battery life',
          price: 79.99,
          sku: `SKU-${Date.now()}-001`,
          status: 'active',
          image_url: 'https://via.placeholder.com/400x400/667eea/ffffff?text=Headphones'
        },
        {
          seller_id: seller.id,
          title: 'Smart Watch Pro',
          description: 'Fitness tracker with heart rate monitor and GPS',
          price: 199.99,
          sku: `SKU-${Date.now()}-002`,
          status: 'active',
          image_url: 'https://via.placeholder.com/400x400/764ba2/ffffff?text=Smart+Watch'
        },
        {
          seller_id: seller.id,
          title: 'Portable Power Bank 20000mAh',
          description: 'Fast charging power bank with dual USB ports',
          price: 34.99,
          sku: `SKU-${Date.now()}-003`,
          status: 'active',
          image_url: 'https://via.placeholder.com/400x400/f093fb/ffffff?text=Power+Bank'
        },
        {
          seller_id: seller.id,
          title: 'USB-C Hub 7-in-1',
          description: 'Multi-port adapter with HDMI, USB 3.0, and SD card reader',
          price: 45.99,
          sku: `SKU-${Date.now()}-004`,
          status: 'pending',
          image_url: 'https://via.placeholder.com/400x400/4facfe/ffffff?text=USB+Hub'
        },
        {
          seller_id: seller.id,
          title: 'Mechanical Gaming Keyboard',
          description: 'RGB backlit keyboard with blue switches',
          price: 89.99,
          sku: `SKU-${Date.now()}-005`,
          status: 'active',
          image_url: 'https://via.placeholder.com/400x400/00f2fe/ffffff?text=Keyboard'
        }
      ];

      const { data: products, error: productError } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select();

      if (productError) {
        console.error('❌ Error creating products:', productError);
      } else {
        console.log(`✅ Created ${products.length} sample products`);
        
        // Create inventory records
        console.log('\n📊 Creating inventory records...');
        const inventoryRecords = products.map(product => ({
          product_id: product.id,
          quantity: Math.floor(Math.random() * 100) + 20,
          reserved_quantity: 0,
          low_stock_threshold: 10
        }));

        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert(inventoryRecords);

        if (inventoryError) {
          console.error('❌ Error creating inventory:', inventoryError);
        } else {
          console.log(`✅ Created inventory for ${inventoryRecords.length} products`);
        }
      }
    }

    // Initialize seller_performance
    console.log('\n📈 Initializing seller performance...');
    const { data: existingPerf } = await supabase
      .from('seller_performance')
      .select('*')
      .eq('seller_id', seller.id)
      .single();

    if (!existingPerf) {
      await supabase
        .from('seller_performance')
        .insert([{ seller_id: seller.id }]);
      console.log('✅ Created seller performance record');
    } else {
      console.log('✅ Seller performance record exists');
    }

    // Initialize seller_balances
    console.log('\n💰 Initializing seller balance...');
    const { data: existingBalance } = await supabase
      .from('seller_balances')
      .select('*')
      .eq('seller_id', seller.id)
      .single();

    if (!existingBalance) {
      await supabase
        .from('seller_balances')
        .insert([{ seller_id: seller.id }]);
      console.log('✅ Created seller balance record');
    } else {
      console.log('✅ Seller balance record exists');
    }

    console.log('\n✅ Seller test data seeding completed!');
    console.log(`\n📝 Seller: ${seller.email}`);
    console.log('   Products: Check your seller dashboard');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

seedSellerTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
