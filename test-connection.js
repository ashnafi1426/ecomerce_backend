/**
 * SUPABASE CONNECTION TEST
 * 
 * Run this script to verify Supabase connection is working properly.
 * Usage: node test-connection.js
 */

require('dotenv').config();
const supabase = require('./config/supabase');

async function testConnection() {
  console.log('\n🔍 Testing Supabase Connection...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  // Test 1: Check users table
  console.log('🧪 Test 1: Checking users table...');
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: false })
      .limit(1);
    
    if (error) {
      console.log('   ❌ Failed:', error.message);
      console.log('   💡 Make sure you have run the database setup SQL script');
    } else {
      console.log('   ✅ Users table accessible');
      console.log('   📊 Total users:', count || 0);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // Test 2: Check products table
  console.log('🧪 Test 2: Checking products table...');
  try {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: false })
      .limit(1);
    
    if (error) {
      console.log('   ❌ Failed:', error.message);
    } else {
      console.log('   ✅ Products table accessible');
      console.log('   📊 Total products:', count || 0);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // Test 3: Check orders table
  console.log('🧪 Test 3: Checking orders table...');
  try {
    const { data, error, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: false })
      .limit(1);
    
    if (error) {
      console.log('   ❌ Failed:', error.message);
    } else {
      console.log('   ✅ Orders table accessible');
      console.log('   📊 Total orders:', count || 0);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // Test 4: Check categories table
  console.log('🧪 Test 4: Checking categories table...');
  try {
    const { data, error, count } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: false })
      .limit(1);
    
    if (error) {
      console.log('   ❌ Failed:', error.message);
    } else {
      console.log('   ✅ Categories table accessible');
      console.log('   📊 Total categories:', count || 0);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  // Test 5: Check inventory table
  console.log('🧪 Test 5: Checking inventory table...');
  try {
    const { data, error, count } = await supabase
      .from('inventory')
      .select('*', { count: 'exact', head: false })
      .limit(1);
    
    if (error) {
      console.log('   ❌ Failed:', error.message);
    } else {
      console.log('   ✅ Inventory table accessible');
      console.log('   📊 Total inventory records:', count || 0);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }
  console.log('');

  console.log('✨ Connection test complete!\n');
}

testConnection().catch(console.error);
