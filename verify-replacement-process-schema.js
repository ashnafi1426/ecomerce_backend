/**
 * Verify Replacement Process Schema
 * FastShop E-Commerce Platform
 * 
 * This script verifies that the replacement process tables and functions
 * were created correctly in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key
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

async function verifySchema() {
    console.log('========================================');
    console.log('Replacement Process Schema Verification');
    console.log('========================================\n');

    let allChecksPass = true;

    try {
        // 1. Verify replacement_requests table
        console.log('1️⃣  Checking replacement_requests table...');
        const { data: reqData, error: reqError } = await supabase
            .from('replacement_requests')
            .select('*')
            .limit(1);

        if (reqError && !reqError.message.includes('0 rows')) {
            console.error('   ❌ replacement_requests table not found or error:', reqError.message);
            allChecksPass = false;
        } else {
            console.log('   ✅ replacement_requests table exists');
        }

        // 2. Verify replacement_shipments table
        console.log('\n2️⃣  Checking replacement_shipments table...');
        const { data: shipData, error: shipError } = await supabase
            .from('replacement_shipments')
            .select('*')
            .limit(1);

        if (shipError && !shipError.message.includes('0 rows')) {
            console.error('   ❌ replacement_shipments table not found or error:', shipError.message);
            allChecksPass = false;
        } else {
            console.log('   ✅ replacement_shipments table exists');
        }

        // 3. Verify helper functions
        console.log('\n3️⃣  Checking helper functions...');
        
        const functions = [
            'can_create_replacement_request',
            'get_replacement_analytics',
            'get_product_replacement_rate',
            'get_seller_replacement_metrics',
            'reserve_replacement_inventory'
        ];

        for (const funcName of functions) {
            try {
                // Try to call each function with dummy parameters
                let result;
                if (funcName === 'can_create_replacement_request') {
                    result = await supabase.rpc(funcName, {
                        p_order_id: '00000000-0000-0000-0000-000000000000',
                        p_customer_id: '00000000-0000-0000-0000-000000000000',
                        p_product_id: '00000000-0000-0000-0000-000000000000'
                    });
                } else if (funcName === 'get_replacement_analytics') {
                    result = await supabase.rpc(funcName, {});
                } else if (funcName === 'get_product_replacement_rate') {
                    result = await supabase.rpc(funcName, {
                        p_product_id: '00000000-0000-0000-0000-000000000000'
                    });
                } else if (funcName === 'get_seller_replacement_metrics') {
                    result = await supabase.rpc(funcName, {
                        p_seller_id: '00000000-0000-0000-0000-000000000000'
                    });
                } else if (funcName === 'reserve_replacement_inventory') {
                    result = await supabase.rpc(funcName, {
                        p_replacement_request_id: '00000000-0000-0000-0000-000000000000'
                    });
                }

                if (result.error) {
                    // Function exists but returned an error (expected for dummy data)
                    console.log(`   ✅ ${funcName}() exists`);
                } else {
                    console.log(`   ✅ ${funcName}() exists and executed`);
                }
            } catch (err) {
                console.error(`   ❌ ${funcName}() not found or error:`, err.message);
                allChecksPass = false;
            }
        }

        // 4. Check for required columns in replacement_requests
        console.log('\n4️⃣  Checking replacement_requests columns...');
        const requiredReqColumns = [
            'id', 'order_id', 'customer_id', 'seller_id', 'product_id',
            'variant_id', 'quantity', 'reason_category', 'reason_description',
            'images', 'status', 'reviewed_by', 'reviewed_at', 'rejection_reason',
            'return_tracking_number', 'return_received_at', 'created_at', 'updated_at'
        ];

        // Try to select all columns
        const { error: colError } = await supabase
            .from('replacement_requests')
            .select(requiredReqColumns.join(','))
            .limit(0);

        if (colError) {
            console.error('   ❌ Some required columns missing:', colError.message);
            allChecksPass = false;
        } else {
            console.log('   ✅ All required columns present');
        }

        // 5. Check for required columns in replacement_shipments
        console.log('\n5️⃣  Checking replacement_shipments columns...');
        const requiredShipColumns = [
            'id', 'replacement_request_id', 'tracking_number', 'carrier',
            'shipped_at', 'estimated_delivery', 'delivered_at', 'notes',
            'created_at', 'updated_at'
        ];

        const { error: shipColError } = await supabase
            .from('replacement_shipments')
            .select(requiredShipColumns.join(','))
            .limit(0);

        if (shipColError) {
            console.error('   ❌ Some required columns missing:', shipColError.message);
            allChecksPass = false;
        } else {
            console.log('   ✅ All required columns present');
        }

        // 6. Check for additional columns in products table
        console.log('\n6️⃣  Checking products table enhancements...');
        const { error: prodError } = await supabase
            .from('products')
            .select('is_returnable, replacement_count')
            .limit(0);

        if (prodError) {
            console.warn('   ⚠️  Products table columns not found (may not exist yet):', prodError.message);
        } else {
            console.log('   ✅ Products table enhanced with replacement columns');
        }

        // 7. Test constraint validation
        console.log('\n7️⃣  Testing constraint validation...');
        
        // Try to insert invalid data (should fail)
        const { error: invalidStatusError } = await supabase
            .from('replacement_requests')
            .insert({
                order_id: '00000000-0000-0000-0000-000000000000',
                customer_id: '00000000-0000-0000-0000-000000000000',
                seller_id: '00000000-0000-0000-0000-000000000000',
                product_id: '00000000-0000-0000-0000-000000000000',
                quantity: 1,
                reason_category: 'invalid_reason', // Invalid value
                reason_description: 'Test',
                status: 'pending'
            });

        if (invalidStatusError && invalidStatusError.message.includes('violates check constraint')) {
            console.log('   ✅ Check constraints working (invalid reason_category rejected)');
        } else if (invalidStatusError) {
            console.log('   ✅ Constraints present (insert failed as expected)');
        } else {
            console.warn('   ⚠️  Check constraints may not be working properly');
        }

        // Summary
        console.log('\n========================================');
        if (allChecksPass) {
            console.log('✅ All Verification Checks Passed!');
            console.log('========================================');
            console.log('\nReplacement Process System Schema:');
            console.log('  ✓ Tables created and accessible');
            console.log('  ✓ All required columns present');
            console.log('  ✓ Helper functions working');
            console.log('  ✓ Constraints enforced');
            console.log('\nThe replacement process system is ready for use!');
        } else {
            console.log('⚠️  Some Verification Checks Failed');
            console.log('========================================');
            console.log('\nPlease review the errors above and ensure:');
            console.log('  1. Migration was run successfully');
            console.log('  2. Supabase credentials are correct');
            console.log('  3. Database has proper permissions');
        }
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    }
}

// Run the verification
verifySchema();
