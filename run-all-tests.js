/**
 * RUN ALL TESTS
 * 
 * Executes all phase tests sequentially and provides comprehensive report
 */

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const tests = [
  {
    phase: 1,
    name: 'Database Schema Verification',
    script: 'check-phase1-status.js',
    description: 'Verifies database migrations and schema',
  },
  {
    phase: 2,
    name: 'Authentication & Authorization',
    script: 'test-phase2-auth.js',
    description: 'Tests RBAC, seller registration, and manager creation',
  },
  {
    phase: 3,
    name: 'Product Management & Approval',
    script: 'test-phase3-products.js',
    description: 'Tests product lifecycle and approval workflow',
  },
];

// Results storage
const results = [];

// Helper to run a test script
function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 Running Phase ${test.phase}: ${test.name}`);
    console.log(`   ${test.description}`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    const child = spawn('node', [test.script], {
      cwd: __dirname,
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      results.push({
        phase: test.phase,
        name: test.name,
        passed: code === 0,
        duration,
      });

      resolve(code === 0);
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${test.name}:`, error.message);
      results.push({
        phase: test.phase,
        name: test.name,
        passed: false,
        duration: 0,
        error: error.message,
      });
      resolve(false);
    });
  });
}

// Main test runner
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         FASTSHOP MULTI-VENDOR PLATFORM TEST SUITE         ║');
  console.log('║                    Comprehensive Testing                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const overallStartTime = Date.now();

  // Run each test sequentially
  for (const test of tests) {
    await runTest(test);
  }

  // Calculate overall results
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  const totalDuration = ((Date.now() - overallStartTime) / 1000).toFixed(2);

  // Print comprehensive summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   COMPREHENSIVE TEST REPORT                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📊 Overall Statistics:');
  console.log(`   Total Phases Tested: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📈 Success Rate: ${successRate}%`);
  console.log(`   ⏱️  Total Duration: ${totalDuration}s\n`);

  console.log('📋 Phase-by-Phase Results:\n');
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const duration = `${result.duration}s`;
    console.log(`   Phase ${result.phase}: ${result.name}`);
    console.log(`   Status: ${status} | Duration: ${duration}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  // Migration progress
  console.log('🚀 Migration Progress:\n');
  console.log('   ✅ Phase 1: Database Schema        [████████████████████] 100%');
  console.log('   ✅ Phase 2: Auth & Authorization   [████████████████████] 100%');
  console.log('   ✅ Phase 3: Product Management     [████████████████████] 100%');
  console.log('   🔜 Phase 4: Payment System         [░░░░░░░░░░░░░░░░░░░░]   0%');
  console.log('   ⏳ Phase 5: Multi-Vendor Orders    [░░░░░░░░░░░░░░░░░░░░]   0%');
  console.log('   ⏳ Phase 6: Dispute & Returns      [░░░░░░░░░░░░░░░░░░░░]   0%');
  console.log('   ⏳ Phase 7: Inventory Management   [░░░░░░░░░░░░░░░░░░░░]   0%');
  console.log('   ⏳ Phase 8: Dashboard Systems      [░░░░░░░░░░░░░░░░░░░░]   0%');
  console.log('   ⏳ Phase 9: Notifications          [░░░░░░░░░░░░░░░░░░░░]   0%');
  console.log('   ⏳ Phase 10: Reporting & Analytics [░░░░░░░░░░░░░░░░░░░░]   0%');
  console.log('   ⏳ Phase 11: Security & Compliance [░░░░░░░░░░░░░░░░░░░░]   0%');
  console.log('   ⏳ Phase 12: Testing & QA          [░░░░░░░░░░░░░░░░░░░░]   0%\n');
  console.log('   Overall: [████████████░░░░░░░░] 25%\n');

  // Recommendations
  if (failedTests > 0) {
    console.log('⚠️  Recommendations:\n');
    console.log('   1. Review failed test output above');
    console.log('   2. Check TESTING-GUIDE.md for troubleshooting');
    console.log('   3. Verify prerequisites are met');
    console.log('   4. Fix issues before proceeding to Phase 4\n');
  } else {
    console.log('🎉 All Tests Passed!\n');
    console.log('   ✅ Phase 1-3 implementation verified');
    console.log('   ✅ Database schema is correct');
    console.log('   ✅ Authentication & authorization working');
    console.log('   ✅ Product management & approval functional');
    console.log('   ✅ Ready to proceed to Phase 4\n');
    console.log('   Next Steps:');
    console.log('   1. Update Postman collection with new endpoints');
    console.log('   2. Create API documentation');
    console.log('   3. Begin Phase 4: Comprehensive Payment System\n');
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST RUN COMPLETE                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
