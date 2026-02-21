/**
 * Setup Complete Database Schema
 * 
 * This script runs the complete database schema from ALL-PHASES-COMPLETE-DATABASE.sql
 * to ensure all base tables exist before running feature-specific migrations.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
  console.log('🚀 Setting up complete database schema...\n');
  
  try {
    // Read the complete database schema file
    const schemaPath = path.join(__dirname, 'database', 'ALL-PHASES-COMPLETE-DATABASE.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Running ALL-PHASES-COMPLETE-DATABASE.sql...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: schemaSql });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Complete database schema applied successfully!\n');
    
    // Verify key tables exist
    console.log('🔍 Verifying tables...');
    const tables = [
      'users',
      'categories', 
      'products',
      'inventory',
      'orders',
      'payments',
      'sub_orders',
      'seller_earnings',
      'notifications'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - ${error.message}`);
      }
    }
    
    console.log('\n✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupDatabase();
