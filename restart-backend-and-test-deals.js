/**
 * Restart Backend and Test Deals Endpoint
 * This script will help you restart the backend and verify the deals fix
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let backendProcess = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkBackendRunning() {
  try {
    const response = await axios.get('http://localhost:5000/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function stopBackend() {
  console.log('🛑 Stopping backend server...');
  
  if (backendProcess) {
    backendProcess.kill();
    await sleep(2000);
  }
  
  // Kill any process on port 5000
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    try {
      const findProcess = spawn('netstat', ['-ano', '|', 'findstr', ':5000']);
      findProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          const match = line.match(/LISTENING\s+(\d+)/);
          if (match) {
            const pid = match[1];
            console.log(`   Killing process ${pid}...`);
            spawn('taskkill', ['/F', '/PID', pid]);
          }
        });
      });
    } catch (error) {
      // Ignore errors
    }
  } else {
    try {
      spawn('lsof', ['-ti:5000', '|', 'xargs', 'kill', '-9']);
    } catch (error) {
      // Ignore errors
    }
  }
  
  await sleep(2000);
  console.log('   ✅ Backend stopped\n');
}

async function startBackend() {
  console.log('🚀 Starting backend server...');
  
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'npm.cmd' : 'npm';
  
  backendProcess = spawn(command, ['start'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true
  });
  
  let output = '';
  
  backendProcess.stdout.on('data', (data) => {
    output += data.toString();
    if (output.includes('Server running on port 5000')) {
      console.log('   ✅ Backend started successfully!\n');
    }
  });
  
  backendProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('DeprecationWarning')) {
      console.error('   ⚠️  Backend error:', error);
    }
  });
  
  // Wait for backend to start
  console.log('   Waiting for backend to start...');
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (await checkBackendRunning()) {
      console.log('   ✅ Backend is ready!\n');
      return true;
    }
  }
  
  console.log('   ⚠️  Backend may not have started properly\n');
  return false;
}

async function testDealsEndpoint() {
  console.log('🧪 Testing Deals Endpoint\n');
  console.log('='.repeat(60));
  
  const filters = ['all', 'today', 'week', 'month'];
  let allPassed = true;
  
  for (const filter of filters) {
    try {
      console.log(`\n📝 Testing: GET /deals?filter=${filter}`);
      
      const response = await axios.get(`${BASE_URL}/deals`, {
        params: { filter }
      });

      console.log(`   ✅ SUCCESS - Status: ${response.status}`);
      console.log(`   Deals found: ${response.data.count}`);
      
      if (response.data.deals && response.data.deals.length > 0) {
        const deal = response.data.deals[0];
        console.log(`   Sample: "${deal.title}" - $${deal.price} (was $${deal.original_price})`);
      }
      
    } catch (error) {
      allPassed = false;
      console.log(`   ❌ FAILED - Status: ${error.response?.status || 'No response'}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.status === 500) {
        console.log('\n   💡 Server error detected!');
        console.log('   Check backend console for error details');
        console.log('   The error is likely in deal.routes.js');
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    console.log('\n✅ All tests passed! Deals endpoint is working correctly.\n');
    console.log('📝 Next: Test in browser');
    console.log('   1. Open http://localhost:3001/deals');
    console.log('   2. Try different filter tabs (All, Today, Week, Month)');
    console.log('   3. Verify deals display correctly\n');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.\n');
  }
}

async function main() {
  console.log('🔧 FastShop Deals Endpoint Fix & Test\n');
  console.log('='.repeat(60));
  console.log('This script will:');
  console.log('1. Stop the backend server');
  console.log('2. Start the backend server (picks up deal.routes.js changes)');
  console.log('3. Test the /api/deals endpoint');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Stop backend
    await stopBackend();
    
    // Start backend
    const started = await startBackend();
    
    if (!started) {
      console.log('❌ Failed to start backend. Please start it manually:');
      console.log('   npm start\n');
      process.exit(1);
    }
    
    // Wait a bit more to ensure backend is fully ready
    await sleep(2000);
    
    // Test deals endpoint
    await testDealsEndpoint();
    
    console.log('✨ Test complete!\n');
    console.log('💡 Backend is still running. Press Ctrl+C to stop it.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping backend...');
  if (backendProcess) {
    backendProcess.kill();
  }
  process.exit(0);
});

main();
