/**
 * Test Email Notification System
 * 
 * This script tests the seller email notification functionality
 */

require('dotenv').config();
const { sendSellerOrderNotification, testEmailConfiguration } = require('./services/emailServices/email.service.js');

async function runTests() {
  console.log('='.repeat(60));
  console.log('📧 TESTING EMAIL NOTIFICATION SYSTEM');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Email Configuration
  console.log('Test 1: Verifying Email Configuration...');
  try {
    const configResult = await testEmailConfiguration();
    if (configResult.success) {
      console.log('✅ Email configuration is valid');
    } else {
      console.log('❌ Email configuration failed:', configResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ Email configuration error:', error.message);
    return;
  }
  console.log('');

  // Test 2: Send Test Email
  console.log('Test 2: Sending Test Email...');
  try {
    const testSeller = {
      email: 'ashenafiashew074@gmail.com', // Send to yourself for testing
      display_name: 'Test Seller',
      business_name: 'TechStore Pro'
    };

    const testOrder = {
      sub_order_id: 'test-sub-' + Date.now(),
      order_id: 'test-order-' + Date.now(),
      item_count: 2,
      subtotal: 189.98,
      items: [
        {
          title: 'USB-C Hub 7-in-1',
          quantity: 1,
          price: 39.99
        },
        {
          title: 'Wireless Gaming Mouse',
          quantity: 1,
          price: 149.99
        }
      ]
    };

    console.log(`Sending test email to: ${testSeller.email}`);
    const emailResult = await sendSellerOrderNotification(testSeller, testOrder);
    
    if (emailResult.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`   Message ID: ${emailResult.messageId}`);
      console.log(`   Recipient: ${emailResult.email}`);
      console.log('');
      console.log('📬 Check your inbox at: ashenafiashew074@gmail.com');
    } else {
      console.log('❌ Failed to send test email:', emailResult.error);
    }
  } catch (error) {
    console.log('❌ Email sending error:', error.message);
  }
  console.log('');

  console.log('='.repeat(60));
  console.log('✅ EMAIL NOTIFICATION TEST COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log('Next Steps:');
  console.log('1. Check your email inbox (ashenafiashew074@gmail.com)');
  console.log('2. Verify the email looks professional');
  console.log('3. Click the "View Order in Dashboard" button');
  console.log('4. If successful, the system is ready for production!');
  console.log('');
}

// Run tests
runTests().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
