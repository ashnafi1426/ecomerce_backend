/**
 * SEED SAMPLE DATA
 * 
 * This script adds sample products, orders, and other data
 * to the database so you can see the admin dashboard working.
 */

const supabase = require('./config/supabase');

async function seedSampleData() {
  console.log('🌱 Starting to seed sample data...\n');

  try {
    // Get existing categories
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    console.log(`✅ Found ${categories.length} categories`);

    // Get a regular user (not admin) for orders
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'customer')
      .limit(3);

    console.log(`✅ Found ${users.length} customer users\n`);

    // Sample products data
    const sampleProducts = [
      {
        title: 'Premium Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life',
        price: 149.99,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'Smart Watch Pro',
        description: 'Advanced fitness tracking, heart rate monitor, and smartphone notifications',
        price: 299.99,
        image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'Laptop Computer 15"',
        description: 'Powerful laptop with Intel i7, 16GB RAM, 512GB SSD',
        price: 899.99,
        image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        price: 29.99,
        image_url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with blue switches',
        price: 79.99,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'USB-C Hub',
        description: '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader',
        price: 39.99,
        image_url: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'Portable SSD 1TB',
        description: 'Fast external SSD with USB-C connection',
        price: 129.99,
        image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'Webcam HD 1080p',
        description: 'High-definition webcam with auto-focus and built-in microphone',
        price: 59.99,
        image_url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'Phone Stand',
        description: 'Adjustable phone stand for desk',
        price: 15.99,
        image_url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      },
      {
        title: 'Bluetooth Speaker',
        description: 'Portable waterproof Bluetooth speaker',
        price: 49.99,
        image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
        category_id: categories[0]?.id,
        status: 'active'
      }
    ];

    console.log('📦 Creating products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();

    if (productsError) {
      console.error('❌ Error creating products:', productsError);
      return;
    }

    console.log(`✅ Created ${products.length} products\n`);

    // Create inventory for each product
    console.log('📊 Creating inventory records...');
    const inventoryRecords = products.map((product, index) => ({
      product_id: product.id,
      quantity: Math.floor(Math.random() * 100) + 10, // Random quantity between 10-110
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

    // Create sample orders if we have users
    if (users && users.length > 0) {
      console.log('🛒 Creating sample orders...');
      
      const sampleOrders = [
        {
          user_id: users[0].id,
          total_amount: 179.98,
          status: 'delivered',
          shipping_address: '123 Main St, New York, NY 10001'
        },
        {
          user_id: users[0].id,
          total_amount: 899.99,
          status: 'shipped',
          shipping_address: '123 Main St, New York, NY 10001'
        },
        {
          user_id: users[1]?.id || users[0].id,
          total_amount: 249.97,
          status: 'pending_payment',
          shipping_address: '456 Oak Ave, Los Angeles, CA 90001'
        },
        {
          user_id: users[1]?.id || users[0].id,
          total_amount: 109.98,
          status: 'confirmed',
          shipping_address: '456 Oak Ave, Los Angeles, CA 90001'
        },
        {
          user_id: users[2]?.id || users[0].id,
          total_amount: 329.98,
          status: 'packed',
          shipping_address: '789 Pine Rd, Chicago, IL 60601'
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

        // Create order items for each order
        console.log('📝 Creating order items...');
        const orderItems = [];
        
        orders.forEach((order, index) => {
          // Add 1-3 items per order
          const itemCount = Math.floor(Math.random() * 3) + 1;
          for (let i = 0; i < itemCount; i++) {
            const product = products[Math.floor(Math.random() * products.length)];
            orderItems.push({
              order_id: order.id,
              product_id: product.id,
              quantity: Math.floor(Math.random() * 3) + 1,
              price_at_time: product.price
            });
          }
        });

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('❌ Error creating order items:', itemsError);
        } else {
          console.log(`✅ Created ${orderItems.length} order items\n`);
        }

        // Create payments for delivered and shipped orders
        console.log('💳 Creating payment records...');
        const payments = orders
          .filter(o => ['delivered', 'shipped', 'confirmed', 'packed'].includes(o.status))
          .map(order => ({
            order_id: order.id,
            user_id: order.user_id,
            amount: order.total_amount,
            status: 'succeeded',
            payment_intent_id: `pi_${Math.random().toString(36).substring(7)}`
          }));

        const { error: paymentsError } = await supabase
          .from('payments')
          .insert(payments);

        if (paymentsError) {
          console.error('❌ Error creating payments:', paymentsError);
        } else {
          console.log(`✅ Created ${payments.length} payment records\n`);
        }
      }
    }

    console.log('\n✨ Sample data seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Inventory records: ${inventoryRecords.length}`);
    console.log(`   - Orders: ${users && users.length > 0 ? 5 : 0}`);
    console.log('\n🎉 You can now view the admin dashboard with real data!');
    console.log('   Frontend: http://localhost:5173/admin/dashboard');
    console.log('   Login: admin@ecommerce.com / Admin@123456\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run the seed function
seedSampleData();
