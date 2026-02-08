/**
 * PROPER DATABASE SEEDING SCRIPT
 * 
 * Seeds the database with sample data matching the actual schema
 */

const supabase = require('./config/supabase');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    console.log(`✅ Found ${categories.length} categories`);

    // Get customer users
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'customer')
      .limit(3);

    console.log(`✅ Found ${users.length} customer users\n`);

    // Check existing products
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id');

    console.log(`📦 Existing products: ${existingProducts.length}`);

    // Only create products if we have less than 5
    if (existingProducts.length < 5) {
      console.log('📦 Creating sample products...');
      
      const sampleProducts = [
        {
          title: 'Premium Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          price: 149.99,
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          category_id: categories[0]?.id,
          status: 'active'
        },
        {
          title: 'Smart Watch Pro',
          description: 'Advanced fitness tracking and notifications',
          price: 299.99,
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
          category_id: categories[0]?.id,
          status: 'active'
        },
        {
          title: 'Laptop Computer 15"',
          description: 'Powerful laptop with Intel i7, 16GB RAM',
          price: 899.99,
          image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
          category_id: categories[0]?.id,
          status: 'active'
        },
        {
          title: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse',
          price: 29.99,
          image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500',
          category_id: categories[0]?.id,
          status: 'active'
        },
        {
          title: 'Mechanical Keyboard',
          description: 'RGB backlit mechanical keyboard',
          price: 79.99,
          image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
          category_id: categories[0]?.id,
          status: 'active'
        },
        {
          title: 'USB-C Hub',
          description: '7-in-1 USB-C hub with HDMI',
          price: 39.99,
          image_url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500',
          category_id: categories[0]?.id,
          status: 'active'
        },
        {
          title: 'Portable SSD 1TB',
          description: 'Fast external SSD',
          price: 129.99,
          image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500',
          category_id: categories[0]?.id,
          status: 'active'
        }
      ];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select();

      if (productsError) {
        console.error('❌ Error creating products:', productsError);
        return;
      }

      console.log(`✅ Created ${products.length} products\n`);

      // Create inventory
      console.log('📊 Creating inventory...');
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
        console.log(`✅ Created ${inventoryRecords.length} inventory records\n`);
      }
    }

    // Get all products for orders
    const { data: allProducts } = await supabase
      .from('products')
      .select('*')
      .limit(10);

    // Create sample orders
    if (users && users.length > 0 && allProducts && allProducts.length > 0) {
      console.log('🛒 Creating sample orders...');
      
      const sampleOrders = [
        {
          user_id: users[0].id,
          payment_intent_id: `pi_${Date.now()}_1`,
          amount: 17998, // $179.98 in cents
          basket: JSON.stringify([
            { id: allProducts[0].id, title: allProducts[0].title, price: allProducts[0].price, quantity: 1 },
            { id: allProducts[1].id, title: allProducts[1].title, price: allProducts[1].price, quantity: 1 }
          ]),
          shipping_address: JSON.stringify({
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001'
          }),
          status: 'delivered'
        },
        {
          user_id: users[0].id,
          payment_intent_id: `pi_${Date.now()}_2`,
          amount: 89999, // $899.99 in cents
          basket: JSON.stringify([
            { id: allProducts[2].id, title: allProducts[2].title, price: allProducts[2].price, quantity: 1 }
          ]),
          shipping_address: JSON.stringify({
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001'
          }),
          status: 'shipped'
        },
        {
          user_id: users[1]?.id || users[0].id,
          payment_intent_id: `pi_${Date.now()}_3`,
          amount: 24997, // $249.97 in cents
          basket: JSON.stringify([
            { id: allProducts[3].id, title: allProducts[3].title, price: allProducts[3].price, quantity: 2 },
            { id: allProducts[4].id, title: allProducts[4].title, price: allProducts[4].price, quantity: 1 }
          ]),
          shipping_address: JSON.stringify({
            line1: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postal_code: '90001'
          }),
          status: 'pending_payment'
        },
        {
          user_id: users[1]?.id || users[0].id,
          payment_intent_id: `pi_${Date.now()}_4`,
          amount: 10998, // $109.98 in cents
          basket: JSON.stringify([
            { id: allProducts[5].id, title: allProducts[5].title, price: allProducts[5].price, quantity: 2 }
          ]),
          shipping_address: JSON.stringify({
            line1: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postal_code: '90001'
          }),
          status: 'confirmed'
        },
        {
          user_id: users[2]?.id || users[0].id,
          payment_intent_id: `pi_${Date.now()}_5`,
          amount: 32998, // $329.98 in cents
          basket: JSON.stringify([
            { id: allProducts[6].id, title: allProducts[6].title, price: allProducts[6].price, quantity: 2 }
          ]),
          shipping_address: JSON.stringify({
            line1: '789 Pine Rd',
            city: 'Chicago',
            state: 'IL',
            postal_code: '60601'
          }),
          status: 'packed'
        }
      ];

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .insert(sampleOrders)
        .select();

      if (ordersError) {
        console.error('❌ Error creating orders:', ordersError);
      } else {
        console.log(`✅ Created ${orders.length} orders\n`);

        // Create payments for paid orders
        console.log('💳 Creating payments...');
        const payments = orders
          .filter(o => ['delivered', 'shipped', 'confirmed', 'packed'].includes(o.status))
          .map(order => ({
            order_id: order.id,
            payment_intent_id: order.payment_intent_id,
            amount: order.amount,
            payment_method: 'card',
            status: 'succeeded'
          }));

        const { error: paymentsError } = await supabase
          .from('payments')
          .insert(payments);

        if (paymentsError) {
          console.error('❌ Error creating payments:', paymentsError);
        } else {
          console.log(`✅ Created ${payments.length} payments\n`);
        }
      }
    }

    console.log('\n✨ Database seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Products: ${allProducts?.length || 0}`);
    console.log(`   - Orders: ${users && users.length > 0 ? 5 : 0}`);
    console.log(`   - Payments: ${users && users.length > 0 ? 4 : 0}`);
    console.log('\n🎉 Ready to test!');
    console.log('   Frontend: http://localhost:5173/admin/dashboard');
    console.log('   Login: admin@ecommerce.com / Admin@123456\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

seedDatabase();
