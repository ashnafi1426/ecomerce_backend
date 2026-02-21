/**
 * TEST ORDERS API RESPONSE
 * 
 * This script tests what the /api/v1/orders/my endpoint actually returns
 */

const axios = require('axios');

async function testOrdersAPI() {
  console.log('🔍 Testing Orders API Response...\n');

  try {
    // You need to replace this with a valid JWT token from a logged-in customer
    const token = 'YOUR_JWT_TOKEN_HERE';

    const response = await axios.get('http://localhost:5000/api/v1/orders/my', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ API Response received\n');
    console.log('Number of orders:', response.data.orders?.length || 0);

    if (response.data.orders && response.data.orders.length > 0) {
      const firstOrder = response.data.orders[0];
      console.log('\n📦 First Order Structure:');
      console.log('Order ID:', firstOrder.id);
      console.log('Has "items" field?', 'items' in firstOrder);
      console.log('Has "basket" field?', 'basket' in firstOrder);
      
      if (firstOrder.items) {
        console.log('\n✅ Order has "items" field');
        console.log('Number of items:', firstOrder.items.length);
        if (firstOrder.items.length > 0) {
          console.log('\nFirst item structure:');
          console.log(JSON.stringify(firstOrder.items[0], null, 2));
        }
      }

      if (firstOrder.basket) {
        console.log('\n⚠️  Order has "basket" field');
        console.log('Number of basket items:', firstOrder.basket.length);
        if (firstOrder.basket.length > 0) {
          console.log('\nFirst basket item structure:');
          console.log(JSON.stringify(firstOrder.basket[0], null, 2));
        }
      }

      console.log('\n📋 Full first order:');
      console.log(JSON.stringify(firstOrder, null, 2));
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

console.log('⚠️  NOTE: You need to replace YOUR_JWT_TOKEN_HERE with a valid token');
console.log('You can get a token by logging in as a customer and copying it from the browser dev tools\n');

testOrdersAPI();
