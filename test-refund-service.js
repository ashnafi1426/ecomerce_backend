/**
 * Test script for RefundService
 * Verifies that all service methods are properly exported
 */

const refundService = require('./services/refundServices/refund.service');

console.log('Testing RefundService implementation...\n');

// Check that all required methods exist
const requiredMethods = [
  'validateEligibility',
  'calculateRefundAmount',
  'createRequest',
  'processStripeRefund',
  'adjustSellerEarnings',
  'processApproval',
  'processRejection',
  'getCustomerRefunds',
  'getManagerRefunds',
  'getAllRefunds',
  'getRefundAnalytics'
];

let allMethodsExist = true;

requiredMethods.forEach(method => {
  if (typeof refundService[method] === 'function') {
    console.log(`✓ ${method} - exists`);
  } else {
    console.log(`✗ ${method} - MISSING`);
    allMethodsExist = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allMethodsExist) {
  console.log('✓ All RefundService methods are implemented!');
  console.log('\nCore service methods:');
  console.log('  - validateEligibility: Validates refund eligibility');
  console.log('  - calculateRefundAmount: Calculates refund amount');
  console.log('  - createRequest: Creates refund request');
  console.log('  - processStripeRefund: Processes Stripe refund');
  console.log('  - adjustSellerEarnings: Adjusts seller earnings');
  console.log('  - processApproval: Processes manager approval');
  console.log('  - processRejection: Processes manager rejection');
  console.log('\nQuery methods:');
  console.log('  - getCustomerRefunds: Gets customer refund requests');
  console.log('  - getManagerRefunds: Gets manager refund requests');
  console.log('  - getAllRefunds: Gets all refund requests (admin)');
  console.log('  - getRefundAnalytics: Gets refund analytics');
  process.exit(0);
} else {
  console.log('✗ Some RefundService methods are missing!');
  process.exit(1);
}
