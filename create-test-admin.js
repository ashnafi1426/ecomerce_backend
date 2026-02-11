/**
 * CREATE TEST ADMIN ACCOUNT
 * Creates an admin account for testing
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

const ADMIN_DATA = {
  email: 'admin@fastshop.com',
  password: 'Admin123!@#',
  full_name: 'FastShop Admin',
  role: 'admin'
};

async function createTestAdmin() {
  console.log('🔐 Creating Test Admin Account...\n');

  try {
    // Try to register the admin account
    console.log('1️⃣  Attempting to create admin account...');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, ADMIN_DATA);
      
      if (response.data.success || response.data.data) {
        console.log('✅ Admin account created successfully!');
        console.log('\n📋 Admin Credentials:');
        console.log('   Email:', ADMIN_DATA.email);
        console.log('   Password:', ADMIN_DATA.password);
        console.log('   Role:', ADMIN_DATA.role);
      }
    } catch (registerError) {
      if (registerError.response?.status === 409 || registerError.response?.data?.message?.includes('already exists')) {
        console.log('⚠️  Admin account already exists!');
        console.log('\n📋 Admin Credentials:');
        console.log('   Email:', ADMIN_DATA.email);
        console.log('   Password:', ADMIN_DATA.password);
      } else {
        throw registerError;
      }
    }

    // Test login
    console.log('\n2️⃣  Testing admin login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: ADMIN_DATA.email,
      password: ADMIN_DATA.password
    });

    if (loginResponse.data.data?.token) {
      console.log('✅ Admin login successful!');
      console.log('   Token:', loginResponse.data.data.token.substring(0, 20) + '...');
      console.log('   User:', loginResponse.data.data.user.email);
      console.log('   Role:', loginResponse.data.data.user.role);
    }

    console.log('\n✅ SUCCESS! Admin account is ready!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Run: node test-admin-portal-complete.js');
    console.log('   2. Or test in browser: http://localhost:5173/login');
    console.log('   3. Login with: admin@test.com / Test123!@#');

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('   Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the script
createTestAdmin();
