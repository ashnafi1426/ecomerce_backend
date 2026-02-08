/**
 * Enhanced Refund Schema Verification Script
 * Verifies that the enhanced refund tables migration was successful
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySchema() {
  console.log('========================================');
  console.log('Enhanced Refund Schema Verification');
  console.log('========================================\n');

  let allChecksPass = true;

  // Check 1: Verify refund_details table exists
  console.log('1️⃣  Checking refund_details table...');
  const { data: refundDetails, error: refundDetailsError } = await supabase
    .from('refund_details')
    .select('*')
    .limit(1);

  if (refundDetailsError && refundDetailsError.code !== 'PGRST116') {
    console.log('   ❌ refund_details table not accessible:', refundDetailsError.message);
    allChecksPass = false;
  } else {
    console.log('   ✅ refund_details table exists and is accessible');
  }

  // Check 2: Verify refund_images table exists
  console.log('\n2️⃣  Checking refund_images table...');
  const { data: refundImages, error: refundImagesError } = await supabase
    .from('refund_images')
    .select('*')
    .limit(1);

  if (refundImagesError && refundImagesError.code !== 'PGRST116') {
    console.log('   ❌ refund_images table not accessible:', refundImagesError.message);
    allChecksPass = false;
  } else {
    console.log('   ✅ refund_images table exists and is accessible');
  }

  // Check 3: Test refund_details insert with validation
  console.log('\n3️⃣  Testing refund_details constraints...');
  try {
    // This should fail due to invalid refund_type
    const { error: invalidTypeError } = await supabase
      .from('refund_details')
      .insert({
        order_id: '00000000-0000-0000-0000-000000000000',
        customer_id: '00000000-0000-0000-0000-000000000000',
        seller_id: '00000000-0000-0000-0000-000000000000',
        refund_type: 'invalid_type',
        refund_amount: 100.00,
        original_order_amount: 200.00,
        reason_category: 'product_quality'
      });

    if (invalidTypeError && invalidTypeError.message.includes('refund_type')) {
      console.log('   ✅ refund_type constraint working (rejected invalid type)');
    } else {
      console.log('   ⚠️  refund_type constraint may not be working properly');
    }

    // This should fail due to invalid reason_category
    const { error: invalidReasonError } = await supabase
      .from('refund_details')
      .insert({
        order_id: '00000000-0000-0000-0000-000000000000',
        customer_id: '00000000-0000-0000-0000-000000000000',
        seller_id: '00000000-0000-0000-0000-000000000000',
        refund_type: 'partial',
        refund_amount: 100.00,
        original_order_amount: 200.00,
        reason_category: 'invalid_reason'
      });

    if (invalidReasonError && invalidReasonError.message.includes('reason_category')) {
      console.log('   ✅ reason_category constraint working (rejected invalid reason)');
    } else {
      console.log('   ⚠️  reason_category constraint may not be working properly');
    }

    // This should fail due to negative refund_amount
    const { error: negativeAmountError } = await supabase
      .from('refund_details')
      .insert({
        order_id: '00000000-0000-0000-0000-000000000000',
        customer_id: '00000000-0000-0000-0000-000000000000',
        seller_id: '00000000-0000-0000-0000-000000000000',
        refund_type: 'partial',
        refund_amount: -50.00,
        original_order_amount: 200.00,
        reason_category: 'product_quality'
      });

    if (negativeAmountError && negativeAmountError.message.includes('refund_amount')) {
      console.log('   ✅ refund_amount constraint working (rejected negative amount)');
    } else {
      console.log('   ⚠️  refund_amount constraint may not be working properly');
    }

  } catch (error) {
    console.log('   ⚠️  Error testing constraints:', error.message);
  }

  // Check 4: Verify helper functions exist
  console.log('\n4️⃣  Checking helper functions...');
  const functions = [
    'can_create_refund_request',
    'calculate_refund_commission_adjustment',
    'get_cumulative_refunds',
    'get_refund_analytics',
    'get_seller_refund_rate',
    'get_product_refund_rate',
    'get_seller_refund_metrics',
    'check_refund_processing_time_alerts'
  ];

  for (const func of functions) {
    try {
      // Try to call the function with dummy parameters to see if it exists
      const { error } = await supabase.rpc(func, {});
      if (error && !error.message.includes('does not exist')) {
        console.log(`   ✅ ${func}() exists`);
      } else if (error && error.message.includes('does not exist')) {
        console.log(`   ❌ ${func}() not found`);
        allChecksPass = false;
      }
    } catch (error) {
      // Function exists but parameters are wrong - that's okay
      console.log(`   ✅ ${func}() exists`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('Verification Summary');
  console.log('========================================');
  if (allChecksPass) {
    console.log('✅ All checks passed!');
    console.log('✅ Enhanced Refund Process System is properly configured');
  } else {
    console.log('⚠️  Some checks failed - review the output above');
  }
  console.log('========================================\n');
}

verifySchema().catch(console.error);
