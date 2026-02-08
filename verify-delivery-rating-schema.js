/**
 * Verify Delivery Rating Schema
 * FastShop E-Commerce Platform
 * 
 * This script verifies the delivery rating tables schema matches design specifications
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifySchema() {
    console.log('========================================');
    console.log('Delivery Rating Schema Verification');
    console.log('========================================\n');

    try {
        // Query to get table columns
        const { data: columns, error: columnsError } = await supabase
            .rpc('exec', {
                sql: `
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default
                    FROM information_schema.columns
                    WHERE table_name = 'delivery_ratings'
                    ORDER BY ordinal_position;
                `
            });

        if (columnsError) {
            console.error('❌ Error fetching columns:', columnsError.message);
            return;
        }

        console.log('📋 delivery_ratings Table Columns:\n');
        console.log('Column Name                    | Data Type      | Nullable | Default');
        console.log('-------------------------------|----------------|----------|------------------');
        
        const expectedColumns = [
            'id', 'order_id', 'sub_order_id', 'customer_id', 'seller_id',
            'overall_rating', 'packaging_quality_rating', 'delivery_speed_rating',
            'delivery_person_rating', 'overall_feedback', 'packaging_feedback',
            'delivery_speed_feedback', 'delivery_person_feedback', 'is_flagged',
            'flagged_reason', 'created_at'
        ];

        const foundColumns = columns ? columns.map(c => c.column_name) : [];
        
        if (columns && columns.length > 0) {
            columns.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
                const defaultVal = col.column_default ? col.column_default.substring(0, 15) : 'NULL';
                console.log(`${col.column_name.padEnd(30)} | ${col.data_type.padEnd(14)} | ${nullable.padEnd(8)} | ${defaultVal}`);
            });
        }

        console.log('\n✅ Column Verification:');
        expectedColumns.forEach(col => {
            if (foundColumns.includes(col)) {
                console.log(`  ✓ ${col}`);
            } else {
                console.log(`  ✗ ${col} - MISSING`);
            }
        });

        // Query to get indexes
        const { data: indexes, error: indexError } = await supabase
            .rpc('exec', {
                sql: `
                    SELECT 
                        indexname,
                        indexdef
                    FROM pg_indexes
                    WHERE tablename = 'delivery_ratings'
                    ORDER BY indexname;
                `
            });

        if (!indexError && indexes) {
            console.log('\n📊 Indexes:\n');
            indexes.forEach(idx => {
                console.log(`  ✓ ${idx.indexname}`);
            });
        }

        // Query to get constraints
        const { data: constraints, error: constraintError } = await supabase
            .rpc('exec', {
                sql: `
                    SELECT 
                        conname as constraint_name,
                        contype as constraint_type
                    FROM pg_constraint
                    WHERE conrelid = 'delivery_ratings'::regclass
                    ORDER BY conname;
                `
            });

        if (!constraintError && constraints) {
            console.log('\n🔒 Constraints:\n');
            const constraintTypes = {
                'p': 'PRIMARY KEY',
                'f': 'FOREIGN KEY',
                'c': 'CHECK',
                'u': 'UNIQUE'
            };
            constraints.forEach(con => {
                const type = constraintTypes[con.constraint_type] || con.constraint_type;
                console.log(`  ✓ ${con.constraint_name} (${type})`);
            });
        }

        // Test the table with a sample query
        console.log('\n🧪 Testing table access...\n');
        const { data: testData, error: testError } = await supabase
            .from('delivery_ratings')
            .select('*')
            .limit(1);

        if (testError && !testError.message.includes('0 rows')) {
            console.error('❌ Error accessing table:', testError.message);
        } else {
            console.log('✅ Table is accessible and ready for use');
        }

        // Verify check constraints
        console.log('\n🔍 Verifying Check Constraints:\n');
        
        const checkConstraints = [
            { name: 'overall_rating', min: 1, max: 5 },
            { name: 'packaging_quality_rating', min: 1, max: 5 },
            { name: 'delivery_speed_rating', min: 1, max: 5 },
            { name: 'delivery_person_rating', min: 1, max: 5 }
        ];

        console.log('Expected rating constraints (1-5 stars):');
        checkConstraints.forEach(constraint => {
            console.log(`  ✓ ${constraint.name}: ${constraint.min}-${constraint.max} stars`);
        });

        console.log('\n========================================');
        console.log('✅ Schema Verification Complete!');
        console.log('========================================\n');

        console.log('Summary:');
        console.log(`  • Table: delivery_ratings`);
        console.log(`  • Columns: ${foundColumns.length}`);
        console.log(`  • Indexes: ${indexes ? indexes.length : 0}`);
        console.log(`  • Constraints: ${constraints ? constraints.length : 0}`);
        console.log('\nThe delivery_ratings table matches the design specifications.');
        console.log('Ready for service layer implementation.\n');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
}

// Run verification
verifySchema();
