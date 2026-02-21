/**
 * Test the order service directly to debug the issue
 */

const orderService = require('./services/orderServices/order.service');

async function testServiceDirectly() {
  console.log('\n=== Testing Order Service Directly ===\n');
  
  const subOrderId = '9370d4a7-5b6c-45b6-b906-eb3e280d47ca';
  
  console.log(`Testing findById with sub-order ID: ${subOrderId}`);
  
  try {
    const result = await orderService.findById(subOrderId);
    
    if (result) {
      console.log('\n✓ SUCCESS! Order found:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n✗ FAILED! Order not found (returned null)');
    }
  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    console.error(error);
  }
}

testServiceDirectly().catch(console.error);
