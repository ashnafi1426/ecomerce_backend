const { supabase } = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function runWishlistMigration() {
  try {
    console.log('🚀 Starting wishlist migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'create-wishlist-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    
    console.log('✅ Wishlist migration completed successfully!');
    
    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'wishlist');
    
    if (tableError) {
      console.error('❌ Error verifying table:', tableError);
      return;
    }
    
    if (tables && tables.length > 0) {
      console.log('✅ Wishlist table verified successfully');
      
      // Check if we have any sample data
      const { count, error: countError } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`📊 Sample wishlist items created: ${count || 0}`);
      }
    } else {
      console.log('⚠️ Wishlist table not found - migration may have failed');
    }
    
  } catch (error) {
    console.error('❌ Error running migration:', error);
  }
}

// Run the migration
runWishlistMigration();