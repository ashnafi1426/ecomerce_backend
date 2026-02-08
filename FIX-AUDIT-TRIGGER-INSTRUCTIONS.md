# Fix Audit Trigger - Manual Deployment Instructions

## Problem
The Phase 1 migration created an audit trigger function with incorrect column names:
- Used `operation` instead of `action`
- Used `user_id` instead of `performed_by`
- Used `ip_address` which doesn't exist in the new schema

This causes all authentication operations to fail with the error:
```
column "operation" of relation "audit_log" does not exist
```

## Solution
Run the fix SQL script in Supabase SQL Editor to update the trigger function.

## Steps

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project

### 2. Open SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New query"

### 3. Copy and Paste the Fix Script
Copy the entire contents of `database/migrations/fix-audit-trigger.sql` and paste it into the SQL Editor.

### 4. Run the Script
- Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
- Wait for the script to complete
- You should see: "Audit trigger function fixed successfully!"

### 5. Verify the Fix
The script will also show which tables have audit triggers. You should see:
- audit_orders
- audit_payments
- audit_products
- audit_returns
- audit_seller_payouts
- audit_disputes
- audit_users

### 6. Restart Backend Server
After running the SQL script:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

### 7. Run Phase 2 Tests
```bash
npm run test:phase2
```

## Expected Result
All Phase 2 tests should now pass without the "column operation does not exist" error.

## Alternative: Quick Fix via Node Script
If you prefer, you can also try running:
```bash
node fix-audit-trigger.js
```

However, this requires the `exec_sql` RPC function to be available in your Supabase project, which may not be the case. The manual SQL Editor approach is more reliable.

## Verification
After applying the fix, you can verify it worked by running:
```bash
node verify-audit-log-migration.js
```

This should show that inserts with the new schema succeed.
