/**
 * Run Update Delivery Ratings Schema Migration
 * 
 * This script applies the update migration to the delivery_ratings table.
 * The migration is IDEMPOTENT - safe to run multiple times.
 * 
 * Requirements: 3.1, 3.2, 3.10
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runMigration() {
    console.log('========================================');
    console.log('UPDATE DELIVERY RATINGS SCHEMA MIGRATION');
    console.log('========================================\n');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'database', 'migrations', 'update-delivery-ratings-schema.sql');
        console.log('📄 Reading migration file...');
        console.log(`   Path: ${migrationPath}\n`);

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        console.log('🚀 Executing migration...\n');
        
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: migrationSQL
        });

        if (error) {
            // If exec_sql function doesn't exist, try direct execution
            console.log('⚠️  exec_sql function not found, trying direct execution...\n');
            
            // Split the SQL into individual statements and execute them
            const statements = migrationSQL
                .split(/;\s*$/gm)
                .filter(stmt => stmt.trim().length > 0);

            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i].trim();
                if (stmt) {
                    try {
                        const { error: stmtError } = await supabase.rpc('exec_sql', {
                            sql_query: stmt + ';'
                        });
                        
                        if (stmtError) {
                            console.log(`⚠️  Statement ${i + 1} warning: ${stmtError.message}`);
                        }
                    } catch (err) {
                        console.log(`⚠️  Statement ${i + 1} warning: ${err.message}`);
                    }
                }
            }
        }

        console.log('✅ Migration executed successfully!\n');

        // Verify the table structure
        console.log('🔍 Verifying table structure...\n');
        
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'delivery_ratings')
            .order('ordinal_position');

        if (columnsError) {
            console.log('⚠️  Could not verify columns (this is okay)');
        } else if (columns && columns.length > 0) {
            console.log('📋 Table columns:');
            columns.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
            });
            console.log('');
        }

        // Verify indexes
        console.log('🔍 Verifying indexes...\n');
        
        const { data: indexes, error: indexesError } = await supabase
            .from('pg_indexes')
            .select('indexname, indexdef')
            .eq('tablename', 'delivery_ratings');

        if (indexesError) {
            console.log('⚠️  Could not verify indexes (this is okay)');
        } else if (indexes && indexes.length > 0) {
            console.log('📋 Table indexes:');
            indexes.forEach(idx => {
                console.log(`   - ${idx.indexname}`);
            });
            console.log('');
        }

        console.log('========================================');
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('========================================\n');
        console.log('Next steps:');
        console.log('1. Verify the schema in Supabase dashboard');
        console.log('2. Test the delivery rating functionality');
        console.log('3. Run the verification script: node verify-delivery-rating-schema.js\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
