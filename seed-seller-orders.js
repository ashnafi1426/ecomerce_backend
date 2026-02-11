/**
 * Seed Seller Orders
 * 
 * Creates test orders for the seller account to test the seller dashboard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedSellerOrders() {
  try {
    console.log('🌱 Seeding seller orders...\n');
    
    // Step 1: Get seller user ID
    console.log('1. Finding seller account...');
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'seller@test.com')
      .single();
    
    if (sellerError || !seller) {
      console.log('❌ Seller not found. Creating seller account...');
      
      // Create seller account
      const { data: newSeller, error: createError } = await supabase
        .from('users')
        .insert([{
          email: 'seller@test.com',
          password_hash: '$2b$10$rQZ9vKzf8vKzf8vKzf8vKOqGqGqGqGqGqGqGqGqGqGqGqGqGqGqGqG', // password123
          display_name: 'Test Seller',
          role: 'seller',
          business_name: 'Test Seller Business',
          business_address: '123 Business St, City, State 12345',
          seller_verification_status: 'verified'
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create seller:', createError);
        return;
      }
      
      seller = newSeller;
      console.log('✅ Seller account created');
    } else {
      console.log('✅ Seller found:', seller.email);
    }
    
    const sellerId = seller.id;
    
    // Step 2: Get or create customer
    console.log('\n2. Finding customer account...');
    let { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'customer@test.com')
      .single();
    
    if (customerError || !customer) {
      console.log('❌ Customer not found. Creating customer account...');
      
      const { data: newCustomer, error: createCustomerError } = await supabase
        .from('users')
        .insert([{
          email: 'customer@test.com',
          password_hash: '$2b$10$rQZ9vKzf8vKzf8vKzf8vKOqGqGqGqGqGqGqGqGqGqGqGqGqGqGqGqG', // password123
          display_name: 'Test Customer',
          role: 'customer'
        }])
        .select()
        .single();
      
      if (createCustomerError) {
        console.error('❌ Failed to create customer:', createCustomerError);
        return;
      }
      
      customer = newCustomer;
      console.log('✅ Customer account created');
    } else {
      console.log('✅ Customer found:', customer.email);
    }
    
    const customerId = customer.id;
    
    // Step 3: Create or get products for the seller
    console.log('\n3. Creating test products...');
    const products = [
      {
        title: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 99.99,
        sku: 'WBH-001',
        category_id: 1,
        seller_id: sellerId,
        status: 'active',
        image_url: 'https://example.com/headphones.jpg'
      },
      {
        title: 'Smart Fitness Watch',
        description: 'Advanced fitness tracking with heart rate monitor',
        price: 199.99,
        sku: 'SFW-002',
        category_id: 2,
        seller_id: sellerId,
        status: 'active',
        image_url: 'https://example.com/watch.jpg'
      },
      {
        title: 'Portable Phone Charger',
        description: 'Fast charging power bank with USB-C',
        price: 29.99,
        sku: 'PPC-003',
        category_id: 3,
        seller_id: sellerId,
        status: 'active',
        image_url: 'https://example.com/charger.jpg'
      }
    ];
    
    const { data: createdProducts, error: productError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'sku' })
      .select();
    
    if (productError) {
      console.error('❌ Failed to create products:', productError);
      return;
    }
    
    console.log(`✅ Created ${createdProducts.length} products`);
    
    // Step 4: Create main orders
    console.log('\n4. Creating main orders...');
    const mainOrders = [
      {
        user_id: customerId,
        status: 'completed',
        amount: 129.98,
        shipping_address: {
          name: 'John Doe',
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
          country: 'US'
        },
        payment_method: 'stripe',
        payment_status: 'paid'
      },
      {
        user_id: customerId,
        status: 'processing',
        amount: 199.99,
        shipping_address: {
          name: 'Jane Smith',
          street: '456 Oak Ave',
          city: 'Somewhere',
          state: 'NY',
          zip: '67890',
          country: 'US'
        },
        payment_method: 'stripe',
        payment_status: 'paid'
      },
      {
        user_id: customerId,
        status: 'pending',
        amount: 29.99,
        shipping_address: {
          name: 'Bob Johnson',
          street: '789 Pine Rd',
          city: 'Elsewhere',
          state: 'TX',
          zip: '54321',
          country: 'US'
        },
        payment_method: 'stripe',
        payment_status: 'paid'
      }
    ];
    
    const { data: createdOrders, error: orderError } = await supabase
      .from('orders')
      .insert(mainOrders)
      .select();
    
    if (orderError) {
      console.error('❌ Failed to create orders:', orderError);
      return;
    }
    
    console.log(`✅ Created ${createdOrders.length} main orders`);
    
    // Step 5: Create sub-orders for the seller
    console.log('\n5. Creating sub-orders for seller...');
    const subOrders = [
      {
        order_id: createdOrders[0].id,
        seller_id: sellerId,
        product_id: createdProducts[0].id,
        product_name: createdProducts[0].title,
        quantity: 1,
        unit_price: 99.99,
        total_amount: 99.99,
        fulfillment_status: 'shipped',
        commission_rate: 0.15,
        commission_amount: 14.99
      },
      {
        order_id: createdOrders[0].id,
        seller_id: sellerId,
        product_id: createdProducts[2].id,
        product_name: createdProducts[2].title,
        quantity: 1,
        unit_price: 29.99,
        total_amount: 29.99,
        fulfillment_status: 'shipped',
        commission_rate: 0.15,
        commission_amount: 4.50
      },
      {
        order_id: createdOrders[1].id,
        seller_id: sellerId,
        product_id: createdProducts[1].id,
        product_name: createdProducts[1].title,
        quantity: 1,
        unit_price: 199.99,
        total_amount: 199.99,
        fulfillment_status: 'processing',
        commission_rate: 0.15,
        commission_amount: 30.00
      },
      {
        order_id: createdOrders[2].id,
        seller_id: sellerId,
        product_id: createdProducts[2].id,
        product_name: createdProducts[2].title,
        quantity: 1,
        unit_price: 29.99,
        total_amount: 29.99,
        fulfillment_status: 'pending',
        commission_rate: 0.15,
        commission_amount: 4.50
      }
    ];
    
    const { data: createdSubOrders, error: subOrderError } = await supabase
      .from('sub_orders')
      .insert(subOrders)
      .select();
    
    if (subOrderError) {
      console.error('❌ Failed to create sub-orders:', subOrderError);
      return;
    }
    
    console.log(`✅ Created ${createdSubOrders.length} sub-orders for seller`);
    
    // Step 6: Update seller performance and balance
    console.log('\n6. Updating seller performance...');
    
    // Create or update seller performance
    const { error: perfError } = await supabase
      .from('seller_performance')
      .upsert([{
        seller_id: sellerId,
        total_orders: createdSubOrders.length,
        total_sales: subOrders.reduce((sum, order) => sum + order.total_amount, 0),
        average_rating: 4.5,
        total_reviews: 12,
        fulfillment_rate: 0.85,
        response_time_hours: 2.5
      }], { onConflict: 'seller_id' });
    
    if (perfError) {
      console.error('❌ Failed to update performance:', perfError);
    } else {
      console.log('✅ Updated seller performance');
    }
    
    // Create or update seller balance
    const totalEarnings = subOrders.reduce((sum, order) => sum + (order.total_amount - order.commission_amount), 0);
    const { error: balanceError } = await supabase
      .from('seller_balances')
      .upsert([{
        seller_id: sellerId,
        available_balance: totalEarnings * 0.8, // 80% available
        pending_balance: totalEarnings * 0.2,   // 20% pending
        escrow_balance: 0,
        total_earnings: totalEarnings
      }], { onConflict: 'seller_id' });
    
    if (balanceError) {
      console.error('❌ Failed to update balance:', balanceError);
    } else {
      console.log('✅ Updated seller balance');
    }
    
    console.log('\n🎉 Seller orders seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Seller: ${seller.email}`);
    console.log(`   - Products: ${createdProducts.length}`);
    console.log(`   - Main Orders: ${createdOrders.length}`);
    console.log(`   - Sub-Orders: ${createdSubOrders.length}`);
    console.log(`   - Total Earnings: $${totalEarnings.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Run the seeder
seedSellerOrders();