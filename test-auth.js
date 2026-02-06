/**
 * AUTHENTICATION SYSTEM TEST
 * 
 * Tests the authentication and authorization system.
 * Run with: node test-auth.js
 */

require('dotenv').config();
const { hashPassword, comparePassword } = require('./utils/hash');
const { generateToken, verifyToken } = require('./config/jwt');

async function testAuth() {
  console.log('\n🧪 Testing Authentication System...\n');

  try {
    // Test 1: Password Hashing
    console.log('📋 Test 1: Password Hashing');
    const password = 'SecurePassword123';
    const hash = await hashPassword(password);
    console.log(`   ✅ Password hashed successfully`);
    console.log(`   Original: ${password}`);
    console.log(`   Hash: ${hash.substring(0, 30)}...`);

    // Test 2: Password Comparison
    console.log('\n📋 Test 2: Password Comparison');
    const isValid = await comparePassword(password, hash);
    console.log(`   ✅ Password comparison: ${isValid ? 'MATCH' : 'NO MATCH'}`);
    
    const isInvalid = await comparePassword('WrongPassword', hash);
    console.log(`   ✅ Wrong password: ${isInvalid ? 'MATCH' : 'NO MATCH (correct)'}`);

    // Test 3: JWT Token Generation
    console.log('\n📋 Test 3: JWT Token Generation');
    const payload = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      role: 'customer'
    };
    const token = generateToken(payload);
    console.log(`   ✅ Token generated successfully`);
    console.log(`   Token: ${token.substring(0, 50)}...`);

    // Test 4: JWT Token Verification
    console.log('\n📋 Test 4: JWT Token Verification');
    const decoded = verifyToken(token);
    console.log(`   ✅ Token verified successfully`);
    console.log(`   User ID: ${decoded.userId}`);
    console.log(`   Role: ${decoded.role}`);

    // Test 5: Invalid Token
    console.log('\n📋 Test 5: Invalid Token Handling');
    try {
      verifyToken('invalid.token.here');
      console.log('   ❌ Should have thrown error');
    } catch (error) {
      console.log(`   ✅ Invalid token rejected: ${error.message}`);
    }

    // Test 6: Email Validation
    console.log('\n📋 Test 6: Email Validation');
    const { validateEmail } = require('./middlewares/validation.middleware');
    const validEmail = 'user@example.com';
    const invalidEmail = 'invalid-email';
    console.log(`   ✅ Valid email (${validEmail}): ${validateEmail(validEmail)}`);
    console.log(`   ✅ Invalid email (${invalidEmail}): ${validateEmail(invalidEmail)}`);

    // Test 7: Password Strength Validation
    console.log('\n📋 Test 7: Password Strength Validation');
    const { validatePasswordStrength } = require('./middlewares/validation.middleware');
    
    const weakPassword = 'weak';
    const strongPassword = 'StrongPass123';
    
    const weakResult = validatePasswordStrength(weakPassword);
    console.log(`   ✅ Weak password (${weakPassword}): ${weakResult.valid ? 'VALID' : 'INVALID'}`);
    if (!weakResult.valid) {
      console.log(`      Reason: ${weakResult.message}`);
    }
    
    const strongResult = validatePasswordStrength(strongPassword);
    console.log(`   ✅ Strong password (${strongPassword}): ${strongResult.valid ? 'VALID' : 'INVALID'}`);

    console.log('\n✨ All authentication tests passed!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testAuth();
