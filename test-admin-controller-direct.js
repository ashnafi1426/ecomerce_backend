/**
 * Test admin controller methods directly
 */

const adminController = require('./controllers/adminControllers/admin.controller');

console.log('🔍 TESTING ADMIN CONTROLLER DIRECTLY\n');

console.log('✅ Admin Controller Methods:');
console.log('   - getAllUsers:', typeof adminController.getAllUsers);
console.log('   - createUser:', typeof adminController.createUser);
console.log('   - updateUser:', typeof adminController.updateUser);
console.log('   - deleteUser:', typeof adminController.deleteUser);
console.log('   - bulkUpdateUsers:', typeof adminController.bulkUpdateUsers);
console.log('   - exportUsers:', typeof adminController.exportUsers);
console.log('');

// Test if createUser method exists and is a function
if (typeof adminController.createUser === 'function') {
  console.log('✅ createUser method exists and is a function');
} else {
  console.log('❌ createUser method is missing or not a function');
}

console.log('');
console.log('🎉 DIRECT CONTROLLER TEST COMPLETED!');