/**
 * TEST FRONTEND USERS API CALL
 * Test what the frontend API service is actually receiving
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@fastshop.com',
  password: 'Admin123!@#'
};

// Simulate the frontend API service
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
  validateStatus: function (status) {
    return status >= 200 && status < 600;
  }
});

// Response interceptor (like in frontend)
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response received:', {
      status: response.status,
      url: response.config?.url,
      hasData: !!response.data
    });
    
    // Simply return the response data (like frontend does)
    return response.data;
  },
  (error) => {
    console.error('🚨 API Error:', error.message);
    return Promise.reject(new Error(error.message));
  }
);

async function testFrontendUsersAPI() {
  try {
    console.log('🔍 Testing Frontend Users API Call...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await apiClient.post('/auth/login', ADMIN_CREDENTIALS);
    
    const token = loginResponse.token;
    console.log('✅ Admin login successful');

    // Step 2: Set auth header
    apiClient.defaults.headers.Authorization = `Bearer ${token}`;

    // Step 3: Test adminAPI.getUsers() equivalent
    console.log('\n2️⃣ Testing adminAPI.getUsers() equivalent...');
    
    const usersResponse = await apiClient.get('/admin/users', { params: {} });
    
    console.log('📊 Frontend API Response Type:', typeof usersResponse);
    console.log('📊 Frontend API Response Keys:', Object.keys(usersResponse || {}));
    console.log('📊 Frontend API Response Structure:', {
      hasUsers: !!usersResponse.users,
      hasData: !!usersResponse.data,
      hasCount: !!usersResponse.count,
      usersLength: usersResponse.users?.length,
      dataLength: usersResponse.data?.length
    });

    // Step 4: Test with filters (like frontend does)
    console.log('\n3️⃣ Testing with filters...');
    
    const filters = {
      search: '',
      role: 'all',
      status: 'all'
    };
    
    const filteredResponse = await apiClient.get('/admin/users', { params: filters });
    
    console.log('📊 Filtered Response Structure:', {
      hasUsers: !!filteredResponse.users,
      hasData: !!filteredResponse.data,
      hasCount: !!filteredResponse.count,
      usersLength: filteredResponse.users?.length,
      dataLength: filteredResponse.data?.length
    });

    // Step 5: Simulate frontend data extraction
    console.log('\n4️⃣ Simulating frontend data extraction...');
    
    const usersData = filteredResponse.users || filteredResponse.data || [];
    console.log('📊 Extracted users data length:', usersData.length);
    
    if (usersData.length > 0) {
      console.log('📊 Sample user data:', {
        id: usersData[0].id,
        email: usersData[0].email,
        role: usersData[0].role,
        name: usersData[0].name || usersData[0].full_name || usersData[0].display_name
      });
    } else {
      console.log('❌ No users data extracted!');
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
testFrontendUsersAPI();