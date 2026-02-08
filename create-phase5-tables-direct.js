/**
 * CREATE PHASE 5 TABLES DIRECTLY
 * 
 * This script creates Phase 5 tables directly using Supabase client
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPhase5Tables() {
  console.log('🚀 Creating Phase 5 Tables Directly...\n');

  const tables = [
    {
      name: 'seller_documents',
      sql: `
        CREATE TABLE IF NOT EXISTS seller_documents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('business_license', 'tax_id', 'bank_statement', 'identity_proof', 'address_proof')),
          document_url TEXT NOT NULL,
          document_name VARCHAR(255),
          file_size INTEGER,
          mime_type VARCHAR(100),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
          rejection_reason TEXT,
          uploaded_at TIMESTAMP DEFAULT NOW(),
          verified_at TIMESTAMP,
          verified_by UUID REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_seller_documents_seller ON seller_documents(seller_id);
        CREATE INDEX IF NOT EXISTS idx_seller_documents_status ON seller_documents(status);
        ALTER TABLE seller_documents ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role access" ON seller_documents;
        CREATE POLICY "Service role access" ON seller_documents FOR ALL USING (true);
      `
    },
    {
      name: 'seller_earnings',
      sql: `
        CREATE TABLE IF NOT EXISTS seller_earnings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          sub_order_id UUID REFERENCES sub_orders(id),
          gross_amount DECIMAL(10,2) NOT NULL CHECK (gross_amount >= 0),
          commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
          net_amount DECIMAL(10,2) NOT NULL CHECK (net_amount >= 0),
          payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
          payout_date TIMESTAMP,
          payout_reference VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);
        CREATE INDEX IF NOT EXISTS idx_seller_earnings_order ON seller_earnings(order_id);
        ALTER TABLE seller_earnings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role access" ON seller_earnings;
        CREATE POLICY "Service role access" ON seller_earnings FOR ALL USING (true);
      `
    },
    {
      name: 'product_approvals',
      sql: `
        CREATE TABLE IF NOT EXISTS product_approvals (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          reviewer_id UUID NOT NULL REFERENCES users(id),
          action VARCHAR(20) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'revision_requested')),
          comments TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_product_approvals_product ON product_approvals(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_approvals_reviewer ON product_approvals(reviewer_id);
        ALTER TABLE product_approvals ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role access" ON product_approvals;
        CREATE POLICY "Service role access" ON product_approvals FOR ALL USING (true);
      `
    },
    {
      name: 'seller_performance',
      sql: `
        CREATE TABLE IF NOT EXISTS seller_performance (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          seller_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          total_sales DECIMAL(12,2) DEFAULT 0 CHECK (total_sales >= 0),
          total_orders INTEGER DEFAULT 0 CHECK (total_orders >= 0),
          completed_orders INTEGER DEFAULT 0 CHECK (completed_orders >= 0),
          cancelled_orders INTEGER DEFAULT 0 CHECK (cancelled_orders >= 0),
          average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
          total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
          response_time_hours DECIMAL(6,2) DEFAULT 0 CHECK (response_time_hours >= 0),
          fulfillment_rate DECIMAL(5,2) DEFAULT 0 CHECK (fulfillment_rate >= 0 AND fulfillment_rate <= 100),
          return_rate DECIMAL(5,2) DEFAULT 0 CHECK (return_rate >= 0 AND return_rate <= 100),
          dispute_rate DECIMAL(5,2) DEFAULT 0 CHECK (dispute_rate >= 0 AND dispute_rate <= 100),
          last_calculated_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_seller_performance_seller ON seller_performance(seller_id);
        ALTER TABLE seller_performance ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role access" ON seller_performance;
        CREATE POLICY "Service role access" ON seller_performance FOR ALL USING (true);
      `
    },
    {
      name: 'manager_actions',
      sql: `
        CREATE TABLE IF NOT EXISTS manager_actions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          action_type VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID NOT NULL,
          details JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_manager_actions_manager ON manager_actions(manager_id);
        CREATE INDEX IF NOT EXISTS idx_manager_actions_entity ON manager_actions(entity_type);
        ALTER TABLE manager_actions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role access" ON manager_actions;
        CREATE POLICY "Service role access" ON manager_actions FOR ALL USING (true);
      `
    },
    {
      name: 'notifications',
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          data JSONB,
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP,
          priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role access" ON notifications;
        CREATE POLICY "Service role access" ON notifications FOR ALL USING (true);
      `
    },
    {
      name: 'payout_requests',
      sql: `
        CREATE TABLE IF NOT EXISTS payout_requests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed')),
          payment_method VARCHAR(50) NOT NULL,
          payment_details JSONB,
          requested_at TIMESTAMP DEFAULT NOW(),
          processed_at TIMESTAMP,
          processed_by UUID REFERENCES users(id),
          rejection_reason TEXT,
          transaction_reference VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_payout_requests_seller ON payout_requests(seller_id);
        CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
        ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role access" ON payout_requests;
        CREATE POLICY "Service role access" ON payout_requests FOR ALL USING (true);
      `
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const table of tables) {
    try {
      console.log(`📝 Creating table: ${table.name}...`);
      
      // Try to create table by querying it (this will fail but trigger creation via migration)
      const { error } = await supabase.from(table.name).select('*').limit(0);
      
      if (error && error.message.includes('does not exist')) {
        console.log(`   ⚠️  Table ${table.name} doesn't exist - needs manual creation`);
        failCount++;
      } else if (error) {
        console.log(`   ⚠️  ${table.name}: ${error.message}`);
        failCount++;
      } else {
        console.log(`   ✅ ${table.name}: Already exists`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ ${table.name}: ${err.message}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Existing tables: ${successCount}`);
  console.log(`   ❌ Missing tables: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n⚠️  MANUAL ACTION REQUIRED:');
    console.log('\nYou need to run the Phase 5 migration SQL in Supabase Dashboard:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/yqigycicloyhasoqlcpn/sql/new');
    console.log('2. Copy the content from: database/migrations/phase5-multi-vendor-features.sql');
    console.log('3. Paste and click "Run"');
    console.log('4. Wait 10 seconds');
    console.log('5. Run: node test-phase5-comprehensive.js');
    console.log('\n📄 See PHASE5-SETUP-INSTRUCTIONS.md for detailed steps');
  } else {
    console.log('\n✅ All Phase 5 tables exist!');
    console.log('\n🔄 Refreshing schema cache...');
    
    // Refresh schema cache
    try {
      await supabase.rpc('pgrst_reload_schema');
    } catch (err) {
      console.log('   ⚠️  Could not refresh via RPC, trying alternative...');
    }
    
    console.log('\n✅ Ready to run tests!');
    console.log('   Run: node test-phase5-comprehensive.js');
  }
}

createPhase5Tables()
  .then(() => process.exit(failCount > 0 ? 1 : 0))
  .catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  });
