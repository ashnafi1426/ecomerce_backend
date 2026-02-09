/**
 * LIST ALL TEST ACCOUNTS
 * Shows all test accounts for each role
 */

const supabase = require('./config/supabase');

async function listAllAccounts() {
  console.log('\n📋 All Test Accounts\n');
  console.log('='.repeat(80));

  try {
    // Get all users grouped by role
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, display_name, status, created_at')
      .in('role', ['customer', 'seller', 'manager', 'admin'])
      .order('role', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error querying users:', error.message);
      return;
    }

    // Group by role
    const byRole = {
      admin: [],
      manager: [],
      seller: [],
      customer: []
    };

    users.forEach(user => {
      if (byRole[user.role]) {
        byRole[user.role].push(user);
      }
    });

    // Display each role
    console.log('\n🔴 ADMIN ACCOUNTS');
    console.log('-'.repeat(80));
    if (byRole.admin.length === 0) {
      console.log('   No admin accounts found');
    } else {
      byRole.admin.forEach(admin => {
        console.log(`   ✅ ${admin.email}`);
        console.log(`      Name: ${admin.display_name || 'N/A'}`);
        console.log(`      Status: ${admin.status}`);
        console.log(`      Password: Admin123!@# (default)`);
        console.log('');
      });
    }

    console.log('\n🟡 MANAGER ACCOUNTS');
    console.log('-'.repeat(80));
    if (byRole.manager.length === 0) {
      console.log('   No manager accounts found');
    } else {
      byRole.manager.forEach(manager => {
        console.log(`   ✅ ${manager.email}`);
        console.log(`      Name: ${manager.display_name || 'N/A'}`);
        console.log(`      Status: ${manager.status}`);
        console.log(`      Password: Manager123!@# (default)`);
        console.log('');
      });
    }

    console.log('\n🟢 SELLER ACCOUNTS');
    console.log('-'.repeat(80));
    if (byRole.seller.length === 0) {
      console.log('   No seller accounts found');
    } else {
      byRole.seller.slice(0, 5).forEach(seller => {
        console.log(`   ✅ ${seller.email}`);
        console.log(`      Name: ${seller.display_name || 'N/A'}`);
        console.log(`      Status: ${seller.status}`);
        console.log('');
      });
      if (byRole.seller.length > 5) {
        console.log(`   ... and ${byRole.seller.length - 5} more sellers`);
      }
    }

    console.log('\n🔵 CUSTOMER ACCOUNTS');
    console.log('-'.repeat(80));
    if (byRole.customer.length === 0) {
      console.log('   No customer accounts found');
    } else {
      byRole.customer.slice(0, 5).forEach(customer => {
        console.log(`   ✅ ${customer.email}`);
        console.log(`      Name: ${customer.display_name || 'N/A'}`);
        console.log(`      Status: ${customer.status}`);
        console.log('');
      });
      if (byRole.customer.length > 5) {
        console.log(`   ... and ${byRole.customer.length - 5} more customers`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY');
    console.log('-'.repeat(80));
    console.log(`   Admins: ${byRole.admin.length}`);
    console.log(`   Managers: ${byRole.manager.length}`);
    console.log(`   Sellers: ${byRole.seller.length}`);
    console.log(`   Customers: ${byRole.customer.length}`);
    console.log(`   Total: ${users.length}`);

    console.log('\n🔑 DEFAULT PASSWORDS');
    console.log('-'.repeat(80));
    console.log('   Admin: Admin123!@#');
    console.log('   Manager: Manager123!@#');
    console.log('   Seller: Test123!@# (for test accounts)');
    console.log('   Customer: Test123!@# (for test accounts)');

    console.log('\n🚀 LOGIN ENDPOINT');
    console.log('-'.repeat(80));
    console.log('   POST http://localhost:5000/api/auth/login');
    console.log('   Body: { "email": "user@test.com", "password": "password" }');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

listAllAccounts();
