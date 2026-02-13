/**
 * CHECK USERS SCHEMA
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsersSchema() {
  try {
    console.log('🔍 Checking users table schema...\n');

    // Get a sample user to see the structure
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    if (users.length > 0) {
      console.log('📊 Users table columns:');
      Object.keys(users[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof users[0][column]} (${users[0][column]})`);
      });
    } else {
      console.log('No users found in table');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkUsersSchema();