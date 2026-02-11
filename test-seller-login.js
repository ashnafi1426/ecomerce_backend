const axios = require('axios');

const sellers = [
  { email: 'seller1@fastshop.com', password: 'password123' },
  { email: 'seller2@fastshop.com', password: 'password123' },
  { email: 'seller3@fastshop.com', password: 'password123' },
  { email: 'seller@test.com', password: 'Test123!@#' },
  { email: 'seller@test.com', password: 'password123' },
];

async function testLogin(email, password) {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });
    
    console.log(`✅ SUCCESS: ${email}`);
    console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   Role: ${response.data.user.role}`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${email} - ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAllSellers() {
  console.log('Testing Seller Logins...\n');
  
  for (const seller of sellers) {
    await testLogin(seller.email, seller.password);
    console.log('');
  }
}

testAllSellers();
