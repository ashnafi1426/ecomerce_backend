const supabase = require('./config/supabase.js');

async function addPaidAtColumn() {
  try {
    console.log('🔧 Adding paid_at column to seller_earnings table...');
    console.log('');
    
    // Test if column already exists by trying to select it
    const { data: test, error: testError } = await supabase
      .from('seller_earnings')
      .select('paid_at')
      .limit(1);
    
    if (!testError) {
      console.log('✅ paid_at column already exists!');
      return;
    }
    
    if (!testError || !testError.message.includes('paid_at')) {
      console.log('✅ paid_at column already exists!');
      return;
    }
    
    console.log('❌ Column does not exist. Please run this SQL in Supabase SQL Editor:');
    console.log('');
    console.log('ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;');
    console.log('');
    console.log('After running the SQL, restart the backend server.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addPaidAtColumn();
