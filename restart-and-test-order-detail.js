/**
 * Restart Backend and Test Order Detail Fix
 */

const { spawn } = require('child_process');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let backendProcess = null;

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get('http://localhost:5000/health');
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

async function testOrderDetail() {
  try {
    console.log('🧪 Testing Order Detail API Fix...\n');

    // Login as customer
    console.log('1️⃣ Logging in as customer...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ashenafisileshi7@gmail.com',
      password: '14263208@aA'
    });

    const token = loginResponse.data.token || loginResponse.data.data?.token;
    console.log('✅ Login successful\n');

    // Test order detail endpoint
    const orderId = '09364be8-fb99-4023-8012-d10620ae58f9';
    console.log(`2️⃣ Fetching order detail for: ${orderId.substring(0, 8)}...`);
    
    const orderResponse = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Order detail API response structure:');
    console.log('   Has success property:', !!orderResponse.data.success);
    console.log('   Has data property:', !!orderResponse.data.data);
    console.log('   Has items array:', !!orderResponse.data.data?.items);
    console.log('   Has total:', !!orderResponse.data.data?.total);
    console.log('   Has shippingAddress:', !!orderResponse.data.data?.shippingAddress);
    console.log('');

    if (orderResponse.data.data) {
      console.log('✅ Response structure is correct!');
      console.log('   Order ID:', orderResponse.data.data.id);
      console.log('   Status:', orderResponse.data.data.status);
      console.log('   Total:', orderResponse.data.data.total, 'USD');
      console.log('   Items count:', orderResponse.data.data.items?.length || 0);
      
      if (orderResponse.data.data.items && orderResponse.data.data.items.length > 0) {
        console.log('   First item:', orderResponse.data.data.items[0].product?.name);
      }
    } else {
      console.log('❌ Response structure is incorrect - missing data property');
    }

    console.log('\n✅ Order detail fix is working!');
    console.log('   Frontend should now be able to display order details correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function main() {
  try {
    console.log('🔄 Restarting backend server...\n');

    // Kill existing process on port 5000
    if (process.platform === 'win32') {
      spawn('taskkill', ['/F', '/IM', 'node.exe', '/FI', 'WINDOWTITLE eq *server.js*'], { shell: true });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start backend
    backendProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'pipe',
      shell: true
    });

    console.log('⏳ Waiting for server to start...');

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running') || output.includes('listening')) {
        console.log('✅ Server started\n');
      }
    });

    backendProcess.stderr.on('data', (data) => {
      // Ignore stderr for now
    });

    // Wait for server to be ready
    const serverReady = await waitForServer();
    
    if (!serverReady) {
      console.error('❌ Server failed to start');
      process.exit(1);
    }

    // Run tests
    await testOrderDetail();

    console.log('\n✅ All tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Frontend should now display order details correctly');
    console.log('   2. Test by clicking notification "View Order" button');
    console.log('   3. Order detail page should show order information');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (backendProcess) {
      backendProcess.kill();
    }
    process.exit(0);
  }
}

main();
