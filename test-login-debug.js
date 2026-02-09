/**
 * DEBUG LOGIN ISSUE
 * Test actual login with database
 */

const supabase = require('./config/supabase');
const { hashPassword, comparePassword } = require('./utils/hash');

async function testLogin() {
  console.log('\n🔍 Debugging Login Issue...\n');

  try {
    // Test 1: Check database connection
    console.log('📋 Test 1: Database Connection');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('   ❌ Database connection failed:', testError.message);
      return;
    }
    console.log('   ✅ Database connected\n');

    // Test 2: Check if users table exists and has data
    console.log('📋 Test 2: Users Table Check');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, password_hash, status')
      .limit(5);
    
    if (usersError) {
      console.log('   ❌ Error querying users:', usersError.message);
      return;
    }
    
    console.log(`   ✅ Found ${users.length} users`);
    users.forEach(user => {
      console.log(`      - ${user.email} (${user.role}) - Status: ${user.status}`);
      console.log(`        Has password_hash: ${user.password_hash ? 'YES' : 'NO'}`);
    });
    console.log('');

    // Test 3: Try to find a specific user by email
    const testEmail = users.length > 0 ? users[0].email : 'test@example.com';
    console.log(`📋 Test 3: Find User by Email (${testEmail})`);
    
    const { data: foundUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (findError) {
      console.log('   ❌ Error finding user:', findError.message);
      console.log('   Error code:', findError.code);
    } else if (foundUser) {
      console.log('   ✅ User found');
      console.log('      ID:', foundUser.id);
      console.log('      Email:', foundUser.email);
      console.log('      Role:', foundUser.role);
      console.log('      Status:', foundUser.status);
      console.log('      Has password_hash:', foundUser.password_hash ? 'YES' : 'NO');
      console.log('      Password hash length:', foundUser.password_hash ? foundUser.password_hash.length : 0);
    }
    console.log('');

    // Test 4: Create a test user and try to login
    console.log('📋 Test 4: Create Test User and Login');
    const testPassword = 'TestPassword123';
    const testUserEmail = `test-${Date.now()}@example.com`;
    
    console.log('   Creating test user...');
    const passwordHash = await hashPassword(testPassword);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: testUserEmail,
        password_hash: passwordHash,
        role: 'customer',
        display_name: 'Test User',
        status: 'active'
      }])
      .select()
      .single();
    
    if (createError) {
      console.log('   ❌ Error creating user:', createError.message);
      return;
    }
    
    console.log('   ✅ Test user created:', testUserEmail);
    console.log('');

    // Test 5: Try to login with the test user
    console.log('📋 Test 5: Login Test');
    console.log('   Email:', testUserEmail);
    console.log('   Password:', testPassword);
    
    // Find user
    const { data: loginUser, error: loginFindError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUserEmail)
      .single();
    
    if (loginFindError) {
      console.log('   ❌ Error finding user for login:', loginFindError.message);
      return;
    }
    
    console.log('   ✅ User found for login');
    console.log('   Status:', loginUser.status);
    
    // Check password
    const isPasswordValid = await comparePassword(testPassword, loginUser.password_hash);
    console.log('   Password match:', isPasswordValid ? '✅ YES' : '❌ NO');
    
    if (!isPasswordValid) {
      console.log('   ⚠️  Password comparison failed!');
      console.log('   Expected password:', testPassword);
      console.log('   Hash in DB:', loginUser.password_hash);
    }
    
    // Clean up test user
    console.log('\n   Cleaning up test user...');
    await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id);
    console.log('   ✅ Test user deleted\n');

    // Test 6: Check for common issues
    console.log('📋 Test 6: Common Issues Check');
    
    // Check if any users have null password_hash
    const { data: nullPassUsers, error: nullError } = await supabase
      .from('users')
      .select('id, email, role')
      .is('password_hash', null);
    
    if (!nullError && nullPassUsers && nullPassUsers.length > 0) {
      console.log(`   ⚠️  Found ${nullPassUsers.length} users with NULL password_hash:`);
      nullPassUsers.forEach(user => {
        console.log(`      - ${user.email} (${user.role})`);
      });
    } else {
      console.log('   ✅ No users with NULL password_hash');
    }
    
    // Check if any users have inactive status
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .neq('status', 'active');
    
    if (!inactiveError && inactiveUsers && inactiveUsers.length > 0) {
      console.log(`\n   ⚠️  Found ${inactiveUsers.length} users with non-active status:`);
      inactiveUsers.forEach(user => {
        console.log(`      - ${user.email} (${user.role}) - Status: ${user.status}`);
      });
    } else {
      console.log('   ✅ All users have active status');
    }

    console.log('\n✨ Debug complete!\n');

  } catch (error) {
    console.error('\n❌ Error during debug:', error.message);
    console.error(error);
  }
}

testLogin();
