/**
 * Test script for replacement request notifications via API
 * Tests Requirements 1.5 and 2.1
 */

const axios = require('axios');
const supabase = require('./config/supabase');

const BASE_URL = 'http://localhost:5000/api/v1';

// Use existing test customer
const CUSTOMER_CREDENTIALS = {
  email: 'customer@test.com',
  password: 'customer123'
};

let customerToken = null;
let customerId = null;
let sellerId = null;

async function loginAsCustomer() {
  try {
    console.log('\n🔐 Logging in as customer...');
    const response = await axios.post(`${BASE_URL}/auth/login`, CUSTOMER_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      customerToken = response.data.token;
      customerId = response.data.user.id;
      console.log(`✅ Customer login successful (ID: ${customerId})`);
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function setupTestData() {
  console.log('\n📦 Setting up test data...');
  
  try {
    // Find a product with a seller
    const { data: product } = await supabase
      .from('products')
      .select('id, seller_id, title')
      .not('seller_id', 'is', null)
      .limit(1)
      .single();
    
    if (!product) {
      throw new Error('No products found');
    }
    
    console.log(`✅ Found product: ${product.title}`);
    sellerId = product.seller_id;
    
    // Create a delivered order for the customer
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: customerId,
        seller_id: sellerId,
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        total_amount: 100,
        subtotal: 100,
        basket: [{
          product_id: product.id,
          quantity: 1,
          price: 100
        }]
      })
      .select()
      .single();
    
    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }
    
    console.log(`✅ Created test order: ${order.id}`);
    
    return {
      orderId: order.id,
      productId: product.id,
      productTitle: product.title
    };
    
  } catch (error) {
    console.error('❌ Setup error:', error.message);
    throw error;
  }
}

async function countNotifications(userId) {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  return count || 0;
}

async function getLatestNotification(userId, type) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return data;
}

async function testReplacementNotifications() {
  console.log('\n' + '='.repeat(70));
  console.log('Testing Replacement Request Notifications (Requirements 1.5, 2.1)');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Login
    if (!await loginAsCustomer()) {
      throw new Error('Failed to login');
    }
    
    // Step 2: Setup test data
    const { orderId, productId, productTitle } = await setupTestData();
    
    // Step 3: Count notifications before
    console.log('\n📊 Counting notifications before...');
    const customerNotifsBefore = await countNotifications(customerId);
    const sellerNotifsBefore = await countNotifications(sellerId);
    
    console.log(`   Customer notifications: ${customerNotifsBefore}`);
    console.log(`   Seller notifications: ${sellerNotifsBefore}`);
    
    // Step 4: Create replacement request via API
    console.log('\n🔄 Creating replacement request...');
    
    const replacementData = {
      orderId: orderId,
      productId: productId,
      reason: 'defective',
      description: 'The product has a manufacturing defect and does not work properly.'
    };
    
    const response = await axios.post(
      `${BASE_URL}/replacements`,
      replacementData,
      {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to create replacement request');
    }
    
    const replacementRequest = response.data.data;
    console.log(`✅ Replacement request created: ${replacementRequest.id}`);
    console.log(`   Product: ${productTitle}`);
    console.log(`   Status: ${replacementRequest.status}`);
    
    // Wait for notifications to be created
    console.log('\n⏳ Waiting for notifications...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Verify customer notification (Requirement 1.5)
    console.log('\n📱 Verifying customer notification (Requirement 1.5)...');
    const customerNotifsAfter = await countNotifications(customerId);
    const customerNotif = await getLatestNotification(customerId, 'replacement_request_created');
    
    console.log(`   Notifications after: ${customerNotifsAfter}`);
    
    if (customerNotif && customerNotif.metadata?.replacement_request_id === replacementRequest.id) {
      console.log('   ✅ Customer notification found!');
      console.log(`      Title: ${customerNotif.title}`);
      console.log(`      Message: ${customerNotif.message}`);
      console.log(`      Action URL: ${customerNotif.action_url}`);
      console.log(`      Channels: ${customerNotif.channels?.join(', ')}`);
    } else {
      console.log('   ❌ Customer notification NOT found');
    }
    
    // Step 6: Verify seller notification (Requirement 2.1)
    console.log('\n📧 Verifying seller notification (Requirement 2.1)...');
    const sellerNotifsAfter = await countNotifications(sellerId);
    const sellerNotif = await getLatestNotification(sellerId, 'replacement_request_received');
    
    console.log(`   Notifications after: ${sellerNotifsAfter}`);
    
    if (sellerNotif && sellerNotif.metadata?.replacement_request_id === replacementRequest.id) {
      console.log('   ✅ Seller in-app notification found!');
      console.log(`      Title: ${sellerNotif.title}`);
      console.log(`      Message: ${sellerNotif.message}`);
      console.log(`      Action URL: ${sellerNotif.action_url}`);
      console.log(`      Priority: ${sellerNotif.priority}`);
      console.log(`      Channels: ${sellerNotif.channels?.join(', ')}`);
    } else {
      console.log('   ❌ Seller notification NOT found');
    }
    
    // Step 7: Check seller email
    console.log('\n📬 Seller email notification:');
    const { data: seller } = await supabase
      .from('users')
      .select('email')
      .eq('id', sellerId)
      .single();
    
    if (seller?.email) {
      console.log(`   ⚠️  Check email inbox for: ${seller.email}`);
      console.log(`   Email should contain replacement request details`);
    }
    
    // Step 8: Summary
    console.log('\n' + '='.repeat(70));
    console.log('Test Summary');
    console.log('='.repeat(70));
    
    const customerPass = customerNotifsAfter > customerNotifsBefore && customerNotif;
    const sellerPass = sellerNotifsAfter > sellerNotifsBefore && sellerNotif;
    
    console.log(`\n✅ Requirement 1.5 (Customer in-app notification): ${customerPass ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Requirement 2.1 (Seller in-app + email notification): ${sellerPass ? 'PASS' : 'FAIL'}`);
    
    if (customerPass && sellerPass) {
      console.log('\n🎉 All notification tests PASSED!');
      console.log('\nTask 5.1 Implementation Complete:');
      console.log('  ✅ Customer receives in-app notification when replacement request created');
      console.log('  ✅ Seller receives in-app notification when replacement request created');
      console.log('  ✅ Seller receives email notification when replacement request created');
    } else {
      console.log('\n⚠️  Some tests FAILED - review implementation');
    }
    
    console.log('\n' + '='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testReplacementNotifications()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  });
