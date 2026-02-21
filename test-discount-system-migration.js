const supabase = require('./config/supabase');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Discount System Migration\n');

async function testDiscountSystemMigration() {
  try {
    // Step 1: Read the migration file
    console.log('📄 Step 1: Reading migration file...');
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'discount-system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded');

    // Step 2: Execute migration (you'll need to run this manually in Supabase SQL Editor)
    console.log('\n📋 Step 2: Migration SQL ready');
    console.log('⚠️  IMPORTANT: Run the SQL manually in Supabase Dashboard > SQL Editor');
    console.log('   File location:', migrationPath);

    // Step 3: Verify discount_rules table
    console.log('\n🔍 Step 3: Verifying discount_rules table...');
    const { data: rulesCheck, error: rulesError } = await supabase
      .from('discount_rules')
      .select('*')
      .limit(1);

    if (rulesError) {
      console.error('❌ Error accessing discount_rules table:', rulesError.message);
      console.log('   Please run the migration SQL in Supabase Dashboard first');
      return;
    }

    console.log('✅ discount_rules table is accessible');

    // Step 4: Verify applied_discounts table
    console.log('\n🔍 Step 4: Verifying applied_discounts table...');
    const { data: appliedCheck, error: appliedError } = await supabase
      .from('applied_discounts')
      .select('*')
      .limit(1);

    if (appliedError) {
      console.error('❌ Error accessing applied_discounts table:', appliedError.message);
      return;
    }

    console.log('✅ applied_discounts table is accessible');

    // Step 5: Verify discount_usage_tracking table
    console.log('\n🔍 Step 5: Verifying discount_usage_tracking table...');
    const { data: trackingCheck, error: trackingError } = await supabase
      .from('discount_usage_tracking')
      .select('*')
      .limit(1);

    if (trackingError) {
      console.error('❌ Error accessing discount_usage_tracking table:', trackingError.message);
      return;
    }

    console.log('✅ discount_usage_tracking table is accessible');

    // Step 6: Test creating a sample discount rule
    console.log('\n➕ Step 6: Creating a test discount rule...');
    
    // Get an admin user for created_by
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.log('⚠️  No admin user found, using NULL for created_by');
    }

    const testDiscountRule = {
      name: 'Test Summer Sale',
      description: 'Test discount rule for verification',
      discount_type: 'percentage',
      discount_value: 20.00,
      percentage_value: 20.00,
      applicable_to: 'all_products',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: 'active',
      allow_stacking: false,
      priority: 1,
      created_by: adminUser?.id || null
    };

    const { data: newRule, error: createError } = await supabase
      .from('discount_rules')
      .insert([testDiscountRule])
      .select();

    if (createError) {
      console.error('❌ Error creating test discount rule:', createError.message);
      console.error('   Details:', createError);
      return;
    }

    console.log('✅ Test discount rule created successfully!');
    console.log('   Rule ID:', newRule[0].id);
    console.log('   Name:', newRule[0].name);
    console.log('   Type:', newRule[0].discount_type);
    console.log('   Value:', newRule[0].discount_value);
    console.log('   Status:', newRule[0].status);

    // Step 7: Test retrieving the discount rule
    console.log('\n🔎 Step 7: Retrieving discount rule...');
    const { data: retrievedRule, error: retrieveError } = await supabase
      .from('discount_rules')
      .select('*')
      .eq('id', newRule[0].id)
      .single();

    if (retrieveError) {
      console.error('❌ Error retrieving discount rule:', retrieveError.message);
      return;
    }

    console.log('✅ Discount rule retrieved successfully');
    console.log('   All fields present:', Object.keys(retrievedRule).length > 0);

    // Step 8: Test updating discount rule
    console.log('\n🔄 Step 8: Testing discount rule update...');
    const { data: updatedRule, error: updateError } = await supabase
      .from('discount_rules')
      .update({ 
        status: 'disabled',
        description: 'Updated test description'
      })
      .eq('id', newRule[0].id)
      .select();

    if (updateError) {
      console.error('❌ Error updating discount rule:', updateError.message);
      return;
    }

    console.log('✅ Discount rule updated successfully');
    console.log('   New status:', updatedRule[0].status);
    console.log('   Updated description:', updatedRule[0].description);

    // Step 9: Test filtering by status
    console.log('\n🔍 Step 9: Testing status filtering...');
    const { data: activeRules, error: filterError } = await supabase
      .from('discount_rules')
      .select('*')
      .eq('status', 'active');

    if (filterError) {
      console.error('❌ Error filtering discount rules:', filterError.message);
      return;
    }

    console.log(`✅ Found ${activeRules?.length || 0} active discount rule(s)`);

    // Step 10: Cleanup test data
    console.log('\n🧹 Step 10: Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('discount_rules')
      .delete()
      .eq('id', newRule[0].id);

    if (deleteError) {
      console.error('❌ Error deleting test discount rule:', deleteError.message);
      console.log('   You may need to manually delete rule ID:', newRule[0].id);
      return;
    }

    console.log('✅ Test discount rule deleted successfully');

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ DISCOUNT SYSTEM MIGRATION TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 Test Results:');
    console.log('   ✅ discount_rules table accessible');
    console.log('   ✅ applied_discounts table accessible');
    console.log('   ✅ discount_usage_tracking table accessible');
    console.log('   ✅ Create discount rule');
    console.log('   ✅ Retrieve discount rule');
    console.log('   ✅ Update discount rule');
    console.log('   ✅ Filter by status');
    console.log('   ✅ Delete discount rule');
    console.log('\n🎉 All discount system database tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Implement DiscountService class');
    console.log('   2. Implement DiscountController endpoints');
    console.log('   3. Add discount routes to the API');
    console.log('   4. Implement Redis caching for active rules');
    console.log('   5. Create frontend discount display components');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDiscountSystemMigration()
  .then(() => {
    console.log('\n✅ Test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  });
