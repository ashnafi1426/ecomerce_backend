/**
 * CREATE MANAGER ACCOUNT
 * Creates a manager account for testing
 */

const supabase = require('./config/supabase');
const { hashPassword } = require('./utils/hash');

async function createManager() {
  console.log('\n🔧 Creating Manager Account...\n');

  const managerData = {
    email: 'manager@test.com',
    password: 'Manager123!@#',
    displayName: 'Test Manager'
  };

  try {
    // Check if manager already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', managerData.email)
      .single();
    
    if (existing) {
      console.log('⚠️  Manager account already exists!');
      console.log('   Email:', existing.email);
      console.log('\n✅ You can login with:');
      console.log('   Email:', managerData.email);
      console.log('   Password:', managerData.password);
      console.log('');
      return;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(managerData.password);

    // Create manager
    console.log('👤 Creating manager account...');
    const { data: manager, error } = await supabase
      .from('users')
      .insert([{
        email: managerData.email,
        password_hash: passwordHash,
        role: 'manager',
        display_name: managerData.displayName,
        status: 'active'
      }])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error creating manager:', error.message);
      return;
    }

    console.log('✅ Manager account created successfully!\n');
    console.log('📋 Manager Details:');
    console.log('   ID:', manager.id);
    console.log('   Email:', manager.email);
    console.log('   Name:', manager.display_name);
    console.log('   Role:', manager.role);
    console.log('   Status:', manager.status);
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Email:', managerData.email);
    console.log('   Password:', managerData.password);
    console.log('');
    console.log('📝 Use these credentials in Postman:');
    console.log('   POST http://localhost:5000/api/auth/login');
    console.log('   Body:');
    console.log('   {');
    console.log(`     "email": "${managerData.email}",`);
    console.log(`     "password": "${managerData.password}"`);
    console.log('   }');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

createManager();
