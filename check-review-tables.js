const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReviewTables() {
  console.log('🔍 Checking Review Tables in Supabase...\n');
  console.log('='.repeat(60));

  try {
    // Check product_reviews table
    console.log('\n1️⃣  Checking product_reviews table...');
    const { data: reviews, error: reviewsError } = await supabase
      .from('product_reviews')
      .select('*')
      .limit(1);

    if (reviewsError) {
      if (reviewsError.code === '42P01') {
        console.log('❌ Table "product_reviews" does NOT exist!');
        console.log('   You need to run the Step 1 migration first.');
      } else {
        console.log('❌ Error:', reviewsError.message);
      }
    } else {
      console.log('✅ Table "product_reviews" exists!');
      
      // Get column info
      const { data: reviewCount } = await supabase
        .from('product_reviews')
        .select('*', { count: 'exact', head: true });
      
      console.log(`   Total reviews: ${reviewCount || 0}`);
    }

    // Check review_images table
    console.log('\n2️⃣  Checking review_images table...');
    const { data: images, error: imagesError } = await supabase
      .from('review_images')
      .select('*')
      .limit(1);

    if (imagesError) {
      if (imagesError.code === '42P01') {
        console.log('❌ Table "review_images" does NOT exist!');
      } else {
        console.log('❌ Error:', imagesError.message);
      }
    } else {
      console.log('✅ Table "review_images" exists!');
    }

    // Check review_votes table
    console.log('\n3️⃣  Checking review_votes table...');
    const { data: votes, error: votesError } = await supabase
      .from('review_votes')
      .select('*')
      .limit(1);

    if (votesError) {
      if (votesError.code === '42P01') {
        console.log('❌ Table "review_votes" does NOT exist!');
      } else {
        console.log('❌ Error:', votesError.message);
      }
    } else {
      console.log('✅ Table "review_votes" exists!');
    }

    // Check product_rating_summary view
    console.log('\n4️⃣  Checking product_rating_summary view...');
    const { data: summary, error: summaryError } = await supabase
      .from('product_rating_summary')
      .select('*')
      .limit(1);

    if (summaryError) {
      if (summaryError.code === '42P01') {
        console.log('❌ View "product_rating_summary" does NOT exist!');
        console.log('   You need to run the Step 2 migration.');
      } else {
        console.log('❌ Error:', summaryError.message);
      }
    } else {
      console.log('✅ View "product_rating_summary" exists!');
    }

    // Check product_questions table
    console.log('\n5️⃣  Checking product_questions table...');
    const { data: questions, error: questionsError } = await supabase
      .from('product_questions')
      .select('*')
      .limit(1);

    if (questionsError) {
      if (questionsError.code === '42P01') {
        console.log('❌ Table "product_questions" does NOT exist!');
      } else {
        console.log('❌ Error:', questionsError.message);
      }
    } else {
      console.log('✅ Table "product_questions" exists!');
    }

    // Check product_answers table
    console.log('\n6️⃣  Checking product_answers table...');
    const { data: answers, error: answersError } = await supabase
      .from('product_answers')
      .select('*')
      .limit(1);

    if (answersError) {
      if (answersError.code === '42P01') {
        console.log('❌ Table "product_answers" does NOT exist!');
      } else {
        console.log('❌ Error:', answersError.message);
      }
    } else {
      console.log('✅ Table "product_answers" exists!');
    }

    // Check product_badges table
    console.log('\n7️⃣  Checking product_badges table...');
    const { data: badges, error: badgesError } = await supabase
      .from('product_badges')
      .select('*')
      .limit(1);

    if (badgesError) {
      if (badgesError.code === '42P01') {
        console.log('❌ Table "product_badges" does NOT exist!');
      } else {
        console.log('❌ Error:', badgesError.message);
      }
    } else {
      console.log('✅ Table "product_badges" exists!');
    }

    // Check product_images table
    console.log('\n8️⃣  Checking product_images table...');
    const { data: prodImages, error: prodImagesError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);

    if (prodImagesError) {
      if (prodImagesError.code === '42P01') {
        console.log('❌ Table "product_images" does NOT exist!');
      } else {
        console.log('❌ Error:', prodImagesError.message);
      }
    } else {
      console.log('✅ Table "product_images" exists!');
    }

    // Check product_specifications table
    console.log('\n9️⃣  Checking product_specifications table...');
    const { data: specs, error: specsError } = await supabase
      .from('product_specifications')
      .select('*')
      .limit(1);

    if (specsError) {
      if (specsError.code === '42P01') {
        console.log('❌ Table "product_specifications" does NOT exist!');
      } else {
        console.log('❌ Error:', specsError.message);
      }
    } else {
      console.log('✅ Table "product_specifications" exists!');
    }

    // Check product_features table
    console.log('\n🔟 Checking product_features table...');
    const { data: features, error: featuresError } = await supabase
      .from('product_features')
      .select('*')
      .limit(1);

    if (featuresError) {
      if (featuresError.code === '42P01') {
        console.log('❌ Table "product_features" does NOT exist!');
      } else {
        console.log('❌ Error:', featuresError.message);
      }
    } else {
      console.log('✅ Table "product_features" exists!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('='.repeat(60));

    const allTablesExist = !reviewsError && !imagesError && !votesError && 
                          !questionsError && !answersError && !badgesError &&
                          !prodImagesError && !specsError && !featuresError;

    if (allTablesExist) {
      console.log('✅ All Amazon PDP tables exist!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Run: node add-sample-reviews.js');
      console.log('   2. Or manually add reviews using SQL scripts');
      console.log('   3. Visit product page to see ratings');
    } else {
      console.log('❌ Some tables are missing!');
      console.log('\n📝 Action Required:');
      console.log('   1. Open Supabase SQL Editor');
      console.log('   2. Run: amazon-pdp-step1-tables-columns.sql');
      console.log('   3. Then run: ONE-STEP-COMPLETE-FIX.sql');
      console.log('   4. Then run this check again');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
  }
}

// Run the check
checkReviewTables();
