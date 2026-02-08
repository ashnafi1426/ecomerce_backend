/**
 * Run database migrations for reviews module
 */

const supabase = require('./config/supabase');
const fs = require('fs');

async function runMigrations() {
  console.log('=== Running Reviews Module Migrations ===\n');

  try {
    // Read SQL files
    const createReviewsSQL = fs.readFileSync('./database/create-reviews-table.sql', 'utf8');
    const addRatingSQL = fs.readFileSync('./database/add-rating-to-products.sql', 'utf8');

    console.log('📝 Migration 1: Creating reviews table...');
    console.log('Note: Please run this SQL in your Supabase SQL Editor:\n');
    console.log(createReviewsSQL);
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('📝 Migration 2: Adding rating columns to products...');
    console.log('Note: Please run this SQL in your Supabase SQL Editor:\n');
    console.log(addRatingSQL);
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('✅ Migration SQL displayed above');
    console.log('⚠️  Please execute these SQL statements in your Supabase dashboard');
    console.log('   1. Go to your Supabase project');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste each SQL block');
    console.log('   4. Execute them in order');
    console.log('\nAfter running migrations, execute: node test-reviews.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigrations();
