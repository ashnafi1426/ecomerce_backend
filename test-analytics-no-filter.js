require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testAnalytics() {
  try {
    console.log('🧪 Testing Analytics API (No Payment Status Filter)\n');

    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@fastshop.com',
      password: 'Admin@123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test dashboard analytics
    console.log('2️⃣ Testing dashboard analytics endpoint...');
    const dashboardResponse = await axios.get(
      `${API_URL}/api/admin/analytics/dashboard`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('📊 Dashboard Analytics Response:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));
    console.log('\n');

    // Verify data
    const { data } = dashboardResponse.data;
    console.log('✅ Verification:');
    console.log(`   Total Users: ${data.totalUsers}`);
    console.log(`   Total Orders: ${data.totalOrders}`);
    console.log(`   Total Products: ${data.totalProducts}`);
    console.log(`   Total Revenue: $${(data.totalRevenue / 100).toFixed(2)}`);
    console.log(`   Avg Order Value: $${(data.averageOrderValue / 100).toFixed(2)}`);

    if (data.totalOrders > 0 && data.totalRevenue > 0) {
      console.log('\n✅ SUCCESS! Analytics now showing orders and revenue!');
    } else {
      console.log('\n⚠️ Still showing 0 orders or revenue');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAnalytics();
