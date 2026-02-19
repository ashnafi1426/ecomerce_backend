const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReviewAPI() {
  console.log('🧪 Testing Review API and Data...\n');

  try {
    // 1. Get first product with reviews
    console.log('1️⃣ Finding product with reviews...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('approval_status', 'approved')
      .limit(5);

    if (productError) throw productError;

    let productWithReviews = null;
    let reviewSummary = null;

    for (const product of products) {
      const { data: reviews, error: reviewError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product.id);

      if (!reviewError && reviews && reviews.length > 0) {
        productWithReviews = product;
        console.log(`✅ Found product: ${product.title}`);
        console.log(`   Product ID: ${product.id}`);
        console.log(`   Total reviews: ${reviews.length}\n`);

        // 2. Test review summary
        console.log('2️⃣ Testing review summary...');
        const { data: summary, error: summaryError } = await supabase
          .from('product_rating_summary')
          .select('*')
          .eq('product_id', product.id)
          .single();

        if (summaryError) {
          console.log('⚠️  No summary view found, calculating manually...');
          
          // Calculate summary manually
          const ratings = reviews.map(r => r.rating);
          const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          
          const ratingCounts = {
            five_star: reviews.filter(r => r.rating === 5).length,
            four_star: reviews.filter(r => r.rating === 4).length,
            three_star: reviews.filter(r => r.rating === 3).length,
            two_star: reviews.filter(r => r.rating === 2).length,
            one_star: reviews.filter(r => r.rating === 1).length
          };

          reviewSummary = {
            product_id: product.id,
            average_rating: avgRating,
            total_reviews: reviews.length,
            ...ratingCounts,
            verified_purchases: reviews.filter(r => r.verified_purchase).length
          };
        } else {
          reviewSummary = summary;
        }

        console.log('✅ Review Summary:');
        console.log(`   Average Rating: ${reviewSummary.average_rating.toFixed(2)}`);
        console.log(`   Total Reviews: ${reviewSummary.total_reviews}`);
        console.log(`   5 star: ${reviewSummary.five_star} (${Math.round((reviewSummary.five_star / reviewSummary.total_reviews) * 100)}%)`);
        console.log(`   4 star: ${reviewSummary.four_star} (${Math.round((reviewSummary.four_star / reviewSummary.total_reviews) * 100)}%)`);
        console.log(`   3 star: ${reviewSummary.three_star} (${Math.round((reviewSummary.three_star / reviewSummary.total_reviews) * 100)}%)`);
        console.log(`   2 star: ${reviewSummary.two_star} (${Math.round((reviewSummary.two_star / reviewSummary.total_reviews) * 100)}%)`);
        console.log(`   1 star: ${reviewSummary.one_star} (${Math.round((reviewSummary.one_star / reviewSummary.total_reviews) * 100)}%)\n`);

        // 3. Test individual reviews
        console.log('3️⃣ Sample reviews:');
        reviews.slice(0, 3).forEach((review, idx) => {
          console.log(`\n   Review ${idx + 1}:`);
          console.log(`   Rating: ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}`);
          console.log(`   Title: ${review.title || 'No title'}`);
          console.log(`   Text: ${review.review_text.substring(0, 100)}...`);
          console.log(`   Verified: ${review.verified_purchase ? '✓' : '✗'}`);
          console.log(`   Date: ${new Date(review.created_at).toLocaleDateString()}`);
        });

        break;
      }
    }

    if (!productWithReviews) {
      console.log('❌ No products with reviews found!');
      console.log('💡 Run: node add-sample-reviews.js');
      return;
    }

    console.log('\n\n✅ ALL TESTS PASSED!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Start backend: npm start (in this directory)');
    console.log('2. Start frontend: cd ../Ecomerce_client/ecommerce_client && npm run dev');
    console.log(`3. Visit: http://localhost:5173/product/${productWithReviews.id}`);
    console.log('4. Scroll down to see the reviews section');
    console.log('\n🎯 Expected Result:');
    console.log('   - Rating summary box with average rating and star breakdown');
    console.log('   - Review cards with avatar, name, stars, date, and text');
    console.log('   - Design matches product.html exactly');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testReviewAPI();
