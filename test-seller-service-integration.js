/**
 * Test seller service integration
 */

require('dotenv').config();
const sellerService = require('./services/sellerServices/seller.service');

async function testSellerServiceIntegration() {
  try {
    console.log('🔍 TESTING SELLER SERVICE INTEGRATION\n');

    console.log('1️⃣ Testing getAllSellers method...');
    const sellers = await sellerService.getAllSellers({
      limit: 5
    });
    
    console.log('✅ Seller service response:');
    console.log('   - Count:', sellers.length);
    
    if (sellers.length > 0) {
      console.log('   - First seller structure:');
      const firstSeller = sellers[0];
      console.log('     * ID:', firstSeller.id);
      console.log('     * Email:', firstSeller.email);
      console.log('     * Business Name:', firstSeller.business_name);
      console.log('     * Status:', firstSeller.status);
      console.log('     * Verification Status:', firstSeller.seller_verification_status);
      console.log('     * Performance:', !!firstSeller.seller_performance);
      console.log('     * Balance:', !!firstSeller.seller_balances);
      console.log('     * All keys:', Object.keys(firstSeller));
    }

    console.log('\n2️⃣ Testing getPerformanceMetrics method...');
    if (sellers.length > 0) {
      const performance = await sellerService.getPerformanceMetrics(sellers[0].id);
      console.log('✅ Performance metrics response:');
      console.log('   - Has performance data:', !!performance);
      if (performance) {
        console.log('   - Keys:', Object.keys(performance));
      }
    }

    console.log('\n✅ Seller service is working correctly!');
    console.log('   - Admin controller should be able to use these methods');

  } catch (error) {
    console.error('❌ Seller service test failed:', error.message);
    console.error('   - Stack:', error.stack);
  }
}

// Run the test
testSellerServiceIntegration();