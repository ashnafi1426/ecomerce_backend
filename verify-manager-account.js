const supabase = require('./config/supabase');

async function verifyManagerAccount() {
  console.log('🔍 Verifying Manager Account...\n');
  
  try {
    // Check if manager account exists
    const { data: manager, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'manager@fastshop.com')
      .single();
    
    if (error) {
      console.error('❌ Error finding manager account:', error.message);
      return;
    }
    
    if (!manager) {
      console.log('❌ Manager account not found!');
      return;
    }
    
    console.log('✅ Manager account found:');
    console.log('ID:', manager.id);
    console.log('Email:', manager.email);
    console.log('Role:', manager.role);
    console.log('Display Name:', manager.display_name);
    console.log('Is Active:', manager.is_active);
    console.log('Created:', manager.created_at);
    
    // Verify role is correct
    if (manager.role !== 'manager') {
      console.log('⚠️ WARNING: Role is not "manager", it is:', manager.role);
    } else {
      console.log('✅ Role is correct: manager');
    }
    
    // Check if account is active
    if (!manager.is_active) {
      console.log('⚠️ WARNING: Account is not active');
    } else {
      console.log('✅ Account is active');
    }
    
    console.log('\n🎯 Manager account verification complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyManagerAccount();