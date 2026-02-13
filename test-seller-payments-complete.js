/**
 * TEST SELLER PAYMENTS SYSTEM
 * 
 * Tests the complete seller payment flow:
 * 1. Check seller earnings
 * 2. Check payout balance
 * 3. Request payout
 * 4. Admin approval
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let sellerToken = '';
let adminToken = '';
let testPayoutId = '';

// Test credentials
const SELLER_CREDENTIALS = {
  email: 'seller@test.com',
  password: 'seller123'
};

const ADMIN_CREDENTIALS = {
  email: 'admin@fastshop.com',
  password: 'admin123'
};

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      data
    };
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

async function loginSeller() {
  console.log('\n🔐 Logging in as seller...');
  const result = await makeRequest('POST', '/auth/login', SELLER_CREDENTIALS);
  
  if (result.success && result.data.token) {
    sellerToken = result.data.token;
    console.log('✅ Seller logged in successfully');
    console.log(`   User ID: ${result.data.user.id}`);
    console.log(`   Email: ${result.data.user.email}`);
    return true;
  } else {
    console.error('❌ Seller login failed:', result.error);
    return false;
  }
}

async function loginAdmin() {
  console.log('\n🔐 Logging in as admin...');
  const result = await makeRequest('POST', '/auth/login', ADMIN_CREDENTIALS);
  
  if (result.success && result.data.token) {
    adminToken = result.data.token;
    console.log('✅ Admin logged in successfully');
    return true;
  } else {
    console.error('❌ Admin login failed:', result.error);
    return false;
  }
}

async function testGetPayoutBalance() {
  console.log('\n💰 TEST 1: Get Payout Balance');
  console.log('='.repeat(60));
  
  const result = await makeRequest('GET', '/seller/payouts/balance', null, sellerToken);
  
  if (result.success) {
    console.log('✅ Payout balance retrieved');
    console.log('📊 Balance Details:');
    console.log(`   Available: $${(result.data.data.available / 100).toFixed(2)}`);
    console.log(`   Pending: $${(result.data.data.pending / 100).toFixed(2)}`);
    console.log(`   Paid: $${(result.data.data.paid / 100).toFixed(2)}`);
    console.log(`   Total Earnings: $${(result.data.data.total_earnings / 100).toFixed(2)}`);
    return result.data.data;
  } else {
    console.error('❌ Failed to get balance:', result.error);
    return null;
  }
}

async function testGetEarnings() {
  console.log('\n📈 TEST 2: Get Earnings History');
  console.log('='.repeat(60));
  
  const result = await makeRequest('GET', '/seller/earnings', null, sellerToken);
  
  if (result.success) {
    const earnings = result.data.data || [];
    console.log(`✅ Retrieved ${earnings.length} earnings records`);
    
    if (earnings.length > 0) {
      console.log('\n📊 Sample Earnings:');
      earnings.slice(0, 5).forEach((earning, index) => {
        console.log(`\n   ${index + 1}. Earning ID: ${earning.id.slice(0, 8)}`);
        console.log(`      Amount: $${(earning.amount / 100).toFixed(2)}`);
        console.log(`      Commission: $${(earning.commission_amount / 100).toFixed(2)}`);
        console.log(`      Status: ${earning.status}`);
        console.log(`      Available Date: ${earning.available_date || 'N/A'}`);
      });
    } else {
      console.log('⚠️  No earnings found');
      console.log('   This is normal if no orders have been completed yet');
    }
    
    return earnings;
  } else {
    console.error('❌ Failed to get earnings:', result.error);
    return [];
  }
}

async function testGetPayouts() {
  console.log('\n💸 TEST 3: Get Payout History');
  console.log('='.repeat(60));
  
  const result = await makeRequest('GET', '/seller/payouts', null, sellerToken);
  
  if (result.success) {
    const payouts = result.data.data || [];
    console.log(`✅ Retrieved ${payouts.length} payout records`);
    
    if (payouts.length > 0) {
      console.log('\n📊 Payout History:');
      payouts.forEach((payout, index) => {
        console.log(`\n   ${index + 1}. Payout ID: ${payout.id.slice(0, 8)}`);
        console.log(`      Amount: $${(payout.amount / 100).toFixed(2)}`);
        console.log(`      Method: ${payout.method}`);
        console.log(`      Status: ${payout.status}`);
        console.log(`      Requested: ${new Date(payout.requested_at).toLocaleDateString()}`);
      });
    } else {
      console.log('⚠️  No payouts found');
    }
    
    return payouts;
  } else {
    console.error('❌ Failed to get payouts:', result.error);
    return [];
  }
}

async function testRequestPayout(balance) {
  console.log('\n💳 TEST 4: Request Payout');
  console.log('='.repeat(60));
  
  if (!balance || balance.available <= 0) {
    console.log('⚠️  No available balance to request payout');
    console.log('   Skipping payout request test');
    return null;
  }
  
  const payoutAmount = Math.min(balance.available, 10000); // Request up to $100
  
  console.log(`📤 Requesting payout of $${(payoutAmount / 100).toFixed(2)}`);
  
  const result = await makeRequest('POST', '/seller/payouts/request', {
    amount: payoutAmount,
    method: 'bank_transfer'
  }, sellerToken);
  
  if (result.success) {
    testPayoutId = result.data.data.id;
    console.log('✅ Payout requested successfully');
    console.log(`   Payout ID: ${testPayoutId.slice(0, 8)}`);
    console.log(`   Amount: $${(payoutAmount / 100).toFixed(2)}`);
    console.log(`   Status: ${result.data.data.status}`);
    return result.data.data;
  } else {
    console.error('❌ Failed to request payout:', result.error);
    return null;
  }
}

async function testAdminGetPayouts() {
  console.log('\n👨‍💼 TEST 5: Admin - Get Pending Payouts');
  console.log('='.repeat(60));
  
  const result = await makeRequest('GET', '/admin/payouts?status=pending_approval', null, adminToken);
  
  if (result.success) {
    const payouts = result.data.data || result.data.payouts || [];
    console.log(`✅ Retrieved ${payouts.length} pending payouts`);
    
    if (payouts.length > 0) {
      console.log('\n📊 Pending Payouts:');
      payouts.forEach((payout, index) => {
        console.log(`\n   ${index + 1}. Payout ID: ${payout.id.slice(0, 8)}`);
        console.log(`      Seller: ${payout.seller_id?.slice(0, 8) || 'N/A'}`);
        console.log(`      Amount: $${(payout.amount / 100).toFixed(2)}`);
        console.log(`      Method: ${payout.method}`);
        console.log(`      Status: ${payout.status}`);
      });
    }
    
    return payouts;
  } else {
    console.error('❌ Failed to get admin payouts:', result.error);
    return [];
  }
}

async function testAdminApprovePayout() {
  console.log('\n✅ TEST 6: Admin - Approve Payout');
  console.log('='.repeat(60));
  
  if (!testPayoutId) {
    console.log('⚠️  No payout ID to approve');
    console.log('   Skipping approval test');
    return null;
  }
  
  console.log(`📝 Approving payout: ${testPayoutId.slice(0, 8)}`);
  
  const result = await makeRequest('PUT', `/admin/payouts/${testPayoutId}/approve`, {}, adminToken);
  
  if (result.success) {
    console.log('✅ Payout approved successfully');
    console.log(`   Status: ${result.data.data?.status || 'approved'}`);
    return result.data.data;
  } else {
    console.error('❌ Failed to approve payout:', result.error);
    return null;
  }
}

async function testPaymentAccountSetup() {
  console.log('\n🏦 TEST 7: Payment Account Setup');
  console.log('='.repeat(60));
  
  // Check if seller has payment account set up
  const result = await makeRequest('GET', '/seller/payment-account', null, sellerToken);
  
  if (result.success) {
    console.log('✅ Payment account info retrieved');
    const account = result.data.data || {};
    console.log('📊 Account Details:');
    console.log(`   Method: ${account.method || 'Not set up'}`);
    console.log(`   Verified: ${account.verified ? 'Yes' : 'No'}`);
    
    if (!account.method) {
      console.log('\n💡 TIP: Seller needs to set up payment account');
      console.log('   Options: Stripe Connect, Bank Account, PayPal');
    }
    
    return account;
  } else {
    console.error('❌ Failed to get payment account:', result.error);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 SELLER PAYMENT SYSTEM - COMPLETE TEST');
  console.log('='.repeat(60));
  
  try {
    // Login
    const sellerLoggedIn = await loginSeller();
    if (!sellerLoggedIn) {
      console.error('\n❌ Cannot proceed without seller login');
      return;
    }
    
    const adminLoggedIn = await loginAdmin();
    if (!adminLoggedIn) {
      console.error('\n❌ Cannot proceed without admin login');
      return;
    }
    
    // Run tests
    const balance = await testGetPayoutBalance();
    await testGetEarnings();
    await testGetPayouts();
    await testPaymentAccountSetup();
    
    // Only test payout request if there's available balance
    if (balance && balance.available > 0) {
      await testRequestPayout(balance);
      await testAdminGetPayouts();
      await testAdminApprovePayout();
    } else {
      console.log('\n⚠️  Skipping payout request tests (no available balance)');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run tests
runAllTests()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test script failed:', error.message);
    process.exit(1);
  });
