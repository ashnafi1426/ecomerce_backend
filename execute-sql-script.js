const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLScript() {
  try {
    console.log('🔄 Executing SQL script to create test seller orders...\n');
    
    // Read the SQL script from the root directory
    const sqlPath = path.join(__dirname, '../../../../create-test-seller-orders.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL Script loaded successfully');
    console.log('🔗 Connecting to Supabase...');
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Split SQL into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Use raw SQL execution
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';' 
          });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('\n🔍 Verifying created data...');
    
    // Verify the data was created
    const { data: subOrders, error: queryError } = await supabase
      .from('sub_orders')
      .select(`
        *,
        orders!inner (
          id,
          created_at,
          shipping_address,
          status
        )
      `)
      .eq('seller_id', '08659266-babb-4323-b750-b1977c825e24');
    
    if (queryError) {
      console.error('❌ Error querying sub_orders:', queryError.message);
      return;
    }
    
    console.log(`✅ Found ${subOrders?.length || 0} sub_orders for seller`);
    
    if (subOrders && subOrders.length > 0) {
      console.log('\n📦 Created Orders:');
      subOrders.forEach((order, index) => {
        console.log(`${index + 1}. ID: ${order.id}`);
        console.log(`   Status: ${order.fulfillment_status}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleDateString()}`);
        console.log('');
      });
      
      console.log('🎉 SUCCESS: Test data created successfully!');
      console.log('\nNext steps:');
      console.log('1. Run: node ../../../../verify-seller-orders-final.js');
      console.log('2. Test the frontend seller orders page');
    } else {
      console.log('⚠️  No orders found - SQL execution may have failed');
      console.log('Check the error messages above');
    }
    
  } catch (error) {
    console.error('❌ Failed to execute SQL script:', error.message);
    console.error('Stack:', error.stack);
  }
}

executeSQLScript();