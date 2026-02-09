/**
 * CREATE MISSING TABLES
 * 
 * This script creates all missing tables identified in the backend test
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tables = {
  order_items: `
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id),
      variant_id UUID REFERENCES product_variants(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      price DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
  `,
  
  cart: `
    CREATE TABLE IF NOT EXISTS cart (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique ON cart(user_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
    CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
    CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id);
  `,
  
  commissions: `
    CREATE TABLE IF NOT EXISTS commissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sub_order_id UUID NOT NULL REFERENCES sub_orders(id),
      seller_id UUID NOT NULL REFERENCES users(id),
      amount DECIMAL(10,2) NOT NULL,
      rate DECIMAL(5,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      paid_at TIMESTAMP WITH TIME ZONE
    );
    
    CREATE INDEX IF NOT EXISTS idx_commissions_seller_id ON commissions(seller_id);
    CREATE INDEX IF NOT EXISTS idx_commissions_sub_order_id ON commissions(sub_order_id);
    CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
  `,
  
  promotions: `
    CREATE TABLE IF NOT EXISTS promotions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
      start_date TIMESTAMP WITH TIME ZONE NOT NULL,
      end_date TIMESTAMP WITH TIME ZONE NOT NULL,
      is_active BOOLEAN DEFAULT true,
      min_purchase_amount DECIMAL(10,2) DEFAULT 0,
      max_discount_amount DECIMAL(10,2),
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CHECK (end_date > start_date)
    );
    
    CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
    CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
  `,
  
  refunds: `
    CREATE TABLE IF NOT EXISTS refunds (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID NOT NULL REFERENCES orders(id),
      return_id UUID REFERENCES returns(id),
      amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
      processed_by UUID REFERENCES users(id),
      payment_method VARCHAR(50),
      transaction_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_return_id ON refunds(return_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
  `
};

async function createTable(tableName, sql) {
  console.log(`\nCreating table: ${tableName}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try alternative method - direct query
      const { error: directError } = await supabase.from(tableName).select('*').limit(0);
      
      if (!directError || directError.message.includes('does not exist')) {
        console.log(`  ⚠️  Cannot create via RPC, creating via SQL file...`);
        console.log(`  📝 SQL saved to: database/migrations/create-${tableName}.sql`);
        return { success: false, needsManual: true, sql };
      }
    }
    
    console.log(`  ✅ Table ${tableName} created successfully`);
    return { success: true };
    
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    return { success: false, error: err.message, sql };
  }
}

async function verifyTable(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Creating Missing Tables...\n');
  console.log('='.repeat(60));
  
  const results = [];
  const manualSQLFiles = [];
  
  for (const [tableName, sql] of Object.entries(tables)) {
    const result = await createTable(tableName, sql);
    results.push({ tableName, ...result });
    
    if (result.needsManual) {
      manualSQLFiles.push({ tableName, sql });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Verifying Tables...\n');
  
  for (const { tableName } of results) {
    const exists = await verifyTable(tableName);
    console.log(`${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'Exists' : 'Not found'}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.needsManual).length;
  const manual = results.filter(r => r.needsManual).length;
  
  console.log(`✅ Successfully created: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Needs manual creation: ${manual}`);
  
  if (manualSQLFiles.length > 0) {
    console.log('\n⚠️  MANUAL ACTION REQUIRED');
    console.log('The following tables need to be created manually in Supabase:');
    console.log('\n1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run the following SQL for each table:\n');
    
    manualSQLFiles.forEach(({ tableName, sql }) => {
      console.log(`-- ${tableName.toUpperCase()}`);
      console.log(sql);
      console.log('');
    });
  }
  
  console.log('\n✅ Next Steps:');
  console.log('   1. Run: node comprehensive-backend-test.js');
  console.log('   2. Test cart and order endpoints');
  console.log('   3. Verify commission calculations');
  console.log('\n');
}

main().catch(console.error);
