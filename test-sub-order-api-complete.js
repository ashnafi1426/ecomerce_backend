const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  'https://yqigycicloyhasoqlcpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxaWd5Y2ljbG95aGFzb3FsY3BuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc3MzU2MiwiZXhwIjoyMDg1MzQ5NTYyfQ.XXwuOAHAODaJQuJfHiQxh-ysRYmP2RMb06MoI6lzwns'
);

const API_URL = 'http://localhost:5000';

async function testSubOrderAPI() {
  console.log('='.repeat(60));
  console.log('SUB-ORDER TOTAL FIELD FIX - COMPLETE TEST');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get a sub-order from database
    console.log('\n[Step 1] Fetching sub-order from database...');
    const { data: subOrders, error: subOrderError } = await supabase
      .from('sub_orders')
      .select('id, parent_order_id, total_amount, items, seller_id')
      .limit(1);
    
    if (subOrderError) {
      console.error('❌ Error fetching sub-order:', subOrderError);
      return;
    }
    
    if (!subOrders || subOrders.length === 0) {
      console.log('❌ No sub-orders found in database');
      return;
    }
    
    const subOrder = subOrders[0];
    console.log('✅ Found sub-order:');
    console.log(`   ID: ${subOrder.id}`);
    console.log(`   Parent Order ID: ${subOrder.parent_order_id}`);
    console.log(`   total_amount: ${subOrder.total_amount} cents`);
    console.log(`   Expected total: ${subOrder.total_amount / 100} dollars`);
    console.log(`   Items count: ${subOrder.items?.length || 0}`);
    
    // Step 2: Get parent order to find customer
    console.log('\n[Step 2] Fetching parent order to get customer...');
    const { data: parentOrder, error: parentError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', subOrder.parent_order_id)
      .single();
    
    if (parentError) {
      console.error('❌ Error fetching parent order:', parentError);
      return;
    }
    
    console.log(`✅ Customer ID: ${parentOrder.user_id}`);
    
    // Step 3: Get customer credentials
    console.log('\n[Step 3] Fetching customer credentials...');
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('email')
      .eq('id', parentOrder.user_id)
      .single();
    
    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return;
    }
    
    console.log(`✅ Customer email: ${customer.email}`);
    
    // Step 4: Login as customer
    console.log('\n[Step 4] Logging in as customer...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: customer.email,
      password: 'password123' // Default test password
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Step 5: Fetch sub-order via API
    console.log('\n[Step 5] Fetching sub-order via API...');
    console.log(`   GET ${API_URL}/api/orders/${subOrder.id}`);
    
    const orderResponse = await axios.get(`${API_URL}/api/orders/${subOrder.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const orderData = orderResponse.data.data;
    
    console.log('\n✅ API Response received!');
    console.log('\n[Validation Results]');
    console.log('-'.repeat(60));
    
    // Validate response structure
    const validations = [
      {
        name: 'Response has success field',
        check: orderResponse.data.success === true,
        value: orderResponse.data.success
      },
      {
        name: 'Response has status field',
        check: orderResponse.data.status === 'success',
        value: orderResponse.data.status
      },
      {
        name: 'Response has data object',
        check: !!orderData,
        value: !!orderData
      },
      {
        name: 'Data has id field',
        check: orderData.id === subOrder.id,
        value: orderData.id
      },
      {
        name: 'Data has total field (CRITICAL)',
        check: orderData.total !== undefined && orderData.total !== null,
        value: orderData.total
      },
      {
        name: 'Total is in dollars (not cents)',
        check: orderData.total === subOrder.total_amount / 100,
        value: `${orderData.total} (expected: ${subOrder.total_amount / 100})`
      },
      {
        name: 'Data has totalAmount field',
        check: orderData.totalAmount === subOrder.total_amount,
        value: orderData.totalAmount
      },
      {
        name: 'Data has items array',
        check: Array.isArray(orderData.items) && orderData.items.length > 0,
        value: `${orderData.items?.length || 0} items`
      },
      {
        name: 'Items have product details',
        check: orderData.items?.[0]?.product !== undefined,
        value: orderData.items?.[0]?.product ? 'Yes' : 'No'
      },
      {
        name: 'Nested order object has total',
        check: orderData.order?.total !== undefined,
        value: orderData.order?.total
      }
    ];
    
    let allPassed = true;
    validations.forEach(v => {
      const status = v.check ? '✅' : '❌';
      console.log(`${status} ${v.name}: ${v.value}`);
      if (!v.check) allPassed = false;
    });
    
    console.log('-'.repeat(60));
    
    if (allPassed) {
      console.log('\n🎉 ALL VALIDATIONS PASSED!');
      console.log('\nThe fix is working correctly:');
      console.log(`  - Sub-order ${subOrder.id} returns total field`);
      console.log(`  - Total is correctly converted from cents to dollars`);
      console.log(`  - Items array is properly populated`);
      console.log(`  - Frontend validation errors should be resolved`);
    } else {
      console.log('\n⚠️  SOME VALIDATIONS FAILED');
      console.log('Please review the failed checks above.');
    }
    
    // Show sample response
    console.log('\n[Sample Response Data]');
    console.log(JSON.stringify({
      id: orderData.id,
      total: orderData.total,
      totalAmount: orderData.totalAmount,
      items: orderData.items?.map(item => ({
        product_id: item.product_id,
        title: item.title || item.product?.description,
        price: item.price,
        quantity: item.quantity
      }))
    }, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Message:', error.message);
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Backend server is not running!');
      console.log('   Please start the backend server first:');
      console.log('   cd .kiro/specs/fastshop-ecommerce-platform/ecomerce_backend');
      console.log('   npm start');
    }
  }
}

testSubOrderAPI();
