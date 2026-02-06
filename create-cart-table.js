/**
 * Script to create cart_items table in Supabase
 */

const supabase = require('./config/supabase');

async function createCartTable() {
  console.log('Creating cart_items table...');

  try {
    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create cart_items table
        CREATE TABLE IF NOT EXISTS cart_items (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, product_id)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);
        CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at DESC);
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      // Try direct insert instead
      console.log('Trying direct table creation...');
      
      const { error: createError } = await supabase
        .from('cart_items')
        .select('*')
        .limit(1);
      
      if (createError && createError.code === '42P01') {
        console.log('Table does not exist. Please create it manually in Supabase dashboard.');
        console.log('SQL to run:');
        console.log(`
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
CREATE INDEX idx_cart_items_created_at ON cart_items(created_at DESC);
        `);
      } else {
        console.log('✅ Table already exists or was created successfully');
      }
    } else {
      console.log('✅ Table created successfully');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createCartTable();
