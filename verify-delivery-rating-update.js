/**
 * Verify Delivery Rating Schema Update
 * 
 * This script verifies that the delivery_ratings table has been updated correctly
 * and matches the design specifications.
 * 
 * Requirements: 3.1, 3.2, 3.10
 */

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

// Expected schema based on design.md
const EXPECTED_COLUMNS = [
    'id',
    'order_id',
    'sub_order_id',
    'customer_id',
    'seller_id',
    'overall_rating',
    'packaging_quality_rating',
    'delivery_speed_rating',
    'delivery_person_rating',
    'overall_feedback',
    'packaging_feedback',
    'delivery_speed_feedback',
    'delivery_person_feedback',
    'is_flagged',
    'flagged_reason',
    'created_at'
];

const EXPECTED_INDEXES = [
    'idx_delivery_ratings_order',
    'idx_delivery_ratings_seller',
    'idx_delivery_ratings_customer',
    'idx_delivery_ratings_flagged',
    'idx_delivery_ratings_low',
    'idx_delivery_ratings_seller_created'
];

const EXPECTED_CONSTRAINTS = [
    'unique_order_delivery_rating'
];

async function verifySchema() {
    console.log('========================================');
    console.log('DELIVERY RATING SCHEMA VERIFICATION');
    console.log('========================================\n');

    let allChecksPass = true;

    try {
        // 1. Check if table exists
        console.log('1️⃣  Checking if delivery_ratings table exists...');
        const { data: tableExists, error: tableError } = await supabase
            .from('delivery_ratings')
            .select('id')
            .limit(1);

        if (tableError && tableError.code === '42P01') {
            console.log('   ❌ Table does not exist!\n');
            allChecksPass = false;
        } else {
            console.log('   ✅ Table exists\n');
        }

        // 2. Check columns
        console.log('2️⃣  Checking table columns...');
        const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
            sql_query: `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = 'delivery_ratings'
                ORDER BY ordinal_position;
            `
        });

        if (columnsError) {
            console.log('   ⚠️  Could not fetch columns, trying alternative method...');
            
            // Try to get columns by querying the table
            const { data: testData, error: testError } = await supabase
                .from('delivery_ratings')
                .select('*')
                .limit(0);

            if (!testError) {
                console.log('   ✅ Table is accessible\n');
            } else {
                console.log('   ❌ Could not access table\n');
                allChecksPass = false;
            }
        } else {
            const foundColumns = columns.map(c => c.column_name);
            const missingColumns = EXPECTED_COLUMNS.filter(col => !foundColumns.includes(col));
            
            if (missingColumns.length === 0) {
                console.log('   ✅ All expected columns present');
                console.log(`   Found ${foundColumns.length} columns:\n`);
                foundColumns.forEach(col => {
                    console.log(`      - ${col}`);
                });
                console.log('');
            } else {
                console.log('   ❌ Missing columns:');
                missingColumns.forEach(col => {
                    console.log(`      - ${col}`);
                });
                console.log('');
                allChecksPass = false;
            }
        }

        // 3. Check indexes
        console.log('3️⃣  Checking indexes...');
        const { data: indexes, error: indexesErro
            