const supabase = require('./config/supabase.js');
const fs = require('fs');
const path = require('path');

async function runPaymentMigration() {
  console.log('🔧 Running Payment System Migration (Fixed)...');
  
  try {
    // Test connection first
    console.log('🔍 Testing database connection...');
    const connectionTest = await supabase.testConnection();
    
    if (!connectionTest) {
      console.error('❌ Database connection failed. Please check your configuration.');
      return;
    }
    
    console.log('✅ Database connection successful!');
    
    // Execute migration steps manually
    await executePaymentMigration();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

async function executePaymentMigration() {
  console.log('\n🔄 Executing payment system migration...');
  
  const migrationSteps = [
    {
      name: 'Add available_date to seller_earnings',
      sql: `ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS available_date DATE;`
    },
    {
      name: 'Add order_id to seller_earnings',
      sql: `ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS order_id UUID;`
    },
    {
      name: 'Add gross_amount to seller_earnings',
      sql: `ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS gross_amount INTEGER DEFAULT 0;`
    },
    {
      name: 'Add net_amount to seller_earnings',
      sql: `ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS net_amount INTEGER DEFAULT 0;`
    },
    {
      name: 'Add commission_rate to seller_earnings',
      sql: `ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00;`
    },
    {
      name: 'Add payout_id to seller_earnings',
      sql: `ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS payout_id UUID;`
    },
    {
      name: 'Add stripe_payment_intent_id to payments',
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) UNIQUE;`
    },
    {
      name: 'Add currency to payments',
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'usd';`
    },
    {
      name: 'Add payment_method to payments',
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card';`
    },
    {
      name: 'Add metadata to payments',
      sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';`
    },
    {
      name: 'Add commission_rate to sub_orders',
      sql: `ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00;`
    },
    {
      name: 'Add commission_amount to sub_orders',
      sql: `ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS commission_amount INTEGER DEFAULT 0;`
    },
    {
      name: 'Add seller_payout to sub_orders',
      sql: `ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS seller_payout INTEGER DEFAULT 0;`
    },
    {
      name: 'Add fulfillment_status to sub_orders',
      sql: `ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'pending';`
    },
    {
      name: 'Add tracking_number to sub_orders',
      sql: `ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);`
    },
    {
      name: 'Add shipped_at to sub_orders',
      sql: `ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;`
    },
    {
      name: 'Add delivered_at to sub_orders',
      sql: `ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;`
    }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  // Execute ALTER TABLE statements
  for (const step of migrationSteps) {
    console.log(`\n📝 ${step.name}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: step.sql });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
      errorCount++;
    }
  }
  
  // Create new tables
  await createNewTables();
  
  // Create indexes
  await createIndexes();
  
  // Insert default data
  await insertDefaultData();
  
  console.log('\n📊 Migration Results:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  
  // Test the tables
  await testNewTables();
}

async function createNewTables() {
  console.log('\n🏗️ Creating new tables...');
  
  const tables = [
    {
      name: 'payouts',
      sql: `
        CREATE TABLE IF NOT EXISTS payouts (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          seller_id UUID NOT NULL,
          amount INTEGER NOT NULL,
          method VARCHAR(50) NOT NULL DEFAULT 'stripe_connect',
          status VARCHAR(50) DEFAULT 'pending_approval',
          stripe_transfer_id VARCHAR(255),
          account_details JSONB DEFAULT '{}',
          requested_at TIMESTAMP DEFAULT NOW(),
          approved_at TIMESTAMP,
          approved_by UUID,
          processed_at TIMESTAMP,
          completed_at TIMESTAMP,
          failed_at TIMESTAMP,
          failure_reason TEXT,
          fees INTEGER DEFAULT 0,
          net_amount INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    },
    {
      name: 'commission_settings',
      sql: `
        CREATE TABLE IF NOT EXISTS commission_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          default_rate DECIMAL(5,2) DEFAULT 15.00,
          category_rates JSONB DEFAULT '{}',
          seller_custom_rates JSONB DEFAULT '{}',
          updated_at TIMESTAMP DEFAULT NOW(),
          updated_by UUID
        );
      `
    }
  ];
  
  for (const table of tables) {
    console.log(`📝 Creating ${table.name} table...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: table.sql });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating ${table.name}: ${error.message}`);
      } else {
        console.log(`✅ ${table.name} table created successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception creating ${table.name}: ${err.message}`);
    }
  }
}

async function createIndexes() {
  console.log('\n📊 Creating indexes...');
  
  const indexes = [
    {
      name: 'idx_payments_stripe_intent',
      sql: `CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);`
    },
    {
      name: 'idx_seller_earnings_seller',
      sql: `CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);`
    },
    {
      name: 'idx_seller_earnings_status',
      sql: `CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);`
    },
    {
      name: 'idx_seller_earnings_available_date',
      sql: `CREATE INDEX IF NOT EXISTS idx_seller_earnings_available_date ON seller_earnings(available_date);`
    },
    {
      name: 'idx_payouts_seller',
      sql: `CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts(seller_id);`
    },
    {
      name: 'idx_payouts_status',
      sql: `CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);`
    }
  ];
  
  for (const index of indexes) {
    console.log(`📝 Creating ${index.name}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: index.sql });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Error creating ${index.name}: ${error.message}`);
      } else {
        console.log(`✅ ${index.name} created successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception creating ${index.name}: ${err.message}`);
    }
  }
}

async function insertDefaultData() {
  console.log('\n📝 Inserting default data...');
  
  try {
    // Check if commission settings already exist
    const { data: existingSettings } = await supabase
      .from('commission_settings')
      .select('id')
      .limit(1);
    
    if (!existingSettings || existingSettings.length === 0) {
      console.log('📝 Inserting default commission settings...');
      
      const { error } = await supabase
        .from('commission_settings')
        .insert([{
          default_rate: 15.00,
          category_rates: {
            "electronics": 12.00,
            "fashion": 18.00,
            "books": 10.00
          },
          seller_custom_rates: {}
        }]);
      
      if (error) {
        console.error(`❌ Error inserting commission settings: ${error.message}`);
      } else {
        console.log(`✅ Default commission settings inserted`);
      }
    } else {
      console.log(`✅ Commission settings already exist`);
    }
    
  } catch (err) {
    console.error(`❌ Exception inserting default data: ${err.message}`);
  }
}

async function testNewTables() {
  console.log('\n🔍 Testing new payment system tables...');
  
  const tablesToTest = [
    'payments',
    'seller_earnings', 
    'sub_orders',
    'payouts',
    'commission_settings'
  ];
  
  for (const table of tablesToTest) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  // Test commission settings data
  try {
    const { data: commissionData, error: commissionError } = await supabase
      .from('commission_settings')
      .select('*');
    
    if (commissionError) {
      console.log('❌ Commission settings: No data found');
    } else if (commissionData && commissionData.length > 0) {
      console.log('✅ Commission settings: Default data inserted');
      console.log(`   Default rate: ${commissionData[0].default_rate}%`);
    }
  } catch (err) {
    console.log('❌ Commission settings test failed:', err.message);
  }
  
  console.log('\n🎉 Payment system migration completed!');
  console.log('\n🚀 Next steps:');
  console.log('1. Set up Stripe API keys in .env file');
  console.log('2. Test payment flow with test cards');
  console.log('3. Verify commission calculations');
  console.log('4. Test seller earnings and payouts');
}

// Run migration if called directly
if (require.main === module) {
  runPaymentMigration().catch(console.error);
}

module.exports = { runPaymentMigration };