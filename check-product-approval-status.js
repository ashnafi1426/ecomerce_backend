/**
 * Check Product Approval Status in Database
 * 
 * This script checks the actual approval_status values in the database
 */

const supabase = require('./config/supabase');

async function checkApprovalStatus() {
  console.log('🔍 Checking Product Approval Status in Database\n');
  console.log('=' .repeat(60));

  try {
    // Get all products with their approval status
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, approval_status, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`\n📦 Total products in database: ${products.length}\n`);

    // Count by approval status
    const statusCounts = {
      approved: 0,
      pending: 0,
      rejected: 0,
      null: 0,
      other: 0
    };

    products.forEach(product => {
      const status = product.approval_status;
      if (status === 'approved') statusCounts.approved++;
      else if (status === 'pending') statusCounts.pending++;
      else if (status === 'rejected') statusCounts.rejected++;
      else if (status === null || status === undefined) statusCounts.null++;
      else statusCounts.other++;
    });

    console.log('📊 Approval Status Breakdown:');
    console.log(`   ✅ Approved: ${statusCounts.approved}`);
    console.log(`   ⏳ Pending: ${statusCounts.pending}`);
    console.log(`   ❌ Rejected: ${statusCounts.rejected}`);
    console.log(`   ⚠️  NULL/Undefined: ${statusCounts.null}`);
    console.log(`   ❓ Other: ${statusCounts.other}`);

    // Show NULL products if any
    if (statusCounts.null > 0) {
      console.log('\n⚠️  Products with NULL approval_status:');
      products
        .filter(p => p.approval_status === null || p.approval_status === undefined)
        .slice(0, 10)
        .forEach(p => {
          console.log(`   - ${p.title} (ID: ${p.id})`);
        });
      
      console.log('\n❌ ISSUE FOUND: Products with NULL approval_status will show on homepage!');
      console.log('   These products bypass the approval filter.');
    }

    // Show recent pending products
    if (statusCounts.pending > 0) {
      console.log('\n⏳ Recent Pending Products (waiting for approval):');
      products
        .filter(p => p.approval_status === 'pending')
        .slice(0, 10)
        .forEach(p => {
          console.log(`   - ${p.title} (ID: ${p.id})`);
        });
    }

    // Show recent approved products
    console.log('\n✅ Recent Approved Products:');
    products
      .filter(p => p.approval_status === 'approved')
      .slice(0, 5)
      .forEach(p => {
        console.log(`   - ${p.title} (ID: ${p.id})`);
      });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) console.error('   Details:', error.details);
    if (error.hint) console.error('   Hint:', error.hint);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Check Complete\n');
}

// Run the check
checkApprovalStatus();
