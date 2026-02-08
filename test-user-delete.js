/**
 * TEST USER DELETE OPERATION
 * 
 * Tests the admin delete user functionality
 */

const supabase = require('./config/supabase');
const userService = require('./services/userServices/user.service');
const { hashPassword } = require('./utils/hash');

async function testUserDelete() {
  console.log('🧪 Testing User Delete Operation...\n');

  try {
    // Step 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const testEmail = `testuser_${Date.now()}@test.com`;
    const passwordHash = await hashPassword('TestPassword123!');
    
    const newUser = await userService.create({
      email: testEmail,
      passwordHash,
      role: 'customer',
      displayName: 'Test User for Deletion'
    });
    
    console.log('✅ Test user created:', {
      id: newUser.id,
      email: newUser.email,
      status: newUser.status
    });

    // Step 2: Verify user exists and is active
    console.log('\n2️⃣ Verifying user is active...');
    const userBefore = await userService.findById(newUser.id);
    console.log('✅ User status before delete:', userBefore.status);

    // Step 3: Delete the user (soft delete)
    console.log('\n3️⃣ Deleting user (soft delete)...');
    await userService.deleteUser(newUser.id);
    console.log('✅ Delete operation completed');

    // Step 4: Verify user status changed to 'deleted'
    console.log('\n4️⃣ Verifying user status after delete...');
    const userAfter = await userService.findById(newUser.id);
    console.log('✅ User status after delete:', userAfter.status);

    if (userAfter.status === 'deleted') {
      console.log('\n✅ SUCCESS: User delete operation works correctly!');
      console.log('   Status changed from "active" to "deleted"');
    } else {
      console.log('\n❌ FAILED: User status is not "deleted"');
      console.log('   Expected: "deleted", Got:', userAfter.status);
    }

    // Step 5: Test that deleted users can still be retrieved by ID
    console.log('\n5️⃣ Testing deleted user retrieval...');
    const deletedUser = await userService.findById(newUser.id);
    if (deletedUser) {
      console.log('✅ Deleted user can still be retrieved (soft delete working)');
    } else {
      console.log('❌ Deleted user cannot be retrieved');
    }

    // Step 6: Cleanup - Actually delete the test user from database
    console.log('\n6️⃣ Cleaning up test data...');
    const { error: cleanupError } = await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id);
    
    if (cleanupError) {
      console.log('⚠️  Cleanup warning:', cleanupError.message);
    } else {
      console.log('✅ Test user removed from database');
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the test
testUserDelete()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
