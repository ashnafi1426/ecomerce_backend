const supabase = require('./config/supabase.js');

/**
 * Check Current Seller Earnings Schema
 * Identifies what columns exist and what's missing
 */
async function checkSellerEarningsSchema() {
  try {
    console.log('🔍 Checking seller_earnings table schema...');
    
    // Check if table exists and get its structure
    const { data, error } = await supabase
      .from('seller_earnings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing seller_earnings table:', error.message);
      
      // Check if table exists at all
      if (error.message.includes('does not exist')) {
        console.log('📋 Table does not exist. Need to create it.');
        return { exists: false, columns: [] };
      }
      
      return { exists: true, error: error.message };
    }
    
    console.log('✅ seller_earnings table exists');
    console.log('📊 Sample data:', data);
    
    // Try to get column information by attempting to select specific columns
    const columnsToCheck = [
      'id',
      'seller_id', 
      'sub_order_id',
      'order_id',
      'gross_amount',
      'commission_amount', 
      'net_amount',
      'commission_rate',
      'status',
      'available_date', // This is the missing one
      'payout_id',
      'created_at',
      'updated_at'
    ];
    
    const existingColumns = [];
    const missingColumns = [];
    
    for (const column of columnsToCheck) {
      try {
        const { data: columnData, error: columnError } = await supabase
          .from('seller_earnings')
          .select(column)
          .limit(1);
          
        if (columnError) {
          if (columnError.message.includes('does not exist')) {
            missingColumns.push(column);
            console.log(`❌ Column '${column}' does not exist`);
          } else {
            console.log(`⚠️  Column '${column}' check failed:`, columnError.message);
          }
        } else {
          existingColumns.push(column);
          console.log(`✅ Column '${column}' exists`);
        }
      } catch (err) {
        console.log(`❌ Error checking column '${column}':`, err.message);
        missingColumns.push(column);
      }
    }
    
    console.log('\n📋 Schema Summary:');
    console.log('✅ Existing columns:', existingColumns);
    console.log('❌ Missing columns:', missingColumns);
    
    return {
      exists: true,
      existingColumns,
      missingColumns,
      needsUpdate: missingColumns.length > 0
    };
    
  } catch (error) {
    console.error('💥 Error checking schema:', error);
    return { exists: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  checkSellerEarningsSchema()
    .then((result) => {
      console.log('\n🏁 Schema check completed');
      if (result.needsUpdate) {
        console.log('🔧 Action needed: Run schema update migration');
      } else {
        console.log('✅ Schema is up to date');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Schema check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkSellerEarningsSchema };