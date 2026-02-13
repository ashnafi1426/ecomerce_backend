const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials - try multiple possible admin accounts
const ADMIN_CREDENTIALS_OPTIONS = [
  { email: 'admin@fastshop.com', password: 'Admin@123' },
  { email: 'admin@fastshop.com', password: 'admin123' },
  { email: 'ashu@fastshop.com', password: 'Ashu@123' }
];

let ADMIN_CREDENTIALS = ADMIN_CREDENTIALS_OPTIONS[0];

let authToken = '';

// Login as admin
async function loginAsAdmin() {
  // Try each credential option
  for (let i = 0; i < ADMIN_CREDENTIALS_OPTIONS.length; i++) {
    const credentials = ADMIN_CREDENTIALS_OPTIONS[i];
    try {
      console.log(`🔐 Trying login with: ${credentials.email}...`);
      const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
      
      if (response.data.success && response.data.data.token) {
        authToken = response.data.data.token;
        ADMIN_CREDENTIALS = credentials;
        console.log('✅ Admin login successful');
        console.log('👤 User:', response.data.data.user.email, '| Role:', response.data.data.user.role);
        return true;
      }
    } catch (error) {
      console.log(`   ❌ Failed with ${credentials.email}`);
      if (i === ADMIN_CREDENTIALS_OPTIONS.length - 1) {
        console.error('❌ All login attempts failed');
        console.error('Last error:', error.response?.data || error.message);
      }
    }
  }
  return false;
}

// Test all 6 analytics endpoints
async function testAllAnalyticsEndpoints() {
  const config = {
    headers: { Authorization: `Bearer ${authToken}` }
  };

  console.log('\n' + '='.repeat(80));
  console.log('📊 TESTING ALL 6 ANALYTICS ENDPOINTS');
  console.log('='.repeat(80) + '\n');

  const endpoints = [
    {
      name: '1. Dashboard Analytics',
      url: `${BASE_URL}/admin/analytics/dashboard`,
      expectedFields: ['totalUsers', 'totalOrders', 'totalProducts', 'totalRevenue', 'averageOrderValue']
    },
    {
      name: '2. Sales Overview',
      url: `${BASE_URL}/admin/analytics/sales/overview`,
      expectedFields: ['totalSales', 'totalOrders', 'averageOrderValue', 'growth']
    },
    {
      name: '3. Revenue Overview',
      url: `${BASE_URL}/admin/analytics/revenue/overview`,
      expectedFields: ['totalRevenue', 'totalOrders', 'netProfit', 'commission', 'growth']
    },
    {
      name: '4. Revenue by Category',
      url: `${BASE_URL}/admin/analytics/revenue/by-category`,
      expectedFields: ['revenueByCategory', 'totalCategories', 'totalRevenue']
    },
    {
      name: '5. Customer Statistics',
      url: `${BASE_URL}/admin/analytics/customers/statistics`,
      expectedFields: ['totalCustomers', 'newCustomersThisMonth', 'activeCustomers', 'customerGrowthRate']
    },
    {
      name: '6. Inventory Overview',
      url: `${BASE_URL}/admin/analytics/inventory/overview`,
      expectedFields: ['totalProducts', 'totalValue', 'averageProductValue', 'lowStockProducts', 'outOfStockProducts']
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await axios.get(endpoint.url, config);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Check if all expected fields are present
        const missingFields = endpoint.expectedFields.filter(field => !(field in data));
        
        if (missingFields.length === 0) {
          console.log(`   ✅ SUCCESS - All fields present`);
          
          // Display key metrics
          console.log(`   📊 Key Metrics:`);
          endpoint.expectedFields.forEach(field => {
            const value = data[field];
            if (typeof value === 'number') {
              console.log(`      ${field}: ${value.toLocaleString()}`);
            } else if (Array.isArray(value)) {
              console.log(`      ${field}: ${value.length} items`);
            } else if (typeof value === 'object') {
              console.log(`      ${field}: ${JSON.stringify(value)}`);
            } else {
              console.log(`      ${field}: ${value}`);
            }
          });
          
          successCount++;
        } else {
          console.log(`   ⚠️ PARTIAL SUCCESS - Missing fields: ${missingFields.join(', ')}`);
          console.log(`   📊 Available data:`, JSON.stringify(data, null, 2));
          failCount++;
        }
      } else {
        console.log(`   ❌ FAILED - Invalid response structure`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      if (error.response?.data) {
        console.log(`   Error details:`, JSON.stringify(error.response.data, null, 2));
      }
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successful: ${successCount}/${endpoints.length}`);
  console.log(`❌ Failed: ${failCount}/${endpoints.length}`);
  console.log('='.repeat(80) + '\n');

  if (successCount === endpoints.length) {
    console.log('🎉 ALL ENDPOINTS WORKING CORRECTLY!');
    console.log('✅ AdminAnalyticsPage should now display real order data');
  } else {
    console.log('⚠️ Some endpoints need attention');
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Admin Analytics Endpoints Test\n');
  
  const loginSuccess = await loginAsAdmin();
  
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without admin authentication');
    process.exit(1);
  }
  
  await testAllAnalyticsEndpoints();
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
