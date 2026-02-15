/**
 * TEST: Registration 409 Error Diagnosis
 * 
 * This script helps diagnose the 409 "Email already registered" error
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testRegistration() {
  console.log('\n🧪 TESTING REGISTRATION 409 ERROR\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Try to register with a new unique email
    console.log('\n📋 Test 1: Register with NEW unique email...');
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    try {
      const response1 = await axios.post(`${API_URL}/api/auth/register`, {
        email: uniqueEmail,
        password: 'Test123!@#',
        displayName: 'Test User'
      });

      console.log('✅ Registration successful!');
      console.log(`   Email: ${uniqueEmail}`);
      console.log(`   User ID: ${response1.data.user.id}`);
      console.log(`   Token received: ${response1.data.token ? 'Yes' : 'No'}`);
    } catch (error) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
    }

    // Test 2: Try to register with the SAME email (should get 409)
    console.log('\n📋 Test 2: Register with SAME email (should get 409)...');
    
    try {
      const response2 = await axios.post(`${API_URL}/api/auth/register`, {
        email: uniqueEmail,
        password: 'Test123!@#',
        displayName: 'Test User 2'
      });

      console.log('❌ UNEXPECTED: Registration should have failed but succeeded!');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Correct behavior: Got 409 Conflict');
        console.log(`   Error: ${error.response.data.error}`);
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.error('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 3: Check common test emails
    console.log('\n📋 Test 3: Checking if common test emails exist...');
    const commonEmails = [
      'test@test.com',
      'customer@test.com',
      'seller@test.com',
      'admin@test.com',
      'user@example.com'
    ];

    for (const email of commonEmails) {
      try {
        await axios.post(`${API_URL}/api/auth/register`, {
          email: email,
          password: 'Test123!@#',
          displayName: 'Test'
        });
        console.log(`   ${email}: Available ✅`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`   ${email}: Already registered ⚠️`);
        } else {
          console.log(`   ${email}: Error - ${error.response?.status}`);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY:');
    console.log('\n✅ The 409 error is CORRECT behavior!');
    console.log('   It means the email is already registered in the database.');
    console.log('\n💡 SOLUTIONS FOR USERS:');
    console.log('   1. Use a different email address');
    console.log('   2. Login with existing account');
    console.log('   3. Use password reset if forgotten');
    console.log('\n🔧 FOR DEVELOPERS:');
    console.log('   - Make sure frontend shows clear error message');
    console.log('   - Add "Already have an account? Login" link');
    console.log('   - Consider adding "Forgot password?" link');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
  }
}

// Run the test
testRegistration()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
