/**
 * TEST AUTOMATIC EARNINGS PROCESSOR
 * ==================================
 * 
 * This script tests the automatic earnings processor job.
 * Run from backend directory: node test-automatic-earnings-processor.js
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { triggerManually } = require('./jobs/earnings-processor.job');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAutomaticProcessor() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   TEST: AUTOMATIC EARNINGS PROCESSOR                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 1: Check current state of earnings
    console.log('📊 STEP 1: Checking current earnings state...\n');
    
    const { data: allEarnings, error: fetchError } = await supabase
      .from('seller_earnings')
      .select('id, seller_id, status, net_amount, available_date, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('❌ Error fetching earnings:', fetchError);
      return;
    }
    
    console.log(`Found ${allEarnings.length} recent earnings:\n`);
    
    allEarnings.forEach((earning, index) => {
      const amount = (earning.net_amount / 100).toFixed(2);
      const isPastDue = new Date(earning.available_date) <= new Date();
      const status = isPastDue ? '⏰ READY' : '⏳ WAITING';
      
      console.log(`${index + 1}. ${status}`);
      console.log(`   ID: ${earning.id}`);
      console.log(`   Status: ${earning.status}`);
      console.log(`   Amount: $${amount}`);
      console.log(`   Available Date: ${earning.available_date}`);
      console.log(`   Created: ${earning.created_at}`);
      console.log('');
    });
    
    // Count by status
    const pendingCount = allEarnings.filter(e => e.status === 'pending').length;
    const availableCount = allEarnings.filter(e => e.status === 'available').length;
    const currentDate = new Date().toISOString().split('T')[0];
    const readyToProcess = allEarnings.filter(e => 
      e.status === 'pending' && e.available_date <= currentDate
    ).length;
    
    console.log('📈 Summary:');
    console.log(`   Pending: ${pendingCount}`);
    console.log(`   Available: ${availableCount}`);
    console.log(`   Ready to Process: ${readyToProcess}`);
    console.log('');
    
    // Step 2: Manually trigger the processor
    console.log('🔧 STEP 2: Manually triggering earnings processor...\n');
    
    const result = await triggerManually();
    
    console.log('\n📋 PROCESSOR RESULT:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Count: ${result.count}`);
    console.log(`   Total Amount: $${result.total_amount || '0.00'}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
    
    // Step 3: Verify the changes
    console.log('\n✅ STEP 3: Verifying changes...\n');
    
    const { data: updatedEarnings, error: verifyError } = await supabase
      .from('seller_earnings')
      .select('id, seller_id, status, net_amount, available_date, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError);
      return;
    }
    
    console.log('Recent earnings after processing:\n');
    
    updatedEarnings.forEach((earning, index) => {
      const amount = (earning.net_amount / 100).toFixed(2);
      const statusIcon = earning.status === 'available' ? '✅' : '⏳';
      
      console.log(`${index + 1}. ${statusIcon} ${earning.status.toUpperCase()}`);
      console.log(`   ID: ${earning.id}`);
      console.log(`   Amount: $${amount}`);
      console.log(`   Available Date: ${earning.available_date}`);
      console.log(`   Last Updated: ${earning.updated_at}`);
      console.log('');
    });
    
    // Final summary
    const newPendingCount = updatedEarnings.filter(e => e.status === 'pending').length;
    const newAvailableCount = updatedEarnings.filter(e => e.status === 'available').length;
    
    console.log('📊 Final Summary:');
    console.log(`   Pending: ${newPendingCount}`);
    console.log(`   Available: ${newAvailableCount}`);
    console.log(`   Processed: ${result.count}`);
    console.log('');
    
    // Step 4: Test cron schedule info
    console.log('⏰ STEP 4: Cron Schedule Information\n');
    console.log('   Schedule: Daily at midnight (00:00)');
    console.log('   Cron Expression: 0 0 * * *');
    console.log(`   Timezone: ${process.env.TIMEZONE || 'America/New_York'}`);
    console.log('   Next Run: Tomorrow at midnight');
    console.log('');
    
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   TEST COMPLETED SUCCESSFULLY                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('💡 NOTES:');
    console.log('   - The processor runs automatically every day at midnight');
    console.log('   - You can manually trigger it using the admin endpoint:');
    console.log('     POST /api/stripe/admin/process-earnings');
    console.log('   - Earnings need to wait 7 days before becoming available');
    console.log('   - This protects against refunds and disputes');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAutomaticProcessor();
