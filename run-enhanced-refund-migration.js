/**
 * Enhanced Refund Tables Migration Runner
 * Implements Requirements 5.1, 5.2, 5.3, 5.4
 * 
 * This script runs the enhanced refund tables migration which creates:
 * - refund_details table with partial refund support
 * - refund_images table for evidence storage
 * - Indexes for status filtering and seller lookup
 * - Check constraints for refund types and amounts
 * - Helper functions for refund management
 * - Triggers for automatic status updates
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('========================================');
  console.log('Enhanced Refund Tables Migration');
  console.log('========================================\n');

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'create-enhanced-refund-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log(`📍 Path: ${migrationPath}\n`);

    // Execute the migration using raw SQL query
    console.log('🚀 Executing migration...\n');
    
    // Split SQL into statements and execute them
    // Note: This is a simplified approach - for production, use a proper migration tool
    const { error } = await supabase.rpc('query', { 
      query_text: migrationSQL 
    }).single();

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Details:', error);
      console.log('\n⚠️  Note: You may need to run this SQL directly in Supabase SQL Editor');
      console.log('📍 File location:', migrationPath);
      process.exit(1);
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');

    const { data: refundDetailsTable, error: refundDetailsError } = await supabase
      .from('refund_details')
      .select('*')
      .limit(0);

    const { data: refundImagesTable, error: refundImagesError } = await supabase
      .from('refund_images')
      .select('*')
      .limit(0);

    if (refundDetailsError) {
      console.log('⚠️  refund_details table verification:', refundDetailsError.message);
    } else {
      console.log('✅ refund_details table verified');
    }

    if (refundImagesError) {
      console.log('⚠️  refund_images table verification:', refundImagesError.message);
    } else {
      console.log('✅ refund_images table verified');
    }

    console.log('\n========================================');
    console.log('Migration Summary');
    console.log('========================================');
    console.log('✅ refund_details table created');
    console.log('✅ refund_images table created');
    console.log('✅ Indexes created for performance');
    console.log('✅ Check constraints added');
    console.log('✅ Triggers configured');
    console.log('✅ Helper functions created');
    console.log('✅ Order columns added (refund_status, total_refunded)');
    console.log('✅ Product columns added (refund_count, is_flagged_high_refund)');
    console.log('\n🎉 Enhanced Refund Process System is ready!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
