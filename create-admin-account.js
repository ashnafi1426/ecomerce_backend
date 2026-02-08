/**
 * CREATE ADMIN ACCOUNT
 * Creates an admin account in the database
 */

const { hashPassword } = require('./utils/hash');
const supabase = require('./config/supabase');

const ADMIN_EMAIL = 'admin@ecommerce.com';
const ADMIN_PASSWORD = 'Admin123!@#';
const ADMIN_DISPLAY_NAME = 'Admin User';

async function createAdminAccount() {
  console.log('🔐 Creating Admin Account...\n');

  try {
    // 1. Check if admin already exists
    console.log('1️⃣  Checking if admin exists...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (existingUser) {
      console.log('⚠️  Admin account already exists!');
      console.log('   Email:', existingUser.email);
      console.log('   Role:', existingUser.role);
      
      if (existingUser.role !== 'admin') {
        console.log('\n2️⃣  Updating role to admin...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', existingUser.id);

        if (updateError) throw updateError;
        console.log('✅ Role updated to admin!');
      }

      console.log('\n✅ Admin account is ready!');
      console.log('\n📋 Admin Credentials:');
      console.log('   Email:', ADMIN_EMAIL);
      console.log('   Password:', ADMIN_PASSWORD);
      console.log('\n🚀 You can now login in Postman!');
      return;
    }

    // 2. Hash password
    console.log('2️⃣  Hashing password...');
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    console.log('✅ Password hashed');

    // 3. Create admin user
    console.log('\n3️⃣  Creating admin user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        role: 'admin',
        display_name: ADMIN_DISPLAY_NAME,
        status: 'active'
      }])
      .select('id, email, role, display_name, created_at')
      .single();

    if (createError) throw createError;

    console.log('✅ Admin account created successfully!');
    console.log('\n📋 Admin Details:');
    console.log('   ID:', newUser.id);
    console.log('   Email:', newUser.email);
    console.log('   Role:', newUser.role);
    console.log('   Display Name:', newUser.display_name);
    console.log('   Created:', newUser.created_at);

    console.log('\n🔑 Admin Credentials:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);

    console.log('\n✅ SUCCESS! Admin account is ready!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Open Postman');
    console.log('   2. Import: E-Commerce-Admin-Complete.postman_collection.json');
    console.log('   3. Run "Login Admin" request');
    console.log('   4. Start testing admin endpoints!');

  } catch (error) {
    console.error('\n❌ ERROR creating admin account:');
    console.error('   Message:', error.message);
    if (error.details) console.error('   Details:', error.details);
    if (error.hint) console.error('   Hint:', error.hint);
    process.exit(1);
  }
}

// Run the script
createAdminAccount();
