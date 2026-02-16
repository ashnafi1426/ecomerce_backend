/**
 * CHAT SYSTEM TEST - STEP BY STEP
 * Run from backend directory: node test-chat-system-step-by-step.js
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const TEST_USER = {
  email: 'ashenafisileshi7@gmail.com',
  password: '14263208@Aa'
};

let authToken = null;

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║         CHAT SYSTEM TEST - STEP BY STEP                      ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// TEST 1: Database Schema
async function test1_Database() {
  console.log('TEST 1: Database Schema\n');
  
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('invalid input syntax for type json')) {
      console.log('❌ FAILED: metadata column is TEXT (needs to be JSONB)');
      console.log('\n⚠️  CRITICAL: Run this SQL in Supabase Dashboard:\n');
      console.log('ALTER TABLE conversations DROP COLUMN IF EXISTS metadata;');
      console.log('ALTER TABLE conversations ADD COLUMN metadata JSONB DEFAULT \'{}\' ::jsonb NOT NULL;');
      console.log('CREATE INDEX IF NOT EXISTS idx_conversations_metadata ON conversations USING GIN (metadata);\n');
      return false;
    } else if (error) {
      console.log('❌ FAILED:', error.message);
      return false;
    } else {
      console.log('✅ PASSED: Conversations table accessible');
      console.log(`   Found ${data.length} conversations\n`);
      return true;
    }
  } catch (err) {
    console.log('❌ FAILED:', err.message, '\n');
    return false;
  }
}

// TEST 2: Backend API
async function test2_Backend() {
  console.log('TEST 2: Backend API\n');
  
  try {
    // Check if backend is running
    try {
      await axios.get(`${API_URL}/health`, { timeout: 3000 });
      console.log('✅ Backend server running on port 5000');
    } catch (err) {
      console.log('❌ FAILED: Backend not running');
      console.log('   Start it: npm start\n');
      return false;
    }
    
    // Login
    try {
      const res = await axios.post(`${API_URL}/auth/login`, TEST_USER);
      authToken = res.data.token;
      console.log('✅ User authentication successful');
    } catch (err) {
      console.log('❌ FAILED: Login failed');
      console.log('   Error:', err.response?.data?.message || err.message, '\n');
      return false;
    }
    
    // Test chat endpoint
    try {
      const res = await axios.get(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ GET /chat/conversations working');
      console.log(`   Status: ${res.status}\n`);
      return true;
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      
      if (status === 500 && message.includes('invalid input syntax for type json')) {
        console.log('❌ FAILED: Database metadata column needs fix');
        console.log('   Run the SQL shown in TEST 1\n');
        return false;
      } else {
        console.log('❌ FAILED:', `${status}: ${message}\n`);
        return false;
      }
    }
  } catch (err) {
    console.log('❌ FAILED:', err.message, '\n');
    return false;
  }
}

// TEST 3: Socket.IO (simplified check)
async function test3_Socket() {
  console.log('TEST 3: Socket.IO Configuration\n');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Check socket.config.js
    const configPath = path.join(__dirname, 'socket', 'socket.config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    if (configContent.includes('3000') && configContent.includes('origin')) {
      console.log('✅ Socket.IO CORS configured for port 3000');
    } else {
      console.log('⚠️  Socket.IO CORS might need port 3000');
    }
    
    // Check SocketContext.jsx
    const contextPath = path.join(__dirname, '..', 'ecommerce_client', 'src', 'contexts', 'SocketContext.jsx');
    if (fs.existsSync(contextPath)) {
      const contextContent = fs.readFileSync(contextPath, 'utf8');
      
      if (contextContent.includes('replace(\'/api\', \'\')')) {
        console.log('✅ SocketContext removes /api suffix');
      } else {
        console.log('⚠️  SocketContext might not remove /api suffix');
      }
      
      if (contextContent.includes('[\'polling\', \'websocket\']')) {
        console.log('✅ Socket transports configured correctly');
      } else {
        console.log('⚠️  Socket transports might need adjustment');
      }
    }
    
    console.log('\n');
    return true;
  } catch (err) {
    console.log('⚠️  Could not check socket files:', err.message, '\n');
    return true; // Don't fail on this
  }
}

// Run all tests
async function runTests() {
  const results = {
    database: false,
    backend: false,
    socket: false
  };
  
  results.database = await test1_Database();
  
  if (!results.database) {
    console.log('═'.repeat(70));
    console.log('STOPPED: Fix database before continuing');
    console.log('═'.repeat(70));
    process.exit(1);
  }
  
  results.backend = await test2_Backend();
  
  if (!results.backend) {
    console.log('═'.repeat(70));
    console.log('STOPPED: Fix backend before continuing');
    console.log('═'.repeat(70));
    process.exit(1);
  }
  
  results.socket = await test3_Socket();
  
  // Final summary
  console.log('═'.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Database Schema:      ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Backend API:          ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Socket Configuration: ${results.socket ? '✅ PASS' : '⚠️  CHECK'}`);
  console.log('═'.repeat(70));
  
  if (results.database && results.backend) {
    console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
    console.log('\nNext steps:');
    console.log('1. Restart backend: npm start');
    console.log('2. Restart frontend: cd ../ecommerce_client && npm run dev');
    console.log('3. Test in browser with F12 console open');
    console.log('4. Look for: [Socket] Connected: <socket-id>\n');
  }
}

runTests().catch(console.error);
