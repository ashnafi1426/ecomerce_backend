/**
 * TEST ADMIN USERS API ENDPOINT
 * Debug why AdminUsersPage is not fetching user data
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@fastshop.com',
  password: 'Admin123!@#'
};

async function testAdminUsersAPI() {
  try {
    console.log('🔍 Testing Admin Users API Endpoint...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    console.log('📊 Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (!loginResponse.data.success && !loginResponse.data.token) {
      throw new Error('Login failed: ' + (loginResponse.data.message || 'No token received'));
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log('🎫 Token:', token.substring(0, 20) + '...');

    // Step 2: Test /admin/users endpoint
    console.log('\n2️⃣ Testing /admin/users endpoint...');
    
    const usersResponse = await axios.get(`${API_BASE_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Users API Response Status:', usersResponse.status);
    console.log('📊 Users API Response Data:', JSON.stringify(usersResponse.data, null, 2));

    // Step 3: Test with different filters
    console.log('\n3️⃣ Testing with role filter (customers)...');
    
    const customersResponse = await axios.get(`${API_BASE_URL}/admin/users?role=customer`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Customers API Response:', JSON.stringify(customersResponse.data, null, 2));

    // Step 4: Test with role filter (sellers)
    console.log('\n4️⃣ Testing with role filter (sellers)...');
    
    const sellersResponse = await axios.get(`${API_BASE_URL}/admin/users?role=seller`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Sellers API Response:', JSON.stringify(sellersResponse.data, null, 2));

    // Step 5: Direct database check
    console.log('\n5️⃣ Checking database directly...');
    
    const supabase = require('./config/supabase');

    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, display_name, created_at, status')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Database error:', usersError);
    } else {
      console.log('📊 Direct database query result:');
      console.log('   Total users found:', allUsers?.length || 0);
      if (allUsers && allUsers.length > 0) {
        console.log('   Sample users:', allUsers.slice(0, 3).map(u => ({
          id: u.id,
          email: u.email,
          role: u.role,
          status: u.status
        })));
        
        // Count by role
        const roleStats = allUsers.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        console.log('   Users by role:', roleStats);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('📊 Error Response Status:', error.response.status);
      console.error('📊 Error Response Data:', error.response.data);
    }
  }
}

// Run the test
testAdminUsersAPI();